// ============================================================
// TOGEVO — Client Supabase (chargé uniquement hors mode démo)
// ============================================================
(function () {
  const cfg = window.TOGEVO_CONFIG;
  window.togevoSupabase = null;

  if (cfg.DEMO_MODE) return;

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.onload = () => {
    window.togevoSupabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    document.dispatchEvent(new CustomEvent("togevo:supabase-ready"));
  };
  document.head.appendChild(script);
})();
