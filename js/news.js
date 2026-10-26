/* =====================================================================
   NEWS AND EVENTS  (js/news.js)   needs js/content.js first
   Shows school updates and the school calendar from js/content-data.js.
   Staff add items at  news-events.html#admin
   ===================================================================== */
(function () {
  'use strict';
  var C = window.GIA.content, E = C.esc, M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var CATS = ['Announcement', 'Achievement', 'Parents', 'Academics', 'Sports', 'Events'];
  var nw = document.getElementById('nw'), up = document.getElementById('ev-up'), past = document.getElementById('ev-past');

  function draw() {
    var c = C.data(), admin = C.isAdmin();
    var news = c.news.map(function (n, i) { n.i = i; return n; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    nw.innerHTML = news.length ? news.map(function (n) {
      return '<article class="ncard">' + (admin ? '<button class="xdel" type="button" data-n="' + n.i + '" aria-label="Remove update">\u00D7</button>' : '') +
        (n.img ? '<img src="' + E(n.img) + '" alt="" loading="lazy">' : '') + '<div class="b"><span class="ncat">' + E(n.cat) + '</span><time datetime="' + E(n.date) + '">' + E(C.pretty(n.date)) + '</time><h3>' + E(n.title) + '</h3><p>' + E(n.text) + '</p></div></article>';
    }).join('') : '<div class="empty">No updates have been posted yet. Please check again soon.</div>';

    var t = C.today(), evs = c.events.map(function (e, i) { e.i = i; return e; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    function row(v) {
      var d = new Date(v.date + 'T00:00:00');
      return '<div class="ev"><div class="dt"><b>' + d.getDate() + '</b><span>' + M[d.getMonth()] + ' ' + d.getFullYear() + '</span></div><div><h3>' + E(v.title) + '</h3><p>' + E(v.place || '') + '</p></div>' +
        (admin ? '<button class="xdel" type="button" style="top:50%;transform:translateY(-50%)" data-e="' + v.i + '" aria-label="Remove event">\u00D7</button>' : '') + '</div>';
    }
    var u = evs.filter(function (v) { return v.date >= t; }), p = evs.filter(function (v) { return v.date < t; }).reverse().slice(0, 6);
    up.innerHTML = u.length ? u.map(row).join('') : '<div class="empty">No events are listed at the moment. The school office will post the next dates here, and parents will also be told through the School Portal.</div>';
    past.innerHTML = p.length ? '<details class="past"><summary>Past events (' + p.length + ')</summary>' + p.map(row).join('') + '</details>' : '';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.xdel'); if (!b) return;
    var c = C.data();
    if (b.hasAttribute('data-n')) c.news.splice(+b.getAttribute('data-n'), 1); else if (b.hasAttribute('data-e')) c.events.splice(+b.getAttribute('data-e'), 1); else return;
    C.save(c); draw();
  });
  draw();

  C.panel({
    title: 'News and events panel', onChange: draw,
    forms: [
      { title: 'Post a school update', btn: 'Add update', max: 900, fields: [{ n: 'title', l: 'Headline', req: 1 }, { n: 'cat', l: 'Category', t: 'select', o: function () { return CATS.map(function (x) { return [x, x]; }); } }, { n: 'text', l: 'Update', t: 'textarea', req: 1 }, { n: 'img', l: 'Photograph (optional)', t: 'file' }],
        submit: function (v, c) { c.news.push({ id: 'n' + Date.now(), title: v.title, cat: v.cat, text: v.text, img: v.img || '', date: C.today() }); } },
      { title: 'Add an event', btn: 'Add event', fields: [{ n: 'date', l: 'Date', t: 'date', req: 1 }, { n: 'title', l: 'Event name', req: 1 }, { n: 'place', l: 'Place and time' }],
        submit: function (v, c) { c.events.push({ date: v.date, title: v.title, place: v.place }); } }
    ]
  });
})();
