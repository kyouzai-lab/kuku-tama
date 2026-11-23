// お世話タイム（チャレンジ1回につき1回・さいだい1分・できるのは2つまで）
import * as A from './art.js';
import * as G from './state.js';
import { px, el, toStage, floatAt, petSVG } from './main.js';

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const cap = (node, e) => { try { node.setPointerCapture(e.pointerId); } catch {} };

export function startCare(showRoom) {
  const p = G.S.pet;
  const s = showRoom({ day: true, care: true });
  const petEl = s.querySelector('#pet');
  const body = petEl.querySelector('.body');
  const isEgg = p.stage === 'egg';

  const menu = isEgg
    ? [['pat', 'なでる', A.HEART], ['warm', 'あたためる', '<svg viewBox="0 0 40 40"><g filter="url(#felt)"><circle cx="20" cy="20" r="12" fill="#F0BE4B"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(r => `<rect x="18.5" y="1" width="3" height="6" rx="1.5" fill="#F0BE4B" transform="rotate(${r} 20 20)"/>`).join('') + '</g></svg>']]
    : [['feed', 'ごはん', A.ONIGIRI], ['bath', 'おふろ', '<svg viewBox="0 0 40 40"><g filter="url(#felt)"><circle cx="14" cy="22" r="9" fill="#9CC6DE"/><circle cx="26" cy="16" r="7" fill="#C8E2F0"/><circle cx="27" cy="28" r="5" fill="#9CC6DE"/></g></svg>'], ['play', 'あそぶ', A.BALL]];

  const top = el(`<div class="a caretop"><div class="pill felt st puffy">おせわタイム</div><div class="gauge time"><i class="felt" style="width:100%"></i></div><div class="tl">のこり ${G.CARE_SEC}びょう</div></div>`);
  const tray = el(`<div class="a tray felt st puffy">${menu.map(([k, n, ic]) => `<button class="btn felt st puffy press" data-k="${k}">${ic}${n}${k === 'feed' ? `<small class="small">（${p.food}）</small>` : ''}</button>`).join('')}<button class="btn end felt st puffy press" id="end">おしまい</button></div>`);
  const hint = el(`<div class="a hint felt st puffy">なにを する？ ${G.CARE_MAX_ACTIONS}つ えらべるよ</div>`);
  const bubble = el(`<div class="a bubble felt st puffy" style="left:${px(isEgg ? 640 : 700)};top:${px(isEgg ? 300 : 236)}">${isEgg ? 'ぽかぽか したいな' : (p.food > 0 ? 'おなか すいた' : 'あそびたいな')}<i></i></div>`);
  s.append(top, tray, hint, bubble);
  if (!isEgg && p.food <= 0) { const b = tray.querySelector('[data-k=feed]'); b.disabled = true; b.classList.add('done'); }

  tray.querySelectorAll('.press').forEach(b => {
    b.addEventListener('pointerdown', () => { if (!b.disabled) b.classList.add('down'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('down')));
  });

  const say = (t) => { bubble.firstChild.textContent = t; };
  const happy = (ms = 1200) => {
    if (isEgg) return;
    body.innerHTML = petSVG(p, 'happy');
    body.classList.remove('hop'); void body.offsetWidth; body.classList.add('hop');
    setTimeout(() => { if (body.isConnected) body.innerHTML = petSVG(p, 'normal'); }, ms);
  };
  const heartBurst = () => {
    const r = petEl.getBoundingClientRect(), sr = s.getBoundingClientRect(), k = sr.width / 1024;
    const cx = (r.left - sr.left + r.width / 2) / k, cy = (r.top - sr.top + r.height * .35) / k;
    [-60, 0, 60].forEach((dx, i) => setTimeout(() => floatAt(s, cx + dx, cy - Math.abs(dx) / 3, A.HEART, 54), i * 120));
  };

  let doneCount = 0, cleanup = null, finished = false, busy = false;
  const endAt = Date.now() + G.CARE_SEC * 1000;
  const bar = top.querySelector('i'), tl = top.querySelector('.tl');
  const timer = setInterval(() => {
    const left = Math.max(0, endAt - Date.now());
    bar.style.width = (left / (G.CARE_SEC * 1000) * 100) + '%';
    tl.textContent = `のこり ${Math.ceil(left / 1000)}びょう`;
    if (left <= 0) finish('じかんだよ。またね！');
  }, 200);

  async function finish(msg) {
    if (finished) return;
    finished = true; clearInterval(timer);
    cleanup?.();
    hint.textContent = msg || 'たのしかったね！';
    tray.querySelectorAll('button').forEach(b => b.disabled = true);
    G.save();
    await wait(1300);
    showRoom();
  }

  function complete(btn, msg) {
    cleanup = null; busy = false;
    p.hearts++; G.save();
    heartBurst(); happy();
    btn.classList.add('done'); btn.disabled = true;
    doneCount++;
    say(msg);
    if (doneCount >= G.CARE_MAX_ACTIONS) { finish('たのしかったね！ またね'); return; }
    hint.textContent = `あと ${G.CARE_MAX_ACTIONS - doneCount}つ できるよ`;
    tray.querySelectorAll('[data-k]').forEach(b => { if (!b.classList.contains('done')) b.disabled = false; });
  }

  tray.querySelectorAll('[data-k]').forEach(btn => btn.addEventListener('click', () => {
    if (busy || finished || btn.disabled) return;
    busy = true;
    tray.querySelectorAll('[data-k]').forEach(b => { if (b !== btn) b.disabled = true; });
    btn.classList.add('down');
    const k = btn.dataset.k;
    const doneFn = (msg) => { btn.classList.remove('down'); complete(btn, msg); };
    if (k === 'feed') cleanup = feed(doneFn);
    if (k === 'bath') cleanup = bath(doneFn);
    if (k === 'play') cleanup = play(doneFn);
    if (k === 'pat') cleanup = pat(doneFn);
    if (k === 'warm') cleanup = warm(doneFn);
  }));
  tray.querySelector('#end').addEventListener('click', () => finish('またね！'));

  // ---- ごはん：たべものを くちまで はこぶ ----
  function feed(done) {
    hint.textContent = 'ごはんを ゆびで くちまで はこんでね';
    say('わあ ごはんだ！');
    const home = { x: 150, y: 420 };
    const f = el(`<div class="food">${A.ONIGIRI}</div>`);
    f.style.left = px(home.x); f.style.top = px(home.y);
    s.appendChild(f);
    let drag = false;
    const move = (e) => { if (!drag) return; const pt = toStage(e); f.style.left = px(pt.x - 45); f.style.top = px(pt.y - 45); };
    const up = (e) => {
      if (!drag) return; drag = false;
      const pt = toStage(e);
      // くちのあたり（キャラの上半分）
      const r = petEl.getBoundingClientRect(), sr = s.getBoundingClientRect(), k = sr.width / 1024;
      const L = (r.left - sr.left) / k, T = (r.top - sr.top) / k, W = r.width / k, H = r.height / k;
      const inMouth = pt.x > L + W * .2 && pt.x < L + W * .8 && pt.y > T + H * .05 && pt.y < T + H * .6;
      if (inMouth) {
        f.remove();
        p.food = Math.max(0, p.food - 1);
        const fb = tray.querySelector('[data-k=feed] small'); if (fb) fb.textContent = `（${p.food}）`;
        say('もぐもぐ… おいしい！');
        done('おなか いっぱい！');
      } else {
        f.style.transition = 'left .3s, top .3s'; f.style.left = px(home.x); f.style.top = px(home.y);
        setTimeout(() => { f.style.transition = ''; }, 320);
      }
    };
    f.addEventListener('pointerdown', (e) => { drag = true; cap(f, e); });
    f.addEventListener('pointermove', move);
    f.addEventListener('pointerup', up);
    f.addEventListener('pointercancel', up);
    return () => f.remove();
  }

  // ---- おふろ：こすって あわあわ → シャワー ----
  function bath(done) {
    hint.textContent = 'ゆびで こすって あわあわに しよう';
    say('おふろ だいすき！');
    const NEED = 22; let n = 0, lastPt = null, down = false;
    const suds = [];
    const over = el(`<div class="a" style="left:${px(312)};top:${px(197)};width:${px(400)};height:${px(480)};z-index:7;touch-action:none"></div>`);
    s.appendChild(over);
    const add = (pt) => {
      if (lastPt && Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) < 22) return;
      lastPt = pt;
      const size = 34 + Math.random() * 34;
      const b = el(`<div class="suds" style="left:${px(pt.x - size / 2)};top:${px(pt.y - size / 2)};width:${px(size)};height:${px(size)}"></div>`);
      s.appendChild(b); suds.push(b); n++;
      if (n === Math.floor(NEED / 2)) say('くすぐったーい！');
      if (n >= NEED) rinse();
    };
    let rinsing = false;
    async function rinse() {
      if (rinsing) return; rinsing = true; down = false;
      hint.textContent = 'シャワーで ながすよ';
      const sh = el('<div class="shower"></div>'); s.appendChild(sh);
      suds.forEach((b, i) => setTimeout(() => b.classList.add('rinse'), i * 25));
      await wait(1400);
      sh.remove(); suds.forEach(b => b.remove()); over.remove();
      done('ぴかぴかに なった！');
    }
    over.addEventListener('pointerdown', (e) => { down = true; cap(over, e); add(toStage(e)); });
    over.addEventListener('pointermove', (e) => { if (down && !rinsing) add(toStage(e)); });
    ['pointerup', 'pointercancel'].forEach(ev => over.addEventListener(ev, () => { down = false; }));
    return () => { over.remove(); suds.forEach(b => b.remove()); s.querySelector('.shower')?.remove(); };
  }

  // ---- あそぶ：ボールを はじく → とりに行く ----
  function play(done) {
    hint.textContent = 'ボールを ゆびで はじいてね（3かい）';
    say('ボール なげて！');
    const R = 40, FLOOR = 700, rest = { x: 230, y: FLOOR - R };
    const ball = el(`<div class="ball">${A.BALL}</div>`);
    s.appendChild(ball);
    let x = rest.x, y = rest.y, vx = 0, vy = 0, flying = false, drag = false, hist = [], raf = 0, throws = 0, petX = 0, alive = true;
    const place = () => { ball.style.left = px(x - R); ball.style.top = px(y - R); ball.style.transform = `rotate(${x * 2}deg)`; };
    place();
    ball.addEventListener('pointerdown', (e) => {
      if (flying) return; drag = true; hist = []; cap(ball, e);
    });
    ball.addEventListener('pointermove', (e) => {
      if (!drag) return; const pt = toStage(e);
      x = Math.min(1024 - R, Math.max(R, pt.x)); y = Math.min(FLOOR - R, Math.max(140, pt.y));
      hist.push({ x, y, t: performance.now() }); if (hist.length > 6) hist.shift(); place();
    });
    const release = () => {
      if (!drag) return; drag = false;
      if (hist.length >= 2) {
        const a = hist[0], b = hist[hist.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
        vx = (b.x - a.x) / dt; vy = (b.y - a.y) / dt;
      }
      const sp = Math.hypot(vx, vy);
      if (sp < 200) { vx = (Math.random() < .5 ? -1 : 1) * 500; vy = -900; }
      if (sp > 2600) { vx *= 2600 / sp; vy *= 2600 / sp; }
      flying = true; let last = performance.now();
      const step = (t) => {
        if (!alive) return;
        const dt = Math.min(.033, (t - last) / 1000); last = t;
        vy += 2600 * dt; x += vx * dt; y += vy * dt;
        if (y > FLOOR - R) { y = FLOOR - R; vy *= -.55; vx *= .8; if (Math.abs(vy) < 120) vy = 0; }
        if (x < R) { x = R; vx = Math.abs(vx) * .7; }
        if (x > 1024 - R) { x = 1024 - R; vx = -Math.abs(vx) * .7; }
        if (y < 120) { y = 120; vy = Math.abs(vy); }
        if (vy === 0 && y >= FLOOR - R) vx *= .96;
        place();
        if (vy === 0 && Math.abs(vx) < 20) { flying = false; fetch(); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    ball.addEventListener('pointerup', release);
    ball.addEventListener('pointercancel', release);
    async function fetch() {
      // キャラがボールのところまで歩く
      const target = Math.max(-300, Math.min(300, x - 512));
      petEl.style.transition = 'transform .7s ease-in-out';
      petEl.style.transform = `translateX(${px(target)})`;
      petX = target;
      await wait(750);
      if (!alive) return;
      throws++;
      say(throws >= 3 ? 'いっぱい あそんだ！' : 'とった！ もういっかい！');
      happy(700);
      if (throws >= 3) {
        petEl.style.transform = ''; ball.remove();
        done('あー たのしかった！');
        return;
      }
      // ボールを足もとに もどす
      x = Math.max(R, Math.min(1024 - R, 512 + petX + 150)); y = FLOOR - R; vx = vy = 0; place();
      hint.textContent = `ボールを はじいてね（あと ${3 - throws}かい）`;
    }
    return () => { alive = false; cancelAnimationFrame(raf); ball.remove(); petEl.style.transform = ''; };
  }

  // ---- なでる（たまご） ----
  function pat(done) {
    hint.textContent = 'たまごを ゆびで なでなで しよう';
    say('…ことこと');
    let dist = 0, last = null, down = false, cnt = 0;
    const over = el(`<div class="a" style="left:${px(312)};top:${px(197)};width:${px(400)};height:${px(480)};z-index:7;touch-action:none"></div>`);
    s.appendChild(over);
    over.addEventListener('pointerdown', (e) => { down = true; last = toStage(e); cap(over, e); });
    over.addEventListener('pointermove', (e) => {
      if (!down) return; const pt = toStage(e);
      dist += Math.hypot(pt.x - last.x, pt.y - last.y); last = pt;
      if (dist > 60) { dist = 0; cnt++; floatAt(s, pt.x, pt.y - 20, A.HEART, 40); }
      if (cnt >= 12) { over.remove(); down = false; done('…うれしい！（ことっ）'); }
    });
    ['pointerup', 'pointercancel'].forEach(ev => over.addEventListener(ev, () => { down = false; }));
    return () => over.remove();
  }

  // ---- あたためる（たまご）：ながおし ----
  function warm(done) {
    hint.textContent = 'たまごを ゆびで おさえて あたためよう';
    say('ぽかぽか したいな');
    const glow = s.querySelector('.warm');
    const over = el(`<div class="a" style="left:${px(312)};top:${px(197)};width:${px(400)};height:${px(480)};z-index:7;touch-action:none"></div>`);
    s.appendChild(over);
    let k = 0, holding = false, raf = 0, last = 0;
    const tick = (t) => {
      const dt = last ? (t - last) / 1000 : 0; last = t;
      k = Math.max(0, Math.min(1, k + (holding ? dt / 2.5 : -dt / 2)));
      glow.style.transform = `scale(${0.4 + k * 1.6})`; glow.style.opacity = String(k);
      if (k >= 1) { over.remove(); holding = false; setTimeout(() => { glow.style.transform = 'scale(0)'; }, 900); done('ぽかぽか… あったかい！'); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    over.addEventListener('pointerdown', (e) => { holding = true; cap(over, e); });
    ['pointerup', 'pointercancel'].forEach(ev => over.addEventListener(ev, () => { holding = false; }));
    return () => { cancelAnimationFrame(raf); over.remove(); glow.style.transform = 'scale(0)'; };
  }
}
