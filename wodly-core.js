/* WODLY core — shared constants, game logic, and Supabase helpers.
   Used by board.html (the gym screen / host) and play.html (phone controller). */
(function (global) {
  // ── Supabase ──────────────────────────────────────────────────────────────
  const SUPA_URL = 'https://ynznwosssctxbdiauekj.supabase.co';
  const SUPA_KEY = 'sb_publishable_SjuVDLR6qX9JGjaQ3uK3fQ_hmy_t6Nq';
  // requires @supabase/supabase-js v2 loaded globally as `supabase`
  function makeClient() {
    return global.supabase.createClient(SUPA_URL, SUPA_KEY, {
      realtime: { params: { eventsPerSecond: 20 } }
    });
  }

  // ── Brand + constants ─────────────────────────────────────────────────────
  const BRAND = { hearts:'#E8363D', diamonds:'#F5A623', clubs:'#4CAF50', spades:'#2196F3',
                  ace:'#9b59b6', orange:'#F5A623', green:'#4CAF50', red:'#E8363D', blue:'#2196F3' };
  const SUITS = ['hearts','diamonds','clubs','spades'];
  const SYM = { hearts:'♥', diamonds:'♦', clubs:'♣', spades:'♠' };
  const SCOL = { hearts:BRAND.hearts, diamonds:BRAND.diamonds, clubs:BRAND.clubs, spades:BRAND.spades };
  const FACE_LABELS = { 11:'J', 12:'Q', 13:'K' };
  const DECK_SPACES = { quick:52, standard:104, large:130 };
  const DIFF_MULT = { easy:0.6, medium:1.0, hard:1.4 };
  const PCOLS = ['#F5A623','#E8363D','#4CAF50','#2196F3','#9b59b6','#00BCD4'];

  // Player-selection characters (image art lives in /assets/characters)
  const AVATARS = [
    { id:'ninja',   name:'Ninja',   img:'assets/characters/ninja.png',   color:'#2196F3' },
    { id:'lifter',  name:'Lifter',  img:'assets/characters/lifter.png',  color:'#4CAF50' },
    { id:'runner',  name:'Runner',  img:'assets/characters/runner.png',  color:'#E8363D' },
    { id:'gymnast', name:'Gymnast', img:'assets/characters/gymnast.png', color:'#2196F3' },
    { id:'dragon',  name:'Dragon',  img:'assets/characters/dragon.png',  color:'#F5A623' },
    { id:'champ',   name:'Champ',   img:'assets/characters/champ.png',   color:'#F5A623' },
    { id:'coach',   name:'Coach',   img:'assets/characters/coach.png',   color:'#F5A623' }
  ];

  // ── Card logic ────────────────────────────────────────────────────────────
  function cardType(v){ if(v===1)return'ace'; if(v===2)return'skip'; if(v===3||v===4)return'back'; return'workout'; }
  function getReps(v,d){ if(v>=11)return v; return Math.max(1, Math.round(v * (DIFF_MULT[d]||1))); }
  function buildDeck(){
    const d=[];
    SUITS.forEach(s=>{ d.push({suit:s,val:1,label:'A'});
      for(let v=2;v<=13;v++) d.push({suit:s,val:v,label:v<=10?String(v):(FACE_LABELS[v]||String(v))}); });
    for(let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
    return d;
  }

  // ── Misc helpers ──────────────────────────────────────────────────────────
  // 4-char join code, avoiding ambiguous chars (no O/0/I/1)
  function genCode(){ const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=a[Math.floor(Math.random()*a.length)]; return s; }
  function clientId(){
    try { let id=localStorage.getItem('wodly_client_id');
      if(!id){ id='c_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wodly_client_id',id); }
      return id;
    } catch(e){ return 'c_'+Math.random().toString(36).slice(2); }
  }

  global.WODLY = {
    SUPA_URL, SUPA_KEY, makeClient,
    BRAND, SUITS, SYM, SCOL, FACE_LABELS, DECK_SPACES, DIFF_MULT, PCOLS, AVATARS,
    cardType, getReps, buildDeck, genCode, clientId
  };
})(typeof window !== 'undefined' ? window : globalThis);
