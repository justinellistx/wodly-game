/* WODLY Thanksgiving week decorations.
   On from the Monday to the Sunday of US Thanksgiving week (US Central time), worked out every year,
   then off again — no redeploy needed. Force for testing: ?thanksgiving=1 (or =0 to hide).
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
  function inWindow() {
    var t = today(); if (t.month !== 11) return false;
    var dow1 = new Date(Date.UTC(t.year, 10, 1)).getUTCDay();          // weekday of Nov 1
    var thanks = 1 + ((4 - dow1 + 7) % 7) + 21;                         // 4th Thursday
    return t.day >= thanks - 3 && t.day <= thanks + 3;                  // Mon..Sun of that week
  }
  var on = force !== null ? force : inWindow();
  if (!on) return;
  window.WODLY_SEASON = { on: true, name: 'thanksgiving', board: 'thanksgiving', preset: 'gobble' };

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
    if (path === '' || path === '/index' || path === '/index.html') {
      var r = document.createElement('div'); r.className = 'tg-ribbon';
      r.innerHTML = '<span>🦃 New Thanksgiving board + Gobble Gauntlet deck</span><a href="board?board=thanksgiving&preset=gobble">Play it</a>';
      document.body.insertBefore(r, document.body.firstChild);
      var pt = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
      document.body.style.paddingTop = (pt + r.offsetHeight + 6) + 'px';
    }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
