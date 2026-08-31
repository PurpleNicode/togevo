// ============================================================
// TOGEVO — Configuration
// ============================================================
// Projet Supabase "Togevo-db" (région Paris) créé et migré (schema.sql exécuté).
// Les clés ci-dessous sont déjà les vraies clés du projet.
//
// DEMO_MODE reste à `true` pour l'instant : basculer à `false` seul ne suffit
// pas encore, car js/store.js fonctionne aujourd'hui de façon synchrone sur
// localStorage. Les appels Supabase sont asynchrones (Promises), donc passer
// au vrai backend demande de réécrire store.js ET les appels correspondants
// dans app.js pour gérer l'attente des réponses. C'est la prochaine étape de
// travail — voir la conversation avec Claude pour le calendrier.

window.TOGEVO_CONFIG = {
  DEMO_MODE: true,
  SUPABASE_URL: "https://seokyqbndzyayowftmqw.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_wL0OeZkgSJsRHJFejKngdQ_MazPC1jr",
  APP_NAME: "Togevo",
  WHATSAPP_BASE: "https://wa.me/"
};

