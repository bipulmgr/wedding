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
        return '<div><dt>' + u + '</dt><dd data-u="' + u + '">–</dd></div>';
      }).join('') + '</dl>';
  }

  function ctaHTML(w) {
    var by = w.rsvp && w.rsvp.deadline ? ' by ' + fmt(w.rsvp.deadline + 'T12:00:00Z', { day: 'numeric', month: 'short' }, w) : '';
    return '<div class="hero__cta"><a class="btn btn--solid" href="#rsvp">RSVP' + esc(by) + '</a>' +
      '<a class="btn btn--ghost" href="#events">See the events</a></div>';
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
    var links = [['story', 'Our story'], ['events', 'Events'], ['gallery', 'Photos'], ['faq', 'Good to know']];
    return '<header class="nav"><div class="nav__inner wrap">' +
      '<a class="nav__mark display" href="#top">' + esc(n.a[0]) + '<span aria-hidden="true">&amp;</span><span class="sr">and</span>' + esc(n.b[0]) + '</a>' +
      '<button class="nav__toggle" aria-expanded="false" aria-controls="nav-links">Menu</button>' +
      '<nav aria-label="Sections"><ul class="nav__links" id="nav-links">' +
      links.map(function (l) { return '<li><a href="#' + l[0] + '">' + l[1] + '</a></li>'; }).join('') +
      '<li><a class="btn btn--solid btn--sm" href="#rsvp">RSVP</a></li></ul></nav></div></header>';
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
      '<div class="section__head"><h2 class="section__title display">Our story</h2>' +
      '<p class="section__lede">Two families, one umbrella and a lot of walking.</p></div>' +
      coupleHTML(w) +
      '<ol class="story">' + w.story.map(function (s) {
        return '<li class="story__item"><p class="story__year display">' + esc(s.year) + '</p><div><h3 class="story__title">' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div></li>';
      }).join('') + '</ol></div></section>';
  }

  function eventsHTML(w) {
    return '<section class="section section--alt" id="events"><div class="wrap">' +
      '<div class="section__head"><h2 class="section__title display">Events</h2>' +
      '<p class="section__lede">All times are Nepal time. Tap a venue for directions or save an event to your calendar.</p></div>' +
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
      '<div class="section__head"><h2 class="section__title display">Photos</h2>' +
      '<p class="section__lede">A few places we have been. Bring your camera; there will be more.</p></div>' +
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
      '<div class="section__head"><h2 class="section__title display">Good to know</h2>' +
      '<p class="section__lede">Travel, stays and the questions everyone asks.</p></div>' +
      '<div class="faq">' + w.faqs.map(function (f) {
        return '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
      }).join('') + '</div></div></section>';
  }

  function rsvpHTML(w) {
    var dl = w.rsvp && w.rsvp.deadline ? fmt(w.rsvp.deadline + 'T12:00:00Z', { day: 'numeric', month: 'long', year: 'numeric' }, w) : '';
    return '<section class="section" id="rsvp"><div class="wrap rsvp">' +
      '<div class="section__head"><h2 class="section__title display">RSVP</h2>' +
      '<p class="section__lede">' + (dl ? 'Please reply by ' + esc(dl) + ' so we can plan seats and food.' : 'Please let us know if you can come.') + '</p>' +
      (w.hashtag ? '<p class="rsvp__tag">Share photos with <strong>' + esc(w.hashtag) + '</strong></p>' : '') + '</div>' +
      '<form class="form" novalidate>' +
      '<div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" autocomplete="name" required></div>' +
      '<div class="field"><label for="f-contact">Phone or email</label><input id="f-contact" name="contact" autocomplete="tel" required></div>' +
      '<fieldset class="field"><legend>Will you come?</legend><div class="choices">' +
      '<label class="choice"><input type="radio" name="attending" value="Yes" required checked><span>Yes, I will be there</span></label>' +
      '<label class="choice"><input type="radio" name="attending" value="No"><span>Sorry, I cannot</span></label></div></fieldset>' +
      '<div class="field field--guests"><label for="f-guests">Number of guests, including you</label><input id="f-guests" name="guests" type="number" min="1" max="10" value="1" inputmode="numeric"></div>' +
      '<fieldset class="field field--events"><legend>Which events?</legend><div class="choices">' +
      w.events.map(function (e) {
        return '<label class="choice"><input type="checkbox" name="events" value="' + esc(e.name) + '" checked><span>' + esc(e.name) + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<div class="field"><label for="f-msg">Message for the couple <span class="opt">(optional)</span></label><textarea id="f-msg" name="message" rows="3"></textarea></div>' +
      '<button class="btn btn--solid btn--wide" type="submit">Send RSVP</button>' +
      '<p class="form__status" role="status"></p></form></div></section>';
  }

  function footerHTML(w, allowSwitch) {
    var n = names(w);
    return '<footer class="footer"><div class="wrap footer__inner">' +
      '<p class="footer__names display">' + esc(n.a) + ' &amp; ' + esc(n.b) + '</p>' +
      '<p>' + esc(longDate(w.date, w)) + '<br>' + esc(w.city) + '</p>' +
      (w.footerNote ? '<p>' + esc(w.footerNote) + '</p>' : '') +
      (allowSwitch ? '<p><a href="designs" data-link>Browse all ten designs</a></p>' : '') +
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
    var load = state.wedding && state.wedding.slug === slug ? Promise.resolve(state.wedding) : getJSON('data/weddings/' + slug + '.json');
    return load.then(function (w) {
      w.slug = w.slug || slug;
      state.wedding = w;
      var t = byId(p.get('theme')) || byId(w.theme) || THEMES[0];
      state.theme = t;
      loadFonts(t);
      document.documentElement.setAttribute('data-theme', t.id);
      document.body.className = embed ? 'is-embed' : '';
      var n = names(w);
      setMeta(n.a + ' & ' + n.b + ' are getting married', w.invite + ' ' + longDate(w.date, w) + ', ' + w.city + '.', t.themeColor);
      var allowSwitch = state.site.allowThemeSwitch !== false;
      app.innerHTML = navHTML(w) + '<main id="main">' + heroHTML(w, t) + storyHTML(w) + eventsHTML(w) + galleryHTML(w) + faqHTML(w) + rsvpHTML(w) + '</main>' +
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
    setMeta('Ten wedding website designs', 'Ten designs for a Nepali wedding website. Pick one and make it yours.', '#fafaf9');
    var slug = state.site.defaultWedding;
    app.innerHTML = '<main id="main" class="studio">' +
      '<header class="studio__head wrap"><a class="studio__back" href="./" data-link>Back to the wedding</a>' +
      '<h1>Ten designs for one wedding</h1>' +
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
