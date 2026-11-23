// 記録の保存・日付・育つしくみ・九九の問題
const KEY = 'kukutama-v1';
const OFFSET_KEY = 'kukutama-debug-offset';

export const PLAYS_PER_DAY = 3;
// ?fast をつけると ためし用に みじかくなる（チャレンジ8秒）
const FAST = new URLSearchParams(location.search).has('fast');
export const CHALLENGE_SEC = FAST ? 8 : 45;   // 2026-11-23 60→45秒に変更
export const CARE_SEC = 60;
export const CARE_MAX_ACTIONS = 2;
// 次の姿に進む条件（けいけんち）。がんばるほど早く育つ。1日に進めるのは1だんかいまで
// 2026-11-23 日数の条件をやめた（がんばりで すぐ育つ形に）。数字は試してから調整する
export const NEED = {
  egg:   { exp: 20, next: 'baby' },
  baby:  { exp: 80, next: 'child' },
  child: { exp: 150, next: 'adult' },
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
  return { v: 1, pet: null, day: { key: null, plays: 0 }, facts: {}, history: [], inProgress: null, lastSeenDay: null, settings: {}, zukan: [] };
}

export let S = load();

function load() {
  const raw = readRaw(KEY);
  if (!raw) return blank();
  try { return Object.assign(blank(), JSON.parse(raw)); } catch { return blank(); }
}
export function save() { writeRaw(KEY, JSON.stringify(S)); }

// ---------- バックアップ（ファイルに書き出す・もどす） ----------
export function exportData() {
  return JSON.stringify({ app: 'kukutama', v: 1, savedAt: new Date().toISOString(), data: S });
}
// うまくいけば true。ちがうファイルなら false
export function importData(text) {
  let o;
  try { o = JSON.parse(text); } catch { return false; }
  if (!o || o.app !== 'kukutama' || !o.data || typeof o.data !== 'object') return false;
  const d = o.data;
  if (d.pet !== null && (typeof d.pet !== 'object' || !d.pet.species)) return false;
  S = Object.assign(blank(), d, { inProgress: null });
  save();
  return true;
}
// ブラウザに「この記録は消さないで」とたのむ（ことわられても動きはかわらない）
export function askPersist() {
  try { navigator.storage?.persist?.().catch(() => {}); } catch {}
}
export function isHomeScreenApp() {
  try { return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches; } catch { return false; }
}
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
  S.pet = { species, name, stage: 'egg', type: null, stageDays: 0, stageExp: 0, lastPlayDay: null, lastGrowDay: null,
    totalExp: 0, food: 0, hearts: 0, tally: { kotsu: 0, chosen: 0, nandemo: 0, ganba: 0 }, born: todayKey() };
  save();
}

// けいけんちがたまったか（きょう もう育っていたら あしたまで まつ）
export function expFull() {
  const p = S.pet, n = NEED[p.stage];
  return !!n && p.stageExp >= n.exp;
}
export function grewToday() { return S.pet.lastGrowDay === S.day.key; }
export function canGrow() { return expFull() && !grewToday(); }

export function grow() {
  const p = S.pet, n = NEED[p.stage];
  const from = p.stage;
  p.stage = n.next;
  p.stageExp = Math.max(0, p.stageExp - n.exp);   // あまった けいけんちは 次に持ちこす
  p.lastGrowDay = S.day.key;
  if (p.stage === 'adult') {
    p.type = decideType(p.tally);
    S.zukan.push({ species: p.species, type: p.type, name: p.name, date: S.day.key, left: null });
  }
  save();
  return { from, to: p.stage, type: p.type };
}

// おとなを たびだたせる → 図鑑に のこして、次のたまごへ
export function farewell() {
  const p = S.pet;
  const e = [...S.zukan].reverse().find(z => z.species === p.species && z.type === p.type && z.name === p.name && !z.left);
  if (e) e.left = S.day.key;
  S.pet = null;
  save();
}

// 図鑑：なかま×タイプ ごとの記録
export function zukanFor(species, type) { return S.zukan.filter(z => z.species === species && z.type === type); }
export function raisedCount(species) { return S.zukan.filter(z => z.species === species).length; }

function decideType(t) {
  const order = ['ganba', 'nandemo', 'chosen', 'kotsu'];
  return order.reduce((best, k) => (t[k] > t[best] ? k : best), order[0]);
}

// ---------- 九九 ----------
const fk = (a, b) => `${a}x${b}`;
// にがて＝まちがえたことがあって、まだ「2かい つづけて せいかい」していない もんだい
export const GRADUATE = 2;
const weakOf = (f) => !!f && f.w > 0 && (f.last === 0 || f.streak < GRADUATE);
// そつぎょうまで あと何回 つづけて せいかいすればいいか
const leftOf = (f) => (f.last === 0 ? GRADUATE : Math.max(1, GRADUATE - f.streak));
export function isWeak(a, b) { return weakOf(S.facts[fk(a, b)]); }
export function weakList() {
  const out = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) if (isWeak(a, b)) out.push([a, b]);
  return out;
}

// mode: 'omakase' か 段の配列
// 2026-11-23 にがてが同じ回に何度も出すぎたので直した：
//  ・おまかせで「にがて」から出すのは、1つの もんだいにつき 1回に2どまで
//  ・その回で せいかいしたら、その回は もう にがてとしては出さない
//  ・さいきん出た3もんは なるべく出さない
// next() で もんだいを出し、next.mark(a, b, ok) で こたえを知らせる
export function makePicker(mode) {
  const all = [];
  const dans = mode === 'omakase' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : mode;
  dans.forEach(a => { for (let b = 1; b <= 9; b++) all.push([a, b]); });
  const weakStart = mode === 'omakase' ? weakList() : [];
  const shown = {}, okThisRound = new Set(), recent = [];
  // この回の こたえを反映した きろく（S.facts は回のおわりに まとめて書く）
  const live = {};
  const factNow = (k) => live[k] || S.facts[k];
  // おまかせでは、にがては「にがての わく」からだけ出す（ふつうの もんだいに まぜると 3回以上 出てしまう）
  const weakKeys = new Set(weakStart.map(([a, b]) => fk(a, b)));
  const normal = weakKeys.size ? all.filter(([a, b]) => !weakKeys.has(fk(a, b))) : all;
  function next() {
    let pool = normal.length ? normal : all;
    if (weakStart.length) {
      const w = weakStart.filter(([a, b]) => { const k = fk(a, b); return !okThisRound.has(k) && (shown[k] || 0) < 2; });
      if (w.length && Math.random() < 0.5) pool = w;
    }
    let q;
    for (let i = 0; i < 12; i++) {
      q = pool[Math.floor(Math.random() * pool.length)];
      const k = fk(q[0], q[1]);
      const avoid = Math.min(3, pool.length - 1);
      if (!recent.slice(-avoid).includes(k)) break;
    }
    const k = fk(q[0], q[1]);
    shown[k] = (shown[k] || 0) + 1;
    recent.push(k); if (recent.length > 3) recent.shift();
    const f = factNow(k), weak = weakOf(f);
    return { a: q[0], b: q[1], weak, left: weak ? leftOf(f) : 0 };
  }
  next.mark = (a, b, ok) => {
    const k = fk(a, b), f = factNow(k);
    const n = f ? { ...f } : { s: 0, w: 0, last: 1, streak: 0 };
    if (ok) { n.last = 1; n.streak++; okThisRound.add(k); } else { n.w++; n.last = 0; n.streak = 0; }
    live[k] = n;
    return { graduated: weakOf(f) && !weakOf(n) };
  };
  return next;
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
  const weakBefore = new Set(weakList().map(([a, b]) => fk(a, b)));
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
  // この回で にがてを そつぎょうした もんだい
  const graduated = [...weakBefore].filter(k => !weakOf(S.facts[k])).map(k => { const [a, b] = k.split('x').map(Number); return { a, b }; });
  return { correct, total: answers.length, exp, food, bonus, wrong: wrong.slice(0, 5), graduated };
}

// 前回とちゅうで閉じたチャレンジの後しまつ
// 半分（45秒なら23秒）以上やっていたら1回と数える。それより短ければ数えない
export function recoverProgress() {
  const ip = S.inProgress;
  if (!ip) return null;
  const elapsed = (ip.last - ip.start) / 1000;
  if (elapsed >= CHALLENGE_SEC / 2 && ip.day === S.day.key) return finishPlay(ip.mode, ip.answers);
  S.inProgress = null; save();
  return null;
}
