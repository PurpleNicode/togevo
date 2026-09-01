// ============================================================
// TOGEVO — Couche de données
// En DEMO_MODE : tout est stocké dans localStorage (aucun réseau).
// Les noms de fonctions et la forme des objets retournés sont ceux
// qu'on retrouvera dans l'implémentation Supabase (voir supabase/schema.sql) :
// il suffira de remplacer le corps de chaque fonction par un appel
// `togevoSupabase.from(...)` équivalent pour passer en production.
// ============================================================

const DB_KEY = "togevo_demo_db_v1";
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2));
const nowISO = () => new Date().toISOString();

function seedDB() {
  const meId = "u-camille";
  const coachBenId = "u-ben";
  const players = ["u-lucas", "u-nora", "u-sacha"];

  // Champs gamification : pseudo (convivialité entre joueurs, le nom réel reste
  // visible par l'entraîneur pour la gestion administrative), display_mode
  // ('focus' = sobre pour adultes, 'gamified' = crédits + boutique pour les jeunes),
  // trophy_privacy ('public' | 'private'), togecoins (monnaie virtuelle "Crédits Togevo"),
  // owned_cosmetics (ids achetés en boutique), active_theme / active_frame (équipés).
  const profiles = {
    [meId]: { id: meId, first_name: "Camille", last_name: "Dupont", pseudo: "Cam'", email: "camille@togevo.demo", phone: "32470112233", is_player: true, is_coach: true, aftt_points: 1250, display_mode: "focus", trophy_privacy: "public", togecoins: 40, owned_cosmetics: [], active_theme: null, active_frame: null },
    [coachBenId]: { id: coachBenId, first_name: "Ben", last_name: "Coach", pseudo: "Coach Ben", email: "ben@togevo.demo", phone: "32470998877", is_player: false, is_coach: true, aftt_points: null, display_mode: "focus", trophy_privacy: "public", togecoins: 0, owned_cosmetics: [], active_theme: null, active_frame: null },
    "u-lucas": { id: "u-lucas", first_name: "Lucas", last_name: "Martin", pseudo: "Luky", email: "lucas@togevo.demo", phone: "32471000001", is_player: true, is_coach: false, aftt_points: 1050, display_mode: "gamified", trophy_privacy: "public", togecoins: 90, owned_cosmetics: ["frame_bronze"], active_theme: null, active_frame: "frame_bronze" },
    "u-nora": { id: "u-nora", first_name: "Nora", last_name: "Haddad", pseudo: "N.Smash", email: "nora@togevo.demo", phone: "32471000002", is_player: true, is_coach: false, aftt_points: 1400, display_mode: "gamified", trophy_privacy: "private", togecoins: 150, owned_cosmetics: ["theme_ocean", "frame_gold"], active_theme: "theme_ocean", active_frame: "frame_gold" },
    "u-sacha": { id: "u-sacha", first_name: "Sacha", last_name: "Bernard", pseudo: "Sachou", email: "sacha@togevo.demo", phone: "", is_player: true, is_coach: false, aftt_points: 980, display_mode: "gamified", trophy_privacy: "public", togecoins: 20, owned_cosmetics: [], active_theme: null, active_frame: null }
  };

  const links = [
    { id: uid(), coach_id: meId, player_id: "u-lucas", status: "active" },
    { id: uid(), coach_id: meId, player_id: "u-nora", status: "active" },
    { id: uid(), coach_id: meId, player_id: "u-sacha", status: "active" },
    { id: uid(), coach_id: coachBenId, player_id: meId, status: "active" }
  ];

  const groups = [
    { id: "g-jeunes", coach_id: meId, name: "Jeunes U15", whatsapp_link: "" },
    { id: "g-equipe1", coach_id: meId, name: "Équipe 1ère", whatsapp_link: "https://chat.whatsapp.com/exemple" }
  ];
  const groupMembers = [
    { group_id: "g-jeunes", player_id: "u-lucas" },
    { group_id: "g-jeunes", player_id: "u-nora" },
    { group_id: "g-equipe1", player_id: "u-sacha" }
  ];

  const goal = (o) => ({
    id: uid(), created_by: meId, coach_id: null, group_id: null, description: "",
    due_date: null, state: "a_faire", validated_by: null, validated_at: null,
    validation_comment: null, archived: false, archived_at: null, last_edit_comment: null,
    created_at: nowISO(), updated_at: nowISO(), ...o
  });

  const goals = [
    goal({ player_id: meId, title: "30 topspins sans faute", type: "technique", category: "technique", timeframe: "court_terme", state: "en_cours" }),
    goal({ player_id: meId, title: "Battre un·e joueur·se à 1600 pts", type: "match_result", category: "tactique", timeframe: "moyen_terme", state: "a_faire", coach_id: coachBenId, created_by: coachBenId }),
    goal({ player_id: meId, title: "Atteindre 1300 points AFTT", type: "aftt_points", category: "technique", timeframe: "long_terme", state: "en_cours" }),
    goal({ player_id: meId, title: "10 services gagnants d'affilée", type: "technique", category: "technique", timeframe: "court_terme", state: "atteint", archived: true, validated_by: meId, validated_at: nowISO(), archived_at: nowISO() }),

    goal({ player_id: "u-lucas", title: "Gainage 3x par semaine", type: "technique", category: "physique", timeframe: "court_terme", state: "en_cours", coach_id: meId, created_by: meId, group_id: "g-jeunes" }),
    goal({ player_id: "u-lucas", title: "Ne plus rater son revers bloqué", type: "technique", category: "technique", timeframe: "moyen_terme", state: "a_faire", coach_id: meId, created_by: meId }),

    goal({ player_id: "u-nora", title: "Rester concentrée après une erreur", type: "technique", category: "mental", timeframe: "court_terme", state: "atteint", coach_id: meId, created_by: meId, archived: true, validated_by: "u-nora", validated_at: nowISO(), archived_at: nowISO() }),
    goal({ player_id: "u-nora", title: "Atteindre 1450 points AFTT", type: "aftt_points", category: "technique", timeframe: "long_terme", state: "en_cours", coach_id: meId, created_by: meId }),

    goal({ player_id: "u-sacha", title: "Améliorer le service latéral", type: "technique", category: "technique", timeframe: "court_terme", state: "a_faire", coach_id: meId, created_by: meId, group_id: "g-equipe1" })
  ];

  const notifications = [
    { id: uid(), recipient_id: meId, actor_id: "u-nora", type: "goal_reached", goal_id: goals[6].id, message: "Nora Haddad a validé l'objectif « Rester concentrée après une erreur ».", read: false, created_at: nowISO() },
    { id: uid(), recipient_id: meId, actor_id: coachBenId, type: "goal_assigned", goal_id: goals[1].id, message: "Ben Coach t'a assigné un nouvel objectif : « Battre un·e joueur·se à 1600 pts ».", read: false, created_at: nowISO() },
    { id: uid(), recipient_id: meId, actor_id: "u-lucas", type: "link_accepted", goal_id: null, message: "Lucas Martin a rejoint ton groupe « Jeunes U15 ».", read: true, created_at: nowISO() }
  ];

  const afttHistory = {
    [meId]: [1120, 1150, 1180, 1190, 1210, 1230, 1250],
    "u-lucas": [980, 990, 1000, 1010, 1030, 1040, 1050],
    "u-nora": [1300, 1320, 1340, 1350, 1370, 1390, 1400],
    "u-sacha": [900, 920, 930, 950, 960, 970, 980]
  };

  // Amitiés : auto-rapprochées par groupe d'entraînement (Lucas & Nora sont dans "Jeunes U15")
  const friendships = [
    { id: uid(), a: "u-lucas", b: "u-nora", via: "group", created_at: nowISO() }
  ];

  // Demande d'ami en attente (démo) : Sacha a demandé Camille en ami·e, pas encore répondu
  const friendRequests = [
    { id: uid(), from: "u-sacha", to: meId, status: "pending", created_at: nowISO() }
  ];

  // Défis blagues déjà envoyés (démo)
  const challenges = [
    { id: uid(), from: "u-nora", to: "u-lucas", message: "Défi : perdre un point exprès avec un lob raté... si tu l'oses 😏", cost: 5, created_at: nowISO() }
  ];

  const achievementsUnlocked = [
    { id: uid(), player_id: meId, achievement_id: "premier_objectif", unlocked_at: nowISO() },
    { id: uid(), player_id: "u-nora", achievement_id: "premier_objectif", unlocked_at: nowISO() },
    { id: uid(), player_id: "u-nora", achievement_id: "esprit_equipe", unlocked_at: nowISO() },
    { id: uid(), player_id: "u-lucas", achievement_id: "esprit_equipe", unlocked_at: nowISO() }
  ];

  return { currentUserId: meId, profiles, links, groups, groupMembers, goals, notifications, afttHistory, friendships, friendRequests, challenges, achievementsUnlocked };
}

// ---------- Catalogue trophées (règles évaluées côté client, indépendantes du backend) ----------
const ACHIEVEMENTS_CATALOG = [
  { id: "premier_objectif", title: "Premier pas", desc: "Atteindre son tout premier objectif", icon: "🥇", check: (ctx) => ctx.reachedCount >= 1 },
  { id: "regularite_bronze", title: "Régulier·ère", desc: "Atteindre 3 objectifs", icon: "🥉", check: (ctx) => ctx.reachedCount >= 3 },
  { id: "regularite_argent", title: "Assidu·e", desc: "Atteindre 10 objectifs", icon: "🥈", check: (ctx) => ctx.reachedCount >= 10 },
  { id: "regularite_or", title: "Machine à objectifs", desc: "Atteindre 25 objectifs", icon: "🏆", check: (ctx) => ctx.reachedCount >= 25 },
  { id: "technique_master", title: "Technicien·ne", desc: "Atteindre 5 objectifs techniques", icon: "🎯", check: (ctx) => ctx.reachedByCategory.technique >= 5 },
  { id: "mental_fort", title: "Mental d'acier", desc: "Atteindre 3 objectifs mentaux", icon: "🧠", check: (ctx) => ctx.reachedByCategory.mental >= 3 },
  { id: "esprit_equipe", title: "Esprit d'équipe", desc: "Faire partie d'un groupe d'entraînement", icon: "🤝", check: (ctx) => ctx.groupCount >= 1 },
  { id: "progression_aftt", title: "En pleine ascension", desc: "Progresser de +100 points AFTT sur la saison", icon: "📈", check: (ctx) => ctx.afttProgress >= 100 }
];



const Store = (function () {
  let db = null;

  function load() {
    const raw = localStorage.getItem(DB_KEY);
    db = raw ? JSON.parse(raw) : seedDB();
    persist();
  }
  function persist() { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  function resetDemo() { db = seedDB(); persist(); }

  // ---------- Auth ----------
  // Connexion/inscription réelles via Supabase Auth.
  // Étape 1 : le profil identitaire (nom, rôles, pseudo, mode, AFTT) est
  // lu/écrit dans public.profiles. Le reste (groupes, objectifs, Togecoins…)
  // reste en localStorage, indexé sur le vrai UUID Auth.

  function isSupabaseReady() { return !!window.togevoSupabase; }

  function defaultLocalProfile(supabaseUser, extra) {
    extra = extra || {};
    const meta = supabaseUser.user_metadata || {};
    return {
      id: supabaseUser.id,
      first_name: meta.first_name || extra.first_name || "Prénom",
      last_name: meta.last_name || extra.last_name || "Nom",
      pseudo: meta.pseudo || extra.pseudo || "",
      email: supabaseUser.email || extra.email || "",
      phone: meta.phone || extra.phone || "",
      is_player: meta.is_player ?? extra.is_player ?? true,
      is_coach: meta.is_coach ?? extra.is_coach ?? false,
      aftt_points: extra.aftt_points ?? null,
      display_mode: extra.display_mode || "focus",
      trophy_privacy: extra.trophy_privacy || "public",
      togecoins: extra.togecoins || 0,
      owned_cosmetics: extra.owned_cosmetics || [],
      active_theme: extra.active_theme || null,
      active_frame: extra.active_frame || null
    };
  }

  function ensureLocalProfile(supabaseUser, extra) {
    const id = supabaseUser.id;
    if (!db.profiles[id]) {
      db.profiles[id] = defaultLocalProfile(supabaseUser, extra);
    }
    db.currentUserId = id;
    persist();
    return db.profiles[id];
  }

  function profileToRow(p) {
    return {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email || "",
      phone: p.phone || null,
      is_player: !!p.is_player,
      is_coach: !!p.is_coach,
      aftt_points: p.aftt_points == null || p.aftt_points === "" ? null : Number(p.aftt_points),
      pseudo: p.pseudo || "",
      display_mode: p.display_mode === "gamified" ? "gamified" : "focus",
      trophy_privacy: p.trophy_privacy === "private" ? "private" : "public"
    };
  }

  function applyRemoteProfile(id, row) {
    const local = db.profiles[id] || {};
    db.profiles[id] = {
      ...local,
      id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email || "",
      phone: row.phone || "",
      is_player: !!row.is_player,
      is_coach: !!row.is_coach,
      aftt_points: row.aftt_points == null ? null : row.aftt_points,
      pseudo: row.pseudo || "",
      display_mode: row.display_mode === "gamified" ? "gamified" : "focus",
      trophy_privacy: row.trophy_privacy === "private" ? "private" : "public",
      togecoins: local.togecoins || 0,
      owned_cosmetics: local.owned_cosmetics || [],
      active_theme: local.active_theme || null,
      active_frame: local.active_frame || null
    };
  }

  async function hydrateProfileFromSupabase(supabaseUser, extra) {
    const local = ensureLocalProfile(supabaseUser, extra);
    if (!isSupabaseReady()) return local;
    const sb = window.togevoSupabase;
    const { data, error } = await sb.from("profiles").select("*").eq("id", supabaseUser.id).maybeSingle();
    if (error) {
      console.error("Togevo : lecture du profil Supabase", error);
      return local;
    }
    if (data) {
      applyRemoteProfile(supabaseUser.id, data);
      persist();
      return db.profiles[supabaseUser.id];
    }
    const { error: insErr } = await sb.from("profiles").insert(profileToRow(local));
    if (insErr) console.error("Togevo : création du profil Supabase", insErr);
    return db.profiles[supabaseUser.id];
  }

  async function supabaseSignUp({ first_name, last_name, email, phone, roles, password }) {
    if (!isSupabaseReady()) return { ok: false, error: "Connexion au serveur indisponible pour le moment. Réessaie dans un instant." };
    const is_player = roles === "player" || roles === "both";
    const is_coach = roles === "coach" || roles === "both";
    const { data, error } = await window.togevoSupabase.auth.signUp({
      email, password,
      options: { 
        emailRedirectTo: 'https://purplenicode.github.io/togevo/success.html',
        data: { first_name, last_name, phone: phone || "", is_player, is_coach } }
    });
    if (error) return { ok: false, error: error.message };
    if (data.session && data.user) {
      await hydrateProfileFromSupabase(data.user, { first_name, last_name, phone, is_player, is_coach, email });
      return { ok: true, confirmed: true };
    }
    // Pas de session retournée : la confirmation par e-mail est activée sur le projet
    return { ok: true, confirmed: false };
  }

  async function supabaseSignIn({ email, password }) {
    if (!isSupabaseReady()) return { ok: false, error: "Connexion au serveur indisponible pour le moment. Réessaie dans un instant." };
    const { data, error } = await window.togevoSupabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    await hydrateProfileFromSupabase(data.user);
    return { ok: true };
  }

  async function supabaseSignOut() {
    if (isSupabaseReady()) await window.togevoSupabase.auth.signOut();
  }

  // Écoute les changements de session (connexion, déconnexion, restauration
  // au rechargement de page, retour depuis le lien de confirmation e-mail).
  function watchSupabaseAuth(onChange) {
    if (!isSupabaseReady()) return;
    window.togevoSupabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        hydrateProfileFromSupabase(session.user).then((profile) => onChange(profile));
      } else if (event === "SIGNED_OUT") onChange(null);
    });
  }

  function getMe() { return db.profiles[db.currentUserId]; }

  async function saveProfile(patch) {
    const id = db.currentUserId;
    const next = { ...db.profiles[id], ...patch };
    if (isSupabaseReady()) {
      const { error } = await window.togevoSupabase.from("profiles").upsert(profileToRow(next), { onConflict: "id" });
      if (error) {
        console.error("Togevo : enregistrement du profil", error);
        return { ok: false, error: error.message };
      }
    }
    Object.assign(db.profiles[id], patch);
    persist();
    return { ok: true, profile: getMe() };
  }

  // ---------- Profils ----------
  function getProfile(id) { return db.profiles[id]; }

  // ---------- Liens coach/joueur ----------
  function getMyCoaches(playerId) {
    return db.links.filter(l => l.player_id === playerId && l.status === "active")
      .map(l => ({ link: l, coach: db.profiles[l.coach_id] }));
  }
  function getMyPlayers(coachId) {
    return db.links.filter(l => l.coach_id === coachId && l.status === "active")
      .map(l => db.profiles[l.player_id]);
  }
  function leaveCoach(playerId, coachId, comment) {
    const l = db.links.find(x => x.player_id === playerId && x.coach_id === coachId);
    if (l) { l.status = "left"; l.ended_at = nowISO(); }
    db.goals.filter(g => g.player_id === playerId && g.coach_id === coachId).forEach(g => { g.archived = true; g.archived_at = nowISO(); });
    addNotification({ recipient_id: coachId, actor_id: playerId, type: "player_left_coach", message: `${fullName(playerId)} a quitté ton suivi. Ses objectifs ont été archivés.` });
    persist();
  }
  function removePlayer(coachId, playerId, comment) {
    const l = db.links.find(x => x.player_id === playerId && x.coach_id === coachId);
    if (l) { l.status = "removed"; l.ended_at = nowISO(); }
    db.goals.filter(g => g.player_id === playerId && g.coach_id === coachId).forEach(g => { g.archived = true; g.archived_at = nowISO(); });
    addNotification({ recipient_id: playerId, actor_id: coachId, type: "coach_removed_player", message: `${fullName(coachId)} t'a retiré de son suivi. Tes objectifs avec lui ont été archivés.` });
    persist();
  }
  function stopTrainingEntirely(playerId) {
    getMyCoaches(playerId).forEach(({ coach }) => leaveCoach(playerId, coach.id));
  }
  function fullName(id) { const p = db.profiles[id]; return p ? `${p.first_name} ${p.last_name}` : "Quelqu'un"; }

  // ---------- Groupes ----------
  function getGroups(coachId) { return db.groups.filter(g => g.coach_id === coachId); }
  function addGroup(coachId, name) { const g = { id: uid(), coach_id: coachId, name, whatsapp_link: "" }; db.groups.push(g); persist(); return g; }
  function renameGroup(id, name) { const g = db.groups.find(x => x.id === id); g.name = name; persist(); }
  function deleteGroup(id) { db.groups = db.groups.filter(g => g.id !== id); db.groupMembers = db.groupMembers.filter(m => m.group_id !== id); persist(); }
  function setGroupWhatsapp(id, link) { db.groups.find(g => g.id === id).whatsapp_link = link; persist(); }
  function getGroupMembers(groupId) { return db.groupMembers.filter(m => m.group_id === groupId).map(m => db.profiles[m.player_id]); }
  function addPlayerToGroup(groupId, playerId) {
    if (!db.groupMembers.some(m => m.group_id === groupId && m.player_id === playerId)) {
      db.groupMembers.push({ group_id: groupId, player_id: playerId });
      persist();
      autoFriendGroupMembers(groupId); // rapprochement automatique par groupe d'entraînement
      checkAchievements(playerId); // "Esprit d'équipe"
    }
  }
  function removePlayerFromGroup(groupId, playerId) { db.groupMembers = db.groupMembers.filter(m => !(m.group_id === groupId && m.player_id === playerId)); persist(); }
  function getPlayerGroups(playerId) { return db.groupMembers.filter(m => m.player_id === playerId).map(m => db.groups.find(g => g.id === m.group_id)); }

  function inviteNewPlayer(coachId, { first_name, last_name, email, phone }) {
    const id = uid();
    db.profiles[id] = { id, first_name, last_name, email, phone: phone || "", is_player: true, is_coach: false, aftt_points: null };
    db.links.push({ id: uid(), coach_id: coachId, player_id: id, status: "active" });
    persist();
    return db.profiles[id];
  }
  function addExistingPlayer(coachId, playerId) {
    if (!db.links.some(l => l.coach_id === coachId && l.player_id === playerId)) {
      db.links.push({ id: uid(), coach_id: coachId, player_id: playerId, status: "active" });
      persist();
    }
  }

  // ---------- Objectifs ----------
  function getGoalsForPlayer(playerId) {
    const all = db.goals.filter(g => g.player_id === playerId);
    return { active: all.filter(g => !g.archived), archived: all.filter(g => g.archived) };
  }
  function addGoal(o) {
    const g = { id: uid(), created_by: o.created_by, coach_id: o.coach_id || null, group_id: o.group_id || null,
      player_id: o.player_id, title: o.title, description: o.description || "", type: o.type, category: o.category,
      timeframe: o.timeframe, due_date: o.due_date || null, state: "a_faire", validated_by: null, validated_at: null,
      validation_comment: null, archived: false, archived_at: null, last_edit_comment: null,
      created_at: nowISO(), updated_at: nowISO() };
    db.goals.push(g);
    if (o.coach_id && o.coach_id !== o.player_id) {
      addNotification({ recipient_id: o.player_id, actor_id: o.coach_id, type: "goal_assigned", goal_id: g.id, message: `${fullName(o.coach_id)} t'a assigné un nouvel objectif : « ${g.title} ».` });
    }
    persist();
    return g;
  }
  function assignGoalToGroup(coachId, groupId, base) {
    const members = getGroupMembers(groupId);
    return members.map(m => addGoal({ ...base, player_id: m.id, coach_id: coachId, created_by: coachId, group_id: groupId }));
  }
  function updateGoal(id, patch, editorId, comment) {
    const g = db.goals.find(x => x.id === id);
    Object.assign(g, patch, { updated_at: nowISO() });
    if (editorId && editorId !== g.player_id) {
      g.last_edit_comment = comment || g.last_edit_comment;
      addNotification({ recipient_id: g.player_id, actor_id: editorId, type: "goal_edited", goal_id: g.id, message: `${fullName(editorId)} a modifié l'objectif « ${g.title} »${comment ? ` : "${comment}"` : ""}.` });
    }
    persist();
    return g;
  }
  function setGoalState(id, state, actorId, comment) {
    const g = db.goals.find(x => x.id === id);
    g.state = state;
    g.updated_at = nowISO();
    if (state === "atteint") {
      g.validated_by = actorId; g.validated_at = nowISO(); g.validation_comment = comment || null;
      g.archived = true; g.archived_at = nowISO();
      const notifyId = actorId === g.player_id ? g.coach_id : g.player_id;
      if (notifyId) addNotification({ recipient_id: notifyId, actor_id: actorId, type: "goal_reached", goal_id: g.id, message: `${fullName(actorId)} a validé l'objectif « ${g.title} »${comment ? ` : "${comment}"` : ""}.` });
      checkAchievements(g.player_id);
      const p = db.profiles[g.player_id];
      if (p && p.display_mode === "gamified") p.togecoins = (p.togecoins || 0) + 10; // crédits gagnés à chaque objectif atteint
    }
    persist();
    return g;
  }
  function deleteGoal(id, editorId, comment) {
    const g = db.goals.find(x => x.id === id);
    if (editorId && editorId !== g.player_id) {
      addNotification({ recipient_id: g.player_id, actor_id: editorId, type: "goal_deleted", goal_id: null, message: `${fullName(editorId)} a supprimé l'objectif « ${g.title} »${comment ? ` : "${comment}"` : ""}.` });
    }
    db.goals = db.goals.filter(x => x.id !== id);
    persist();
  }
  function deleteArchivedGoal(id) { db.goals = db.goals.filter(x => x.id !== id); persist(); }

  // ---------- Notifications ----------
  function getNotifications(userId) { return db.notifications.filter(n => n.recipient_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at)); }
  function addNotification(o) { db.notifications.push({ id: uid(), read: false, created_at: nowISO(), ...o }); }
  function markNotifRead(id) { const n = db.notifications.find(x => x.id === id); if (n) { n.read = true; persist(); } }
  function markAllNotifsRead(userId) { db.notifications.filter(n => n.recipient_id === userId).forEach(n => n.read = true); persist(); }

  // ---------- Progression ----------
  function getAfttHistory(userId) { return db.afttHistory[userId] || []; }

  // ---------- Identité : nom réel (coach) vs pseudo (entre joueurs) ----------
  function displayName(id, { asCoachViewer = false } = {}) {
    const p = db.profiles[id];
    if (!p) return "Quelqu'un";
    if (asCoachViewer) return `${p.first_name} ${p.last_name}`;
    return p.pseudo || `${p.first_name} ${p.last_name}`;
  }

  // ---------- Trophées ----------
  function getAchievementContext(playerId) {
    const { active, archived } = getGoalsForPlayer(playerId);
    const reached = archived.filter(g => g.state === "atteint");
    const reachedByCategory = {};
    reached.forEach(g => { reachedByCategory[g.category] = (reachedByCategory[g.category] || 0) + 1; });
    const history = getAfttHistory(playerId);
    const afttProgress = history.length ? history[history.length - 1] - history[0] : 0;
    return { reachedCount: reached.length, reachedByCategory, groupCount: getPlayerGroups(playerId).length, afttProgress };
  }
  function checkAchievements(playerId) {
    const ctx = getAchievementContext(playerId);
    const already = new Set(db.achievementsUnlocked.filter(a => a.player_id === playerId).map(a => a.achievement_id));
    const newlyUnlocked = [];
    ACHIEVEMENTS_CATALOG.forEach(def => {
      if (!already.has(def.id) && def.check(ctx)) {
        const entry = { id: uid(), player_id: playerId, achievement_id: def.id, unlocked_at: nowISO() };
        db.achievementsUnlocked.push(entry);
        newlyUnlocked.push(def);
        addNotification({ recipient_id: playerId, actor_id: playerId, type: "trophy_unlocked", goal_id: null, message: `Nouveau trophée débloqué : « ${def.title} » ${def.icon}` });
        const p = db.profiles[playerId];
        if (p && p.display_mode === "gamified") p.togecoins = (p.togecoins || 0) + 15;
      }
    });
    if (newlyUnlocked.length) persist();
    return newlyUnlocked;
  }
  function getTrophyCase(playerId) {
    const unlockedIds = new Set(db.achievementsUnlocked.filter(a => a.player_id === playerId).map(a => a.achievement_id));
    const unlockedMap = {};
    db.achievementsUnlocked.filter(a => a.player_id === playerId).forEach(a => { unlockedMap[a.achievement_id] = a.unlocked_at; });
    return ACHIEVEMENTS_CATALOG.map(def => ({ ...def, unlocked: unlockedIds.has(def.id), unlocked_at: unlockedMap[def.id] || null }));
  }
  function canViewTrophyCase(playerId, viewerId) {
    const p = db.profiles[playerId];
    if (!p) return false;
    if (viewerId === playerId) return true;
    if (p.trophy_privacy !== "private") return true;
    // en privé : visible uniquement par le joueur et son/ses entraîneur·s
    return db.links.some(l => l.player_id === playerId && l.coach_id === viewerId && l.status === "active");
  }

  // ---------- Économie virtuelle : Crédits Togevo ----------
  const SHOP_CATALOG = [
    { id: "theme_sunset", type: "theme", name: "Thème Coucher de soleil", cost: 50, preview: "linear-gradient(135deg,#FF8A5B,#C9432E)" },
    { id: "theme_ocean", type: "theme", name: "Thème Océan", cost: 50, preview: "linear-gradient(135deg,#2E5776,#0B1A2C)" },
    { id: "theme_violet", type: "theme", name: "Thème Violet Néon", cost: 60, preview: "linear-gradient(135deg,#8B5CF6,#2D1B4E)" },
    { id: "frame_bronze", type: "frame", name: "Cadre Bronze", cost: 30, preview: "#A85F1F" },
    { id: "frame_gold", type: "frame", name: "Cadre Doré", cost: 80, preview: "#D99A46" },
    { id: "frame_neon", type: "frame", name: "Cadre Néon", cost: 60, preview: "#39FF9C" }
  ];
  function getShopCatalog() { return SHOP_CATALOG; }
  function buyCosmetic(playerId, cosmeticId) {
    const p = db.profiles[playerId];
    const item = SHOP_CATALOG.find(i => i.id === cosmeticId);
    if (!item) return { ok: false, error: "Objet introuvable" };
    if ((p.owned_cosmetics || []).includes(cosmeticId)) return { ok: false, error: "Déjà possédé" };
    if ((p.togecoins || 0) < item.cost) return { ok: false, error: "Crédits insuffisants" };
    p.togecoins -= item.cost;
    p.owned_cosmetics = [...(p.owned_cosmetics || []), cosmeticId];
    persist();
    return { ok: true };
  }
  function setActiveCosmetic(playerId, type, cosmeticId) {
    const p = db.profiles[playerId];
    if (type === "theme") p.active_theme = cosmeticId;
    if (type === "frame") p.active_frame = cosmeticId;
    persist();
  }
  // Réinitialisation / conversion saisonnière : évite l'inflation des crédits.
  // Démo : les crédits restants sont convertis à 50% (arrondi au sol), le reliquat
  // "perdu" est symboliquement transformé en trophée si le joueur avait un solde.
  function resetSeasonCredits() {
    Object.values(db.profiles).forEach(p => {
      if (p.display_mode === "gamified" && (p.togecoins || 0) > 0) {
        p.togecoins = Math.floor(p.togecoins * 0.5);
      }
    });
    persist();
  }

  // ---------- Amis ----------
  // Le rapprochement automatique par groupe reste immédiat (ce n'est pas une
  // démarche personnelle) ; l'ajout manuel (recherche / QR) passe en revanche
  // par une demande que l'autre joueur doit accepter.
  function getFriends(playerId) {
    return db.friendships.filter(f => f.a === playerId || f.b === playerId)
      .map(f => db.profiles[f.a === playerId ? f.b : f.a]);
  }
  function areFriends(a, b) { return db.friendships.some(f => (f.a === a && f.b === b) || (f.a === b && f.b === a)); }
  function addFriendship(a, b, via) {
    if (a === b || areFriends(a, b)) return;
    db.friendships.push({ id: uid(), a, b, via, created_at: nowISO() });
  }
  // Rapprochement automatique : tous les membres d'un même groupe deviennent amis
  function autoFriendGroupMembers(groupId) {
    const members = getGroupMembers(groupId);
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) addFriendship(members[i].id, members[j].id, "group");
    }
    persist();
  }
  // Ajout manuel : recherche par pseudo/nom, ou "code ami" simulant un scan QR
  function searchPlayers(query, excludeId) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.values(db.profiles).filter(p =>
      p.id !== excludeId && p.is_player &&
      (`${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || (p.pseudo || "").toLowerCase().includes(q) || p.id.toLowerCase() === q)
    );
  }
  function getFriendRequestStatus(fromId, toId) {
    const r = db.friendRequests.find(r => (r.from === fromId && r.to === toId) || (r.from === toId && r.to === fromId));
    return r ? r.status : null; // null | "pending" | "accepted" | "declined"
  }
  function sendFriendRequest(fromId, toId) {
    if (fromId === toId || areFriends(fromId, toId)) return { ok: false, error: "Déjà ami·e" };
    const existing = db.friendRequests.find(r => r.from === fromId && r.to === toId && r.status === "pending");
    if (existing) return { ok: false, error: "Demande déjà envoyée" };
    const req = { id: uid(), from: fromId, to: toId, status: "pending", created_at: nowISO() };
    db.friendRequests.push(req);
    addNotification({ recipient_id: toId, actor_id: fromId, type: "friend_request", goal_id: null, message: `${displayName(fromId)} souhaite devenir ton ami·e sur Togevo.` });
    persist();
    return { ok: true, request: req };
  }
  function getPendingFriendRequests(playerId) {
    return db.friendRequests.filter(r => r.to === playerId && r.status === "pending").sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  function respondFriendRequest(requestId, accept) {
    const r = db.friendRequests.find(x => x.id === requestId);
    if (!r) return;
    r.status = accept ? "accepted" : "declined";
    r.responded_at = nowISO();
    if (accept) {
      addFriendship(r.from, r.to, "manual");
      addNotification({ recipient_id: r.from, actor_id: r.to, type: "friend_accepted", goal_id: null, message: `${displayName(r.to)} a accepté ta demande d'ami·e !` });
    }
    persist();
  }

  // ---------- Défis blagues (payants en Togecoins) ----------
  const JOKE_CHALLENGE_COST = 5;
  const JOKE_CHALLENGE_TEMPLATES = [
    "Défi : jouer le prochain point en équilibre sur un pied 🦩",
    "Défi : gagner un échange en frappant uniquement en revers 😏",
    "Défi : faire un service « fantôme » (annoncé à voix haute avant de servir) 👻",
    "Défi : perdre le prochain point avec le style le plus théâtral possible 🎭"
  ];
  function getJokeChallengeTemplates() { return JOKE_CHALLENGE_TEMPLATES; }
  function getJokeChallengeCost() { return JOKE_CHALLENGE_COST; }
  function sendJokeChallenge(fromId, toId, message) {
    const sender = db.profiles[fromId];
    if ((sender.togecoins || 0) < JOKE_CHALLENGE_COST) return { ok: false, error: "Togecoins insuffisants" };
    sender.togecoins -= JOKE_CHALLENGE_COST;
    const ch = { id: uid(), from: fromId, to: toId, message, cost: JOKE_CHALLENGE_COST, created_at: nowISO() };
    db.challenges.push(ch);
    addNotification({ recipient_id: toId, actor_id: fromId, type: "joke_challenge", goal_id: null, message: `${displayName(fromId)} t'envoie un défi blague 😂 : "${message}"` });
    persist();
    return { ok: true, challenge: ch };
  }
  function getReceivedChallenges(playerId) { return db.challenges.filter(c => c.to === playerId).sort((a, b) => b.created_at.localeCompare(a.created_at)); }

  // ---------- Suggestions (joueur sans entraîneur) ----------
  const SUGGESTIONS = {
    technique: ["30 coups droits sans faute", "10 services gagnants d'affilée", "Maîtriser le flip revers"],
    physique: ["Gainage 3x/semaine", "Améliorer les déplacements latéraux", "Renforcement des jambes"],
    mental: ["Rester concentré·e après une erreur", "Gérer le stress en match", "Visualiser avant chaque match"],
    tactique: ["Varier les effets au service", "Analyser le jeu adverse avant un match", "Construire le point en 3 coups"]
  };
  function getSuggestions() { return SUGGESTIONS; }

  load();
  return {
    resetDemo, getMe, saveProfile, getProfile,
    supabaseSignUp, supabaseSignIn, supabaseSignOut, watchSupabaseAuth,
    getMyCoaches, getMyPlayers, leaveCoach, removePlayer, stopTrainingEntirely, fullName,
    getGroups, addGroup, renameGroup, deleteGroup, setGroupWhatsapp, getGroupMembers,
    addPlayerToGroup, removePlayerFromGroup, getPlayerGroups, inviteNewPlayer, addExistingPlayer,
    getGoalsForPlayer, addGoal, assignGoalToGroup, updateGoal, setGoalState, deleteGoal, deleteArchivedGoal,
    getNotifications, addNotification, markNotifRead, markAllNotifsRead,
    getAfttHistory, getSuggestions,
    displayName, checkAchievements, getTrophyCase, canViewTrophyCase,
    getShopCatalog, buyCosmetic, setActiveCosmetic, resetSeasonCredits,
    getFriends, areFriends, searchPlayers,
    sendFriendRequest, getPendingFriendRequests, respondFriendRequest, getFriendRequestStatus,
    getJokeChallengeTemplates, getJokeChallengeCost, sendJokeChallenge, getReceivedChallenges
  };
})();
