/* WODLY shared board renderer — draws a static board from game state on any canvas.
   Used by play.html (phone mini-board / spectator) and matches board.html's layout
   exactly (same seed -> same winding path). */
(function (global) {
  const BRAND = { red:'#E8363D', orange:'#F5A623', green:'#4CAF50', blue:'#2196F3' };
  const SYM = { hearts:'♥', diamonds:'♦', clubs:'♣', spades:'♠' };
  const SCOL = { hearts:'#E8363D', diamonds:'#F5A623', clubs:'#4CAF50', spades:'#2196F3' };
  const ZONES = [
    { name:'THE FLOOR',      accent:'#C8922A', from:0,    to:0.22 },
    { name:'THE RIG',        accent:'#2196F3', from:0.22, to:0.44 },
    { name:'THE PLATFORM',   accent:'#F5A623', from:0.44, to:0.66 },
    { name:'WEIGHT STORAGE', accent:'#E8363D', from:0.66, to:0.85 },
    { name:'THE WALL',       accent:'#4CAF50', from:0.85, to:1.0  }
  ];
  function getZone(i, total){ const f=i/(total-1); for(const z of ZONES){ if(f>=z.from&&f<=z.to) return z; } return ZONES[ZONES.length-1]; }
  function srng(seed){ let s=(seed||1)>>>0; return function(){ s=(s+0x6D2B79F5)>>>0; let t=Math.imul(s^(s>>>15),1|s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  // Square spiral: GO at the outer corner, winding clockwise inward to WIN near the centre.
  function genPath(total, W2, H){
    const G=Math.max(3,Math.ceil(Math.sqrt(total)));
    const inset=W2*0.105, area=Math.min(W2,H)-inset*2, cell=area/G;
    const ns=Math.max(20,Math.min(cell*0.82,80));
    let t=0,b=G-1,l=0,r=G-1; const order=[];
    while(t<=b&&l<=r){
      for(let c=l;c<=r;c++)order.push([t,c]); t++;
      for(let row=t;row<=b;row++)order.push([row,r]); r--;
      if(t<=b){for(let c=r;c>=l;c--)order.push([b,c]); b--;}
      if(l<=r){for(let row=b;row>=t;row--)order.push([row,l]); l++;}
    }
    const offX=inset+(W2-inset*2-area)/2, offY=inset+(H-inset*2-area)/2, p=[];
    for(let i=0;i<total;i++){ const cc=order[i]||order[order.length-1]; p.push({x:offX+cell*cc[1]+cell/2, y:offY+cell*cc[0]+cell/2}); }
    return { p, ns };
  }
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }

  function render(canvas, state, opts){
    opts = opts || {};
    const ctx = canvas.getContext('2d'), W2 = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W2,H);
    if(!state || !state.total) return;
    const total = state.total, landed = state.landed || {}, players = state.players || [];
    const { p:P, ns } = genPath(total, W2, H);
    const img = opts.boardImg;
    if(img && img.complete && img.naturalWidth){ ctx.drawImage(img,0,0,W2,H); }
    else { const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#141414'); bg.addColorStop(1,'#070707'); ctx.fillStyle=bg; ctx.fillRect(0,0,W2,H); }
    // nodes (no connecting trail — spiral layout)
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    for(let i=0;i<total;i++){
      const px=P[i].x, py=P[i].y, zone=getZone(i,total), lc=landed[i], s=ns, hx=px-s/2, hy=py-s/2;
      if(i===0){ ctx.fillStyle='#0d1f12'; rr(ctx,hx,hy,s,s,10); ctx.fill(); ctx.strokeStyle=BRAND.green; ctx.lineWidth=3; rr(ctx,hx,hy,s,s,10); ctx.stroke(); ctx.fillStyle=BRAND.green; ctx.font='bold '+Math.round(s*0.3)+'px system-ui'; ctx.fillText('GO',px,py+s*0.1); }
      else if(i===total-1){ ctx.fillStyle='#241a00'; rr(ctx,hx,hy,s,s,10); ctx.fill(); ctx.strokeStyle=BRAND.orange; ctx.lineWidth=3; rr(ctx,hx,hy,s,s,10); ctx.stroke(); ctx.fillStyle=BRAND.orange; ctx.font='bold '+Math.round(s*0.4)+'px system-ui'; ctx.fillText('★',px,py-s*0.02); ctx.font='bold '+Math.round(s*0.2)+'px system-ui'; ctx.fillText('WIN',px,py+s*0.32); }
      else if(lc){ const k=lc.kind; let bd,tc;
        if(k==='ace'){bd='#9b59b6';tc='#9b59b6';} else if(k==='skip'){bd=BRAND.green;tc=BRAND.green;} else if(k==='back'){bd=BRAND.red;tc=BRAND.red;} else {bd=SCOL[lc.suit]||'#F5A623';tc=bd;}
        ctx.fillStyle='#111013'; rr(ctx,hx,hy,s,s,9); ctx.fill(); ctx.strokeStyle=bd; ctx.lineWidth=2; rr(ctx,hx,hy,s,s,9); ctx.stroke(); ctx.fillStyle=tc;
        const sym=SYM[lc.suit]||'';
        if(k==='ace'){ ctx.font='bold '+Math.round(s*0.34)+'px sans-serif'; ctx.fillText('A',px,py-s*0.04); ctx.font=Math.round(s*0.22)+'px sans-serif'; ctx.fillText(sym,px,py+s*0.28); }
        else if(k==='skip'){ ctx.font='bold '+Math.round(s*0.3)+'px sans-serif'; ctx.fillText('↑+2',px,py-s*0.02); ctx.font=Math.round(s*0.2)+'px sans-serif'; ctx.fillText(sym,px,py+s*0.3); }
        else if(k==='back'){ ctx.font='bold '+Math.round(s*0.3)+'px sans-serif'; ctx.fillText('↓'+lc.val,px,py-s*0.02); ctx.font=Math.round(s*0.2)+'px sans-serif'; ctx.fillText(sym,px,py+s*0.3); }
        else { ctx.font=Math.round(s*0.3)+'px sans-serif'; ctx.fillText(sym,px,py-s*0.04); ctx.fillStyle='#fff'; ctx.font='bold '+Math.round(s*0.3)+'px sans-serif'; ctx.fillText(lc.label||'',px,py+s*0.28); }
      }
      else { const sg=ctx.createLinearGradient(hx,hy,hx,hy+s); sg.addColorStop(0,zone.accent+'33'); sg.addColorStop(1,'#0c0c0d'); ctx.fillStyle=sg; rr(ctx,hx,hy,s,s,9); ctx.fill(); ctx.strokeStyle=zone.accent+'66'; ctx.lineWidth=1.5; rr(ctx,hx,hy,s,s,9); ctx.stroke(); ctx.fillStyle=zone.accent+'88'; ctx.font='900 '+Math.round(s*0.34)+'px system-ui'; ctx.fillText('W',px,py+s*0.12); }
    }
    // tokens
    const offs=[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,-.65],[0,.65]];
    players.forEach((pl,pi)=>{ const node=P[Math.max(0,Math.min(pl.pos||0,total-1))]; if(!node) return;
      const o=offs[pi%6], cx=node.x+o[0]*ns*0.5, cy=node.y+o[1]*ns*0.5, rad=ns*0.32;
      ctx.save(); ctx.shadowColor=pl.color||'#fff'; ctx.shadowBlur=12; ctx.fillStyle=pl.color||'#fff'; ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.fill(); ctx.restore();
      ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.stroke();
      const tim = opts.tokenImgs && opts.tokenImgs[pl.avatar];
      if(tim && tim.complete && tim.naturalWidth){ const sz=ns*1.15; ctx.drawImage(tim,cx-sz/2,cy-sz*0.82,sz,sz); }
      else { ctx.fillStyle='#fff'; ctx.font='bold '+Math.round(ns*0.34)+'px sans-serif'; ctx.textBaseline='middle'; ctx.fillText((pl.name||'?')[0].toUpperCase(),cx,cy); ctx.textBaseline='alphabetic'; }
    });
  }
  global.WODLYBoard = { render };
})(typeof window !== 'undefined' ? window : globalThis);
