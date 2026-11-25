/* WODLY setup guide — a moving spotlight + bouncing arrow that points at the next thing to do.
 *
 * WODLY_GUIDE.start({ screens: { <screenId>: [step, ...] }, key: 'board' })
 *   step = { id, el: '#selector' | () => Element, text: 'html', done: () => bool, skipIf: () => bool }
 * The guide looks at the visible .screen.active, finds its first step that isn't done (and whose
 * element is visible), and glides the highlight ring + tip bubble onto it. Steps complete on their
 * own as the person fills things in, so the highlight "steers" them down the page.
 * "Hide tips" turns it off on this device (localStorage), and it never shows while an overlay
 * like the safety disclaimer is open.
 */
(function () {
  var OFF_KEY = 'wodly_guide_off_v1';
  function off() { try { return localStorage.getItem(OFF_KEY) === '1'; } catch (e) { return false; } }
  function setOff() { try { localStorage.setItem(OFF_KEY, '1'); } catch (e) {} }
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var css = ''
    + '.wg-ring{position:fixed;z-index:9000;pointer-events:none;border-radius:14px;border:3px solid #F5A623;'
    + 'box-shadow:0 0 0 4px rgba(245,166,35,.25),0 0 26px rgba(245,166,35,.55);opacity:0;'
    + 'transition:top .45s cubic-bezier(.2,.8,.2,1),left .45s cubic-bezier(.2,.8,.2,1),width .45s cubic-bezier(.2,.8,.2,1),height .45s cubic-bezier(.2,.8,.2,1),opacity .25s;}'
    + '.wg-ring.on{opacity:1;animation:wgPulse 1.6s ease-in-out infinite;}'
    + '@keyframes wgPulse{0%,100%{box-shadow:0 0 0 4px rgba(245,166,35,.25),0 0 22px rgba(245,166,35,.45);}50%{box-shadow:0 0 0 10px rgba(245,166,35,.10),0 0 38px rgba(245,166,35,.75);}}'
    + '.wg-tip{position:fixed;z-index:9001;max-width:300px;background:#F5A623;color:#111;border-radius:14px;padding:10px 12px 9px;'
    + 'font:600 14px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.55);opacity:0;transform:translateY(6px);'
    + 'transition:top .45s cubic-bezier(.2,.8,.2,1),left .45s cubic-bezier(.2,.8,.2,1),opacity .25s,transform .25s;}'
    + '.wg-tip.on{opacity:1;transform:none;}'
    + '.wg-tip:hover,.wg-tip:active{animation-play-state:paused!important;}'
    + '.wg-tip b{font-weight:900;}'
    + '.wg-tip .wg-step{display:block;font-size:10.5px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;opacity:.65;margin-bottom:2px;}'
    + '.wg-tip{pointer-events:none;}.wg-tip .wg-x{pointer-events:auto;}'
    + '.wg-tip .wg-x{display:inline-block;margin-top:6px;font-size:11.5px;font-weight:800;color:#111;opacity:.6;background:none;border:none;padding:0;cursor:pointer;text-decoration:underline;}'
    + '.wg-tip .wg-x:hover{opacity:1;}'
    + '.wg-arrow{position:absolute;left:var(--ax,50%);width:0;height:0;margin-left:-9px;border:9px solid transparent;}'
    + '.wg-tip.below .wg-arrow{top:-17px;border-bottom-color:#F5A623;}'
    + '.wg-tip.above .wg-arrow{bottom:-17px;border-top-color:#F5A623;}'
    + '.wg-tip.on.below{animation:wgBobUp 1.1s ease-in-out infinite;}'
    + '.wg-tip.on.above{animation:wgBobDown 1.1s ease-in-out infinite;}'
    + '@keyframes wgBobUp{0%,100%{transform:translateY(0);}50%{transform:translateY(5px);}}'
    + '@keyframes wgBobDown{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}'
    + '.wg-done{position:fixed;z-index:9002;pointer-events:none;font:900 22px system-ui,sans-serif;color:#4CAF50;text-shadow:0 2px 10px rgba(0,0,0,.6);'
    + 'animation:wgPop .7s ease-out forwards;}'
    + '@keyframes wgPop{0%{opacity:0;transform:scale(.4);}30%{opacity:1;transform:scale(1.15);}100%{opacity:0;transform:translateY(-18px) scale(1);}}'
    + '@media (prefers-reduced-motion: reduce){.wg-ring,.wg-tip{transition:opacity .2s;}.wg-ring.on,.wg-tip.on.below,.wg-tip.on.above{animation:none;}.wg-done{animation:none;opacity:0;}}';

  function $(sel) { return typeof sel === 'function' ? sel() : document.querySelector(sel); }
  function visible(el) { if (!el) return false; var r = el.getBoundingClientRect(); if (!r.width && !r.height) return false; var s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none'; }

  var cfg = null, ring, tip, cur = null, curEl = null, lastKey = null, raf = 0, scrolledFor = null;

  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    ring = document.createElement('div'); ring.className = 'wg-ring'; document.body.appendChild(ring);
    tip = document.createElement('div'); tip.className = 'wg-tip'; tip.setAttribute('role', 'status'); tip.setAttribute('aria-live', 'polite'); document.body.appendChild(tip);
    tip.addEventListener('click', function (e) { if (e.target.closest('.wg-x')) { setOff(); hide(); cancelAnimationFrame(raf); raf = 0; } });
  }
  function hide() { if (ring) ring.classList.remove('on'); if (tip) tip.classList.remove('on'); cur = null; curEl = null; lastKey = null; }

  function blocked() { // an overlay (disclaimer, modal) is open — don't point at things behind it
    var list = cfg.blockers || [];
    for (var i = 0; i < list.length; i++) { var b = $(list[i]); if (b && visible(b)) return true; }
    return false;
  }
  function pick() {
    var scr = document.querySelector('.screen.active'); if (!scr) return null;
    var steps = cfg.screens[scr.id]; if (!steps) return null;
    var live = steps.filter(function (s) { return !(s.skipIf && s.skipIf()); });
    for (var i = 0; i < live.length; i++) {
      var s = live[i]; if (s.done && s.done()) continue;
      var el = $(s.el); if (!visible(el)) continue;
      return { step: s, el: el, n: live.indexOf(s) + 1, of: live.length, screen: scr.id };
    }
    return null;
  }
  function popCheck(el) { // little ✓ where the finished step was
    if (reduce || !el) return; var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    var d = document.createElement('div'); d.className = 'wg-done'; d.textContent = '✓';
    d.style.left = (r.right - 26) + 'px'; d.style.top = (r.top + r.height / 2 - 14) + 'px'; document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 800);
  }
  function place() {
    var r = curEl.getBoundingClientRect(), pad = 6;
    ring.style.top = (r.top - pad) + 'px'; ring.style.left = (r.left - pad) + 'px';
    ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
    var tw = tip.offsetWidth || 260, th = tip.offsetHeight || 60, gap = 16;
    var left = Math.max(10, Math.min(innerWidth - tw - 10, r.left + r.width / 2 - tw / 2));
    // Prefer sitting ABOVE the target: setup flows downward, so above covers what's done, not the next field.
    var fitsAbove = r.top - pad - gap - th >= 8, fitsBelow = r.bottom + pad + gap + th <= innerHeight - 8;
    var below = !fitsAbove && fitsBelow;
    var top = below ? (r.bottom + pad + gap) : (r.top - pad - gap - th);
    top = Math.max(8, Math.min(innerHeight - th - 8, top));   // tall targets (avatar grid): keep the tip on screen
    tip.classList.toggle('below', below); tip.classList.toggle('above', !below);
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
    var ax = Math.max(18, Math.min(tw - 18, r.left + r.width / 2 - left)); tip.style.setProperty('--ax', ax + 'px');
  }
  function tick() {
    raf = requestAnimationFrame(tick);
    if (off() || blocked()) { if (cur) hide(); return; }
    var p = pick();
    if (!p) { if (cur) { popCheck(curEl); hide(); } return; }
    var key = p.screen + ':' + p.step.id;
    if (key !== lastKey) {
      if (cur && lastKey && lastKey.split(':')[0] === p.screen) popCheck(curEl);
      cur = p.step; curEl = p.el; lastKey = key;
      tip.innerHTML = '<span class="wg-step">Step ' + p.n + ' of ' + p.of + '</span>' + p.step.text
        + '<br><button type="button" class="wg-x">Hide tips</button><span class="wg-arrow"></span>';
      // glide to the new target: bring it into view first, then the ring/tip transitions carry the eye
      var r = p.el.getBoundingClientRect();
      if (scrolledFor !== key && (r.top < 70 || r.bottom > innerHeight - 140)) {
        scrolledFor = key; try { p.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); } catch (e) {}
      }
      ring.classList.add('on'); tip.classList.add('on');
    }
    curEl = p.el; place();
  }
  function start(c) {
    cfg = c || {}; if (!cfg.screens) return;
    var go = function () { if (!ring) build(); if (!raf) raf = requestAnimationFrame(tick); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
  // Re-enable tips (e.g. from a "Show setup tips" link)
  function reset() { try { localStorage.removeItem(OFF_KEY); } catch (e) {} if (cfg && !raf) raf = requestAnimationFrame(tick); }
  window.WODLY_GUIDE = { start: start, reset: reset, hide: hide };
})();
