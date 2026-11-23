import * as A from './art.js';
import * as G from './state.js';
import { startCare } from './care.js';

const $stage = document.getElementById('stage');
export const px = (n) => `calc(var(--u)*${n})`;
export const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const unit = () => $stage.getBoundingClientRect().width / 1024;
export function toStage(e) {
  const r = $stage.getBoundingClientRect(), k = r.width / 1024;
  return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

let restMsg = false;
let helloMsg = false;

function setScreen(node) { $stage.innerHTML = ''; $stage.appendChild(node); return node; }

export function petSVG(p, face) {
  return p.stage === 'egg' ? A.egg(p.species) : A.critter(p.species, p.stage, p.type, { face });
}

// 押したときにしずむ（iPadでは :active がききにくいので自前で）
function pressable(root) {
  root.querySelectorAll('.press').forEach(b => {
    b.addEventListener('pointerdown', () => { if (!b.disabled) b.classList.add('down'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('down')));
  });
}

export function floatAt(parent, x, y, svg, size = 50) {
  const f = el(`<div class="float" style="left:${px(x - size / 2)};top:${px(y - size / 2)};width:${px(size)};height:${px(size)}">${svg}</div>`);
  parent.appendChild(f);
  setTimeout(() => f.remove(), 1200);
}

// ================= たまごえらび =================
function showEggPick() {
  const sps = Object.keys(A.SPECIES), cols = [200, 512, 824], rows = [230, 450];
  const cush = ['--c:#86C2A3;box-shadow:0 calc(var(--u)*5) 0 #5E9A7C', '--c:#F2A7A3;box-shadow:0 calc(var(--u)*5) 0 #D4847F', '--c:#9CC6DE;box-shadow:0 calc(var(--u)*5) 0 #78A6C2'];
  let h = `<div class="screen"><div class="wall"></div><div class="floor felt" style="height:${px(150)}"></div>
    <div class="a title felt st puffy">どの たまごに する？</div>`;
  sps.forEach((sp, i) => {
    const x = cols[i % 3], y = rows[Math.floor(i / 3)];
    h += `<div class="cushion felt" style="left:${px(x - 115)};top:${px(y + 125)};${cush[i % 3]}"></div>`;
    h += `<button class="eggbtn" data-sp="${sp}" style="left:${px(x - 110)};top:${px(y - 30)}" aria-label="たまご ${i + 1}">${A.egg(sp)}</button>`;
  });
  h += `<div class="a small" style="left:${px(40)};bottom:${px(52)};font-size:${px(22)}">たまごを タッチしてね</div>
    <button class="a btn main felt st puffy press" id="pick" disabled style="right:${px(40)};bottom:${px(28)};width:${px(340)};height:${px(84)};font-size:${px(30)}">この たまごに する</button></div>`;
  const s = setScreen(el(h));
  let sel = null;
  s.querySelectorAll('.eggbtn').forEach(b => b.addEventListener('click', () => {
    s.querySelectorAll('.eggbtn').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel'); sel = b.dataset.sp; s.querySelector('#pick').disabled = false;
  }));
  s.querySelector('#pick').addEventListener('click', () => sel && showName(sel));
  pressable(s);
}

// ================= なまえつけ =================
const KANA_COLS = ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'や ゆ よ', 'らりるれろ', 'わをんー '];
const CYCLES = ['かが', 'きぎ', 'くぐ', 'けげ', 'こご', 'さざ', 'しじ', 'すず', 'せぜ', 'そぞ', 'ただ', 'ちぢ', 'つづっ', 'てで', 'とど', 'はばぱ', 'ひびぴ', 'ふぶぷ', 'へべぺ', 'ほぼぽ', 'やゃ', 'ゆゅ', 'よょ', 'あぁ', 'いぃ', 'うぅ', 'えぇ', 'おぉ'];
const MAXLEN = 6;

function showName(sp, opt = {}) {
  const p = G.S.pet;
  const fig = opt.rename ? petSVG(p, 'happy') : A.egg(sp);
  let name = opt.rename ? p.name : '';
  let keys = '';
  KANA_COLS.forEach(col => [...col].forEach(ch => { keys += ch === ' ' ? '<button class="blank" tabindex="-1"></button>' : `<button class="felt puffy press" data-k="${ch}">${ch}</button>`; }));
  const s = setScreen(el(`<div class="screen"><div class="wall"></div>
    <div class="a pill felt st puffy" style="left:${px(40)};top:${px(36)};font-size:${px(28)};font-weight:900">なまえを つけてね</div>
    <div class="a" style="left:${px(opt.rename ? 70 : 110)};top:${px(opt.rename ? 100 : 120)};width:${px(opt.rename ? 300 : 220)};height:${px(opt.rename ? 320 : 275)}">${fig}</div>
    <div class="a namebox felt st puffy" id="nb"></div>
    <div class="a small" style="left:${px(40)};top:${px(540)};width:${px(360)};text-align:center">${MAXLEN}もじ まで ／ あとから かえられるよ</div>
    <div class="kana" style="grid-auto-flow:column">${keys}</div>
    <div class="kana-tools">
      <button class="btn sub felt st puffy press" id="dk" aria-label="てんてん まる ちいさく" style="font-size:${px(34)}">゛ ゜</button>
      <button class="btn sub felt st puffy press" id="bs">けす</button>
      <button class="btn main felt st puffy press" id="ok">けってい</button>
    </div>
    ${opt.rename ? `<button class="a btn sub felt st puffy press" id="back" style="left:${px(40)};bottom:${px(36)};width:${px(200)};height:${px(76)};font-size:${px(24)}">もどる</button>` : ''}
  </div>`));
  const nb = s.querySelector('#nb'), ok = s.querySelector('#ok');
  const draw = () => {
    nb.textContent = name || 'ここに なまえ';
    nb.classList.toggle('empty', !name);
    ok.disabled = !name;
  };
  s.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { if (name.length < MAXLEN) { name += b.dataset.k; draw(); } }));
  s.querySelector('#bs').addEventListener('click', () => { name = name.slice(0, -1); draw(); });
  s.querySelector('#dk').addEventListener('click', () => {
    if (!name) return;
    const last = name.slice(-1), cyc = CYCLES.find(c => c.includes(last));
    if (!cyc) return;
    name = name.slice(0, -1) + cyc[(cyc.indexOf(last) + 1) % cyc.length]; draw();
  });
  ok.addEventListener('click', () => {
    if (!name) return;
    if (opt.rename) { p.name = name; G.save(); showRoom(); return; }
    G.newPet(sp, name); helloMsg = true; showRoom();
  });
  s.querySelector('#back')?.addEventListener('click', () => showRoom());
  pressable(s); draw();
}

// ================= お部屋 =================
function bubbleText(p, night) {
  if (night) return 'Zzz…';
  if (helloMsg) { helloMsg = false; return p.stage === 'egg' ? 'よろしくね…（ことこと）' : 'よろしくね！'; }
  if (restMsg) { restMsg = false; return 'さみしかったよ… あいたかった！'; }
  const list = p.stage === 'egg'
    ? ['あたたかいな…', '…ことこと', 'はやく あいたいな', 'くく がんばってね']
    : ['あそびたいな', 'きょうも きてくれた！', 'くく いっしょに がんばろう', 'えへへ'];
  if (p.stage !== 'egg' && p.food > 0) list.push('おなか すいた', 'おなか すいた');
  return list[Math.floor(Math.random() * list.length)];
}

function panelHTML(p, night) {
  const need = G.NEED[p.stage];
  const stock = `<div class="stock"><span>${A.ONIGIRI}${p.food}</span><span>${A.HEART}${p.hearts}</span></div>`;
  if (night) {
    let tomorrow = 'あした また あおうね';
    if (need) {
      const left = Math.max(0, need.days - p.stageDays);
      const what = { egg: 'うまれる', baby: 'こどもに なる', child: 'おとなに なる' }[p.stage];
      if (left > 0) tomorrow = `あと ${left}日で ${what}かも！`;
    }
    return `<div style="font-size:${px(26)};font-weight:900">きょうは 3かい がんばったね</div><div class="small" style="margin-top:${px(6)}">${tomorrow}</div>`;
  }
  if (!need) {
    return `<div style="font-size:${px(24)};font-weight:900">おとなに なったよ！</div>
      <div class="small">${A.TYPES[p.type].n}タイプ ／ けいけんち ${p.totalExp}</div>${stock}`;
  }
  const what = { egg: 'うまれるまで', baby: 'こどもに なるまで', child: 'おとなに なるまで' }[p.stage];
  const left = Math.max(0, need.days - p.stageDays);
  const head = left > 0
    ? `${what} あと <b style="color:var(--ink);font-size:${px(26)}">${left}</b>日`
    : `あと すこし！ けいけんちを ためよう`;
  const eggs = Array.from({ length: need.days }, (_, i) => `<i class="${i < p.stageDays ? 'on' : ''}"></i>`).join('');
  const pct = Math.min(100, p.stageExp / need.exp * 100);
  return `<div class="small">${head}</div><div class="eggrow">${eggs}</div>
    <div class="small">けいけんち ${Math.min(p.stageExp, need.exp)} / ${need.exp}</div>
    <div class="gauge"><i class="felt" style="width:${pct}%"></i></div>${stock}`;
}

// opt.day: 夜にしない（けっか・お世話のとき） / opt.care: パネルとボタンをかくす
export function showRoom(opt = {}) {
  const p = G.S.pet;
  if (!opt.day && !opt.care) restMsg = G.syncDay() || restMsg;
  const left = G.playsLeft();
  const night = left === 0 && !opt.day && !opt.care;
  const lamps = [[600, 62], [680, 100], [760, 62]];
  const isEgg = p.stage === 'egg';
  const s = setScreen(el(`<div class="screen room ${night ? 'night' : ''}">
    <div class="wall"></div>
    <div class="a window felt st puffy">
      ${night ? `<div class="moon" style="left:${px(120)};top:${px(26)};width:${px(50)};height:${px(50)}"></div><div class="star" style="left:${px(40)};top:${px(40)}"></div><div class="star" style="left:${px(70)};top:${px(120)}"></div><div class="star" style="left:${px(160)};top:${px(130)}"></div>`
        : `<div class="cloud" style="left:${px(24)};top:${px(40)};width:${px(80)};height:${px(30)}"></div><div class="cloud" style="left:${px(118)};top:${px(118)};width:${px(64)};height:${px(24)};animation-delay:-14s"></div>`}
      <div class="mull" style="left:calc(50% - var(--u)*6);top:0;bottom:0;width:${px(12)}"></div>
      <div class="mull" style="top:calc(50% - var(--u)*6);left:0;right:0;height:${px(12)}"></div>
    </div>
    ${lamps.map(([x, h], i) => `<div class="cord" style="left:${px(x)};height:${px(h)}"><div class="bulb ${i < left && !night ? 'on' : 'off'}"></div></div>`).join('')}
    <div class="floor felt"></div>
    <div class="warm"></div>
    <div class="a rug felt st"></div>
    <div class="a namepill pill felt st puffy ${opt.care ? 'hide' : ''}"><b>${p.name}</b><small>${A.STAGE_NAMES[p.stage]}</small></div>
    <button class="a gear felt st puffy press ${opt.care ? 'hide' : ''}" id="gear" aria-label="せってい">⚙</button>
    <div class="pet ${isEgg ? 'egg' : ''}" id="pet"><div class="body ${isEgg ? 'wiggle' : (night ? '' : 'breathe')}">${petSVG(p, night ? 'sleep' : 'normal')}</div></div>
    <div class="a bubble felt st puffy ${opt.care ? 'hide' : ''}" id="bubble" style="left:${px(isEgg ? 680 : 740)};top:${px(isEgg ? 300 : 236)}">${bubbleText(p, night)}<i></i></div>
    <div class="a panel felt st puffy ${opt.care ? 'hide' : ''}">${panelHTML(p, night)}</div>
    <button class="a go felt st puffy ${opt.care ? 'hide' : ''} ${night ? '' : 'idle'}" id="go" ${night ? 'disabled' : ''}>${night ? '<span>またあした</span>' : `<b>くく</b><span>チャレンジ</span><small>のこり ${left}かい</small>`}</button>
    ${G.storageOK ? '' : '<div class="a warn felt puffy">この せってい では きろくが のこりません（プライベートブラウズを やめてください）</div>'}
  </div>`));
  const petEl = s.querySelector('#pet');
  if (!opt.care) {
    petEl.addEventListener('click', (e) => {
      const pt = toStage(e);
      floatAt(s, pt.x, pt.y - 30, A.HEART, 46);
      const body = petEl.querySelector('.body');
      if (!night && !isEgg) { body.classList.remove('hop'); void body.offsetWidth; body.classList.add('hop'); }
      const b = s.querySelector('#bubble');
      b.firstChild.textContent = night ? 'むにゃむにゃ…' : (isEgg ? '…ことっ' : 'えへへ');
    });
    s.querySelector('#gear').addEventListener('click', showSettings);
    s.querySelector('#go').addEventListener('click', () => { if (G.playsLeft() > 0) showDan(); });
  }
  pressable(s);
  return s;
}

// ================= だんえらび =================
function showDan() {
  const last = G.S.settings.lastMode;
  let mode = last === 'omakase' ? 'omakase' : (Array.isArray(last) ? [...last] : []);
  const weakN = G.weakList().length;
  let dans = '';
  for (let d = 1; d <= 9; d++) dans += `<button class="dan felt st puffy press" data-d="${d}"><b>${d}</b><span>の だん</span></button>`;
  const s = setScreen(el(`<div class="screen"><div class="wall"></div>
    <button class="a btn sub felt st puffy press" id="back" style="left:${px(30)};top:${px(30)};width:${px(170)};height:${px(70)};font-size:${px(24)}">もどる</button>
    <div class="a pill felt st puffy" style="left:${px(230)};top:${px(30)};font-size:${px(30)};font-weight:900">どの だんに する？</div>
    <div class="a small" style="left:${px(60)};top:${px(118)}">いくつでも えらべるよ</div>
    <div class="dans">${dans}</div>
    <button class="a omakase felt st puffy press" id="om"><b>おまかせ</b><span>ぜんぶの だんから<br>にがてを おおめに</span><span class="weakn">にがて ${weakN}もん</span></button>
    <button class="a btn main felt st puffy press" id="start" style="left:${px(330)};bottom:${px(40)};width:${px(380)};height:${px(100)};font-size:${px(40)}">スタート</button>
  </div>`));
  const start = s.querySelector('#start'), om = s.querySelector('#om');
  const draw = () => {
    s.querySelectorAll('.dan').forEach(b => b.classList.toggle('on', Array.isArray(mode) && mode.includes(+b.dataset.d)));
    om.classList.toggle('on', mode === 'omakase');
    start.disabled = !(mode === 'omakase' || mode.length);
  };
  s.querySelectorAll('.dan').forEach(b => b.addEventListener('click', () => {
    const d = +b.dataset.d;
    if (!Array.isArray(mode)) mode = [];
    mode = mode.includes(d) ? mode.filter(x => x !== d) : [...mode, d].sort();
    draw();
  }));
  om.addEventListener('click', () => { mode = mode === 'omakase' ? [] : 'omakase'; draw(); });
  s.querySelector('#back').addEventListener('click', () => showRoom());
  start.addEventListener('click', () => {
    if (start.disabled) return;
    G.S.settings.lastMode = mode; G.save();
    startChallenge(mode);
  });
  pressable(s); draw();
}

// ================= チャレンジ =================
async function startChallenge(mode) {
  const p = G.S.pet;
  const peekSVG = p.stage === 'egg' ? A.egg(p.species) : A.critter(p.species, p.stage, p.type);
  const s = setScreen(el(`<div class="screen ch"><div class="wall"></div>
    <div class="a tbar"><div class="gauge time"><i class="felt" style="width:100%"></i></div></div>
    <div class="a tleft">のこり ${G.CHALLENGE_SEC}びょう</div>
    <div class="a score pill felt st puffy">せいかい<b id="sc">0</b></div>
    <div class="a qtext" id="q"></div>
    <div class="a ansbox felt st puffy caret" id="ans"></div>
    <div class="pad">
      ${[7, 8, 9, 4, 5, 6, 1, 2, 3].map(n => `<button class="felt st puffy press" data-n="${n}">${n}</button>`).join('')}
      <button class="felt st puffy press s" id="bs">けす</button>
      <button class="felt st puffy press" data-n="0">0</button>
      <button class="felt st puffy press ok" id="enter">こたえる</button>
    </div>
    <div class="a peek" id="peek" style="${p.stage === 'egg' ? `left:${px(50)};bottom:${px(-30)};width:${px(130)};height:${px(163)}` : ''}">${peekSVG}</div>
    <div class="a bubble felt st puffy cheer" id="cheer">がんばれ！<i></i></div>
  </div>`));
  pressable(s);
  const $q = s.querySelector('#q'), $ans = s.querySelector('#ans'), $sc = s.querySelector('#sc'),
    $bar = s.querySelector('.tbar i'), $tl = s.querySelector('.tleft'), $cheer = s.querySelector('#cheer'), $peek = s.querySelector('#peek');
  const next = G.makePicker(mode);
  const answers = [];
  let cur = null, input = '', locked = true, score = 0, streak = 0, ended = false;
  const draw = () => { $ans.textContent = input; };
  const ask = () => {
    cur = next(); input = '';
    $q.textContent = `${cur.a} × ${cur.b} ＝`;
    $q.classList.toggle('weak', cur.weak);
    $ans.className = 'a ansbox felt st puffy caret'; draw();
    locked = false;
  };

  // 3・2・1
  const cd = el('<div class="count"><div class="dim"></div></div>');
  s.appendChild(cd);
  for (const n of ['3', '2', '1']) {
    const sp = el(`<span style="position:relative">${n}</span>`);
    cd.appendChild(sp); await wait(750); sp.remove();
  }
  cd.remove();

  const start = Date.now(), endAt = start + G.CHALLENGE_SEC * 1000;
  ask();
  const timer = setInterval(() => {
    const leftMs = Math.max(0, endAt - Date.now());
    $bar.style.width = (leftMs / (G.CHALLENGE_SEC * 1000) * 100) + '%';
    $tl.textContent = `のこり ${Math.ceil(leftMs / 1000)}びょう`;
    if (leftMs <= 0) finish();
  }, 200);

  const submit = () => {
    if (locked || !input || ended) return;
    locked = true;
    const given = parseInt(input, 10), ok = given === cur.a * cur.b;
    answers.push({ a: cur.a, b: cur.b, weak: cur.weak, given, ok });
    G.saveProgress({ start, last: Date.now(), mode, answers, day: G.S.day.key });
    if (ok) {
      score++; streak++; $sc.textContent = score;
      $ans.className = 'a ansbox felt st puffy ok';
      s.appendChild(el('<div class="a mark"></div>'));
      $peek.style.transform = `translateY(${px(-24)})`;
      setTimeout(() => { $peek.style.transform = ''; }, 200);
      $cheer.firstChild.textContent = streak >= 5 ? 'すごい すごい！' : streak >= 3 ? 'いいね！' : 'やったね！';
      setTimeout(() => { s.querySelector('.mark')?.remove(); if (!ended) ask(); }, 380);
    } else {
      streak = 0;
      $ans.className = 'a ansbox felt st puffy ng';
      $ans.innerHTML = `おしい！<b>${cur.a}×${cur.b}＝${cur.a * cur.b}</b>`;
      $cheer.firstChild.textContent = 'だいじょうぶ！';
      setTimeout(() => { if (!ended) ask(); }, 1300);
    }
  };
  const press = (n) => { if (locked || ended) return; if (input.length < 2) { input += n; draw(); } };
  const back = () => { if (locked || ended) return; input = input.slice(0, -1); draw(); };
  s.querySelectorAll('[data-n]').forEach(b => b.addEventListener('pointerdown', () => press(b.dataset.n)));
  s.querySelector('#bs').addEventListener('pointerdown', back);
  s.querySelector('#enter').addEventListener('pointerdown', submit);
  const onKey = (e) => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') back();
    else if (e.key === 'Enter') submit();
  };
  document.addEventListener('keydown', onKey);

  async function finish() {
    if (ended) return;
    ended = true; locked = true; clearInterval(timer);
    document.removeEventListener('keydown', onKey);
    const fin = el(`<div class="count" style="font-size:${px(120)}"><div class="dim"></div><span style="position:relative">おしまい！</span></div>`);
    s.appendChild(fin);
    await wait(1100);
    const res = G.finishPlay(mode, answers);
    showResult(res);
  }
}

// ================= けっか =================
function showResult(res) {
  const s = showRoom({ day: true, care: true });
  const title = res.correct > 0 ? `${res.correct}もん せいかい！` : 'つぎは いっしょに がんばろう';
  const miss = res.wrong.length
    ? `<div class="miss"><div class="small">まちがえた もんだい（こたえ）</div><div class="chips">${res.wrong.map(w => `<span class="chip felt">${w.a}×${w.b}＝${w.a * w.b}</span>`).join('')}</div></div>`
    : `<div class="miss small" style="font-size:${px(24)}">${res.total ? 'ぜんぶ せいかい！ すごい！' : ''}</div>`;
  const card = el(`<div><div class="dim" style="z-index:9"></div>
    <div class="a card result felt st puffy">
      <h2>${title}</h2>
      <div class="rw">
        <div class="x felt st"><span class="small">けいけんち</span><b>+${res.exp}</b></div>
        <div class="f felt st"><span class="small">たべもの</span><b>+${res.food}</b></div>
        <div class="w felt st"><span class="small">にがてボーナス</span><b>+${res.bonus}</b></div>
      </div>
      ${miss}
      <button class="btn main felt st puffy press" id="care">おせわ する</button>
    </div></div>`);
  s.appendChild(card);
  pressable(card);
  card.querySelector('#care').addEventListener('click', () => {
    if (G.canGrow()) showGrow(() => startCare(showRoom));
    else startCare(showRoom);
  });
}

// ================= せいちょう =================
async function showGrow(after) {
  const p = G.S.pet;
  const before = petSVG(p, 'normal'), wasEgg = p.stage === 'egg';
  const s = showRoom({ day: true, care: true });   // うしろのお部屋は まだ前の姿のまま
  s.querySelector('#pet').style.visibility = 'hidden';
  const r = G.grow();
  const ov = el(`<div class="grow"><div class="glow"></div><div class="fig ${wasEgg ? 'egg' : ''} shake">${before}</div><h2></h2></div>`);
  s.appendChild(ov);
  const fig = ov.querySelector('.fig'), glow = ov.querySelector('.glow'), h2 = ov.querySelector('h2');
  h2.textContent = wasEgg ? 'あれっ？ たまごが…！' : `あれっ？ ${p.name}の ようすが…！`;
  await wait(1200);
  if (wasEgg) fig.innerHTML = A.egg(p.species, { crack: true });
  await wait(900);
  glow.classList.add('on');
  await wait(1100);
  fig.className = 'fig reveal';
  fig.innerHTML = A.critter(p.species, r.to, r.type, { face: 'happy' });
  glow.classList.remove('on');
  const sp = A.SPECIES[p.species].n;
  if (r.to === 'baby') h2.innerHTML = `${p.name}が うまれたよ！<small>${sp}の あかちゃん</small>`;
  if (r.to === 'child') h2.innerHTML = `${p.name}が おおきく なったよ！<small>${sp}の こども</small>`;
  if (r.to === 'adult') h2.innerHTML = `${p.name}が おとなに なったよ！<small>${A.TYPES[r.type].n}タイプの ${sp}</small>`;
  await wait(700);
  const btn = el('<button class="btn main felt st puffy press">つぎへ</button>');
  ov.appendChild(btn); pressable(ov);
  btn.addEventListener('click', () => { ov.remove(); after(); });
}

// ================= せってい =================
function showSettings() {
  const p = G.S.pet;
  const s = $stage.firstElementChild;
  const ov = el(`<div><div class="dim" style="z-index:39"></div>
    <div class="a card sheet felt st puffy">
      <h2>せってい</h2>
      <div style="font-size:${px(26)}">なまえ：<b style="font-size:${px(34)}">${p.name}</b></div>
      <button class="btn sub felt st puffy press" id="rn">なまえを かえる</button>
      <button class="btn main felt st puffy press" id="close">とじる</button>
      <div class="teacher">
        <div class="small" style="margin-bottom:${px(10)}">せんせい よう</div>
        <button class="btn felt st puffy" id="wipe"><i></i><span style="position:relative">データを けす（2びょう ながおし）</span></button>
      </div>
    </div></div>`);
  s.appendChild(ov); pressable(ov);
  ov.querySelector('#close').addEventListener('click', () => ov.remove());
  ov.querySelector('#rn').addEventListener('click', () => showName(p.species, { rename: true }));
  const wipe = ov.querySelector('#wipe'), bar = wipe.querySelector('i');
  let t0 = 0, raf = 0;
  const stop = () => { cancelAnimationFrame(raf); bar.style.width = '0'; t0 = 0; };
  const tick = () => {
    const k = (Date.now() - t0) / 2000;
    bar.style.width = Math.min(100, k * 100) + '%';
    if (k >= 1) { stop(); confirmWipe(ov); return; }
    raf = requestAnimationFrame(tick);
  };
  wipe.addEventListener('pointerdown', () => { t0 = Date.now(); raf = requestAnimationFrame(tick); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => wipe.addEventListener(ev, stop));
}

function confirmWipe(parent) {
  const steps = ['ほんとうに けしますか？<br>キャラも きろくも なくなります', 'もういちど かくにん。<br>けすと もとに もどせません'];
  let i = 0;
  const d = el(`<div class="a card dialog felt st puffy"><p></p><div class="row">
    <button class="btn sub felt st puffy press" id="no">やめる</button>
    <button class="btn main felt st puffy press" id="yes">けす</button></div></div>`);
  parent.appendChild(d); pressable(d);
  const show = () => { d.querySelector('p').innerHTML = steps[i]; };
  d.querySelector('#no').addEventListener('click', () => d.remove());
  d.querySelector('#yes').addEventListener('click', () => {
    i++;
    if (i < steps.length) { show(); return; }
    G.resetAll(); location.reload();
  });
  show();
}

// ================= ためし用（?debug=1） =================
function debugBar() {
  const bar = el(`<div class="debug">
    <button data-a="day">あしたへ</button><button data-a="plays">回数もどす</button>
    <button data-a="exp">けいけんち+50</button><button data-a="food">たべもの+5</button>
    <button data-a="grow">育つ条件にする</button><button data-a="type">タイプ表示</button></div>`);
  document.body.appendChild(bar);
  bar.addEventListener('click', (e) => {
    const a = e.target.dataset.a, p = G.S.pet;
    if (!a) return;
    if (a === 'day') { G.setDayOffset(G.dayOffset() + 1); }
    if (!p) { showEggPick(); return; }
    if (a === 'plays') G.S.day.plays = 0;
    if (a === 'exp') { p.stageExp += 50; p.totalExp += 50; }
    if (a === 'food') p.food += 5;
    if (a === 'grow' && G.NEED[p.stage]) { p.stageDays = G.NEED[p.stage].days; p.stageExp = G.NEED[p.stage].exp; }
    if (a === 'type') { alert(JSON.stringify(p.tally)); return; }
    G.save(); showRoom();
  });
}

// ================= はじまり =================
function boot() {
  G.recoverProgress();          // とちゅうで閉じたチャレンジの後しまつ（日付を進める前に）
  restMsg = G.syncDay();
  if (!G.S.pet) showEggPick(); else showRoom();
  if (new URLSearchParams(location.search).has('debug')) debugBar();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && G.S.pet && $stage.querySelector('.room') && !$stage.querySelector('.dim, .grow, .caretop')) showRoom();
  });
}
boot();
