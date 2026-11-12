/* Skills page (skills.html) — renders the "skills" section loaded by core.js */
(function () {
  "use strict";
  const { D, esc, icon, list, $$, button } = window.Portfolio;

  function renderSkills(root) {
    const s = D.skills, pr = s.principles;
    root.innerHTML = `
      <section class="page-hero page-hero--plain">
        <div class="container">
          <div class="skills-topbar reveal">
            <p class="pill pill--cream mono upper"><span class="dot" aria-hidden="true"></span>${esc(s.indexLabel)} <span class="muted">/</span> ${esc(s.indexTitle)}</p>
            <p class="pill pill--sand mono"><span class="muted">${esc(s.reviewLabel)}</span> ${esc(s.reviewValue)}</p>
          </div>
          <div class="page-hero-grid reveal">
            <div>
              <p class="eyebrow-code mono">${esc(s.eyebrow)}</p>
              <h1 class="h-xl">${esc(s.title)}</h1>
              <p class="lead">${esc(s.intro)}</p>
            </div>
            <div class="stat-card">
              <div><strong class="stat-value">${esc(s.stat.value)}</strong><span>${esc(s.stat.label)}</span></div>
              <span class="icon-box icon-box--sage">${icon(s.stat.icon)}</span>
            </div>
          </div>
          <div class="filter-bar reveal" role="group" aria-label="Filter skills">
            <button type="button" class="filter-btn is-active" data-filter="all" aria-pressed="true">${esc(s.allFilterLabel)}</button>
            ${list(s.categories, (c) => `<button type="button" class="filter-btn" data-filter="${esc(c.id)}" aria-pressed="false">${esc(c.filterLabel)}</button>`)}
          </div>
        </div>
      </section>

      <section class="section section--tight-top">
        <div class="container skill-groups">
          ${list(s.categories, (c) => `
            <section class="skill-group" data-category="${esc(c.id)}" aria-labelledby="cat-${esc(c.id)}">
              <header class="group-head reveal">
                <span class="icon-box icon-box--sage">${icon(c.icon)}</span>
                <div>
                  <h2 class="h-md" id="cat-${esc(c.id)}">${esc(c.title)}</h2>
                  <p class="group-sub">${esc(c.subtitle)}</p>
                </div>
                <span class="tag tag--sand group-badge">${esc(c.badge)}</span>
              </header>
              <div class="skill-grid" style="--cols:${Math.min(c.items.length, 4)}">
                ${list(c.items, (it) => `
                  <article class="skill-card card reveal">
                    <div class="skill-card-top">
                      <span class="icon-box icon-box--cream">${icon(it.icon)}</span>
                      <span class="tag tag--sage">${esc(it.level)}</span>
                    </div>
                    <h3 class="h-sm">${esc(it.name)}</h3>
                    <p class="text-sm">${esc(it.text)}</p>
                    <div class="skill-card-bottom">
                      <ul class="tag-list">${list(it.tags, (t) => `<li class="tag tag--sand">${esc(t)}</li>`)}</ul>
                      <div class="meter" role="meter" aria-label="${esc(it.name)} proficiency" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(it.percent) || 0}">
                        <span style="--w:${Number(it.percent) || 0}%"></span>
                      </div>
                    </div>
                  </article>`)}
              </div>
            </section>`)}
        </div>
      </section>

      <section class="section section--sand">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow-code mono">${esc(pr.eyebrow)}</p>
            <h2 class="h-lg">${esc(pr.title)}</h2>
            <p class="lead lead--narrow">${esc(pr.text)}</p>
          </div>
          <div class="grid-3">
            ${list(pr.cards, (c) => `
              <article class="principle-card card reveal">
                <div class="principle-body">
                  <span class="icon-box icon-box--sage">${icon(c.icon)}</span>
                  <p class="eyebrow-sm">${esc(c.label)}</p>
                  <h3 class="h-sm">${esc(c.title)}</h3>
                  <p class="text-sm">${esc(c.text)}</p>
                </div>
                <div class="principle-foot mono"><span>${esc(c.footer)}</span>${icon(c.footerIcon)}</div>
              </article>`)}
          </div>

          <div class="cta-panel cta-panel--compact reveal">
            <div class="cta-copy">
              <p class="eyebrow-sm eyebrow-sm--light"><span class="dot dot--light" aria-hidden="true"></span>${esc(s.cta.eyebrow)}</p>
              <h2 class="h-md">${esc(s.cta.title)}</h2>
              <p>${esc(s.cta.text)}</p>
            </div>
            ${button(s.cta.button, "btn btn-white mono")}
          </div>
        </div>
      </section>`;

    // filtering
    const btns = $$(".filter-btn", root);
    const groups = $$(".skill-group", root);
    btns.forEach((b) => b.addEventListener("click", () => {
      const f = b.dataset.filter;
      btns.forEach((x) => { const on = x === b; x.classList.toggle("is-active", on); x.setAttribute("aria-pressed", String(on)); });
      groups.forEach((g) => { g.hidden = !(f === "all" || g.dataset.category === f); });
    }));
  }

  window.Portfolio.register("skills", renderSkills);
})();
