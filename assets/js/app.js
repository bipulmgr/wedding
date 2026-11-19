(function () {
  'use strict';

  var BASE = window.__BASE__ || '/';
  var THEMES = window.THEMES;
  var ART = window.ART;
  var app = document.getElementById('app');
  var state = { site: null, wedding: null, theme: null, timer: null };

  /* ---------- helpers ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var byId = function (id) { return THEMES.find(function (t) { return t.id === id; }); };
  var params = function () { return new URLSearchParams(location.search); };
  function tr(en, ne) { return state.wedding && state.wedding.language === 'ne' ? ne : en; }

  function fmt(iso, opts, w) {
    return new Intl.DateTimeFormat((w && w.locale) || 'en-GB', Object.assign({ timeZone: (w && w.timezone) || 'Asia/Kathmandu' }, opts)).format(new Date(iso));
  }
  function parts(iso, w) {
    var o = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: w.timezone || 'Asia/Kathmandu', day: '2-digit', month: '2-digit', year: '2-digit' })
      .formatToParts(new Date(iso)).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  var longDate = function (iso, w) { return fmt(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, w); };
  var time = function (iso, w) { return fmt(iso, { hour: 'numeric', minute: '2-digit', hour12: true }, w).replace(/\s?(am|pm)/i, function (m) { return ' ' + m.trim().toUpperCase(); }); };

  function loadFonts(theme) {
    var id = 'theme-fonts';
    var href = 'https://fonts.googleapis.com/css2?' + theme.fonts + '&display=swap';
    var link = document.getElementById(id);
    if (link && link.href === href) return;
    if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); }
    link.href = href;
  }

  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + path);
      return r.json();
    });
  }

  function setMeta(title, desc, color) {
    document.title = title;
    var set = function (sel, attr, val) { var el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
    set('meta[name="description"]', 'content', desc);
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', desc);
    set('meta[name="theme-color"]', 'content', color || '#ffffff');
  }

  /* ---------- routing ---------- */
  function route() {
    var path = decodeURIComponent(location.pathname.slice(BASE.length)).replace(/^\/+|\/+$/g, '');
    clearInterval(state.timer);
    if (path === 'designs') return renderDesigns();
    if (path === 'wedding-websites' || !path) return renderStudio();
    return renderWedding(path || state.site.defaultWedding);
  }

  function go(url) {
    history.pushState(null, '', url);
    route();
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-link]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(a.getAttribute('href'));
  });
  window.addEventListener('popstate', route);

  /* ---------- wedding page ---------- */
  function names(w) { return { a: w.couple.partner1.first, b: w.couple.partner2.first }; }

  function countdownHTML(w) {
    return '<dl class="countdown" data-countdown="' + esc(w.date) + '">' +
      ['days', 'hours', 'minutes', 'seconds'].map(function (u) {
        return '<div><dt>' + (w.language === 'ne' ? { days: 'दिन', hours: 'घण्टा', minutes: 'मिनेट', seconds: 'सेकेन्ड' }[u] : u) + '</dt><dd data-u="' + u + '">–</dd></div>';
      }).join('') + '</dl>';
  }

  function ctaHTML(w) {
    var by = w.rsvp && w.rsvp.deadline ? ' by ' + fmt(w.rsvp.deadline + 'T12:00:00Z', { day: 'numeric', month: 'short' }, w) : '';
    return '<div class="hero__cta"><a class="btn btn--solid" href="#rsvp">' + tr('RSVP', 'उपस्थिति जनाउनुहोस्') + esc(by) + '</a>' +
      '<a class="btn btn--ghost" href="#events">' + tr('See the events', 'कार्यक्रम हेर्नुहोस्') + '</a></div>';
  }

  function heroHTML(w, t) {
    var n = names(w);
    var d = longDate(w.date, w);
    var p = parts(w.date, w);
    var cd = countdownHTML(w);
    var cta = ctaHTML(w);
    var place = '<span>' + esc(w.dateNepali || '') + '</span>' + (w.dateNepali ? '<span class="sep" aria-hidden="true"></span>' : '') + '<span>' + esc(w.city) + '</span>';
    var r = function (i) { return ' data-rise style="--i:' + i + '"'; };
    var img = w.heroImage ? '<img src="' + esc(w.heroImage) + '" alt="' + esc(n.a + ' and ' + n.b) + '">' : '';
    var monogram = esc(n.a[0] + n.b[0]);

    switch (t.id) {
      case 'dhaka':
        return '<section class="hero hero--dhaka" id="top"><div class="hero__inner">' +
          '<p class="hero__invite"' + r(0) + '>' + esc(w.invite) + '</p>' +
          '<h1 class="hero__names display"' + r(1) + '><span>' + esc(n.a) + '</span><span class="hero__amp">&amp;</span><span>' + esc(n.b) + '</span></h1>' +
          '<p class="hero__date"' + r(2) + '><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' +
          '<div' + r(3) + '>' + cd + cta + '</div></div><div class="dhaka-panel" aria-hidden="true"></div></section>';

      case 'sayapatri':
        return '<section class="hero hero--sayapatri" id="top">' + ART.toran() + '<div class="hero__inner">' +
          '<p class="hero__invite"' + r(0) + '>' + esc(w.invite) + '</p>' +
          '<h1 class="hero__names display"' + r(1) + '>' + esc(n.a) + ' <span class="hero__amp">&amp;</span> ' + esc(n.b) + '</h1>' +
          '<p class="hero__date"' + r(2) + '><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' +
          '<div' + r(3) + '>' + cd + cta + '</div></div></section>';

      case 'sindoor':
        return '<section class="hero hero--sindoor" id="top"><div class="hero__ring" aria-hidden="true"></div><div class="hero__inner">' +
          '<p class="hero__deva" lang="ne"' + r(0) + '>शुभ विवाह</p>' +
          '<h1 class="hero__names display"' + r(1) + '><span>' + esc(n.a) + '</span><span class="hero__amp">&amp;</span><span>' + esc(n.b) + '</span></h1>' +
          '<p class="hero__invite"' + r(2) + '>' + esc(w.invite) + '</p>' +
          '<p class="hero__date"' + r(3) + '><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' +
          '<div' + r(4) + '>' + cd + cta + '</div></div></section>';

      case 'bare':
        return '<section class="hero hero--bare" id="top">' +
          '<h1 class="hero__names display"' + r(0) + '><span>' + esc(n.a) + '</span><span>&amp;&nbsp;' + esc(n.b) + '</span></h1>' +
          '<div class="hero__grid"' + r(1) + '>' +
          '<p class="hero__num display" aria-label="' + esc(d) + '">' + p.day + '.' + p.month + '.' + p.year + '</p>' +
          '<div><p class="hero__invite">' + esc(w.invite) + '</p><p class="hero__place">' + place + '</p></div>' +
          '<div>' + cd + cta + '</div></div></section>';

      case 'botanical':
        return '<section class="hero hero--botanical" id="top"><div class="hero__inner">' +
          '<p class="hero__invite"' + r(0) + '>' + esc(w.invite) + '</p>' +
          '<h1 class="hero__names display"' + r(1) + '>' + esc(n.a) + '<span class="hero__amp"> and </span>' + esc(n.b) + '</h1>' +
          '<p class="hero__date"' + r(2) + '><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' +
          '<div' + r(3) + '>' + cd + cta + '</div></div>' +
          '<div class="arch"' + r(2) + '>' + (img || ART.branch()) + '</div></section>';

      case 'diyo':
        return '<section class="hero hero--diyo" id="top"><div class="hero__inner">' +
          '<p class="hero__invite"' + r(0) + '>' + esc(w.invite) + '</p>' +
          '<h1 class="hero__names display"' + r(1) + '>' + esc(n.a) + ' <span class="hero__amp">&amp;</span> ' + esc(n.b) + '</h1>' +
          '<p class="hero__date"' + r(2) + '><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' +
          '<div' + r(3) + '>' + cd + cta + '</div></div>' + ART.diyas() + '</section>';

      case 'kraft':
        var p1 = w.couple.partner1, p2 = w.couple.partner2;
        return '<section class="hero hero--kraft" id="top"><article class="card"' + r(0) + '>' +
          '<div class="stamp" aria-hidden="true"><span>' + monogram + '</span><small>' + esc(p.year === undefined ? '' : '20' + p.year) + '</small></div>' +
          '<p class="card__lead">' + esc(w.invite) + '</p>' +
          '<h1 class="hero__names display"><span>' + esc(p1.full || n.a) + '</span><span class="hero__amp">and</span><span>' + esc(p2.full || n.b) + '</span></h1>' +
          '<p class="card__parents">' + esc(p1.parents || '') + (p1.parents && p2.parents ? '<br>' : '') + esc(p2.parents || '') + '</p>' +
          '<p class="hero__date"><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' +
          cd + cta + '</article></section>';

      case 'durbar':
        return '<section class="hero hero--durbar" id="top"><div class="window"' + r(0) + '>' +
          '<div class="window__lattice" aria-hidden="true"></div><div class="window__core">' +
          '<p class="hero__invite">' + esc(w.invite) + '</p>' +
          '<h1 class="hero__names display"><span>' + esc(n.a) + '</span><span class="hero__amp">&amp;</span><span>' + esc(n.b) + '</span></h1>' +
          '<p class="hero__date"><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' +
          cd + cta + '</div><div class="window__lattice" aria-hidden="true"></div></div></section>';

      case 'cover':
        var month = fmt(w.date, { month: 'long', year: 'numeric' }, w);
        return '<section class="hero hero--cover" id="top"><div class="cover">' +
          '<p class="cover__issue"' + r(0) + '><span>The wedding issue</span><span>' + esc(month) + '</span></p>' +
          '<h1 class="hero__names display"' + r(1) + '>' + esc(n.a) + '<span class="hero__amp">&amp;</span>' + esc(n.b) + '</h1>' +
          '<div class="cover__body">' +
          '<ul class="cover__lines"' + r(2) + '>' +
          '<li><strong>' + esc(w.events.length) + ' days</strong> of family, food and dancing in ' + esc(w.city.split(',')[0]) + '</li>' +
          '<li><strong>How they met</strong> and who forgot the tea</li>' +
          '<li><strong>Your seat is waiting.</strong> Tell us you are coming</li></ul>' +
          '<div class="cover__art"' + r(2) + '>' + (img || '<span class="display">' + monogram + '</span>') + '</div>' +
          '<div class="cover__side"' + r(3) + '><p class="hero__date"><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' + cd + cta + '</div>' +
          '</div></div></section>';

      default: /* himalaya */
        return '<section class="hero hero--himalaya" id="top">' + ART.prayerFlags() + '<div class="hero__inner">' +
          '<p class="hero__invite"' + r(0) + '>' + esc(w.invite) + '</p>' +
          '<h1 class="hero__names display"' + r(1) + '>' + esc(n.a) + ' <span class="hero__amp">&amp;</span> ' + esc(n.b) + '</h1>' +
          '<p class="hero__date"' + r(2) + '><strong>' + esc(d) + '</strong><span class="hero__place">' + place + '</span></p>' +
          '<div' + r(3) + '>' + cd + cta + '</div></div>' + ART.mountains() + '</section>';
    }
  }

  function navHTML(w) {
    var n = names(w);
    var links = [['story', tr('Our story', 'हाम्रो कथा')], ['events', tr('Events', 'कार्यक्रम')], ['gallery', tr('Photos', 'तस्बिरहरू')], ['faq', tr('Good to know', 'जानकारी')]];
    return '<header class="nav"><div class="nav__inner wrap">' +
      '<a class="nav__mark display" href="#top">' + esc(n.a[0]) + '<span aria-hidden="true">&amp;</span><span class="sr">and</span>' + esc(n.b[0]) + '</a>' +
      '<button class="nav__toggle" aria-expanded="false" aria-controls="nav-links">Menu</button>' +
      '<nav aria-label="Sections"><ul class="nav__links" id="nav-links">' +
      links.map(function (l) { return '<li><a href="#' + l[0] + '">' + l[1] + '</a></li>'; }).join('') +
      '<li><a class="btn btn--solid btn--sm" href="#rsvp">' + tr('RSVP', 'उपस्थिति') + '</a></li></ul></nav></div></header>';
  }

  function coupleHTML(w) {
    return '<div class="couple">' + [w.couple.partner1, w.couple.partner2].map(function (p) {
      return '<article class="person">' +
        (p.photo ? '<img class="person__photo" src="' + esc(p.photo) + '" alt="' + esc(p.full) + '" loading="lazy">' : '') +
        '<h3 class="person__name display">' + esc(p.full) + '</h3>' +
        (p.parents ? '<p class="person__parents">' + esc(p.parents) + '</p>' : '') +
        (p.bio ? '<p>' + esc(p.bio) + '</p>' : '') + '</article>';
    }).join('') + '</div>';
  }

  function storyHTML(w) {
    return '<section class="section" id="story"><div class="wrap">' +
      '<div class="section__head"><h2 class="section__title display">' + tr('Our story', 'हाम्रो कथा') + '</h2>' +
      '<p class="section__lede">' + tr('Two families, one story, a lifetime together.', 'दुई परिवार, एउटै कथा, जीवनभरको साथ।') + '</p></div>' +
      coupleHTML(w) +
      '<ol class="story">' + w.story.map(function (s) {
        return '<li class="story__item"><p class="story__year display">' + esc(s.year) + '</p><div><h3 class="story__title">' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div></li>';
      }).join('') + '</ol></div></section>';
  }

  function eventsHTML(w) {
    return '<section class="section section--alt" id="events"><div class="wrap">' +
      '<div class="section__head"><h2 class="section__title display">' + tr('Events', 'कार्यक्रम') + '</h2>' +
      '<p class="section__lede">' + tr('All times are Nepal time. Tap a venue for directions or save an event to your calendar.', 'सबै समय नेपाल समयअनुसार हुन्। स्थानको नक्सा हेर्नुहोस् वा पात्रोमा राख्नुहोस्।') + '</p></div>' +
      '<ol class="events">' + w.events.map(function (e, i) {
        return '<li class="event">' +
          '<p class="event__when"><span class="event__day display">' + esc(fmt(e.start, { day: 'numeric' }, w)) + '</span>' +
          '<span class="event__month">' + esc(fmt(e.start, { month: 'short' }, w)) + '</span>' +
          '<span class="event__wd">' + esc(fmt(e.start, { weekday: 'long' }, w)) + '</span></p>' +
          '<div class="event__body"><h3 class="event__name display">' + esc(e.name) + '</h3>' +
          '<p class="event__time">' + esc(time(e.start, w)) + (e.end ? ' to ' + esc(time(e.end, w)) : '') + '</p>' +
          '<p class="event__venue"><strong>' + esc(e.venue) + '</strong><br>' + esc(e.address) + '</p>' +
          (e.note ? '<p class="event__note">' + esc(e.note) + '</p>' : '') +
          (e.dress ? '<p class="event__dress"><span>Dress</span> ' + esc(e.dress) + '</p>' : '') + '</div>' +
          '<div class="event__actions">' +
          (e.mapUrl ? '<a class="btn btn--ghost btn--sm" href="' + esc(e.mapUrl) + '" target="_blank" rel="noopener">Directions</a>' : '') +
          '<button class="btn btn--ghost btn--sm" type="button" data-ics="' + i + '">Add to calendar</button></div></li>';
      }).join('') + '</ol></div></section>';
  }

  function galleryHTML(w) {
    if (!w.gallery || !w.gallery.length) return '';
    return '<section class="section" id="gallery"><div class="wrap">' +
      '<div class="section__head"><h2 class="section__title display">' + tr('Photos', 'तस्बिरहरू') + '</h2>' +
      '<p class="section__lede">' + tr('A few moments from our story.', 'हाम्रो कथाका केही सुन्दर क्षणहरू।') + '</p></div>' +
      '<div class="gallery">' + w.gallery.map(function (g, i) {
        var ratio = esc(g.ratio || '4/5');
        if (!g.src) {
          return '<figure class="shot shot--ph" style="--ar:' + ratio + ';--n:' + i + '"><div class="ph" role="img" aria-label="Photo placeholder"></div><figcaption>' + esc(g.caption) + '</figcaption></figure>';
        }
        return '<figure class="shot" style="--ar:' + ratio + '"><button type="button" data-lightbox="' + i + '" aria-label="Open photo: ' + esc(g.caption) + '">' +
          '<img src="' + esc(g.src) + '" alt="' + esc(g.caption) + '" loading="lazy"></button><figcaption>' + esc(g.caption) + '</figcaption></figure>';
      }).join('') + '</div></div></section>';
  }

  function faqHTML(w) {
    if (!w.faqs || !w.faqs.length) return '';
    return '<section class="section section--alt" id="faq"><div class="wrap">' +
      '<div class="section__head"><h2 class="section__title display">' + tr('Good to know', 'जानकारी') + '</h2>' +
      '<p class="section__lede">' + tr('Travel, stays and the questions everyone asks.', 'यात्रा, बसाइँ र पाहुनाले सोध्ने सामान्य प्रश्नहरू।') + '</p></div>' +
      '<div class="faq">' + w.faqs.map(function (f) {
        return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
      }).join('') + '</div></div></section>';
  }

  function rsvpHTML(w) {
    var dl = w.rsvp && w.rsvp.deadline ? fmt(w.rsvp.deadline + 'T12:00:00Z', { day: 'numeric', month: 'long', year: 'numeric' }, w) : '';
    var copy = w.language === 'ne' ? {name:'तपाईंको नाम',contact:'फोन वा इमेल',will:'तपाईं आउनुहुन्छ?',yes:'आउँछु',no:'माफ गर्नुहोस्, आउन सक्दिनँ',guests:'पाहुनाको संख्या',events:'कुन कार्यक्रममा?',message:'जोडीका लागि सन्देश',send:'जवाफ पठाउनुहोस्'} : {name:'Your name',contact:'Phone or email',will:'Will you come?',yes:'Yes, I will be there',no:'Sorry, I cannot',guests:'Number of guests, including you',events:'Which events?',message:'Message for the couple',send:'Send RSVP'};
    return '<section class="section" id="rsvp"><div class="wrap rsvp">' +
      '<div class="section__head"><h2 class="section__title display">' + tr('RSVP', 'उपस्थिति') + '</h2>' +
      '<p class="section__lede">' + (dl ? tr('Please reply by ', 'कृपया ') + esc(dl) + tr(' so we can plan seats and food.', ' भित्र जवाफ दिनुहोस्।') : tr('Please let us know if you can come.', 'तपाईं आउन सक्नुहुन्छ कि सक्नुहुन्न, जानकारी दिनुहोस्।')) + '</p>' +
      (w.hashtag ? '<p class="rsvp__tag">Share photos with <strong>' + esc(w.hashtag) + '</strong></p>' : '') + '</div>' +
      '<form class="form" novalidate>' +
      '<div class="field"><label for="f-name">' + copy.name + '</label><input id="f-name" name="name" autocomplete="name" required></div>' +
      '<div class="field"><label for="f-contact">' + copy.contact + '</label><input id="f-contact" name="contact" autocomplete="tel" required></div>' +
      '<fieldset class="field"><legend>' + copy.will + '</legend><div class="choices">' +
      '<label class="choice"><input type="radio" name="attending" value="Yes" required checked><span>' + copy.yes + '</span></label>' +
      '<label class="choice"><input type="radio" name="attending" value="No"><span>' + copy.no + '</span></label></div></fieldset>' +
      '<div class="field field--guests"><label for="f-guests">' + copy.guests + '</label><input id="f-guests" name="guests" type="number" min="1" max="10" value="1" inputmode="numeric"></div>' +
      '<fieldset class="field field--events"><legend>' + copy.events + '</legend><div class="choices">' +
      w.events.map(function (e) {
        return '<label class="choice"><input type="checkbox" name="events" value="' + esc(e.name) + '" checked><span>' + esc(e.name) + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<div class="field"><label for="f-msg">' + copy.message + ' <span class="opt">(' + tr('optional', 'ऐच्छिक') + ')</span></label><textarea id="f-msg" name="message" rows="3"></textarea></div>' +
      '<button class="btn btn--solid btn--wide" type="submit">' + copy.send + '</button>' +
      '<p class="form__status" role="status"></p></form></div></section>';
  }

  function footerHTML(w, allowSwitch) {
    var n = names(w);
    return '<footer class="footer"><div class="wrap footer__inner">' +
      '<p class="footer__names display">' + esc(n.a) + ' &amp; ' + esc(n.b) + '</p>' +
      '<p>' + esc(longDate(w.date, w)) + '<br>' + esc(w.city) + '</p>' +
      (w.footerNote ? '<p>' + esc(w.footerNote) + '</p>' : '') +
      (allowSwitch ? '<p><a href="designs" data-link>Browse all five designs</a></p>' : '') +
      '</div></footer>';
  }

  function switcherHTML(current, slug) {
    return '<div class="switcher"><button class="switcher__btn" type="button" aria-expanded="false" aria-controls="switcher-panel">' +
      '<span class="sw" aria-hidden="true">' + current.swatch.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>Design: ' + esc(current.name) + '</button>' +
      '<div class="switcher__panel" id="switcher-panel" hidden><p class="switcher__title">Try a design</p><ul>' +
      THEMES.map(function (t) {
        return '<li><button type="button" class="switcher__opt" data-theme-pick="' + t.id + '"' + (t.id === current.id ? ' aria-current="true"' : '') + '>' +
          '<span class="sw" aria-hidden="true">' + t.swatch.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' +
          '<span><strong>' + esc(t.name) + '</strong><small>' + esc(t.blurb) + '</small></span></button></li>';
      }).join('') + '</ul><a class="switcher__all" href="designs" data-link>Compare all designs side by side</a></div></div>';
  }

  function renderWedding(slug) {
    var p = params();
    var embed = p.has('embed');
    var saved = savedWeddings();
    var local = saved.find(function (item) { return item.slug === slug; });
    var load = local ? Promise.resolve(local) : (state.wedding && state.wedding.slug === slug ? Promise.resolve(state.wedding) : getJSON('data/weddings/' + slug + '.json'));
    return load.then(function (w) {
      w.slug = w.slug || slug;
      if (w.expiresAt && Date.now() > new Date(w.expiresAt).getTime()) return renderExpired(w);
      state.wedding = w;
      document.documentElement.lang = w.language === 'ne' ? 'ne' : 'en';
      var t = byId(p.get('theme')) || byId(w.theme) || THEMES[0];
      state.theme = t;
      loadFonts(t);
      document.documentElement.setAttribute('data-theme', t.id);
      document.body.className = embed ? 'is-embed' : '';
      var n = names(w);
      setMeta(n.a + ' & ' + n.b + ' are getting married', w.invite + ' ' + longDate(w.date, w) + ', ' + w.city + '.', t.themeColor);
      var allowSwitch = state.site.allowThemeSwitch !== false;
      app.innerHTML = navHTML(w) + '<main id="main">' + heroHTML(w, t) + (w.story && w.story.length ? storyHTML(w) : '') + (w.events && w.events.length ? eventsHTML(w) : '') + galleryHTML(w) + faqHTML(w) + rsvpHTML(w) + '</main>' +
        footerHTML(w, allowSwitch && !embed) + (allowSwitch && !embed ? switcherHTML(t, slug) : '') +
        '<dialog class="lightbox" aria-label="Photo"><button class="lightbox__close" type="button">Close</button><img alt=""><p></p></dialog>';
      startCountdown(w);
      wire(w);
      if (location.hash && location.hash.length > 1) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    }).catch(function (err) {
      console.error(err);
      renderMissing(slug);
    });
  }

  function savedWeddings() { try { return JSON.parse(localStorage.getItem('niuto:weddings') || '[]'); } catch (e) { return []; } }

  var copy = {
    en: {nav:'Wedding websites', sub:'MADE FOR YOUR DAY', title:'Your wedding,\nyour own little corner of the internet.', intro:'A beautiful place for every detail, every guest, and the days you will remember.', cta:'Create your wedding website', browse:'Explore five signature designs', showcase:'A page that feels like the two of you.', showcaseText:'Share the date, the places, the little story, and everything your guests need to know.', choose:'Five ways to say “we do.”', chooseText:'Choose an atmosphere. Make it yours with your names, celebrations, photos, and language.', start:'Start with the essentials', steps:'Tell us the date and details. Pick your design and language. Your invitation page is ready to share.', groom:'Groom’s name', bride:'Bride’s name', order:'Name order', gfirst:'Groom first', bfirst:'Bride first', weddingDate:'Wedding date', city:'City / venue area', language:'Guest language', design:'Choose a design', create:'Create my page', back:'Back to designs', link:'Your page link', expires:'Available through four days after your wedding.', themeNames:['Himalaya','Dhaka','Sayapatri','Sindoor','Botanical'], themeDesc:['Quiet mountain air and soft blue skies.','Woven tradition in confident vermilion.','Marigold garlands and a garden celebration.','A timeless ceremony in vermilion and gold.','A modern garden party in sage and blush.'], exists:'That page name is already taken. Try a different name combination.', required:'Add both names and your wedding date to continue.', expired:'This wedding page has reached the end of its celebration.', expiredText:'This invitation was available through four days after the wedding.', home:'Create a wedding page', success:'Your page is ready to share.' },
    ne: {nav:'विवाह वेबसाइट', sub:'तपाईंको विशेष दिनका लागि', title:'तपाईंको विवाह,\nतपाईंको आफ्नै सुन्दर पाना।', intro:'मिति, निमन्त्रणा, कार्यक्रम र सम्झनाहरू राख्ने एक सुन्दर ठाउँ।', cta:'विवाह वेबसाइट बनाउनुहोस्', browse:'पाँच आकर्षक डिजाइन हेर्नुहोस्', showcase:'तपाईं दुवैको कथा सुनाउने पाना।', showcaseText:'मिति, स्थान, प्रेम कथा र पाहुनालाई चाहिने सबै जानकारी साझा गर्नुहोस्।', choose:'“शुभ विवाह” का पाँच शैली।', chooseText:'आफ्नो मनपर्ने शैली छान्नुहोस्। नाम, कार्यक्रम, फोटो र भाषासँग आफ्नो बनाउनुहोस्।', start:'आवश्यक जानकारीबाट सुरु गर्नुहोस्', steps:'मिति र विवरण भर्नुहोस्। डिजाइन र भाषा छान्नुहोस्। निमन्त्रणा साझा गर्न तयार हुन्छ।', groom:'दुलहाको नाम', bride:'दुलहीको नाम', order:'नामको क्रम', gfirst:'पहिले दुलहा', bfirst:'पहिले दुलही', weddingDate:'विवाह मिति', city:'सहर / कार्यक्रम स्थल', language:'पाहुनाको भाषा', design:'डिजाइन छान्नुहोस्', create:'मेरो पाना बनाउनुहोस्', back:'डिजाइनहरू हेर्नुहोस्', link:'तपाईंको पेज लिङ्क', expires:'विवाहको चार दिनपछि सम्म उपलब्ध।', themeNames:['हिमालय','ढाका','सयपत्री','सिन्दूर','बोटानिकल'], themeDesc:['शान्त हिमाल र नीलो आकाशको कोमलता।','विश्वासिलो रातो रङमा बुनेको परम्परा।','सयपत्रीको माला र बगैँचाको उत्सव।','रातो र सुनौलो रङको कालातीत समारोह।','सेज र गुलाबी रङको आधुनिक बगैँचा।'], exists:'यो पेज नाम पहिल्यै प्रयोग भएको छ। अर्को नाम संयोजन प्रयास गर्नुहोस्।', required:'अगाडि बढ्न दुवै नाम र विवाह मिति भर्नुहोस्।', expired:'यो विवाह पेजको अवधि समाप्त भएको छ।', expiredText:'यो निमन्त्रणा विवाहको चार दिनपछि सम्म उपलब्ध थियो।', home:'विवाह पेज बनाउनुहोस्', success:'तपाईंको पेज साझा गर्न तयार छ।' }
  };
  var signupThemes = ['himalaya','dhaka','sayapatri','sindoor','botanical'];
  function renderStudio() {
    var lang = params().get('lang') === 'ne' ? 'ne' : 'en', c = copy[lang];
    document.documentElement.lang = lang === 'ne' ? 'ne' : 'en';
    document.documentElement.setAttribute('data-theme','studio'); document.body.className = '';
    var font = document.getElementById('theme-fonts'); if (font) font.remove();
    setMeta('Wedding websites | Niuto', 'Create a beautiful bilingual wedding invitation website.', '#f8f5ef');
    app.innerHTML = '<main class="product"><header class="product__nav"><a href="wedding-websites" data-link class="product__brand">NIUTO<span>WEDDINGS</span></a><a href="wedding-websites?lang='+(lang==='en'?'ne':'en')+'" data-link class="product__lang">'+(lang==='en'?'नेपाली':'English')+'</a></header>'+
      '<section class="product__hero"><div class="product__heroCopy"><p class="eyebrow">'+c.sub+'</p><h1>'+c.title.replace('\n','<br>')+'</h1><p>'+c.intro+'</p><a class="product__cta" href="#create">'+c.cta+' <span>↗</span></a><a class="product__textLink" href="#designs">'+c.browse+' ↓</a></div><div class="product__art"><div class="art-sun"></div><div class="art-frame"><span>शुभ विवाह</span><strong>A <i>&amp;</i> R</strong><small>13 FEBRUARY · KATHMANDU</small></div><span class="art-leaf leaf-one">✿</span><span class="art-leaf leaf-two">✿</span></div></section>'+
      '<section class="product__intro"><p class="eyebrow">A NEW WAY TO INVITE</p><h2>'+c.showcase+'</h2><p>'+c.showcaseText+'</p></section>'+
      '<section class="product__designs" id="designs"><div class="product__sectionHead"><div><p class="eyebrow">FIVE SIGNATURE DESIGNS</p><h2>'+c.choose+'</h2></div><p>'+c.chooseText+'</p></div><div class="design-list">'+signupThemes.map(function(id,i){var t=byId(id);return '<article class="design-preview design-preview--'+id+'"><div class="preview-art"><span>'+c.themeNames[i]+'</span><strong>Aarav <i>&amp;</i> Riya</strong><small>13 · 02 · 2027</small></div><div class="preview-meta"><span>0'+(i+1)+'</span><p><strong>'+c.themeNames[i]+'</strong><small>'+c.themeDesc[i]+'</small></p></div></article>';}).join('')+'</div></section>'+
      '<section class="product__create" id="create"><div class="create-copy"><p class="eyebrow">YOUR STORY STARTS HERE</p><h2>'+c.start+'</h2><p>'+c.steps+'</p><div class="create-note">✦ &nbsp;'+c.expires+'</div></div><form class="create-form" id="create-form"><div class="name-fields"><label>'+c.groom+'<input name="groom" required autocomplete="given-name" placeholder="Aarav"></label><label>'+c.bride+'<input name="bride" required placeholder="Riya"></label></div><label>'+c.order+'<select name="order"><option value="groom">'+c.gfirst+'</option><option value="bride">'+c.bfirst+'</option></select></label><label>'+c.weddingDate+'<input type="date" name="date" required></label><label>'+c.city+'<input name="city" placeholder="Kathmandu, Nepal"></label><div class="form-row"><label>'+c.language+'<select name="language"><option value="en">English</option><option value="ne">नेपाली</option></select></label><label>'+c.design+'<select name="theme">'+signupThemes.map(function(id,i){return '<option value="'+id+'">'+c.themeNames[i]+'</option>';}).join('')+'</select></label></div><button class="product__cta" type="submit">'+c.create+' <span>↗</span></button><p class="create-status" role="status"></p></form></section><footer class="product__footer"><a href="wedding-websites" data-link>NIUTO WEDDINGS</a><span>Made with love in Nepal</span></footer></main>';
    document.getElementById('create-form').addEventListener('submit',function(e){e.preventDefault();var f=e.currentTarget,d=new FormData(f),g=String(d.get('groom')).trim(),b=String(d.get('bride')).trim(),date=String(d.get('date'));var status=f.querySelector('.create-status');if(!g||!b||!date){status.textContent=c.required;return;}var left=d.get('order')==='groom'?g:b,right=d.get('order')==='groom'?b:g,slug=slugPart(left)+'-weds-'+slugPart(right),saved=savedWeddings();if(saved.some(function(w){return w.slug===slug;})){status.textContent=c.exists;return;}var end=new Date(date+'T23:59:59+05:45');end.setTime(end.getTime()+4*86400000);var wedding={slug:slug,theme:d.get('theme'),language:d.get('language'),timezone:'Asia/Kathmandu',locale:d.get('language')==='ne'?'ne-NP':'en-GB',date:date+'T10:00:00+05:45',expiresAt:end.toISOString(),couple:{partner1:{first:left,full:left},partner2:{first:right,full:right}},city:String(d.get('city')||'Nepal'),invite:d.get('language')==='ne'?'हाम्रो विवाह समारोहमा सहभागी भई शुभकामना दिनुहुन हार्दिक निमन्त्रणा गर्दछौँ।':'Together with our families, we invite you to celebrate our wedding.',story:[],events:[],gallery:[],faqs:[],rsvp:{},footerNote:d.get('language')==='ne'?'दुवै परिवारको तर्फबाट माया सहित।':'With love from both families.'};saved.push(wedding);localStorage.setItem('niuto:weddings',JSON.stringify(saved));go(slug);});
  }
  function slugPart(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'couple';}
  function renderExpired(w){document.documentElement.setAttribute('data-theme',w.theme||'bare');loadFonts(byId(w.theme||'bare'));setMeta('Celebration complete','This wedding page has expired.');app.innerHTML='<main class="expired"><p class="eyebrow">'+esc(w.couple.partner1.first)+' &amp; '+esc(w.couple.partner2.first)+'</p><h1>Thank you for celebrating with us.</h1><p>This invitation has reached the end of its celebration.</p><a href="wedding-websites" data-link>Niuto Weddings</a></main>';}

  function renderMissing(slug) {
    document.documentElement.setAttribute('data-theme', 'bare');
    loadFonts(byId('bare'));
    setMeta('Page not found', 'This wedding page does not exist.');
    app.innerHTML = '<main id="main" class="missing wrap"><h1 class="display">We could not find “' + esc(slug) + '”.</h1>' +
      '<p>Check the link you were sent. If you are setting this site up, add <code>data/weddings/' + esc(slug) + '.json</code>.</p>' +
      '<p><a class="btn btn--solid" href="./" data-link>Go to the home page</a></p></main>';
  }

  /* ---------- behaviour ---------- */
  function startCountdown(w) {
    var el = document.querySelector('[data-countdown]');
    if (!el) return;
    var target = new Date(w.date).getTime();
    var tick = function () {
      var ms = target - Date.now();
      if (ms <= 0) {
        var married = ms < -86400000;
        el.outerHTML = '<p class="countdown countdown--done">' + (married ? 'Married on ' + esc(longDate(w.date, w)) + '.' : 'Today is the day.') + '</p>';
        clearInterval(state.timer);
        return;
      }
      var s = Math.floor(ms / 1000);
      var v = { days: Math.floor(s / 86400), hours: Math.floor(s % 86400 / 3600), minutes: Math.floor(s % 3600 / 60), seconds: s % 60 };
      Object.keys(v).forEach(function (k) {
        var dd = el.querySelector('[data-u="' + k + '"]');
        if (dd) dd.textContent = k === 'days' ? v[k] : String(v[k]).padStart(2, '0');
      });
    };
    tick();
    state.timer = setInterval(tick, 1000);
  }

  function icsFor(w, e) {
    var z = function (iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var x = function (s) { return String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); };
    var n = names(w);
    var end = e.end || new Date(new Date(e.start).getTime() + 3 * 3600000).toISOString();
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//wedding-website//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + z(e.start) + '-' + w.slug + '@wedding', 'DTSTAMP:' + z(new Date().toISOString()),
      'DTSTART:' + z(e.start), 'DTEND:' + z(end),
      'SUMMARY:' + x(e.name + ': ' + n.a + ' & ' + n.b), 'LOCATION:' + x(e.venue + ', ' + e.address),
      'DESCRIPTION:' + x([e.note, e.dress ? 'Dress: ' + e.dress : '', e.mapUrl].filter(Boolean).join('\n')),
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }

  function wire(w) {
    var nav = document.querySelector('.nav');
    var toggle = nav.querySelector('.nav__toggle');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open);
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav__links a')) { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    });

    document.querySelectorAll('[data-ics]').forEach(function (b) {
      b.addEventListener('click', function () {
        var e = w.events[+b.dataset.ics];
        var blob = new Blob([icsFor(w, e)], { type: 'text/calendar;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (w.slug + '-' + e.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.ics';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      });
    });

    var dlg = document.querySelector('.lightbox');
    document.querySelectorAll('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = w.gallery[+b.dataset.lightbox];
        dlg.querySelector('img').src = g.src;
        dlg.querySelector('img').alt = g.caption || '';
        dlg.querySelector('p').textContent = g.caption || '';
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('.lightbox__close')) dlg.close(); });

    var form = document.querySelector('.form');
    var guests = form.querySelector('.field--guests');
    var evs = form.querySelector('.field--events');
    form.addEventListener('change', function () {
      var yes = form.attending.value === 'Yes';
      guests.hidden = !yes; evs.hidden = !yes;
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submitRsvp(w, form); });

    var sw = document.querySelector('.switcher');
    if (sw) {
      var btn = sw.querySelector('.switcher__btn');
      var panel = sw.querySelector('.switcher__panel');
      var setOpen = function (open) { btn.setAttribute('aria-expanded', open); panel.hidden = !open; };
      btn.addEventListener('click', function () { setOpen(panel.hidden); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });
      sw.addEventListener('click', function (e) {
        var pick = e.target.closest('[data-theme-pick]');
        if (!pick) return;
        var q = params(); q.set('theme', pick.dataset.themePick);
        history.replaceState(null, '', location.pathname + '?' + q.toString());
        var y = window.scrollY;
        route();
        window.scrollTo(0, y);
        var nb = document.querySelector('.switcher__btn');
        if (nb) nb.focus();
      });
    }
  }

  function submitRsvp(w, form) {
    var status = form.querySelector('.form__status');
    var name = form.elements.name.value.trim(), contact = form.contact.value.trim();
    status.className = 'form__status';
    if (!name || !contact) {
      status.textContent = 'Add your name and a phone number or email so we know who is replying.';
      status.classList.add('is-error');
      (name ? form.elements.contact : form.elements.name).focus();
      return;
    }
    var yes = form.attending.value === 'Yes';
    var data = {
      wedding: w.slug, name: name, contact: contact, attending: form.attending.value,
      guests: yes ? form.guests.value : '0',
      events: yes ? Array.from(form.querySelectorAll('input[name=events]:checked')).map(function (i) { return i.value; }).join(', ') : '',
      message: form.message.value.trim()
    };
    var text = 'RSVP for ' + names(w).a + ' & ' + names(w).b + '\n' +
      'Name: ' + data.name + '\nContact: ' + data.contact + '\nAttending: ' + data.attending +
      (yes ? '\nGuests: ' + data.guests + '\nEvents: ' + data.events : '') + (data.message ? '\nMessage: ' + data.message : '');
    var r = w.rsvp || {};
    var done = function (msg) {
      status.textContent = msg;
      status.classList.add('is-ok');
      try { localStorage.setItem('rsvp:' + w.slug, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
    };

    if (r.endpoint) {
      var btn = form.querySelector('[type=submit]');
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch(r.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data), mode: r.endpoint.indexOf('script.google.com') > -1 ? 'no-cors' : 'cors' })
        .then(function (res) { if (res.type !== 'opaque' && !res.ok) throw new Error(res.status); done(yes ? 'RSVP sent. Thank you, ' + name + '. See you there.' : 'RSVP sent. Thank you for letting us know, ' + name + '.'); form.reset(); })
        .catch(function () { status.textContent = 'Your RSVP did not send. Check your connection and try again.'; status.classList.add('is-error'); })
        .then(function () { btn.disabled = false; btn.textContent = 'Send RSVP'; });
    } else if (r.whatsapp) {
      window.open('https://wa.me/' + r.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      done('WhatsApp opened with your RSVP. Press send there to finish.');
    } else if (r.email) {
      location.href = 'mailto:' + r.email + '?subject=' + encodeURIComponent('RSVP: ' + name) + '&body=' + encodeURIComponent(text);
      done('Your email app opened with your RSVP. Press send there to finish.');
    } else {
      done('RSVP saved on this device. The couple has not connected a form yet, so please message them too.');
    }
  }

  /* ---------- designs gallery ---------- */
  function renderDesigns() {
    document.documentElement.setAttribute('data-theme', 'studio');
    document.body.className = '';
    var link = document.getElementById('theme-fonts');
    if (link) link.remove();
    setMeta('Five wedding website designs', 'Five designs for a Nepali wedding website. Pick one and make it yours.', '#fafaf9');
    var slug = state.site.defaultWedding;
    app.innerHTML = '<main id="main" class="studio">' +
      '<header class="studio__head wrap"><a class="studio__back" href="./" data-link>Back to the wedding</a>' +
      '<h1>Five designs for one wedding</h1>' +
      '<p>Each design below is the same wedding website with the same details. Open one to see it full size, then set its name as <code>"theme"</code> in your wedding file.</p></header>' +
      '<ul class="studio__grid wrap">' + THEMES.map(function (t) {
        var url = slug + '?theme=' + t.id;
        return '<li class="tile"><a class="tile__frame" href="' + url + '" data-link aria-label="Open the ' + esc(t.name) + ' design">' +
          '<iframe src="' + url + '&embed=1" title="' + esc(t.name) + ' design preview" loading="lazy" tabindex="-1" aria-hidden="true"></iframe></a>' +
          '<div class="tile__meta"><h2>' + esc(t.name) + '</h2><p>' + esc(t.blurb) + '</p>' +
          '<p class="tile__code">"theme": "' + t.id + '"</p></div></li>';
      }).join('') + '</ul></main>';
    var size = function () {
      document.querySelectorAll('.tile__frame').forEach(function (f) { f.style.setProperty('--s', f.clientWidth / 1280); });
    };
    size();
    window.addEventListener('resize', size);
  }

  /* ---------- boot ---------- */
  getJSON('data/site.json').catch(function () { return { defaultWedding: 'aarav-weds-riya', allowThemeSwitch: true }; })
    .then(function (site) { state.site = site; route(); });
})();
