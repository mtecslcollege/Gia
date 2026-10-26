/* =====================================================================
   ADMISSION ENGINE  (js/admission.js)   needs js/admission-config.js first

   Page hooks (add these attributes in any page):
     [data-admission-banner]            full alert box (status, session, closing date)
     [data-admission-stage="sss"]       small badge for one level
     [data-admission-apply="sss"]       apply button: live when open, locked when closed
     [data-admission-gate]              a form wrapper: gets class "adm-closed" when closed
   Public API:  window.GIA.admission.status()  ->  {state:'open'|'closed'|'soon', ...}
   Staff panel: add #admin to the page address to open it.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'gia_admission_preview', FLAG = 'gia_admin_mode';
  var NAMES = { daycare: 'Day-care', kindergarten: 'Kindergarten 1\u20133', grade: 'Grade 1\u20136', jss: 'J.S.S 1\u20133', sss: 'S.S.S 1\u20133' };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nice(iso) { if (!iso) return ''; var p = iso.split('-'); return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0]; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function config() {
    var c = clone(window.GIA_ADMISSION || { mode: 'closed' });
    c.stages = c.stages || {};
    Object.keys(NAMES).forEach(function (k) { c.stages[k] = c.stages[k] || { mode: 'inherit', closes: '' }; });
    try {
      if (sessionStorage.getItem(FLAG) === '1') {
        var ov = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (ov) c = ov;
      }
    } catch (e) { /* storage unavailable: use published settings */ }
    return c;
  }

  function calc(mode, opens, closes) {
    var t = today();
    if (mode === 'closed') return 'closed';
    if (mode === 'auto') {
      if (!opens && !closes) return 'closed';
      if (opens && t < opens) return 'soon';
      if (closes && t > closes) return 'closed';
      return 'open';
    }
    if (closes && t > closes) return 'closed';
    return 'open';
  }
  function general(c) { return { state: calc(c.mode, c.opens, c.closes), opens: c.opens, closes: c.closes }; }
  function stage(c, k) {
    var s = c.stages[k] || {};
    if (!s.mode || s.mode === 'inherit') return general(c);
    var closes = s.closes || c.closes;
    return { state: calc(s.mode, null, closes), opens: null, closes: closes };
  }

  function label(r) {
    if (r.state === 'open') return r.closes ? 'Open until ' + nice(r.closes) : 'Admission open';
    if (r.state === 'soon') return 'Opens ' + nice(r.opens);
    return 'Admission closed';
  }

  function render() {
    var c = config(), g = general(c);
    document.querySelectorAll('[data-admission-banner]').forEach(function (el) {
      var head = g.state === 'open' ? 'Admission is now open for the ' + c.session + ' session'
        : g.state === 'soon' ? 'Admission opens on ' + nice(g.opens)
        : 'Admission is currently closed';
      var line = g.state === 'open' ? (g.closes ? 'Applications close on <strong>' + nice(g.closes) + '</strong>. Please apply early.' : 'Parents and guardians may apply online for any level, from Day-care to S.S.S 3.')
        : g.state === 'soon' ? 'Please check back on the opening date, or contact the school office for guidance.'
        : 'We are not receiving new applications at this time. Contact the school office to ask about the next intake.';
      var btn = g.state === 'open' ? '<a class="btn navy" href="online_registration.html">Apply online</a>' : '<a class="btn navy" href="contact-us.html">Contact the office</a>';
      el.className = 'admit ' + g.state;
      el.setAttribute('role', 'status');
      el.innerHTML = '<div class="tx"><span class="pill ' + g.state + '">' + (g.state === 'open' ? 'Open' : g.state === 'soon' ? 'Opening soon' : 'Closed') + '</span><h2>' + head + '</h2><p>' + line + (c.note ? ' ' + esc(c.note) : '') + '</p></div>' + btn;
    });
    Object.keys(NAMES).forEach(function (k) {
      var r = stage(c, k);
      document.querySelectorAll('[data-admission-stage="' + k + '"]').forEach(function (el) {
        el.className = 'pill ' + r.state; el.textContent = label(r);
      });
      document.querySelectorAll('[data-admission-apply="' + k + '"]').forEach(function (el) {
        var open = r.state === 'open';
        el.classList.toggle('is-closed', !open);
        el.href = open ? 'online_registration.html?level=' + k : 'contact-us.html';
        el.textContent = open ? (el.getAttribute('data-label') || 'Apply now') : 'Admission closed \u2013 contact the office';
      });
    });
    document.querySelectorAll('[data-admission-gate]').forEach(function (el) { el.classList.toggle('adm-closed', g.state !== 'open'); });
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ---------- Staff control panel (#admin) ---------- */
  function panel() {
    var old = document.getElementById('apanel'); if (old) old.remove();
    if (location.hash !== '#admin') return;
    try { sessionStorage.setItem(FLAG, '1'); } catch (e) { }
    var c = config();
    var p = document.createElement('div'); p.id = 'apanel'; p.className = 'apanel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Admission control');
    var opts = function (cur, list) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); };
    var main = [['open', 'Open'], ['closed', 'Closed'], ['auto', 'Automatic (by dates)']];
    var per = [['inherit', 'Follow general setting'], ['open', 'Open'], ['closed', 'Closed']];
    p.innerHTML = '<h3>Admission control (staff)</h3><p>Changes are previewed on this device only. To publish, download the settings file and upload it to <code>js/admission-config.js</code>.</p>' +
      '<label>Session<input id="a-session" value="' + esc(c.session || '') + '"></label>' +
      '<label>General setting<select id="a-mode">' + opts(c.mode, main) + '</select></label>' +
      '<label>Opening date<input id="a-opens" type="date" value="' + (c.opens || '') + '"></label>' +
      '<label>Closing date<input id="a-closes" type="date" value="' + (c.closes || '') + '"></label>' +
      Object.keys(NAMES).map(function (k) { return '<label>' + NAMES[k] + '<select data-k="' + k + '">' + opts((c.stages[k] || {}).mode || 'inherit', per) + '</select></label>'; }).join('') +
      '<div class="row"><button class="btn navy" id="a-prev" type="button">Preview</button><button class="btn gold" id="a-dl" type="button">Download settings file</button><button class="btn ghost" id="a-reset" type="button">Reset</button><button class="btn ghost" id="a-x" type="button">Close</button></div><p id="a-msg" aria-live="polite"></p>';
    document.body.appendChild(p);
    function read() {
      var n = { session: v('a-session'), mode: v('a-mode'), opens: v('a-opens'), closes: v('a-closes'), note: c.note || '', stages: {} };
      p.querySelectorAll('select[data-k]').forEach(function (s) { n.stages[s.getAttribute('data-k')] = { mode: s.value, closes: (c.stages[s.getAttribute('data-k')] || {}).closes || '' }; });
      return n;
    }
    function v(id) { return document.getElementById(id).value; }
    document.getElementById('a-prev').onclick = function () {
      try { localStorage.setItem(KEY, JSON.stringify(read())); } catch (e) { }
      render(); msg('Preview applied on this device. Visitors are not affected until you publish the file.');
    };
    document.getElementById('a-reset').onclick = function () { try { localStorage.removeItem(KEY); } catch (e) { } c = config(); render(); msg('Preview cleared.'); };
    document.getElementById('a-x').onclick = function () { p.remove(); history.replaceState(null, '', location.pathname); };
    document.getElementById('a-dl').onclick = function () {
      var txt = '/* Admission settings. Upload as js/admission-config.js */\nwindow.GIA_ADMISSION = ' + JSON.stringify(read(), null, 2) + ';\n';
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' })); a.download = 'admission-config.js'; a.click();
      msg('Downloaded. Upload it to the js folder of the website to make it live.');
    };
    function msg(t) { document.getElementById('a-msg').textContent = t; }
  }

  window.GIA = window.GIA || {};
  window.GIA.admission = { status: function () { var c = config(); return general(c); }, stage: function (k) { return stage(c = config(), k); }, config: config };
  var c;
  window.addEventListener('hashchange', panel);
  render(); panel();
})();
