/* =========================================================
   MATEMÁTICA NAS NUVENS — jogo educativo (single file)
========================================================= */

/* ---------- CONFIG ---------- */
const QUESTIONS_PER_PHASE = 8;
const BONUS_QUESTIONS = 10;
const START_LIVES = 3;
const AVATARS = ['👦','👧','🧒','👶','👦🏽','👧🏽','👦🏾','👧🏾'];
const PHASE_INFO = {
  1:{name:'Fundamentos', icon:'🔢', desc:'Números, contagem e as primeiras somas e subtrações.'},
  2:{name:'Operações', icon:'➗', desc:'Soma, subtração, multiplicação e divisão.'},
  3:{name:'Desafios', icon:'🧩', desc:'Sequências, comparações e probleminhas.'},
  4:{name:'Desafio Final', icon:'🏆', desc:'Um pouquinho de tudo, com mais dificuldade.'}
};
const CORRECT_MSGS = ['🎉 Muito bem!','⭐ Excelente!','👏 Isso aí!','🌟 Mandou bem!','✨ Show de bola!'];
const WRONG_MSGS = ['💭 Quase! Tente de novo.','🤔 Não foi dessa vez, você consegue!','💙 Continue tentando!','🌤️ Foi por pouco!'];
/* Assuntos das perguntas (usados no feedback de desempenho) */
const TOPICS = {   /* "say" entra em frases como "Você é craque em ___" e "Vamos treinar mais ___?" */
  contagem:{label:'Contagem', emoji:'🔢', say:'contagem'},
  vizinhos:{label:'Antes e depois', emoji:'↔️', say:'achar o número de antes e de depois'},
  soma:{label:'Soma', emoji:'➕', say:'somas'},
  subtracao:{label:'Subtração', emoji:'➖', say:'subtrações'},
  mult:{label:'Multiplicação', emoji:'✖️', say:'multiplicações'},
  div:{label:'Divisão', emoji:'➗', say:'divisões'},
  combinada:{label:'Contas combinadas', emoji:'🧮', say:'contas combinadas'},
  sequencia:{label:'Sequências', emoji:'🔁', say:'sequências'},
  comparacao:{label:'Comparações', emoji:'⚖️', say:'comparações'},
  problema:{label:'Probleminhas', emoji:'📖', say:'probleminhas'}
};
const DIFF_LABEL = {facil:'Fácil', medio:'Médio', dificil:'Difícil'};
const HISTORY_MAX = 30;

/* Personagens narradores. Cada um combina tom (pitch) e velocidade (rate) da
   voz do aparelho para soar diferente. "pref" é só uma preferência: tenta
   escolher uma voz feminina/masculina entre as que o navegador tiver. */
const VOICE_CHARS = [
  {id:'nino',    name:'Nino',               art:'o', emoji:'🐨', desc:'Voz amiga e calma',      pitch:1.05, rate:0.92, pref:'any',
   sample:'Oi! Eu sou o Nino, seu guia nas nuvens. Vamos aprender juntos?'},
  {id:'ratinho', name:'Ratinho Espertinho', art:'o', emoji:'🐭', desc:'Voz fininha e animada',  pitch:1.95, rate:1.12, pref:'female',
   sample:'Iupii! Eu sou o Ratinho Espertinho! Bora fazer contas bem rapidinho?'},
  {id:'fada',    name:'Fadinha Estrela',    art:'a', emoji:'🧚', desc:'Voz doce e brilhante',   pitch:1.6,  rate:0.98, pref:'female',
   sample:'Olá! Eu sou a Fadinha Estrela. Vou espalhar brilho na sua matemática!'},
  {id:'urso',    name:'Ursão Bonzinho',     art:'o', emoji:'🐻', desc:'Voz grossa e calma',     pitch:0.35, rate:0.82, pref:'male',
   sample:'Oi, amiguinho. Eu sou o Ursão Bonzinho. Vem comigo, que a gente vai longe!'},
  {id:'robo',    name:'Robozinho Bip',      art:'o', emoji:'🤖', desc:'Voz de robô divertido',  pitch:0.5,  rate:0.75, pref:'male',
   sample:'Bip bip! Eu sou o Robozinho Bip. Calculando diversão. Vamos jogar?'},
  {id:'heroi',   name:'Capitão Nuvem',      art:'o', emoji:'🦸', desc:'Voz forte e corajosa',   pitch:0.7,  rate:1.0,  pref:'male',
   sample:'Atenção! Eu sou o Capitão Nuvem! Com a matemática, ninguém nos para!'},
  {id:'vovo',    name:'Vovô Tartaruga',     art:'o', emoji:'🐢', desc:'Voz lenta e sábia',      pitch:0.6,  rate:0.62, pref:'male',
   sample:'Olá, meu netinho. Eu sou o Vovô Tartaruga. Devagar e sempre, a gente aprende.'},
  {id:'alien',   name:'Alienzinho Zip',     art:'o', emoji:'👽', desc:'Voz aguda e maluquinha', pitch:1.75, rate:0.85, pref:'any',
   sample:'Zip zip! Eu sou o Alienzinho Zip. Vim de outro planeta para brincar de matemática!'}
];

const MUSIC_TRACKS = [
  {name:'Brisa da manhã', notes:[392,440,494,392,349,392,440,392]},
  {name:'Passeio nas nuvens', notes:[262,294,330,392,330,294,262,294]},
  {name:'Estrelas brilhantes', notes:[523,587,659,784,659,587,523,587]},
  {name:'Pula-pula', notes:[330,392,440,523,440,392,330,392]},
  {name:'Arco-íris', notes:[392,494,587,659,587,494,392,330]}
];

/* ---------- DEFAULT SAVE ---------- */
function defaultPhase(status){
  return {status, bestScore:0, attempts:0, plays:0, bestStars:0, lastCorrect:null, lastWrong:null};
}
function defaultSave(){
  return {
    profile:{name:'', avatar:AVATARS[0]},
    difficulty:'facil',
    tutorialSeen:false,
    progress:{
      phases:{
        1:defaultPhase('unlocked'),
        2:defaultPhase('locked'),
        3:defaultPhase('locked'),
        4:defaultPhase('locked')
      },
      bonus:{status:'locked', result:null, plays:0}
    },
    totalScore:0,
    bestScore:0,
    settings:{musicOn:true, sfxOn:true, musicVol:0.5, sfxVol:0.7, musicTrack:'random', fullscreen:false, readAloudOn:true, voiceChar:'nino', voiceURI:'auto'},
    /* desempenho geral do jogador (alimenta o feedback da tela inicial) */
    stats:{answered:0, totalCorrect:0, totalWrong:0, totalTimeouts:0, totalAnswerMs:0, bestStreak:0, sessions:0, wins:0, losses:0, topics:{}},
    history:[], /* últimas jogadas: {t, kind, phase, diff, result, score, correct, wrong, ms} */
    currentPhaseInProgress:null /* {phase, index, lives, score, correct, wrong, log} para retomar */
  };
}

let SAVE = defaultSave();
let hasSavedGame = false;
let storageWorks = true;

const SAVE_KEY = 'matematica-nas-nuvens-save';

function applySave(raw){
  if(!raw) return false;
  const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) || {};
  const d = defaultSave();
  SAVE = Object.assign({}, d, parsed);
  SAVE.profile = Object.assign({}, d.profile, parsed.profile||{});
  SAVE.settings = Object.assign({}, d.settings, parsed.settings||{});
  if(!VOICE_CHARS.some(v=>v.id===SAVE.settings.voiceChar)) SAVE.settings.voiceChar = 'nino';
  /* saves antigos não têm "stats"/"history": completa sem perder nada */
  SAVE.stats = Object.assign({}, d.stats, parsed.stats||{});
  SAVE.stats.topics = Object.assign({}, (parsed.stats && parsed.stats.topics) || {});
  SAVE.history = Array.isArray(parsed.history) ? parsed.history.slice(0, HISTORY_MAX) : [];
  const pr = parsed.progress || {};
  SAVE.progress = {phases:{}, bonus:Object.assign({}, d.progress.bonus, pr.bonus||{})};
  [1,2,3,4].forEach(n=>{
    SAVE.progress.phases[n] = Object.assign({}, d.progress.phases[n], (pr.phases && pr.phases[n]) || {});
  });
  hasSavedGame = !!(SAVE.profile && SAVE.profile.name);
  return hasSavedGame;
}

async function loadSave(){
  let raw = null;
  try{
    if(window.storage){
      const res = await window.storage.get(SAVE_KEY, false);
      raw = res && res.value;
    }
  }catch(e){ storageWorks=false; }

  try{
    if(!raw) raw = window.localStorage.getItem(SAVE_KEY);
  }catch(e){ storageWorks=false; }

  try{ applySave(raw); }catch(e){ hasSavedGame=false; }
}

let saveTimer=null;
function persistNow(){
  const serialized = JSON.stringify(SAVE);
  try{ window.localStorage.setItem(SAVE_KEY, serialized); }catch(e){ storageWorks=false; }
  try{
    if(window.storage) window.storage.set(SAVE_KEY, serialized, false).catch(()=>{ storageWorks=false; });
  }catch(e){ storageWorks=false; }
}
function persist(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, 150);
}
window.addEventListener('pagehide', persistNow);
window.addEventListener('beforeunload', persistNow);

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
  const selected = SAVE.settings.musicTrack === 'random'
    ? pick(MUSIC_TRACKS)
    : MUSIC_TRACKS[Number(SAVE.settings.musicTrack)] || MUSIC_TRACKS[0];
  const notes = selected.notes;
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
  musicNodes = {id, g, trackName:selected.name};
}
function changeMusic(){
  sfxClick();
  const current = SAVE.settings.musicTrack === 'random' ? -1 : Number(SAVE.settings.musicTrack);
  SAVE.settings.musicTrack = String((current + 1) % MUSIC_TRACKS.length);
  persist();
  startMusic();
  goto(currentScreen, currentScreen === 'settings' ? {from:settingsBack} : undefined);
}
function stopMusic(){ if(musicNodes){ clearInterval(musicNodes.id); try{musicNodes.g.disconnect();}catch(e){} musicNodes=null; } }

/* ---------- LEITURA EM VOZ ALTA (Text-to-Speech) ----------
   Usa a Web Speech API do próprio navegador (sem internet e sem arquivos
   de áudio). O jogador escolhe um personagem narrador (VOICE_CHARS); cada
   um muda o tom e a velocidade da voz, e tenta usar uma voz feminina ou
   masculina do aparelho quando existir. ------------------------------- */
function ttsSupported(){
  return ('speechSynthesis' in window) && (typeof SpeechSynthesisUtterance !== 'undefined');
}
function currentVoiceChar(){
  return VOICE_CHARS.find(v=>v.id===SAVE.settings.voiceChar) || VOICE_CHARS[0];
}
const FEMALE_HINT = /female|feminin|maria|francisca|luciana|vit[oó]ria|thalita|brenda|giovanna|leila|fernanda|camila|raquel|helena|yara|joana|google portugu/i;
const MALE_HINT = /\bmale\b|masculin|daniel|anton?io|antônio|felipe|donato|fabio|fábio|humberto|val[eé]rio|ricardo|jorge|thiago|j[uú]lio|cristiano/i;

/* vozes em português disponíveis (pt-BR primeiro) */
function ptVoices(){
  if(!ttsSupported()) return [];
  const all = window.speechSynthesis.getVoices() || [];
  const br = all.filter(v=>/^pt[-_]br/i.test(v.lang));
  const other = all.filter(v=>/^pt/i.test(v.lang) && !/^pt[-_]br/i.test(v.lang));
  return br.concat(other);
}
function pickVoiceFor(ch){
  const voices = ptVoices();
  if(!voices.length) return null;
  const uri = SAVE.settings.voiceURI;
  if(uri && uri !== 'auto'){
    const chosen = voices.find(v=>v.voiceURI === uri);
    if(chosen) return chosen;
  }
  if(ch.pref === 'any') return voices[0];
  const hinted = voices.filter(v=> ch.pref === 'female'
    ? FEMALE_HINT.test(v.name)
    : (MALE_HINT.test(v.name) && !FEMALE_HINT.test(v.name)));
  const pool = hinted.length ? hinted : voices;
  /* vozes locais costumam respeitar o tom (pitch); as online às vezes ignoram */
  return pool.find(v=>v.localService) || pool[0];
}
if(ttsSupported()){
  window.speechSynthesis.onvoiceschanged = ()=>{
    if(currentScreen === 'voices'){
      const box = $('#deviceVoiceBox');
      if(box) box.innerHTML = deviceVoiceSelectHTML();
    }
  };
}

function cleanForSpeech(text){
  // remove emojis e símbolos que a leitura em voz alta não deve pronunciar
  return String(text)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u2705\u2764\uFE0F]/gu,'')
    .replace(/\s+/g,' ')
    .trim();
}
/* troca símbolos de conta por palavras, para a voz ler "5 vezes 4" e não "5 x 4" */
function mathToSpeech(text){
  return String(text)
    .replace(/=\s*\?/g,' é igual a quanto? ')
    .replace(/_{2,}/g,', ')
    .replace(/\s*\+\s*/g,' mais ')
    .replace(/\s*[−–]\s*/g,' menos ')
    .replace(/(\d)\s*-\s*(\d)/g,'$1 menos $2')
    .replace(/\s*×\s*/g,' vezes ')
    .replace(/\s*÷\s*/g,' dividido por ')
    .replace(/\s*>\s*/g,' maior que ')
    .replace(/\s*<\s*/g,' menor que ')
    .replace(/\s*=\s*/g,' igual a ')
    .replace(/\s+/g,' ')
    .trim();
}
/* falas longas viram várias partes (o Chrome corta falas com mais de ~15s) */
function splitForSpeech(text){
  const parts = text.match(/[^.!?]+[.!?]*/g) || [text];
  const out = []; let cur = '';
  parts.forEach(p=>{
    p = p.trim(); if(!p) return;
    if(cur && (cur + ' ' + p).length > 170){ out.push(cur); cur = p; }
    else cur = cur ? cur + ' ' + p : p;
  });
  if(cur) out.push(cur);
  return out;
}

let speakToken = 0;
function setTalking(on){ document.body.classList.toggle('narrator-talking', !!on); }
function stopSpeaking(){
  speakToken++;
  setTalking(false);
  if(ttsSupported()){ try{ window.speechSynthesis.cancel(); }catch(e){} }
}
/* opts.force = fala mesmo com a narração desligada (botões 🔊 e prévia de voz) */
function speak(text, opts){
  opts = opts || {};
  if(!SAVE.settings.readAloudOn && !opts.force) return;
  if(!ttsSupported()) return;
  const clean = mathToSpeech(cleanForSpeech(text));
  if(!clean) return;
  const my = ++speakToken;
  try{ window.speechSynthesis.cancel(); }catch(e){}
  const ch = currentVoiceChar();
  const chunks = splitForSpeech(clean);
  setTimeout(()=>{
    if(my !== speakToken) return; // outra fala começou (ou foi interrompida) nesse meio tempo
    try{
      const voice = pickVoiceFor(ch);
      chunks.forEach((c,i)=>{
        const u = new SpeechSynthesisUtterance(c);
        if(voice){ u.voice = voice; u.lang = voice.lang; } else { u.lang = 'pt-BR'; }
        u.rate = ch.rate;
        u.pitch = ch.pitch;
        if(i === 0) u.onstart = ()=>{ if(my === speakToken) setTalking(true); };
        if(i === chunks.length-1) u.onend = u.onerror = ()=>{ if(my === speakToken) setTalking(false); };
        window.speechSynthesis.speak(u);
      });
    }catch(e){ /* TTS indisponível neste navegador, apenas ignora */ }
  }, 40);
}
/* fala só depois de um instante e só se o jogador ainda estiver na mesma tela */
function speakSoon(text, screen, delay){
  setTimeout(()=>{ if(currentScreen === screen) speak(text); }, delay||300);
}
/* textos falados por botões ficam num registro, para não precisar escapar aspas no HTML */
const SPEECH_REG = {};
function sayKey(key){ speak(SPEECH_REG[key] || '', {force:true}); }
function sayQuestion(q){ if(q) speak(q.spoken || q.text, {force:true}); }

function toggleReadAloud(val){
  SAVE.settings.readAloudOn = val;
  persist();
  sfxClick();
  if(val) speak('Leitura em voz alta ativada.');
  else stopSpeaking();
}

/* o navegador só libera o áudio depois de um toque/clique do jogador */
let userInteracted = false;
['pointerdown','keydown','touchstart'].forEach(ev=>
  window.addEventListener(ev, ()=>{ userInteracted = true; }, {capture:true, passive:true}));

/* ---------- CRONÔMETRO POR PERGUNTA ---------- */
const TIME_LIMIT = 20; // segundos disponíveis para responder cada pergunta
let timerInterval = null;
let currentTimeLeft = TIME_LIMIT;
let timerExpireCb = null;
function clearQuestionTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } }
function startQuestionTimer(onExpire){
  clearQuestionTimer();
  currentTimeLeft = TIME_LIMIT;
  timerExpireCb = onExpire;
  updateTimerUI();
  timerInterval = setInterval(tickQuestionTimer, 1000);
}
function resumeQuestionTimer(){
  if(!timerExpireCb || timerInterval) return;
  updateTimerUI();
  timerInterval = setInterval(tickQuestionTimer, 1000);
}
function tickQuestionTimer(){
  currentTimeLeft--;
  updateTimerUI();
  if(currentTimeLeft<=0){
    clearQuestionTimer();
    const cb = timerExpireCb; timerExpireCb=null;
    if(cb) cb();
  }
}
function updateTimerUI(){
  const fill = $('#timerFill'); const num = $('#timerNum');
  if(fill){ fill.style.width = Math.max(0,(currentTimeLeft/TIME_LIMIT*100))+'%'; fill.classList.toggle('low', currentTimeLeft<=5); }
  if(num) num.textContent = Math.max(0,currentTimeLeft)+'s';
}
function timerRowHTML(){
  return `<div class="timer-row" aria-label="Tempo restante para responder">
    <span aria-hidden="true">⏱️</span>
    <div class="timer-track"><div class="timer-fill" id="timerFill" style="width:100%;"></div></div>
    <div class="timer-num" id="timerNum">${TIME_LIMIT}s</div>
  </div>`;
}

/* ---------- QUESTION GENERATION ---------- */
function numRange(diff){
  if(diff==='facil') return {p1:10, p2mul:5, p2div:20, p3:20, p4:20};
  if(diff==='dificil') return {p1:50, p2mul:12, p2div:100, p3:100, p4:100};
  return {p1:20, p2mul:10, p2div:50, p3:50, p4:50}; // medio
}

function mkMultipla(text, answer, distractors, visual, topic, spoken){
  const opts = shuffle([answer, ...distractors].map(String));
  return {type:'multipla', text, answer:String(answer), options:opts, visual, topic, spoken};
}
function mkNumerica(text, answer, visual, topic, spoken){
  return {type:'numerica', text, answer:String(answer), visual, topic, spoken};
}
/* como a voz deve ler "Quantos ⭐ você vê?" (o emoji não é lido) */
const COUNT_WORDS = {'☁️':['nuvens','f'], '⭐':['estrelas','f'], '🍎':['maçãs','f'], '🎈':['balões','m'], '🐦':['passarinhos','m']};
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
    const cw = COUNT_WORDS[emoji];
    return mkMultipla('Quantos '+emoji+' você vê?', n, distractorsNear(n,3,3), emoji.repeat(n), 'contagem',
      `Quant${cw[1]==='f'?'as':'os'} ${cw[0]} você vê?`);
  }
  if(kind==='numero'){
    const a = rand(1,r.p1); const dir = pick(['antes','depois']);
    const ans = dir==='antes'? a-1 : a+1;
    return mkNumerica('Qual número vem '+dir+' do '+a+'?', ans, null, 'vizinhos');
  }
  if(kind==='soma'){
    const a = rand(1,r.p1), b = rand(1,r.p1);
    return mkMultipla(a+' + '+b+' = ?', a+b, distractorsNear(a+b,3,4), null, 'soma');
  }
  // subtracao
  let a = rand(1,r.p1), b = rand(0,a);
  return mkNumerica(a+' − '+b+' = ?', a-b, null, 'subtracao');
}

function genPhase2(diff){
  const r = numRange(diff);
  const kind = pick(['soma','subtracao','mult','div']);
  if(kind==='soma'){ const a=rand(1,r.p2div), b=rand(1,r.p2div); return mkNumerica(a+' + '+b+' = ?', a+b, null, 'soma'); }
  if(kind==='subtracao'){ const a=rand(1,r.p2div), b=rand(0,a); return mkNumerica(a+' − '+b+' = ?', a-b, null, 'subtracao'); }
  if(kind==='mult'){ const a=rand(1,r.p2mul), b=rand(1,r.p2mul); return mkMultipla(a+' × '+b+' = ?', a*b, distractorsNear(a*b,3,Math.max(4,a)), null, 'mult'); }
  // div exact
  const b = rand(2, Math.max(2,Math.floor(r.p2mul))); const q = rand(1, Math.max(2,Math.floor(r.p2div/b)));
  const a = b*q;
  return mkMultipla(a+' ÷ '+b+' = ?', q, distractorsNear(q,3,3), null, 'div');
}

function genPhase3(diff){
  const r = numRange(diff);
  const kind = pick(['combinada','sequencia','comparacao','problema']);
  if(kind==='combinada'){
    const a=rand(2,Math.min(20,r.p3)), b=rand(1,Math.min(10,r.p3)), c=rand(1,Math.min(10,r.p3));
    const useMinus = Math.random()<0.5;
    const ans = useMinus ? a+b-c : a-b+c;
    return mkNumerica(useMinus? `${a} + ${b} − ${c} = ?` : `${a} − ${b} + ${c} = ?`, ans, null, 'combinada');
  }
  if(kind==='sequencia'){
    const step = rand(2, diff==='facil'?3:6);
    const start = rand(1, Math.min(20,r.p3));
    const seq = [start, start+step, start+2*step, start+3*step];
    return mkMultipla('Complete a sequência: '+seq.join(', ')+', ?', start+4*step, distractorsNear(start+4*step,3,step*2), null, 'sequencia');
  }
  if(kind==='comparacao'){
    const a=rand(1,r.p3), b=rand(1,r.p3);
    const ans = a>b?'>': a<b? '<' : '=';
    return mkMultipla(`Qual sinal completa: ${a} ___ ${b} ?`, ans, ['>','<','='].filter(s=>s!==ans), null, 'comparacao');
  }
  // problema simples
  const a=rand(2,Math.min(15,r.p3)), b=rand(1,Math.min(10,r.p3));
  const names = ['maçãs','balões','estrelinhas','figurinhas','biscoitos'];
  const n = pick(names);
  return mkNumerica(`Ana tinha ${a} ${n} e ganhou mais ${b}. Quantas ela tem agora?`, a+b, null, 'problema');
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

/* ---------- ARTE VETORIAL (avião e pássaro) ----------
   Ilustrações em SVG, estilo cartoon infantil com contorno preto,
   inspiradas nas referências de avião e passarinho.
------------------------------------------------------- */
let _artUid = 0;
const uid = (p)=> p + '-' + (++_artUid);

function planeSVG(){
  const u = uid('pl');
  return `
<svg class="art-svg plane-svg" viewBox="0 0 220 142" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avião voando no céu">
  <defs>
    <clipPath id="${u}-hull">
      <path d="M34 66C34 48 64 38 114 38c40 0 72 10 84 24 6 7 0 16-12 21-26 10-98 12-132 1-14-5-20-11-20-18Z"/>
    </clipPath>
    <linearGradient id="${u}-hullFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#DCE9F2"/>
    </linearGradient>
    <linearGradient id="${u}-red" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F0525A"/>
      <stop offset="1" stop-color="#D62F3C"/>
    </linearGradient>
  </defs>
  <g stroke="#1F242C" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">

    <!-- leme / cauda (atrás) -->
    <path d="M76 48C58 38 36 27 21 25c-2 12 10 26 30 37Z" fill="url(#${u}-red)"/>
    <path d="M52 44C44 39 34 33 28 31c1 7 7 15 18 22Z" fill="#F9C440" stroke-width="2.6"/>

    <!-- asa de trás (atrás do corpo) -->
    <path d="M140 50c14-16 34-30 54-34 6 10-2 28-24 42Z" fill="url(#${u}-red)"/>
    <path d="M153 47c10-10 22-19 32-23 2 7-5 18-20 27Z" fill="#F9C440" stroke-width="2.6"/>

    <!-- estabilizador inferior -->
    <path d="M52 73C36 76 20 83 14 90c10 5 26 2 40-5Z" fill="#F9C440" stroke-width="2.8"/>

    <!-- fuselagem -->
    <path d="M34 66C34 48 64 38 114 38c40 0 72 10 84 24 6 7 0 16-12 21-26 10-98 12-132 1-14-5-20-11-20-18Z" fill="url(#${u}-hullFill)"/>

    <!-- detalhes recortados dentro da fuselagem -->
    <g clip-path="url(#${u}-hull)" stroke="#1F242C" stroke-width="2.8">
      <path d="M185 47c9 5 16 11 15 18-1 10-8 17-17 22-7-13-6-27 2-40Z" fill="#F9C440"/>
      <path d="M38 76c34 15 114 15 150-2 1 6-1 10-6 13-32 12-108 10-140-3Z" fill="#3E90CE"/>
      <path d="M150 53c14-6 29-8 38-5 2 8-5 15-19 19-11 3-19-1-21-6Z" fill="#3E90CE"/>
      <circle cx="74" cy="63" r="5.4" fill="#3E90CE"/>
      <circle cx="94" cy="63" r="6.4" fill="#3E90CE"/>
      <circle cx="115" cy="62" r="7.4" fill="#3E90CE"/>
      <circle cx="137" cy="62" r="8.4" fill="#3E90CE"/>
    </g>

    <!-- contorno da fuselagem por cima, para silhueta limpa -->
    <path d="M34 66C34 48 64 38 114 38c40 0 72 10 84 24 6 7 0 16-12 21-26 10-98 12-132 1-14-5-20-11-20-18Z" fill="none"/>

    <!-- asa da frente (na frente do corpo) -->
    <path d="M147 78C117 88 79 104 55 120c-7 5-2 11 8 8 36-8 74-28 94-46Z" fill="url(#${u}-red)"/>
    <path d="M127 92c-22 8-46 20-60 30 24-5 48-17 64-28Z" fill="#F9C440" stroke-width="2.6"/>
  </g>
</svg>`;
}

function birdSVG(){
  const u = uid('bd');
  return `
<svg class="art-svg bird-svg" viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Passarinho azul voando">
  <defs>
    <clipPath id="${u}-body">
      <path d="M30 72c0-20 16-36 40-40 18-3 36 0 46 10 12 12 14 30 4 44-10 13-32 19-52 16-24-4-38-14-38-30Z"/>
    </clipPath>
    <linearGradient id="${u}-blue" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#57C9F2"/>
      <stop offset="1" stop-color="#2AA6DF"/>
    </linearGradient>
    <linearGradient id="${u}-wing" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#8FDDF8"/>
      <stop offset="1" stop-color="#45B8EC"/>
    </linearGradient>
  </defs>
  <g stroke="#173A4E" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">

    <!-- topete (atrás da cabeça) -->
    <path d="M103 32c0-7 4-12 10-13 3 0 3 3 0 5-3 2-4 5-3 10Z" fill="#2AA6DF" stroke-width="2.6"/>

    <!-- cauda (atrás) -->
    <path d="M42 66C28 58 12 51 1 49c6 12 6 26 0 39 12-6 30-14 42-18Z" fill="#2AA6DF"/>

    <!-- asa de trás -->
    <g class="bird-wing bird-wing-far">
      <path d="M86 62C72 70 50 70 36 58 28 50 32 38 46 38c16 0 34 10 44 20Z" fill="#2795CC"/>
    </g>

    <!-- corpo -->
    <path d="M30 72c0-20 16-36 40-40 18-3 36 0 46 10 12 12 14 30 4 44-10 13-32 19-52 16-24-4-38-14-38-30Z" fill="url(#${u}-blue)"/>

    <!-- barriga e peito, recortados no corpo -->
    <g clip-path="url(#${u}-body)">
      <path d="M32 70c16 22 64 28 96 0 0 16-10 30-36 34-32 5-58-12-60-34Z" fill="#CFEEFB" stroke="none"/>
      <path d="M38 88c20 12 58 13 82-2-4 10-14 17-30 19-22 3-42-5-52-17Z" fill="#F7B733" stroke="none"/>
      <circle cx="88" cy="68" r="6.5" fill="#F7B733" stroke="none"/>
    </g>

    <!-- contorno do corpo por cima -->
    <path d="M30 72c0-20 16-36 40-40 18-3 36 0 46 10 12 12 14 30 4 44-10 13-32 19-52 16-24-4-38-14-38-30Z" fill="none"/>

    <!-- bico -->
    <path d="M122 50l26 8-26 9Z" fill="#F5901E" stroke-width="2.8"/>

    <!-- olho -->
    <circle cx="103" cy="47" r="12" fill="#FFFFFF" stroke-width="2.8"/>
    <circle cx="105" cy="48" r="7.5" fill="#12212E" stroke="none"/>
    <circle cx="108" cy="44" r="2.6" fill="#FFFFFF" stroke="none"/>

    <!-- asa da frente (bate) -->
    <g class="bird-wing bird-wing-near">
      <path d="M84 66C70 72 50 70 38 58 30 50 34 40 46 40c16 0 32 8 42 18 4 4 2 8-4 8Z" fill="url(#${u}-wing)"/>
      <path d="M50 45c8 4 18 10 28 16" fill="none" stroke="#3FAEE0" stroke-width="2.4"/>
      <path d="M44 51c9 5 19 10 30 14" fill="none" stroke="#3FAEE0" stroke-width="2.4"/>
      <path d="M40 58c9 4 18 7 28 10" fill="none" stroke="#3FAEE0" stroke-width="2.4"/>
    </g>

    <!-- pezinhos recolhidos -->
    <path d="M78 100c-2 6-7 9-13 10" fill="none" stroke="#E8622F" stroke-width="3"/>
    <path d="M90 99c-2 6-7 9-13 10" fill="none" stroke="#E8622F" stroke-width="3"/>
  </g>
</svg>`;
}

function cloudSVG(){
  const u = uid('cl');
  return `
<svg class="art-svg cloud-svg" viewBox="0 0 200 104" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <clipPath id="${u}-c">
      <path d="M26 92C10 92 2 80 6 68c3-10 12-16 22-15 2-19 18-33 38-33 16 0 30 9 36 22 7-8 18-12 29-10 19 3 32 18 31 36 14 0 24 9 24 17 0 4-3 7-8 7Z"/>
    </clipPath>
    <linearGradient id="${u}-f" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.62" stop-color="#F4FAFE"/>
      <stop offset="1" stop-color="#D9EAF7"/>
    </linearGradient>
  </defs>
  <path d="M26 92C10 92 2 80 6 68c3-10 12-16 22-15 2-19 18-33 38-33 16 0 30 9 36 22 7-8 18-12 29-10 19 3 32 18 31 36 14 0 24 9 24 17 0 4-3 7-8 7Z" fill="url(#${u}-f)"/>
  <g clip-path="url(#${u}-c)">
    <path d="M-5 70c32 14 72 16 108 7 33-8 68-10 102-1v32H-5Z" fill="#C7DFF0" opacity=".5"/>
    <ellipse cx="62" cy="40" rx="28" ry="17" fill="#FFFFFF" opacity=".85"/>
    <ellipse cx="26" cy="70" rx="16" ry="11" fill="#FFFFFF" opacity=".7"/>
  </g>
</svg>`;
}

/* distribui n elementos em faixas iguais (com leve variação) e embaralha */
function spreadBands(n, min, max, jitter){
  const step = (max - min) / n, out = [];
  for(let i=0;i<n;i++) out.push(min + step*i + step/2 + (Math.random()*2-1)*jitter);
  for(let i=out.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [out[i],out[j]] = [out[j],out[i]]; }
  return out;
}

/* ---------- BACKGROUND CLOUDS ---------- */
function paintClouds(){
  const layer = $('#cloud-layer'); if(!layer) return;
  layer.innerHTML='';
  const isBonus = currentScreen === 'bonus' || currentScreen === 'bonus-game';
  layer.className = isBonus ? 'space-scene' : 'sky-scene';

  if(isBonus){
    for(let i=0;i<48;i++){
      const star = document.createElement('div');
      star.className='space-star';
      star.style.top = rand(2,98)+'%';
      star.style.left = rand(0,100)+'%';
      star.style.animationDelay = `-${rand(0,5)}s`;
      star.style.animationDuration = `${rand(7,16)}s`;
      star.textContent = i % 4 === 0 ? '★' : '✦';
      layer.appendChild(star);
    }
  }else{
    /* --- NUVENS --- */
    const N_CLOUDS = 9;
    const cloudTops = spreadBands(N_CLOUDS, 2, 84, 4);
    for(let i=0;i<N_CLOUDS;i++){
      const dur = rand(26,44);
      const cloud = document.createElement('div');
      cloud.className='bgcloud';
      cloud.innerHTML = cloudSVG();
      cloud.style.top = cloudTops[i].toFixed(1)+'%';
      cloud.style.setProperty('--scale', (0.45 + rand(0,70)/100).toFixed(2));
      cloud.style.opacity = (0.6 + rand(0,35)/100).toFixed(2);
      cloud.style.animationDuration = dur+'s';
      // atraso distribuído: espalha as nuvens ao longo de toda a largura
      cloud.style.animationDelay = `-${(dur * (i + Math.random()*0.6) / N_CLOUDS).toFixed(1)}s`;
      layer.appendChild(cloud);
    }

    /* --- AVIÕES --- */
    const N_PLANES = 2;
    const planeTops = spreadBands(N_PLANES, 8, 44, 4);
    for(let i=0;i<N_PLANES;i++){
      const dur = rand(24,36);
      const plane = document.createElement('div');
      plane.className='sky-plane';
      plane.innerHTML = `<div class="plane-inner">${planeSVG()}</div>`;
      plane.style.top = planeTops[i].toFixed(1)+'%';
      plane.style.setProperty('--scale', (0.62 + rand(0,38)/100).toFixed(2));
      plane.style.animationDuration = dur+'s';
      plane.style.animationDelay = `-${(dur * (i + Math.random()*0.5) / N_PLANES).toFixed(1)}s`;
      layer.appendChild(plane);
    }

    /* --- PÁSSAROS --- */
    const N_BIRDS = 5;
    const birdTops = spreadBands(N_BIRDS, 10, 66, 5);
    for(let i=0;i<N_BIRDS;i++){
      const dur = rand(16,26);
      const bird = document.createElement('div');
      bird.className='sky-bird';
      bird.innerHTML = `<div class="bird-inner">${birdSVG()}</div>`;
      bird.style.top = birdTops[i].toFixed(1)+'%';
      bird.style.setProperty('--scale', (0.55 + rand(0,45)/100).toFixed(2));
      bird.style.setProperty('--flap', (0.34 + rand(0,16)/100).toFixed(2)+'s');
      bird.style.animationDuration = dur+'s';
      bird.style.animationDelay = `-${(dur * (i + Math.random()*0.5) / N_BIRDS).toFixed(1)}s`;
      layer.appendChild(bird);
    }
  }
}

function refreshScene(){ paintClouds(); }

/* ---------- MODAL / FEEDBACK helpers ---------- */
function showModal(html){
  $('#modal-root').innerHTML = `<div class="modal-overlay" id="modalOverlay">${html}</div>`;
}
function closeModal(){ $('#modal-root').innerHTML=''; }
function showFeedback(text, ok, duration=1200, spoken){
  const root = $('#feedback-root');
  root.innerHTML = `<div class="feedback-banner ${ok?'correct':'wrong'}" id="fbBanner">${text}</div>`;
  requestAnimationFrame(()=> $('#fbBanner') && $('#fbBanner').classList.add('show'));
  setTimeout(()=>{ const b=$('#fbBanner'); if(b) b.classList.remove('show'); }, duration-100);
  speak(spoken != null ? spoken : text);
}

/* ---------- APP STATE / ROUTER ---------- */
let session = null; // active phase session
let mp = null; // multiplayer session
let currentScreen = 'loading';

/* ao sair dessas telas a narração é interrompida (na tela de jogo ela termina sozinha) */
const LONG_SPEECH_SCREENS = ['start','progress','victory','defeat','finalResult','voices','tutorial'];
function goto(screen, data){
  if(LONG_SPEECH_SCREENS.includes(currentScreen)) stopSpeaking();
  currentScreen = screen; render(screen, data); window.scrollTo(0,0);
}

function render(screen, data){
  const app = $('#app');
  app.innerHTML = SCREENS[screen] ? SCREENS[screen](data) : '<p>Tela não encontrada.</p>';
  refreshScene();
  if(screen==='play' && session && !session.answered){
    startQuestionTimer(handleTimeUp);
  } else if(screen==='mpPlay' && mp && !mp.answered){
    startQuestionTimer(handleMpTimeUp);
  } else {
    clearQuestionTimer();
  }
}

/* ---------- ESTATÍSTICAS E FEEDBACK ---------- */
function plural(n, one, many){ return n === 1 ? one : many; }
function starsFor(wrong){ return wrong <= 0 ? 3 : (wrong === 1 ? 2 : 1); }
function starsHTML(n, max){
  max = max || 3; let h = '';
  for(let i=1;i<=max;i++) h += `<span class="st ${i<=n?'on':''}">★</span>`;
  return `<span class="stars" role="img" aria-label="${n} de ${max} estrelas">${h}</span>`;
}
function rankFor(steps, bonusDone){
  if(bonusDone) return {icon:'👑', name:'Lenda das Nuvens'};
  if(steps >= 4) return {icon:'🏆', name:'Mestre das Nuvens'};
  if(steps >= 2) return {icon:'🚀', name:'Capitão do Céu'};
  if(steps >= 1) return {icon:'🛩️', name:'Piloto de Nuvens'};
  return {icon:'🎈', name:'Explorador do Céu'};
}
function fmtSec(sec){ return sec.toFixed(1).replace('.', ','); }
function fmtDate(t){
  const d = new Date(t); const z = n=>String(n).padStart(2,'0');
  return `${z(d.getDate())}/${z(d.getMonth()+1)} ${z(d.getHours())}:${z(d.getMinutes())}`;
}

/* chamado a cada pergunta respondida */
function recordAnswerStats(topic, ok, timedOut, ms){
  const st = SAVE.stats;
  st.answered++;
  st.totalAnswerMs += ms;
  if(ok) st.totalCorrect++; else { st.totalWrong++; if(timedOut) st.totalTimeouts++; }
  const t = st.topics[topic] || (st.topics[topic] = {correct:0, wrong:0});
  if(ok) t.correct++; else t.wrong++;
}
/* chamado uma vez quando a fase termina (vitória ou derrota) */
function recordSessionEnd(result){
  const s = session; if(!s) return;
  const st = SAVE.stats;
  st.sessions++;
  if(result === 'win') st.wins++; else st.losses++;
  let run = 0, best = 0;
  (s.log||[]).forEach(e=>{ run = e.ok ? run+1 : 0; best = Math.max(best, run); });
  st.bestStreak = Math.max(st.bestStreak, best);
  if(s.kind === 'phase'){
    const ph = SAVE.progress.phases[s.phase];
    ph.plays = (ph.plays||0) + 1;
    ph.lastCorrect = s.correct; ph.lastWrong = s.wrong;
  } else {
    SAVE.progress.bonus.plays = (SAVE.progress.bonus.plays||0) + 1;
  }
  SAVE.history.unshift({
    t:Date.now(), kind:s.kind, phase:s.phase, diff:SAVE.difficulty, result,
    score:s.score, correct:s.correct, wrong:s.wrong,
    ms:(s.log||[]).reduce((a,e)=>a+e.ms, 0)
  });
  SAVE.history.length = Math.min(SAVE.history.length, HISTORY_MAX);
}

/* resumo de tudo que o jogador já fez (usado na tela inicial e no progresso) */
function overview(){
  const st = SAVE.stats, ph = SAVE.progress.phases, bonus = SAVE.progress.bonus;
  const doneCount = [1,2,3,4].filter(n=>ph[n].status === 'completed').length;
  const bonusDone = bonus.status === 'completed';
  const steps = doneCount + (bonusDone ? 1 : 0);
  const total = st.totalCorrect + st.totalWrong;
  const acc = total > 0 ? Math.round(st.totalCorrect / total * 100) : null;
  const avgSec = st.answered > 0 ? st.totalAnswerMs / st.answered / 1000 : null;
  const topics = Object.keys(TOPICS).map(id=>{
    const t = st.topics[id] || {correct:0, wrong:0};
    const n = t.correct + t.wrong;
    return Object.assign({id}, TOPICS[id], {correct:t.correct, wrong:t.wrong, n, acc: n ? Math.round(t.correct/n*100) : null});
  }).filter(t=>t.n > 0);
  const ranked = topics.filter(t=>t.n >= 3); // só opina com pelo menos 3 perguntas do assunto
  const best = ranked.filter(t=>t.acc >= 80).sort((a,b)=>b.acc-a.acc || b.n-a.n)[0] || null;
  const worst = ranked.filter(t=>t.acc < 70 && (!best || t.id !== best.id)).sort((a,b)=>a.acc-b.acc || b.n-a.n)[0] || null;
  const nextPhase = [1,2,3,4].find(n=>ph[n].status === 'unlocked') || null;
  return {
    name: SAVE.profile.name || 'Jogador', doneCount, bonusDone, steps, total, acc, avgSec, topics, best, worst,
    nextPhase, allDone: doneCount === 4, rank: rankFor(steps, bonusDone), score: SAVE.totalScore,
    correct: st.totalCorrect, wrong: st.totalWrong, streak: st.bestStreak
  };
}

/* texto do narrador: aparece no balão e é lido em voz alta */
function progressMessage(o, detailed){
  const n = o.name;
  if(o.steps === 0 && o.total === 0){
    return `👋 Oi, ${n}! Sua aventura ainda vai começar. Toque em Continuar para jogar a primeira fase!`;
  }
  const p = [];
  p.push(`👋 Oi, ${n}! Você é ${o.rank.name}.`);
  if(o.bonusDone) p.push('Você completou as 4 fases e o desafio bônus!');
  else if(o.doneCount === 0) p.push(`Você ainda não completou nenhuma fase, mas já respondeu ${o.total} ${plural(o.total,'pergunta','perguntas')}!`);
  else p.push(`Você completou ${o.doneCount} de 4 fases.`);
  p.push(`Você tem ${o.score} pontos.`);
  if(o.acc !== null) p.push(`🎯 Você acerta ${o.acc}% das perguntas.`);
  if(o.best) p.push(`💪 Você é craque em ${o.best.say}.`);
  if(o.worst) p.push(`🌱 Vamos treinar mais ${o.worst.say}?`);
  if(detailed){
    if(o.total > 0) p.push(`No total, foram ${o.correct} ${plural(o.correct,'acerto','acertos')} e ${o.wrong} ${plural(o.wrong,'erro','erros')}.`);
    if(o.avgSec !== null) p.push(`⏱️ Você leva em média ${fmtSec(o.avgSec)} segundos para responder.`);
    if(o.streak >= 2) p.push(`🔥 Sua maior sequência de acertos foi de ${o.streak}.`);
  }
  if(!o.allDone && o.nextPhase) p.push(`Sua próxima aventura é a fase ${o.nextPhase}.`);
  else if(o.allDone && !o.bonusDone) p.push('Que tal jogar o desafio bônus?');
  else if(o.bonusDone) p.push('Jogue de novo para bater seus recordes!');
  return p.join(' ');
}

/* ---- revisão de acertos e erros (fim de fase) ---- */
let reviewData = [];
let reviewFilter = 'all';
function spokenQ(e){
  const q = e.spoken || e.q;
  return /[.!?]$/.test(q) ? q : q + '.';
}
function reviewLine(e, i){
  const q = spokenQ(e);
  if(e.ok) return `Pergunta ${i+1}. ${q} Você acertou! A resposta é ${e.answer}.`;
  if(e.timedOut) return `Pergunta ${i+1}. ${q} O tempo acabou. A resposta certa é ${e.answer}.`;
  return `Pergunta ${i+1}. ${q} Você respondeu ${e.given}. A resposta certa é ${e.answer}.`;
}
function reviewSpeak(i){ if(reviewData[i]) speak(reviewLine(reviewData[i], i), {force:true}); }
function reviewSpeakAll(){
  const list = reviewData.map((e,i)=>({e,i})).filter(x=>
    reviewFilter === 'all' || (reviewFilter === 'ok' && x.e.ok) || (reviewFilter === 'bad' && !x.e.ok));
  if(!list.length) return;
  speak(list.map(x=>reviewLine(x.e, x.i)).join(' '), {force:true});
}
function reviewItemHTML(e, i){
  const badge = e.ok ? '✅' : (e.timedOut ? '⏰' : '❌');
  let ans;
  if(e.ok) ans = `<span class="rv-mine">Você respondeu <b>${esc(e.given)}</b></span>`;
  else if(e.timedOut) ans = `<span class="rv-mine">Tempo esgotado</span><span class="rv-right">Certo: <b>${esc(e.answer)}</b></span>`;
  else ans = `<span class="rv-mine">Você: <b>${esc(e.given)}</b></span><span class="rv-right">Certo: <b>${esc(e.answer)}</b></span>`;
  return `
  <div class="rv-item ${e.ok?'ok':'bad'}" data-ok="${e.ok?1:0}">
    <div class="rv-num">${i+1}</div>
    <div class="rv-body">
      <div class="rv-q">${esc(e.q)}</div>
      ${e.visual ? `<div class="rv-vis">${esc(e.visual)}</div>` : ''}
      <div class="rv-ans">${ans}</div>
    </div>
    <div class="rv-side">
      <span class="rv-badge" aria-hidden="true">${badge}</span>
      <button class="rv-say" onclick="reviewSpeak(${i})" aria-label="Ouvir a pergunta ${i+1}">🔊</button>
    </div>
  </div>`;
}
function reviewHTML(log){
  reviewData = log || [];
  reviewFilter = 'all';
  if(!reviewData.length) return '';
  const ok = reviewData.filter(e=>e.ok).length, bad = reviewData.length - ok;
  return `
  <div class="review">
    <div class="rv-head">
      <h3 class="rv-title">📋 Acertos e erros</h3>
      <div class="rv-actions">
        <button class="btn btn-outline btn-sm listen-btn" onclick="reviewSpeakAll()">🔊 Ouvir a lista</button>
        <button class="btn btn-coral btn-sm stop-btn" onclick="stopSpeaking()">⏹ Parar</button>
      </div>
    </div>
    <div class="rv-chips">
      <button class="rv-chip active" data-f="all" onclick="setReviewFilter('all')">Todas (${reviewData.length})</button>
      <button class="rv-chip" data-f="ok" onclick="setReviewFilter('ok')">✅ Acertos (${ok})</button>
      <button class="rv-chip" data-f="bad" onclick="setReviewFilter('bad')">❌ Erros (${bad})</button>
    </div>
    <div class="rv-list">${reviewData.map(reviewItemHTML).join('')}</div>
    <div class="rv-empty" id="rvEmpty"></div>
  </div>`;
}
function setReviewFilter(f){
  sfxClick();
  reviewFilter = f;
  document.querySelectorAll('.rv-chip').forEach(c=>c.classList.toggle('active', c.dataset.f === f));
  let visible = 0;
  document.querySelectorAll('.rv-item').forEach(it=>{
    const ok = it.dataset.ok === '1';
    const show = f === 'all' || (f === 'ok' && ok) || (f === 'bad' && !ok);
    it.classList.toggle('hide', !show);
    if(show) visible++;
  });
  const empty = $('#rvEmpty');
  if(empty){
    empty.classList.toggle('show', visible === 0);
    empty.textContent = f === 'bad' ? 'Nenhum erro! Você foi incrível! 🎉' : 'Nenhum acerto desta vez. Vamos tentar de novo! 💪';
  }
}

/* fala automática do fim de fase (vitória ou derrota) */
function endSpeech(result, s, fb, extra){
  const c = s.correct, w = s.wrong, log = s.log || [];
  const b = [];
  if(result === 'win') b.push(`${fb.title} ${fb.msg}`);
  else b.push('Ah, acabaram as suas vidas! Mas tudo bem, todo mundo erra.');
  if(c === 0) b.push(`Você errou ${w} ${plural(w,'pergunta','perguntas')}. Errar faz parte de aprender!`);
  else if(w === 0) b.push(`Você acertou ${c} ${plural(c,'pergunta','perguntas')} e não errou nenhuma!`);
  else b.push(`Você acertou ${c} ${plural(c,'pergunta','perguntas')} e errou ${w}.`);
  if(result === 'win' && extra && extra.stars) b.push(`Você ganhou ${extra.stars} ${plural(extra.stars,'estrela','estrelas')}!`);
  if(result === 'win' && extra && extra.record) b.push('Esse é um novo recorde nesta fase!');
  const errs = log.map((e,i)=>({e,i})).filter(x=>!x.e.ok);
  if(errs.length){
    b.push(result === 'win' ? 'Vamos ver o que você errou?' : 'Vamos ver o que aconteceu, para você treinar?');
    errs.slice(0,2).forEach(x=>b.push(reviewLine(x.e, x.i)));
    if(errs.length > 2){
      const more = errs.length - 2;
      b.push(`E teve mais ${more} ${plural(more,'pergunta','perguntas')} na lista. Toque no alto-falante para ouvir.`);
    }
  }
  if(result !== 'win') b.push('Tente de novo! Eu acredito em você.');
  return b.join(' ');
}

/* ---------- SCREENS ---------- */
const SCREENS = {};

/* ---- painel de progresso (tela inicial) ---- */
function phaseChipsHTML(){
  const p = SAVE.progress.phases, b = SAVE.progress.bonus;
  const chips = [1,2,3,4].map(n=>{
    const st = p[n].status;
    const cls = st === 'completed' ? 'done' : (st === 'locked' ? 'locked' : 'current');
    const ico = st === 'locked' ? '🔒' : PHASE_INFO[n].icon;
    const extra = st === 'completed'
      ? (p[n].bestStars > 0 ? starsHTML(p[n].bestStars) : '<span class="pc-ok">✅</span>')
      : (st === 'unlocked' ? '<span class="pc-ok">▶️</span>' : '');
    return `<div class="pchip ${cls}"><span class="pc-ico">${ico}</span><span class="pc-lab">Fase ${n}</span>${extra}</div>`;
  });
  const bc = b.status === 'completed' ? 'done' : (b.status === 'locked' ? 'locked' : 'current');
  const bStars = (b.status === 'completed' && b.result && b.result.stars) ? starsHTML(b.result.stars)
    : (b.status === 'completed' ? '<span class="pc-ok">✅</span>' : (b.status === 'unlocked' ? '<span class="pc-ok">▶️</span>' : ''));
  chips.push(`<div class="pchip ${bc}"><span class="pc-ico">${b.status==='locked'?'🔒':'🏆'}</span><span class="pc-lab">Bônus</span>${bStars}</div>`);
  return `<div class="phase-chips">${chips.join('')}</div>`;
}
function narratorRowHTML(msg){
  const ch = currentVoiceChar();
  return `
  <div class="mascot-row narrator">
    <div class="mascot live" aria-hidden="true">${ch.emoji}</div>
    <div class="speech"><strong>${esc(ch.name)}</strong><br>${esc(msg)}</div>
  </div>`;
}
function dashboardHTML(o, msg){
  const pct = Math.round(o.steps / 5 * 100);
  return `
  <div class="cloud-card dash">
    <div class="dash-head">
      <div class="dash-avatar" aria-hidden="true">${SAVE.profile.avatar}</div>
      <div class="dash-who">
        <div class="dash-name">${esc(o.name)}</div>
        <div class="dash-rank">${o.rank.icon} ${o.rank.name}</div>
      </div>
      <div class="pill">${DIFF_LABEL[SAVE.difficulty] || ''}</div>
    </div>
    <div class="dash-journey">
      <div class="dash-jl"><span>Minha jornada</span><b>${o.steps} de 5 etapas</b></div>
      <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${o.steps}"><div class="progress-fill" style="width:${pct}%;"></div></div>
    </div>
    ${phaseChipsHTML()}
    <div class="mini-stats">
      <div class="mini"><div class="m-ico">⭐</div><div class="m-num">${o.score}</div><div class="m-lab">Pontos</div></div>
      <div class="mini"><div class="m-ico">🎯</div><div class="m-num">${o.acc !== null ? o.acc + '%' : '—'}</div><div class="m-lab">Acertos</div></div>
      <div class="mini"><div class="m-ico">🔥</div><div class="m-num">${o.streak || '—'}</div><div class="m-lab">Sequência</div></div>
    </div>
    ${narratorRowHTML(msg)}
    <div class="row dash-actions">
      <button class="btn btn-outline btn-sm listen-btn" onclick="sayKey('home')">🔊 Ouvir</button>
      <button class="btn btn-coral btn-sm stop-btn" onclick="stopSpeaking()">⏹ Parar</button>
      <button class="btn btn-outline btn-sm" onclick="openVoices('start')">🎭 Trocar voz</button>
      <button class="btn btn-primary btn-sm" onclick="openProgress('start')">📊 Ver tudo</button>
    </div>
  </div>`;
}
function welcomeHTML(msg){
  return `
  <div class="cloud-card dash">
    ${narratorRowHTML(msg)}
    <div class="row dash-actions">
      <button class="btn btn-outline btn-sm listen-btn" onclick="sayKey('home')">🔊 Ouvir</button>
      <button class="btn btn-coral btn-sm stop-btn" onclick="stopSpeaking()">⏹ Parar</button>
      <button class="btn btn-outline btn-sm" onclick="openVoices('start')">🎭 Trocar voz</button>
    </div>
  </div>`;
}

/* a fala da tela inicial só toca sozinha depois do 1º toque do jogador (regra do navegador) */
let lastHomeSpeechAt = 0;
function maybeSpeakHome(msg){
  SPEECH_REG.home = msg;
  if(!userInteracted || !SAVE.settings.readAloudOn) return;
  if(Date.now() - lastHomeSpeechAt < 15000) return; // não repete se voltou rápido
  lastHomeSpeechAt = Date.now();
  speakSoon(msg, 'start', 350);
}

SCREENS.start = function(){
  const canContinue = hasSavedGame && SAVE.profile && SAVE.profile.name;
  let top;
  if(canContinue){
    const o = overview();
    const msg = progressMessage(o, false);
    top = dashboardHTML(o, msg);
    maybeSpeakHome(msg);
  } else {
    const ch = currentVoiceChar();
    const msg = `👋 Oi! Eu sou ${ch.art} ${ch.name}. Toque em Novo Jogo para começar a sua aventura!`;
    top = welcomeHTML(msg);
    maybeSpeakHome(msg);
  }
  return `
  <div class="screen">
    <div class="logo-wrap">
      <h1>☁️ Matemática nas Nuvens</h1>
      <div class="sub">Voe entre as nuvens aprendendo matemática!</div>
    </div>
    ${top}
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
  const keepSettings = SAVE.settings; // música, volume e voz do narrador continuam como estavam
  SAVE = defaultSave();
  SAVE.settings = keepSettings;
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
      <button class="btn btn-outline" onclick="goto('start')">⌂ Tela inicial</button>
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
  hasSavedGame = true;
  persistNow();
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
      <button class="btn btn-outline" onclick="goto('start')">⌂ Tela inicial</button>
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
  'Oi! Eu sou {art} {nome}, seu guia nas nuvens! Vamos aprender juntos?',
  'Em cada fase, você responde perguntas de matemática tocando na resposta certa.',
  'Você começa cada fase com 3 corações ❤️❤️❤️. Errar tira um coração.',
  'Acertar te dá pontos ⭐! Complete a fase para liberar a próxima nuvem no mapa.',
  'No fim de cada fase eu mostro o que você acertou e o que errou, para você treinar. Seu progresso é salvo automaticamente!'
];
function tutText(i){
  const c = currentVoiceChar();
  return TUT_SLIDES[i].replace('{art}', c.art).replace('{nome}', c.name);
}
let tutIndex=0;
SCREENS.tutorial = function(data){
  if(!(data && data.keep)) tutIndex=0;
  return renderTutSlide();
};
function renderTutSlide(){
  const text = tutText(tutIndex);
  const ch = currentVoiceChar();
  SPEECH_REG.tut = text;
  setTimeout(()=>{ if(currentScreen==='tutorial') speak(text); }, 150); // pequena pausa para não cortar o clique/transição
  return `
  <div class="screen">
    <h2 style="color:#fff;">Como jogar</h2>
    <div class="cloud-card stack">
      <div class="mascot-row">
        <div class="mascot live">${ch.emoji}</div>
        <div class="speech">${text}</div>
        <button class="btn btn-icon btn-outline" onclick="sayKey('tut')" aria-label="Ouvir novamente">🔊</button>
      </div>
      <div class="tutorial-dots">
        ${TUT_SLIDES.map((_,i)=>`<span class="dot ${i===tutIndex?'active':''}"></span>`).join('')}
      </div>
      <button class="btn btn-ghost" onclick="openVoices('tutorial')">🎭 Trocar a voz do narrador</button>
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
function skipTutorial(){ sfxClick(); stopSpeaking(); finishTutorial(); }
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
      <div class="game-actions">
        <button class="btn btn-icon btn-outline" onclick="openProgress('map')" aria-label="Meu progresso" title="Meu progresso">📊</button>
        <button class="btn btn-icon btn-outline" onclick="goto('settings',{from:'map'})" aria-label="Configurações">⚙️</button>
        <button class="btn btn-outline" style="width:auto; min-height:52px; padding:10px 16px;" onclick="goto('start')">⌂ Tela inicial</button>
      </div>
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
    log:[], startedAt: Date.now(), qStartedAt: Date.now(), answered:false
  };
  persistSession();
  goto('play');
}
function startBonus(){
  session = {
    kind:'bonus', phase:'bonus', index:0, lives:START_LIVES, score:0,
    correct:0, wrong:0, questions: buildBonusSet(SAVE.difficulty, BONUS_QUESTIONS),
    log:[], startedAt: Date.now(), qStartedAt: Date.now(), answered:false
  };
  persistSession();
  goto('play');
}
function resumePhase(){
  const s = SAVE.currentPhaseInProgress;
  if(!s){ goto('map'); return; }
  session = s;
  session.log = session.log || []; // saves antigos não tinham o registro de respostas
  session.qStartedAt = Date.now();
  if(session.answered){
    /* o jogador saiu logo depois de responder: a resposta já valeu, segue para a próxima */
    session.answered = false;
    if(session.lives <= 0){ recordSessionEnd('lose'); goto('defeat'); return; }
    session.index++;
    if(session.index >= session.questions.length){ finishSession(); return; }
  }
  goto('play');
}
  function persistSession(){
  if(!session) return;
  SAVE.currentPhaseInProgress = {
  ...session,
  questions: session.questions.map(q=>({...q, options:q.options ? [...q.options] : undefined}))
  };
  hasSavedGame = !!(SAVE.profile && SAVE.profile.name);
  persistNow();
  }
  function returnToMap(){
  sfxClick();
  persistSession();
  showModal(`<div class="modal-card"><div class="center-emoji">🗺️</div><h3>Voltar ao mapa?</h3><p>Seu progresso nesta fase será salvo para você continuar depois.</p><div class="stack"><button class="btn btn-mint" onclick="closeModal(); goto('map');">Voltar ao mapa</button><button class="btn btn-outline" onclick="closeModal();">Continuar jogando</button></div></div>`);
  }
  function returnToStart(){
  sfxClick();
  persistSession();
  showModal(`<div class="modal-card"><div class="center-emoji">🏠</div><h3>Voltar à tela inicial?</h3><p>Seu progresso nesta fase será salvo. Você poderá continuar depois pelo botão Continuar.</p><div class="stack"><button class="btn btn-mint" onclick="closeModal(); goto('start');">Voltar ao início</button><button class="btn btn-outline" onclick="closeModal();">Continuar jogando</button></div></div>`);
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
  <div class="game-actions">
  <button class="btn btn-icon btn-outline" onclick="returnToStart()" aria-label="Voltar à tela inicial" title="Tela inicial">⌂</button>
  <button class="btn btn-icon btn-outline" onclick="returnToMap()" aria-label="Voltar ao mapa" title="Voltar ao mapa">←</button>
  <button class="btn btn-icon btn-outline" onclick="pauseGame()" aria-label="Pausar">⏸️</button>
  </div>
      <div class="pill">${title}</div>
      <div class="lives" aria-label="Vidas restantes: ${session.lives} de 3">
        ${[0,1,2].map(i=>`<span class="heart ${i<session.lives?'':'lost'}">❤️</span>`).join('')}
      </div>
    </div>
    <div class="cloud-card question-box">
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div class="pill" style="display:inline-flex; margin:0 auto 2px;">${SAVE.profile.avatar} ${esc(SAVE.profile.name||'Jogador')}</div>
      ${timerRowHTML()}
      <div class="q-badge">Pergunta ${session.index+1} de ${total} · ⭐ ${session.score} pts</div>
      <div class="q-text">${esc(q.text)} <button class="btn btn-icon btn-outline" style="width:36px;height:36px;min-height:36px;font-size:16px;vertical-align:middle;" onclick="sayQuestion(session.questions[session.index])" aria-label="Ouvir a pergunta">🔊</button></div>
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
  resolveAnswer(correct, false, val);
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
  resolveAnswer(correct, false, val);
}

function handleTimeUp(){
  if(!session || session.answered) return;
  session.answered = true;
  const q = session.questions[session.index];
  document.querySelectorAll('.opt-btn').forEach(b=>{
    b.disabled = true;
    if(b.dataset.val===String(q.answer)) b.classList.add('correct');
  });
  const input = $('#numInput'); if(input) input.disabled = true;
  resolveAnswer(false, true, null);
}
function resolveAnswer(correct, timedOut, given){
  clearQuestionTimer();
  const q = session.questions[session.index];
  const elapsed = Date.now() - session.qStartedAt;
  const ms = Math.max(0, Math.min(elapsed, TIME_LIMIT*1000));
  /* guarda a resposta para o feedback (fim da fase e tela de progresso) */
  session.log = session.log || [];
  session.log.push({
    q:q.text, spoken:q.spoken||null, visual:q.visual||null, topic:q.topic||'outros',
    answer:String(q.answer), given:(timedOut || given==null) ? null : String(given),
    ok:!!correct, timedOut:!!timedOut, ms
  });
  recordAnswerStats(q.topic||'outros', !!correct, !!timedOut, ms);
  let delay = 1200;
  if(correct){
    sfxCorrect();
    let pts = 100;
    if(elapsed < 5000) pts += 20;
    session.score += pts;
    session.correct++;
    const okMsg = pick(CORRECT_MSGS);
    showFeedback(okMsg+' +'+pts, true, delay, okMsg);
  } else {
    sfxWrong();
    session.lives--;
    session.wrong++;
    delay = 2400;
    const msg = timedOut
      ? `⏰ Tempo esgotado! A resposta certa era ${q.answer}.`
      : `${pick(WRONG_MSGS)} A resposta certa era ${q.answer}.`;
    showFeedback(msg, false, delay);
  }
  persistSession();
  setTimeout(()=>{
    if(!session) return; // o jogador já saiu da fase
    if(session.lives<=0){ recordSessionEnd('lose'); goto('defeat'); return; }
    session.index++;
    session.answered=false;
    if(session.index>=session.questions.length){
      finishSession();
    } else {
      session.qStartedAt = Date.now();
      persistSession();
      goto('play');
    }
  }, delay);
}

function finishSession(){
  sfxWin();
  if(session.kind==='phase'){
    const n = session.phase;
    const ph = SAVE.progress.phases[n];
    const prevBest = ph.bestScore || 0;
    const bonusPts = 100 + session.lives*30;
    session.score += bonusPts;
    const stars = starsFor(session.wrong);
    const record = prevBest > 0 && session.score > prevBest;
    SAVE.totalScore += session.score;
    SAVE.bestScore = Math.max(SAVE.bestScore, SAVE.totalScore);
    ph.status='completed';
    ph.bestScore = Math.max(prevBest, session.score);
    ph.bestStars = Math.max(ph.bestStars||0, stars);
    ph.attempts++;
    if(n<4 && SAVE.progress.phases[n+1].status==='locked') SAVE.progress.phases[n+1].status='unlocked';
    if(n===4) SAVE.progress.bonus.status='unlocked';
    recordSessionEnd('win');
    SAVE.currentPhaseInProgress = null;
    persist();
    goto('victory', {bonusPts, stars, record});
  } else {
    const stars = starsFor(session.wrong);
    SAVE.totalScore += session.score;
    SAVE.bestScore = Math.max(SAVE.bestScore, SAVE.totalScore);
    SAVE.progress.bonus.status='completed';
    SAVE.progress.bonus.result = {score:session.score, correct:session.correct, wrong:session.wrong, stars, time: Date.now()-session.startedAt};
    recordSessionEnd('win');
    SAVE.currentPhaseInProgress = null;
    persist();
    goto('finalResult', {stars});
  }
}

/* ---- PAUSE ---- */
function pauseGame(){
  sfxClick();
  clearQuestionTimer();
  showModal(`
    <div class="modal-card">
      <div class="center-emoji">⏸️</div>
      <h3>Jogo pausado</h3>
      <div class="stack">
        <button class="btn btn-mint" onclick="closeModal(); resumeQuestionTimer();">Continuar</button>
        <button class="btn btn-outline" onclick="closeModal(); goto('settings',{from:'play'});">⚙️ Configurações</button>
        <button class="btn btn-outline" onclick="closeModal(); persistSession(); goto('map');">💾 Salvar e sair</button>
      </div>
    </div>`);
}

function phaseFeedbackText(correct, wrong){
  const total = correct+wrong;
  const acc = total>0 ? correct/total : 1;
  if(acc>=1) return {emoji:'🏆', title:'Perfeito!', msg:'Você acertou todas as perguntas! Desempenho incrível, parabéns!'};
  if(acc>=0.9) return {emoji:'🌟', title:'Desempenho incrível!', msg:'Você acertou quase tudo! Está dominando essa matemática muito bem.'};
  if(acc>=0.7) return {emoji:'🎉', title:'Muito bom!', msg:'Você acertou a maior parte das perguntas. Continue assim!'};
  if(acc>=0.5) return {emoji:'💪', title:'Bom trabalho!', msg:'Você está no caminho certo. Praticando mais um pouco, vai ficar ainda melhor.'};
  return {emoji:'🌤️', title:'Você conseguiu!', msg:'Essa fase foi mais difícil, mas você não desistiu. Vamos praticar mais essas contas na próxima tentativa?'};
}

/* ---- VICTORY ---- */
function endBubbleHTML(emojiTitle, fb){
  const ch = currentVoiceChar();
  return `
  <div class="mascot-row" style="margin-top:14px; text-align:left;">
    <div class="mascot live" aria-hidden="true">${ch.emoji}</div>
    <div class="speech"><strong>${emojiTitle} ${fb.title}</strong><br>${fb.msg}</div>
    <div class="say-col">
      <button class="btn btn-icon btn-outline listen-btn" onclick="sayKey('end')" aria-label="Ouvir novamente">🔊</button>
      <button class="btn btn-icon btn-coral stop-btn" onclick="stopSpeaking()" aria-label="Parar">⏹</button>
    </div>
  </div>`;
}
SCREENS.victory = function(data){
  data = data || {};
  const s = session;
  const fb = phaseFeedbackText(s.correct, s.wrong);
  const spoken = endSpeech('win', s, fb, data);
  SPEECH_REG.end = spoken;
  speakSoon(spoken, 'victory', 300);
  return `
  <div class="screen">
    <div class="cloud-card" style="text-align:center;">
      <div class="center-emoji">🎉</div>
      <h2>Fase concluída!</h2>
      <div class="big-stars">${starsHTML(data.stars || starsFor(s.wrong))}</div>
      ${data.record ? '<div class="record-badge">🏅 Novo recorde nesta fase!</div>' : ''}
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${s.score}</div><div class="lab">Pontos</div></div>
        <div class="stat-box"><div class="num">${s.correct}</div><div class="lab">Acertos</div></div>
        <div class="stat-box"><div class="num">${s.wrong}</div><div class="lab">Erros</div></div>
        <div class="stat-box"><div class="num">${s.lives}</div><div class="lab">Vidas restantes</div></div>
      </div>
      ${endBubbleHTML(fb.emoji, fb)}
      ${reviewHTML(s.log)}
      <button class="btn btn-primary" style="margin-top:16px;" onclick="session=null; goto('map');">Continuar</button>
    </div>
  </div>`;
};

/* ---- DEFEAT ---- */
SCREENS.defeat = function(){
  persistDefeat();
  const s = session || {correct:0, wrong:0, score:0, log:[], kind:'phase'};
  const fb = {title:'Vamos treinar!', msg: s.correct > 0
    ? `Você acertou ${s.correct} ${plural(s.correct,'pergunta','perguntas')} antes de acabarem as vidas. Veja abaixo o que dá para melhorar.`
    : 'Veja abaixo o que aconteceu. Errar faz parte de aprender!'};
  const spoken = endSpeech('lose', s, fb);
  SPEECH_REG.end = spoken;
  speakSoon(spoken, 'defeat', 300);
  return `
  <div class="screen">
    <div class="cloud-card" style="text-align:center;">
      <div class="center-emoji">☁️💧</div>
      <h2>Você perdeu todas as suas vidas!</h2>
      <p style="color:var(--ink-soft); font-weight:600;">Sem problemas, todo mundo erra! Tente de novo.</p>
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${s.correct}</div><div class="lab">Acertos</div></div>
        <div class="stat-box"><div class="num">${s.wrong}</div><div class="lab">Erros</div></div>
      </div>
      ${endBubbleHTML('🌱', fb)}
      ${reviewHTML(s.log)}
      <div class="stack" style="margin-top:16px;">
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
SCREENS.finalResult = function(data){
  data = data || {};
  const r = SAVE.progress.bonus.result;
  const allDone = [1,2,3,4].every(n=>SAVE.progress.phases[n].status==='completed');
  const fb = r ? phaseFeedbackText(r.correct, r.wrong) : {emoji:'🏆', title:'Jornada concluída!', msg:'Você chegou até o final. Muito bem!'};
  const s = (session && session.kind === 'bonus') ? session : null;
  const stars = data.stars || (r && r.stars) || 0;
  const spoken = s ? endSpeech('win', s, fb, {stars}) : `${fb.title} ${fb.msg}`;
  SPEECH_REG.end = spoken;
  speakSoon(spoken, 'finalResult', 300);
  return `
  <div class="screen">
    <div class="cloud-card" style="text-align:center;">
      <div class="center-emoji">☁️🏆☁️</div>
      <h2>PARABÉNS!</h2>
      <p style="font-weight:700;">Você completou sua jornada matemática!</p>
      ${stars ? `<div class="big-stars">${starsHTML(stars)}</div>` : ''}
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${SAVE.totalScore}</div><div class="lab">Pontuação total</div></div>
        <div class="stat-box"><div class="num">${SAVE.bestScore}</div><div class="lab">Melhor pontuação</div></div>
        <div class="stat-box"><div class="num">${allDone?'4/4':'—'}</div><div class="lab">Fases concluídas</div></div>
        <div class="stat-box"><div class="num">${r?r.correct+'/'+(r.correct+r.wrong):'—'}</div><div class="lab">Resultado do bônus</div></div>
      </div>
      ${endBubbleHTML(fb.emoji, fb)}
      ${s ? reviewHTML(s.log) : ''}
      <button class="btn btn-primary" style="margin-top:16px;" onclick="session=null; goto('map')">Voltar ao mapa</button>
    </div>
  </div>`;
};

/* ---- SETTINGS ---- */
let settingsBack = 'start';
SCREENS.settings = function(data){
  const back = (data&&data.from)||'start';
  settingsBack = back;
  const s = SAVE.settings;
  const vc = currentVoiceChar();
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
        <div class="setting-row music-choice-row">
          <label for="musicTrack">Melodia</label>
          <select id="musicTrack" onchange="updateMusicTrack(this.value)">
            <option value="random" ${s.musicTrack==='random'?'selected':''}>Aleatória</option>
            ${MUSIC_TRACKS.map((track, index)=>`<option value="${index}" ${String(s.musicTrack)===String(index)?'selected':''}>${track.name}</option>`).join('')}
          </select>
          <button class="btn btn-outline music-next" onclick="changeMusic()" aria-label="Trocar música">Próxima</button>
        </div>
        <div class="setting-row">
          <label for="sfxOn">Efeitos sonoros</label>
          <label class="switch"><input type="checkbox" id="sfxOn" ${s.sfxOn?'checked':''} onchange="toggleSetting('sfxOn', this.checked)"><span class="slider-toggle"></span></label>
        </div>
        <div class="setting-row">
          <label for="sfxVol">Volume dos efeitos</label>
          <input type="range" id="sfxVol" min="0" max="1" step="0.05" value="${s.sfxVol}" oninput="updateSetting('sfxVol', parseFloat(this.value))">
        </div>
        <div class="setting-row">
          <label for="readAloudOn">🔊 Ler feedbacks e tutorial em voz alta</label>
          <label class="switch"><input type="checkbox" id="readAloudOn" ${s.readAloudOn?'checked':''} onchange="toggleReadAloud(this.checked)"><span class="slider-toggle"></span></label>
        </div>
        <div class="setting-row">
          <label>🎭 Voz do narrador</label>
          <button class="btn btn-outline btn-sm" style="width:auto;" onclick="openVoices('settings')">${vc.emoji} ${esc(vc.name)}</button>
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
function updateMusicTrack(value){
  SAVE.settings.musicTrack = value;
  persist();
  startMusic();
  sfxClick();
}
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
  goto('settings', {from: settingsBack});
}
function closeSettings(back){
  sfxClick();
  goto(back==='play' && session ? 'play' : back);
}

/* ---- ESCOLHA DE VOZ DO NARRADOR ---- */
let voicesReturn = {screen:'start', data:undefined};
function openVoices(from){
  sfxClick();
  if(from === 'settings') voicesReturn = {screen:'settings', data:{from:settingsBack}};
  else if(from === 'tutorial') voicesReturn = {screen:'tutorial', data:{keep:true}};
  else voicesReturn = {screen:'start', data:undefined};
  goto('voices');
}
function closeVoices(){
  sfxClick();
  goto(voicesReturn.screen, voicesReturn.data);
}
function escAttr(x){ return String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function deviceVoiceSelectHTML(){
  const list = ptVoices();
  if(!list.length){
    return '<p class="note">Não encontrei vozes em português neste aparelho ainda. O navegador vai usar a voz padrão dele.</p>';
  }
  return `<select id="deviceVoice" onchange="pickDeviceVoice(this.value)" aria-label="Voz do aparelho">
    <option value="auto">Automática (recomendado)</option>
    ${list.map(v=>`<option value="${escAttr(v.voiceURI)}" ${SAVE.settings.voiceURI===v.voiceURI?'selected':''}>${esc(v.name)} (${esc(v.lang)})${v.localService?'':' · online'}</option>`).join('')}
  </select>`;
}
function pickVoiceChar(id){
  const ch = VOICE_CHARS.find(v=>v.id === id); if(!ch) return;
  SAVE.settings.voiceChar = id;
  persist();
  sfxClick();
  document.querySelectorAll('.voice-card').forEach(el=>{
    const on = el.dataset.id === id;
    el.classList.toggle('selected', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  speak(ch.sample, {force:true});
}
function pickDeviceVoice(uri){
  SAVE.settings.voiceURI = uri || 'auto';
  persist();
  sfxClick();
  speak(currentVoiceChar().sample, {force:true});
}
SCREENS.voices = function(){
  const cur = currentVoiceChar();
  const s = SAVE.settings;
  return `
  <div class="screen">
    <h2 style="color:#fff; text-shadow:0 3px 0 rgba(35,50,86,.25);">Voz do narrador 🎭</h2>
    <div class="cloud-card stack">
      <p class="voice-intro">Toque em um personagem para ouvir e escolher quem vai falar com você!</p>
      ${ttsSupported() ? '' : '<div class="note warn">Este navegador não tem voz falada. Tente abrir o jogo no Chrome ou no Edge.</div>'}
      <div class="setting-row">
        <label for="voiceReadOn">🔊 Narração ligada</label>
        <label class="switch"><input type="checkbox" id="voiceReadOn" ${s.readAloudOn?'checked':''} onchange="toggleReadAloud(this.checked)"><span class="slider-toggle"></span></label>
      </div>
      <div class="voice-grid">
        ${VOICE_CHARS.map(v=>`
          <button class="voice-card ${v.id===cur.id?'selected':''}" data-id="${v.id}" aria-pressed="${v.id===cur.id}" onclick="pickVoiceChar('${v.id}')">
            <span class="vc-emoji" aria-hidden="true">${v.emoji}</span>
            <span class="vc-name">${esc(v.name)}</span>
            <span class="vc-desc">${esc(v.desc)}</span>
          </button>`).join('')}
      </div>
      <details class="voice-adv">
        <summary>⚙️ Voz do aparelho (avançado)</summary>
        <div id="deviceVoiceBox">${deviceVoiceSelectHTML()}</div>
        <p class="note">Os personagens mudam o tom e a velocidade da voz do seu aparelho. Se ficarem parecidos, escolha outra voz aqui, ou abra o jogo em outro navegador (Edge e Chrome têm boas vozes em português).</p>
      </details>
      <button class="btn btn-primary" onclick="closeVoices()">Pronto ✅</button>
    </div>
  </div>`;
};

/* ---- PROGRESSO COMPLETO ---- */
let progressBack = 'start';
function openProgress(from){
  sfxClick();
  progressBack = from === 'map' ? 'map' : 'start';
  goto('progress');
}
function tileHTML(ico, num, lab){
  return `<div class="stat-box"><div class="num">${ico} ${num}</div><div class="lab">${lab}</div></div>`;
}
function phaseCardHTML(n){
  const ph = SAVE.progress.phases[n], info = PHASE_INFO[n];
  const st = ph.status;
  const state = st === 'completed' ? '✅ Concluída' : (st === 'locked' ? '🔒 Bloqueada' : '▶️ Disponível');
  const stars = st === 'completed' && ph.bestStars > 0 ? starsHTML(ph.bestStars) : '';
  let detail = '';
  if(st !== 'locked'){
    const bits = [];
    if(ph.bestScore > 0) bits.push(`Melhor: <b>${ph.bestScore}</b> pts`);
    if(ph.plays > 0) bits.push(`Jogadas: <b>${ph.plays}</b>`);
    else if(ph.attempts > 0) bits.push(`Vitórias: <b>${ph.attempts}</b>`);
    if(ph.lastCorrect !== null && ph.lastCorrect !== undefined) bits.push(`Última: <b>${ph.lastCorrect}</b> ✅ <b>${ph.lastWrong}</b> ❌`);
    detail = bits.length ? bits.join(' · ') : 'Ainda não jogou esta fase.';
  }
  return `
  <div class="ph-card ${st}">
    <div class="ph-ico">${st==='locked'?'🔒':info.icon}</div>
    <div class="ph-body">
      <div class="ph-title">Fase ${n} — ${info.name}</div>
      <div class="ph-state">${state} ${stars}</div>
      ${detail ? `<div class="ph-detail">${detail}</div>` : ''}
    </div>
  </div>`;
}
function bonusCardHTML(){
  const b = SAVE.progress.bonus;
  const state = b.status === 'completed' ? '✅ Concluído' : (b.status === 'locked' ? '🔒 Bloqueado' : '▶️ Disponível');
  const r = b.result;
  const stars = (b.status === 'completed' && r && r.stars) ? starsHTML(r.stars) : '';
  let detail = '';
  if(r) detail = `Último: <b>${r.correct}</b> ✅ <b>${r.wrong}</b> ❌ · <b>${r.score}</b> pts` + (b.plays ? ` · Jogadas: <b>${b.plays}</b>` : '');
  else if(b.status !== 'locked') detail = 'Ainda não jogou o bônus.';
  return `
  <div class="ph-card ${b.status}">
    <div class="ph-ico">${b.status==='locked'?'🔒':'🏆'}</div>
    <div class="ph-body">
      <div class="ph-title">Desafio Bônus</div>
      <div class="ph-state">${state} ${stars}</div>
      ${detail ? `<div class="ph-detail">${detail}</div>` : ''}
    </div>
  </div>`;
}
function topicsHTML(o){
  if(!o.topics.length) return '<p class="note">Jogue uma fase e eu mostro aqui como você está em cada assunto!</p>';
  return `<div class="tp-list">${o.topics.map(t=>{
    const cls = t.acc >= 80 ? 'good' : (t.acc >= 50 ? 'mid' : 'low');
    return `
    <div class="tp-row">
      <div class="tp-name"><span aria-hidden="true">${t.emoji}</span> ${t.label}</div>
      <div class="tp-bar" role="img" aria-label="${t.acc}% de acertos em ${t.label}"><div class="tp-fill ${cls}" style="width:${Math.max(t.acc,4)}%;"></div></div>
      <div class="tp-val">${t.correct}/${t.n}</div>
    </div>`;}).join('')}</div>
    <div class="tp-legend"><span><i class="lg good"></i>Craque</span><span><i class="lg mid"></i>Quase lá</span><span><i class="lg low"></i>Vamos treinar</span></div>`;
}
function historyHTML(){
  if(!SAVE.history.length) return '<p class="note">Suas últimas jogadas vão aparecer aqui.</p>';
  return `<div class="hs-list">${SAVE.history.slice(0,8).map(h=>{
    const label = h.kind === 'bonus' ? '🏆 Bônus' : `${(PHASE_INFO[h.phase]||{}).icon||''} Fase ${h.phase}`;
    const win = h.result === 'win';
    return `
    <div class="hs-item ${win?'win':'lose'}">
      <div class="hs-when">${fmtDate(h.t)}</div>
      <div class="hs-what"><b>${label}</b> · ${DIFF_LABEL[h.diff]||''}</div>
      <div class="hs-res">${win?'✅ Concluída':'❌ Perdeu'}</div>
      <div class="hs-nums">${h.correct} ✅ ${h.wrong} ❌ · ${h.score} pts</div>
    </div>`;}).join('')}</div>`;
}
SCREENS.progress = function(){
  const o = overview();
  const msg = progressMessage(o, true);
  SPEECH_REG.progress = msg;
  speakSoon(msg, 'progress', 350);
  const st = SAVE.stats;
  return `
  <div class="screen">
    <div class="top-bar">
      <div class="pill">${SAVE.profile.avatar} ${esc(o.name)}</div>
      <div class="pill">${o.rank.icon} ${o.rank.name}</div>
    </div>
    <h2 style="color:#fff; text-shadow:0 3px 0 rgba(35,50,86,.25); margin:0;">📊 Meu progresso</h2>

    <div class="cloud-card">
      ${narratorRowHTML(msg)}
      <div class="row dash-actions" style="margin-top:12px;">
        <button class="btn btn-outline btn-sm listen-btn" onclick="sayKey('progress')">🔊 Ouvir</button>
        <button class="btn btn-coral btn-sm stop-btn" onclick="stopSpeaking()">⏹ Parar</button>
        <button class="btn btn-outline btn-sm" onclick="openVoices('start')">🎭 Trocar voz</button>
      </div>
    </div>

    <div class="cloud-card">
      <h3 class="sec-title">Resumo</h3>
      <div class="stat-grid">
        ${tileHTML('⭐', o.score, 'Pontos totais')}
        ${tileHTML('🏆', SAVE.bestScore, 'Melhor pontuação')}
        ${tileHTML('✅', o.correct, 'Acertos')}
        ${tileHTML('❌', o.wrong, 'Erros')}
        ${tileHTML('🎯', o.acc !== null ? o.acc + '%' : '—', 'Aproveitamento')}
        ${tileHTML('⏱️', o.avgSec !== null ? fmtSec(o.avgSec) + 's' : '—', 'Tempo por resposta')}
        ${tileHTML('🔥', o.streak || '—', 'Maior sequência')}
        ${tileHTML('🎮', st.sessions ? `${st.wins}/${st.sessions}` : '—', 'Fases vencidas')}
      </div>
    </div>

    <div class="cloud-card">
      <h3 class="sec-title">Minhas fases</h3>
      <div class="ph-list">
        ${[1,2,3,4].map(phaseCardHTML).join('')}
        ${bonusCardHTML()}
      </div>
    </div>

    <div class="cloud-card">
      <h3 class="sec-title">Como estou em cada assunto</h3>
      ${topicsHTML(o)}
    </div>

    <div class="cloud-card">
      <h3 class="sec-title">Últimas jogadas</h3>
      ${historyHTML()}
    </div>

    <div class="cloud-card stack">
      <button class="btn btn-primary" onclick="goto('${progressBack}')">${progressBack==='map' ? '🗺️ Voltar ao mapa' : '⌂ Tela inicial'}</button>
    </div>
  </div>`;
};

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
      ${timerRowHTML()}
      <div class="q-text">${esc(q.text)} <button class="btn btn-icon btn-outline" style="width:36px;height:36px;min-height:36px;font-size:16px;vertical-align:middle;" onclick="sayQuestion(mp.players[mp.turn].questions[mp.index])" aria-label="Ouvir a pergunta">🔊</button></div>
      ${q.visual?`<div class="q-visual">${q.visual}</div>`:''}
      ${answerArea}
    </div>
  </div>`;
};
function mpResolve(correct, timedOut){
  clearQuestionTimer();
  const p = mp.players[mp.turn];
  const q = p.questions[mp.index];
  const elapsed = Date.now()-mp.qStart;
  p.totalTime += elapsed;
  let delay = 1200;
  if(correct){
    p.correct++; sfxCorrect();
    showFeedback(pick(CORRECT_MSGS), true, delay);
  } else {
    p.wrong++; sfxWrong();
    delay = 2400;
    const msg = timedOut
      ? `⏰ Tempo esgotado! A resposta certa era ${q.answer}.`
      : `${pick(WRONG_MSGS)} A resposta certa era ${q.answer}.`;
    showFeedback(msg, false, delay);
  }
  setTimeout(()=>{
    mp.turn = mp.turn===0?1:0;
    if(mp.turn===0) mp.index++;
    mp.qStart = Date.now();
    mp.answered = false;
    if(mp.index>=mp.players[0].questions.length){ goto('mpResult'); }
    else goto('mpPlay');
  }, delay);
}
function mpSubmit(val, btnEl){
  if(mp.answered) return;
  mp.answered = true;
  const p = mp.players[mp.turn]; const q = p.questions[mp.index];
  document.querySelectorAll('.opt-btn').forEach(b=>b.disabled=true);
  mpResolve(String(val)===String(q.answer));
}
function mpSubmitNumeric(){
  if(mp.answered) return;
  const input = $('#mpNumInput'); const val=(input.value||'').trim(); if(val==='')return;
  mp.answered = true;
  const p = mp.players[mp.turn]; const q = p.questions[mp.index];
  input.disabled=true;
  mpResolve(String(val)===String(q.answer));
}
function handleMpTimeUp(){
  if(!mp || mp.answered) return;
  mp.answered = true;
  const p = mp.players[mp.turn]; const q = p.questions[mp.index];
  document.querySelectorAll('.opt-btn').forEach(b=>{
    b.disabled = true;
    if(b.dataset.val===String(q.answer)) b.classList.add('correct');
  });
  const input = $('#mpNumInput'); if(input) input.disabled = true;
  mpResolve(false, true);
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
  // Sempre abrir a tela inicial para que o jogador escolha entre Novo Jogo e Continuar.
  // O progresso carregado já deixa o botão Continuar habilitado quando existe um perfil salvo.
  goto('start');
}
init();
