// ============================================================
// TOGEVO — Application (mode démo, prêt pour Supabase)
// ============================================================
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  let state = {
    role: "player",          // vue active : player | coach
    nav: "home",             // home | notifications | profile | social
    selectedGroupId: null,
    selectedPlayerId: null,
    socialTab: "trophies"    // trophies | friends | shop
  };

  // ---------------- Utils ----------------
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function initials(p) { return `${(p.first_name || "?")[0]}${(p.last_name || "?")[0]}`.toUpperCase(); }
  function frameClass(p) { return p && p.active_frame ? `frame-${p.active_frame}` : ""; }
  const TYPE_LABEL = { technique: "Technique", match_result: "Résultat match", aftt_points: "Points AFTT" };
  const CAT_LABEL = { technique: "Technique", physique: "Physique", mental: "Mental", tactique: "Tactique" };
  const TF_LABEL = { court_terme: "Court terme", moyen_terme: "Moyen terme", long_terme: "Long terme", date_precise: "Date précise" };

  function isOverdue(g) {
    if (!g.due_date || g.state === "atteint") return false;
    return new Date(g.due_date) < new Date(new Date().toDateString());
  }

  function openSheet(html, onOpen) {
    $("#sheet-body").innerHTML = html;
    $("#sheet-backdrop").classList.add("open");
    if (onOpen) onOpen($("#sheet-body"));
  }
  function closeSheet() { $("#sheet-backdrop").classList.remove("open"); }
  $("#sheet-backdrop").addEventListener("click", (e) => { if (e.target === $("#sheet-backdrop")) closeSheet(); });

  // ---------------- Auth screens ----------------
  $("#go-signup").addEventListener("click", () => { $("#auth-login-form").classList.add("hidden"); $("#auth-signup-form").classList.remove("hidden"); });
  $("#go-login").addEventListener("click", () => { $("#auth-signup-form").classList.add("hidden"); $("#auth-login-form").classList.remove("hidden"); });

  let signupRole = "player";
  $$(".chip-toggle[data-role]").forEach(chip => {
    chip.addEventListener("click", () => {
      $$(".chip-toggle[data-role]").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      signupRole = chip.dataset.role;
    });
  });

  function setBtnLoading(btn, loading, labelWhenIdle) {
    btn.disabled = loading;
    btn.textContent = loading ? "Un instant…" : labelWhenIdle;
  }

  $("#btn-login").addEventListener("click", async () => {
    const email = $("#login-email").value.trim();
    const password = $("#login-pass").value;
    if (!email || !password) { toast("E-mail et mot de passe requis"); return; }
    const btn = $("#btn-login");
    setBtnLoading(btn, true, "Se connecter");
    const res = await Store.supabaseSignIn({ email, password });
    setBtnLoading(btn, false, "Se connecter");
    if (!res.ok) { toast(translateAuthError(res.error)); return; }
    enterApp();
  });

  $("#btn-signup").addEventListener("click", async () => {
    const first_name = $("#su-first").value.trim();
    const last_name = $("#su-last").value.trim();
    const email = $("#su-email").value.trim();
    const password = $("#su-pass").value;
    const phone = $("#su-phone").value.trim();
    if (!first_name || !last_name || !email || !password) { toast("Prénom, nom, e-mail et mot de passe sont requis"); return; }
    if (password.length < 6) { toast("Le mot de passe doit faire au moins 6 caractères"); return; }
    const btn = $("#btn-signup");
    setBtnLoading(btn, true, "Créer mon compte");
    const res = await Store.supabaseSignUp({ first_name, last_name, email, phone, roles: signupRole, password });
    setBtnLoading(btn, false, "Créer mon compte");
    if (!res.ok) { toast(translateAuthError(res.error)); return; }
    if (res.confirmed) { enterApp(); return; }
    showEmailConfirmScreen(email);
  });

  function showEmailConfirmScreen(email) {
    $("#auth-signup-form").classList.add("hidden");
    $("#auth-login-form").classList.add("hidden");
    $("#auth-confirm-email").classList.remove("hidden");
    $("#confirm-email-address").textContent = email;
  }
  $("#btn-confirm-back-to-login").addEventListener("click", () => {
    $("#auth-confirm-email").classList.add("hidden");
    $("#auth-login-form").classList.remove("hidden");
  });

  function translateAuthError(msg) {
    if (!msg) return "Une erreur est survenue, réessaie.";
    const m = msg.toLowerCase();
    if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
    if (m.includes("user already registered") || m.includes("already been registered")) return "Un compte existe déjà avec cet e-mail — connecte-toi plutôt.";
    if (m.includes("email not confirmed")) return "Confirme d'abord ton e-mail (vérifie ta boîte de réception).";
    if (m.includes("password should be at least")) return "Le mot de passe doit faire au moins 6 caractères.";
    if (m.includes("rate limit")) return "Trop de tentatives, réessaie dans une minute.";
    return msg;
  }

  let appEntered = false;
  function enterApp() {
    if (appEntered) return;
    appEntered = true;
    $("#screen-auth").classList.remove("active");
    $("#screen-auth").classList.add("hidden");
    $("#app-shell").classList.remove("hidden");
    const me = Store.getMe();
    state.role = me.is_player ? "player" : "coach";
    setupRoleSwitch();
    renderAll();
  }

  $("#btn-logout").addEventListener("click", async () => {
    await Store.supabaseSignOut();
    appEntered = false;
    $("#app-shell").classList.add("hidden");
    $("#screen-auth").classList.remove("hidden");
    $("#screen-auth").classList.add("active");
    $("#auth-confirm-email").classList.add("hidden");
    $("#auth-login-form").classList.remove("hidden");
    $("#auth-signup-form").classList.add("hidden");
  });

  // Connexion réelle : dès que le SDK Supabase est prêt, on écoute les
  // changements de session (connexion, restauration au rechargement de la
  // page, retour depuis le lien de confirmation d'e-mail) pour entrer
  // automatiquement dans l'appli si un compte réel est déjà authentifié.
  document.addEventListener("togevo:supabase-ready", () => {
    Store.watchSupabaseAuth((profile) => {
      if (profile) {
        if (appEntered) renderAll();
        else enterApp();
      }
    });
  });

  // ---------------- Role switch (compte joueur + entraîneur) ----------------
  function setupRoleSwitch() {
    const me = Store.getMe();
    const sw = $("#role-view-switch");
    if (me.is_player && me.is_coach) {
      sw.classList.remove("hidden");
      $$("button", sw).forEach(b => b.classList.toggle("active", b.dataset.view === state.role));
    } else {
      sw.classList.add("hidden");
    }
  }
  $$("#role-view-switch button").forEach(b => b.addEventListener("click", () => {
    state.role = b.dataset.view;
    setupRoleSwitch();
    renderAll();
  }));

  // ---------------- Nav (mobile bottom nav + desktop sidebar) ----------------
  $$(".nav-btn[data-nav]").forEach(b => b.addEventListener("click", () => {
    state.nav = b.dataset.nav;
    if (state.nav === "home" && Store.getMe().is_coach && Store.getMe().is_player) {
      // garde la vue rôle courante
    } else if (state.nav === "home" && Store.getMe().is_coach && !Store.getMe().is_player) {
      state.role = "coach";
    }
    renderAll();
  }));
  $("#btn-open-notifs").addEventListener("click", () => { state.nav = "notifications"; renderAll(); });
  $("#btn-open-profile").addEventListener("click", () => { state.nav = "profile"; renderAll(); });

  // ---------------- Render dispatcher ----------------
  function renderAll() {
    $$(".nav-btn[data-nav]").forEach(b => b.classList.toggle("active", b.dataset.nav === state.nav));
    $("#view-player").classList.add("hidden");
    $("#view-coach").classList.add("hidden");
    $("#view-notifications").classList.add("hidden");
    $("#view-profile").classList.add("hidden");
    $("#view-social").classList.add("hidden");
    $("#role-view-switch").classList.toggle("hidden", !(Store.getMe().is_player && Store.getMe().is_coach) || state.nav !== "home");

    if (state.nav === "notifications") { $("#topbar-title").textContent = "Notifications"; $("#view-notifications").classList.remove("hidden"); renderNotifications(); }
    else if (state.nav === "profile") { $("#topbar-title").textContent = "Profil"; $("#view-profile").classList.remove("hidden"); renderProfile(); }
    else if (state.nav === "social") { $("#topbar-title").textContent = "Social"; $("#view-social").classList.remove("hidden"); renderSocial(); }
    else {
      $("#topbar-title").textContent = "Togevo";
      if (state.role === "coach") { $("#view-coach").classList.remove("hidden"); renderCoach(); }
      else { $("#view-player").classList.remove("hidden"); renderPlayerHome(); }
    }
    renderNotifDot();
  }

  function renderNotifDot() {
    const has = Store.getNotifications(Store.getMe().id).some(n => !n.read);
    $("#notif-dot").classList.toggle("hidden", !has);
  }

  // ============================================================
  // VUE JOUEUR
  // ============================================================
  function goalCardHTML(g, viewerId, viewerIsCoach) {
    const overdue = isOverdue(g);
    return `
    <div class="card goal-card" data-goal="${g.id}">
      <button class="goal-state-btn" data-state="${g.state}" data-action="cycle-state" title="Changer l'état">
        ${g.state === "atteint" ? "✓" : g.state === "en_cours" ? "●" : ""}
      </button>
      <div class="goal-main">
        <div class="goal-title ${g.state === "atteint" ? "done" : ""}">${escapeHTML(g.title)}</div>
        ${g.description ? `<div style="font-size:12.5px;color:var(--ink-soft);margin-top:2px;">${escapeHTML(g.description)}</div>` : ""}
        <div class="goal-meta">
          <span class="tag">${TYPE_LABEL[g.type]}</span>
          <span class="tag">${CAT_LABEL[g.category]}</span>
          <span class="tag timeframe">${g.due_date ? new Date(g.due_date).toLocaleDateString("fr-BE") : TF_LABEL[g.timeframe]}</span>
          ${overdue ? `<span class="tag overdue">En retard</span>` : ""}
          ${g.coach_id && g.coach_id !== g.player_id ? `<span class="tag">Assigné par ${Store.fullName(g.coach_id)}</span>` : ""}
        </div>
        ${g.last_edit_comment ? `<div style="font-size:11.5px;color:var(--ink-soft);margin-top:6px;">💬 ${escapeHTML(g.last_edit_comment)}</div>` : ""}
        <div class="goal-actions">
          <button class="btn btn-secondary btn-sm" data-action="edit-goal">Modifier</button>
          <button class="btn btn-danger btn-sm" data-action="delete-goal">Supprimer</button>
        </div>
      </div>
    </div>`;
  }
  function escapeHTML(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function renderGoalsInto(activeEl, archivedEl, playerId, viewerId, viewerIsCoach) {
    const { active, archived } = Store.getGoalsForPlayer(playerId);
    activeEl.innerHTML = active.length ? active.map(g => goalCardHTML(g, viewerId, viewerIsCoach)).join("") :
      `<div class="empty-state"><span class="emoji">🎯</span><p>Aucun objectif en cours. Ajoute-en un pour commencer à progresser !</p></div>`;
    if (archivedEl) {
      archivedEl.innerHTML = archived.length ? archived.map(g => goalCardHTML(g, viewerId, viewerIsCoach)).join("") :
        `<div class="empty-state"><span class="emoji">🗂️</span><p>Les objectifs atteints apparaîtront ici.</p></div>`;
    }
    [activeEl, archivedEl].filter(Boolean).forEach(container => {
      container.addEventListener("click", handleGoalClick, { once: false });
    });
  }

  function handleGoalClick(e) {
    const card = e.target.closest(".goal-card");
    if (!card) return;
    const goalId = card.dataset.goal;
    const g = findGoal(goalId);
    const action = e.target.dataset.action;
    const me = Store.getMe();
    if (action === "cycle-state") {
      const order = ["a_faire", "en_cours", "atteint"];
      const next = order[(order.indexOf(g.state) + 1) % order.length];
      if (next === "atteint") {
        askComment("Objectif atteint 🎉", "Un petit commentaire (optionnel) ?", (comment) => {
          Store.setGoalState(g.id, "atteint", me.id, comment);
          toast("Objectif validé — bravo !");
          renderAll();
        }, true);
      } else {
        Store.setGoalState(g.id, next, me.id);
        renderAll();
      }
    } else if (action === "edit-goal") {
      openGoalForm({ mode: "edit", goal: g });
    } else if (action === "delete-goal") {
      const needsComment = me.id !== g.player_id;
      if (needsComment) {
        askComment("Supprimer l'objectif", "Un commentaire est requis pour expliquer la suppression au joueur.", (comment) => {
          if (!comment) { toast("Commentaire requis"); return; }
          Store.deleteGoal(g.id, me.id, comment);
          toast("Objectif supprimé");
          renderAll();
        }, false, true);
      } else if (g.archived) {
        Store.deleteArchivedGoal(g.id); toast("Objectif supprimé des archives"); renderAll();
      } else {
        Store.deleteGoal(g.id, me.id);
        toast("Objectif supprimé");
        renderAll();
      }
    }
  }
  function findGoal(id) {
    // recherche à travers tous les joueurs visibles (démo simplifiée)
    const ids = [Store.getMe().id, ...Store.getMyPlayers(Store.getMe().id).map(p => p.id)];
    for (const pid of ids) {
      const { active, archived } = Store.getGoalsForPlayer(pid);
      const found = [...active, ...archived].find(g => g.id === id);
      if (found) return found;
    }
    return null;
  }

  function askComment(title, sub, onSubmit, optional, danger) {
    openSheet(`
      <h2>${title}</h2>
      <p style="font-size:13.5px;color:var(--ink-soft);margin:-8px 0 12px;">${sub}</p>
      <div class="field"><textarea id="comment-input" rows="3" placeholder="${optional ? "Ex : super régularité cette semaine !" : "Explique la raison…"}"></textarea></div>
      <div class="sheet-actions">
        <button class="btn btn-secondary" id="comment-cancel">Annuler</button>
        <button class="btn ${danger ? "btn-danger" : "btn-primary"}" id="comment-ok">${danger ? "Supprimer" : "Valider"}</button>
      </div>
    `, (root) => {
      $("#comment-cancel", root).addEventListener("click", closeSheet);
      $("#comment-ok", root).addEventListener("click", () => {
        onSubmit($("#comment-input", root).value.trim());
        closeSheet();
      });
    });
  }

  function renderPlayerHome() {
    const me = Store.getMe();
    const stats = $("#player-stats");
    const { active, archived } = Store.getGoalsForPlayer(me.id);
    stats.innerHTML = `
      <div class="stat-card"><div class="stat-value mono">${me.aftt_points ?? "—"}</div><div class="stat-label">Points AFTT</div></div>
      <div class="stat-card"><div class="stat-value mono">${active.length}</div><div class="stat-label">Objectifs en cours</div></div>
      <div class="stat-card"><div class="stat-value mono">${archived.length}</div><div class="stat-label">Objectifs atteints</div></div>
    `;
    $("#active-count").textContent = active.length;
    $("#archived-count").textContent = archived.length;
    renderGoalsInto($("#player-goals-active"), $("#player-goals-archived"), me.id, me.id, false);

    const hasCoach = Store.getMyCoaches(me.id).length > 0;
    $("#player-suggestions-block").classList.toggle("hidden", hasCoach);
    if (!hasCoach) renderSuggestions();

    drawProgressChart($("#progress-chart"), Store.getAfttHistory(me.id), archived.length);
  }

  function renderSuggestions() {
    const sugg = Store.getSuggestions();
    const grid = $("#suggestion-grid");
    grid.innerHTML = "";
    Object.entries(sugg).forEach(([cat, items]) => {
      items.forEach(title => {
        const btn = document.createElement("button");
        btn.className = "suggestion-chip";
        btn.textContent = `${CAT_LABEL[cat]} · ${title}`;
        btn.addEventListener("click", () => {
          Store.addGoal({ player_id: Store.getMe().id, created_by: Store.getMe().id, title, type: "technique", category: cat, timeframe: "court_terme" });
          toast("Objectif ajouté !");
          renderAll();
        });
        grid.appendChild(btn);
      });
    });
  }

  function drawProgressChart(canvas, afttHistory, reachedCount) {
    if (!canvas) return;
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 300, h = 160;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    if (!afttHistory.length) return;
    const pad = 24;
    const min = Math.min(...afttHistory), max = Math.max(...afttHistory);
    const range = Math.max(1, max - min);
    const stepX = (w - pad * 2) / (afttHistory.length - 1 || 1);
    ctx.beginPath();
    afttHistory.forEach((v, i) => {
      const x = pad + i * stepX;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#2E5776"; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();
    afttHistory.forEach((v, i) => {
      const x = pad + i * stepX;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fillStyle = "#2E5776"; ctx.fill();
    });
    // marqueurs "objectif atteint" (balles orange) répartis le long de la courbe
    for (let i = 0; i < Math.min(reachedCount, afttHistory.length); i++) {
      const idx = Math.floor((i + 1) * (afttHistory.length - 1) / (reachedCount + 1));
      const x = pad + idx * stepX;
      const y = h - pad - ((afttHistory[idx] - min) / range) * (h - pad * 2);
      ctx.beginPath(); ctx.arc(x, y - 12, 4, 0, 7); ctx.fillStyle = "#C97A2E"; ctx.fill();
    }
  }

  $("#btn-new-goal").addEventListener("click", () => openGoalForm({ mode: "create-player" }));

  // ---------------- Goal form (create/edit) ----------------
  function openGoalForm({ mode, goal, targetPlayerId, targetGroupId }) {
    const me = Store.getMe();
    const editing = mode === "edit";
    const g = editing ? goal : {};
    openSheet(`
      <h2>${editing ? "Modifier l'objectif" : mode === "create-group" ? "Assigner au groupe" : "Nouvel objectif"}</h2>
      <div class="field"><label>Titre</label><input id="gf-title" value="${g.title ? escapeHTML(g.title) : ""}" placeholder="Ex : 30 topspins sans faute"></div>
      <div class="field"><label>Description (optionnel)</label><textarea id="gf-desc" rows="2">${g.description ? escapeHTML(g.description) : ""}</textarea></div>
      <div class="field"><label>Type</label><select id="gf-type">
        ${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}" ${g.type === k ? "selected" : ""}>${v}</option>`).join("")}
      </select></div>
      <div class="field"><label>Catégorie</label><select id="gf-cat">
        ${Object.entries(CAT_LABEL).map(([k, v]) => `<option value="${k}" ${g.category === k ? "selected" : ""}>${v}</option>`).join("")}
      </select></div>
      <div class="field"><label>Échéance</label><select id="gf-tf">
        ${Object.entries(TF_LABEL).map(([k, v]) => `<option value="${k}" ${g.timeframe === k ? "selected" : ""}>${v}</option>`).join("")}
      </select></div>
      <div class="field hidden" id="gf-date-wrap"><label>Date précise</label><input type="date" id="gf-date" value="${g.due_date || ""}"></div>
      ${editing && me.id !== g.player_id ? `<div class="field"><label>Commentaire (requis pour informer le·la joueur·se)</label><textarea id="gf-comment" rows="2" placeholder="Ex : on ajuste l'échéance suite à la compétition"></textarea></div>` : ""}
      <div class="sheet-actions">
        <button class="btn btn-secondary" id="gf-cancel">Annuler</button>
        <button class="btn btn-primary" id="gf-save">${editing ? "Enregistrer" : "Ajouter"}</button>
      </div>
    `, (root) => {
      const tfSelect = $("#gf-tf", root);
      const toggleDate = () => $("#gf-date-wrap", root).classList.toggle("hidden", tfSelect.value !== "date_precise");
      tfSelect.addEventListener("change", toggleDate); toggleDate();
      $("#gf-cancel", root).addEventListener("click", closeSheet);
      $("#gf-save", root).addEventListener("click", () => {
        const title = $("#gf-title", root).value.trim();
        if (!title) { toast("Le titre est requis"); return; }
        const payload = {
          title, description: $("#gf-desc", root).value.trim(),
          type: $("#gf-type", root).value, category: $("#gf-cat", root).value,
          timeframe: tfSelect.value, due_date: tfSelect.value === "date_precise" ? $("#gf-date", root).value : null
        };
        if (editing) {
          const comment = $("#gf-comment", root) ? $("#gf-comment", root).value.trim() : null;
          Store.updateGoal(g.id, payload, me.id, comment);
          toast("Objectif mis à jour");
        } else if (mode === "create-group") {
          Store.assignGoalToGroup(me.id, targetGroupId, payload);
          toast("Objectif assigné au groupe");
        } else if (mode === "create-coach-player") {
          Store.addGoal({ ...payload, player_id: targetPlayerId, coach_id: me.id, created_by: me.id });
          toast("Objectif assigné");
        } else {
          Store.addGoal({ ...payload, player_id: me.id, created_by: me.id });
          toast("Objectif ajouté");
        }
        closeSheet();
        renderAll();
      });
    });
  }

  // ============================================================
  // VUE ENTRAÎNEUR
  // ============================================================
  function renderCoach() {
    renderBreadcrumbs();
    renderGroupsOrPlayers();
    renderCoachDetail();
  }

  function renderBreadcrumbs() {
    const bc = $("#coach-breadcrumbs");
    const parts = [`<button data-crumb="root">Groupes</button>`];
    if (state.selectedGroupId) {
      const grp = Store.getGroups(Store.getMe().id).find(g => g.id === state.selectedGroupId);
      parts.push(`<span>›</span><button data-crumb="group">${escapeHTML(grp ? grp.name : "")}</button>`);
    }
    if (state.selectedPlayerId) {
      parts.push(`<span>›</span><span>${escapeHTML(Store.fullName(state.selectedPlayerId))}</span>`);
    }
    bc.innerHTML = parts.join(" ");
    $$("button[data-crumb]", bc).forEach(b => b.addEventListener("click", () => {
      if (b.dataset.crumb === "root") { state.selectedGroupId = null; state.selectedPlayerId = null; }
      if (b.dataset.crumb === "group") { state.selectedPlayerId = null; }
      renderCoach();
    }));
  }

  function renderGroupsOrPlayers() {
    const me = Store.getMe();
    const listEl = $("#coach-groups-list");
    if (!state.selectedGroupId) {
      const groups = Store.getGroups(me.id);
      listEl.innerHTML = groups.length ? groups.map(g => {
        const members = Store.getGroupMembers(g.id);
        return `<div class="card group-card" data-group="${g.id}">
          <div class="group-info"><h3>${escapeHTML(g.name)}</h3><span>${members.length} joueur${members.length > 1 ? "s" : ""}</span></div>
          <span class="chevron">›</span>
        </div>`;
      }).join("") : `<div class="empty-state"><span class="emoji">👥</span><p>Crée ton premier groupe pour organiser tes joueurs.</p></div>`;
      $$(".group-card", listEl).forEach(el => el.addEventListener("click", () => { state.selectedGroupId = el.dataset.group; renderCoach(); }));
    } else {
      const group = Store.getGroups(me.id).find(g => g.id === state.selectedGroupId);
      const members = Store.getGroupMembers(group.id);
      listEl.innerHTML = `
        <div class="card">
          <div class="field"><label>Nom du groupe</label><input id="grp-name" value="${escapeHTML(group.name)}"></div>
          <div class="field"><label>Lien groupe WhatsApp</label><input id="grp-wa" value="${escapeHTML(group.whatsapp_link || "")}" placeholder="https://chat.whatsapp.com/…"></div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" id="grp-save">Enregistrer</button>
            ${group.whatsapp_link ? `<a class="btn btn-secondary btn-sm" href="${escapeHTML(group.whatsapp_link)}" target="_blank" rel="noopener">💬 Rejoindre</a>` : ""}
            <button class="btn btn-danger btn-sm" id="grp-delete">Supprimer</button>
          </div>
        </div>
        <div class="section-title"><h2>Joueurs du groupe</h2></div>
        ${members.map(p => `
          <div class="player-row" data-player="${p.id}">
            <div class="avatar ${frameClass(p)}">${initials(p)}</div>
            <div class="info"><div class="name">${escapeHTML(p.first_name)} ${escapeHTML(p.last_name)}</div><div class="sub">${p.aftt_points ?? "—"} pts AFTT</div></div>
            ${p.phone ? `<a class="wa-btn" href="${waLink(p.phone)}" target="_blank" rel="noopener" title="WhatsApp" onclick="event.stopPropagation()">💬</a>` : ""}
            <button class="icon-btn btn-sm" data-remove="${p.id}" title="Retirer du groupe" onclick="event.stopPropagation()" style="width:30px;height:30px;">✕</button>
          </div>`).join("")}
        <button class="btn btn-secondary btn-block" id="btn-assign-group-goal" style="margin-top:10px;">🎯 Assigner un objectif au groupe</button>
        <button class="btn btn-ghost btn-block" id="btn-add-to-group" style="margin-top:6px;">+ Ajouter un·e joueur·se au groupe</button>
      `;
      $("#grp-save").addEventListener("click", () => { Store.renameGroup(group.id, $("#grp-name").value.trim() || group.name); Store.setGroupWhatsapp(group.id, $("#grp-wa").value.trim()); toast("Groupe mis à jour"); renderCoach(); });
      $("#grp-delete").addEventListener("click", () => { Store.deleteGroup(group.id); state.selectedGroupId = null; toast("Groupe supprimé"); renderCoach(); });
      $("#btn-assign-group-goal").addEventListener("click", () => openGoalForm({ mode: "create-group", targetGroupId: group.id }));
      $("#btn-add-to-group").addEventListener("click", () => openAddPlayerSheet(group.id));
      $$(".player-row", listEl).forEach(row => row.addEventListener("click", () => { state.selectedPlayerId = row.dataset.player; renderCoach(); }));
      $$("[data-remove]", listEl).forEach(b => b.addEventListener("click", () => { Store.removePlayerFromGroup(group.id, b.dataset.remove); renderCoach(); }));
    }
  }

  function waLink(phone) {
    const clean = (phone || "").replace(/[^0-9]/g, "");
    return `${window.TOGEVO_CONFIG.WHATSAPP_BASE}${clean}`;
  }

  function renderCoachDetail() {
    const empty = $("#coach-detail-empty"), content = $("#coach-detail-content");
    if (!state.selectedPlayerId) { empty.classList.remove("hidden"); content.classList.add("hidden"); return; }
    empty.classList.add("hidden"); content.classList.remove("hidden");
    const p = Store.getProfile(state.selectedPlayerId);
    const me = Store.getMe();
    content.innerHTML = `
      <div class="card" style="display:flex;align-items:center;gap:12px;">
        <div class="avatar ${frameClass(p)}" style="width:48px;height:48px;font-size:16px;">${initials(p)}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:16px;">${escapeHTML(p.first_name)} ${escapeHTML(p.last_name)}</div>
          <div style="font-size:12.5px;color:var(--ink-soft);" class="mono">${p.aftt_points ?? "—"} pts AFTT</div>
        </div>
        ${p.phone ? `<a class="btn btn-secondary btn-sm" href="${waLink(p.phone)}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ""}
      </div>
      <div class="section-title"><h2>Objectifs en cours</h2></div>
      <div id="coach-goals-active"></div>
      <button class="btn btn-primary btn-block" id="btn-new-goal-coach" style="margin:10px 0;">+ Assigner un objectif</button>
      <div class="section-title"><h2>Objectifs atteints</h2></div>
      <div id="coach-goals-archived"></div>
      <div class="section-title"><h2>Trophées${p.trophy_privacy === "private" ? " 🔒" : ""}</h2></div>
      <div class="trophy-grid">${Store.getTrophyCase(p.id).map(t => `
        <div class="trophy-tile ${t.unlocked ? "" : "locked"}" title="${escapeHTML(t.desc)}">
          <span class="icon">${t.icon}</span><div class="t-title">${escapeHTML(t.title)}</div>
        </div>`).join("")}</div>
      <button class="btn btn-danger btn-block" id="btn-remove-player" style="margin-top:16px;">Retirer ce·tte joueur·se de mon suivi</button>
    `;
    renderGoalsInto($("#coach-goals-active"), $("#coach-goals-archived"), p.id, me.id, true);
    $("#btn-new-goal-coach").addEventListener("click", () => openGoalForm({ mode: "create-coach-player", targetPlayerId: p.id }));
    $("#btn-remove-player").addEventListener("click", () => {
      askComment("Retirer ce·tte joueur·se", "Ses objectifs partagés avec toi seront archivés.", () => {
        Store.removePlayer(me.id, p.id);
        state.selectedPlayerId = null;
        toast("Joueur·se retiré·e");
        renderAll();
      }, true);
    });
  }

  $("#btn-new-group").addEventListener("click", () => {
    openSheet(`
      <h2>Nouveau groupe</h2>
      <div class="field"><label>Nom du groupe</label><input id="ng-name" placeholder="Ex : Jeunes U15"></div>
      <div class="sheet-actions"><button class="btn btn-secondary" id="ng-cancel">Annuler</button><button class="btn btn-primary" id="ng-ok">Créer</button></div>
    `, (root) => {
      $("#ng-cancel", root).addEventListener("click", closeSheet);
      $("#ng-ok", root).addEventListener("click", () => {
        const name = $("#ng-name", root).value.trim();
        if (!name) { toast("Nom requis"); return; }
        const g = Store.addGroup(Store.getMe().id, name);
        state.selectedGroupId = g.id;
        closeSheet(); renderCoach();
      });
    });
  });
  $("#btn-add-player-empty").addEventListener("click", () => openAddPlayerSheet(null));

  function openAddPlayerSheet(groupId) {
    openSheet(`
      <h2>Ajouter un·e joueur·se</h2>
      <p style="font-size:13px;color:var(--ink-soft);margin:-8px 0 12px;">Crée un compte pour un·e nouveau·elle joueur·se, ou invite quelqu'un déjà inscrit via son e-mail.</p>
      <div class="field"><label>Prénom</label><input id="np-first"></div>
      <div class="field"><label>Nom</label><input id="np-last"></div>
      <div class="field"><label>E-mail</label><input id="np-email" type="email"></div>
      <div class="field"><label>Téléphone (WhatsApp, optionnel)</label><input id="np-phone" type="tel"></div>
      <div class="sheet-actions"><button class="btn btn-secondary" id="np-cancel">Annuler</button><button class="btn btn-primary" id="np-ok">Ajouter</button></div>
    `, (root) => {
      $("#np-cancel", root).addEventListener("click", closeSheet);
      $("#np-ok", root).addEventListener("click", () => {
        const first_name = $("#np-first", root).value.trim(), last_name = $("#np-last", root).value.trim();
        if (!first_name || !last_name) { toast("Prénom et nom requis"); return; }
        const player = Store.inviteNewPlayer(Store.getMe().id, { first_name, last_name, email: $("#np-email", root).value.trim(), phone: $("#np-phone", root).value.trim() });
        if (groupId) Store.addPlayerToGroup(groupId, player.id);
        toast(`${first_name} a été ajouté·e`);
        closeSheet(); renderCoach();
      });
    });
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  function renderNotifications() {
    const me = Store.getMe();
    const notifs = Store.getNotifications(me.id);
    Store.markAllNotifsRead(me.id);
    const list = $("#notif-list");
    list.innerHTML = notifs.length ? notifs.map(n => `
      <div class="notif-item ${n.read ? "" : "unread"}">
        <div class="notif-dot" style="opacity:${n.read ? 0 : 1}"></div>
        <div>
          <div class="txt">${escapeHTML(n.message)}</div>
          <div class="time">${new Date(n.created_at).toLocaleDateString("fr-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>
    `).join("") : `<div class="empty-state"><span class="emoji">🔔</span><p>Aucune notification pour le moment.</p></div>`;
    setTimeout(renderNotifDot, 50);
  }

  // ============================================================
  // PROFIL
  // ============================================================
  function renderProfile() {
    const me = Store.getMe();
    $("#profile-first").value = me.first_name;
    $("#profile-last").value = me.last_name;
    $("#profile-pseudo").value = me.pseudo || "";
    $("#profile-phone").value = me.phone || "";
    $("#profile-aftt").value = me.aftt_points ?? "";
    $("#profile-role-player").classList.toggle("selected", me.is_player);
    $("#profile-role-coach").classList.toggle("selected", me.is_coach);
    $("#profile-mode-field").classList.toggle("hidden", !me.is_player);
    $("#profile-mode-focus").classList.toggle("selected", me.display_mode !== "gamified");
    $("#profile-mode-gamified").classList.toggle("selected", me.display_mode === "gamified");
    $("#profile-privacy-public").classList.toggle("selected", me.trophy_privacy !== "private");
    $("#profile-privacy-private").classList.toggle("selected", me.trophy_privacy === "private");

    const coaches = Store.getMyCoaches(me.id);
    const list = $("#my-coaches-list");
    list.innerHTML = coaches.length ? coaches.map(({ coach }) => `
      <div class="player-row" data-coach="${coach.id}">
        <div class="avatar ${frameClass(coach)}">${initials(coach)}</div>
        <div class="info"><div class="name">${escapeHTML(coach.first_name)} ${escapeHTML(coach.last_name)}</div><div class="sub">Entraîneur·se</div></div>
        ${coach.phone ? `<a class="wa-btn" href="${waLink(coach.phone)}" target="_blank" rel="noopener">💬</a>` : ""}
        <button class="btn btn-ghost btn-sm" data-leave="${coach.id}">Quitter</button>
      </div>
    `).join("") : `<div class="empty-state"><span class="emoji">🤝</span><p>Tu n'as pas encore d'entraîneur associé à ton compte.</p></div>`;
    $$("[data-leave]", list).forEach(b => b.addEventListener("click", () => {
      askComment("Quitter cet·te entraîneur·se", "Tes objectifs avec lui·elle seront archivés, pas supprimés.", () => {
        Store.leaveCoach(me.id, b.dataset.leave);
        toast("Tu as quitté cet·te entraîneur·se");
        renderProfile();
      }, true);
    }));
  }
  $$("#profile-mode-focus, #profile-mode-gamified").forEach(el => el.addEventListener("click", () => {
    $$("#profile-mode-focus, #profile-mode-gamified").forEach(c => c.classList.remove("selected"));
    el.classList.add("selected");
  }));
  $$("#profile-privacy-public, #profile-privacy-private").forEach(el => el.addEventListener("click", () => {
    $$("#profile-privacy-public, #profile-privacy-private").forEach(c => c.classList.remove("selected"));
    el.classList.add("selected");
  }));
  $("#btn-season-reset").addEventListener("click", () => {
    askComment("Simuler la fin de saison", "Action de démonstration : les crédits de tous les comptes en mode gamifié sont réduits de moitié pour éviter l'inflation. Confirmer ?", () => {
      Store.resetSeasonCredits();
      toast("Crédits réinitialisés pour la nouvelle saison");
      renderAll();
    }, true);
  });
  $$("#profile-role-player, #profile-role-coach").forEach(el => el.addEventListener("click", () => el.classList.toggle("selected")));
  $("#btn-save-profile").addEventListener("click", async () => {
    const btn = $("#btn-save-profile");
    setBtnLoading(btn, true, "Enregistrer");
    const res = await Store.saveProfile({
      first_name: $("#profile-first").value.trim(), last_name: $("#profile-last").value.trim(),
      pseudo: $("#profile-pseudo").value.trim(),
      phone: $("#profile-phone").value.trim(), aftt_points: Number($("#profile-aftt").value) || null,
      is_player: $("#profile-role-player").classList.contains("selected"),
      is_coach: $("#profile-role-coach").classList.contains("selected"),
      display_mode: $("#profile-mode-gamified").classList.contains("selected") ? "gamified" : "focus",
      trophy_privacy: $("#profile-privacy-private").classList.contains("selected") ? "private" : "public"
    });
    setBtnLoading(btn, false, "Enregistrer");
    if (!res.ok) {
      toast(res.error && res.error.includes("display_mode")
        ? "Le schéma Supabase n'est pas à jour. Exécute supabase/migrations/001_profiles.sql dans l'éditeur SQL."
        : (res.error || "Impossible d'enregistrer le profil (réseau ou schéma)."));
      return;
    }
    setupRoleSwitch();
    toast("Profil enregistré");
  });
  $("#btn-find-coach").addEventListener("click", () => toast("La recherche d'entraîneur arrive bientôt — pour l'instant, demande-lui d'ajouter ton e-mail depuis son espace « Mes joueurs »."));
  $("#btn-stop-training").addEventListener("click", () => {
    askComment("Arrêter l'entraînement", "Tous tes entraîneurs seront notifiés et tes objectifs archivés.", () => {
      Store.stopTrainingEntirely(Store.getMe().id);
      toast("Entraînement arrêté");
      renderProfile();
    }, true);
  });

  // ============================================================
  // SOCIAL (Trophées / Amis / Boutique)
  // ============================================================
  function renderSocial() {
    const me = Store.getMe();
    if (me.is_player) Store.checkAchievements(me.id);
    const gamified = me.display_mode === "gamified";

    applySocialSubtab();

    $("#trophies-mode-banner").innerHTML = gamified
      ? `<div class="mode-banner gamified">🎮 Mode Gamifié actif — Togecoins, boutique et défis entre ami·es débloqués. Passe en Mode Focus depuis ton profil si tu préfères une vue sobre.</div>`
      : `<div class="mode-banner focus">🎯 Mode Focus — vitrine de trophées et statistiques, sans gadgets. Active le Mode Gamifié depuis ton profil pour débloquer Togecoins et boutique.</div>`;

    renderSocialTrophies();
    renderFriendsAndChallenges(gamified);
    renderShop(gamified);
  }

  $$("#social-subtabs button[data-subtab]").forEach(b => b.addEventListener("click", () => {
    state.socialTab = b.dataset.subtab;
    applySocialSubtab();
  }));
  function applySocialSubtab() {
    $$("#social-subtabs button[data-subtab]").forEach(b => b.classList.toggle("active", b.dataset.subtab === state.socialTab));
    ["trophies", "friends", "shop"].forEach(t => $(`#social-tab-${t}`).classList.toggle("hidden", t !== state.socialTab));
  }

  function renderSocialTrophies() {
    const me = Store.getMe();
    $("#trophy-privacy-note").classList.toggle("hidden", me.trophy_privacy !== "private");
    const trophies = Store.getTrophyCase(me.id);
    $("#trophy-grid").innerHTML = trophies.map(t => `
      <div class="trophy-tile ${t.unlocked ? "" : "locked"}" title="${escapeHTML(t.desc)}">
        <span class="icon">${t.icon}</span>
        <div class="t-title">${escapeHTML(t.title)}</div>
        ${t.unlocked ? `<div class="t-date">${new Date(t.unlocked_at).toLocaleDateString("fr-BE")}</div>` : `<div class="t-date">Verrouillé</div>`}
      </div>
    `).join("");
  }

  function renderShop(gamified) {
    const me = Store.getMe();
    $("#shop-locked-note").classList.toggle("hidden", gamified);
    $("#shop-unlocked-content").classList.toggle("hidden", !gamified);
    if (!gamified) return;

    $("#togecoins-balance").textContent = me.togecoins ?? 0;
    const catalog = Store.getShopCatalog();
    $("#shop-grid").innerHTML = catalog.map(item => {
      const owned = (me.owned_cosmetics || []).includes(item.id);
      const active = (item.type === "theme" ? me.active_theme : me.active_frame) === item.id;
      return `<div class="shop-item">
        <div class="shop-swatch" style="background:${item.preview}"></div>
        <div class="name">${escapeHTML(item.name)}</div>
        ${owned ? `<div class="cost">Possédé</div><button class="btn ${active ? "btn-secondary" : "btn-primary"} btn-sm btn-block" data-equip="${item.id}" data-type="${item.type}">${active ? "Équipé ✓" : "Équiper"}</button>`
                : `<div class="cost"><span class="coin-icon sm">T</span> ${item.cost} Togecoins</div><button class="btn btn-primary btn-sm btn-block" data-buy="${item.id}">Acheter</button>`}
      </div>`;
    }).join("");
    $$("[data-buy]", $("#shop-grid")).forEach(b => b.addEventListener("click", () => {
      const res = Store.buyCosmetic(me.id, b.dataset.buy);
      if (!res.ok) { toast(res.error === "Crédits insuffisants" ? "Pas assez de Togecoins" : res.error); return; }
      toast("Objet acheté !");
      renderShop(true);
    }));
    $$("[data-equip]", $("#shop-grid")).forEach(b => b.addEventListener("click", () => {
      Store.setActiveCosmetic(me.id, b.dataset.type, b.dataset.equip);
      toast("Objet équipé");
      renderShop(true); renderAll();
    }));

    const received = Store.getReceivedChallenges(me.id);
    $("#challenges-list").innerHTML = received.length ? received.map(c => `
      <div class="challenge-item">
        <div>😂 <strong>${escapeHTML(Store.displayName(c.from))}</strong> t'a envoyé : "${escapeHTML(c.message)}"</div>
        <div class="time">${new Date(c.created_at).toLocaleDateString("fr-BE", { day: "numeric", month: "short" })}</div>
      </div>
    `).join("") : `<div class="empty-state"><span class="emoji">😂</span><p>Aucun défi blague reçu pour l'instant.</p></div>`;
  }

  function renderFriendsAndChallenges(gamified) {
    const me = Store.getMe();
    if (gamified === undefined) gamified = me.display_mode === "gamified";
    const pending = Store.getPendingFriendRequests(me.id);
    const requestsBox = document.getElementById("friend-requests-list");
    if (requestsBox) {
      requestsBox.innerHTML = pending.length ? `
        <div class="section-title"><h2>Demandes reçues</h2></div>
        ${pending.map(r => {
          const p = Store.getProfile(r.from);
          return `<div class="card player-row" data-request="${r.id}" style="margin-bottom:8px;">
            <div class="avatar ${frameClass(p)}">${initials(p)}</div>
            <div class="info"><div class="name">${escapeHTML(p.pseudo || Store.displayName(p.id))}</div><div class="sub">Souhaite devenir ton ami·e</div></div>
            <button class="btn btn-secondary btn-sm" data-decline="${r.id}">✕</button>
            <button class="btn btn-primary btn-sm" data-accept="${r.id}">✓ Accepter</button>
          </div>`;
        }).join("")}
      ` : "";
      $$("[data-accept]", requestsBox).forEach(b => b.addEventListener("click", () => {
        Store.respondFriendRequest(b.dataset.accept, true);
        toast("Vous êtes maintenant ami·es !");
        renderFriendsAndChallenges();
      }));
      $$("[data-decline]", requestsBox).forEach(b => b.addEventListener("click", () => {
        Store.respondFriendRequest(b.dataset.decline, false);
        renderFriendsAndChallenges();
      }));
    }

    const friends = Store.getFriends(me.id);
    $("#friends-list").innerHTML = friends.length ? `
      <div class="section-title"><h2>Mes ami·es</h2></div>
      ${friends.map(f => `
        <div class="card player-row" data-friend="${f.id}" style="margin-bottom:8px;">
          <div class="avatar ${frameClass(f)}">${initials(f)}</div>
          <div class="info"><div class="name">${escapeHTML(f.pseudo || Store.displayName(f.id))}</div><div class="sub">${f.aftt_points ?? "—"} pts AFTT</div></div>
          ${gamified ? `<button class="btn btn-secondary btn-sm" data-joke="${f.id}">😂 Défi</button>` : ""}
        </div>
      `).join("")}
    ` : `<p style="font-size:12.5px;color:var(--ink-soft);">Pas encore d'ami·e — rapprochement automatique via tes groupes, ou cherche quelqu'un ci-dessus.</p>`;
    $$("[data-joke]", $("#friends-list")).forEach(b => b.addEventListener("click", () => openJokeChallengeSheet(b.dataset.joke)));
  }

  $("#btn-friend-search").addEventListener("click", () => {
    const me = Store.getMe();
    const q = $("#friend-search").value.trim();
    const results = Store.searchPlayers(q, me.id);
    const box = $("#friend-search-results");
    box.innerHTML = results.length ? results.map(p => {
      const status = Store.areFriends(me.id, p.id) ? "friends" : Store.getFriendRequestStatus(me.id, p.id);
      const label = status === "friends" ? "Déjà ami·e" : status === "pending" ? "Demande en attente" : "";
      return `<div class="player-row" data-add="${p.id}">
        <div class="avatar ${frameClass(p)}">${initials(p)}</div>
        <div class="info"><div class="name">${escapeHTML(p.pseudo || Store.displayName(p.id))}</div><div class="sub">${label}</div></div>
        ${status ? "" : `<button class="btn btn-primary btn-sm" data-send-request="${p.id}">+ Ajouter</button>`}
      </div>`;
    }).join("") : `<p style="font-size:12.5px;color:var(--ink-soft);margin-top:8px;">Aucun résultat pour "${escapeHTML(q)}".</p>`;
    $$("[data-send-request]", box).forEach(b => b.addEventListener("click", () => {
      const res = Store.sendFriendRequest(me.id, b.dataset.sendRequest);
      if (!res.ok) { toast(res.error); return; }
      toast("Demande d'ami·e envoyée !");
      $("#btn-friend-search").click();
    }));
  });

  function openJokeChallengeSheet(toId) {
    const me = Store.getMe();
    const templates = Store.getJokeChallengeTemplates();
    const cost = Store.getJokeChallengeCost();
    openSheet(`
      <h2>Envoyer un défi blague 😂</h2>
      <p style="font-size:13px;color:var(--ink-soft);margin:-8px 0 4px;">À ${escapeHTML(Store.displayName(toId))}</p>
      <p style="font-size:12.5px;color:var(--ball);font-weight:700;margin:0 0 12px;display:flex;align-items:center;gap:6px;"><span class="coin-icon sm">T</span>Coûte ${cost} Togecoins (solde actuel : ${me.togecoins ?? 0})</p>
      <div class="chip-row" style="margin-bottom:12px;">
        ${templates.map((t, i) => `<button class="suggestion-chip" data-template="${i}" style="text-align:left;">${escapeHTML(t)}</button>`).join("")}
      </div>
      <div class="field"><label>Ou écris le tien</label><textarea id="joke-custom" rows="2" placeholder="Ton défi personnalisé…"></textarea></div>
      <div class="sheet-actions"><button class="btn btn-secondary" id="joke-cancel">Annuler</button><button class="btn btn-primary" id="joke-send">Envoyer (${cost} <span class="coin-icon sm">T</span>)</button></div>
    `, (root) => {
      let chosen = null;
      $$("[data-template]", root).forEach(b => b.addEventListener("click", () => { chosen = templates[b.dataset.template]; $("#joke-custom", root).value = chosen; }));
      $("#joke-cancel", root).addEventListener("click", closeSheet);
      $("#joke-send", root).addEventListener("click", () => {
        const msg = $("#joke-custom", root).value.trim();
        if (!msg) { toast("Écris ou choisis un défi"); return; }
        const res = Store.sendJokeChallenge(me.id, toId, msg);
        if (!res.ok) { toast("Togecoins insuffisants pour envoyer ce défi"); return; }
        toast("Défi envoyé !");
        closeSheet();
        renderAll();
      });
    });
  }


  // ---------------- PWA ----------------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  // ---------------- Démarrage ----------------
  // Le démarrage se fait maintenant via la vraie session Supabase (voir
  // l'écouteur "togevo:supabase-ready" plus haut) : si l'utilisateur a déjà
  // une session valide (reconnexion automatique), l'appli s'ouvre directement ;
  // sinon l'écran de connexion (déjà affiché par défaut) reste visible.
})();
