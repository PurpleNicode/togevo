-- ============================================================
-- TOGEVO — Étape 1 : colonnes profil + création auto à l'inscription
-- À exécuter dans l'éditeur SQL du projet Supabase (une fois).
-- Idempotent : relancer ce script ne casse rien.
-- ============================================================

alter table public.profiles add column if not exists pseudo text not null default '';
alter table public.profiles add column if not exists display_mode text not null default 'focus';
alter table public.profiles add column if not exists trophy_privacy text not null default 'public';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_display_mode_check'
  ) then
    alter table public.profiles
      add constraint profiles_display_mode_check
      check (display_mode in ('focus', 'gamified'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_trophy_privacy_check'
  ) then
    alter table public.profiles
      add constraint profiles_trophy_privacy_check
      check (trophy_privacy in ('public', 'private'));
  end if;
end $$;

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
