/* Education page (education.html) — renders the "education" section loaded by core.js */
(function () {
  "use strict";
  const { D, esc, icon, list, button } = window.Portfolio;

  function renderEducation(root) {
    const e = D.education;
    const sectionHead = (hd) => `
      <header class="col-head reveal">
        <h2 class="h-md">${icon(hd.icon)}${esc(hd.title)}</h2>
        <span class="mono upper muted">${esc(hd.label)}</span>
      </header>`;

    root.innerHTML = `
      <section class="page-hero page-hero--tinted">
        <div class="container page-hero-grid page-hero-grid--end reveal">
          <div>
            <p class="pill pill--sage mono">${icon("verified_user")}${esc(e.eyebrow)}</p>
            <h1 class="h-xl">${esc(e.title)}</h1>
            <p class="lead">${esc(e.intro)}</p>
          </div>
          <div class="edu-stats">
            ${list(e.stats, (s) => `
              <div class="edu-stat">
                <span class="icon-box ${s.dark ? "icon-box--dark" : "icon-box--sage"}">${icon(s.icon)}</span>
                <span><strong>${esc(s.value)}</strong><small class="mono">${esc(s.label)}</small></span>
              </div>`)}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container split-edu">
          <div class="stack-md">
            ${sectionHead(e.educationHeading)}
            ${list(e.degrees, (d) => `
              <article class="degree-card card reveal">
                <div class="glow" aria-hidden="true"></div>
                <div class="degree-main">
                  <div class="tag-row">
                    <span class="tag tag--dark tag--icon">${icon("stars")}${esc(d.honor)}</span>
                    <span class="tag tag--sand">${esc(d.years)}</span>
                  </div>
                  <h3 class="h-sm">${esc(d.degree)}</h3>
                  <p class="degree-school">${icon("account_balance")}${esc(d.school)}</p>
                  <p class="text-sm muted-text">${esc(d.text)}</p>
                  ${d.image ? `
                  <figure class="degree-photo">
                    <img src="${esc(d.image)}" alt="${esc(d.imageAlt)}" loading="lazy" decoding="async" />
                    <figcaption class="mono">
                      <span>${icon("location_on")}${esc(d.imageLocation)}</span>
                      <span class="chip-dark">${esc(d.imageBadge)}</span>
                    </figcaption>
                  </figure>` : ""}
                  <p class="eyebrow-sm eyebrow-sm--green">${esc(d.courseworkTitle)}</p>
                  <ul class="tag-list tag-list--lg">${list(d.coursework, (c) => `<li class="tag tag--sand tag--icon tag--lg">${icon(c.icon)}${esc(c.label)}</li>`)}</ul>
                </div>
                <div class="degree-progress mono">
                  <p><span>${esc(d.progress.label)}</span><strong>${esc(d.progress.status)}</strong></p>
                  <div class="meter" role="meter" aria-label="${esc(d.progress.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(d.progress.percent) || 0}"><span style="--w:${Number(d.progress.percent) || 0}%"></span></div>
                  <p><span>${esc(d.progress.left)}</span><span class="strong">${esc(d.progress.right)}</span></p>
                </div>
              </article>`)}
            <article class="focus-card reveal">
              <span class="icon-box icon-box--sage">${icon(e.focusCard.icon)}</span>
              <div><h3 class="h-sm">${esc(e.focusCard.title)}</h3><p class="text-sm muted-text">${esc(e.focusCard.text)}</p></div>
            </article>
          </div>

          <div class="stack-md">
            ${sectionHead(e.certificationsHeading)}
            ${list(e.certifications, (c) => `
              <article class="cert-card card reveal">
                <span class="icon-box icon-box--lg ${c.iconStyle === "green" ? "icon-box--sage" : "icon-box--cream"}">${icon(c.icon)}</span>
                <div class="cert-body">
                  <div class="cert-top">
                    <span class="tag ${c.badgeStyle === "dark" ? "tag--dark" : "tag--sage"}">${esc(c.badge)}</span>
                    <span class="cert-issuer mono">${esc(c.issuer)}</span>
                    <span class="cert-status mono">${icon(c.status.icon)}${esc(c.status.label)}</span>
                  </div>
                  <h3 class="h-md">${esc(c.title)}</h3>
                  <p class="text-md muted-text">${esc(c.text)}</p>
                  ${c.gallery ? `
                  <div class="cert-gallery">
                    ${list(c.gallery, (g) => `
                      <figure><img src="${esc(g.image)}" alt="${esc(g.alt)}" loading="lazy" decoding="async" /><figcaption class="chip-dark mono">${esc(g.caption)}</figcaption></figure>`)}
                    ${c.galleryCard ? `
                    <div class="gallery-card">
                      <p>${icon(c.galleryCard.icon)}<span class="mono">${esc(c.galleryCard.label)}</span></p>
                      <strong>${esc(c.galleryCard.title)}</strong>
                      <small>${esc(c.galleryCard.text)}</small>
                    </div>` : ""}
                  </div>` : ""}
                  <div class="skill-box mono">
                    <span class="skill-box-label">${esc(c.skillsLabel)}</span>
                    ${list(c.skills, (s) => `<span>${esc(s)}</span>`)}
                  </div>
                </div>
              </article>`)}
          </div>
        </div>
      </section>

      <section class="section section--tight-top">
        <div class="container">
          <div class="verify-banner reveal">
            <span class="icon-box icon-box--dark icon-box--lg">${icon(e.verification.icon)}</span>
            <div><h2 class="h-sm">${esc(e.verification.title)}</h2><p class="text-sm muted-text">${esc(e.verification.text)}</p></div>
            ${button({ ...e.verification.button, iconFirst: true }, "btn btn-primary")}
          </div>
        </div>
      </section>`;
  }

  window.Portfolio.register("education", renderEducation);
})();
