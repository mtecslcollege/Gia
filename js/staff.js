/* =====================================================================
   STAFF AND FACULTY  (js/staff.js)   needs js/content.js first
   - Staff are grouped by the school's organizational chart.
   - Each group is a carousel that changes automatically and keeps going.
   - To show a real name or photograph, open staff.html#admin.
   ===================================================================== */
(function () {
  'use strict';
  var C = window.GIA.content, E = C.esc;
  var INTERVAL = 5500;                       /* milliseconds each person stays on screen */
  var NAME0 = 'Name to be announced';

  var GROUPS = [
    ['Leadership', 'The people who set the direction of the school and lead it every day.'],
    ['Administration', 'The school office: admissions, records, fees and everyday communication with parents.'],
    ['Coordinators', 'One coordinator for each stage of the school, looking after learning and welfare from Day-care to S.S.S 3.'],
    ['Heads of Department', 'Subject leaders who guide teaching and learning in Science, Art and Commercial.'],
    ['Teaching Staff', 'The teachers who know every child in the classroom.'],
    ['Student Leadership', 'Our students, and the prefects who lead them by example.']
  ];
  var R = [
    ['d0', 'Leadership', 'Proprietor', 'The Proprietor owns the school and sets its long-term vision. Major decisions about policy, resources and the future of the Academy begin here.', ['Sets the vision and policy of the school', 'Approves major plans and resources', 'Protects the long-term future of the school'], 'Principal'],
    ['d1', 'Leadership', 'Principal', 'The Principal is the chief administrator and leads teaching, learning and discipline every day, so that every child feels safe, known and challenged.', ['Leads teaching, learning and discipline', 'Supervises staff and student welfare', 'Receives serious concerns from parents'], 'Principal'],
    ['d2', 'Leadership', 'Vice-Principal', 'The Vice-Principal supports the Principal with academic supervision, student discipline and the smooth running of the school day.', ['Supervises academic work', 'Guides student discipline and conduct', 'Keeps daily school operations running'], 'Vice-Principal'],
    ['d3', 'Administration', 'Senior Administrative Officer', 'The Senior Administrative Officer runs the school office: admissions, enrolment, records and general enquiries from parents and visitors.', ['Handles admissions and enrolment', 'Keeps school records safe and accurate', 'Answers general enquiries'], 'Admissions'],
    ['d4', 'Administration', 'Finance Officer', 'The Finance Officer looks after school fees, payment records and receipts, and prepares the financial reports of the school.', ['Records school fee payments', 'Issues receipts and confirmations', 'Prepares financial reports'], 'Finance'],
    ['d5', 'Coordinators', 'Day-care Coordinator', 'Leads the care of our youngest children: safe routines, gentle guidance and close contact with parents.', ['Oversees daily care and routines', 'Supports each child\u2019s comfort and growth', 'Keeps parents informed'], 'Day-care Coordinator'],
    ['d6', 'Coordinators', 'Kindergarten Coordinator', 'Guides Kindergarten 1, 2 and 3, where children learn early reading, number and good habits through play.', ['Oversees play-based learning', 'Monitors early reading and number skills', 'Supports children\u2019s welfare'], 'Kindergarten Coordinator'],
    ['d7', 'Coordinators', 'Grade Coordinator', 'Leads Grade 1 to Grade 6, making sure every pupil builds strong foundations in reading, writing and number.', ['Oversees teaching in Grades 1\u20136', 'Follows each pupil\u2019s progress', 'Works with Form-masters and parents'], 'Grade Coordinator'],
    ['d8', 'Coordinators', 'Junior Secondary School Coordinator', 'Leads J.S.S 1 to J.S.S 3 and helps students prepare for the BECE and for Senior Secondary School.', ['Oversees J.S.S teaching and welfare', 'Supports BECE preparation', 'Guides students on choosing a department'], 'Junior Secondary'],
    ['d9', 'Coordinators', 'Senior Secondary School Coordinator', 'Leads S.S.S 1 to S.S.S 3 and supports students in Science, Art and Commercial as they prepare for the WASSCE.', ['Oversees S.S.S teaching and welfare', 'Supports WASSCE preparation', 'Guides further study choices'], 'Senior Secondary'],
    ['d10', 'Heads of Department', 'H.O.D Science', 'Leads Biology, Chemistry, Physics, Agricultural Science and Mathematics, including practical lessons in our laboratories.', ['Plans science and practical lessons', 'Supports subject teachers', 'Keeps laboratory work safe'], 'Heads of Department'],
    ['d11', 'Heads of Department', 'H.O.D Art', 'Leads Literature in English, Government, History, Geography and Religious Studies, and the love of reading.', ['Plans Art subject teaching', 'Supports subject teachers', 'Encourages reading and clear writing'], 'Heads of Department'],
    ['d12', 'Heads of Department', 'H.O.D Commercial', 'Leads Principles of Accounts, Economics, Commerce and Business Management, and practical lessons in the computer room.', ['Plans Commercial subject teaching', 'Supports subject teachers', 'Guides business and office skills'], 'Heads of Department'],
    ['d13', 'Teaching Staff', 'Form-masters', 'Every class has a Form-master, the first contact for a class. They know each student and monitor attendance, conduct and welfare.', ['Take the register and follow attendance', 'Watch over conduct and welfare', 'Keep in touch with parents'], ''],
    ['d14', 'Teaching Staff', 'Subject Teachers', 'Our subject teachers prepare lessons, teach, assess and guide students in every subject, from Day-care play to WASSCE revision.', ['Prepare and teach lessons', 'Assess work fairly and give feedback', 'Support students who need extra help'], ''],
    ['d15', 'Student Leadership', 'School Prefect', 'The School Prefect represents the students, helps keep order and sets an example of good behaviour for classmates.', ['Represents student views', 'Helps keep order and discipline', 'Works with school management'], ''],
    ['d16', 'Student Leadership', 'Our Students', 'The whole student body, from Day-care to S.S.S 3, is the reason the school exists. We serve them with care.', ['Learn, grow and lead', 'Respect teachers and each other', 'Represent the Academy with pride'], '']
  ];

  function people() {
    var c = C.data(), ov = c.staff.overrides, out = R.map(function (r) {
      var o = ov[r[0]] || {};
      return { id: r[0], g: r[1], role: r[2], desc: r[3], duties: r[4], office: r[5], name: o.name || '', photo: o.photo || '' };
    });
    c.staff.extra.forEach(function (x) { out.push({ id: x.id, g: x.group, role: x.role, desc: x.desc || '', duties: [], office: '', name: x.name, photo: x.photo || '', x: true }); });
    return out;
  }
  function ini(n) { return n ? n.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() : 'GIA'; }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [], paused = false;

  function slide(p) {
    var ph = p.photo ? '<img class="pf" src="' + E(p.photo) + '" alt="' + E((p.name || p.role) + ', ' + p.role) + '">'
      : '<img class="crest" src="images/logo.png" alt=""><span class="soon">Photograph coming soon</span>';
    return '<article class="slide" aria-roledescription="slide"><div class="sp">' + ph + '</div><div class="si"><span class="rl">' + E(p.role) + '</span><h3>' + E(p.name || NAME0) + '</h3><p>' + E(p.desc) + '</p>' +
      (p.duties.length ? '<ul>' + p.duties.map(function (d) { return '<li>' + E(d) + '</li>'; }).join('') + '</ul>' : '') +
      (p.office ? '<a class="btn ghost" href="contact-us.html?office=' + encodeURIComponent(p.office) + '#message-us">Write to this office</a>' : '') + '</div></article>';
  }
  function thumb(p, i) {
    return '<button class="th" type="button" data-i="' + i + '"><i' + (p.photo ? ' style="background-image:url(\'' + p.photo.replace(/'/g, '%27') + '\')"' : '') + '>' + (p.photo ? '' : E(ini(p.name))) + '</i><span><b>' + E(p.name || p.role) + '</b><small>' + E(p.name ? p.role : 'Role in the school') + '</small></span></button>';
  }

  function build() {
    timers.forEach(clearInterval); timers = [];
    var all = people(), host = document.getElementById('teams'), h = '';
    GROUPS.forEach(function (g, gi) {
      var list = all.filter(function (p) { return p.g === g[0]; }); if (!list.length) return;
      var solo = list.length === 1;
      h += '<section class="team rv in" id="g' + gi + '" aria-labelledby="gh' + gi + '"><header><h2 id="gh' + gi + '">' + E(g[0]) + '</h2><p class="gd">' + E(g[1]) + '</p></header>' +
        '<div class="crs' + (solo ? ' solo' : '') + '" data-g="' + gi + '" role="group" aria-roledescription="carousel" aria-label="' + E(g[0]) + '"><div class="cstage" aria-live="off">' + list.map(slide).join('') + '<i class="prog"></i></div>' +
        (solo ? '' : '<div class="side-c"><div class="thumbs">' + list.map(thumb).join('') + '</div><div class="ctl"><button type="button" data-a="prev" aria-label="Previous person">\u2039 Prev</button><button type="button" data-a="next" aria-label="Next person">Next \u203A</button><button class="pp" type="button" data-a="pp" aria-label="Pause automatic changes">Pause</button></div></div>') + '</div></section>';
    });
    host.innerHTML = h;
    host.querySelectorAll('.crs').forEach(function (el, k) { init(el, k); });
  }

  function init(el, k) {
    var slides = [].slice.call(el.querySelectorAll('.slide')), th = [].slice.call(el.querySelectorAll('.th')), prog = el.querySelector('.prog');
    var cur = 0, visible = true, mine = false;
    function go(n, manual) {
      var prev = cur; cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('on', i === cur); s.classList.toggle('out', i === prev && prev !== cur); s.setAttribute('aria-hidden', i !== cur); });
      th.forEach(function (t, i) { t.classList.toggle('on', i === cur); });
      if (slides.length > 1) { prog.classList.remove('run'); void prog.offsetWidth; prog.style.setProperty('--dur', INTERVAL + 'ms'); if (!(paused || mine)) prog.classList.add('run'); }
    }
    go(0);
    if (slides.length < 2) return;
    /* offset each carousel a little so they never all change at once */
    var t = setTimeout(function () {
      var iv = setInterval(function () { if (!paused && !mine && visible && !document.hidden) go(cur + 1); }, INTERVAL);
      timers.push(iv);
    }, (k % 5) * 700);
    timers.push(t);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: .2 }).observe(el);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('th')) go(+b.getAttribute('data-i'));
      else if (b.getAttribute('data-a') === 'next') go(cur + 1);
      else if (b.getAttribute('data-a') === 'prev') go(cur - 1);
      else if (b.getAttribute('data-a') === 'pp') { paused = !paused; document.querySelectorAll('.pp').forEach(function (x) { x.textContent = paused ? 'Play' : 'Pause'; x.setAttribute('aria-label', paused ? 'Resume automatic changes' : 'Pause automatic changes'); }); document.querySelectorAll('.prog').forEach(function (p) { p.classList.toggle('run', !paused); }); }
    });
    /* keyboard focus inside a carousel keeps it still while a person is reading it */
    el.addEventListener('focusin', function () { mine = true; prog.classList.remove('run'); });
    el.addEventListener('focusout', function () { mine = false; if (!paused) { void prog.offsetWidth; prog.classList.add('run'); } });
  }

  build();

  function opts() { return all2().map(function (p) { return [p.id, p.role + (p.name ? ' \u2013 ' + p.name : '')]; }); }
  function all2() { return people(); }
  C.panel({
    title: 'Staff panel', onChange: build,
    forms: [
      { title: 'Set a name and photograph', btn: 'Save', max: 700, fields: [{ n: 'who', l: 'Person or role', t: 'select', o: opts }, { n: 'name', l: 'Full name' }, { n: 'photo', l: 'Photograph', t: 'file' }],
        submit: function (v, c) { var o = c.staff.overrides[v.who] || {}; if (v.name) o.name = v.name; if (v.photo) o.photo = v.photo; c.staff.overrides[v.who] = o; if (c.staff.extra.some(function (x) { return x.id === v.who; })) c.staff.extra.forEach(function (x) { if (x.id === v.who) { if (v.name) x.name = v.name; if (v.photo) x.photo = v.photo; } }); } },
      { title: 'Add another staff member', btn: 'Add', max: 700, fields: [{ n: 'group', l: 'Group', t: 'select', o: function () { return GROUPS.map(function (g) { return [g[0], g[0]]; }); } }, { n: 'role', l: 'Role or subject', req: 1 }, { n: 'name', l: 'Full name', req: 1 }, { n: 'desc', l: 'Short description', t: 'textarea' }, { n: 'photo', l: 'Photograph', t: 'file' }],
        submit: function (v, c) { c.staff.extra.push({ id: 'x' + Date.now(), group: v.group, role: v.role, name: v.name, desc: v.desc, photo: v.photo || '' }); } },
      { title: 'Remove an added staff member', btn: 'Remove', fields: [{ n: 'rm', l: 'Added staff member', t: 'select', o: function () { var l = C.data().staff.extra.map(function (x) { return [x.id, x.name + ' (' + x.role + ')']; }); return l.length ? l : [['', 'None added yet']]; } }],
        submit: function (v, c) { c.staff.extra = c.staff.extra.filter(function (x) { return x.id !== v.rm; }); } }
    ]
  });
  window.addEventListener('hashchange', function () { C.panel && location.hash === '#admin' && location.reload(); });
})();
