// 記録の保存・日付・育つしくみ・九九の問題
const KEY = 'kukutama-v1';
const OFFSET_KEY = 'kukutama-debug-offset';

export const PLAYS_PER_DAY = 3;
// ?fast をつけると ためし用に みじかくなる（チャレンジ8秒）
const FAST = new URLSearchParams(location.search).has('fast');
export const CHALLENGE_SEC = FAST ? 8 : 60;
export const CARE_SEC = 60;
export const CARE_MAX_ACTIONS = 2;
// 次の姿に進む条件（チャレンジした日数・けいけんち）。数字は試してから調整する
export const NEED = {
  egg:   { days: 3, exp: 30, next: 'baby' },
  baby:  { days: 7, exp: 100, next: 'child' },
  child: { days: 10, exp: 200, next: 'adult' },
};

export let storageOK = true;

function readRaw(k) { try { return localStorage.getItem(k); } catch { storageOK = false; return null; } }
function writeRaw(k, v) { try { localStorage.setItem(k, v); return true; } catch { storageOK = false; return false; } }

// 保存できるか（プライベートブラウズなど）を最初に確かめる
(function probe() {
  try { localStorage.setItem('kukutama-probe', '1'); localStorage.removeItem('kukutama-probe'); }
  catch { storageOK = false; }
})();

// ---------- 日付 ----------
export function dayOffset() { return parseInt(readRaw(OFFSET_KEY) || '0', 10) || 0; }
export function setDayOffset(n) { writeRaw(OFFSET_KEY, String(n)); }
export function todayKey() {
  const d = new Date(Date.now() + dayOffset() * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

// ---------- 記録 ----------
function blank() {
  return { v: 1, pet: null, day: { key: null, plays: 0 }, facts: {}, history: [], inProgress: null, lastSeenDay: null, settings: {} };
}

export let S = load();

function load() {
  const raw = readRaw(KEY);
  if (!raw) return blank();
  try { return Object.assign(blank(), JSON.parse(raw)); } catch { return blank(); }
}
export function save() { writeRaw(KEY, JSON.stringify(S)); }
export function resetAll() { S = blank(); save(); try { localStorage.removeItem(OFFSET_KEY); } catch {} }

// アプリを開いたとき・画面にもどったときの日付チェック
// 戻り値：休み明けなら true
export function syncDay() {
  let today = todayKey();
  // 時計がもどされたら、最後の日と同じ日として扱う
  if (S.day.key && today < S.day.key) today = S.day.key;
  let missed = false;
  if (S.day.key !== today) {
    if (S.lastSeenDay && daysBetween(S.lastSeenDay, today) >= 2) missed = true;
    S.day = { key: today, plays: 0 };
  }
  S.lastSeenDay = today;
  save();
  return missed;
}
export function playsLeft() { return Math.max(0, PLAYS_PER_DAY - S.day.plays); }

// ---------- キャラ ----------
export function newPet(species, name) {
  S.pet = { species, name, stage: 'egg', type: null, stageDays: 0, stageExp: 0, lastPlayDay: null,
    totalExp: 0, food: 0, hearts: 0, tally: { kotsu: 0, chosen: 0, nandemo: 0, ganba: 0 }, born: todayKey() };
  save();
}

export function canGrow() {
  const p = S.pet, n = NEED[p.stage];
  return !!n && p.stageDays >= n.days && p.stageExp >= n.exp;
}

export function grow() {
  const p = S.pet, n = NEED[p.stage];
  const from = p.stage;
  p.stage = n.next;
  p.stageDays = 0; p.stageExp = 0;
  if (p.stage === 'adult') p.type = decideType(p.tally);
  save();
  return { from, to: p.stage, type: p.type };
}

function decideType(t) {
  const order = ['ganba', 'nandemo', 'chosen', 'kotsu'];
  return order.reduce((best, k) => (t[k] > t[best] ? k : best), order[0]);
}

// ---------- 九九 ----------
const fk = (a, b) => `${a}x${b}`;
export function isWeak(a, b) {
  const f = S.facts[fk(a, b)];
  return !!f && f.w > 0 && (f.last === 0 || f.streak < 2);
}
export function weakList() {
  const out = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) if (isWeak(a, b)) out.push([a, b]);
  return out;
}

// mode: 'omakase' か 段の配列
export function makePicker(mode) {
  const all = [];
  const dans = mode === 'omakase' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : mode;
  dans.forEach(a => { for (let b = 1; b <= 9; b++) all.push([a, b]); });
  let prev = null;
  return function next() {
    let pool = all;
    if (mode === 'omakase') {
      const weak = weakList();
      if (weak.length && Math.random() < 0.5) pool = weak;
    }
    let q;
    for (let i = 0; i < 10; i++) {
      q = pool[Math.floor(Math.random() * pool.length)];
      if (!prev || q[0] !== prev[0] || q[1] !== prev[1] || pool.length === 1) break;
    }
    prev = q;
    return { a: q[0], b: q[1], weak: isWeak(q[0], q[1]) };
  };
}

// とちゅう経過の保存（とちゅうで閉じたとき用）
export function saveProgress(p) { S.inProgress = p; save(); }
export function clearProgress() { S.inProgress = null; save(); }

// 1回のチャレンジの結果を記録する
// answers: [{a,b,weak,given,ok}]
export function finishPlay(mode, answers) {
  const p = S.pet;
  let exp = 0, correct = 0, bonus = 0;
  const wrong = [];
  answers.forEach(x => {
    const k = fk(x.a, x.b);
    const f = S.facts[k] || (S.facts[k] = { s: 0, w: 0, last: 1, streak: 0 });
    f.s++;
    if (x.ok) {
      correct++; exp += x.weak ? 2 : 1; if (x.weak) bonus++;
      f.last = 1; f.streak++;
    } else {
      f.w++; f.last = 0; f.streak = 0;
      if (!wrong.some(w => w.a === x.a && w.b === x.b)) wrong.push({ a: x.a, b: x.b });
    }
    // おとなの姿を決めるための記録（あかちゃん・こどもの間だけ）
    if (p.stage === 'baby' || p.stage === 'child') {
      if (mode === 'omakase') p.tally.nandemo++;
      else if (x.a <= 5) p.tally.kotsu++;
      else p.tally.chosen++;
      if (x.weak && x.ok) p.tally.ganba += 1.5;
    }
  });
  const food = Math.floor(correct / 5);
  S.day.plays++;
  if (p.lastPlayDay !== S.day.key) { p.stageDays++; p.lastPlayDay = S.day.key; }
  p.stageExp += exp; p.totalExp += exp; p.food += food;
  S.history.push({ d: S.day.key, c: correct, n: answers.length, m: mode === 'omakase' ? 'o' : mode.join('') });
  if (S.history.length > 300) S.history.splice(0, S.history.length - 300);
  S.inProgress = null;
  save();
  return { correct, total: answers.length, exp, food, bonus, wrong: wrong.slice(0, 5) };
}

// 前回とちゅうで閉じたチャレンジの後しまつ
// 30秒以上やっていたら1回と数える。それより短ければ数えない
export function recoverProgress() {
  const ip = S.inProgress;
  if (!ip) return null;
  const elapsed = (ip.last - ip.start) / 1000;
  if (elapsed >= 30 && ip.day === S.day.key) return finishPlay(ip.mode, ip.answers);
  S.inProgress = null; save();
  return null;
}
