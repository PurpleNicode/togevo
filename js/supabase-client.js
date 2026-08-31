// ============================================================
// TOGEVO — Client Supabase
// ============================================================
// On charge le SDK dès qu'une vraie config est renseignée (URL différente
// du placeholder), même si DEMO_MODE reste actif pour les données : c'est
// ce qui permet d'avoir une VRAIE connexion (Supabase Auth) pendant que les
// groupes/objectifs/etc. continuent de fonctionner en local pour l'instant.
(function () {
  const cfg = window.TOGEVO_CONFIG;
  window.togevoSupabase = null;

  const isConfigured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("VOTRE-PROJET");
  if (!isConfigured) return;

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.onload = () => {
    window.togevoSupabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    document.dispatchEvent(new CustomEvent("togevo:supabase-ready"));
  };
  script.onerror = () => {
    console.error("Togevo : impossible de charger le SDK Supabase (réseau ?).");
  };
  document.head.appendChild(script);
})();
