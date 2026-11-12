/* Admin panel — sign in with Supabase and edit the portfolio content. Forms are generated from the saved content. */
(function () {
  "use strict";

  const CFG = window.SUPABASE_CONFIG || {};
  const BUCKET = CFG.bucket || "portfolio-media";
  const MAX_UPLOAD = 5 * 1024 * 1024;
  const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  let SNAPSHOT = {};   // content as last loaded; used as the shape for new list items

  const SECTION_META = {
    site:       { title: "Site & Contact Info", icon: "badge",        desc: "Your name, email, phone, social links, navigation and footer — shown on every page." },
    home:       { title: "Home",                icon: "home",         desc: "Hero introduction, photo, quick facts, philosophy cards and call-to-action." },
    skills:     { title: "Skills",              icon: "construction", desc: "Skill categories, each skill card and the developer philosophy section." },
    projects:   { title: "Projects",            icon: "folder_open",  desc: "Project cards, filters and the details popups (Modals)." },
    experience: { title: "Experience",          icon: "work_history", desc: "Jobs, responsibilities, strengths and competency bars." },
    education:  { title: "Education & Certs",   icon: "school",       desc: "Degrees, coursework, certifications and distinctions." },
    contact:    { title: "Contact",             icon: "mail",         desc: "Availability, work models, contact form labels and FAQ." },
    resume:     { title: "Resume",              icon: "description",  desc: "Your resume is built automatically from Site info, Experience, Education, Skills, Projects and Certifications. Here you choose what it shows and add resume-only details. Empty fields use your portfolio content." }
  };


  /** Objects whose keys are user-defined IDs (entries can be added/renamed). */
  const MAP_PATHS = new Set(["projects.modals"]);

  const HINTS = {
    icon: "Material Symbols icon name, e.g. code, palette, school",
    href: "Page (projects.html), web link (https://…), mailto:… or tel:…",
    url: "Page (projects.html), web link (https://…), mailto:… or tel:…",
    link: "Web link or mailto:… opened by the popup's button",
    modal: "Popup ID from Projects → Modals. Leave empty to use the Link instead.",
    category: "Must match one of the filter IDs",
    percent: "0 – 100",
    featured: "Show as a wide card",
    current: "Highlight this period in green",
    iconFirst: "Show the icon before the text",
    dark: "Use the dark green icon style",
    highlight: "Show as a green tag",
    monogram: "Letters shown when no logo image is set",
    nameLine1: "Big name on the home page — first line",
    nameLine2: "Big name on the home page — second line",
    copyright: "Footer line, e.g. © 2025 Your Name. All rights reserved.",
    pageTitle: "Text shown on the browser tab",
    headline: "Title under your name. Empty = your Role from Site info",
    profileSummary: "Resume summary. Empty = the intro paragraph from your Home page",
    website: "Portfolio link shown on the resume. Empty = this website's address",
    paperSize: "Letter = short bond (8.5×11 in), A4 = international",
    maxProjects: "How many projects to list (newest first)",
    showPhoto: "Many employers prefer resumes without photos",
    references: "Text under References",
    additional: "Extra sections such as Languages, Volunteer work or Affiliations",
    logo: "Optional. Leave empty to show the monogram",
    phone: "Number used for the call link and copy button",
    value: "Tip: on Projects stats, {count} shows the number of projects"
  };
  const ENUMS = { iconStyle: ["cream", "green"], badgeStyle: ["soft", "dark"], paperSize: ["Letter", "A4"] };
  const TEXTAREA_KEYS = /^(text|intro|summary|profileSummary|desc|description|quote|tagline|footerTagline|successText|closing|messagePlaceholder)$/;

  const state = {
    client: null, user: null,
    sections: {}, saved: {}, order: [], updated: {},
    current: null, view: "section",
    dirty: new Set(), open: new Set(),
    media: null
  };
  const ADDED = new WeakMap();   // object -> Set(keys) added by the editor (pruned if left empty)
  let uidCounter = 0;
  const app = document.getElementById("app");

  /* =============================== helpers =============================== */
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const uid = (p = "f") => `${p}-${++uidCounter}`;
  const $ = (s, r = document) => r.querySelector(s);
  const humanize = (k) => String(k)
    .replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([a-zA-Z])([0-9])/g, "$1 $2")
    .replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
  const normPath = (p) => p.split(".").filter((s) => !/^\d+$/.test(s)).join(".");
  const fmtSize = (b) => (b == null ? "" : b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "");
  const isImageKey = (k, v) => /^(image|photo|logo|mapImage|avatar|thumbnail)$/i.test(k) ||
    (typeof v === "string" && /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(v) && /(^images\/|^uploads\/|^https?:\/\/)/.test(v));
  const isIconKey = (k) => k === "icon" || /Icon$/.test(k);
  const previewSrc = (p) => (!p ? "" : /^(https?:|data:|blob:)/.test(p) ? p : "../" + p.replace(/^\.?\//, ""));

  /** Tiny DOM builder: h("div", {class:"x", onClick: fn}, child, "text") */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "value") el.value = v;
      else if (k === "checked") el.checked = !!v;
      else if (k === "dataset") Object.assign(el.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? "" : String(v));
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const icon = (name, cls = "") => h("span", { class: "ms " + cls, "aria-hidden": "true", text: name });
  const btn = (label, iconName, cls, onClick, extra = {}) =>
    h("button", { type: "button", class: "btn " + cls, onClick, ...extra }, iconName ? icon(iconName) : null, label ? h("span", { text: label }) : null);

  /** Wraps a password input with a show/hide (eye) button. */
  function withReveal(input) {
    const toggle = h("button", {
      type: "button", class: "reveal-btn", "aria-label": "Show password", title: "Show password",
      "aria-controls": input.id, "aria-pressed": "false"
    }, icon("visibility"));
    toggle.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.firstChild.textContent = show ? "visibility_off" : "visibility";
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      toggle.setAttribute("title", show ? "Hide password" : "Show password");
      toggle.setAttribute("aria-pressed", String(show));
      input.focus();
    });
    return h("div", { class: "password-wrap" }, input, toggle);
  }

  function toast(message, type = "ok") {
    const t = h("div", { class: "toast toast--" + type }, icon(type === "error" ? "error" : type === "info" ? "info" : "check_circle"), h("span", { text: message }));
    $("#toasts").append(t);
    setTimeout(() => t.classList.add("is-leaving"), type === "error" ? 6000 : 3200);
    setTimeout(() => t.remove(), type === "error" ? 6500 : 3700);
  }

  function errMsg(err) {
    if (!err) return "Unknown error";
    const m = err.message || String(err);
    if (/Failed to fetch|NetworkError/i.test(m)) return "Cannot reach Supabase. Check your internet connection and js/supabase-config.js.";
    return m;
  }

  /* ===================== editor-added keys (templates) ===================== */
  function blank(v) {
    if (Array.isArray(v)) return [];
    if (isObj(v)) { const o = {}; for (const k in v) o[k] = blank(v[k]); return o; }
    if (typeof v === "number") return 0;
    if (typeof v === "boolean") return false;
    return "";
  }
  function deepEmpty(v) {
    if (v == null || v === "" || v === 0 || v === false) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (isObj(v)) return Object.values(v).every(deepEmpty);
    return false;
  }
  function unionShape(list) {
    const out = {};
    for (const obj of list) {
      if (!isObj(obj)) continue;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (!(k in out)) out[k] = clone(v);
        else if (isObj(out[k]) && isObj(v)) out[k] = unionShape([out[k], v]);
        else if (Array.isArray(out[k]) && !out[k].length && Array.isArray(v) && v.length) out[k] = clone(v);
      }
    }
    return out;
  }
  function valuesAt(root, segs) {
    let nodes = [root];
    for (const s of segs) {
      const next = [];
      for (const n of nodes) for (const x of (Array.isArray(n) ? n : [n])) if (isObj(x) && s in x) next.push(x[s]);
      nodes = next;
    }
    return nodes;
  }
  /** Shape for new items of the array at `path`: union of its current items + the items it had when loaded. */
  function itemTemplate(arr, path) {
    const fromLoaded = valuesAt(SNAPSHOT, normPath(path).split(".")).flatMap((a) => (Array.isArray(a) ? a : []));
    const all = [...arr, ...fromLoaded];
    if (!all.length) return "";
    if (all.every((x) => !isObj(x))) return typeof all[0] === "number" ? 0 : "";
    return unionShape(all.filter(isObj));
  }
  function ensureKeys(obj, shape) {
    if (!isObj(obj) || !isObj(shape)) return;
    for (const k of Object.keys(shape)) {
      if (!(k in obj)) {
        obj[k] = blank(shape[k]);
        if (!ADDED.has(obj)) ADDED.set(obj, new Set());
        ADDED.get(obj).add(k);
      } else if (isObj(obj[k]) && isObj(shape[k])) {
        ensureKeys(obj[k], shape[k]);
      }
    }
  }
  /** Before saving: drop fields the editor added that were left empty. */
  function pruneAdded(v) {
    if (Array.isArray(v)) { v.forEach(pruneAdded); return; }
    if (!isObj(v)) return;
    const added = ADDED.get(v);
    for (const k of Object.keys(v)) {
      pruneAdded(v[k]);
      if (added && added.has(k) && deepEmpty(v[k])) { delete v[k]; added.delete(k); }
    }
  }

  /* =============================== dirty state =============================== */
  function markDirty() {
    if (!state.current) return;
    state.dirty.add(state.current);
    updateDirtyUI();
  }
  function updateDirtyUI() {
    const dirty = state.view === "section" && state.dirty.has(state.current);
    $("#saveBar").hidden = !dirty;
    document.querySelectorAll("[data-side-key]").forEach((b) => b.classList.toggle("is-dirty", state.dirty.has(b.dataset.sideKey)));
    const sb = $("#headSaveBtn");
    if (sb) sb.disabled = !dirty;
  }
  function confirmLeave() {
    if (state.view === "section" && state.dirty.has(state.current)) {
      return window.confirm("You have unsaved changes in this section. Leave without saving?");
    }
    return true;
  }
  window.addEventListener("beforeunload", (e) => { if (state.dirty.size) { e.preventDefault(); e.returnValue = ""; } });

  /* ================================ screens ================================ */
  function centerCard(...children) {
    app.replaceChildren(h("div", { class: "adm-center" }, h("div", { class: "auth-card card" },
      h("div", { class: "auth-brand" }, h("span", { class: "brand-mono brand-mono--md", text: (state.sections.site && state.sections.site.monogram) || "KA" }),
        h("span", {}, h("strong", { text: "Portfolio Admin" }), h("small", { class: "mono", text: "Content manager" }))),
      ...children)));
  }

  function renderNotConfigured() {
    centerCard(
      h("h1", { class: "h-sm", text: "Connect your Supabase database" }),
      h("p", { class: "text-sm muted-text", text: "The admin panel and website need your Supabase project's connection details." }),
      h("ol", { class: "steps" },
        h("li", {}, "In ", h("a", { href: "https://supabase.com/dashboard", target: "_blank", rel: "noopener noreferrer", text: "Supabase" }), ", go to ", h("strong", { text: "Project Settings → API" }), "."),
        h("li", {}, "Copy the Project URL and the publishable (anon) key."),
        h("li", {}, "Paste them into ", h("code", { text: "js/supabase-config.js" }), " and reload this page.")
      )
    );
  }

  function renderSetupError(message) {
    centerCard(
      h("h1", { class: "h-sm", text: "Database not ready" }),
      h("p", { class: "form-error", text: message }),
      h("p", { class: "text-sm muted-text", text: "Check that the portfolio tables exist in your Supabase project, then reload." }),
      btn("Reload", "refresh", "btn-primary", () => location.reload()),
      btn("Sign out", "logout", "btn-cream", signOut)
    );
  }

  function renderLogin(message) {
    const email = h("input", { id: "login-email", type: "email", autocomplete: "username", required: true, placeholder: "you@example.com" });
    const pass = h("input", { id: "login-pass", type: "password", autocomplete: "current-password", required: true, placeholder: "••••••••" });
    const error = h("p", { class: "form-error", role: "alert", hidden: !message, text: message || "" });
    const submit = btn("Sign in", "login", "btn-primary btn-block", null, { type: "submit" });
    const form = h("form", { class: "auth-form", novalidate: true },
      h("div", { class: "field" }, h("label", { for: "login-email", text: "Email" }), email),
      h("div", { class: "field" }, h("label", { for: "login-pass", text: "Password" }), withReveal(pass)),
      error, submit);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!email.value || !pass.value) { error.textContent = "Enter your email and password."; error.hidden = false; return; }
      submit.disabled = true; error.hidden = true;
      const { data, error: err } = await state.client.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
      submit.disabled = false;
      if (err) { error.textContent = /invalid/i.test(err.message) ? "Incorrect email or password." : errMsg(err); error.hidden = false; pass.select(); return; }
      afterLogin(data.user);
    });
    centerCard(
      h("h1", { class: "h-sm", text: "Sign in" }),
      h("p", { class: "text-sm muted-text", text: "Use the account you created in Supabase → Authentication → Users." }),
      form,
      h("a", { class: "auth-back mono", href: "../index.html" }, icon("arrow_back"), "Back to website")
    );
    email.focus();
  }

  function renderNotAdmin(user) {
    const sql = `insert into public.portfolio_admins (user_id)\nvalues ('${user.id}')\non conflict do nothing;`;
    centerCard(
      h("h1", { class: "h-sm", text: "This account isn't an admin yet" }),
      h("p", { class: "text-sm muted-text" }, "You're signed in as ", h("strong", { text: user.email }), ". To allow it to edit the portfolio, run this in the Supabase SQL Editor, then reload:"),
      h("pre", { class: "code-snippet mono", text: sql }),
      h("div", { class: "btn-row" },
        btn("Copy SQL", "content_copy", "btn-cream btn-sm", () => copyText(sql)),
        btn("Reload", "refresh", "btn-primary btn-sm", () => location.reload()),
        btn("Sign out", "logout", "btn-text", signOut))
    );
  }

  /* ================================ auth flow ================================ */
  async function init() {
    if (!CFG.url || !CFG.publishableKey) return renderNotConfigured();
    if (!window.supabase || !window.supabase.createClient) {
      return centerCard(h("p", { class: "form-error", text: "Could not load the Supabase library. Check your internet connection and reload." }));
    }
    const baseUrl = CFG.url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
    state.client = window.supabase.createClient(baseUrl, CFG.publishableKey.trim(), {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    state.client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { state.user = null; state.dirty.clear(); updateDirtyUI(); renderLogin(); }
    });
    const { data } = await state.client.auth.getSession();
    if (data && data.session) afterLogin(data.session.user);
    else renderLogin();
  }

  async function afterLogin(user) {
    state.user = user;
    app.replaceChildren(h("div", { class: "adm-center" }, h("p", { class: "mono muted", text: "Loading your content…" })));
    const adminCheck = await state.client.from("portfolio_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (adminCheck.error) return renderSetupError(errMsg(adminCheck.error));
    if (!adminCheck.data) return renderNotAdmin(user);
    await loadSections();
  }

  async function signOut() {
    if (state.dirty.size && !window.confirm("You have unsaved changes. Sign out anyway?")) return;
    state.dirty.clear();
    await state.client.auth.signOut();
  }

  /* One-time setup of the Resume feature: adds the "resume" settings section
     and a Resume link in the site navigation (before Contact). */
  const RESUME_DEFAULTS = {
    headline: "",
    profileSummary: "",
    website: "",
    paperSize: "Letter",
    maxProjects: 4,
    showSummary: true,
    showExperience: true,
    showEducation: true,
    showSkills: true,
    showProjects: true,
    showCertifications: true,
    showReferences: true,
    showPhoto: false,
    references: "Available upon request.",
    additional: [{ title: "Languages", text: "English (Professional), Filipino (Native)" }],
    eyebrow: "Resume",
    note: "Generated from my portfolio and always up to date.",
    downloadLabel: "Download PDF",
    downloadHint: "Choose “Save as PDF” in the print window."
  };

  async function setUpResume() {
    const { error } = await state.client.from("portfolio_sections")
      .insert({ key: "resume", content: RESUME_DEFAULTS, sort_order: state.order.length });
    if (error) { toast("Couldn't add the Resume section: " + errMsg(error), "error"); return false; }
    const site = state.sections.site;
    if (site && Array.isArray(site.nav) && !site.nav.some((n) => n.href === "resume.html")) {
      const nav = site.nav.slice();
      const at = nav.findIndex((n) => n.id === "contact");
      nav.splice(at === -1 ? nav.length : at, 0, { id: "resume", label: "Resume", href: "resume.html" });
      await state.client.from("portfolio_sections").update({ content: { ...site, nav } }).eq("key", "site");
    }
    toast("Resume added — open the Resume section to choose what it shows", "info");
    return true;
  }

  async function loadSections() {
    const { data, error } = await state.client.from("portfolio_sections").select("key, content, sort_order, updated_at").order("sort_order");
    if (error) return renderSetupError(errMsg(error));
    state.sections = {}; state.saved = {}; state.updated = {}; state.order = [];
    for (const row of data) {
      state.sections[row.key] = row.content;
      state.saved[row.key] = JSON.stringify(row.content);
      state.updated[row.key] = row.updated_at;
      state.order.push(row.key);
    }
    if (state.order.length && !state.sections.resume) {
      if (await setUpResume()) return loadSections();
    }
    SNAPSHOT = clone(state.sections);
    if (!state.current || !state.sections[state.current]) state.current = state.order[0] || null;
    state.view = state.order.length ? (state.view === "section" ? "section" : state.view) : "import";
    renderShell();
  }

  /* ================================ shell ================================ */
  function themeToggle() {
    const b = h("button", { type: "button", class: "theme-toggle" }, icon("dark_mode"));
    const sync = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      b.firstChild.textContent = dark ? "light_mode" : "dark_mode";
      b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    };
    b.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("portfolio-theme", next); } catch (e) { /* ignore */ }
      sync();
    });
    sync();
    return b;
  }

  function renderShell() {
    const site = state.sections.site || {};
    app.replaceChildren(
      h("header", { class: "adm-top" },
        h("div", { class: "adm-top-brand" },
          h("span", { class: "brand-mono brand-mono--md", text: site.monogram || "KA" }),
          h("span", {}, h("strong", { text: "Portfolio Admin" }), h("small", { class: "mono", text: state.user.email }))),
        h("div", { class: "adm-top-actions" },
          h("a", { class: "btn btn-cream btn-sm", href: "../index.html", target: "_blank", rel: "noopener" }, icon("open_in_new"), h("span", { class: "hide-sm", text: "View site" })),
          themeToggle(),
          h("button", { type: "button", class: "icon-btn", title: "Sign out", "aria-label": "Sign out", onClick: signOut }, icon("logout")))),
      h("div", { class: "adm-body" },
        h("nav", { class: "adm-side", id: "admSide", "aria-label": "Admin sections" }),
        h("main", { class: "adm-main", id: "admMain", tabindex: "-1" }))
    );
    renderSide();
    renderView();
  }

  function renderSide() {
    const side = $("#admSide");
    const item = (key, label, iconName, view) => {
      const active = state.view === view && (view !== "section" || state.current === key);
      return h("button", {
        type: "button", class: "side-link" + (active ? " is-active" : ""), "aria-current": active ? "page" : null,
        dataset: view === "section" ? { sideKey: key } : {},
        onClick: () => {
          if (active || !confirmLeave()) return;
          if (state.view === "section" && state.dirty.has(state.current)) discardChanges(false);
          state.view = view; if (view === "section") state.current = key;
          renderSide(); renderView(); window.scrollTo(0, 0);
        }
      }, icon(iconName), h("span", { text: label }), h("span", { class: "dirty-dot", "aria-label": "unsaved", title: "Unsaved changes" }));
    };
    side.replaceChildren(
      h("p", { class: "side-title mono", text: "Content" }),
      ...state.order.map((k) => item(k, (SECTION_META[k] || {}).title || humanize(k), (SECTION_META[k] || {}).icon || "article", "section")),
      h("p", { class: "side-title mono", text: "Library" }),
      item("media", "Images", "photo_library", "media"),
      item("tools", "Backup & import", "inventory_2", "tools"),
      item("account", "Account", "manage_accounts", "account")
    );
    updateDirtyUI();
  }

  function renderView() {
    if (state.view === "import" || !state.order.length) return renderImport();
    if (state.view === "media") return renderMedia();
    if (state.view === "tools") return renderTools();
    if (state.view === "account") return renderAccount();
    return renderSection();
  }

  /* =============================== empty database =============================== */
  function renderImport() {
    const main = $("#admMain");
    const fileInput = backupRestoreInput();
    main.replaceChildren(h("section", { class: "panel card empty-panel" },
      icon("database", "empty-icon"),
      h("h1", { class: "h-md", text: "Your database is empty" }),
      h("p", { class: "text-sm muted-text", text: "Restore your content from a backup file (made with Backup & restore → Download backup)." }),
      btn("Restore from backup…", "upload_file", "btn-primary", () => fileInput.click()), fileInput));
  }

  /* =============================== section editor =============================== */
  function renderSection() {
    const key = state.current;
    const data = state.sections[key];
    const meta = SECTION_META[key] || { title: humanize(key), desc: "" };
    const main = $("#admMain");
    const y = window.scrollY;

    // retired fields: removed from the form (and from the database on the next save)

    const scalars = Object.keys(data).filter((k) => !isObj(data[k]) && !Array.isArray(data[k]));
    const complex = Object.keys(data).filter((k) => isObj(data[k]) || Array.isArray(data[k]));

    const saveBtn = btn("Save", "save", "btn-primary btn-sm", () => saveSection(key), { id: "headSaveBtn", disabled: !state.dirty.has(key) });
    const head = h("div", { class: "adm-head" },
      h("div", {},
        h("p", { class: "eyebrow-sm eyebrow-sm--green", text: "Editing section" }),
        h("h1", { class: "h-md", text: meta.title }),
        h("p", { class: "text-sm muted-text", text: meta.desc }),
        state.updated[key] ? h("p", { class: "mono updated-at", text: "Last saved " + fmtDate(state.updated[key]) }) : null),
      h("div", { class: "adm-head-actions" },
        saveBtn));

    const panels = [];
    if (scalars.length) panels.push(panel("General", null, objectFields(data, scalars, key)));
    for (const k of complex) {
      const path = `${key}.${k}`;
      let body;
      if (Array.isArray(data[k])) body = arrayEditor(data, k, path);
      else if (MAP_PATHS.has(normPath(path))) body = mapEditor(data, k, path);
      else body = objectFields(data[k], Object.keys(data[k]), path);
      panels.push(panel(humanize(k), Array.isArray(data[k]) ? `${data[k].length} item${data[k].length === 1 ? "" : "s"}` : null, body));
    }
    main.replaceChildren(head, ...panels);
    window.scrollTo(0, y);
    updateDirtyUI();
  }

  function panel(title, meta, body) {
    return h("section", { class: "panel card" },
      h("header", { class: "panel-head" }, h("h2", { class: "h-xs", text: title }), meta ? h("span", { class: "tag tag--sand", text: meta }) : null),
      body);
  }

  /** Grid of fields for the given keys of obj. */
  function objectFields(obj, keys, path) {
    const grid = h("div", { class: "fields" });
    for (const k of keys) grid.append(fieldFor(obj, k, `${path}.${k}`));
    return grid;
  }

  function fieldFor(parent, key, path) {
    const v = parent[key];
    if (Array.isArray(v)) return h("div", { class: "field span-2" }, h("p", { class: "field-label", text: humanize(key) }), arrayEditor(parent, key, path));
    if (isObj(v)) {
      const body = MAP_PATHS.has(normPath(path)) ? mapEditor(parent, key, path) : objectFields(v, Object.keys(v), path);
      return h("fieldset", { class: "subgroup span-2" }, h("legend", { text: humanize(key) }), body);
    }
    if (typeof v === "boolean") return boolField(parent, key);
    if (typeof v === "number") return numberField(parent, key);
    if (ENUMS[key]) return enumField(parent, key);
    if (isImageKey(key, v)) return imageField(parent, key);
    if (isIconKey(key)) return iconField(parent, key);
    return textField(parent, key);
  }

  function labelFor(id, key) {
    return h("label", { for: id, class: "field-label" }, humanize(key));
  }
  const hint = (key) => (HINTS[key] ? h("small", { class: "field-hint", text: HINTS[key] }) : null);

  function textField(parent, key) {
    const id = uid();
    const value = parent[key] == null ? "" : String(parent[key]);
    const long = TEXTAREA_KEYS.test(key) || value.length > 70;
    const ctrl = long
      ? h("textarea", { id, rows: Math.min(8, Math.max(3, Math.ceil(value.length / 70))), value })
      : h("input", { id, type: /^(email)$/.test(key) ? "email" : "text", value });
    ctrl.addEventListener("input", () => { parent[key] = ctrl.value; markDirty(); });
    return h("div", { class: "field" + (long ? " span-2" : "") }, labelFor(id, key), ctrl, hint(key));
  }

  function enumField(parent, key) {
    const id = uid();
    const sel = h("select", { id }, ...ENUMS[key].map((o) => h("option", { value: o, text: o })));
    sel.value = parent[key] || ENUMS[key][0];
    sel.addEventListener("change", () => { parent[key] = sel.value; markDirty(); });
    return h("div", { class: "field" }, labelFor(id, key), sel, hint(key));
  }

  function numberField(parent, key) {
    const id = uid();
    const num = h("input", { id, type: "number", value: String(parent[key]), step: "any" });
    if (key === "percent") {
      num.min = 0; num.max = 100;
      const range = h("input", { type: "range", min: "0", max: "100", value: String(parent[key]), "aria-label": humanize(key) + " slider" });
      range.addEventListener("input", () => { num.value = range.value; parent[key] = Number(range.value); markDirty(); });
      num.addEventListener("input", () => { range.value = num.value; parent[key] = Number(num.value) || 0; markDirty(); });
      return h("div", { class: "field" }, labelFor(id, key), h("div", { class: "range-row" }, range, num), hint(key));
    }
    num.addEventListener("input", () => { parent[key] = Number(num.value) || 0; markDirty(); });
    return h("div", { class: "field" }, labelFor(id, key), num, hint(key));
  }

  function boolField(parent, key) {
    const id = uid();
    const cb = h("input", { id, type: "checkbox", checked: parent[key] });
    cb.addEventListener("change", () => { parent[key] = cb.checked; markDirty(); });
    return h("div", { class: "field field--check" }, h("label", { for: id, class: "check" }, cb, h("span", { class: "check-box", "aria-hidden": "true" }), h("span", { text: humanize(key) })), hint(key));
  }

  function iconField(parent, key) {
    const id = uid();
    const preview = icon(parent[key] || "help", "icon-preview");
    const input = h("input", { id, type: "text", value: parent[key] || "", spellcheck: "false", autocomplete: "off" });
    input.addEventListener("input", () => { parent[key] = input.value.trim(); preview.textContent = input.value.trim() || "help"; markDirty(); });
    return h("div", { class: "field" }, labelFor(id, key),
      h("div", { class: "input-with" }, h("span", { class: "icon-box icon-box--cream" }, preview), input,
        h("a", { class: "icon-btn", href: "https://fonts.google.com/icons", target: "_blank", rel: "noopener noreferrer", title: "Browse icons", "aria-label": "Browse icons" }, icon("search"))),
      hint(key));
  }

  function imageField(parent, key) {
    const id = uid();
    const img = h("img", { alt: "", class: "img-preview", src: previewSrc(parent[key]) });
    const empty = h("span", { class: "img-empty" }, icon("image"));
    const thumb = h("div", { class: "img-thumb" }, img, empty);
    const input = h("input", { id, type: "text", value: parent[key] || "", placeholder: "No image" });
    const sync = () => {
      const has = !!input.value.trim();
      img.hidden = !has; empty.hidden = has;
      if (has) img.src = previewSrc(input.value.trim());
    };
    const set = (val) => { input.value = val; parent[key] = val; sync(); markDirty(); };
    img.addEventListener("error", () => { img.hidden = true; empty.hidden = false; });
    input.addEventListener("input", () => { parent[key] = input.value.trim(); sync(); markDirty(); });

    const file = h("input", { type: "file", accept: IMAGE_TYPES.join(","), hidden: true });
    file.addEventListener("change", async () => {
      const f = file.files[0]; file.value = "";
      if (!f) return;
      upBtn.disabled = true;
      const url = await uploadFile(f);
      upBtn.disabled = false;
      if (url) { set(url); toast("Image uploaded — remember to save"); }
    });
    const upBtn = btn("Upload", "upload", "btn-cream btn-sm", () => file.click());
    sync();
    return h("div", { class: "field span-2" }, labelFor(id, key),
      h("div", { class: "image-field" }, thumb,
        h("div", { class: "image-field-main" }, input,
          h("div", { class: "btn-row" }, upBtn, file,
            btn("Choose from library", "photo_library", "btn-cream btn-sm", () => openMediaPicker(set)),
            btn("Remove", "close", "btn-text btn-sm", () => set(""))))),
      hint(key));
  }

  /* ---------- arrays ---------- */
  function itemTitle(item, i) {
    if (!isObj(item)) return String(item || `Item ${i + 1}`);
    const t = item.title || item.name || item.label || item.degree || item.filterLabel || item.period || item.caption || item.key || item.id;
    return t ? String(t) : `Item ${i + 1}`;
  }
  function itemSub(item) {
    if (!isObj(item)) return "";
    return String(item.level || item.type || item.badge || item.category || item.issuer || item.value || item.tag || "");
  }

  function arrayEditor(parent, key, path) {
    const arr = parent[key];
    const tpl = itemTemplate(arr, path);
    const objects = isObj(tpl);
    const wrap = h("div", { class: "array" + (objects ? "" : " array--simple") });

    const move = (i, d) => {
      const j = i + d;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      const a = `${path}.${i}`, b = `${path}.${j}`;
      const ao = state.open.has(a), bo = state.open.has(b);
      state.open.delete(a); state.open.delete(b);
      if (ao) state.open.add(b); if (bo) state.open.add(a);
      markDirty(); renderSection();
    };
    const remove = (i) => {
      if (objects && !window.confirm(`Delete "${itemTitle(arr[i], i)}"?`)) return;
      arr.splice(i, 1); state.open.clear(); markDirty(); renderSection();
    };
    const duplicate = (i) => {
      arr.splice(i + 1, 0, clone(arr[i])); state.open.add(`${path}.${i + 1}`); markDirty(); renderSection();
    };
    const tools = (i) => h("span", { class: "item-tools" },
      h("button", { type: "button", class: "icon-btn icon-btn--sm", title: "Move up", "aria-label": "Move up", disabled: i === 0, onClick: (e) => { e.preventDefault(); move(i, -1); } }, icon("arrow_upward")),
      h("button", { type: "button", class: "icon-btn icon-btn--sm", title: "Move down", "aria-label": "Move down", disabled: i === arr.length - 1, onClick: (e) => { e.preventDefault(); move(i, 1); } }, icon("arrow_downward")),
      objects ? h("button", { type: "button", class: "icon-btn icon-btn--sm", title: "Duplicate", "aria-label": "Duplicate", onClick: (e) => { e.preventDefault(); duplicate(i); } }, icon("content_copy")) : null,
      h("button", { type: "button", class: "icon-btn icon-btn--sm icon-btn--danger", title: "Delete", "aria-label": "Delete", onClick: (e) => { e.preventDefault(); remove(i); } }, icon("delete")));

    arr.forEach((item, i) => {
      const ipath = `${path}.${i}`;
      if (objects) {
        if (!isObj(item)) { arr[i] = item = blank(tpl); }
        ensureKeys(item, tpl);
        const titleEl = h("span", { class: "item-title", text: itemTitle(item, i) });
        const subEl = h("span", { class: "item-sub mono", text: itemSub(item) });
        const det = h("details", { class: "item", open: state.open.has(ipath) },
          h("summary", {}, icon("chevron_right", "item-chevron"), h("span", { class: "item-text" }, titleEl, subEl), tools(i)),
          h("div", { class: "item-body" }, objectFields(item, Object.keys(item), ipath)));
        det.addEventListener("toggle", () => { det.open ? state.open.add(ipath) : state.open.delete(ipath); });
        det.addEventListener("input", () => { titleEl.textContent = itemTitle(item, i); subEl.textContent = itemSub(item); });
        wrap.append(det);
      } else {
        const id = uid();
        const input = h("input", { id, type: "text", value: item == null ? "" : String(item), "aria-label": `${humanize(key)} ${i + 1}` });
        input.addEventListener("input", () => { arr[i] = typeof tpl === "number" ? Number(input.value) || 0 : input.value; markDirty(); });
        wrap.append(h("div", { class: "simple-item" }, input, tools(i)));
      }
    });

    wrap.append(btn(objects ? `Add ${humanize(key).replace(/s$/, "").toLowerCase()}` : "Add", "add", "btn-cream btn-sm add-btn", () => {
      arr.push(objects ? blank(tpl) : (typeof tpl === "number" ? 0 : ""));
      state.open.add(`${path}.${arr.length - 1}`);
      markDirty(); renderSection();
    }));
    return wrap;
  }

  /* ---------- maps (objects keyed by user IDs, e.g. projects.modals) ---------- */
  function mapEditor(parent, key, path) {
    const map = parent[key];
    const tpl = unionShape(Object.values(map).concat(valuesAt(SNAPSHOT, normPath(path).split(".")).flatMap((m) => (isObj(m) ? Object.values(m) : []))));
    const wrap = h("div", { class: "array" });
    const rebuild = (entries) => { parent[key] = Object.fromEntries(entries); markDirty(); renderSection(); };

    Object.keys(map).forEach((id) => {
      const ipath = `${path}.${id}`;
      const item = map[id];
      ensureKeys(item, tpl);
      const idInput = h("input", { type: "text", value: id, "aria-label": "Popup ID", spellcheck: "false" });
      idInput.addEventListener("change", () => {
        const next = idInput.value.trim().replace(/\s+/g, "-");
        if (!next || next === id) { idInput.value = id; return; }
        if (next in map) { toast(`ID "${next}" already exists`, "error"); idInput.value = id; return; }
        rebuild(Object.entries(map).map(([k, v]) => [k === id ? next : k, v]));
        toast(`Renamed — update any buttons that used "${id}"`, "info");
      });
      const det = h("details", { class: "item", open: state.open.has(ipath) },
        h("summary", {}, icon("chevron_right", "item-chevron"),
          h("span", { class: "item-text" }, h("span", { class: "item-title", text: itemTitle(item, 0) }), h("span", { class: "item-sub mono", text: "id: " + id })),
          h("span", { class: "item-tools" }, h("button", {
            type: "button", class: "icon-btn icon-btn--sm icon-btn--danger", title: "Delete", "aria-label": "Delete",
            onClick: (e) => { e.preventDefault(); if (window.confirm(`Delete popup "${id}"?`)) rebuild(Object.entries(map).filter(([k]) => k !== id)); }
          }, icon("delete")))),
        h("div", { class: "item-body" },
          h("div", { class: "fields" }, h("div", { class: "field" }, h("p", { class: "field-label", text: "Popup ID" }), idInput, h("small", { class: "field-hint", text: "Used by project buttons (the Modal field)" }))),
          objectFields(item, Object.keys(item), ipath)));
      det.addEventListener("toggle", () => { det.open ? state.open.add(ipath) : state.open.delete(ipath); });
      wrap.append(det);
    });

    const newId = h("input", { type: "text", placeholder: "new-popup-id", "aria-label": "New popup ID", spellcheck: "false" });
    wrap.append(h("div", { class: "add-row" }, newId, btn("Add popup", "add", "btn-cream btn-sm", () => {
      const id = newId.value.trim().replace(/\s+/g, "-");
      if (!id) return toast("Type an ID for the new popup first", "error");
      if (id in map) return toast(`ID "${id}" already exists`, "error");
      map[id] = blank(tpl); state.open.add(`${path}.${id}`); markDirty(); renderSection();
    })));
    return wrap;
  }

  /* ---------- save / reset / discard ---------- */
  async function saveSection(key) {
    if (!state.dirty.has(key)) return;
    const content = state.sections[key];
    pruneAdded(content);
    const buttons = [$("#headSaveBtn"), $("#saveBarBtn")].filter(Boolean);
    buttons.forEach((b) => (b.disabled = true));
    const { data, error } = await state.client.from("portfolio_sections")
      .update({ content }).eq("key", key).select("updated_at").maybeSingle();
    buttons.forEach((b) => (b.disabled = false));
    if (error || !data) {
      toast(error ? errMsg(error) : "Not saved — your account may not have admin rights.", "error");
      renderSection();
      return;
    }
    state.saved[key] = JSON.stringify(content);
    state.updated[key] = data.updated_at;
    state.dirty.delete(key);
    toast(`${(SECTION_META[key] || {}).title || humanize(key)} saved — live on your site`);
    if (state.current === key && state.view === "section") renderSection();
    else updateDirtyUI();
  }

  function discardChanges(rerender = true) {
    const key = state.current;
    if (!key || !(key in state.saved)) return;
    state.sections[key] = JSON.parse(state.saved[key]);
    state.dirty.delete(key);
    if (rerender) { renderSection(); toast("Changes discarded", "info"); }
    updateDirtyUI();
  }

  $("#saveBarBtn").addEventListener("click", () => saveSection(state.current));
  $("#discardBtn").addEventListener("click", () => { if (window.confirm("Discard all unsaved changes in this section?")) discardChanges(); });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && state.view === "section" && state.current) {
      e.preventDefault(); saveSection(state.current);
    }
  });

  /* ================================ media ================================ */
  /* Photos are resized (max 1920 px on the longest side) and re-encoded as WebP
     in the browser before uploading, so the website downloads far less data.
     GIFs (may be animated) and files that wouldn't get smaller are kept as-is. */
  const MAX_ORIGINAL = 25 * 1024 * 1024;  // largest file accepted before compression
  const MAX_DIMENSION = 1920;
  const WEBP_QUALITY = 0.82;

  function validateFile(f) {
    if (!IMAGE_TYPES.includes(f.type)) return "Only JPG, PNG, WebP or GIF images are allowed.";
    if (f.size > (f.type === "image/gif" ? MAX_UPLOAD : MAX_ORIGINAL)) {
      return `Image is too large (max ${(f.type === "image/gif" ? MAX_UPLOAD : MAX_ORIGINAL) / 1048576} MB).`;
    }
    return null;
  }

  async function compressImage(f) {
    if (f.type === "image/gif" || !window.createImageBitmap) return f;
    let bitmap;
    try { bitmap = await createImageBitmap(f); } catch (e) { return f; }
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale), hgt = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = hgt;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, hgt);
    if (bitmap.close) bitmap.close();
    const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", WEBP_QUALITY));
    // keep the original if the browser can't make WebP or the result isn't smaller
    if (!blob || blob.type !== "image/webp" || (blob.size >= f.size && scale === 1)) return f;
    return new File([blob], f.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  }

  async function uploadFile(original) {
    const problem = validateFile(original);
    if (problem) { toast(`${original.name}: ${problem}`, "error"); return null; }
    const f = await compressImage(original);
    if (f.size > MAX_UPLOAD) { toast(`${original.name}: still larger than ${MAX_UPLOAD / 1048576} MB after compression.`, "error"); return null; }
    if (f !== original) toast(`Optimized ${original.name}: ${fmtSize(original.size)} → ${fmtSize(f.size)}`, "info");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[f.type];
    const base = f.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
    const name = `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await state.client.storage.from(BUCKET).upload(name, f, { contentType: f.type, cacheControl: "31536000", upsert: false });
    if (error) { toast(`Upload failed: ${errMsg(error)}`, "error"); return null; }
    state.media = null;
    return state.client.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  }

  function builtInImages() {
    const found = new Set();
    (function walk(v) {
      if (typeof v === "string" && /^images\/.+\.(jpe?g|png|webp|gif)$/i.test(v)) found.add(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (isObj(v)) Object.values(v).forEach(walk);
    })(state.sections);
    return [...found].map((p) => ({ name: p.split("/").pop(), url: p, builtIn: true }));
  }

  async function listMedia(force) {
    if (state.media && !force) return state.media;
    const { data, error } = await state.client.storage.from(BUCKET).list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;
    const uploaded = (data || []).filter((f) => f.id && f.name !== ".emptyFolderPlaceholder").map((f) => ({
      name: f.name, size: f.metadata && f.metadata.size, created: f.created_at,
      url: state.client.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl, builtIn: false
    }));
    state.media = { uploaded, builtIn: builtInImages() };
    return state.media;
  }

  function isUsed(url) { return JSON.stringify(state.sections).includes(url); }

  function mediaGrid(items, { onPick, onDelete } = {}) {
    if (!items.length) return h("p", { class: "text-sm muted-text", text: "No images yet." });
    return h("ul", { class: "media-grid" }, items.map((m) => h("li", { class: "media-tile card" },
      h("button", { type: "button", class: "media-thumb", title: onPick ? "Use this image" : m.name, onClick: onPick ? () => onPick(m.url) : () => window.open(previewSrc(m.url), "_blank", "noopener") },
        h("img", { src: previewSrc(m.url), alt: m.name, loading: "lazy" })),
      h("div", { class: "media-meta" },
        h("span", { class: "media-name", title: m.name, text: m.name }),
        h("span", { class: "mono media-info", text: m.builtIn ? "built-in" : [fmtSize(m.size), isUsed(m.url) ? "in use" : ""].filter(Boolean).join(" · ") })),
      h("div", { class: "media-actions" },
        onPick ? btn("Use", "check", "btn-primary btn-sm", () => onPick(m.url)) : btn("Copy link", "link", "btn-cream btn-sm", () => copyText(m.builtIn ? m.url : m.url)),
        !onPick && !m.builtIn && onDelete ? h("button", { type: "button", class: "icon-btn icon-btn--danger", title: "Delete", "aria-label": "Delete " + m.name, onClick: () => onDelete(m) }, icon("delete")) : null))));
  }

  function dropZone(onDone) {
    const input = h("input", { type: "file", accept: IMAGE_TYPES.join(","), multiple: true, hidden: true });
    const zone = h("div", { class: "drop-zone", tabindex: "0", role: "button", "aria-label": "Upload images" },
      icon("cloud_upload", "drop-icon"),
      h("strong", { text: "Drop images here or click to upload" }),
      h("small", { class: "mono muted", text: "JPG, PNG, WebP or GIF · photos are auto-resized & compressed" }), input);
    const handle = async (files) => {
      if (!files.length) return;
      zone.classList.add("is-busy");
      const urls = [];
      for (const f of files) { const u = await uploadFile(f); if (u) urls.push(u); }
      zone.classList.remove("is-busy");
      if (urls.length) toast(`Uploaded ${urls.length} image${urls.length > 1 ? "s" : ""}`);
      onDone(urls);
    };
    zone.addEventListener("click", () => input.click());
    zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    input.addEventListener("change", () => { handle([...input.files]); input.value = ""; });
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("is-over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("is-over"); handle([...e.dataTransfer.files]); });
    return zone;
  }

  async function renderMedia() {
    const main = $("#admMain");
    main.replaceChildren(h("div", { class: "adm-head" }, h("div", {},
      h("p", { class: "eyebrow-sm eyebrow-sm--green", text: "Library" }),
      h("h1", { class: "h-md", text: "Images" }),
      h("p", { class: "text-sm muted-text", text: "Images uploaded to your Supabase storage. Pick them from any image field, or copy a link." }))),
      h("p", { class: "mono muted", text: "Loading images…" }));
    let media;
    try { media = await listMedia(true); } catch (err) { main.lastChild.replaceWith(h("p", { class: "form-error", text: errMsg(err) })); return; }
    const del = async (m) => {
      const used = isUsed(m.url);
      if (!window.confirm(used ? `"${m.name}" is used in your content. Delete it anyway? (It will appear broken on the site.)` : `Delete "${m.name}"?`)) return;
      const { error } = await state.client.storage.from(BUCKET).remove([m.name]);
      if (error) return toast(errMsg(error), "error");
      toast("Image deleted"); renderMedia();
    };
    main.lastChild.replaceWith(
      panel("Upload", null, dropZone(() => renderMedia())),
      panel("Uploaded images", `${media.uploaded.length}`, mediaGrid(media.uploaded, { onDelete: del })),
      panel("Built-in images", "images/ folder", h("div", {},
        h("p", { class: "text-xs muted-text", text: "These ship with the website files. To replace one, upload a new image and pick it in the field." }),
        mediaGrid(media.builtIn))));
  }

  const mediaDialog = $("#mediaDialog");
  mediaDialog.addEventListener("click", (e) => { if (e.target === mediaDialog || e.target.closest("[data-close]")) mediaDialog.close(); });

  async function openMediaPicker(onPick) {
    const body = $("#mediaDialogBody");
    const pick = (url) => { mediaDialog.close(); onPick(url); toast("Image selected — remember to save", "info"); };
    body.replaceChildren(h("p", { class: "mono muted", text: "Loading images…" }));
    mediaDialog.showModal();
    try {
      const media = await listMedia();
      body.replaceChildren(
        dropZone((urls) => { if (urls[0]) pick(urls[0]); }),
        h("h3", { class: "eyebrow-sm media-sub", text: "Uploaded" }), mediaGrid(media.uploaded, { onPick: pick }),
        h("h3", { class: "eyebrow-sm media-sub", text: "Built-in" }), mediaGrid(media.builtIn, { onPick: pick }));
    } catch (err) {
      body.replaceChildren(h("p", { class: "form-error", text: errMsg(err) }));
    }
  }

  /* ============================== backup & import ============================== */
  function download(filename, text, type) {
    const a = h("a", { href: URL.createObjectURL(new Blob([text], { type })), download: filename });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function allContent() {
    const out = {};
    state.order.forEach((k) => { out[k] = state.sections[k]; });
    return out;
  }

  /** Hidden file input that restores a backup JSON into the database. */
  function backupRestoreInput() {
    const fileInput = h("input", { type: "file", accept: "application/json,.json", hidden: true });
    fileInput.addEventListener("change", async () => {
      const f = fileInput.files[0]; fileInput.value = "";
      if (!f) return;
      let data;
      try { data = JSON.parse(await f.text()); } catch (e) { return toast("That file isn't valid JSON.", "error"); }
      if (!isObj(data)) return toast("Backup must be an object of sections.", "error");
      const keys = Object.keys(data).filter((k) => isObj(data[k]) && /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/.test(k));
      if (!keys.length) return toast("No sections found in that file.", "error");
      if (!window.confirm(`Restore ${keys.length} section(s) from this backup? This overwrites what's in the database now.`)) return;
      const rows = keys.map((k, i) => ({ key: k, content: data[k], sort_order: state.order.includes(k) ? state.order.indexOf(k) : state.order.length + i }));
      const { error } = await state.client.from("portfolio_sections").upsert(rows, { onConflict: "key" });
      if (error) return toast(errMsg(error), "error");
      state.dirty.clear(); toast("Backup restored");
      state.view = "section"; state.current = null;
      await loadSections();
    });
    return fileInput;
  }

  function renderTools() {
    const stamp = new Date().toISOString().slice(0, 10);
    const fileInput = backupRestoreInput();

    $("#admMain").replaceChildren(
      h("div", { class: "adm-head" }, h("div", {},
        h("p", { class: "eyebrow-sm eyebrow-sm--green", text: "Library" }),
        h("h1", { class: "h-md", text: "Backup & restore" }),
        h("p", { class: "text-sm muted-text", text: "Download a copy of all your content, or restore one." }))),
      panel("Download a backup", null, h("div", { class: "tool-row" },
        h("p", { class: "text-sm muted-text", text: "Save all your content as a JSON file. Keep it somewhere safe." }),
        btn("Download backup (.json)", "download", "btn-primary btn-sm", () => download(`portfolio-backup-${stamp}.json`, JSON.stringify(allContent(), null, 2), "application/json")))),
      panel("Restore a backup", null, h("div", { class: "tool-row" },
        h("p", { class: "text-sm muted-text", text: "Upload a backup JSON file made above. Overwrites the matching sections." }),
        btn("Choose backup file…", "upload_file", "btn-cream btn-sm", () => fileInput.click()), fileInput))
    );
  }

  /* ================================ account ================================ */
  function renderAccount() {
    const p1 = h("input", { id: "np1", type: "password", autocomplete: "new-password", minlength: "8" });
    const p2 = h("input", { id: "np2", type: "password", autocomplete: "new-password", minlength: "8" });
    const err = h("p", { class: "form-error", role: "alert", hidden: true });
    const form = h("form", { class: "account-form", novalidate: true },
      h("div", { class: "fields" },
        h("div", { class: "field" }, h("label", { for: "np1", class: "field-label", text: "New password" }), withReveal(p1), h("small", { class: "field-hint", text: "At least 8 characters" })),
        h("div", { class: "field" }, h("label", { for: "np2", class: "field-label", text: "Confirm new password" }), withReveal(p2))),
      err, btn("Update password", "key", "btn-primary btn-sm", null, { type: "submit" }));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true;
      if (p1.value.length < 8) { err.textContent = "Password must be at least 8 characters."; err.hidden = false; return; }
      if (p1.value !== p2.value) { err.textContent = "Passwords don't match."; err.hidden = false; return; }
      const { error } = await state.client.auth.updateUser({ password: p1.value });
      if (error) { err.textContent = errMsg(error); err.hidden = false; return; }
      p1.value = p2.value = ""; toast("Password updated");
    });
    $("#admMain").replaceChildren(
      h("div", { class: "adm-head" }, h("div", {},
        h("p", { class: "eyebrow-sm eyebrow-sm--green", text: "Settings" }),
        h("h1", { class: "h-md", text: "Account" }),
        h("p", { class: "text-sm muted-text" }, "Signed in as ", h("strong", { text: state.user.email })))),
      panel("Change password", null, form),
      panel("Sign out", null, h("div", { class: "tool-row" },
        h("p", { class: "text-sm muted-text", text: "Sign out of the admin panel on this device." }),
        btn("Sign out", "logout", "btn-cream btn-sm", signOut))));
  }

  /* ================================ misc ================================ */
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
    catch (e) { window.prompt("Copy this:", text); }
  }

  init().catch((err) => {
    console.error(err);
    centerCard(h("p", { class: "form-error", text: "Something went wrong: " + errMsg(err) }));
  });
})();
