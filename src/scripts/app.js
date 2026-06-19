/* Client behavior for the Astro site: nav, reveal, interactive terminal,
   and form submission. The DOM is pre-rendered by Astro; this only wires
   up interactivity. Reads window.SITE_CONTENT (injected by Base.astro). */
(() => {
  'use strict';
  const C = window.SITE_CONTENT;
  if (!C) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mailto = (email, subject) =>
    `mailto:${email}` + (subject ? `?subject=${encodeURIComponent(subject)}` : '');
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

  /* ---- forms ---- */
  const post = (url, fd) => fetch(url, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });

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
    try { const r = await post(endpoint, fd); r.ok ? ok()
      : (nstatus.textContent = 'Subscription failed — try again later.', nstatus.className = 'form-status err'); }
    catch (_) { nstatus.textContent = 'Network error — try again later.'; nstatus.className = 'form-status err'; }
  });

  /* ---- interactive terminal ---- */
  const logEl = $('#cli-log'), cliForm = $('#cli-form'), input = $('#cli-input');
  if (cliForm && C.games) {
    const games = C.games.items || [];
    const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const out = (html, cls) => {
      const d = document.createElement('div');
      d.className = 'cli-out' + (cls ? ' ' + cls : '');
      d.innerHTML = String(html).replace(/\n/g, '<br>');
      logEl.appendChild(d);
    };
    const scroll = () => { logEl.scrollTop = logEl.scrollHeight; };
    const cmds = {
      help: () => [
        'available commands:',
        '  help .......... show this list',
        '  about ......... about the studio',
        '  games ......... list our games',
        '  cat &lt;game&gt; ..... read a game dossier',
        '  tech .......... our technology stack',
        '  careers ....... open positions',
        '  contact ....... how to reach us',
        '  discord ....... join the community',
        '  devlog ........ read the devlog',
        '  subscribe ..... newsletter signup',
        '  clear ......... clear the screen',
      ].join('\n'),
      about: () => C.studio.lede,
      studio: () => C.studio.lede,
      games: () => games.map((g) => `  ${slug(g.title)}  —  ${g.title} (${g.genre})`).join('\n'),
      ls: (a) => (a[0] === 'games'
        ? games.map((g) => slug(g.title)).join('  ')
        : 'about  games  technology  careers  community  devlog  contact'),
      cat: (a) => {
        const key = (a[0] || '').toLowerCase();
        if (!key) return 'usage: cat &lt;game&gt;  (try: cat ' + slug(games[0].title) + ')';
        if (key === 'about' || key === 'studio') return C.studio.lede;
        const g = games.find((x) => slug(x.title) === key || slug(x.title).includes(key) || x.title.toLowerCase().includes(key));
        return g ? `${g.title}\n${g.genre}\n\n${g.description}` : `cat: ${esc(key)}: no such file`;
      },
      tech: () => 'built on Unreal Engine 6:\n' + C.tech.cards.map((c) => '  - ' + c.title).join('\n'),
      stack: () => cmds.tech(),
      careers: () => C.careers.jobs.map((j) => '  - ' + j.title).join('\n') + `\n\napply: ${C.careers.applyEmail}`,
      jobs: () => cmds.careers(),
      contact: () => C.contact.channels.map((ch) => `  ${ch.label}: <a href="${mailto(ch.email)}">${ch.email}</a>`).join('\n'),
      discord: () => `opening discord… <a href="${C.config.discordUrl}" target="_blank" rel="noopener">${C.config.discordUrl}</a>`,
      devlog: () => { location.href = '/devlog/'; return 'opening devlog…'; },
      subscribe: () => { location.hash = '#join'; setTimeout(() => $('#news-form input')?.focus(), 350); return 'newsletter signup below ↓'; },
      newsletter: () => cmds.subscribe(),
      whoami: () => 'guest@topgame — welcome, traveler.',
      banner: () => `${C.brand.line1} · ${C.brand.line2}`,
      clear: () => { logEl.innerHTML = ''; return null; },
    };
    const history = []; let hi = -1;
    const run = (raw) => {
      const line = (raw || '').trim();
      out(`<span class="cli-prompt">visitor@topgame:~$</span> ${esc(line)}`, 'cli-echo');
      if (!line) { scroll(); return; }
      history.push(line); hi = history.length;
      const [name, ...args] = line.split(/\s+/);
      const fn = cmds[name.toLowerCase()];
      if (!fn) { out(`command not found: ${esc(name)} — type 'help'`, 'cli-err'); scroll(); return; }
      const res = fn(args);
      if (res != null) out(res);
      scroll();
    };
    cliForm.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = history[hi] || ''; e.preventDefault(); } }
      else if (e.key === 'ArrowDown') { if (hi < history.length) { hi++; input.value = history[hi] || ''; } }
    });
    $('#cli').addEventListener('click', () => input.focus());
    out("type <b>help</b> for a list of commands.", 'cli-dim');
  }
})();
