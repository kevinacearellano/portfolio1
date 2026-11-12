/* Home page (index.html) — renders the "home" section loaded by core.js */
(function () {
  "use strict";
  const { D, esc, icon, list, button } = window.Portfolio;

  function renderHome(root) {
    const h = D.home, hero = h.hero, ph = h.philosophy, cta = h.cta;
    const lastIdx = hero.codeLines.length - 1;

    root.innerHTML = `
      <section class="hero">
        <div class="blob blob--tl" aria-hidden="true"></div>
        <div class="blob blob--br" aria-hidden="true"></div>
        <div class="container hero-grid">
          <div class="hero-copy reveal">
            <p class="pill pill--cream mono">
              <span class="dot" aria-hidden="true"></span>
              <span class="upper">${esc(hero.greeting)}</span>
              <span class="pill-sep" aria-hidden="true">•</span>
              ${icon("location_on")}<span>${esc(hero.location)}</span>
            </p>
            <h1 class="hero-title">${esc(hero.nameLine1)}<br />${esc(hero.nameLine2)}</h1>
            <p class="hero-role">
              <span class="hero-role-main">${esc(hero.role)}</span>
              <span class="hero-role-line" aria-hidden="true"></span>
              <span class="hero-role-sub mono">${esc(hero.subRole)}</span>
            </p>
            <blockquote class="hero-quote">${esc(hero.quote)}</blockquote>
            <p class="hero-intro">${esc(hero.intro)}</p>
            <div class="btn-row">
              ${button(hero.primaryButton, "btn btn-primary btn-lg")}
              ${button({ ...hero.secondaryButton, iconFirst: true }, "btn btn-cream btn-lg")}
              ${button({ ...hero.textButton, iconFirst: true }, "btn btn-text mono")}
            </div>
          </div>

          <div class="hero-visual reveal">
            <div class="hero-card">
              <figure class="hero-photo">
                <img src="${esc(hero.photo)}" alt="${esc(hero.photoAlt)}" width="600" height="450" fetchpriority="high" decoding="async" />
                <figcaption class="chip-glass mono"><span class="dot" aria-hidden="true"></span>${esc(hero.photoCaption)}</figcaption>
              </figure>
              <div class="code-window" role="img" aria-label="Code snippet describing the developer profile">
                <div class="code-bar">
                  <span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                  <span class="mono upper">${esc(hero.codeFileName)}</span>
                </div>
                <pre class="code-body mono"><span class="tok-kw">const</span> developer = {
${list(hero.codeLines, (l, i) => `  <span class="tok-key">${esc(l.key)}</span>: <span class="tok-str">'${esc(l.value)}'</span>${i < lastIdx ? "," : ""}\n`)}};</pre>
              </div>
              <div class="hero-tags">
                <ul class="tag-list">${list(hero.stackTags, (t) => `<li class="tag tag--sage">${esc(t)}</li>`)}</ul>
                ${icon("terminal", "muted")}
              </div>
            </div>
            <div class="float-badge">
              <span class="icon-box icon-box--dark">${icon(hero.floatingBadge.icon)}</span>
              <span><strong>${esc(hero.floatingBadge.title)}</strong><small class="mono">${esc(hero.floatingBadge.subtitle)}</small></span>
            </div>
          </div>
        </div>
      </section>

      <section class="highlights" aria-label="Quick facts">
        <div class="container highlights-grid">
          ${list(h.highlights, (x) => `
            <div class="highlight reveal">
              <span class="icon-box icon-box--cream">${icon(x.icon)}</span>
              <span><small class="eyebrow-sm">${esc(x.label)}</small><strong>${esc(x.value)}</strong></span>
            </div>`)}
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head section-head--split reveal">
            <div>
              <p class="eyebrow-sm">${esc(ph.eyebrow)}</p>
              <h2 class="h-lg">${esc(ph.title)}</h2>
            </div>
            <p class="section-head-note">${esc(ph.text)}</p>
          </div>
          <div class="grid-3">
            ${list(ph.cards, (c) => `
              <article class="feature-card reveal">
                <span class="icon-box icon-box--white">${icon(c.icon)}</span>
                <h3 class="h-sm">${esc(c.title)}</h3>
                <p>${esc(c.text)}</p>
                <p class="feature-note mono">${icon("check_circle")}${esc(c.note)}</p>
              </article>`)}
          </div>
        </div>
      </section>

      <section class="section section--tight-top">
        <div class="container">
          <div class="cta-panel reveal">
            <div class="cta-copy">
              <p class="eyebrow-sm eyebrow-sm--light">${esc(cta.eyebrow)}</p>
              <h2 class="h-lg">${esc(cta.title)}</h2>
              <p>${esc(cta.text)}</p>
            </div>
            <div class="btn-row">
              ${button(cta.primaryButton, "btn btn-white btn-lg")}
              ${button(cta.secondaryButton, "btn btn-ghost-light btn-lg")}
            </div>
          </div>
        </div>
      </section>`;
  }

  window.Portfolio.register("home", renderHome);
})();
