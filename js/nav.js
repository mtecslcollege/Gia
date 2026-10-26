/* =====================================================================
   GIA SHARED NAVIGATION  (js/nav.js)
   Builds the top bar, header, main menu and footer, so every page shares
   one design and one place to edit.

   HOW TO USE ON ANY PAGE
     <link rel="stylesheet" href="css/nav.css">
     <div id="gia-header"></div>
     ... page content (<main id="main">) ...
     <div id="gia-footer"></div>
     <script src="js/nav.js"></script>

   To add or rename a menu item, edit the MENU array below.
   ===================================================================== */
(function () {
  'use strict';

  var MENU = [
    ['Home', 'index.html'],
    ['About Us', 'about.html'],
    ['Academic Programmes', 'Academic_programs.html'],
    ['Departments', 'department.html'],
    ['Campus Life', 'campus-life.html'],
    ['Gallery', 'gallery.html'],
    ['News & Events', 'news-events.html'],
    ['Staff', 'staff.html'],
    ['Contact Us', 'contact-us.html']
  ];
  var BUTTONS = [
    ['Apply Now', 'online_registration.html', 'gold'],
    ['Portal Login', 'https://giasl.lovable.app/portal', 'line']
  ];
  var LEGAL = ['Privacy Policy & Terms', 'privacy-terms.html'];
  var SCHOOL = {
    name: 'Gbonkolenken International Academy',
    motto: 'Seat of Wisdom',
    address: 'New Jersey - Makama - Makeni - Sierra Leone',
    email: 'infogia@gmail.com',
    web: 'giamakeni.com',
    whatsapp: 'https://wa.me/232888186296',
    social: [
      ['Facebook', 'https://www.facebook.com/profile.php?id=61592291687920'],
      ['Instagram', 'https://www.instagram.com/gbonkolenschool'],
      ['TikTok', 'https://www.tiktok.com/@gbonkolenschool'],
      ['YouTube', 'https://www.youtube.com/@GbonkolenSchool']
    ]
  };

  function esc(s) { return String(s).replace(/&/g, '&amp;'); }
  var current = (document.body.getAttribute('data-page') ||
    decodeURIComponent(location.pathname.split('/').pop() || 'index.html')).toLowerCase();
  if (current === '') current = 'index.html';
  function here(href) { return href.toLowerCase() === current ? ' aria-current="page"' : ''; }

  function link(item) { return '<a href="' + item[1] + '"' + here(item[1]) + '>' + esc(item[0]) + '</a>'; }

  var headerHTML =
    '<a class="skip" href="#' + (document.body.getAttribute('data-main') || 'main') + '">Skip to main content</a>' +
    '<div class="topbar"><div class="wrap"><div class="l">' +
    '<span>\u2709 <a href="mailto:' + SCHOOL.email + '">' + SCHOOL.email + '</a></span>' +
    '<span>\uD83C\uDF10 <a href="https://' + SCHOOL.web + '">' + SCHOOL.web + '</a></span></div>' +
    '<div>' + link(LEGAL) + '</div></div></div>' +
    '<header class="site"><div class="hd"><div class="wrap">' +
    '<a class="brand" href="index.html"><span class="badge"><img src="images/logo.png" alt="GIA school crest"></span>' +
    '<span><b>' + SCHOOL.name + '</b><small>' + SCHOOL.motto + '</small></span></a>' +
    '<div class="cta d">' + BUTTONS.map(function (b) {
      return '<a class="btn ' + b[2] + '" href="' + b[1] + '"' + here(b[1]) + '>' + esc(b[0]) + '</a>';
    }).join('') + '</div>' +
    '<button class="burger" type="button" aria-controls="nav" aria-expanded="false">\u2630 Menu</button>' +
    '</div></div>' +
    '<nav class="main" id="nav" aria-label="Main navigation"><ul>' +
    MENU.map(function (m) { return '<li>' + link(m) + '</li>'; }).join('') +
    BUTTONS.map(function (b) { return '<li class="mob">' + link(b) + '</li>'; }).join('') +
    '<li class="mob">' + link(LEGAL) + '</li></ul></nav></header>';

  var footerHTML =
    '<footer class="site"><div class="wrap fg">' +
    '<div><div class="fb"><img src="images/logo.png" alt="GIA crest"><b>' + SCHOOL.name + '</b></div>' +
    '<p><em>' + SCHOOL.motto + '</em></p><p>' + SCHOOL.address + '</p>' +
    '<div class="soc">' + SCHOOL.social.map(function (s) {
      return '<a href="' + s[1] + '" target="_blank" rel="noopener">' + s[0] + '</a>';
    }).join('') + '</div></div>' +
    '<div><h4>Explore</h4><ul>' + MENU.slice(0, 4).map(function (m) { return '<li>' + link(m) + '</li>'; }).join('') + '</ul></div>' +
    '<div><h4>Community</h4><ul>' + MENU.slice(4).map(function (m) { return '<li>' + link(m) + '</li>'; }).join('') +
    BUTTONS.map(function (b) { return '<li>' + link(b).replace('\uD83D\uDD12 ', '') + '</li>'; }).join('') +
    '<li>' + link(LEGAL) + '</li></ul></div>' +
    '<div><h4>Contact</h4><p><a href="mailto:' + SCHOOL.email + '">' + SCHOOL.email + '</a></p>' +
    '<p><a href="' + SCHOOL.whatsapp + '" target="_blank" rel="noopener">WhatsApp us</a></p>' +
    '<p><a href="https://' + SCHOOL.web + '">' + SCHOOL.web + '</a></p>' +
    '<p>School terms: First \u00B7 Second \u00B7 Third</p></div></div>' +
    '<div class="copy">\u00A9 ' + new Date().getFullYear() + ' ' + SCHOOL.name + ' (GIA). All rights reserved. \u00B7 ' + link(LEGAL) + '</div></footer>' +
    '<button class="totop" type="button" aria-label="Back to top">\u2191</button>';

  function mount(id, html, where) {
    var el = document.getElementById(id);
    if (!el) { el = document.createElement('div'); el.id = id; document.body.insertAdjacentElement(where, el); }
    el.innerHTML = html;
    el.style.minHeight = '0';
  }
  var IC = {
    home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6M20 4v14h-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; }
  function tab(label, href, icon, cls) {
    return '<a href="' + href + '"' + (cls ? ' class="' + cls + '"' : '') + here(href) + '>' + (cls === 'apply' ? '<span class="ic">' + ic(icon) + '</span>' : ic(icon)) + label + '</a>';
  }
  var tabHTML = '<nav class="tabbar" aria-label="Quick navigation">' +
    tab('Home', 'index.html', 'home') + tab('Programmes', 'Academic_programs.html', 'book') +
    tab('Apply', 'online_registration.html', 'plus', 'apply') + tab('Portal', 'https://giasl.lovable.app/portal', 'lock') +
    '<button type="button" class="moretab" aria-controls="nav" aria-expanded="false">' + ic('menu') + 'More</button></nav>';
  footerHTML += tabHTML;
  mount('gia-header', headerHTML, 'afterbegin');
  mount('gia-footer', footerHTML, 'beforeend');

  var burger = document.querySelector('.moretab'), nav = document.getElementById('nav');
  function closeMenu() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !e.target.closest('header.site') && !e.target.closest('.tabbar')) closeMenu();
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 960) closeMenu(); });

  var top = document.querySelector('.totop');
  window.addEventListener('scroll', function () { top.classList.toggle('on', window.scrollY > 600); }, { passive: true });
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* Scroll-reveal for any element with class "rv" */
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var ob = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ob.unobserve(e.target); } });
    }, { threshold: .1 });
    els.forEach(function (e) { ob.observe(e); });
  } else els.forEach(function (e) { e.classList.add('in'); });

  /* Side contents list highlight (privacy page, long pages) */
  var t = document.querySelectorAll('.toc a');
  if (t.length && 'IntersectionObserver' in window) {
    var m = {}; t.forEach(function (a) { m[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && m[e.target.id]) { t.forEach(function (a) { a.classList.remove('on'); }); m[e.target.id].classList.add('on'); } });
    }, { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('[data-spy] section[id], [data-spy][id]').forEach(function (s) { so.observe(s); });
  }
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
