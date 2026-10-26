/* =====================================================================
   CONTACT PAGE  (js/contact.js)
   1. Google Map of Makeni, always able to return to the school.
   2. Photo slots that show an image when its file exists.
   3. Message form with an optional photo attachment.

   SET UP ONCE (school office):
   - SCHOOL.lat / SCHOOL.lng : open Google Maps, right-click the exact school
     gate, click the coordinates to copy them, and paste them below. The pin
     then lands exactly on the school instead of using the written address.
   - FORM_ENDPOINT : the web address of your form service (for example a
     Formspree form). While it is empty, the form opens the visitor's email app
     with the message ready to send to infogia@gmail.com.
   ===================================================================== */
(function () {
  'use strict';
  var SCHOOL = {
    name: 'Gbonkolenken International Academy',
    query: 'Gbonkolenken International Academy, New Jersey, Makama, Makeni, Sierra Leone',
    lat: null, lng: null
  };
  var FORM_ENDPOINT = '';
  var EMAIL = 'infogia@gmail.com';

  var $ = function (id) { return document.getElementById(id); };
  var frame = $('map-frame'), note = $('map-note'), chips = $('map-chips'), input = $('map-search'), toast = $('toast');

  /* ---------- Toast ---------- */
  var tt;
  function say(msg) { clearTimeout(tt); toast.textContent = msg; toast.classList.add('show'); tt = setTimeout(function () { toast.classList.remove('show'); }, 4200); }

  /* ---------- Map ---------- */
  var PLACES = [
    ['\uD83D\uDCCD Our school', 'SCHOOL'],
    ['Makama', 'Makama, Makeni, Sierra Leone'],
    ['Makeni town centre', 'Makeni town centre, Sierra Leone'],
    ['Hospitals', 'hospitals in Makeni, Sierra Leone'],
    ['Banks', 'banks in Makeni, Sierra Leone'],
    ['Hotels', 'hotels in Makeni, Sierra Leone'],
    ['Fuel stations', 'fuel stations in Makeni, Sierra Leone'],
    ['Markets', 'markets in Makeni, Sierra Leone']
  ];
  function schoolQ() { return SCHOOL.lat != null && SCHOOL.lng != null ? SCHOOL.lat + ',' + SCHOOL.lng : SCHOOL.query; }
  function embed(q, z) { return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&z=' + (z || 16) + '&hl=en&output=embed'; }
  function show(label, q, z, isSchool) {
    frame.src = embed(q, z);
    frame.title = 'Google Map: ' + label;
    note.textContent = isSchool ? 'Showing: ' + SCHOOL.name + ', Makama, Makeni' : 'Showing: ' + label;
    $('map-open').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
    [].forEach.call(chips.children, function (c) { c.classList.toggle('on', c.getAttribute('data-l') === label); });
  }
  function showSchool() { show(PLACES[0][0], schoolQ(), 17, true); }
  PLACES.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mchip' + (i ? '' : ' on'); b.textContent = p[0]; b.setAttribute('data-l', p[0]);
    b.addEventListener('click', function () { if (p[1] === 'SCHOOL') showSchool(); else show(p[0], p[1], 14, false); });
    chips.appendChild(b);
  });
  function search() {
    var t = input.value.trim(); if (!t) return;
    var q = /makeni/i.test(t) ? t : t + ', Makeni, Sierra Leone';   /* every search stays inside Makeni */
    show(t, q, 15, false);
  }
  $('map-search-btn').addEventListener('click', search);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); search(); } });
  $('map-home').addEventListener('click', showSchool);

  function dirUrl(origin) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(schoolQ()) + (origin ? '&origin=' + encodeURIComponent(origin) : '') + '&travelmode=driving';
  }
  $('dir-btn').href = dirUrl();
  $('dir-btn').target = '_blank'; $('dir-btn').rel = 'noopener';
  $('dir-me').addEventListener('click', function () {
    if (!navigator.geolocation) { say('Your device cannot share its location. Use "Get directions" and type your starting point.'); return; }
    say('Finding your location\u2026');
    navigator.geolocation.getCurrentPosition(function (p) {
      window.open(dirUrl(p.coords.latitude + ',' + p.coords.longitude), '_blank', 'noopener');
    }, function () { say('Location permission was not given. Use "Get directions" and type your starting point.'); }, { timeout: 10000 });
  });
  $('share-btn').addEventListener('click', function () {
    var url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(schoolQ());
    if (navigator.share) { navigator.share({ title: SCHOOL.name, text: 'Find ' + SCHOOL.name + ' in Makeni', url: url }).catch(function () { }); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { say('School location link copied.'); });
    else say(url);
  });
  showSchool();

  /* ---------- Photo slots ---------- */
  document.querySelectorAll('.slot[data-src]').forEach(function (slot) {
    var img = new Image(); img.alt = slot.getAttribute('data-alt') || ''; img.loading = 'lazy';
    img.onerror = function () { slot.classList.add('empty'); img.remove(); };
    img.src = slot.getAttribute('data-src'); slot.appendChild(img);
  });

  /* ---------- Office buttons choose the recipient ---------- */
  var topic = $('topic');
  document.querySelectorAll('[data-office]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-office');
      [].some.call(topic.options, function (o) { if (o.textContent === v || o.value === v) { topic.value = o.value; return true; } });
      $('message-us').scrollIntoView({ behavior: 'smooth' });
      setTimeout(function () { $('subject').focus({ preventScroll: true }); }, 400);
    });
  });

  var want = (new URLSearchParams(location.search).get('office') || '').toLowerCase();
  if (want) [].some.call(topic.options, function (o) { if (o.value && o.textContent.toLowerCase().indexOf(want) > -1) { topic.value = o.value; return true; } });

  /* ---------- Photo attachment ---------- */
  var file = $('attachment'), prev = $('preview'), rm = $('remove-img'), errA = $('err-attachment');
  var OK = ['image/jpeg', 'image/png', 'image/webp'], MAX = 5 * 1024 * 1024;
  function clearImg() {
    file.value = ''; if (prev.src && prev.src.indexOf('blob:') === 0) URL.revokeObjectURL(prev.src);
    prev.removeAttribute('src'); prev.classList.remove('show'); rm.classList.remove('show');
  }
  file.addEventListener('change', function () {
    errA.textContent = ''; var f = file.files[0]; if (!f) { clearImg(); return; }
    if (OK.indexOf(f.type) < 0) { errA.textContent = 'Please choose a JPG, PNG or WebP photo.'; clearImg(); return; }
    if (f.size > MAX) { errA.textContent = 'This photo is larger than 5 MB. Please choose a smaller one.'; clearImg(); return; }
    prev.src = URL.createObjectURL(f); prev.classList.add('show'); rm.classList.add('show');
  });
  rm.addEventListener('click', function () { clearImg(); errA.textContent = ''; });

  /* ---------- Form ---------- */
  var form = $('contact-form'), btn = $('submit-btn');
  var RULES = { name: 'Enter your full name.', email: 'Enter a valid email address.', topic: 'Choose who should receive your message.', subject: 'Enter a subject.', message: 'Write your message.' };
  var mailOK = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  form.addEventListener('submit', function (e) {
    e.preventDefault(); var ok = true;
    Object.keys(RULES).forEach(function (k) {
      var el = $(k), val = el.value.trim(), good = val.length > 0 && (k !== 'email' || mailOK(val));
      $('err-' + k).textContent = good ? '' : RULES[k]; el.closest('.field').classList.toggle('invalid', !good); if (!good) ok = false;
    });
    if (errA.textContent) ok = false;
    if (!ok) { say('Please correct the highlighted fields.'); return; }

    if (FORM_ENDPOINT) {                       /* real delivery through the school's form service */
      btn.disabled = true; btn.textContent = 'Sending\u2026';
      fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('bad'); form.reset(); clearImg(); say('Thank you. Your message has been sent. We will reply by email.'); })
        .catch(function () { say('Your message could not be sent. Please email ' + EMAIL + ' directly.'); })
        .then(function () { btn.disabled = false; btn.textContent = 'Send message'; });
      return;
    }
    /* No form service yet: open the visitor's email app, honestly. */
    var body = 'To: ' + topic.value + '\nName: ' + $('name').value + '\nPhone: ' + ($('phone').value || '-') + '\nSchool level: ' + ($('level').value || '-') + '\n\n' + $('message').value +
      (file.files[0] ? '\n\n(Please attach your photo "' + file.files[0].name + '" to this email before sending.)' : '');
    location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('[' + topic.value + '] ' + $('subject').value) + '&body=' + encodeURIComponent(body);
    say('Your email app is opening. Press Send there to deliver your message.' + (file.files[0] ? ' Remember to attach your photo.' : ''));
  });
})();
