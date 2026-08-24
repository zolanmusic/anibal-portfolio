/* =========================================================================
   Aníbal — Portafolio
   Motor de scroll (vanilla JS, sin dependencias).
   - Showcase pinned con scrub 3D de piezas
   - Galería horizontal ligada al scroll (desktop)
   - Parallax en hero, tilt en cards, reveals
   - Respeta prefers-reduced-motion y funciona sin JS
   ========================================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop = window.matchMedia('(min-width: 821px)').matches;
  var motion = !reduced;
  if (motion) document.body.classList.add('motion');

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var header = document.getElementById('site-header');
  var showcase = document.getElementById('showcase');

  /* ---- Reveals ---- */
  if (motion) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i, 6) * 55) + 'ms';
      io.observe(el);
    });
  }

  /* ---- Galería horizontal: pin solo en desktop ---- */
  var hgallery = document.getElementById('hgallery');
  var htrack = document.getElementById('htrack');
  if (motion && isDesktop && hgallery) { hgallery.classList.add('pinned'); }

  /* ---- Referencias del showcase ---- */
  var pieces = Array.prototype.slice.call(document.querySelectorAll('#sc-stage .piece'));
  var N = pieces.length;
  // Más piezas => más recorrido de scroll, para que cada una respire.
  if (motion && showcase) { showcase.style.height = (N * 82 + 120) + 'vh'; }
  var scIntro = document.getElementById('sc-intro');
  var scFill = document.getElementById('sc-fill');
  var scNum = document.getElementById('sc-num');
  var scCap = document.getElementById('sc-cap');
  var glow = document.getElementById('glow');
  var lastActive = -1;

  var layers = Array.prototype.slice.call(document.querySelectorAll('.hero .layer'));
  var tilts = Array.prototype.slice.call(document.querySelectorAll('.work-item.tilt'));
  var ticking = false;

  /* ---- Métricas cacheadas (evita layout thrash) ---- */
  var M = {};
  function measure() {
    var s = showcase.getBoundingClientRect();
    M.scStart = s.top + window.scrollY;
    M.scLen = showcase.offsetHeight - window.innerHeight;
    if (hgallery) {
      var h = hgallery.getBoundingClientRect();
      M.hStart = h.top + window.scrollY;
      M.hLen = hgallery.offsetHeight - window.innerHeight;
    } else { M.hStart = 0; M.hLen = 0; }
    if (htrack) { M.trackOver = Math.max(0, htrack.scrollWidth - window.innerWidth + 40); }
    M.vh = window.innerHeight;
  }

  /* ---- Loop principal ---- */
  function update() {
    var y = window.scrollY;

    header.classList.toggle('scrolled', y > 40);
    var scRect = showcase.getBoundingClientRect();
    header.classList.toggle('on-dark', scRect.top < 70 && scRect.bottom > 70);

    if (!motion) { ticking = false; return; }

    /* Parallax hero (solo cerca del top) */
    if (y < M.vh * 1.2) {
      for (var i = 0; i < layers.length; i++) {
        var sp = parseFloat(layers[i].getAttribute('data-speed')) || 0;
        layers[i].style.transform = 'translateY(' + (y * sp) + 'px)';
      }
    }

    /* Showcase scrub */
    if (M.scLen > 0) {
      var p = clamp((y - M.scStart) / M.scLen, 0, 1);

      var ip = clamp(p / 0.07, 0, 1);           // intro se va temprano
      scIntro.style.opacity = (1 - ip);
      scIntro.style.transform = 'translateY(' + (-ip * 80) + 'px) scale(' + (1 - ip * 0.06) + ')';
      scFill.style.height = (p * 100) + '%';

      // Cada pieza tiene su propio "segmento" de scroll con un tramo donde
      // se ve SOLA (opacidad 1, vecinas ocultas) y transiciones rápidas.
      var base = 0.08, span = 0.90, seg = span / N;
      var best = 0, bestD = 1e9;
      for (var k = 0; k < N; k++) {
        var center = base + (k + 0.5) * seg;
        var d = (p - center) / seg;               // 0 = su momento solo, ±1 = vecina
        var adm = Math.abs(d);
        // opacidad: plena mientras |d|<=0.22, baja a 0 en |d|=0.60 (solo limpio + crossfade corto)
        var op = clamp(1 - (adm - 0.22) / 0.38, 0, 1);
        var mv = clamp((adm - 0.10) / 0.5, 0, 1); // cuánto se alejó del centro
        var sgn = d < 0 ? -1 : 1;
        var ty = sgn * mv * -170;                 // entra desde abajo, sale hacia arriba
        var ry = sgn * mv * 22;                   // giro 3D
        var tz = -mv * 200;
        var scale = 1 - mv * 0.16;
        pieces[k].style.opacity = op;
        pieces[k].style.transform =
          'translate(-50%,-50%) translate3d(0,' + ty + 'px,' + tz + 'px) rotateY(' + ry + 'deg) scale(' + scale + ')';
        pieces[k].style.zIndex = Math.round(100 - adm * 60);
        if (adm < bestD) { bestD = adm; best = k; }
      }

      if (best !== lastActive) {
        lastActive = best;
        scNum.textContent = ('0' + (best + 1)).slice(-2);
        scCap.style.opacity = 0;
        (function (idx) {
          setTimeout(function () {
            scCap.textContent = pieces[idx].getAttribute('data-cap');
            scCap.style.opacity = 1;
          }, 170);
        })(best);
        glow.style.setProperty('--gx', (30 + (best / (N - 1)) * 40) + '%');
        glow.style.setProperty('--gy', (40 + (best % 2) * 15) + '%');
      }
    }

    /* Galería horizontal (desktop pinned) */
    if (isDesktop && M.hLen > 0 && htrack) {
      var hp = clamp((y - M.hStart) / M.hLen, 0, 1);
      htrack.style.transform = 'translateX(' + (-hp * M.trackOver) + 'px)';
    }

    /* Tilt sutil de cards por posición en viewport */
    for (var w = 0; w < tilts.length; w++) {
      var r = tilts[w].getBoundingClientRect();
      var rel = ((r.top + r.height / 2) - M.vh / 2) / M.vh;
      tilts[w].style.transform = 'perspective(1200px) rotateX(' + (clamp(-rel, -1, 1) * 3.5) + 'deg)';
    }

    ticking = false;
  }

  /* ---- Tilt con mouse (desktop) ---- */
  if (motion && isDesktop) {
    tilts.forEach(function (el) {
      el.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'perspective(1200px) rotateY(' + (((ev.clientX - r.left) / r.width - 0.5) * 5) + 'deg)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  measure(); update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  window.addEventListener('load', function () { measure(); update(); });

  /* Botón de menú móvil -> salta al showcase */
  document.getElementById('menu-btn').addEventListener('click', function () {
    document.getElementById('showcase').scrollIntoView({ behavior: 'smooth' });
  });
})();

/* =========================================================================
   Extras: count-up de métricas, modales de Paid Media, loop del marquee
   ========================================================================= */
(function () {
  "use strict";
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Count-up de las métricas de Paid Media ---- */
  var stats = Array.prototype.slice.call(document.querySelectorAll('.stat .v[data-target]'));
  function animateStat(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = pre + target.toFixed(dec) + suf; return; }
    var start = performance.now(), dur = 1400;
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = pre + (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var paid = document.getElementById('paid');
  if (paid && stats.length) {
    var seen = false;
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !seen) { seen = true; stats.forEach(animateStat); io2.disconnect(); }
      });
    }, { threshold: 0.3 });
    io2.observe(paid);
  }

  /* ---- Modales de plataforma ---- */
  var lastFocus = null;
  function openModal(key) {
    var ov = document.getElementById('modal-' + key);
    if (!ov) return;
    lastFocus = document.activeElement;
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var c = ov.querySelector('.close');
    if (c) c.focus();
  }
  function closeModal(ov) {
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  Array.prototype.slice.call(document.querySelectorAll('[data-modal]')).forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn.getAttribute('data-modal')); });
  });
  Array.prototype.slice.call(document.querySelectorAll('.modal-overlay')).forEach(function (ov) {
    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(ov); });
    var c = ov.querySelector('.close');
    if (c) c.addEventListener('click', function () { closeModal(ov); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var open = document.querySelector('.modal-overlay.open');
      if (open) closeModal(open);
    }
  });

  /* ---- Marquee sin costuras: duplica las tarjetas (solo con motion) ---- */
  var track = document.getElementById('marquee-track');
  if (track && !reduced) {
    track.innerHTML += track.innerHTML;
  }
})();

/* =========================================================================
   Spinner de carga por imagen: muestra un anillo girando mientras la
   imagen descarga y hace fade-in al terminar. Cubre piezas y marcas
   (incluidas las tarjetas duplicadas del marquee).
   ========================================================================= */
(function () {
  "use strict";
  function attach(container) {
    if (!container) return;
    var img = container.querySelector('img');
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) { container.classList.add('is-loaded'); return; }
    var sp = document.createElement('span');
    sp.className = 'img-spinner';
    sp.style.opacity = '0';                        // oculto al inicio
    container.appendChild(sp);
    var t = setTimeout(function () { sp.style.opacity = ''; }, 220); // solo si tarda >0.22s
    function done() { clearTimeout(t); container.classList.add('is-loaded'); }
    img.addEventListener('load', done);
    img.addEventListener('error', done); // no dejar el spinner pegado si falla
  }
  Array.prototype.slice.call(document.querySelectorAll('#sc-stage .piece')).forEach(attach);
  Array.prototype.slice.call(document.querySelectorAll('.site-preview')).forEach(attach);
})();

/* =========================================================================
   Fondo espacial: campo de estrellas con parallax al scrollear + nebulosa.
   Sutil y difuminado para no entorpecer la lectura. Respeta reduced-motion.
   ========================================================================= */
(function () {
  "use strict";
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = document.getElementById('space');
  var neb = document.getElementById('nebula');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W, H, DPR, stars, raf, t = 0;

  function build() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = Math.floor(window.innerWidth * DPR);
    H = cv.height = Math.floor(window.innerHeight * DPR);
    var count = Math.round((window.innerWidth * window.innerHeight) / 9000);
    count = Math.max(90, Math.min(count, 260));
    stars = [];
    for (var i = 0; i < count; i++) {
      var z = Math.random() * 0.8 + 0.2;         // profundidad
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: z,
        r: (z * 1.4 + 0.25) * DPR,
        tw: Math.random() * 6.2832
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var sc = (window.scrollY || 0) * DPR;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var y = ((s.y - sc * s.z * 0.25) % H + H) % H;   // parallax + loop infinito
      var a = 0.25 + (0.5 + 0.5 * Math.sin(t * 0.001 * s.z + s.tw)) * 0.55 * s.z; // titileo
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, 6.2832);
      ctx.fillStyle = '#EDE6DA';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (neb) neb.style.transform = 'translateY(' + ((window.scrollY || 0) * 0.05) + 'px)';
  }

  function loop() { t += 16; draw(); raf = requestAnimationFrame(loop); }

  function start() {
    build();
    if (raf) cancelAnimationFrame(raf);
    if (reduced) { draw(); } else { loop(); }
  }

  start();
  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(start, 200);
  });
})();
