/* Projects page (projects.html) — renders the "projects" section loaded by core.js */
(function () {
  "use strict";
  const { D, esc, icon, isExternal, safeUrl, list, $, $$, pad2, button } = window.Portfolio;

  function renderProjects(root) {
    const p = D.projects, ph = p.philosophy;
    const total = p.items.length;
    const countFor = (id) => p.items.filter((i) => i.category === id).length;

    root.innerHTML = `
      <section class="page-hero page-hero--plain">
        <div class="container">
          <div class="page-hero-grid reveal">
            <div>
              <p class="eyebrow-sm eyebrow-sm--green"><span class="dot" aria-hidden="true"></span>${esc(p.eyebrow)}</p>
              <h1 class="h-xl">${esc(p.title)}</h1>
              <p class="lead">${esc(p.intro)}</p>
            </div>
            <dl class="stat-strip">
              ${list(p.stats, (st) => `
                <div><dt class="mono">${esc(st.label)}</dt><dd${st.value === "{count}" ? ' id="projectCount"' : ""}>${esc(st.value === "{count}" ? pad2(total) : st.value)}</dd></div>`)}
            </dl>
          </div>
          <div class="filter-row reveal">
            <div class="filter-bar" role="group" aria-label="Filter projects">
              <button type="button" class="filter-btn is-active" data-filter="all" aria-pressed="true">${esc(p.allFilterLabel)} <span>(${total})</span></button>
              ${list(p.filters, (f) => `<button type="button" class="filter-btn" data-filter="${esc(f.id)}" aria-pressed="false">${esc(f.label)} <span>(${countFor(f.id)})</span></button>`)}
            </div>
            <p class="filter-hint mono">${icon("tune")}${esc(p.filterHint)}</p>
          </div>
        </div>
      </section>

      <section class="section section--tight-top">
        <div class="container">
          <div class="project-grid" id="projectsGrid">
            ${list(p.items, (it) => `
              <article class="project-card card${it.featured ? " is-featured" : ""} reveal" data-category="${esc(it.category)}">
                <div class="project-media">
                  ${it.image
                    ? `<img src="${esc(it.image)}" alt="${esc(it.imageAlt || it.title)}" loading="lazy" decoding="async" />`
                    : `<div class="project-placeholder" aria-hidden="true">${icon((it.imageBadge && it.imageBadge.icon) || "code")}</div>`}
                  <div class="project-labels">
                    <span class="media-tab mono">${esc(it.typeLabel)}</span>
                    ${it.statusBadge ? `<span class="media-status mono">${it.statusIcon ? icon(it.statusIcon) : '<span class="dot" aria-hidden="true"></span>'}${esc(it.statusBadge)}</span>` : ""}
                  </div>
                  ${it.imageBadge ? `<span class="media-badge mono">${icon(it.imageBadge.icon)}${esc(it.imageBadge.label)}</span>` : ""}
                </div>
                <div class="project-body">
                  <p class="project-meta mono"><span>${esc(it.number)}</span><span>${esc(it.meta)}</span></p>
                  <h2 class="h-md">${esc(it.title)}</h2>
                  <p class="text-sm">${esc(it.text)}</p>
                  <ul class="tag-list">${list(it.tags, (t) => `<li class="tag tag--sand">${esc(t)}</li>`)}</ul>
                  <div class="btn-row project-actions">
                    ${button(it.primaryButton, "btn btn-primary btn-sm")}
                    ${button({ ...it.secondaryButton, iconFirst: true }, "btn btn-cream btn-sm")}
                  </div>
                </div>
              </article>`)}
          </div>
          <div class="empty-state" id="noResults" hidden>
            ${icon("filter_alt_off")}
            <h3 class="h-sm">${esc(p.emptyState.title)}</h3>
            <p>${esc(p.emptyState.text)}</p>
            <button type="button" class="btn btn-primary btn-sm" data-reset>${esc(p.emptyState.button)}</button>
          </div>
        </div>
      </section>

      <section class="section section--sand">
        <div class="container split-5-7">
          <div class="reveal">
            <p class="eyebrow-sm eyebrow-sm--green">${icon(ph.icon)}${esc(ph.eyebrow)}</p>
            <h2 class="h-lg">${esc(ph.title)}</h2>
            <p class="text-md muted-text">${esc(ph.text)}</p>
            <div class="btn-row">
              ${button({ ...ph.primaryButton, iconFirst: true }, "btn btn-primary btn-sm")}
              ${button(ph.linkButton, "btn btn-text mono")}
            </div>
          </div>
          <div class="grid-2">
            ${list(ph.cards, (c) => `
              <article class="mini-card card reveal">
                <p class="mini-card-top">${icon(c.icon)}<span class="mono">${esc(c.tag)}</span></p>
                <h3 class="h-xs">${esc(c.title)}</h3>
                <p class="text-xs">${esc(c.text)}</p>
              </article>`)}
          </div>
        </div>
      </section>

      <dialog class="modal" id="projectModal" aria-labelledby="modalTitle">
        <div class="modal-inner">
          <div class="modal-head">
            <p class="eyebrow-sm eyebrow-sm--green"><span class="dot" aria-hidden="true"></span><span id="modalTag"></span></p>
            <button type="button" class="icon-btn" data-close aria-label="Close dialog">${icon("close")}</button>
          </div>
          <h3 class="h-md" id="modalTitle"></h3>
          <p class="text-md muted-text" id="modalDesc"></p>
          <div class="modal-box">
            <p class="eyebrow-sm">${esc(p.modalLabels.heading)}</p>
            <ul class="modal-list" id="modalList"></ul>
          </div>
          <a class="btn btn-primary" id="modalAction" target="_blank" rel="noopener noreferrer"><span>${esc(p.modalLabels.button)}</span>${icon("open_in_new")}</a>
        </div>
      </dialog>`;

    // ---- filtering
    const grid = $("#projectsGrid", root);
    const cards = $$(".project-card", root);
    const btns = $$(".filter-btn", root);
    const empty = $("#noResults", root);
    const counter = $("#projectCount", root);
    const applyFilter = (f) => {
      let visible = 0;
      btns.forEach((x) => { const on = x.dataset.filter === f; x.classList.toggle("is-active", on); x.setAttribute("aria-pressed", String(on)); });
      cards.forEach((c) => { const show = f === "all" || c.dataset.category === f; c.hidden = !show; if (show) visible++; });
      grid.classList.toggle("is-filtered", f !== "all");
      if (counter) counter.textContent = pad2(visible);
      empty.hidden = visible !== 0;
    };
    btns.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.filter)));
    $("[data-reset]", root).addEventListener("click", () => applyFilter("all"));

    // ---- modal
    const modal = $("#projectModal", root);
    let lastTrigger = null;
    const open = (key) => {
      const m = p.modals[key];
      if (!m) return;
      $("#modalTag", modal).textContent = m.tag || p.modalLabels.fallbackTag;
      $("#modalTitle", modal).textContent = m.title;
      $("#modalDesc", modal).textContent = m.text;
      $("#modalList", modal).innerHTML = list(m.highlights, (x) => `<li>${icon("check_circle")}<span>${esc(x)}</span></li>`);
      const a = $("#modalAction", modal);
      a.href = safeUrl(m.link) || "#";
      if (isExternal(m.link)) { a.target = "_blank"; } else { a.removeAttribute("target"); }
      if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
      document.body.classList.add("no-scroll");
    };
    const close = () => { if (modal.open) modal.close(); };
    modal.addEventListener("close", () => { document.body.classList.remove("no-scroll"); if (lastTrigger) lastTrigger.focus(); });
    modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) close(); });
    $$("[data-modal]", root).forEach((b) => b.addEventListener("click", () => { lastTrigger = b; open(b.dataset.modal); }));
  }

  window.Portfolio.register("projects", renderProjects);
})();
