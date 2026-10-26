/* =====================================================================
   CONTENT HELPERS  (js/content.js)   needs js/content-data.js first
   Shared by News & Events, School Gallery and Staff.
   - GIA.content.data()   published content (plus your preview in staff mode)
   - GIA.content.panel()  staff panel that opens with #admin in the address
   Preview is stored only in the staff member's own browser. Visitors see
   the published js/content-data.js file.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'gia_content_preview', FLAG = 'gia_admin_mode';
  var G = window.GIA = window.GIA || {};

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function norm(c) {
    c.news = c.news || []; c.events = c.events || []; c.gallery = c.gallery || [];
    c.staff = c.staff || {}; c.staff.overrides = c.staff.overrides || {}; c.staff.extra = c.staff.extra || [];
    return c;
  }
  function isAdmin() { try { return sessionStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }
  function data() {
    var c = clone(window.GIA_CONTENT || {});
    if (isAdmin()) { try { var p = JSON.parse(localStorage.getItem(KEY) || 'null'); if (p) c = p; } catch (e) { } }
    return norm(c);
  }
  function save(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); return true; }
    catch (e) { alert('Browser storage is full. Please use smaller photographs.'); return false; }
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) { } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function today() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function pretty(iso) { var d = new Date(iso + 'T00:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }

  /* Resize a chosen photograph so the content file stays small */
  function img(file, max, cb) {
    var r = new FileReader();
    r.onload = function () {
      var i = new Image();
      i.onload = function () {
        var s = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement('canvas');
        c.width = Math.round(i.width * s); c.height = Math.round(i.height * s);
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.78));
      };
      i.src = r.result;
    };
    r.readAsDataURL(file);
  }
  function download(c) {
    var t = '/* GIA site content. Upload as js/content-data.js */\nwindow.GIA_CONTENT = ' + JSON.stringify(c, null, 1) + ';\n';
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/javascript' })); a.download = 'content-data.js'; a.click();
  }

  /* opt = {title, intro, forms:[{title, fields:[{n,l,t,o,req}], submit(values, content)}], onChange()} */
  function panel(opt) {
    if (location.hash !== '#admin') return;
    try { sessionStorage.setItem(FLAG, '1'); } catch (e) { }
    var old = document.getElementById('cpanel'); if (old) old.remove();
    var p = document.createElement('div'); p.id = 'cpanel'; p.className = 'apanel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', opt.title);
    var h = '<h3>' + esc(opt.title) + '</h3><p>' + esc(opt.intro || 'Changes show on this device only until you download the content file and upload it to the js folder.') + '</p>';
    opt.forms.forEach(function (f, fi) {
      h += '<form data-f="' + fi + '"><h4>' + esc(f.title) + '</h4>' + f.fields.map(function (x) {
        var id = 'cp-' + fi + '-' + x.n, req = x.req ? ' required' : '';
        var ctl = x.t === 'textarea' ? '<textarea id="' + id + '" name="' + x.n + '" rows="3"' + req + '></textarea>'
          : x.t === 'select' ? '<select id="' + id + '" name="' + x.n + '"' + req + '>' + x.o().map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select>'
          : x.t === 'file' ? '<input id="' + id + '" name="' + x.n + '" type="file" accept="image/*"' + req + '>'
          : '<input id="' + id + '" name="' + x.n + '" type="' + (x.t || 'text') + '"' + req + '>';
        return '<label for="' + id + '">' + esc(x.l) + (x.req ? ' *' : '') + '</label>' + ctl;
      }).join('') + '<div class="row"><button class="btn navy" type="submit">' + esc(f.btn || 'Save') + '</button></div></form>';
    });
    h += '<div class="row"><button class="btn gold" id="cp-dl" type="button">Download content file</button><button class="btn ghost" id="cp-rs" type="button">Clear preview</button><button class="btn ghost" id="cp-x" type="button">Close</button></div><p id="cp-msg" aria-live="polite"></p>';
    p.innerHTML = h; document.body.appendChild(p);
    function msg(t) { document.getElementById('cp-msg').textContent = t; }
    p.querySelectorAll('form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var f = opt.forms[+form.getAttribute('data-f')], vals = {}, files = [];
        f.fields.forEach(function (x) {
          var el = form.elements[x.n];
          if (x.t === 'file') { if (el.files[0]) files.push([x.n, el.files[0]]); } else vals[x.n] = el.value.trim();
        });
        var left = files.length;
        function done() {
          var c = data(); f.submit(vals, c);
          if (save(c)) { form.reset(); msg('Saved as a preview on this device. Download the content file to publish.'); if (opt.onChange) opt.onChange(); }
        }
        if (!left) return done();
        files.forEach(function (x) { img(x[1], f.max || 900, function (u) { vals[x[0]] = u; if (--left === 0) done(); }); });
      });
    });
    document.getElementById('cp-dl').onclick = function () { download(data()); msg('Downloaded. Upload it to the js folder to make it live.'); };
    document.getElementById('cp-rs').onclick = function () { reset(); msg('Preview cleared.'); if (opt.onChange) opt.onChange(); };
    document.getElementById('cp-x').onclick = function () { p.remove(); history.replaceState(null, '', location.pathname); };
  }

  G.content = { data: data, save: save, isAdmin: isAdmin, esc: esc, today: today, pretty: pretty, img: img, panel: panel };
})();
