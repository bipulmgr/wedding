/* Decorative SVG drawn in code so every design ships without image files. */
window.ART = (function () {
  var f = function (n) { return Math.round(n * 10) / 10; };

  function quad(p0, p1, p2, t) {
    var u = 1 - t;
    return {
      x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
      a: Math.atan2(2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]), 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])) * 180 / Math.PI
    };
  }

  function cubic(p0, p1, p2, p3, t) {
    var u = 1 - t;
    var x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    var y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    var dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    var dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    return { x: x, y: y, a: Math.atan2(dy, dx) * 180 / Math.PI };
  }

  /* Lungta: five-colour prayer flags on two sagging strings */
  function prayerFlags() {
    var colors = ['#2e6fc0', '#f4f1e8', '#c8322e', '#2f8a4c', '#f2c12e'];
    function line(p0, p1, p2, n, off) {
      var s = '<path d="M' + p0 + ' Q' + p1 + ' ' + p2 + '" fill="none" stroke="#6b5a48" stroke-width="1.5"/>';
      for (var i = 1; i < n; i++) {
        var p = quad(p0, p1, p2, i / n);
        var c = colors[(i + off) % 5];
        var sway = ((i * 37) % 7 - 3) * 1.4;
        s += '<g transform="translate(' + f(p.x) + ' ' + f(p.y) + ') rotate(' + f(p.a * 0.35 + sway) + ')">' +
          '<path d="M-17 0H17V46Q8 41 0 47Q-8 41 -17 46Z" fill="' + c + '"' +
          (c === '#f4f1e8' ? ' stroke="#d9d2c3"' : '') + '/>' +
          '<path d="M-9 12h18M-9 19h18M-9 26h12" stroke="rgba(0,0,0,.18)" stroke-width="1.4"/></g>';
      }
      return s;
    }
    return '<svg class="art art--flags" viewBox="0 0 1200 250" preserveAspectRatio="xMidYMin slice" aria-hidden="true">' +
      line([-20, 6], [620, 200], [1220, 24], 27, 0) +
      line([-20, 70], [480, 150], [1220, -6], 25, 2) + '</svg>';
  }

  function mountains() {
    return '<svg class="art art--mountains" viewBox="0 0 1200 320" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 320V180L110 120L200 160L330 50L430 120L540 30L650 128L770 64L890 140L1010 72L1120 128L1200 96V320Z" fill="#c9d7e4"/>' +
      '<path d="M296 79L330 50L366 82L348 78L332 92L316 78Z M505 60L540 30L578 64L560 60L543 74L525 62Z M740 90L770 64L800 92L784 88L770 98L756 88Z M982 96L1010 72L1040 98L1024 94L1010 104L996 94Z" fill="#fff"/>' +
      '<path d="M0 320V228L150 168L300 214L460 132L610 206L750 152L910 216L1070 160L1200 206V320Z" fill="#94acc3"/>' +
      '<path d="M0 320V272L210 238L390 262L580 230L770 266L990 238L1200 258V320Z" fill="#f6f8fa"/></svg>';
  }

  /* Marigold toran: swags along the top with strands hanging between */
  function toran() {
    var W = 1200, s = '';
    var orange = '#f39a1e', yellow = '#ffc23c';
    for (var k = 0; k < 6; k++) {
      var x0 = k * 200;
      for (var j = 0; j <= 20; j++) {
        var p = quad([x0, 10], [x0 + 100, 90], [x0 + 200, 10], j / 20);
        s += '<circle cx="' + f(p.x) + '" cy="' + f(p.y) + '" r="7" fill="' + (j % 2 ? orange : yellow) + '" stroke="#c96a0e" stroke-width="1.2" stroke-dasharray="2 2"/>';
      }
    }
    for (var x = 20; x < W; x += 40) {
      var len = 70 + 120 * Math.pow(Math.sin(Math.PI * ((x % 200) / 200)), 2);
      for (var y = 14, i = 0; y < len; y += 13, i++) {
        s += '<circle cx="' + x + '" cy="' + y + '" r="7.5" fill="' + (i % 3 === 2 ? yellow : orange) + '" stroke="#c96a0e" stroke-width="1.2" stroke-dasharray="2 2"/>';
      }
      s += '<path d="M' + x + ' ' + f(y) + 'c6 6 6 18 0 26c-6-8-6-20 0-26z" fill="#3f8f4a"/>';
    }
    s += '<path d="M0 6H1200" stroke="#c9a24a" stroke-width="4"/>';
    return '<svg class="art art--toran" viewBox="0 0 1200 230" preserveAspectRatio="xMidYMin slice" aria-hidden="true">' + s + '</svg>';
  }

  /* Diyo: a row of clay oil lamps */
  function diyas() {
    var defs = '<defs><radialGradient id="dGlow"><stop offset="0" stop-color="#ffb547" stop-opacity=".55"/><stop offset="1" stop-color="#ffb547" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="dFlame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e2531f"/><stop offset=".45" stop-color="#ffb547"/><stop offset="1" stop-color="#fff3c4"/></linearGradient></defs>';
    var out = '', n = 9;
    for (var i = 0; i < n; i++) {
      var x = 60 + i * (1080 / (n - 1));
      var mid = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
      var sc = 0.7 + 0.45 * mid;
      var y = 120 - 18 * mid;
      out += '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(sc) + ')">' +
        '<circle cx="0" cy="-34" r="58" fill="url(#dGlow)"/>' +
        '<path class="diya__flame" style="animation-delay:' + f(i * 0.37) + 's" d="M0-52C9-38 10-26 0-17C-10-26-9-38 0-52Z" fill="url(#dFlame)"/>' +
        '<path d="M-40-14H40C36 8 19 19 0 19C-19 19-36 8-40-14Z" fill="#b8682a"/>' +
        '<ellipse cx="0" cy="-14" rx="40" ry="6" fill="#6e3510"/>' +
        '<path d="M-24 2h48" stroke="#e0a05a" stroke-width="2" stroke-dasharray="4 5"/></g>';
    }
    return '<svg class="art art--diyas" viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + defs + out + '</svg>';
  }

  /* A branch of leaves with a few blush blooms */
  function branch() {
    var p0 = [210, 600], p1 = [150, 420], p2 = [280, 250], p3 = [200, 30];
    var s = '<path d="M' + p0 + 'C' + p1 + ' ' + p2 + ' ' + p3 + '" fill="none" stroke="#4f6b45" stroke-width="3"/>';
    for (var i = 1; i < 14; i++) {
      var p = cubic(p0, p1, p2, p3, i / 14);
      var side = i % 2 ? 1 : -1;
      var size = 0.7 + 0.5 * Math.sin(Math.PI * i / 14);
      s += '<path transform="translate(' + f(p.x) + ' ' + f(p.y) + ') rotate(' + f(p.a + side * 48) + ') scale(' + f(size) + ')" d="M0 0C16-14 46-14 66 0C46 14 16 14 0 0Z" fill="' + (i % 3 ? '#6f8f62' : '#4f6b45') + '"/>';
    }
    [[262, 300], [168, 470], [232, 150]].forEach(function (c, k) {
      s += '<g transform="translate(' + c + ')">';
      for (var j = 0; j < 5; j++) {
        s += '<ellipse rx="11" ry="20" cy="-14" transform="rotate(' + (j * 72 + k * 20) + ')" fill="#e9c9bd" stroke="#d7a99a"/>';
      }
      s += '<circle r="7" fill="#c98d78"/></g>';
    });
    return '<svg class="art art--branch" viewBox="0 0 420 620" aria-hidden="true">' + s + '</svg>';
  }

  return { prayerFlags: prayerFlags, mountains: mountains, toran: toran, diyas: diyas, branch: branch };
})();
