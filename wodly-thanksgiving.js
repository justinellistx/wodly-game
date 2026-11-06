/* WODLY Thanksgiving season.
   Decorations + themed homepage: Nov 2 through the Sunday after Thanksgiving (US Central time).
   Thanksgiving week itself (Mon–Sun) also makes the Thanksgiving board the default for new games.
   Dates are worked out every year, so nothing needs redeploying. Force for testing: ?thanksgiving=1 (=0 hides).
   Purely visual: the overlay never takes clicks; leaves stay still for people who prefer reduced motion. */
(function () {
  var force = null;
  try { var q = new URLSearchParams(location.search).get('thanksgiving'); if (q === '1') force = true; if (q === '0') force = false; } catch (e) {}
  function today() {
    try {
      var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = +x.value; }); return o;
    } catch (e) { var n = new Date(); return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() }; }
  }
  // Turkey WOD — the in-gym Thanksgiving game day at CrossFit Willis & CrossFit Conroe.
  // The homepage counts down to `start`, shows "today" until `end`, then the countdown disappears.
  var EVENT = { name: 'Turkey WOD', start: '2026-11-24T05:00:00-06:00', end: '2026-11-25T00:00:00-06:00',
                when: 'Tuesday, Nov 24', where: 'Every class at CrossFit Willis & CrossFit Conroe' };
  var T = today(), dow1 = new Date(Date.UTC(T.year, 10, 1)).getUTCDay();
  var thanks = 1 + ((4 - dow1 + 7) % 7) + 21;                            // 4th Thursday of November
  var isNov = T.month === 11;
  var season = isNov && T.day >= 2 && T.day <= thanks + 3;              // Nov 2 .. Sunday after
  var week = isNov && T.day >= thanks - 3 && T.day <= thanks + 3;       // Mon..Sun of Thanksgiving week
  if (force !== null) { season = force; week = force; }
  if (!season) return;
  // `on` drives the default board on the setup screen — Thanksgiving week only.
  window.WODLY_SEASON = { on: week, name: 'thanksgiving', board: 'thanksgiving', preset: 'gobble' };

  var css = ''
    + '.tg-fx{position:fixed;inset:0;pointer-events:none;z-index:9000;overflow:hidden;}'
    + '.tg-leaf{position:absolute;top:-60px;width:clamp(18px,2.4vw,30px);animation:tgFall linear infinite;}'
    + '.tg-leaf svg{width:100%;height:auto;animation:tgSway 2.6s ease-in-out infinite alternate;}'
    + '@keyframes tgFall{0%{transform:translateY(0)}100%{transform:translateY(112vh)}}'
    + '@keyframes tgSway{from{transform:translateX(-22px) rotate(-35deg)}to{transform:translateX(22px) rotate(35deg)}}'
    + '.tg-glow{position:absolute;left:0;right:0;bottom:0;height:14vh;background:linear-gradient(to top,rgba(230,120,30,.14),transparent);}'
    + '.tg-ribbon{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;padding:9px 16px;font:800 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;text-align:center;'
    + 'background:linear-gradient(90deg,#7a2e12,#f5a623 50%,#7a2e12);background-size:200% 100%;animation:tgShine 6s linear infinite;position:absolute;top:0;left:0;right:0;z-index:9001;box-sizing:border-box;}'
    + '.tg-ribbon a{color:#3a1708;background:#fff;border-radius:999px;padding:4px 11px;text-decoration:none;font-weight:900;white-space:nowrap;}'
    + '@keyframes tgShine{to{background-position:-200% 0}}'
    + '@media (prefers-reduced-motion:reduce){.tg-leaf,.tg-leaf svg,.tg-ribbon{animation:none!important}.tg-leaf{display:none}}';

  var COLS = ['#c8401c', '#e6781e', '#f0b432', '#a8361e', '#965a1e'];
  function leafSvg(c) {
    return '<svg viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 12C8 3 22 1 38 12 22 23 8 21 2 12z" fill="' + c + '"/>'
      + '<path d="M0 12h34M12 12l6-5M12 12l6 5M22 12l5-4M22 12l5 4" stroke="rgba(0,0,0,.35)" stroke-width="1.2" fill="none"/></svg>';
  }

  function mount() {
    if (document.querySelector('.tg-fx')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var fx = document.createElement('div'); fx.className = 'tg-fx'; fx.setAttribute('aria-hidden', 'true');
    var h = '<div class="tg-glow"></div>';
    for (var i = 0; i < 9; i++) {
      var left = (i * 11 + 4 + Math.random() * 6).toFixed(1), dur = (11 + Math.random() * 8).toFixed(1), delay = (-Math.random() * 18).toFixed(1);
      h += '<div class="tg-leaf" style="left:' + left + 'vw;animation-duration:' + dur + 's;animation-delay:' + delay + 's;opacity:.75">' + leafSvg(COLS[i % COLS.length]) + '</div>';
    }
    fx.innerHTML = h; document.body.appendChild(fx);


    var path = location.pathname.replace(/\/+$/, '');
    if (path === '' || path === '/index' || path === '/index.html') homepage();
  }

  // Themed homepage: warm harvest backdrop, a "Happy Thanksgiving" pill under the tagline,
  // and a promo card for the board + deck right above the preview video.
  function homepage() {
    var hs = document.createElement('style');
    hs.textContent = ''
      + 'body.tg-home{background:radial-gradient(circle at 50% -8%,#3a200c,#120a05 58%,#0a0705) !important;}'
      + 'body.tg-home:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:url(/assets/board-thanksgiving.jpg) center top/cover no-repeat;opacity:.16;}'
      + '.tg-pill{display:inline-flex;align-items:center;gap:8px;margin:-6px auto 14px;padding:6px 14px;border-radius:999px;font:900 12px/1 system-ui,sans-serif;letter-spacing:2px;color:#ffd9a3;background:rgba(122,46,18,.55);border:1px solid rgba(245,166,35,.45);}'
      + '.tg-card{display:flex;align-items:center;gap:14px;text-decoration:none;margin:0 0 16px;padding:12px 14px;border-radius:18px;background:linear-gradient(135deg,#3b1a08,#5a2a0c 55%,#2a1205);border:1.5px solid rgba(245,166,35,.65);animation:tgCardGlow 3s ease-in-out infinite;text-align:left;}'
      + '@keyframes tgCardGlow{0%,100%{box-shadow:0 0 18px rgba(230,120,30,.2)}50%{box-shadow:0 0 34px rgba(230,120,30,.5)}}'
      + '.tg-card img{width:74px;height:74px;border-radius:12px;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,.15);}'
      + '.tg-card .tx{flex:1;min-width:0;}'
      + '.tg-card .nw{display:inline-block;font:900 10px/1 system-ui,sans-serif;letter-spacing:1.5px;color:#2a1205;background:#f5a623;padding:3px 9px;border-radius:20px;}'
      + '.tg-card .h{color:#fff;font-weight:900;font-size:18px;margin:6px 0 2px;}'
      + '.tg-card .h b{color:#f5a623;}'
      + '.tg-card .s{color:#e8c9a8;font-size:12.5px;line-height:1.4;}'
      + '.tg-card .go{flex-shrink:0;font-weight:900;font-size:14px;color:#2a1205;background:#fff;padding:10px 14px;border-radius:12px;white-space:nowrap;}'
      + '@media(max-width:420px){.tg-card .go{display:none}.tg-card .h{font-size:16px}}'
      + '.tg-cd{margin:0 0 14px;padding:16px 16px 14px;border-radius:18px;text-align:center;background:linear-gradient(160deg,#5a2a0c,#2a1205);border:1.5px solid rgba(245,166,35,.7);box-shadow:0 0 30px rgba(230,120,30,.28);}'
      + '.tg-cd .ey{font:900 11px/1 system-ui,sans-serif;letter-spacing:2.5px;color:#f5a623;}'
      + '.tg-cd .nm{font:900 34px/1.05 system-ui,sans-serif;letter-spacing:1px;color:#fff;margin:6px 0 2px;text-transform:uppercase;}'
      + '.tg-cd .wh{font:700 13px/1.4 system-ui,sans-serif;color:#e8c9a8;}'
      + '.tg-cd .clock{display:flex;justify-content:center;gap:8px;margin:12px 0 10px;}'
      + '.tg-cd .u{min-width:62px;padding:8px 6px 6px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid rgba(245,166,35,.35);}'
      + '.tg-cd .u b{display:block;font:900 30px/1 system-ui,sans-serif;color:#fff;font-variant-numeric:tabular-nums;}'
      + '.tg-cd .u span{display:block;font:800 9px/1 system-ui,sans-serif;letter-spacing:1.5px;color:#e8c9a8;margin-top:5px;}'
      + '.tg-cd .today{font:900 22px/1.2 system-ui,sans-serif;color:#f5a623;margin:10px 0 8px;}'
      + '.tg-cd .tip{font:600 12.5px/1.4 system-ui,sans-serif;color:#e8c9a8;}'
      + '.tg-cd .tip a{color:#f5a623;font-weight:800;}'
      + '@media (prefers-reduced-motion:reduce){.tg-card{animation:none}}';
    document.head.appendChild(hs);
    document.body.classList.add('tg-home');
    var tag = document.querySelector('.tagline');
    if (tag) { var p = document.createElement('div'); p.className = 'tg-pill'; p.textContent = '🍂 HAPPY THANKSGIVING 🦃'; tag.parentNode.insertBefore(p, tag.nextSibling); }
    var vid = document.querySelector('.hero-vid');
    if (vid) {
      var c = document.createElement('a'); c.className = 'tg-card'; c.href = 'board?board=thanksgiving&preset=gobble';
      c.innerHTML = '<img src="/assets/board-thanksgiving.jpg" alt="">'
        + '<div class="tx"><span class="nw">NEW · HOLIDAY</span><div class="h">Thanksgiving <b>board</b></div>'
        + '<div class="s">Gobble Gauntlet deck: Turkey Trot, Pie Push-ups, Stuffing Squats. Earn the pie.</div></div>'
        + '<span class="go">Play it →</span>';
      vid.parentNode.insertBefore(c, vid);
      countdown(c);
    }
  }
  // Turkey WOD countdown card, placed above the Thanksgiving board card. Hidden once the event day ends.
  function countdown(before) {
    var start = Date.parse(EVENT.start), end = Date.parse(EVENT.end);
    if (!(start > 0) || Date.now() >= end) return;
    var el = document.createElement('div'); el.className = 'tg-cd'; el.setAttribute('role', 'timer');
    el.innerHTML = '<div class="ey">🦃 CROSSFIT WILLIS · CROSSFIT CONROE</div><div class="nm">' + EVENT.name + '</div>'
      + '<div class="wh">' + EVENT.when + ' · ' + EVENT.where + '</div><div class="slot"></div>'
      + '<div class="tip">Grab a partner. Warm up at home: <a href="board?board=thanksgiving&preset=turkeyburn&team=2">try the Turkey WOD deck →</a></div>';
    before.parentNode.insertBefore(el, before);
    var slot = el.querySelector('.slot'), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function tick() {
      var now = Date.now();
      if (now >= end) { el.remove(); clearInterval(iv); return; }
      if (now >= start) { slot.innerHTML = '<div class="today">It\'s Turkey WOD day! See you in class.</div>'; return; }
      var t = Math.floor((start - now) / 1000), d = Math.floor(t / 86400), h = Math.floor(t % 86400 / 3600), m = Math.floor(t % 3600 / 60), sc = t % 60;
      slot.innerHTML = '<div class="clock">'
        + '<div class="u"><b>' + d + '</b><span>DAYS</span></div><div class="u"><b>' + pad(h) + '</b><span>HRS</span></div>'
        + '<div class="u"><b>' + pad(m) + '</b><span>MIN</span></div><div class="u"><b>' + pad(sc) + '</b><span>SEC</span></div></div>';
    }
    tick(); var iv = setInterval(tick, 1000);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
