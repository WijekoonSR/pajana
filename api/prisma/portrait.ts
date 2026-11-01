// Illustrated portraits (fashion-illustration style SVG) for seed data.
// Fictional, clearly drawn characters: no photos and no real or identifiable
// people (SRS Q04, section 10).

export type HairStyle = 'long' | 'bob' | 'ponytail' | 'bun' | 'wavy' | 'side';

export interface Look {
  hair: HairStyle;
  hairColor: string;
  skin: string;
  outfit: string;
  lips: string;
}

/** One stable look per cast member, by index. */
export const LOOKS: Look[] = [
  { hair: 'long', hairColor: '#2b1b17', skin: '#f6d5c3', outfit: '#ffffff', lips: '#d1496b' },
  { hair: 'bob', hairColor: '#4a2c20', skin: '#f1c7ae', outfit: '#2a0e1c', lips: '#c2185b' },
  { hair: 'ponytail', hairColor: '#7a4a2b', skin: '#f9dccb', outfit: '#ff8fb8', lips: '#e0577f' },
  { hair: 'wavy', hairColor: '#c08a4d', skin: '#e8b796', outfit: '#6e1440', lips: '#b0124f' },
  { hair: 'bun', hairColor: '#3a2620', skin: '#f3cdb6', outfit: '#f4cadb', lips: '#d1496b' },
  { hair: 'side', hairColor: '#d97a9c', skin: '#f7d8c8', outfit: '#24091a', lips: '#c81d5c' },
  { hair: 'long', hairColor: '#8c8c9a', skin: '#dca684', outfit: '#c81d5c', lips: '#a8164c' },
  { hair: 'bob', hairColor: '#2b1b17', skin: '#f6d5c3', outfit: '#ffe8f0', lips: '#d1496b' },
];

const BACKDROPS = [
  ['#ffe3ee', '#ffb3cf', '#ff6fa3'],
  ['#fff0f5', '#f8c8dc', '#e86a9a'],
  ['#ffe9e1', '#ffc2c7', '#f0809b'],
  ['#fbe3ee', '#e9a6c6', '#b8327a'],
];

const POSES = [
  { tilt: -4, eyes: 'open' as const, smile: false },
  { tilt: 5, eyes: 'closed' as const, smile: true },
  { tilt: -1, eyes: 'open' as const, smile: true },
];

function hairBack(style: HairStyle, c: string): string {
  switch (style) {
    case 'long':
      return `<path d="M178 360 C160 220 230 200 300 200 C370 200 440 220 422 360 L452 660 C390 700 210 700 148 660 Z" fill="${c}"/>`;
    case 'wavy':
      return `<path d="M176 360 C158 220 230 200 300 200 C370 200 442 220 424 360 C450 420 420 470 452 530 C476 580 440 630 460 670 C390 710 210 710 140 670 C160 630 124 580 148 530 C180 470 150 420 176 360 Z" fill="${c}"/>`;
    case 'bob':
      return `<path d="M186 360 C176 228 236 208 300 208 C364 208 424 228 414 360 L422 498 C380 522 220 522 178 498 Z" fill="${c}"/>`;
    case 'side':
      return `<path d="M180 360 C164 222 232 202 300 202 C368 202 436 222 420 360 L440 600 C400 640 300 640 260 620 L170 560 Z" fill="${c}"/>`;
    case 'ponytail':
      return `<path d="M390 290 C480 290 492 420 462 590 C446 548 432 440 392 372 Z" fill="${c}"/>`;
    case 'bun':
      return `<circle cx="300" cy="218" r="58" fill="${c}"/><circle cx="300" cy="218" r="58" fill="#ffffff" fill-opacity="0.06"/>`;
  }
}

function hairFront(style: HairStyle, c: string): string {
  // Cap over the top of the head with a soft fringe line.
  const cap = `<path d="M206 392 C190 262 238 232 300 232 C362 232 410 262 394 392 C386 330 356 298 322 296 C300 318 262 326 230 322 C216 340 210 362 206 392 Z" fill="${c}"/>`;
  const shine = `<path d="M246 262 C270 248 300 246 326 252" stroke="#ffffff" stroke-opacity="0.22" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  const extra =
    style === 'side'
      ? `<path d="M232 300 C176 400 206 500 176 610 C226 540 246 440 262 330 Z" fill="${c}"/>`
      : style === 'bun'
        ? `<path d="M300 236 C318 250 322 270 316 290" stroke="${c}" stroke-width="10" fill="none"/>`
        : '';
  return cap + extra + shine;
}

function face(look: Look, eyes: 'open' | 'closed', smile: boolean): string {
  const ink = '#3a2026';
  const eye = (x: number) =>
    eyes === 'open'
      ? `<path d="M${x - 20} 394 Q${x} 378 ${x + 20} 394" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>
         <circle cx="${x}" cy="396" r="8" fill="${ink}"/><circle cx="${x + 3}" cy="393" r="2.4" fill="#ffffff"/>
         <path d="M${x + 18} 390 l8 -6" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M${x - 18} 392 Q${x} 404 ${x + 18} 392" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>
         <path d="M${x - 10} 400 l-3 7 M${x} 402 l0 7 M${x + 10} 400 l3 7" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
  const mouth = smile
    ? `<path d="M280 452 Q300 474 320 452 Q300 462 280 452 Z" fill="${look.lips}"/>`
    : `<path d="M282 452 Q300 444 318 452 Q300 468 282 452 Z" fill="${look.lips}"/>`;
  return `
    <ellipse cx="214" cy="402" rx="14" ry="22" fill="${look.skin}"/>
    <ellipse cx="386" cy="402" rx="14" ry="22" fill="${look.skin}"/>
    <ellipse cx="300" cy="384" rx="88" ry="114" fill="${look.skin}"/>
    <path d="M248 360 Q270 348 292 358 M308 358 Q330 348 352 360" stroke="${look.hairColor}" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${eye(270)}${eye(330)}
    <path d="M301 404 Q295 428 305 432" stroke="#000000" stroke-opacity="0.18" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="252" cy="428" rx="20" ry="11" fill="#ff7aa2" fill-opacity="0.28"/>
    <ellipse cx="348" cy="428" rx="20" ry="11" fill="#ff7aa2" fill-opacity="0.28"/>
    ${mouth}
    <circle cx="214" cy="430" r="6" fill="#f2c14e"/><circle cx="386" cy="430" r="6" fill="#f2c14e"/>`;
}

/** Figure in a 600x800 box, without background. Flat fills only, so it can be embedded. */
function figure(look: Look, poseIndex: number): string {
  const pose = POSES[poseIndex % POSES.length];
  const lightOutfit = ['#ffffff', '#ffe8f0', '#f4cadb', '#ff8fb8'].includes(look.outfit);
  return `
  <g>
    ${hairBack(look.hair, look.hairColor)}
    <path d="M86 800 C96 650 176 598 300 590 C424 598 504 650 514 800 Z" fill="${look.outfit}"/>
    <path d="M86 800 C96 650 176 598 300 590 C424 598 504 650 514 800 Z" fill="${lightOutfit ? '#c81d5c' : '#ffffff'}" fill-opacity="0.07"/>
    <g transform="rotate(${pose.tilt} 300 590)">
      <path d="M266 470 L266 588 C280 612 320 612 334 588 L334 470 Z" fill="${look.skin}"/>
      <path d="M266 520 C286 540 314 540 334 520 L334 500 C314 520 286 520 266 500 Z" fill="#000000" fill-opacity="0.08"/>
      ${face(look, pose.eyes, pose.smile)}
      ${hairFront(look.hair, look.hairColor)}
    </g>
    <path d="M226 598 C254 668 346 668 374 598 C350 590 250 590 226 598 Z" fill="${look.skin}"/>
    <path d="M244 606 C266 652 334 652 356 606" stroke="#f2c14e" stroke-width="2.5" fill="none"/>
    <circle cx="300" cy="640" r="6" fill="#f2c14e"/>
  </g>`;
}

function backdrop(w: number, h: number, seed: number): string {
  const [c1, c2, c3] = BACKDROPS[seed % BACKDROPS.length];
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="0.6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${w * 0.15}" cy="${h * 0.18}" r="${w * 0.12}" fill="#ffffff" fill-opacity="0.18"/>
  <circle cx="${w * 0.88}" cy="${h * 0.3}" r="${w * 0.07}" fill="#ffffff" fill-opacity="0.22"/>
  <circle cx="${w * 0.8}" cy="${h * 0.75}" r="${w * 0.16}" fill="#ffffff" fill-opacity="0.1"/>
  <text x="${w * 0.1}" y="${h * 0.42}" font-size="${w * 0.07}" fill="#ffffff" fill-opacity="0.5">♥</text>`;
}

/** 600x800 cast portrait. `look` is per cast member, `variant` per photo. */
export function portraitSvg(look: Look, variant: number, label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" role="img" aria-label="Illustrated portrait">
  ${backdrop(600, 800, variant + look.hair.length)}
  <g transform="translate(-75 -110) scale(1.25)">${figure(look, variant)}</g>
  <text x="300" y="770" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="${['#ffffff', '#ffe8f0', '#f4cadb'].includes(look.outfit) ? '#6e1440' : '#ffffff'}" fill-opacity="0.85">${label}</text>
</svg>
`;
}

/** 1600x900 hero banner with a row of illustrated cast members. */
export function bannerSvg(seed: number, label: string): string {
  const looks = [0, 1, 2].map((i) => LOOKS[(seed * 3 + i) % LOOKS.length]);
  const slots = [
    { x: 530, y: 190, s: 0.95 },
    { x: 800, y: 140, s: 1.0 },
    { x: 1070, y: 190, s: 0.95 },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="Illustrated banner">
  ${backdrop(1600, 900, seed)}
  ${slots
    .map((p, i) => `<g transform="translate(${p.x - 300 * p.s} ${p.y}) scale(${p.s})">${figure(looks[i], seed + i)}</g>`)
    .join('')}
  <text x="64" y="70" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#6e1440" fill-opacity="0.7">${label}</text>
</svg>
`;
}
