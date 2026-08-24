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
  if (motion && isDesktop) { hgallery.classList.add('pinned'); }

  /* ---- Referencias del showcase ---- */
  var pieces = Array.prototype.slice.call(document.querySelectorAll('#sc-stage .piece'));
  var N = pieces.length;
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
    var h = hgallery.getBoundingClientRect();
    M.hStart = h.top + window.scrollY;
    M.hLen = hgallery.offsetHeight - window.innerHeight;
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

      var ip = clamp(p / 0.12, 0, 1);           // intro se va temprano
      scIntro.style.opacity = (1 - ip);
      scIntro.style.transform = 'translateY(' + (-ip * 80) + 'px) scale(' + (1 - ip * 0.06) + ')';
      scFill.style.height = (p * 100) + '%';

      var startP = 0.14, endP = 0.96, spanP = (endP - startP);
      var best = 0, bestD = 1e9;
      for (var k = 0; k < N; k++) {
        var t = startP + spanP * (k / (N - 1));
        var d = (p - t) / 0.12;                  // distancia normalizada al pico
        var ad = Math.min(Math.abs(d), 1.6);
        var op = clamp(1 - ad * 0.9, 0, 1);
        var scale = 1 - Math.min(ad, 1) * 0.16;
        var ty = d * -150;                        // sube al pasar
        var ry = clamp(d, -1.4, 1.4) * 15;        // giro 3D
        var tz = -Math.min(ad, 1) * 120;
        pieces[k].style.opacity = op;
        pieces[k].style.transform =
          'translate(-50%,-50%) translate3d(0,' + ty + 'px,' + tz + 'px) rotateY(' + ry + 'deg) scale(' + scale + ')';
        pieces[k].style.zIndex = Math.round(100 - ad * 50);
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = k; }
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
