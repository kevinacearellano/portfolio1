/* Contact page (contact.html) — renders the "contact" section loaded by core.js */
(function () {
  "use strict";
  const { D, esc, icon, hrefAttrs, safeUrl, list, $, $$ } = window.Portfolio;

  // uploaded logo picture if set, otherwise the Material icon
  const profileMark = (p) => p.logo
    ? `<span class="profile-logo"><img src="${esc(safeUrl(p.logo))}" alt="" loading="lazy" decoding="async" /></span>`
    : icon(p.icon, "profile-icon");

  function renderContact(root) {
    const c = D.contact, s = D.site, f = c.form;
    root.innerHTML = `
      <section class="page-hero page-hero--plain contact-hero">
        <div class="blob blob--tl" aria-hidden="true"></div>
        <div class="blob blob--br" aria-hidden="true"></div>
        <div class="container">
          <div class="section-head reveal">
            <p class="pill pill--sand mono upper"><span class="dot dot--pulse" aria-hidden="true"></span>${esc(c.eyebrow)}</p>
            <h1 class="h-xl">${esc(c.title)}</h1>
            <p class="lead">${esc(c.intro)}</p>
          </div>

          <div class="split-contact">
            <div class="stack-md">
              <div class="avail-card card reveal">
                <span class="icon-box icon-box--sage">${icon(c.availability.icon)}</span>
                <div>
                  <p class="eyebrow-sm eyebrow-sm--green">${esc(c.availability.label)}</p>
                  <p class="avail-title">${esc(c.availability.title)}</p>
                  <p class="text-xs muted-text">${esc(c.availability.text)}</p>
                </div>
              </div>

              <div class="contact-item card reveal">
                <span class="icon-box icon-box--dark">${icon("mail")}</span>
                <div class="contact-item-text">
                  <small class="eyebrow-sm">${esc(c.emailLabel)}</small>
                  <a class="contact-value is-primary" href="mailto:${esc(s.email)}">${esc(s.email)}</a>
                </div>
                <button type="button" class="icon-btn" data-copy="${esc(s.email)}" aria-label="Copy email address" title="Copy email address">${icon("content_copy")}</button>
              </div>

              <div class="contact-item card reveal">
                <span class="icon-box icon-box--cream">${icon("phone_iphone")}</span>
                <div class="contact-item-text">
                  <small class="eyebrow-sm">${esc(c.phoneLabel)}</small>
                  <a class="contact-value" href="tel:${esc(s.phone.replace(/^0/, "+63"))}">${esc(s.phoneDisplay)}</a>
                </div>
                <button type="button" class="icon-btn" data-copy="${esc(s.phone)}" aria-label="Copy phone number" title="Copy phone number">${icon("content_copy")}</button>
              </div>

              <div class="location-card card reveal">
                <div class="location-info">
                  <span class="icon-box icon-box--cream">${icon("pin_drop")}</span>
                  <div>
                    <small class="eyebrow-sm">${esc(c.locationLabel)}</small>
                    <p class="contact-value">${esc(s.location)}</p>
                    <ul class="tag-list">${list(c.workModels, (w) => `<li class="tag ${w.highlight ? "tag--sage" : "tag--sand"}">${esc(w.label)}</li>`)}</ul>
                  </div>
                </div>
                <div class="location-map">
                  ${c.mapImage ? `<img class="location-map-img" src="${esc(c.mapImage)}" alt="" loading="lazy" decoding="async" />` : ""}
                  <span class="chip-glass mono">${icon("my_location")}${esc(c.mapLabel)}</span>
                </div>
              </div>

              <div class="grid-2 grid-2--always reveal">
                ${list(c.profiles, (p) => `
                  <a class="profile-link card" ${hrefAttrs(p.url)}>
                    ${profileMark(p)}
                    <span><small class="mono">${esc(p.label)}</small><strong>${esc(p.name)}</strong></span>
                    ${icon("north_east", "profile-arrow")}
                  </a>`)}
              </div>
            </div>

            <div class="form-card reveal">
              <div class="form-head">
                <div>
                  <p class="eyebrow-sm eyebrow-sm--green">${esc(f.eyebrow)}</p>
                  <h2 class="h-md">${esc(f.title)}</h2>
                </div>
                <span class="icon-box icon-box--sage icon-box--lg">${icon("forward_to_inbox")}</span>
              </div>
              <form class="contact-form" id="contactForm" novalidate>
                <div class="form-row">
                  <div class="field">
                    <label for="cf-name">${esc(f.nameLabel)} <span class="req" aria-hidden="true">*</span></label>
                    <input id="cf-name" name="name" type="text" autocomplete="name" placeholder="${esc(f.namePlaceholder)}" required />
                  </div>
                  <div class="field">
                    <label for="cf-email">${esc(f.emailLabel)} <span class="req" aria-hidden="true">*</span></label>
                    <input id="cf-email" name="email" type="email" autocomplete="email" placeholder="${esc(f.emailPlaceholder)}" required />
                  </div>
                </div>
                <div class="field">
                  <label for="cf-subject">${esc(f.subjectLabel)} <span class="req" aria-hidden="true">*</span></label>
                  <div class="select-wrap">
                    <select id="cf-subject" name="subject" required>
                      <option value="" disabled selected>${esc(f.subjectPlaceholder)}</option>
                      ${list(f.subjects, (o) => `<option>${esc(o)}</option>`)}
                    </select>
                    ${icon("unfold_more")}
                  </div>
                </div>
                <div class="field">
                  <div class="field-label-row">
                    <label for="cf-message">${esc(f.messageLabel)} <span class="req" aria-hidden="true">*</span></label>
                    <span class="mono muted" id="cf-message-hint">${esc(f.messageHint)}</span>
                  </div>
                  <textarea id="cf-message" name="message" rows="5" minlength="20" placeholder="${esc(f.messagePlaceholder)}" aria-describedby="cf-message-hint" required></textarea>
                </div>
                <p class="form-error" id="formError" role="alert" hidden></p>
                <button type="submit" class="btn btn-primary btn-lg btn-send"><span>${esc(f.submitLabel)}</span>${icon("send")}</button>
                <p class="form-note mono">${icon("verified_user")}<span>${esc(f.note)} <strong>${esc(s.email)}</strong></span></p>
              </form>
              <div class="success-banner" id="formSuccess" role="status" hidden>
                ${icon("check_circle")}
                <div><h3 class="h-sm">${esc(f.successTitle)}</h3><p>${esc(f.successText)}</p></div>
              </div>
            </div>
          </div>

          <div class="faq-strip reveal">
            ${list(c.faq, (q) => `
              <div><h2 class="faq-title">${icon(q.icon)}${esc(q.title)}</h2><p class="text-xs muted-text">${esc(q.text)}</p></div>`)}
          </div>
        </div>
      </section>`;

    // copy buttons
    $$("[data-copy]", root).forEach((btn) => btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
        else {
          const ta = Object.assign(document.createElement("textarea"), { value: text });
          ta.style.cssText = "position:fixed;left:-9999px";
          document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
        }
        const ms = $(".ms", btn);
        ms.textContent = "check"; btn.classList.add("is-copied");
        setTimeout(() => { ms.textContent = "content_copy"; btn.classList.remove("is-copied"); }, 2000);
      } catch (err) { console.error("Copy failed", err); }
    }));

    // form -> opens the visitor's email client with a pre-filled message
    const form = $("#contactForm", root);
    const errBox = $("#formError", root);
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fields = $$("input, select, textarea", form);
      fields.forEach((el) => el.removeAttribute("aria-invalid"));
      const bad = fields.filter((el) => !el.checkValidity());
      if (bad.length) {
        bad.forEach((el) => el.setAttribute("aria-invalid", "true"));
        const first = bad[0];
        const label = $(`label[for="${first.id}"]`, form);
        errBox.textContent = `Please check “${label ? label.textContent.replace("*", "").trim() : "this field"}”: ${first.validationMessage}`;
        errBox.hidden = false;
        first.focus();
        return;
      }
      errBox.hidden = true;
      const data = Object.fromEntries(new FormData(form));
      const body = `Sender Name: ${data.name}\nSender Email: ${data.email}\nInquiry Type: ${data.subject}\n\nMessage:\n${data.message}`;
      const url = `mailto:${s.email}?subject=${encodeURIComponent(`${data.subject} - from ${data.name}`)}&body=${encodeURIComponent(body)}`;
      $("#formSuccess", root).hidden = false;
      window.location.href = url;
    });
  }

  window.Portfolio.register("contact", renderContact);
})();
