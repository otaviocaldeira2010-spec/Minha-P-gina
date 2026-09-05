/* ============================================================
   OTÁVIO SANTOS — animações
   Vanilla JS, sem dependências.
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. PRELOADER + entrada do herói ---------- */
  const pre = $('#preloader');

  function playHero() {
    $$('[data-hero]').forEach((el, i) => {
      el.style.transition = 'transform 1.15s cubic-bezier(.16,1,.3,1)';
      el.style.transitionDelay = (0.06 + i * 0.11) + 's';
      el.style.transform = 'translateY(0)';
    });
    setTimeout(() => $('#wa') && $('#wa').classList.add('in'), 1400);
  }

  function bootDone() {
    if (!pre) { playHero(); return; }
    pre.classList.add('done');
    playHero();
    setTimeout(() => pre.remove(), 1300);
  }

  if (reduce) {
    if (pre) pre.remove();
    $$('[data-hero]').forEach(el => { el.style.transform = 'none'; });
    const wa = $('#wa'); if (wa) wa.classList.add('in');
  } else {
    // espera fontes + load, com teto de tempo para nunca travar
    let fired = false;
    const go = () => { if (!fired) { fired = true; bootDone(); } };
    const wait = document.fonts && document.fonts.ready
      ? document.fonts.ready : Promise.resolve();
    wait.then(() => setTimeout(go, 1250));
    window.addEventListener('load', () => setTimeout(go, 1450));
    setTimeout(go, 3200); // fallback duro
  }

  /* ---------- 2. REVEAL ON SCROLL ---------- */
  const revealTargets = $$('.rv, .mask, .rule');
  if (reduce) {
    revealTargets.forEach(el => el.classList.add('in'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -9% 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in'));
  }

  /* ---------- 3. CONTADORES ---------- */
  const counters = $$('[data-count]');
  if (counters.length) {
    const run = (el) => {
      const end = parseFloat(el.dataset.count);
      const suf = el.dataset.suffix || '';
      if (reduce) { el.textContent = end + suf; return; }
      const dur = 1500, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver((es) => {
        es.forEach(e => { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.6 });
      counters.forEach(el => cio.observe(el));
    } else counters.forEach(run);
  }

  /* ---------- 4. SCROLL: progresso, nav, parallax, seção ativa ---------- */
  const bar     = $('#progress');
  const nav     = $('#nav');
  const photo   = $('#heroPhoto');
  const blobs   = $$('[data-float]');
  const navA    = $$('#navLinks a');
  const sections = navA
    .map(a => { const t = $(a.getAttribute('href')); return t ? { a, t } : null; })
    .filter(Boolean);

  let lastY = window.scrollY, ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    if (nav) {
      nav.classList.toggle('solid', y > 60);
      // esconde ao descer, mostra ao subir (não no topo, não com menu aberto)
      const open = $('#sheet') && $('#sheet').classList.contains('open');
      if (!open && y > 320 && y > lastY + 4) nav.classList.add('hide');
      else if (y < lastY - 4 || y < 320) nav.classList.remove('hide');
    }

    if (!reduce) {
      // parallax só no desktop: no mobile a foto está em fluxo e não deve se mover
      const wide = window.innerWidth > 860;
      if (photo && wide && y < window.innerHeight * 1.35) {
        photo.style.transform = 'translate3d(0,' + (y * -0.075) + 'px,0)';
      } else if (photo && !wide && photo.style.transform) {
        photo.style.transform = '';
      }
      blobs.forEach(b => {
        b.style.transform = 'translate3d(0,' + (y * parseFloat(b.dataset.float) * 6) + 'px,0)';
      });
    }

    // link ativo
    let cur = null;
    sections.forEach(({ a, t }) => {
      const r = t.getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.42 && r.bottom >= window.innerHeight * 0.28) cur = a;
    });
    navA.forEach(a => a.classList.toggle('active', a === cur));

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 5. MENU MOBILE ---------- */
  const burger = $('#burger'), sheet = $('#sheet');
  if (burger && sheet) {
    const toggle = (force) => {
      const open = force !== undefined ? force : !sheet.classList.contains('open');
      sheet.classList.toggle('open', open);
      burger.classList.toggle('x', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && nav) nav.classList.remove('hide');
    };
    burger.addEventListener('click', () => toggle());
    $$('#sheet a').forEach(a => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sheet.classList.contains('open')) toggle(false);
    });
  }

  /* ---------- 6. SCROLL SUAVE COM OFFSET DA NAV ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const navH = nav ? nav.offsetHeight : 0;
      const top = t.getBoundingClientRect().top + window.scrollY - (id === '#top' ? 0 : navH - 1);
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- 7. CURSOR PERSONALIZADO ---------- */
  const cur = $('#cursor');
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (cur && fine && !reduce) {
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2, cx = tx, cy = ty, on = false;
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; cx = tx; cy = ty; cur.classList.add('on'); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    document.addEventListener('mouseenter', () => on && cur.classList.add('on'));

    (function loop() {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      cur.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
      requestAnimationFrame(loop);
    })();

    const label = cur.querySelector('i');
    $$('a, button, .pr-item, .step, .about-frame, .why-stack').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cur.classList.add('grow');
        if (label) label.textContent = el.dataset.cursor || (el.tagName === 'A' || el.tagName === 'BUTTON' ? 'clique' : 'ver');
      });
      el.addEventListener('mouseleave', () => cur.classList.remove('grow'));
    });
  } else if (cur) {
    cur.remove();
  }

  /* ---------- 8. TILT NO STACK DE CARTÕES ---------- */
  const stack = $('.why-stack');
  if (stack && fine && !reduce) {
    const front = $('.c-front', stack);
    stack.addEventListener('mousemove', (e) => {
      const r = stack.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (front) {
        front.style.transform =
          'rotate(-1.5deg) translateY(-12px) scale(1.015) perspective(900px) rotateY(' +
          (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 7).toFixed(2) + 'deg)';
      }
    });
    stack.addEventListener('mouseleave', () => {
      if (front) front.style.transform = '';
    });
  }

  /* ---------- 9. ANO NO RODAPÉ ---------- */
  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

})();
