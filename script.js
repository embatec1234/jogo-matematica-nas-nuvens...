/* =========================================================
   MATEMÁTICA NAS NUVENS — jogo educativo (single file)
========================================================= */

/* ---------- CONFIG ---------- */
const QUESTIONS_PER_PHASE = 8;
const BONUS_QUESTIONS = 10;
const START_LIVES = 3;
const AVATARS = ['🐻','🐰','🦊','🐼','🦁','🐸','🐵','🦄'];
const PHASE_INFO = {
  1:{name:'Fundamentos', icon:'🔢', desc:'Números, contagem e as primeiras somas e subtrações.'},
  2:{name:'Operações', icon:'➗', desc:'Soma, subtração, multiplicação e divisão.'},
  3:{name:'Desafios', icon:'🧩', desc:'Sequências, comparações e probleminhas.'},
  4:{name:'Desafio Final', icon:'🏆', desc:'Um pouquinho de tudo, com mais dificuldade.'}
};
const CORRECT_MSGS = ['🎉 Muito bem!','⭐ Excelente!','👏 Isso aí!','🌟 Mandou bem!','✨ Show de bola!'];
const WRONG_MSGS = ['💭 Quase! Tente de novo.','🤔 Não foi dessa vez, você consegue!','💙 Continue tentando!','🌤️ Foi por pouco!'];

/* ---------- DEFAULT SAVE ---------- */
function defaultSave(){
  return {
    profile:{name:'', avatar:AVATARS[0]},
    difficulty:'facil',
    tutorialSeen:false,
    progress:{
      phases:{
        1:{status:'unlocked', bestScore:0, attempts:0},
        2:{status:'locked', bestScore:0, attempts:0},
        3:{status:'locked', bestScore:0, attempts:0},
        4:{status:'locked', bestScore:0, attempts:0}
      },
      bonus:{status:'locked', result:null}
    },
    totalScore:0,
    bestScore:0,
    settings:{musicOn:true, sfxOn:true, musicVol:0.5, sfxVol:0.7, fullscreen:false},
    currentPhaseInProgress:null /* {phase, index, lives, score, correct, wrong, answers} for resuming */
  };
}

let SAVE = defaultSave();
let hasSavedGame = false;
let storageWorks = true;

async function loadSave(){
  try{
    const res = await window.storage.get('save', false);
    if(res && res.value){
      const parsed = JSON.parse(res.value);
      SAVE = Object.assign(defaultSave(), parsed);
      SAVE.progress = Object.assign(defaultSave().progress, parsed.progress||{});
      SAVE.settings = Object.assign(defaultSave().settings, parsed.settings||{});
      hasSavedGame = !!(SAVE.profile && SAVE.profile.name);
    }
  }catch(e){
    hasSavedGame = false;
  }
}
let saveTimer=null;
function persist(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async ()=>{
    try{
      await window.storage.set('save', JSON.stringify(SAVE), false);
    }catch(e){ storageWorks=false; }
  }, 150);
}

/* ---------- UTIL ---------- */
function $(sel){return document.querySelector(sel);}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function pick(arr){return arr[rand(0,arr.length-1)];}
function shuffle(arr){const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=rand(0,i); [a[i],a[j]]=[a[j],a[i]];} return a;}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}

/* simple audio via WebAudio, no external assets */
let audioCtx=null;
function ac(){ if(!audioCtx){ try{audioCtx = new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } return audioCtx; }
function beep(freq, dur, type, vol){
  if(!SAVE.settings.sfxOn) return;
  const ctx = ac(); if(!ctx) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type||'sine'; o.frequency.value = freq;
  g.gain.value = (vol!=null?vol:1) * SAVE.settings.sfxVol * 0.25;
  o.connect(g); g.connect(ctx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
  o.stop(ctx.currentTime+dur);
}
function sfxCorrect(){ beep(523.25,0.12,'sine',1); setTimeout(()=>beep(783.99,0.18,'sine',1),100); }
function sfxWrong(){ beep(180,0.25,'sawtooth',0.7); }
function sfxClick(){ beep(440,0.05,'square',0.4); }
function sfxWin(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.2,'sine',1), i*110)); }

let musicNodes=null;
function startMusic(){
  if(!SAVE.settings.musicOn) return;
  const ctx = ac(); if(!ctx) return;
  stopMusic();
  const notes=[392,440,494,392,349,392,440,392];
  let i=0;
  const g = ctx.createGain(); g.gain.value = SAVE.settings.musicVol*0.06; g.connect(ctx.destination);
  const id = setInterval(()=>{
    if(!SAVE.settings.musicOn) return;
    const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=notes[i%notes.length];
    const og = ctx.createGain(); og.gain.value=1;
    o.connect(og); og.connect(g);
    o.start(); og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.9);
    o.stop(ctx.currentTime+0.9);
    i++;
  }, 950);
  musicNodes = {id, g};
}
function stopMusic(){ if(musicNodes){ clearInterval(musicNodes.id); try{musicNodes.g.disconnect();}catch(e){} musicNodes=null; } }

/* ---------- QUESTION GENERATION ---------- */
function numRange(diff){
  if(diff==='facil') return {p1:10, p2mul:5, p2div:20, p3:20, p4:20};
  if(diff==='dificil') return {p1:50, p2mul:12, p2div:100, p3:100, p4:100};
  return {p1:20, p2mul:10, p2div:50, p3:50, p4:50}; // medio
}

function mkMultipla(text, answer, distractors, visual){
  const opts = shuffle([answer, ...distractors].map(String));
  return {type:'multipla', text, answer:String(answer), options:opts, visual};
}
function mkNumerica(text, answer, visual){
  return {type:'numerica', text, answer:String(answer), visual};
}
function distractorsNear(answer, count, spread){
  const set = new Set();
  let guard=0;
  while(set.size<count && guard<50){
    guard++;
    const d = answer + rand(-spread,spread);
    if(d!==answer && d>=0) set.add(d);
  }
  while(set.size<count) set.add(answer + set.size + 1);
  return [...set].slice(0,count);
}

function genPhase1(diff){
  const r = numRange(diff);
  const kind = pick(['contagem','soma','subtracao','numero']);
  if(kind==='contagem'){
    const n = rand(3, Math.min(10, r.p1));
    const emoji = pick(['☁️','⭐','🍎','🎈','🐦']);
    return mkMultipla('Quantos '+emoji+' você vê?', n, distractorsNear(n,3,3), emoji.repeat(n));
  }
  if(kind==='numero'){
    const a = rand(1,r.p1); const dir = pick(['antes','depois']);
    const ans = dir==='antes'? a-1 : a+1;
    return mkNumerica('Qual número vem '+dir+' do '+a+'?', ans);
  }
  if(kind==='soma'){
    const a = rand(1,r.p1), b = rand(1,r.p1);
    return mkMultipla(a+' + '+b+' = ?', a+b, distractorsNear(a+b,3,4));
  }
  // subtracao
  let a = rand(1,r.p1), b = rand(0,a);
  return mkNumerica(a+' − '+b+' = ?', a-b);
}

function genPhase2(diff){
  const r = numRange(diff);
  const kind = pick(['soma','subtracao','mult','div']);
  if(kind==='soma'){ const a=rand(1,r.p2div), b=rand(1,r.p2div); return mkNumerica(a+' + '+b+' = ?', a+b); }
  if(kind==='subtracao'){ const a=rand(1,r.p2div), b=rand(0,a); return mkNumerica(a+' − '+b+' = ?', a-b); }
  if(kind==='mult'){ const a=rand(1,r.p2mul), b=rand(1,r.p2mul); return mkMultipla(a+' × '+b+' = ?', a*b, distractorsNear(a*b,3,Math.max(4,a))); }
  // div exact
  const b = rand(2, Math.max(2,Math.floor(r.p2mul))); const q = rand(1, Math.max(2,Math.floor(r.p2div/b)));
  const a = b*q;
  return mkMultipla(a+' ÷ '+b+' = ?', q, distractorsNear(q,3,3));
}

function genPhase3(diff){
  const r = numRange(diff);
  const kind = pick(['combinada','sequencia','comparacao','problema']);
  if(kind==='combinada'){
    const a=rand(2,Math.min(20,r.p3)), b=rand(1,Math.min(10,r.p3)), c=rand(1,Math.min(10,r.p3));
    const useMinus = Math.random()<0.5;
    const ans = useMinus ? a+b-c : a-b+c;
    return mkNumerica(useMinus? `${a} + ${b} − ${c} = ?` : `${a} − ${b} + ${c} = ?`, ans);
  }
  if(kind==='sequencia'){
    const step = rand(2, diff==='facil'?3:6);
    const start = rand(1, Math.min(20,r.p3));
    const seq = [start, start+step, start+2*step, start+3*step];
    return mkMultipla('Complete a sequência: '+seq.join(', ')+', ?', start+4*step, distractorsNear(start+4*step,3,step*2));
  }
  if(kind==='comparacao'){
    const a=rand(1,r.p3), b=rand(1,r.p3);
    const ans = a>b?'>': a<b? '<' : '=';
    return mkMultipla(`Qual sinal completa: ${a} ___ ${b} ?`, ans, ['>','<','='].filter(s=>s!==ans));
  }
  // problema simples
  const a=rand(2,Math.min(15,r.p3)), b=rand(1,Math.min(10,r.p3));
  const names = ['maçãs','balões','estrelinhas','figurinhas','biscoitos'];
  const n = pick(names);
  return mkNumerica(`Ana tinha ${a} ${n} e ganhou mais ${b}. Quantas ela tem agora?`, a+b);
}

function genPhase4(diff){
  return pick([genPhase1, genPhase2, genPhase3])(diff);
}
const PHASE_GEN = {1:genPhase1, 2:genPhase2, 3:genPhase3, 4:genPhase4};

function buildQuestionSet(phase, diff, count){
  const qs = [];
  for(let i=0;i<count;i++) qs.push(PHASE_GEN[phase](diff));
  return qs;
}
function buildBonusSet(diff, count){
  const qs = [];
  for(let i=0;i<count;i++) qs.push(pick([genPhase1,genPhase2,genPhase3,genPhase4])(diff));
  return qs;
}

/* ---------- BACKGROUND CLOUDS ---------- */
function paintClouds(){
  const layer = $('#cloud-layer'); if(!layer) return;
  layer.innerHTML='';
  for(let i=0;i<6;i++){
    const size = rand(60,160);
    const el = document.createElement('div');
    el.className='bgcloud';
    el.style.top = rand(0,90)+'%';
    el.style.left = (-20+rand(0,120))+'%';
    el.style.fontSize = size+'px';
    el.style.animation = `drift ${rand(40,80)}s linear infinite`;
    el.textContent='☁️';
    layer.appendChild(el);
  }
  const styleTag = document.createElement('style');
  styleTag.textContent = `@keyframes drift{from{transform:translateX(0);} to{transform:translateX(60px);}}`;
  layer.appendChild(styleTag);
}

/* ---------- MODAL / FEEDBACK helpers ---------- */
function showModal(html){
  $('#modal-root').innerHTML = `<div class="modal-overlay" id="modalOverlay">${html}</div>`;
}
function closeModal(){ $('#modal-root').innerHTML=''; }
function showFeedback(text, ok){
  const root = $('#feedback-root');
  root.innerHTML = `<div class="feedback-banner ${ok?'correct':'wrong'}" id="fbBanner">${text}</div>`;
  requestAnimationFrame(()=> $('#fbBanner') && $('#fbBanner').classList.add('show'));
  setTimeout(()=>{ const b=$('#fbBanner'); if(b) b.classList.remove('show'); }, 900);
}

/* ---------- APP STATE / ROUTER ---------- */
let session = null; // active phase session
let mp = null; // multiplayer session
let currentScreen = 'loading';

function goto(screen, data){ currentScreen = screen; render(screen, data); window.scrollTo(0,0); }

function render(screen, data){
  const app = $('#app');
  app.innerHTML = SCREENS[screen] ? SCREENS[screen](data) : '<p>Tela não encontrada.</p>';
}

/* ---------- SCREENS ---------- */
const SCREENS = {};

SCREENS.start = function(){
  const canContinue = hasSavedGame && SAVE.profile && SAVE.profile.name;
  return `
  <div class="screen">
    <div class="logo-wrap">
      <h1>☁️ Matemática nas Nuvens</h1>
      <div class="sub">Voe entre as nuvens aprendendo matemática!</div>
    </div>
    <div class="cloud-card stack">
      <button class="btn btn-primary" onclick="onNewGame()">🚀 Novo Jogo</button>
      <button class="btn btn-mint" ${canContinue?'':'disabled'} onclick="onContinue()">▶️ Continuar</button>
      <button class="btn btn-outline" onclick="goto('settings',{from:'start'})">⚙️ Configurações</button>
      <button class="btn btn-outline" onclick="onMultiplayerEntry()">👫 Multiplayer local</button>
    </div>
  </div>`;
};

function onNewGame(){
  sfxClick();
  if(hasSavedGame && SAVE.profile && SAVE.profile.name){
    showModal(`
      <div class="modal-card">
        <div class="center-emoji">☁️</div>
        <h3>Começar um novo jogo?</h3>
        <p>Tem certeza que deseja iniciar um novo jogo? Seu progresso atual será substituído.</p>
        <div class="stack">
          <button class="btn btn-coral" onclick="confirmNewGame()">Sim, começar de novo</button>
          <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        </div>
      </div>`);
  } else {
    goto('profile');
  }
}
function confirmNewGame(){
  closeModal();
  SAVE = defaultSave();
  persist();
  goto('profile');
}
function onContinue(){
  sfxClick();
  if(SAVE.currentPhaseInProgress){
    resumePhase();
  } else {
    goto('map');
  }
}

/* ---- PROFILE ---- */
let tempProfile = {name:'', avatar:AVATARS[0]};
SCREENS.profile = function(){
  tempProfile = {name: SAVE.profile.name||'', avatar: SAVE.profile.avatar||AVATARS[0]};
  return `
  <div class="screen">
    <h2 style="color:#fff; text-shadow:0 3px 0 rgba(35,50,86,.25);">Quem vai voar hoje? 🎈</h2>
    <div class="cloud-card stack">
      <label class="diff-title" for="nameInput">Como você se chama?</label>
      <input type="text" id="nameInput" maxlength="16" placeholder="Digite seu nome" value="${esc(tempProfile.name)}">
      <div class="diff-title" style="margin-top:8px;">Escolha seu avatar</div>
      <div class="avatars" id="avatarGrid">
        ${AVATARS.map(a=>`<button class="avatar-opt ${a===tempProfile.avatar?'selected':''}" data-av="${a}" onclick="pickAvatar('${a}')">${a}</button>`).join('')}
      </div>
      <button class="btn btn-primary" style="margin-top:10px;" onclick="confirmProfile()">Confirmar perfil ✅</button>
      <button class="btn btn-ghost" onclick="goto('start')">Voltar</button>
    </div>
  </div>`;
};
function pickAvatar(a){
  sfxClick();
  tempProfile.avatar = a;
  document.querySelectorAll('.avatar-opt').forEach(el=>el.classList.toggle('selected', el.dataset.av===a));
}
function confirmProfile(){
  const val = $('#nameInput').value.trim();
  if(!val){ $('#nameInput').focus(); $('#nameInput').style.borderColor='var(--coral)'; return; }
  sfxClick();
  SAVE.profile = {name: val.slice(0,16), avatar: tempProfile.avatar};
  persist();
  goto('difficulty');
}

/* ---- DIFFICULTY ---- */
const DIFFS = [
  {id:'facil', label:'Fácil 🌤️', desc:'Números pequenos e mais ajuda visual.'},
  {id:'medio', label:'Médio ⛅', desc:'Questões um pouco mais desafiadoras.'},
  {id:'dificil', label:'Difícil 🌩️', desc:'Para quem já é craque em matemática!'}
];
SCREENS.difficulty = function(){
  return `
  <div class="screen">
    <h2 style="color:#fff; text-shadow:0 3px 0 rgba(35,50,86,.25);">Escolha a dificuldade</h2>
    <div class="cloud-card stack">
      ${DIFFS.map(d=>`
        <button class="diff-card ${SAVE.difficulty===d.id?'selected':''}" onclick="pickDifficulty('${d.id}')">
          <span class="diff-title">${d.label}</span>
          <span class="diff-desc">${d.desc}</span>
        </button>`).join('')}
      <button class="btn btn-primary" style="margin-top:8px;" onclick="afterDifficulty()">Continuar</button>
    </div>
  </div>`;
};
function pickDifficulty(id){
  sfxClick();
  SAVE.difficulty = id;
  persist();
  document.querySelectorAll('.diff-card').forEach(el=>el.classList.remove('selected'));
  goto('difficulty');
}
function afterDifficulty(){
  sfxClick();
  if(!SAVE.tutorialSeen){ goto('tutorial'); } else { goto('map'); }
}

/* ---- TUTORIAL ---- */
const TUT_SLIDES = [
  {mascot:'🐨', text:'Oi! Eu sou o Nino, seu guia nas nuvens! Vamos aprender juntos?'},
  {mascot:'🐨', text:'Em cada fase, você responde perguntas de matemática tocando na resposta certa.'},
  {mascot:'🐨', text:'Você começa cada fase com 3 corações ❤️❤️❤️. Errar tira um coração.'},
  {mascot:'🐨', text:'Acertar te dá pontos ⭐! Complete a fase para liberar a próxima nuvem no mapa.'},
  {mascot:'🐨', text:'Não se preocupe: seu progresso é salvo automaticamente. Pode voltar quando quiser!'}
];
let tutIndex=0;
SCREENS.tutorial = function(){
  tutIndex=0;
  return renderTutSlide();
};
function renderTutSlide(){
  const s = TUT_SLIDES[tutIndex];
  return `
  <div class="screen">
    <h2 style="color:#fff;">Como jogar</h2>
    <div class="cloud-card stack">
      <div class="mascot-row">
        <div class="mascot">${s.mascot}</div>
        <div class="speech">${s.text}</div>
      </div>
      <div class="tutorial-dots">
        ${TUT_SLIDES.map((_,i)=>`<span class="dot ${i===tutIndex?'active':''}"></span>`).join('')}
      </div>
      <div class="row">
        <button class="btn btn-ghost" onclick="skipTutorial()">Pular</button>
        <button class="btn btn-primary" onclick="nextTutSlide()">${tutIndex===TUT_SLIDES.length-1?'Vamos lá! 🚀':'Próximo'}</button>
      </div>
    </div>
  </div>`;
}
function nextTutSlide(){
  sfxClick();
  if(tutIndex<TUT_SLIDES.length-1){ tutIndex++; $('#app').innerHTML = renderTutSlide(); }
  else finishTutorial();
}
function skipTutorial(){ sfxClick(); finishTutorial(); }
function finishTutorial(){ SAVE.tutorialSeen=true; persist(); goto('map'); }

/* ---- MAP ---- */
SCREENS.map = function(){
  const p = SAVE.progress.phases;
  const bonus = SAVE.progress.bonus;
  const order = [4,3,2,1]; // render bottom(1) to top(4) visually using column-reverse container, so array order 1..4 then bonus
  const nodesHtml = [];
  [1,2,3,4].forEach(n=>{
    const st = p[n].status;
    const cls = st==='locked'?'locked': st==='completed'?'done': 'current';
    const icon = st==='locked' ? '🔒' : PHASE_INFO[n].icon;
    nodesHtml.push(`
      <div class="node">
        <button class="node-btn ${cls}" ${st==='locked'?'disabled':''} onclick="openPhaseInfo(${n})" aria-label="Fase ${n}: ${PHASE_INFO[n].name}, ${st==='locked'?'bloqueada':st==='completed'?'concluída':'disponível'}">
          ${icon}
          ${st==='completed'?'<span class="node-check">✅</span>':''}
        </button>
        <div class="node-label">Fase ${n}</div>
      </div>
      <div class="map-line"></div>`);
  });
  const bonusLocked = bonus.status==='locked';
  const bonusCls = bonusLocked?'locked': bonus.status==='completed'?'done':'bonus';
  nodesHtml.push(`
    <div class="node">
      <button class="node-btn ${bonusCls}" ${bonusLocked?'disabled':''} onclick="openBonusInfo()" aria-label="Desafio Bônus, ${bonusLocked?'bloqueado':bonus.status==='completed'?'concluído':'disponível'}">
        ${bonusLocked?'🔒':'🏆'}
        ${bonus.status==='completed'?'<span class="node-check">✅</span>':''}
      </button>
      <div class="node-label">Bônus</div>
    </div>`);

  return `
  <div class="screen">
    <div class="top-bar">
      <div class="pill">${SAVE.profile.avatar} ${esc(SAVE.profile.name)}</div>
      <div class="pill">🏆 ${SAVE.bestScore}</div>
      <button class="btn btn-icon btn-outline" onclick="goto('settings',{from:'map'})" aria-label="Configurações">⚙️</button>
    </div>
    <div class="cloud-card">
      <div class="row" style="margin-bottom:10px;">
        <div class="pill" style="flex:none;">Pontos: ${SAVE.totalScore}</div>
        <button class="btn btn-ghost" style="flex:none; padding:6px 10px;" onclick="goto('tutorial')">❔ Como jogar</button>
      </div>
      <div class="map-wrap">
        <div class="map-path">${nodesHtml.reverse().join('')}</div>
      </div>
    </div>
  </div>`;
};

function openPhaseInfo(n){
  sfxClick();
  const st = SAVE.progress.phases[n].status;
  if(st==='locked') return;
  const info = PHASE_INFO[n];
  showModal(`
    <div class="modal-card">
      <div class="center-emoji">${info.icon}</div>
      <h3>Fase ${n} — ${info.name}</h3>
      <p>${info.desc}</p>
      <div class="stack">
        <button class="btn btn-mint" onclick="closeModal(); startPhase(${n});">Jogar ▶️</button>
        <button class="btn btn-outline" onclick="closeModal();">Fechar</button>
      </div>
    </div>`);
}
function openBonusInfo(){
  sfxClick();
  if(SAVE.progress.bonus.status==='locked') return;
  showModal(`
    <div class="modal-card">
      <div class="center-emoji">🏆</div>
      <h3>Desafio Bônus</h3>
      <p>Uma mistura de todas as fases! Mostre tudo o que aprendeu.</p>
      <div class="stack">
        <button class="btn btn-sun" onclick="closeModal(); startBonus();">Jogar ▶️</button>
        <button class="btn btn-outline" onclick="closeModal();">Fechar</button>
      </div>
    </div>`);
}

/* ---- GAMEPLAY (PHASE) ---- */
function startPhase(n){
  session = {
    kind:'phase', phase:n, index:0, lives:START_LIVES, score:0,
    correct:0, wrong:0, questions: buildQuestionSet(n, SAVE.difficulty, QUESTIONS_PER_PHASE),
    startedAt: Date.now(), qStartedAt: Date.now(), answered:false
  };
  persistSession();
  goto('play');
}
function startBonus(){
  session = {
    kind:'bonus', phase:'bonus', index:0, lives:START_LIVES, score:0,
    correct:0, wrong:0, questions: buildBonusSet(SAVE.difficulty, BONUS_QUESTIONS),
    startedAt: Date.now(), qStartedAt: Date.now(), answered:false
  };
  persistSession();
  goto('play');
}
function resumePhase(){
  const s = SAVE.currentPhaseInProgress;
  if(!s){ goto('map'); return; }
  session = s;
  session.qStartedAt = Date.now();
  goto('play');
}
function persistSession(){
  SAVE.currentPhaseInProgress = session ? {...session} : null;
  persist();
}

SCREENS.play = function(){
  if(!session) return SCREENS.map();
  const q = session.questions[session.index];
  const total = session.questions.length;
  const pct = Math.round((session.index/total)*100);
  const title = session.kind==='bonus' ? 'Desafio Bônus' : `Fase ${session.phase} — ${PHASE_INFO[session.phase].name}`;

  let answerArea = '';
  if(q.type==='multipla'){
    answerArea = `<div class="options-grid">
      ${q.options.map(o=>`<button class="opt-btn" data-val="${esc(o)}" onclick="submitAnswer('${esc(o)}', this)">${esc(o)}</button>`).join('')}
    </div>`;
  } else {
    answerArea = `<div class="numeric-row">
      <input type="text" inputmode="numeric" pattern="[0-9\\-]*" id="numInput" placeholder="?" onkeydown="if(event.key==='Enter'){submitNumeric();}">
      <button class="btn btn-primary" style="width:auto; padding:16px 22px;" onclick="submitNumeric()">Responder</button>
    </div>`;
  }

  return `
  <div class="screen">
    <div class="top-bar">
      <button class="btn btn-icon btn-outline" onclick="pauseGame()" aria-label="Pausar">⏸️</button>
      <div class="pill">${title}</div>
      <div class="lives" aria-label="Vidas restantes: ${session.lives} de 3">
        ${[0,1,2].map(i=>`<span class="heart ${i<session.lives?'':'lost'}">❤️</span>`).join('')}
      </div>
    </div>
    <div class="cloud-card question-box">
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div class="q-badge">Pergunta ${session.index+1} de ${total} · ⭐ ${session.score} pts</div>
      <div class="q-text">${esc(q.text)}</div>
      ${q.visual?`<div class="q-visual">${q.visual}</div>`:''}
      ${answerArea}
    </div>
  </div>`;
};

function submitAnswer(val, btnEl){
  if(session.answered) return;
  session.answered = true;
  const q = session.questions[session.index];
  const correct = String(val)===String(q.answer);
  document.querySelectorAll('.opt-btn').forEach(b=>{
    b.disabled = true;
    if(b.dataset.val===String(q.answer)) b.classList.add('correct');
    else if(b===btnEl && !correct) b.classList.add('wrong');
  });
  resolveAnswer(correct);
}
function submitNumeric(){
  if(session.answered) return;
  const input = $('#numInput');
  const val = (input.value||'').trim();
  if(val==='') { input.focus(); return; }
  session.answered = true;
  const q = session.questions[session.index];
  const correct = String(val)===String(q.answer);
  input.disabled = true;
  resolveAnswer(correct);
}

function resolveAnswer(correct){
  const elapsed = Date.now() - session.qStartedAt;
  if(correct){
    sfxCorrect();
    let pts = 100;
    if(elapsed < 5000) pts += 20;
    session.score += pts;
    session.correct++;
    showFeedback(pick(CORRECT_MSGS)+' +'+pts, true);
  } else {
    sfxWrong();
    session.lives--;
    session.wrong++;
    showFeedback(pick(WRONG_MSGS), false);
  }
  persistSession();
  setTimeout(()=>{
    if(session.lives<=0){ goto('defeat'); return; }
    session.index++;
    session.answered=false;
    if(session.index>=session.questions.length){
      finishSession();
    } else {
      session.qStartedAt = Date.now();
      persistSession();
      goto('play');
    }
  }, 1000);
}

function finishSession(){
  sfxWin();
  if(session.kind==='phase'){
    const n = session.phase;
    const bonusPts = 100 + session.lives*30;
    session.score += bonusPts;
    SAVE.totalScore += session.score;
    SAVE.bestScore = Math.max(SAVE.bestScore, SAVE.totalScore);
    SAVE.progress.phases[n].status='completed';
    SAVE.progress.phases[n].bestScore = Math.max(SAVE.progress.phases[n].bestScore, session.score);
    SAVE.progress.phases[n].attempts++;
    if(n<4 && SAVE.progress.phases[n+1].status==='locked') SAVE.progress.phases[n+1].status='unlocked';
    if(n===4) SAVE.progress.bonus.status='unlocked';
    SAVE.currentPhaseInProgress = null;
    persist();
    goto('victory', {bonusPts});
  } else {
    SAVE.totalScore += session.score;
    SAVE.bestScore = Math.max(SAVE.bestScore, SAVE.totalScore);
    SAVE.progress.bonus.status='completed';
    SAVE.progress.bonus.result = {score:session.score, correct:session.correct, wrong:session.wrong, time: Date.now()-session.startedAt};
    SAVE.currentPhaseInProgress = null;
    persist();
    goto('finalResult');
  }
}

/* ---- PAUSE ---- */
function pauseGame(){
  sfxClick();
  showModal(`
    <div class="modal-card">
      <div class="center-emoji">⏸️</div>
      <h3>Jogo pausado</h3>
      <div class="stack">
        <button class="btn btn-mint" onclick="closeModal();">Continuar</button>
        <button class="btn btn-outline" onclick="closeModal(); goto('settings',{from:'play'});">⚙️ Configurações</button>
        <button class="btn btn-outline" onclick="closeModal(); persistSession(); goto('map');">💾 Salvar e sair</button>
      </div>
    </div>`);
}

/* ---- VICTORY ---- */
SCREENS.victory = function(data){
  const s = session;
  return `
  <div class="screen">
    <div class="cloud-card" style="text-align:center;">
      <div class="center-emoji">🎉</div>
      <h2>Fase concluída!</h2>
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${s.score}</div><div class="lab">Pontos</div></div>
        <div class="stat-box"><div class="num">${s.correct}</div><div class="lab">Acertos</div></div>
        <div class="stat-box"><div class="num">${s.wrong}</div><div class="lab">Erros</div></div>
        <div class="stat-box"><div class="num">${s.lives}</div><div class="lab">Vidas restantes</div></div>
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="session=null; goto('map');">Continuar</button>
    </div>
  </div>`;
};

/* ---- DEFEAT ---- */
SCREENS.defeat = function(){
  persistDefeat();
  return `
  <div class="screen">
    <div class="cloud-card" style="text-align:center;">
      <div class="center-emoji">☁️💧</div>
      <h2>Você perdeu todas as suas vidas!</h2>
      <p style="color:var(--ink-soft); font-weight:600;">Sem problemas, todo mundo erra! Tente de novo.</p>
      <div class="stack">
        <button class="btn btn-mint" onclick="retrySession()">🔁 Tentar novamente</button>
        <button class="btn btn-outline" onclick="session=null; SAVE.currentPhaseInProgress=null; persist(); goto('map');">🗺️ Voltar ao mapa</button>
      </div>
    </div>
  </div>`;
};
function persistDefeat(){ SAVE.currentPhaseInProgress=null; persist(); }
function retrySession(){
  sfxClick();
  if(session.kind==='phase') startPhase(session.phase);
  else startBonus();
}

/* ---- BONUS FINAL RESULT ---- */
SCREENS.finalResult = function(){
  const r = SAVE.progress.bonus.result;
  const allDone = [1,2,3,4].every(n=>SAVE.progress.phases[n].status==='completed');
  return `
  <div class="screen">
    <div class="cloud-card" style="text-align:center;">
      <div class="center-emoji">☁️🏆☁️</div>
      <h2>PARABÉNS!</h2>
      <p style="font-weight:700;">Você completou sua jornada matemática!</p>
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${SAVE.totalScore}</div><div class="lab">Pontuação total</div></div>
        <div class="stat-box"><div class="num">${SAVE.bestScore}</div><div class="lab">Melhor pontuação</div></div>
        <div class="stat-box"><div class="num">${allDone?'4/4':'—'}</div><div class="lab">Fases concluídas</div></div>
        <div class="stat-box"><div class="num">${r?r.correct+'/'+(r.correct+r.wrong):'—'}</div><div class="lab">Resultado do bônus</div></div>
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="goto('map')">Voltar ao mapa</button>
    </div>
  </div>`;
};

/* ---- SETTINGS ---- */
SCREENS.settings = function(data){
  const back = (data&&data.from)||'start';
  const s = SAVE.settings;
  return `
  <div class="screen">
    <h2 style="color:#fff;">Configurações</h2>
    <div class="cloud-card stack">
      <div class="settings-group">
        <h3>Áudio</h3>
        <div class="setting-row">
          <label for="musicOn">Música</label>
          <label class="switch"><input type="checkbox" id="musicOn" ${s.musicOn?'checked':''} onchange="toggleSetting('musicOn', this.checked)"><span class="slider-toggle"></span></label>
        </div>
        <div class="setting-row">
          <label for="musicVol">Volume da música</label>
          <input type="range" id="musicVol" min="0" max="1" step="0.05" value="${s.musicVol}" oninput="updateSetting('musicVol', parseFloat(this.value))">
        </div>
        <div class="setting-row">
          <label for="sfxOn">Efeitos sonoros</label>
          <label class="switch"><input type="checkbox" id="sfxOn" ${s.sfxOn?'checked':''} onchange="toggleSetting('sfxOn', this.checked)"><span class="slider-toggle"></span></label>
        </div>
        <div class="setting-row">
          <label for="sfxVol">Volume dos efeitos</label>
          <input type="range" id="sfxVol" min="0" max="1" step="0.05" value="${s.sfxVol}" oninput="updateSetting('sfxVol', parseFloat(this.value))">
        </div>
      </div>
      <div class="settings-group">
        <h3>Tela</h3>
        <div class="setting-row">
          <label>Tela cheia</label>
          <button class="btn btn-outline" style="width:auto; padding:8px 16px; min-height:40px;" onclick="toggleFullscreen()">Ativar</button>
        </div>
      </div>
      <button class="btn btn-ghost" onclick="restoreDefaults()">↺ Restaurar configurações padrão</button>
      <button class="btn btn-primary" onclick="closeSettings('${back}')">Salvar e voltar</button>
    </div>
  </div>`;
};
function toggleSetting(key, val){ SAVE.settings[key]=val; persist(); if(key==='musicOn'){ val?startMusic():stopMusic(); } sfxClick(); }
function updateSetting(key, val){ SAVE.settings[key]=val; persist(); }
function toggleFullscreen(){
  sfxClick();
  if(!document.fullscreenElement){ document.documentElement.requestFullscreen().catch(()=>{}); SAVE.settings.fullscreen=true; }
  else { document.exitFullscreen().catch(()=>{}); SAVE.settings.fullscreen=false; }
  persist();
}
function restoreDefaults(){
  sfxClick();
  SAVE.settings = defaultSave().settings;
  persist();
  goto('settings', {from: currentScreen});
}
function closeSettings(back){
  sfxClick();
  goto(back==='play' && session ? 'play' : back);
}

/* ---- MULTIPLAYER (local, priority 3 — simple) ---- */
function onMultiplayerEntry(){
  sfxClick();
  goto('mpSetup');
}
SCREENS.mpSetup = function(){
  return `
  <div class="screen">
    <h2 style="color:#fff;">Multiplayer local 👫</h2>
    <div class="cloud-card stack">
      <p style="color:var(--ink-soft); font-weight:600;">Dois jogadores no mesmo aparelho competem respondendo perguntas por turno.</p>
      <input type="text" id="mp1" placeholder="Nome do Jogador 1" maxlength="14">
      <input type="text" id="mp2" placeholder="Nome do Jogador 2" maxlength="14">
      <button class="btn btn-primary" onclick="startMultiplayer()">Começar disputa 🏁</button>
      <button class="btn btn-ghost" onclick="goto('start')">Voltar</button>
    </div>
  </div>`;
};
function startMultiplayer(){
  const n1 = ($('#mp1').value||'Jogador 1').trim() || 'Jogador 1';
  const n2 = ($('#mp2').value||'Jogador 2').trim() || 'Jogador 2';
  sfxClick();
  const QN = 6;
  mp = {
    players:[
      {name:n1, correct:0, wrong:0, totalTime:0, questions: buildQuestionSet(pick([1,2,3]), SAVE.difficulty||'facil', QN)},
      {name:n2, correct:0, wrong:0, totalTime:0, questions: buildQuestionSet(pick([1,2,3]), SAVE.difficulty||'facil', QN)}
    ],
    turn:0, index:0, qStart:Date.now(), answered:false
  };
  goto('mpPlay');
}
SCREENS.mpPlay = function(){
  const p = mp.players[mp.turn];
  const q = p.questions[mp.index];
  let answerArea='';
  if(q.type==='multipla'){
    answerArea = `<div class="options-grid">${q.options.map(o=>`<button class="opt-btn" data-val="${esc(o)}" onclick="mpSubmit('${esc(o)}', this)">${esc(o)}</button>`).join('')}</div>`;
  } else {
    answerArea = `<div class="numeric-row"><input type="text" inputmode="numeric" id="mpNumInput" placeholder="?"><button class="btn btn-primary" style="width:auto;" onclick="mpSubmitNumeric()">Responder</button></div>`;
  }
  return `
  <div class="screen">
    <div class="top-bar"><div class="pill">Vez de: ${esc(p.name)}</div><div class="pill">Pergunta ${mp.index+1}/${p.questions.length}</div></div>
    <div class="cloud-card question-box">
      <div class="q-text">${esc(q.text)}</div>
      ${q.visual?`<div class="q-visual">${q.visual}</div>`:''}
      ${answerArea}
    </div>
  </div>`;
};
function mpResolve(correct){
  const p = mp.players[mp.turn];
  const elapsed = Date.now()-mp.qStart;
  p.totalTime += elapsed;
  if(correct){ p.correct++; sfxCorrect(); showFeedback(pick(CORRECT_MSGS), true); }
  else { p.wrong++; sfxWrong(); showFeedback(pick(WRONG_MSGS), false); }
  setTimeout(()=>{
    mp.turn = mp.turn===0?1:0;
    if(mp.turn===0) mp.index++;
    mp.qStart = Date.now();
    if(mp.index>=mp.players[0].questions.length){ goto('mpResult'); }
    else goto('mpPlay');
  }, 800);
}
function mpSubmit(val, btnEl){
  const p = mp.players[mp.turn]; const q = p.questions[mp.index];
  document.querySelectorAll('.opt-btn').forEach(b=>b.disabled=true);
  mpResolve(String(val)===String(q.answer));
}
function mpSubmitNumeric(){
  const input = $('#mpNumInput'); const val=(input.value||'').trim(); if(val==='')return;
  const p = mp.players[mp.turn]; const q = p.questions[mp.index];
  input.disabled=true;
  mpResolve(String(val)===String(q.answer));
}
SCREENS.mpResult = function(){
  const [a,b] = mp.players;
  let winner;
  if(a.correct!==b.correct) winner = a.correct>b.correct?a:b;
  else winner = a.totalTime<=b.totalTime?a:b;
  return `
  <div class="screen">
    <div class="cloud-card" style="text-align:center;">
      <div class="center-emoji">🏆</div>
      <h2>${esc(winner.name)} venceu!</h2>
      <div class="row">
        ${mp.players.map(p=>`
          <div class="stat-box" style="flex:1;">
            <div class="lab">${esc(p.name)}</div>
            <div class="num">${p.correct} ✅</div>
            <div class="lab">${p.wrong} erros · ${(p.totalTime/1000).toFixed(1)}s</div>
          </div>`).join('')}
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="mp=null; goto('start');">Voltar ao início</button>
    </div>
  </div>`;
};

/* ---------- INIT ---------- */
async function init(){
  paintClouds();
  await loadSave();
  if(SAVE.settings.musicOn) startMusic();
  if(hasSavedGame && SAVE.profile.name){
    goto('map');
  } else {
    goto('start');
  }
}
init();