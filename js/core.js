/* core.js — shared by every page: loads content from Supabase, renders the
   header/footer, theme toggle and scroll animations, then runs the page script. */
(function () {
  "use strict";

  const D = {};                                   // content loaded from the database
  const page = document.body.dataset.page || "home";

  /* ---------- helpers (also used by js/pages/*.js) ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const icon = (name, cls = "") =>
    name ? `<span class="ms${cls ? " " + cls : ""}" aria-hidden="true">${esc(name)}</span>` : "";

  const isExternal = (href) => /^https?:\/\//i.test(href || "");
  // blocks javascript:/data: links in edited content
  const safeUrl = (url) => {
    const s = String(url == null ? "" : url).trim();
    return /^(javascript|data|vbscript):/i.test(s.replace(/[\s\u0000-\u001f]/g, "")) ? "#" : s;
  };
  const hrefAttrs = (href) =>
    `href="${esc(safeUrl(href) || "#")}"${isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : ""}`;

  const list = (arr, fn) => (arr || []).map(fn).join("");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad2 = (n) => (n < 10 ? "0" + n : String(n));

  // link or popup button; b.iconFirst puts the icon before the label
  function button(b, cls, extraAttrs = "") {
    if (!b) return "";
    const ic = icon(b.icon);
    const inner = b.iconFirst ? `${ic}<span>${esc(b.label)}</span>` : `<span>${esc(b.label)}</span>${ic}`;
    if (b.modal) return `<button type="button" class="${cls}" data-modal="${esc(b.modal)}" ${extraAttrs}>${inner}</button>`;
    return `<a class="${cls}" ${hrefAttrs(b.href || b.url)} ${extraAttrs}>${inner}</a>`;
  }

  const brandMark = (size) => D.site.logo
    ? `<img class="brand-logo brand-logo--${size}" src="${esc(D.site.logo)}" alt="" />`
    : `<span class="brand-mono brand-mono--${size}" aria-hidden="true">${esc(D.site.monogram)}</span>`;

  const availabilityBadge = (extra = "") =>
    `<span class="availability ${extra}"><span class="pulse" aria-hidden="true"></span>${esc(D.site.availability)}</span>`;

  /* ---------- header ---------- */
  function renderHeader() {
    const el = $("#site-header");
    if (!el) return;
    const s = D.site;
    el.className = "site-header";
    el.innerHTML = `
      <div class="container header-inner">
        <a class="brand" href="index.html" aria-label="${esc(s.name)} — home">
          ${brandMark("md")}
          <span class="brand-text">
            <span class="brand-name">${esc(s.name)}</span>
            <span class="brand-role">${esc(s.role)}</span>
          </span>
        </a>

        <nav class="site-nav" id="site-nav" aria-label="Primary">
          <ul class="nav-list">
            ${list(s.nav, (n) => `
              <li><a class="nav-link${n.id === page ? " is-active" : ""}" href="${esc(n.href)}"${n.id === page ? ' aria-current="page"' : ""}>${esc(n.label)}</a></li>`)}
          </ul>
          ${availabilityBadge("availability--menu")}
          <a class="btn btn-primary btn-block nav-cta" href="mailto:${esc(s.email)}">${icon("mail")}<span>${esc(s.getInTouchLabel)}</span></a>
        </nav>

        <div class="header-actions">
          ${availabilityBadge("availability--header")}
          <a class="btn btn-primary btn-sm header-cta" href="mailto:${esc(s.email)}">${icon("mail")}<span>${esc(s.getInTouchLabel)}</span></a>
          <button class="theme-toggle" type="button" aria-label="Switch to dark mode">${icon("dark_mode")}</button>
          <a class="avatar" href="contact.html" aria-label="Contact ${esc(s.name)}">${icon("person")}</a>
          <button class="menu-toggle" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Open menu">
            ${icon("menu")}
          </button>
        </div>
      </div>`;

    const toggle = $(".menu-toggle", el);
    const nav = $("#site-nav", el);
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      el.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      $(".ms", toggle).textContent = open ? "close" : "menu";
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", (m) => { if (m.matches) setOpen(false); });

    const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- footer ---------- */
  function renderFooter() {
    const el = $("#site-footer");
    if (!el) return;
    const s = D.site;
    el.className = "site-footer";
    el.innerHTML = `
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <div class="footer-brand-row">${brandMark("sm")}<span class="footer-name">${esc(s.name)}</span></div>
            <p class="footer-tagline">${esc(s.footerTagline)}</p>
            <p class="footer-location mono">${icon("location_on")}<span>${esc(s.location)}</span></p>
          </div>
          <div class="footer-links">
            <ul class="footer-socials">
              ${list(s.socials, (l) => `<li><a class="mono" ${hrefAttrs(l.url)}>${icon(l.icon)}${esc(l.label)}</a></li>`)}
            </ul>
            <a class="footer-email mono" href="mailto:${esc(s.email)}">${esc(s.email)}</a>
          </div>
        </div>
        <div class="footer-bottom mono">
          <span>${esc(s.copyright)}</span>
          <span>${esc(s.footerNote)}</span>
        </div>
      </div>`;
  }

  /* ---------- light / dark theme (initial theme is set in each page's <head>) ---------- */
  const THEME_KEY = "portfolio-theme";
  const currentTheme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

  function applyTheme(theme, animate) {
    const root = document.documentElement;
    if (animate) {
      root.classList.add("theme-transition");
      window.setTimeout(() => root.classList.remove("theme-transition"), 400);
    }
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0f1711" : "#fff9ef");
    $$(".theme-toggle").forEach((btn) => {
      const toDark = theme !== "dark";
      btn.setAttribute("aria-label", toDark ? "Switch to dark mode" : "Switch to light mode");
      btn.setAttribute("title", toDark ? "Dark mode" : "Light mode");
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      $(".ms", btn).textContent = toDark ? "dark_mode" : "light_mode";
    });
  }

  function initTheme() {
    applyTheme(currentTheme(), false);
    $$(".theme-toggle").forEach((btn) => btn.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next, true);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage blocked */ }
    }));
    // follow the system setting unless the visitor chose a theme
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      let saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (err) { /* ignore */ }
      if (!saved) applyTheme(e.matches ? "dark" : "light", true);
    });
  }

  /* ---------- fade-in on scroll ---------- */
  function initReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- secret shortcut to the admin panel (the login still protects it) ----------
     Computer: type ADMIN_WORD anywhere on the page (not inside a form field).
     Phone:    tap the logo in the footer 5 times within 2 seconds. */
  const ADMIN_WORD = "kaedit";
  const ADMIN_URL = "admin/index.html";
  function initAdminShortcut() {
    let typed = "";
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
      typed = (typed + e.key.toLowerCase()).slice(-ADMIN_WORD.length);
      if (typed === ADMIN_WORD) window.location.href = ADMIN_URL;
    });
    const logo = $(".footer-brand-row");
    if (!logo) return;
    let taps = 0, timer = null;
    logo.addEventListener("click", () => {
      taps += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { taps = 0; }, 2000);
      if (taps >= 5) window.location.href = ADMIN_URL;
    });
  }

  /* ---------- icon font: request only the icons used on this page (~2 KB vs ~4 MB) ---------- */
  const UI_ICONS = ["menu", "close", "dark_mode", "light_mode", "check", "check_circle", "content_copy", "open_in_new"];
  function loadIconFont() {
    const names = new Set(UI_ICONS);
    $$(".ms").forEach((el) => {
      const n = el.textContent.trim();
      if (/^[a-z0-9_]+$/.test(n)) names.add(n);
    });
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
      + "&icon_names=" + [...names].sort().join(",") + "&display=block";
    document.head.appendChild(link);
  }

  /* ---------- page registry ---------- */
  const renderers = {};
  window.Portfolio = {
    D, page, esc, icon, isExternal, safeUrl, hrefAttrs, list, $, $$, pad2, button,
    register(name, fn) { renderers[name] = fn; }   // called by js/pages/<page>.js
  };

  /* ---------- content: "site" (header/footer) + this page's section,
     or the sections listed in <body data-sections="..."> (used by the resume) ---------- */
  const extraSections = (document.body.dataset.sections || "").split(",").map((s) => s.trim()).filter(Boolean);
  async function loadContent() {
    const cfg = window.SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.publishableKey) throw new Error("Supabase is not configured (js/supabase-config.js).");
    const base = cfg.url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
    const keys = [...new Set(["site", ...(extraSections.length ? extraSections : [page])])];
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(
        `${base}/rest/v1/portfolio_sections?select=key,content&key=in.(${keys.map(encodeURIComponent).join(",")})`,
        { headers: { apikey: cfg.publishableKey, Accept: "application/json" }, signal: ctrl.signal }
      );
      if (!res.ok) throw new Error(`Database error (HTTP ${res.status}).`);
      const rows = await res.json();
      rows.forEach((r) => { if (r && r.key && r.content && typeof r.content === "object") D[r.key] = r.content; });
      if (!D.site || (!extraSections.length && !D[page])) throw new Error("This page's content is missing from the database.");
    } catch (err) {
      throw err.name === "AbortError" ? new Error("The database took too long to respond.") : err;
    } finally {
      clearTimeout(timer);
    }
  }

  function renderLoadError(main, err) {
    console.error("[portfolio]", err);
    main.innerHTML = `
      <div class="container load-error" role="alert">
        ${icon("cloud_off")}
        <h1 class="h-sm">Content couldn't be loaded</h1>
        <p class="text-sm muted-text">Please check your internet connection and try again.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="location.reload()">${icon("refresh")}<span>Try again</span></button>
      </div>`;
  }

  async function boot() {
    const main = $("#main");
    try {
      await loadContent();
    } catch (err) {
      if (main) renderLoadError(main, err);
      initTheme();
      loadIconFont();
      return;
    }
    renderHeader();
    renderFooter();
    initTheme();
    initAdminShortcut();
    if (main && renderers[page]) {
      renderers[page](main);
      if (D[page] && D[page].pageTitle) document.title = D[page].pageTitle;
    }
    initReveal();
    loadIconFont();
  }

  // page scripts load after this file, so wait until they have registered
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
