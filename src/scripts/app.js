/* Client behavior for the Astro site: nav, reveal, and form submission.
   The DOM is pre-rendered by Astro; this only wires up interactivity.
   Reads window.SITE_CONTENT (injected by Base.astro). */
(() => {
  'use strict';
  const C = window.SITE_CONTENT;
  if (!C) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* ---- nav ---- */
  const nav = $('#nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    $('#nav-toggle')?.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('.nav-links a').forEach((a) =>
      a.addEventListener('click', () => nav.classList.remove('open')));
  }

  /* ---- reveal on scroll ---- */
  const revealEls = document.querySelectorAll(
    '.section-head, .studio-body, .game, .tech-card, .job, .join-grid, .contact-grid, .post-item');
  revealEls.forEach((el) => el.classList.add('reveal'));
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---- tech card hover video (play only while hovered) ---- */
  document.querySelectorAll('.tech-card.has-media video').forEach((v) => {
    const card = v.closest('.tech-card');
    const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const stop = () => { v.pause(); v.currentTime = 0; };
    card.addEventListener('mouseenter', play);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focusin', play);
    card.addEventListener('focusout', stop);
  });

  /* ---- forms ---- */
  const post = (url, fd) => fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });

  // Mailchimp's signup endpoint blocks fetch/CORS, so it's called via JSONP:
  // a <script> tag whose URL names a global callback Mailchimp invokes with the result.
  const jsonp = (url) => new Promise((resolve, reject) => {
    const cb = 'mc_cb_' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    const cleanup = () => { delete window[cb]; s.remove(); };
    window[cb] = (data) => { cleanup(); resolve(data); };
    s.onerror = () => { cleanup(); reject(new Error('network')); };
    s.src = url + (url.includes('?') ? '&' : '?') + 'c=' + cb;
    document.body.appendChild(s);
  });

  const form = $('#contact-form');
  const status = $('#form-status');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const name = (d.get('name') || '').toString().trim();
    const email = (d.get('email') || '').toString().trim();
    const subject = (d.get('subject') || '').toString().trim();
    const message = (d.get('message') || '').toString().trim();
    if (!name || !isEmail(email) || !subject || !message) {
      status.textContent = C.contact.form.error; status.className = 'form-status err'; return;
    }
    const ok = () => {
      status.textContent = C.contact.form.success.replace('{name}', name.split(' ')[0]);
      status.className = 'form-status ok'; form.reset();
    };
    const endpoint = C.config && C.config.contactEndpoint;
    if (!endpoint) { ok(); return; }
    status.textContent = 'sending…'; status.className = 'form-status';
    try { const r = await post(endpoint, d); r.ok ? ok()
      : (status.textContent = 'Something went wrong — please email us directly.', status.className = 'form-status err'); }
    catch (_) { status.textContent = 'Network error — please email us directly.'; status.className = 'form-status err'; }
  });

  const news = $('#news-form');
  const nstatus = $('#news-status');
  news?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(news);
    const email = (fd.get('email') || '').toString().trim();
    if (!isEmail(email)) { nstatus.textContent = C.community.subscribeError; nstatus.className = 'form-status err'; return; }
    const ok = () => { nstatus.textContent = C.community.subscribeSuccess; nstatus.className = 'form-status ok'; news.reset(); };
    const endpoint = C.config && C.config.newsletterEndpoint;
    if (!endpoint) { ok(); return; }
    nstatus.textContent = 'subscribing…'; nstatus.className = 'form-status';
    // Mailchimp: convert the embedded-form URL to its JSONP endpoint and submit.
    if (/list-manage\.com/.test(endpoint)) {
      const base = endpoint.replace(/&amp;/g, '&').replace('/subscribe/post', '/subscribe/post-json');
      const url = base + (base.includes('?') ? '&' : '?') + 'EMAIL=' + encodeURIComponent(email);
      try {
        const data = await jsonp(url);
        if (data && data.result === 'success') { ok(); }
        else { nstatus.textContent = (data && data.msg) ? data.msg.replace(/^\d+\s*-\s*/, '') : 'Subscription failed — try again later.'; nstatus.className = 'form-status err'; }
      } catch (_) { nstatus.textContent = 'Network error — try again later.'; nstatus.className = 'form-status err'; }
      return;
    }
    try { const r = await post(endpoint, fd); r.ok ? ok()
      : (nstatus.textContent = 'Subscription failed — try again later.', nstatus.className = 'form-status err'); }
    catch (_) { nstatus.textContent = 'Network error — try again later.'; nstatus.className = 'form-status err'; }
  });
})();
