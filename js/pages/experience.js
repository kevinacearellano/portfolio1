/* Experience page (experience.html) — renders the "experience" section loaded by core.js */
(function () {
  "use strict";
  const { D, esc, icon, list, button } = window.Portfolio;

  function renderExperience(root) {
    const x = D.experience, st = x.strengths, cb = x.competencyBalance;
    root.innerHTML = `
      <section class="page-hero page-hero--plain">
        <div class="container">
          <div class="page-hero-grid reveal">
            <div>
              <p class="pill pill--sage mono upper">${icon(x.eyebrowIcon)}${esc(x.eyebrow)}</p>
              <h1 class="h-xl">${esc(x.title)}</h1>
              <p class="lead">${esc(x.intro)}</p>
            </div>
            <div class="status-card">
              <span class="dot" aria-hidden="true"></span>
              <span><small class="eyebrow-sm">${esc(x.status.label)}</small><strong>${esc(x.status.value)}</strong></span>
            </div>
          </div>
          <div class="progress-rule" aria-hidden="true"></div>
        </div>
      </section>

      <section class="section section--tight-top">
        <div class="container split-8-4">
          <div class="stack-lg">
            ${list(x.jobs, (j) => `
              <article class="job-card card reveal">
                <div class="glow" aria-hidden="true"></div>
                <header class="job-head">
                  <div class="job-head-left">
                    <span class="tag ${j.current ? "tag--sage" : "tag--sand"}">${esc(j.period)}</span>
                    <span class="eyebrow-sm">${esc(j.type)}</span>
                  </div>
                  <span class="tag tag--sand tag--icon">${icon(j.category.icon)}${esc(j.category.label)}</span>
                </header>
                <h2 class="h-md">${esc(j.title)}</h2>
                <p class="text-md muted-text">${esc(j.summary)}</p>
                <div class="job-body">
                  <figure class="job-photo">
                    <img src="${esc(j.image)}" alt="${esc(j.imageAlt)}" loading="lazy" decoding="async" />
                    <figcaption class="mono"><span>${esc(j.imageCaption)}</span>${icon(j.imageIcon)}</figcaption>
                  </figure>
                  <ul class="duty-list">
                    ${list(j.duties, (d) => `
                      <li class="duty">
                        ${icon(d.icon)}
                        <div><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p></div>
                      </li>`)}
                  </ul>
                </div>
                <div class="competencies">
                  <span class="mono">${esc(x.competenciesLabel)}</span>
                  <ul class="tag-list">${list(j.competencies, (c) => `<li class="tag tag--sand">${esc(c)}</li>`)}</ul>
                </div>
              </article>`)}
          </div>

          <aside class="stack-md" aria-label="Strengths summary">
            <section class="strength-panel reveal">
              <p class="eyebrow-sm eyebrow-sm--light">${icon(st.icon)}${esc(st.eyebrow)}</p>
              <h2 class="h-sm">${esc(st.title)}</h2>
              <p class="strength-intro">${esc(st.text)}</p>
              <ul class="strength-list">
                ${list(st.items, (s) => `
                  <li class="strength-item">
                    <h3>${icon(s.icon)}${esc(s.title)}</h3>
                    <p>${esc(s.text)}</p>
                  </li>`)}
              </ul>
              <p class="strength-closing">${icon("check_circle")}<span>${esc(st.closing)}</span></p>
            </section>

            <section class="balance-card reveal">
              <p class="eyebrow-sm">${esc(cb.eyebrow)}</p>
              <h2 class="h-xs">${esc(cb.title)}</h2>
              <ul class="balance-list">
                ${list(cb.bars, (b) => `
                  <li>
                    <p class="mono"><span>${esc(b.label)}</span><span>${Number(b.percent) || 0}%</span></p>
                    <div class="meter meter--thin" role="meter" aria-label="${esc(b.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(b.percent) || 0}"><span style="--w:${Number(b.percent) || 0}%"></span></div>
                  </li>`)}
              </ul>
              <p class="balance-foot">${icon(cb.footer.icon)}<span>${esc(cb.footer.label)}</span><span class="mono">${esc(cb.footer.value)}</span></p>
            </section>

            <section class="card side-cta reveal">
              <h2 class="h-xs">${esc(x.cta.title)}</h2>
              <p class="text-xs muted-text">${esc(x.cta.text)}</p>
              ${button({ ...x.cta.button, iconFirst: true }, "btn btn-primary btn-block btn-sm")}
            </section>
          </aside>
        </div>
      </section>`;
  }

  window.Portfolio.register("experience", renderExperience);
})();
