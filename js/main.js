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
  /* Menú móvil: overlay dedicado, hijo de body (evita bugs de posición del header) */
  var mb = document.getElementById('menu-btn');
  var headerNav = document.querySelector('header nav');
  if (mb && headerNav) {
    var mm = document.createElement('div');
    mm.id = 'mobile-menu';
    var html = '';
    Array.prototype.slice.call(headerNav.querySelectorAll('a')).forEach(function (a) {
      html += '<a href="' + a.getAttribute('href') + '">' + a.textContent + '</a>';
    });
    html += '<button class="lang-toggle" aria-label="Switch language"><span data-l="es">ES</span><span class="sep">·</span><span data-l="en">EN</span></button>';
    mm.innerHTML = html;
    document.body.appendChild(mm);

    var TT = function (s) { return window.__T ? window.__T(s) : s; };
    function closeMenu() {
      document.body.classList.remove('nav-open');
      mb.textContent = TT('Menú');
      mb.setAttribute('aria-expanded', 'false');
    }
    mb.setAttribute('aria-expanded', 'false');
    mb.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      mb.textContent = open ? TT('Cerrar') : TT('Menú');
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    Array.prototype.slice.call(mm.querySelectorAll('a')).forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeMenu();
    });
  }
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
   Fondo espacial: estrellas con parallax + galaxias/nebulosas que pasan
   al scrollear. Sutil y difuminado. Respeta reduced-motion.
   ========================================================================= */
(function () {
  "use strict";
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = document.getElementById('space');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W, H, DPR, stars, nebs, raf, t = 0;

  var PALETTE = [
    [150, 110, 235],   // violeta
    [90, 140, 225],    // azul
    [220, 110, 175],   // magenta
    [95, 190, 190],    // teal
    [222, 172, 120]    // champagne
  ];

  function build() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = Math.floor(window.innerWidth * DPR);
    H = cv.height = Math.floor(window.innerHeight * DPR);

    var count = Math.round((window.innerWidth * window.innerHeight) / 8000);
    count = Math.max(90, Math.min(count, 280));
    stars = [];
    for (var i = 0; i < count; i++) {
      var z = Math.random() * 0.8 + 0.2;
      stars.push({ x: Math.random() * W, y: Math.random() * H, z: z, r: (z * 1.4 + 0.25) * DPR, tw: Math.random() * 6.2832 });
    }

    nebs = [];
    var nn = 7;
    for (var j = 0; j < nn; j++) {
      nebs.push({
        x: Math.random() * W,
        y: Math.random() * H * 2,               // repartidas en 2 pantallas
        r: (Math.random() * 0.28 + 0.24) * H,   // grandes y suaves
        z: Math.random() * 0.22 + 0.10,         // lejanas => se mueven lento
        col: PALETTE[j % PALETTE.length],
        a: Math.random() * 0.06 + 0.11          // alpha .11 - .17
      });
    }
  }

  function drawNeb(n, y) {
    if (y + n.r < 0 || y - n.r > H) return;
    var c = n.col;
    var g = ctx.createRadialGradient(n.x, y, 0, n.x, y, n.r);
    g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + n.a + ')');
    g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(n.x - n.r, y - n.r, n.r * 2, n.r * 2);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var sc = (window.scrollY || 0) * DPR;
    var per = H * 2;

    // galaxias (aditivas para que brillen)
    ctx.globalCompositeOperation = 'lighter';
    for (var j = 0; j < nebs.length; j++) {
      var n = nebs[j];
      var ny = ((n.y - sc * n.z * 0.25) % per + per) % per;
      drawNeb(n, ny);
      drawNeb(n, ny - per);
    }
    ctx.globalCompositeOperation = 'source-over';

    // estrellas
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var y = ((s.y - sc * s.z * 0.25) % H + H) % H;
      var a = 0.25 + (0.5 + 0.5 * Math.sin(t * 0.001 * s.z + s.tw)) * 0.55 * s.z;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, 6.2832);
      ctx.fillStyle = '#EDE6DA';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop() { t += 16; draw(); raf = requestAnimationFrame(loop); }

  function startFx() {
    build();
    if (raf) cancelAnimationFrame(raf);
    if (reduced) { draw(); } else { loop(); }
  }

  startFx();
  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(startFx, 200); });
})();

/* =========================================================================
   i18n — Español/Inglés. Detecta idioma del navegador (es → español,
   otro → inglés), permite cambiar manual y recuerda la elección.
   ========================================================================= */
(function () {
  "use strict";
  var STR = {
    "Piezas":"Pieces","Trabajo":"Work","Disciplinas":"Expertise","Perfil":"Profile","Contacto":"Contact",
    "Menú":"Menu","Cerrar":"Close",
    "Portafolio · 2026":"Portfolio · 2026",
    "Diseño publicitario,":"Advertising design,",
    "y crecimiento digital.":"and digital growth.",
    "Diseño piezas gráficas, creo y gestiono campañas de paid media en Meta, Google y TikTok, y construyo tiendas Shopify que crecen — de la estrategia a la ejecución.":
"I design creative assets, build and run paid media campaigns on Meta, Google and TikTok, and develop Shopify stores that grow — from strategy to execution.",
    "Abierto a nuevas oportunidades":"Open to new opportunities",
    "Diseño publicitario":"Advertising design",
    "Key visuals, promos de performance, lanzamientos y contenido social — sistema de marca coherente, listo para pauta.":
"Key visuals, performance creatives, launches and social content — a coherent brand system, ready to run.",
    "Campaña · Print & Digital":"Campaign · Print & Digital",
    "Producto · Key Visual":"Product · Key Visual",
    "Social · Carrusel":"Social · Carousel",
    "Campaña · Pieza":"Campaign · Creative asset",
    "Estrategia y ejecución hands-on de campañas de performance. Diseño el embudo, produzco los creativos y optimizo por ROAS en las tres plataformas clave.":
      "Hands-on strategy and execution of performance campaigns. I design the funnel, produce the creatives and optimize for ROAS across the three key platforms.",
    "Inversión gestionada (CLP)":"Managed ad spend (CLP)",
    "ROAS promedio":"Avg. ROAS",
    "Campañas lanzadas":"Campaigns launched",
    "Reducción de CPA":"CPA reduction",
    "Prospecting y retargeting en Facebook e Instagram.":"Prospecting and retargeting on Facebook and Instagram.",
    "Search, Shopping y Performance Max.":"Search, Shopping and Performance Max.",
    "Contenido nativo y creativos de performance.":"Native content and performance creatives.",
    "Ver detalle →":"View details →",
    "Facebook e Instagram — full-funnel, de awareness a conversión.":"Facebook and Instagram — full-funnel, from awareness to conversion.",
    "Intención de compra capturada en Search, Shopping y PMax.":"Purchase intent captured across Search, Shopping and PMax.",
    "Creativos nativos que rinden como contenido, no como anuncio.":"Native creatives that perform like content, not ads.",
    "Inversión (CLP)":"Ad spend (CLP)","Conversiones":"Conversions","Impresiones":"Impressions",
    "Tipos de campaña":"Campaign types","Catálogo":"Catalog",
    "Trabajo seleccionado":"Selected work","Sitios web":"Websites",
    "Gestión y desarrollo de tiendas Shopify para Singolare, Amazing Care, United Footwear y Jose Herrera Bikinis: CRO, creación de secciones a medida y optimización de PDP y checkout.":
      "Management and development of Shopify stores for Singolare, Amazing Care, United Footwear and Jose Herrera Bikinis: CRO, custom section building and PDP & checkout optimization.",
    "Gestión":"Management",
    "Monitor de fulfillment":"Fulfillment monitor",
    "Automatización con Google Apps Script que integra Envíame y Shopify, con alertas estructuradas y disparadores diarios y semanales.":
      "Google Apps Script automation integrating Envíame and Shopify, with structured alerts and daily and weekly triggers.",
    "Automatización":"Automation","Integración":"Integration",
    "Auditoría de descuentos":"Discount audit",
    "Análisis de abuso de códigos con Shopify GraphQL: detección de patrones multicuenta y recomendaciones para proteger el margen.":
      "Discount-code abuse analysis with Shopify GraphQL: multi-account pattern detection and recommendations to protect margin.",
    "Estrategia":"Strategy",
    "Marca y sitio de artista: animación de partículas, soporte multilingüe, sección de pre-save y audio ambiente. Desplegado en Vercel.":
      "Artist brand and website: particle animation, multilingual support, pre-save section and ambient audio. Deployed on Vercel.",
    "Diseño":"Design",
    "Marcas & sitios":"Brands & sites","Con las que he trabajado":"That I've worked with",
    "Moda premium":"Premium fashion","Medicina estética":"Aesthetic medicine",
    "Calzado":"Footwear","Moda · Bikinis":"Fashion · Swimwear","Sitio de artista":"Artist site",
    "Qué hago":"What I do",
    "Key visuals, piezas para pauta, promos y sistemas de marca. Dirección visual premium y editorial.":
"Key visuals, ad creatives, promos and brand systems. Premium, editorial art direction.",
    "Branding · Campañas · Social":"Branding · Campaigns · Social",
    "Desarrollo a medida en Liquid, Theme Editor, GraphQL y gestión de catálogo.":
      "Custom development in Liquid, Theme Editor, GraphQL and catalog management.",
    "Desarrollo web":"Web development",
    "Secciones y componentes personalizados, flujo con GitHub y despliegue en Vercel.":
      "Custom sections and components, GitHub workflow and Vercel deployment.",
    "SEO técnico, datos estructurados, redirecciones y visibilidad en buscadores de IA.":
      "Technical SEO, structured data, redirects and visibility in AI search engines.",
    "Estrategia y ejecución hands-on de campañas de performance: estructura de cuentas, creativos, segmentación y optimización por ROAS.":
      "Hands-on strategy and execution of performance campaigns: account structure, creatives, targeting and ROAS optimization.",
    "Medición confiable de punta a punta y tableros para decidir con datos.":
      "Reliable end-to-end measurement and dashboards to decide with data.",
    "Analítica & CRM":"Analytics & CRM",
    "Flujos de retención y campañas segmentadas: bienvenida, carrito abandonado, post-compra y newsletters.":
      "Retention flows and segmented campaigns: welcome, abandoned cart, post-purchase and newsletters.",
    "Creatividad con oficio.":"Craft-driven creativity.",
    "Soy Aníbal, diseñador y gestor de ecommerce con base en Santiago. Trabajo donde se cruzan la creatividad, el código y el crecimiento: concibo la pieza, construyo la solución técnica y la llevo a resultados.":
      "I'm Aníbal, a designer and ecommerce manager based in Santiago. I work where creativity, code and growth meet: I conceive the piece, build the technical solution and drive it to results.",
    "Originario de Argentina y radicado en Chile hace años, trabajo en español e inglés con clientes locales e internacionales. Me mueven los sistemas prácticos, la iteración rápida y construir cosas que funcionan.":
      "Originally from Argentina and based in Chile for years, I work in Spanish and English with local and international clients. I'm driven by practical systems, fast iteration and building things that work.",
    "Base":"Based in","Idiomas":"Languages","Español · Inglés":"Spanish · English",
    "Rol actual":"Current role","Consultoría":"Consultancy",
    "Diseñemos tu":"Let's design your","próxima campaña":"next campaign",
    "© 2026 Aníbal Solis — Todos los derechos reservados":"© 2026 Aníbal Solis — All rights reserved",
    "Diseño y desarrollo propio":"Designed & developed in-house"
  };
  var RICH = [{ sel: '#sc-intro h2', es: 'Piezas <em>gráficas</em>', en: 'Creative <em>assets</em>' }];
  var TITLE = { es: 'Aníbal — Diseño · Paid Media · Ecommerce · Digital', en: 'Aníbal — Design · Paid Media · Ecommerce · Digital' };
  var DESC = {
    es: 'Portafolio de Aníbal. Diseño publicitario, campañas de paid media (Meta, Google, TikTok), ecommerce y desarrollo web para marcas que venden online.',
    en: 'Portfolio of Aníbal. Advertising design, paid media campaigns (Meta, Google, TikTok), ecommerce and web development for brands that sell online.'
  };

  var nodes = [], collected = false;
  function collect() {
    if (collected) return; collected = true;
    var rich = document.querySelector('#sc-intro h2');
    if (rich) rich.classList.add('i18n-rich');
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || p.closest('script,style,.i18n-rich,.lang-toggle')) return NodeFilter.FILTER_REJECT;
        var tr = n.nodeValue.trim();
        return (tr && STR.hasOwnProperty(tr)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var raw = node.nodeValue, tr = raw.trim(), i = raw.indexOf(tr);
      nodes.push({ node: node, es: tr, lead: raw.slice(0, i), trail: raw.slice(i + tr.length) });
    }
  }

  var toggle, T;
  function apply(lang) {
    window.__lang = lang;
    collect();
    var en = (lang === 'en');
    for (var i = 0; i < nodes.length; i++) {
      var o = nodes[i];
      o.node.nodeValue = o.lead + (en ? (STR[o.es] || o.es) : o.es) + o.trail;
    }
    RICH.forEach(function (r) { var el = document.querySelector(r.sel); if (el) el.innerHTML = en ? r.en : r.es; });
    Array.prototype.slice.call(document.querySelectorAll('#sc-stage .piece')).forEach(function (fig) {
      var es = fig.getAttribute('data-cap-es');
      if (!es) { es = fig.getAttribute('data-cap'); fig.setAttribute('data-cap-es', es); }
      fig.setAttribute('data-cap', en ? (STR[es] || es) : es);
    });
    document.documentElement.lang = lang;
    document.title = en ? TITLE.en : TITLE.es;
    var m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', en ? DESC.en : DESC.es);
    var mb = document.getElementById('menu-btn');
    if (mb && !document.body.classList.contains('nav-open')) mb.textContent = en ? 'Menu' : 'Menú';
    if (toggle) toggle.querySelectorAll('span[data-l]').forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-l') === lang); });
    Array.prototype.slice.call(document.querySelectorAll('.lang-toggle span[data-l]')).forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-l') === lang); });
    try { window.dispatchEvent(new Event('scroll')); } catch (e) {}
  }

  window.__T = function (s) { return (window.__lang === 'en' && STR[s]) ? STR[s] : s; };

  function detect() {
    try { var s = localStorage.getItem('lang'); if (s === 'es' || s === 'en') return s; } catch (e) {}
    var langs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < langs.length; i++) { if ((langs[i] || '').toLowerCase().indexOf('es') === 0) return 'es'; }
    return 'en';
  }

  // selector ES/EN: uno en el header (desktop) + el del menú móvil (ya creado)
  var nav = document.querySelector('header nav');
  if (nav) {
    toggle = document.createElement('button');
    toggle.className = 'lang-toggle';
    toggle.setAttribute('aria-label', 'Cambiar idioma / Switch language');
    toggle.innerHTML = '<span data-l="es">ES</span><span class="sep">·</span><span data-l="en">EN</span>';
    nav.appendChild(toggle);
  }
  Array.prototype.slice.call(document.querySelectorAll('.lang-toggle')).forEach(function (tg) {
    tg.addEventListener('click', function (e) {
      var sp = e.target.closest('span[data-l]');
      var next = sp ? sp.getAttribute('data-l') : (window.__lang === 'es' ? 'en' : 'es');
      try { localStorage.setItem('lang', next); } catch (er) {}
      apply(next);
    });
  });

  apply(detect());
})();
