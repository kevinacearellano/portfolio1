/* Resume page (resume.html) — builds a one-page, ATS-friendly resume from the
   portfolio content (site, home, experience, education, skills, projects).
   Options come from the "resume" section in the admin panel. */
(function () {
  "use strict";
  const { D, esc, icon, list, $, safeUrl } = window.Portfolio;

  const text = (v) => (v == null ? "" : String(v).trim());
  const plainUrl = (u) => text(u).replace(/^https?:\/\//i, "").replace(/^mailto:/i, "").replace(/\/+$/, "");
  const stripNumber = (t) => text(t).replace(/^\d+\.\s*/, "");          // "01. Frontend" -> "Frontend"

  // "Owner / Artist – Charcoal Portrait Commissions" -> role + organisation
  function splitTitle(title) {
    const parts = text(title).split(/\s+[–—-]\s+/);
    return parts.length > 1 ? { role: parts[0], org: parts.slice(1).join(" – ") } : { role: text(title), org: "" };
  }

  function section(title, body) {
    return body ? `<section class="rs-section"><h2 class="rs-h">${esc(title)}</h2>${body}</section>` : "";
  }

  function renderResume(root) {
    const s = D.site || {};
    const r = D.resume || {};
    const hero = (D.home && D.home.hero) || {};
    const on = (key, fallback = true) => (r[key] === undefined ? fallback : !!r[key]);

    const name = text(s.name);
    const headline = text(r.headline) || text(s.role);
    const summary = text(r.profileSummary) || text(hero.intro);
    const website = text(r.website) || (/^https?:$/.test(location.protocol) ? location.origin + location.pathname.replace(/[^/]*$/, "") : "");

    /* ---- contact line ---- */
    const contact = [];
    if (s.location) contact.push(esc(s.location));
    if (s.phoneDisplay || s.phone) contact.push(`<a href="tel:${esc(text(s.phone || s.phoneDisplay).replace(/[^\d+]/g, ""))}">${esc(s.phoneDisplay || s.phone)}</a>`);
    if (s.email) contact.push(`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`);
    if (website) contact.push(`<a href="${esc(safeUrl(website))}">${esc(plainUrl(website))}</a>`);
    (s.socials || []).filter((l) => l.url && !/^mailto:/i.test(l.url)).forEach((l) => {
      contact.push(`<a href="${esc(safeUrl(l.url))}">${esc(plainUrl(l.url))}</a>`);
    });

    /* ---- experience ---- */
    const jobs = (D.experience && D.experience.jobs) || [];
    const experience = list(jobs, (j) => {
      const t = splitTitle(j.title);
      const org = [t.org, text(j.type)].filter(Boolean).join(" · ");
      return `
        <article class="rs-entry">
          <div class="rs-row"><h3 class="rs-title">${esc(t.role)}</h3><span class="rs-date">${esc(j.period)}</span></div>
          ${org ? `<p class="rs-org">${esc(org)}</p>` : ""}
          ${j.summary ? `<p class="rs-text">${esc(j.summary)}</p>` : ""}
          ${(j.duties || []).length ? `<ul class="rs-bullets">${list(j.duties, (d) =>
            `<li>${d.title ? `<strong>${esc(d.title)}:</strong> ` : ""}${esc(d.text)}</li>`)}</ul>` : ""}
        </article>`;
    });

    /* ---- education ---- */
    const degrees = (D.education && D.education.degrees) || [];
    const education = list(degrees, (d) => {
      const where = [text(d.school), text(d.imageLocation).split("•")[0].trim()].filter(Boolean).join(" · ");
      const course = (d.coursework || []).map((c) => text(c.label)).filter(Boolean);
      return `
        <article class="rs-entry">
          <div class="rs-row"><h3 class="rs-title">${esc(d.degree)}</h3><span class="rs-date">${esc(d.years)}</span></div>
          ${where ? `<p class="rs-org">${esc(where)}</p>` : ""}
          ${d.honor ? `<p class="rs-text">${esc(d.honor)}</p>` : ""}
          ${course.length ? `<p class="rs-text"><strong>Relevant coursework:</strong> ${esc(course.join(", "))}</p>` : ""}
        </article>`;
    });

    /* ---- skills ---- */
    const cats = (D.skills && D.skills.categories) || [];
    const skills = list(cats, (c) => {
      const names = (c.items || []).map((i) => text(i.name)).filter(Boolean);
      return names.length ? `<p class="rs-skill"><strong>${esc(stripNumber(c.title))}:</strong> ${esc(names.join(", "))}</p>` : "";
    });

    /* ---- projects ---- */
    const max = Number(r.maxProjects) > 0 ? Number(r.maxProjects) : 4;
    const projectItems = ((D.projects && D.projects.items) || []).slice(0, max);
    const projects = list(projectItems, (p) => `
      <article class="rs-entry">
        <div class="rs-row"><h3 class="rs-title">${esc(p.title)}${p.typeLabel ? ` <span class="rs-muted">— ${esc(p.typeLabel)}</span>` : ""}</h3><span class="rs-date">${esc(p.meta)}</span></div>
        ${p.text ? `<p class="rs-text">${esc(p.text)}</p>` : ""}
        ${(p.tags || []).length ? `<p class="rs-text"><strong>Tools:</strong> ${esc(p.tags.join(", "))}</p>` : ""}
      </article>`);

    /* ---- certifications & awards ---- */
    const certs = (D.education && D.education.certifications) || [];
    const certifications = certs.length ? `<ul class="rs-bullets">${list(certs, (c) => {
      const extra = [text(c.issuer), text(c.badge), text(c.date)].filter(Boolean).join(" · ");
      return `<li><strong>${esc(c.title)}</strong>${extra ? ` — ${esc(extra)}` : ""}</li>`;
    })}</ul>` : "";

    /* ---- extra sections (e.g. Languages) + references ---- */
    const additional = list(r.additional, (a) => section(text(a.title), a.text ? `<p class="rs-text">${esc(a.text)}</p>` : ""));
    const references = text(r.references) || "Available upon request.";

    const photo = on("showPhoto", false) && hero.photo
      ? `<img class="rs-photo" src="${esc(hero.photo)}" alt="${esc(name)}" />` : "";

    root.innerHTML = `
      <div class="rs-page">
        <div class="container rs-toolbar">
          <div>
            <p class="eyebrow-sm eyebrow-sm--green">${icon("description")}${esc(r.eyebrow || "Resume")}</p>
            <p class="text-sm muted-text">${esc(r.note || "Generated from my portfolio and always up to date.")}</p>
          </div>
          <div class="rs-actions">
            <button type="button" class="btn btn-primary btn-sm" id="rsDownload">${icon("download")}<span>${esc(r.downloadLabel || "Download PDF")}</span></button>
            <p class="rs-hint mono">${esc(r.downloadHint || "Choose “Save as PDF” in the print window.")}</p>
          </div>
        </div>

        <article class="rs-paper" aria-label="Resume of ${esc(name)}">
          <header class="rs-header${photo ? " has-photo" : ""}">
            <div>
              <h1 class="rs-name">${esc(name)}</h1>
              ${headline ? `<p class="rs-headline">${esc(headline)}</p>` : ""}
              <p class="rs-contact">${contact.join('<span class="rs-sep" aria-hidden="true">|</span>')}</p>
            </div>
            ${photo}
          </header>
          ${on("showSummary") ? section("Professional Summary", summary ? `<p class="rs-text">${esc(summary)}</p>` : "") : ""}
          ${on("showExperience") ? section("Experience", experience) : ""}
          ${on("showEducation") ? section("Education", education) : ""}
          ${on("showSkills") ? section("Skills", skills) : ""}
          ${on("showProjects") ? section("Projects", projects) : ""}
          ${on("showCertifications") ? section("Certifications & Awards", certifications) : ""}
          ${additional}
          ${on("showReferences") ? section("References", `<p class="rs-text">${esc(references)}</p>`) : ""}
        </article>
      </div>`;

    // paper size for printing / PDF
    const size = String(r.paperSize || "Letter").toLowerCase() === "a4" ? "A4" : "letter";
    const pageStyle = document.createElement("style");
    pageStyle.textContent = `@page { size: ${size}; margin: 0.5in 0.6in; }`;
    document.head.appendChild(pageStyle);

    // the PDF file name comes from the page title
    document.title = `${name} - Resume`;

    $("#rsDownload", root).addEventListener("click", () => window.print());
  }

  window.Portfolio.register("resume", renderResume);
})();
