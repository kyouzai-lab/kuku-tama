// キャラとたまごの絵（SVGを部品の組み合わせで作る）
const INK = '#4A3B32';

export const SPECIES = {
  hiyoko: { n: 'ひよこ', c: '#F0BE4B', d: '#D59E2E', b: '#F9DE96', ear: 'none', tail: 'none', nose: 'beak', arm: 'wing', extra: 'tuft', feet: '#E8874F' },
  kuma:   { n: 'こぐま', c: '#C99A66', d: '#A67A4A', b: '#EED3AC', ear: 'round', tail: 'nub', nose: 'muzzle' },
  neko:   { n: 'ねこ', c: '#B9B3AC', d: '#948C84', b: '#EFEAE4', ear: 'tri', tail: 'long', nose: 'cat', extra: 'stripes' },
  usagi:  { n: 'うさぎ', c: '#F4C2BE', d: '#DDA09B', b: '#FCE6E3', ear: 'long', tail: 'puff', nose: 'cat' },
  inu:    { n: 'こいぬ', c: '#F1E2C8', d: '#C99A66', b: '#FFF7EA', ear: 'flop', tail: 'wag', nose: 'muzzle', extra: 'spot' },
  pengin: { n: 'ペンギン', c: '#6E9FC4', d: '#557FA0', b: '#FBF8F2', ear: 'none', tail: 'none', nose: 'beak', arm: 'flipper', face: 'mask', feet: '#E8874F' },
};

export const TYPES = {
  kotsu:   { n: 'こつこつ', s: '小さい段を たくさん' },
  chosen:  { n: 'ちょうせん', s: '大きい段を たくさん' },
  nandemo: { n: 'なんでも', s: 'おまかせを たくさん' },
  ganba:   { n: 'がんばりや', s: 'にがてを たくさん やりなおし' },
};

export const STAGE_NAMES = { egg: 'たまご', baby: 'あかちゃん', child: 'こども', adult: 'おとな' };

const ST = {
  baby:  { hx: 100, hy: 120, hr: 60, bx: 100, by: 186, brx: 46, bry: 36 },
  child: { hx: 100, hy: 88, hr: 52, bx: 100, by: 162, brx: 40, bry: 44, legH: 30 },
  adult: { hx: 100, hy: 68, hr: 46, bx: 100, by: 150, brx: 44, bry: 58, legH: 34 },
};

const stitch = (el) => el.replace('/>', ' fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.8" stroke-dasharray="4 3"/>');

// opt: { face: 'normal' | 'sleep' | 'happy' }
export function critter(sp, stage = 'child', type = null, opt = {}) {
  const s = SPECIES[sp], g = ST[stage];
  const { hx, hy, hr, bx, by, brx, bry } = g;
  const face = opt.face || 'normal';
  let o = '';
  if (type === 'nandemo') o += `<path d="M${bx - brx * .7} ${by - bry * .8} Q${bx - brx - 26} ${by + bry * .4} ${bx - brx - 14} ${by + bry + 6} L${bx + brx + 14} ${by + bry + 6} Q${bx + brx + 26} ${by + bry * .4} ${bx + brx * .7} ${by - bry * .8} Z" fill="#E2694A"/>`;
  const tx = bx + brx - 4, ty = by + bry * .35;
  if (s.tail === 'long') o += `<path d="M${tx - 6} ${ty + 8} C${tx + 34} ${ty + 10} ${tx + 40} ${ty - 30} ${tx + 22} ${ty - 48}" fill="none" stroke="${s.c}" stroke-width="13" stroke-linecap="round"/><path d="M${tx + 30} ${ty - 30} l-4 -14" stroke="${s.d}" stroke-width="13" stroke-linecap="round"/>`;
  if (s.tail === 'wag') o += `<path class="wag" d="M${tx - 4} ${ty} Q${tx + 26} ${ty - 6} ${tx + 26} ${ty - 34}" fill="none" stroke="${s.d}" stroke-width="12" stroke-linecap="round"/>`;
  if (s.tail === 'puff') o += `<circle cx="${tx + 8}" cy="${ty + 6}" r="14" fill="${s.b}"/>`;
  if (s.tail === 'nub') o += `<circle cx="${tx + 4}" cy="${ty + 10}" r="11" fill="${s.d}"/>`;
  const foot = s.feet || s.d;
  if (stage === 'baby') {
    o += `<ellipse cx="${bx - 24}" cy="${by + bry - 6}" rx="16" ry="12" fill="${foot}"/><ellipse cx="${bx + 24}" cy="${by + bry - 6}" rx="16" ry="12" fill="${foot}"/>`;
  } else {
    const ly = by + bry - 16, lh = g.legH;
    o += `<rect x="${bx - 26}" y="${ly}" width="20" height="${lh}" rx="10" fill="${s.c}"/><rect x="${bx + 6}" y="${ly}" width="20" height="${lh}" rx="10" fill="${s.c}"/>`;
    o += `<ellipse cx="${bx - 17}" cy="${ly + lh - 2}" rx="15" ry="8" fill="${foot}"/><ellipse cx="${bx + 17}" cy="${ly + lh - 2}" rx="15" ry="8" fill="${foot}"/>`;
  }
  o += `<ellipse cx="${bx}" cy="${by}" rx="${brx}" ry="${bry}" fill="${s.c}"/>`;
  o += `<ellipse cx="${bx}" cy="${by + bry * .14}" rx="${brx * .66}" ry="${bry * .68}" fill="${s.b}"/>`;
  o += stitch(`<ellipse cx="${bx}" cy="${by + bry * .14}" rx="${brx * .66 - 4}" ry="${bry * .68 - 4}"/>`);
  if (type === 'kotsu') o += `<path d="M${bx - 22} ${by - bry * .5} L${hx - 10} ${hy + hr - 4} M${bx + 22} ${by - bry * .5} L${hx + 10} ${hy + hr - 4}" stroke="#5E9A7C" stroke-width="5" stroke-linecap="round"/><rect x="${bx - 30}" y="${by - bry * .5}" width="60" height="${bry * 1.25}" rx="16" fill="#86C2A3"/>` + stitch(`<rect x="${bx - 26}" y="${by - bry * .5 + 4}" width="52" height="${bry * 1.25 - 8}" rx="13"/>`) + `<rect x="${bx - 14}" y="${by + bry * .1}" width="28" height="18" rx="7" fill="#5E9A7C"/>`;
  if (type === 'chosen') o += `<path d="M${bx - brx * .55} ${by - bry * .75} Q${bx - brx * .5} ${by} ${bx - brx * .6} ${by + bry * .55} M${bx + brx * .55} ${by - bry * .75} Q${bx + brx * .5} ${by} ${bx + brx * .6} ${by + bry * .55}" fill="none" stroke="#E2694A" stroke-width="7" stroke-linecap="round"/>`;
  if (type === 'ganba') o += `<path d="M${bx - 9} ${by - bry * .7} L${bx} ${by - bry * .25} L${bx + 9} ${by - bry * .7}" fill="#86C2A3"/><circle cx="${bx}" cy="${by - bry * .18}" r="12" fill="#F0BE4B"/><circle cx="${bx}" cy="${by - bry * .18}" r="6" fill="#D59E2E"/>`;
  const ar = stage === 'baby' ? [10, 15] : [11, 21], ay = by - bry * .2, ac = s.arm ? s.d : s.c;
  const ry = s.arm === 'flipper' ? ar[1] * 1.4 : ar[1];
  const upL = (type === 'chosen' || face === 'happy') ? -150 : 28;
  const upR = face === 'happy' ? 150 : -28;
  o += `<ellipse cx="${bx - brx + 2}" cy="${ay + ry * .6}" rx="${ar[0]}" ry="${ry}" fill="${ac}" transform="rotate(${upL} ${bx - brx + 4} ${ay})"/>`;
  o += `<ellipse cx="${bx + brx - 2}" cy="${ay + ry * .6}" rx="${ar[0]}" ry="${ry}" fill="${ac}" transform="rotate(${upR} ${bx + brx - 4} ${ay})"/>`;
  if (s.ear === 'round') [-1, 1].forEach(k => { o += `<circle cx="${hx + k * hr * .72}" cy="${hy - hr * .7}" r="${hr * .32}" fill="${s.c}"/><circle cx="${hx + k * hr * .72}" cy="${hy - hr * .7}" r="${hr * .17}" fill="${s.b}"/>`; });
  if (s.ear === 'tri') [-1, 1].forEach(k => { o += `<path d="M${hx + k * hr * .9} ${hy - hr * .2} L${hx + k * hr * .72} ${hy - hr * 1.1} L${hx + k * hr * .18} ${hy - hr * .8} Z" fill="${s.c}" stroke="${s.c}" stroke-width="12" stroke-linejoin="round"/><path d="M${hx + k * hr * .74} ${hy - hr * .42} L${hx + k * hr * .66} ${hy - hr * .92} L${hx + k * hr * .38} ${hy - hr * .74} Z" fill="#F2A7A3" stroke="#F2A7A3" stroke-width="5" stroke-linejoin="round"/>`; });
  if (s.ear === 'long') [-1, 1].forEach(k => { o += `<ellipse cx="${hx + k * hr * .36}" cy="${hy - hr * 1.12}" rx="${hr * .21}" ry="${hr * .62}" fill="${s.c}" transform="rotate(${k * 10} ${hx + k * hr * .36} ${hy - hr * .6})"/><ellipse cx="${hx + k * hr * .36}" cy="${hy - hr * 1.1}" rx="${hr * .1}" ry="${hr * .45}" fill="#F2A7A3" transform="rotate(${k * 10} ${hx + k * hr * .36} ${hy - hr * .6})"/>`; });
  o += `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${s.c}"/>`;
  o += stitch(`<circle cx="${hx}" cy="${hy}" r="${hr - 5}"/>`);
  if (s.face === 'mask') o += `<path d="M${hx} ${hy + hr * .82} C${hx - hr * .9} ${hy + hr * .7} ${hx - hr * .86} ${hy - hr * .4} ${hx - hr * .36} ${hy - hr * .36} C${hx - hr * .14} ${hy - hr * .36} ${hx} ${hy - hr * .22} ${hx} ${hy - hr * .1} C${hx} ${hy - hr * .22} ${hx + hr * .14} ${hy - hr * .36} ${hx + hr * .36} ${hy - hr * .36} C${hx + hr * .86} ${hy - hr * .4} ${hx + hr * .9} ${hy + hr * .7} ${hx} ${hy + hr * .82} Z" fill="${s.b}"/>`;
  if (s.extra === 'stripes') [-1, 0, 1].forEach(k => { o += `<path d="M${hx + k * hr * .22} ${hy - hr * .92} L${hx + k * hr * .18} ${hy - hr * .62}" stroke="${s.d}" stroke-width="7" stroke-linecap="round"/>`; });
  if (s.extra === 'spot') o += `<ellipse cx="${hx + hr * .36}" cy="${hy + hr * .04}" rx="${hr * .25}" ry="${hr * .23}" fill="${s.d}" opacity=".75"/>`;
  if (s.extra === 'tuft') [-1, 0, 1].forEach(k => { o += `<ellipse cx="${hx + k * hr * .16}" cy="${hy - hr * 1.02}" rx="${hr * .08}" ry="${hr * .2}" fill="${s.d}" transform="rotate(${k * 24} ${hx + k * hr * .16} ${hy - hr * .9})"/>`; });
  if (type === 'ganba') o += `<path d="M${hx - hr * .97} ${hy - hr * .32} Q${hx} ${hy - hr * .62} ${hx + hr * .97} ${hy - hr * .32}" fill="none" stroke="#E2694A" stroke-width="${hr * .2}" stroke-linecap="round"/><path d="M${hx + hr * .9} ${hy - hr * .36} l${hr * .36} ${-hr * .12} M${hx + hr * .9} ${hy - hr * .34} l${hr * .3} ${hr * .2}" stroke="#E2694A" stroke-width="${hr * .13}" stroke-linecap="round"/>`;
  const ey = hy + hr * .08;
  [-1, 1].forEach(k => {
    const ex = hx + k * hr * .34;
    if (face === 'sleep') o += `<path d="M${ex - hr * .1} ${ey} Q${ex} ${ey + hr * .09} ${ex + hr * .1} ${ey}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
    else if (face === 'happy') o += `<path d="M${ex - hr * .1} ${ey + hr * .03} Q${ex} ${ey - hr * .1} ${ex + hr * .1} ${ey + hr * .03}" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
    else o += `<g class="eye"><ellipse cx="${ex}" cy="${ey}" rx="${hr * .085}" ry="${hr * .115}" fill="${INK}"/><circle cx="${ex - hr * .03}" cy="${ey - hr * .045}" r="${hr * .032}" fill="#fff"/></g>`;
  });
  [-1, 1].forEach(k => { o += `<circle cx="${hx + k * hr * .6}" cy="${hy + hr * .34}" r="${hr * .13}" fill="#F2A7A3" opacity=".9"/>`; });
  if (s.nose === 'beak') o += `<path d="M${hx - hr * .15} ${hy + hr * .27} Q${hx} ${hy + hr * .12} ${hx + hr * .15} ${hy + hr * .27} Q${hx} ${hy + hr * .5} ${hx - hr * .15} ${hy + hr * .27} Z" fill="#E8874F"/>`;
  if (s.nose === 'muzzle') o += `<ellipse cx="${hx}" cy="${hy + hr * .38}" rx="${hr * .3}" ry="${hr * .22}" fill="${s.b}"/><ellipse cx="${hx}" cy="${hy + hr * .29}" rx="${hr * .1}" ry="${hr * .07}" fill="${INK}"/>` + (face === 'happy' ? `<path d="M${hx - hr * .12} ${hy + hr * .42} Q${hx} ${hy + hr * .6} ${hx + hr * .12} ${hy + hr * .42} Z" fill="#E58C8A"/>` : `<path d="M${hx - hr * .1} ${hy + hr * .44} Q${hx} ${hy + hr * .52} ${hx + hr * .1} ${hy + hr * .44}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`);
  if (s.nose === 'cat') {
    o += `<path d="M${hx - hr * .06} ${hy + hr * .26} L${hx + hr * .06} ${hy + hr * .26} L${hx} ${hy + hr * .33} Z" fill="#E58C8A" stroke="#E58C8A" stroke-width="3" stroke-linejoin="round"/><path d="M${hx - hr * .14} ${hy + hr * .37} q${hr * .07} ${hr * .09} ${hr * .14} 0 q${hr * .07} ${hr * .09} ${hr * .14} 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
    if (sp === 'neko') [-1, 1].forEach(k => { o += `<path d="M${hx + k * hr * .42} ${hy + hr * .28} l${k * hr * .32} ${-hr * .05} M${hx + k * hr * .42} ${hy + hr * .38} l${k * hr * .32} ${hr * .04}" stroke="${s.d}" stroke-width="2" stroke-dasharray="3 3" stroke-linecap="round"/>`; });
  }
  if (s.ear === 'flop') [-1, 1].forEach(k => { o += `<ellipse cx="${hx + k * hr * .9}" cy="${hy - hr * .12}" rx="${hr * .24}" ry="${hr * .46}" fill="${s.d}" transform="rotate(${k * -18} ${hx + k * hr * .9} ${hy - hr * .4})"/>`; });
  if (type === 'chosen') o += `<ellipse cx="${hx}" cy="${hy - hr * .6}" rx="${hr * 1.08}" ry="${hr * .2}" fill="#B88A55"/><path d="M${hx - hr * .62} ${hy - hr * .62} Q${hx - hr * .6} ${hy - hr * 1.3} ${hx} ${hy - hr * 1.3} Q${hx + hr * .6} ${hy - hr * 1.3} ${hx + hr * .62} ${hy - hr * .62} Z" fill="#CFA772"/><rect x="${hx - hr * .62}" y="${hy - hr * .8}" width="${hr * 1.24}" height="${hr * .16}" fill="#E2694A"/>`;
  if (type === 'nandemo') { const sx = bx, sy = by - bry * .72; o += `<path d="M${sx - 26} ${sy - 4} Q${sx} ${sy + 14} ${sx + 26} ${sy - 4}" fill="none" stroke="#B24B30" stroke-width="7" stroke-linecap="round"/><path d="M${sx} ${sy - 4} l4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1z" fill="#F0BE4B"/>`; }
  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"><g filter="url(#felt)">${o}</g></svg>`;
}

let eggN = 0;
const EGG_PATH = 'M60 8 C92 8 112 62 112 92 C112 124 88 144 60 144 C32 144 8 124 8 92 C8 62 28 8 60 8 Z';
export function egg(sp, opt = {}) {
  const s = SPECIES[sp], id = 'eg' + (eggN++);
  let pat = '';
  if (sp === 'hiyoko') [[38, 40, 9], [76, 58, 7], [46, 92, 8], [84, 104, 10], [60, 126, 6], [30, 118, 6]].forEach(([x, y, r]) => pat += `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6DA"/>`);
  if (sp === 'kuma') [[42, 52, 12], [80, 80, 15], [44, 112, 11], [86, 124, 8]].forEach(([x, y, r]) => pat += `<circle cx="${x}" cy="${y}" r="${r}" fill="${s.b}"/>`);
  if (sp === 'neko') [40, 70, 100, 126].forEach(y => pat += `<path d="M0 ${y} Q30 ${y - 12} 60 ${y} T120 ${y}" fill="none" stroke="${s.d}" stroke-width="10"/>`);
  if (sp === 'usagi') pat += `<ellipse cx="46" cy="54" rx="10" ry="30" fill="${s.b}" transform="rotate(-12 46 54)"/><ellipse cx="74" cy="54" rx="10" ry="30" fill="${s.b}" transform="rotate(12 74 54)"/><circle cx="60" cy="112" r="16" fill="${s.b}"/>`;
  if (sp === 'inu') [[42, 56], [78, 96], [40, 122]].forEach(([x, y]) => pat += `<ellipse cx="${x}" cy="${y + 4}" rx="8" ry="7" fill="${s.d}"/><circle cx="${x - 8}" cy="${y - 6}" r="3.6" fill="${s.d}"/><circle cx="${x}" cy="${y - 9}" r="3.6" fill="${s.d}"/><circle cx="${x + 8}" cy="${y - 6}" r="3.6" fill="${s.d}"/>`);
  if (sp === 'pengin') pat += `<path d="M0 84 Q20 70 40 84 T80 84 T120 84 L120 112 Q100 98 80 112 T40 112 T0 112 Z" fill="${s.b}"/>`;
  const crack = opt.crack ? `<path d="M14 84 L32 74 L44 88 L60 72 L74 88 L88 74 L106 84" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${id}"><path d="${EGG_PATH}"/></clipPath></defs><g filter="url(#felt)"><path d="${EGG_PATH}" fill="${s.c}"/><g clip-path="url(#${id})">${pat}</g><path d="${EGG_PATH}" transform="translate(6 7.5) scale(.9)" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="2" stroke-dasharray="4 3"/>${crack}</g></svg>`;
}

export const ONIGIRI = '<svg viewBox="0 0 40 40"><g filter="url(#felt)"><path d="M20 4 C26 4 36 22 36 28 C36 34 30 36 20 36 C10 36 4 34 4 28 C4 22 14 4 20 4Z" fill="#FBF8F2"/><rect x="11" y="24" width="18" height="12" rx="3" fill="#3E4A3A"/></g></svg>';
export const HEART = '<svg viewBox="0 0 40 40"><g filter="url(#felt)"><path d="M20 34 C8 26 4 20 4 14 C4 9 8 5 13 5 C16 5 19 7 20 10 C21 7 24 5 27 5 C32 5 36 9 36 14 C36 20 32 26 20 34Z" fill="#F2A7A3"/></g></svg>';
export const BALL = '<svg viewBox="0 0 40 40"><g filter="url(#felt)"><circle cx="20" cy="20" r="17" fill="#E2694A"/><path d="M5 17 Q20 26 35 17" fill="none" stroke="#FBF8F2" stroke-width="5"/><circle cx="20" cy="20" r="13" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.5" stroke-dasharray="3 3"/></g></svg>';
