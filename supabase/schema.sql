-- ============================================================
-- TOGEVO — Schéma Supabase (PostgreSQL)
-- Région recommandée : Frankfurt (RGPD)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  is_player boolean not null default true,
  is_coach boolean not null default false,
  sport text not null default 'tennis_de_table',
  aftt_points int,
  pseudo text not null default '',
  display_mode text not null default 'focus' check (display_mode in ('focus', 'gamified')),
  trophy_privacy text not null default 'public' check (trophy_privacy in ('public', 'private')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Un profil est visible par son propriétaire"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Un utilisateur modifie son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Un utilisateur crée son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Profil créé automatiquement à l'inscription (y compris avant confirmation e-mail)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, first_name, last_name, email, phone, is_player, is_coach
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Prénom'),
    coalesce(new.raw_user_meta_data->>'last_name', 'Nom'),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce((new.raw_user_meta_data->>'is_player')::boolean, true),
    coalesce((new.raw_user_meta_data->>'is_coach')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- LIEN COACH <-> JOUEUR ----------
create type link_status as enum ('pending', 'active', 'left', 'removed');

create table public.coach_player_links (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  status link_status not null default 'active',
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (coach_id, player_id)
);

alter table public.coach_player_links enable row level security;

create policy "Lien visible par le coach ou le joueur concerné"
  on public.coach_player_links for select
  using (auth.uid() = coach_id or auth.uid() = player_id);

create policy "Le coach ou le joueur peut créer un lien"
  on public.coach_player_links for insert
  with check (auth.uid() = coach_id or auth.uid() = player_id);

create policy "Le coach ou le joueur peut mettre à jour le lien"
  on public.coach_player_links for update
  using (auth.uid() = coach_id or auth.uid() = player_id);

-- Un joueur/entraîneur doit pouvoir voir le profil de ses partenaires de lien
-- (ajoutée ici, une fois coach_player_links créée, pour éviter une dépendance
-- circulaire à la création du schéma)
create policy "Profil visible par les entraîneurs/joueurs liés"
  on public.profiles for select
  using (
    exists (
      select 1 from public.coach_player_links l
      where (l.coach_id = auth.uid() and l.player_id = profiles.id)
         or (l.player_id = auth.uid() and l.coach_id = profiles.id)
    )
  );

-- ---------- GROUPES (côté entraîneur) ----------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  whatsapp_link text,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "Un coach gère ses propres groupes"
  on public.groups for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, player_id)
);

alter table public.group_members enable row level security;

create policy "Le coach du groupe gère les membres"
  on public.group_members for all
  using (exists (select 1 from public.groups g where g.id = group_members.group_id and g.coach_id = auth.uid()))
  with check (exists (select 1 from public.groups g where g.id = group_members.group_id and g.coach_id = auth.uid()));

create policy "Un joueur voit sa propre appartenance"
  on public.group_members for select
  using (auth.uid() = player_id);

-- Ajoutée ici, une fois group_members créée, pour éviter une dépendance circulaire
create policy "Un membre du groupe peut voir le groupe"
  on public.groups for select
  using (
    exists (select 1 from public.group_members m where m.group_id = groups.id and m.player_id = auth.uid())
  );

-- ---------- OBJECTIFS ----------
create type goal_type as enum ('technique', 'match_result', 'aftt_points');
create type goal_category as enum ('technique', 'physique', 'mental', 'tactique');
create type goal_timeframe as enum ('court_terme', 'moyen_terme', 'long_terme', 'date_precise');
create type goal_state as enum ('a_faire', 'en_cours', 'atteint');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  coach_id uuid references public.profiles(id), -- entraîneur "propriétaire" si assigné par un coach
  group_id uuid references public.groups(id) on delete set null,
  title text not null,
  description text,
  type goal_type not null default 'technique',
  category goal_category not null default 'technique',
  timeframe goal_timeframe not null default 'court_terme',
  due_date date,
  state goal_state not null default 'a_faire',
  validated_by uuid references public.profiles(id),
  validated_at timestamptz,
  validation_comment text,
  archived boolean not null default false,
  archived_at timestamptz,
  last_edit_comment text, -- commentaire obligatoire si modif/suppression par un coach
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Le joueur voit ses objectifs"
  on public.goals for select
  using (auth.uid() = player_id);

create policy "Les entraîneurs liés voient les objectifs du joueur"
  on public.goals for select
  using (
    exists (
      select 1 from public.coach_player_links l
      where l.player_id = goals.player_id and l.coach_id = auth.uid() and l.status = 'active'
    )
  );

create policy "Le joueur crée/modifie ses propres objectifs"
  on public.goals for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

create policy "Un entraîneur lié peut créer/modifier un objectif du joueur"
  on public.goals for all
  using (
    exists (
      select 1 from public.coach_player_links l
      where l.player_id = goals.player_id and l.coach_id = auth.uid() and l.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.coach_player_links l
      where l.player_id = goals.player_id and l.coach_id = auth.uid() and l.status = 'active'
    )
  );

-- ---------- NOTIFICATIONS ----------
create type notification_type as enum (
  'goal_reached', 'goal_edited', 'goal_deleted', 'goal_assigned',
  'player_left_coach', 'coach_removed_player', 'link_requested', 'link_accepted'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  type notification_type not null,
  goal_id uuid references public.goals(id) on delete set null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Un utilisateur voit ses propres notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "Un utilisateur marque ses notifications comme lues"
  on public.notifications for update
  using (auth.uid() = recipient_id);

-- Les insertions de notifications se font via une fonction "security definer"
-- pour permettre à un acteur de notifier un autre utilisateur.
create or replace function public.notify(
  p_recipient uuid, p_actor uuid, p_type notification_type,
  p_goal uuid, p_message text
) returns void
language plpgsql security definer as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, goal_id, message)
  values (p_recipient, p_actor, p_type, p_goal, p_message);
end;
$$;

-- ---------- INDEX ----------
create index on public.goals (player_id);
create index on public.goals (coach_id);
create index on public.goals (archived);
create index on public.coach_player_links (player_id);
create index on public.coach_player_links (coach_id);
create index on public.notifications (recipient_id, read);
