/* =====================================================================
   PHOTO GALLERY  (js/gallery.js)   needs js/content.js first
   Used by the School Gallery page (all photos) and Campus Life (preview).
   To add built-in photos: copy the file into /images and add a line below.
   ===================================================================== */
(function () {
  'use strict';
  var G = window.GIA = window.GIA || {};
  var C = G.content;
  var PHOTOS = [
    ['campus-front', 'School building', 'Campus', 'Our three-storey school building in Makama, Makeni'],
    ['school-gate', 'School gate', 'Campus', 'The main entrance of the Academy'],
    ['hero-campus', 'Classroom block', 'Campus', 'Open balconies of the classroom block'],
    ['corridor', 'School corridor', 'Campus', 'A bright first-floor corridor'],
    ['kindergarten', 'Kindergarten classroom', 'Early Years', 'Child-sized tables and chairs for learning through play'],
    ['daycare', 'Day-care room', 'Early Years', 'A calm, caring space for our youngest learners'],
    ['science-lab', 'Science laboratory', 'Science Laboratories', 'Apparatus, anatomy model and chalkboard'],
    ['lab-chemistry', 'Chemistry apparatus', 'Science Laboratories', 'Burettes, flasks and stands for practical chemistry'],
    ['chemistry-reagents', 'Chemistry reagents', 'Science Laboratories', 'Laboratory chemicals and glassware'],
    ['lab-equipment', 'Laboratory equipment', 'Science Laboratories', 'Science equipment stored for practical lessons'],
    ['microscopes', 'Microscopes', 'Science Laboratories', 'Microscopes for Biology practical work'],
    ['anatomy-models', 'Human anatomy models', 'Science Laboratories', 'A torso model and organs used in Biology'],
    ['anatomy-skeleton', 'Skeleton model', 'Science Laboratories', 'A skeleton and models for learning human anatomy'],
    ['library', 'School library', 'Library and Computer Room', 'Books and reading resources for students and teachers'],
    ['library-shelves', 'Library shelves', 'Library and Computer Room', 'Textbooks and storybooks on open shelves'],
    ['computer-lab', 'Computer room', 'Library and Computer Room', 'Desktop computers for Computer Studies lessons'],
    ['computer-lab-2', 'Computer workstations', 'Library and Computer Room', 'Workstations for practice and typing']
  ];
  var lb, items = [], at = 0, lastFocus;

  function all() {
    var ex = C.data().gallery.map(function (g, i) { return { src: g.src, t: g.cap || 'School photo', c: g.cat || 'Campus', d: g.cap || '', x: i }; });
    return ex.concat(PHOTOS.map(function (p) { return { src: 'images/' + p[0] + '.jpg', t: p[1], c: p[2], d: p[3], x: -1 }; }));
  }
  function ensureLightbox() {
    if (lb) return;
    lb = document.createElement('div'); lb.className = 'lbx'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<button class="cl" type="button" aria-label="Close">\u00D7</button><button class="pv" type="button" aria-label="Previous photo">\u2039</button><figure><img alt=""><figcaption></figcaption></figure><button class="nx" type="button" aria-label="Next photo">\u203A</button>';
    document.body.appendChild(lb);
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('cl')) close();
      else if (e.target.classList.contains('pv')) step(-1); else if (e.target.classList.contains('nx')) step(1);
    });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });
  }
  function show() {
    var p = items[at], im = lb.querySelector('img');
    im.src = p.src; im.alt = p.t + ': ' + p.d;
    lb.querySelector('figcaption').innerHTML = C.esc(p.t) + '<small>' + C.esc(p.c) + (items.length > 1 ? ' \u00B7 ' + (at + 1) + ' of ' + items.length : '') + '</small>';
  }
  function open(list, i) { ensureLightbox(); items = list; at = i; lastFocus = document.activeElement; show(); lb.classList.add('on'); lb.querySelector('.cl').focus(); document.body.style.overflow = 'hidden'; }
  function close() { lb.classList.remove('on'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  function step(d) { at = (at + d + items.length) % items.length; show(); }

  /* opts: {grid, filters, count, limit, onDelete} */
  function mount(opts) {
    var grid = document.getElementById(opts.grid), fil = opts.filters && document.getElementById(opts.filters), cnt = opts.count && document.getElementById(opts.count);
    var active = 'All', list = [];
    function cats() { var s = ['All']; all().forEach(function (p) { if (s.indexOf(p.c) < 0) s.push(p.c); }); return s; }
    function draw() {
      var a = all(); list = a.filter(function (p) { return active === 'All' || p.c === active; });
      var shown = opts.limit ? list.slice(0, opts.limit) : list;
      grid.innerHTML = shown.map(function (p, i) {
        return '<div class="gw"><button class="gi" type="button" data-i="' + i + '" aria-label="Enlarge: ' + C.esc(p.t) + '"><img src="' + C.esc(p.src) + '" alt="' + C.esc(p.t) + ': ' + C.esc(p.d) + '" loading="lazy"><span>' + C.esc(p.t) + '</span></button>' +
          (C.isAdmin() && p.x > -1 ? '<button class="xdel" type="button" data-x="' + p.x + '" aria-label="Remove photo">\u00D7</button>' : '') + '</div>';
      }).join('');
      if (cnt) cnt.textContent = 'Showing ' + shown.length + ' of ' + a.length + ' photographs';
      if (fil) fil.innerHTML = cats().map(function (c) { return '<button class="fbtn" type="button" data-c="' + C.esc(c) + '" aria-pressed="' + (c === active) + '">' + C.esc(c) + '</button>'; }).join('');
    }
    grid.addEventListener('click', function (e) {
      var d = e.target.closest('.xdel');
      if (d) { var c = C.data(); c.gallery.splice(+d.getAttribute('data-x'), 1); C.save(c); draw(); return; }
      var b = e.target.closest('.gi'); if (b) open(list, +b.getAttribute('data-i'));
    });
    if (fil) fil.addEventListener('click', function (e) { var b = e.target.closest('.fbtn'); if (!b) return; active = b.getAttribute('data-c'); draw(); });
    draw();
    return { redraw: draw, categories: function () { return cats().filter(function (c) { return c !== 'All'; }); } };
  }
  G.gallery = { mount: mount, PHOTOS: PHOTOS };
})();
