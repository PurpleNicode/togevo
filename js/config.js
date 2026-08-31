// ============================================================
// TOGEVO — Configuration
// ============================================================
// 1) Crée un projet Supabase (région Frankfurt conseillée pour le RGPD).
// 2) Exécute supabase/schema.sql dans l'éditeur SQL du projet.
// 3) Renseigne les deux valeurs ci-dessous (Project Settings → API).
// 4) Passe DEMO_MODE à false.
//
// Tant que DEMO_MODE est à true, Togevo fonctionne entièrement en local
// (localStorage) avec un compte de démonstration : rien n'est envoyé
// en ligne, ce qui permet de tester l'appli sans backend.

window.TOGEVO_CONFIG = {
  DEMO_MODE: true,
  SUPABASE_URL: "https://VOTRE-PROJET.supabase.co",
  SUPABASE_ANON_KEY: "VOTRE_CLE_ANON_PUBLIQUE",
  APP_NAME: "Togevo",
  WHATSAPP_BASE: "https://wa.me/"
};
