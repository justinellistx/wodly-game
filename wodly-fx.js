/* WODLY FX — full-screen celebration moments shared across games.
   WODLYFX.bingo({ name, color, title, sub }) plays the BINGO win sequence:
   light rays spin up, five lettered balls (B-I-N-G-O) drop in and bounce, the screen shakes,
   confetti bursts from the centre, then the winner's name lands. Tap anywhere to skip. */
(function (global) {
  var COLS = ['#E8363D', '#F5A623', '#4CAF50', '#2196F3', '#F5A623'];
  var CSS = '' +
    '.wfx{position:fixed;inset:0;z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;' +
    'background:radial-gradient(circle at 50% 45%,rgba(40,28,4,.96),rgba(5,5,6,.98) 70%);animation:wfxIn .25s ease forwards;}' +
    '.wfx.out{animation:wfxOut .45s ease forwards;}' +
    '.wfx-rays{position:absolute;left:50%;top:45%;width:220vmax;height:220vmax;margin:-110vmax 0 0 -110vmax;opacity:0;' +
    'background:repeating-conic-gradient(from 0deg,rgba(245,166,35,.16) 0deg 9deg,transparent 9deg 22.5deg);animation:wfxRays 1s .1s ease forwards,wfxSpin 14s linear infinite;}' +
    '.wfx-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;}' +
    '.wfx-flash.go{animation:wfxFlash .5s ease;}' +
    '.wfx-row{position:relative;display:flex;gap:min(2.4vw,16px);}' +
    '.wfx-ball{width:min(15vw,128px);height:min(15vw,128px);border-radius:50%;display:flex;align-items:center;justify-content:center;' +
    'font:900 min(9vw,76px)/1 system-ui,sans-serif;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.35);transform:translateY(-120vh) rotate(-260deg);' +
    'box-shadow:inset -8px -10px 0 rgba(0,0,0,.22),inset 6px 8px 0 rgba(255,255,255,.28),0 14px 30px rgba(0,0,0,.55);}' +
    '.wfx-ball span{display:flex;align-items:center;justify-content:center;width:62%;height:62%;border-radius:50%;background:#fff;color:#111;font-size:.82em;text-shadow:none;}' +
    '.wfx-ball.drop{animation:wfxDrop .7s cubic-bezier(.25,.9,.35,1.3) forwards;}' +
    '.wfx-ball.pulse{animation:wfxPulse .55s ease;transform:none;}' +
    '.wfx-name{position:relative;margin-top:min(5vw,34px);font:900 min(8vw,54px)/1.05 system-ui,sans-serif;letter-spacing:2px;text-align:center;padding:0 16px;opacity:0;transform:scale(2.4);text-shadow:0 3px 0 #000,0 0 26px currentColor;}' +
    '.wfx-name.in{animation:wfxSlam .45s cubic-bezier(.2,.9,.3,1.25) forwards;}' +
    '.wfx-sub{position:relative;margin-top:12px;font:800 min(4vw,18px)/1.3 system-ui,sans-serif;color:#fff;letter-spacing:3px;text-transform:uppercase;opacity:0;}' +
    '.wfx-sub.in{animation:wfxIn .4s ease forwards;}' +
    '.wfx-tap{position:absolute;bottom:22px;left:0;right:0;text-align:center;font:700 12px system-ui,sans-serif;color:rgba(255,255,255,.45);letter-spacing:2px;text-transform:uppercase;}' +
    '.wfx-shake{animation:wfxShake .5s ease;}' +
    '@keyframes wfxIn{from{opacity:0}to{opacity:1}}' +
    '@keyframes wfxOut{to{opacity:0;transform:scale(1.08)}}' +
    '@keyframes wfxRays{to{opacity:1}}' +
    '@keyframes wfxSpin{to{transform:rotate(360deg)}}' +
    '@keyframes wfxFlash{0%{opacity:.75}100%{opacity:0}}' +
    '@keyframes wfxDrop{0%{transform:translateY(-120vh) rotate(-260deg)}70%{transform:translateY(5%) rotate(8deg)}85%{transform:translateY(-6%) rotate(-3deg)}100%{transform:translateY(0) rotate(0)}}' +
    '@keyframes wfxPulse{0%{transform:scale(1)}40%{transform:scale(1.22) translateY(-10%)}100%{transform:scale(1)}}' +
    '@keyframes wfxSlam{0%{opacity:0;transform:scale(2.4)}70%{opacity:1;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}' +
    '@keyframes wfxShake{0%,100%{transform:translate(0,0)}15%{transform:translate(-9px,5px)}30%{transform:translate(8px,-6px)}45%{transform:translate(-6px,-3px)}60%{transform:translate(5px,6px)}80%{transform:translate(-3px,2px)}}' +
    '@media (prefers-reduced-motion: reduce){.wfx-rays{animation:wfxRays .3s ease forwards}.wfx-ball.drop{animation:wfxIn .3s ease forwards;transform:none}.wfx-shake{animation:none}}';

  function addCss() { if (document.getElementById('wfx-css')) return; var s = document.createElement('style'); s.id = 'wfx-css'; s.textContent = CSS; document.head.appendChild(s); }

  var ac = null;
  function tone(freq, dur, type, vol, delay) {
    try {
      ac = ac || new (global.AudioContext || global.webkitAudioContext)();
      var t0 = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.03);
    } catch (e) {}
  }

  function confetti(host, cx, cy) {
    try {
      var cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
      cv.width = global.innerWidth; cv.height = global.innerHeight; host.appendChild(cv);
      var x = cv.getContext('2d'), P = [], cols = ['#F5A623', '#E8363D', '#4CAF50', '#2196F3', '#ffffff'];
      for (var i = 0; i < 190; i++) { var a = Math.random() * Math.PI * 2, sp = 6 + Math.random() * 13;
        P.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 5, s: 6 + Math.random() * 9, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 }); }
      var start = performance.now(), last = start;
      (function frame(now) { var dt = Math.min(34, now - last) / 16; last = now; x.clearRect(0, 0, cv.width, cv.height);
        P.forEach(function (p) { p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.32 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr;
          x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore(); });
        if (now - start < 4200 && cv.isConnected) requestAnimationFrame(frame); else cv.remove(); })(start);
    } catch (e) {}
  }

  function bingo(opts) {
    opts = opts || {}; addCss();
    var old = document.querySelector('.wfx'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'wfx'; el.setAttribute('role', 'status');
    el.innerHTML = '<div class="wfx-rays"></div><div class="wfx-flash"></div><div class="wfx-row"></div>' +
      '<div class="wfx-name"></div><div class="wfx-sub"></div><div class="wfx-tap">tap to continue</div>';
    var row = el.querySelector('.wfx-row');
    'BINGO'.split('').forEach(function (ch, i) {
      var b = document.createElement('div'); b.className = 'wfx-ball';
      b.style.background = 'radial-gradient(circle at 35% 30%,' + COLS[i] + 'ee,' + COLS[i] + ' 55%,#000 160%)';
      b.innerHTML = '<span>' + ch + '</span>'; row.appendChild(b);
    });
    var nm = el.querySelector('.wfx-name'); nm.textContent = opts.title || ((opts.name ? opts.name + ' ' : '') + 'WINS!'); nm.style.color = opts.color || '#F5A623';
    var sb = el.querySelector('.wfx-sub'); sb.textContent = opts.sub || '';
    document.body.appendChild(el);
    var timers = [], done = false;
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    var balls = row.children, notes = [523, 587, 659, 784, 1047];
    for (var i = 0; i < balls.length; i++) (function (i) { later(function () { balls[i].classList.add('drop'); tone(notes[i], 0.16, 'square', 0.1, 0.32); }, 180 + i * 150); })(i);
    later(function () {
      el.classList.add('wfx-shake'); el.querySelector('.wfx-flash').classList.add('go');
      var r = row.getBoundingClientRect(); confetti(el, r.left + r.width / 2, r.top + r.height / 2);
      [523, 659, 784, 1047].forEach(function (f, k) { tone(f, 0.28, 'sawtooth', 0.12, k * 0.1); });
      try { if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 220]); } catch (e) {}
    }, 180 + 5 * 150 + 420);
    later(function () { for (var i = 0; i < balls.length; i++) (function (i) { later(function () { balls[i].classList.remove('drop'); balls[i].classList.add('pulse'); }, i * 80); })(i); }, 1750);
    later(function () { nm.classList.add('in'); }, 1600);
    later(function () { if (sb.textContent) sb.classList.add('in'); }, 2000);
    function close() { if (done) return; done = true; timers.forEach(clearTimeout); el.classList.add('out'); setTimeout(function () { el.remove(); if (opts.onDone) opts.onDone(); }, 450); }
    later(close, opts.hold || 4300);
    el.addEventListener('click', close);
    return { close: close };
  }

  global.WODLYFX = { bingo: bingo };
})(typeof window !== 'undefined' ? window : globalThis);
