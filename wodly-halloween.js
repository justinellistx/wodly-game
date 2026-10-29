/* WODLY Halloween weekend decorations.
   Turns itself on Oct 29 – Nov 1 (US Central time) and off again afterwards — no redeploy needed.
   Force for testing: add ?halloween=1 to any URL (or ?halloween=0 to hide). Purely visual: the overlay
   never takes clicks, and bats stay still for people who prefer reduced motion. */
(function () {
  var force = null;
  try { var q = new URLSearchParams(location.search).get('halloween'); if (q === '1') force = true; if (q === '0') force = false; } catch (e) {}
  function inWindow() {
    try {
      var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
      var m = 0, d = 0; p.forEach(function (x) { if (x.type === 'month') m = +x.value; if (x.type === 'day') d = +x.value; });
      return (m === 10 && d >= 29) || (m === 11 && d <= 1);
    } catch (e) { var n = new Date(); return (n.getMonth() === 9 && n.getDate() >= 29) || (n.getMonth() === 10 && n.getDate() <= 1); }
  }
  var on = force !== null ? force : inWindow();
  window.WODLY_HW = { on: on, board: 'halloween', preset: 'monstermash' };
  if (!on) return;

  var css = ''
    + '.hw-fx{position:fixed;inset:0;pointer-events:none;z-index:9000;overflow:hidden;}'
    + '.hw-web{position:absolute;top:0;width:clamp(70px,12vw,160px);height:auto;opacity:.42;}'
    + '.hw-web.l{left:0;}.hw-web.r{right:0;transform:scaleX(-1);}'
    + '.hw-spider{position:absolute;top:0;left:clamp(40px,7vw,95px);width:2px;transform-origin:top;animation:hwDrop 7s ease-in-out infinite;}'
    + '.hw-spider:before{content:"";position:absolute;left:0;top:0;width:1px;height:100%;background:rgba(230,230,240,.5);}'
    + '.hw-spider span{position:absolute;bottom:-10px;left:-9px;font-size:18px;line-height:1;}'
    + '@keyframes hwDrop{0%,100%{height:34px}50%{height:clamp(60px,12vh,120px)}}'
    + '.hw-bat{position:absolute;left:-80px;width:clamp(30px,4vw,54px);fill:#140c1c;filter:drop-shadow(0 0 6px rgba(160,80,255,.45));animation:hwFly 14s linear infinite;}'
    + '.hw-bat svg{width:100%;height:auto;animation:hwFlap .28s ease-in-out infinite alternate;transform-origin:center;}'
    + '@keyframes hwFlap{from{transform:scaleY(1)}to{transform:scaleY(.45)}}'
    + '@keyframes hwFly{0%{transform:translate(0,0)}25%{transform:translate(28vw,-4vh)}50%{transform:translate(55vw,3vh)}75%{transform:translate(82vw,-3vh)}100%{transform:translate(112vw,1vh)}}'
    + '.hw-fog{position:absolute;left:0;right:0;bottom:0;height:16vh;background:linear-gradient(to top,rgba(150,70,220,.16),rgba(245,120,20,.06) 45%,transparent);}'
    + '.hw-ribbon{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;padding:9px 16px;font:800 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.3px;color:#fff;text-align:center;'
    + 'background:linear-gradient(90deg,#3a1460,#f5a623 50%,#3a1460);background-size:200% 100%;animation:hwShine 6s linear infinite;position:absolute;top:0;left:0;right:0;z-index:9001;box-sizing:border-box;}'
    + '.hw-ribbon a{color:#1a0b26;background:#fff;border-radius:999px;padding:4px 11px;text-decoration:none;font-weight:900;white-space:nowrap;}'
    + '@keyframes hwShine{to{background-position:-200% 0}}'
    + '@media (prefers-reduced-motion:reduce){.hw-bat,.hw-bat svg,.hw-spider,.hw-ribbon{animation:none!important}.hw-bat{display:none}}';

  var WEB = '<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#e6e6f0" stroke-width="1.4">'
    + '<path d="M0 0L160 8M0 0L150 60M0 0L115 115M0 0L60 150M0 0L8 160"/>'
    + '<path d="M32 1Q26 12 30 12Q24 22 26 26Q20 29 21 32Q12 30 2 32"/>'
    + '<path d="M64 3Q52 24 59 24Q47 44 52 52Q38 56 42 64Q24 58 3 64"/>'
    + '<path d="M98 5Q82 36 89 37Q72 66 78 78Q58 84 63 96Q36 88 5 98"/>'
    + '<path d="M132 7Q112 50 120 49Q98 88 104 104Q78 112 84 128Q48 118 7 132"/></svg>';
  var BAT = '<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><path d="M50 14c-3-6-5-7-5-7l-1 6c-8-1-14 0-20-8C18 14 8 14 0 12c8 6 10 14 8 20 5-4 11-3 15 1 2-5 8-6 12-3 3-3 6-6 15 6 9-12 12-9 15-6 4-3 10-2 12 3 4-4 10-5 15-1-2-6 0-14 8-20-8 2-18 2-24-7-6 8-12 7-20 8l-1-6s-2 1-5 7z"/></svg>';

  function mount() {
    if (document.querySelector('.hw-fx')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var fx = document.createElement('div'); fx.className = 'hw-fx'; fx.setAttribute('aria-hidden', 'true');
    var h = '<div class="hw-fog"></div>'
      + '<div class="hw-web l">' + WEB + '</div><div class="hw-web r">' + WEB + '</div>'
      + '<div class="hw-spider"><span>🕷️</span></div>';
    [[12, 0], [24, 4.5], [8, 9]].forEach(function (b) {
      h += '<div class="hw-bat" style="top:' + b[0] + 'vh;animation-delay:' + b[1] + 's">' + BAT + '</div>';
    });
    fx.innerHTML = h;
    fx.querySelectorAll('.hw-web svg').forEach(function (s) { s.style.width = '100%'; s.style.height = 'auto'; });
    document.body.appendChild(fx);

    // Homepage ribbon pointing at the new board.
    var path = location.pathname.replace(/\/+$/, '');
    if (path === '' || path === '/index' || path === '/index.html') {
      var r = document.createElement('div'); r.className = 'hw-ribbon';
      r.innerHTML = '<span>🎃 New Halloween board + Monster Mash deck</span><a href="board?board=halloween&preset=monstermash">Play it</a>';
      document.body.insertBefore(r, document.body.firstChild);
      var pt = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
      document.body.style.paddingTop = (pt + r.offsetHeight + 6) + 'px';
    }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
