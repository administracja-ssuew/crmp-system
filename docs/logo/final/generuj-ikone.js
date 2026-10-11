// Generator ikony CRA: symetryczna brama SSUEW + pieczęć z ptaszkiem.
// Lewa połowa bramy jest rysowana, prawa = lustrzane odbicie (scale(-1,1)).
const fs = require('fs');
const P = Object.assign({
  S: 512, rx: 112, bg: '#0B1322', fg: '#FFFFFF', accent: '#2C4BFF',
  t: 26, g: 18, top: 104, rows: 7,
  L: 118,                 // lewa krawędź bramy (prawa = S - L)
  cy: 306, r: 104,        // środek i promień łuku (otwór)
  rays: [                 // wiersze zakończone promieniem w stronę środka łuku
    { row: 1, angle: 24 },
    { row: 2, angle: 49 },
  ],
  keyW: 26, keyTop: 56,   // zwornik: szerokość przy łuku / przy belce
  plainEndGap: true,
}, JSON.parse(process.argv[3] || "{}"));
const cx = P.S / 2;
const rowY = k => P.top + k * (P.t + P.g);
const yc = k => rowY(k) + P.t / 2;
const bottom = rowY(P.rows - 1) + P.t;
const R = P.S - P.L;
const rad = d => d * Math.PI / 180;

function leftHalf() {
  let s = '';
  // belka (wiersz 0) — tylko lewa połowa, środek dorysuje odbicie
  s += `<rect x="${P.L}" y="${rowY(0)}" width="${cx - P.L}" height="${P.t}"/>`;
  // zwornik: pionowy pas od belki do łuku
  const kt = (P.keyTop || P.keyW) / 2, kb = P.keyW / 2;
  s += `<polygon points="${cx - kt},${rowY(0)} ${cx},${rowY(0)} ${cx},${P.cy} ${cx - kb},${P.cy}"/>`;
  for (let k = 1; k < P.rows; k++) {
    const ray = P.rays.find(r => r.row === k);
    if (ray) {
      // poziomy odcinek do punktu, gdzie promień pod kątem `angle` (od pionu) przecina oś wiersza
      const a = rad(ray.angle);
      const s0 = (P.cy - yc(k)) / Math.cos(a);
      const bx = cx - Math.sin(a) * s0;
      s += `<polyline fill="none" stroke="${P.fg}" stroke-width="${P.t}" stroke-linejoin="miter" stroke-miterlimit="10" points="${P.L},${yc(k)} ${bx.toFixed(2)},${yc(k)} ${cx},${P.cy}"/>`;
    } else {
      const above = rowY(k) + P.t < P.cy - P.r + 4;
      const end = above && P.plainEndGap ? cx - P.keyW / 2 - P.g : cx;
      s += `<rect x="${P.L}" y="${rowY(k)}" width="${end - P.L}" height="${P.t}"/>`;
    }
  }
  return s;
}

function svg({ withSeal = true, simple = false } = {}) {
  const half = leftHalf();
  const openRect = `<rect x="${cx - P.r}" y="${P.cy}" width="${2 * P.r}" height="${bottom - P.cy + 10}"/>`;
  const seal = withSeal ? `
    <g>
      <circle cx="${cx}" cy="${P.cy + 22}" r="${simple ? 62 : 60}" fill="none" stroke="${P.accent}" stroke-width="${simple ? 12 : 9}"/>
      <circle cx="${cx}" cy="${P.cy + 22}" r="${simple ? 44 : 46}" fill="${P.accent}"/>
      <polyline points="${cx - 20},${P.cy + 23} ${cx - 5},${P.cy + 38} ${cx + 22},${P.cy + 8}" fill="none" stroke="#fff" stroke-width="${simple ? 14 : 11}" stroke-linecap="round" stroke-linejoin="round"/>
    </g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P.S} ${P.S}" width="${P.S}" height="${P.S}">
  <rect width="${P.S}" height="${P.S}" rx="${P.rx}" fill="${P.bg}"/>
  <g fill="${P.fg}">
    <g>${half}</g>
    <g transform="translate(${P.S},0) scale(-1,1)">${half}</g>
  </g>
  <g fill="${P.bg}"><circle cx="${cx}" cy="${P.cy}" r="${P.r}"/>${openRect}</g>${seal}
</svg>`;
}

const out = process.argv[2] || '.';
fs.writeFileSync(`${out}/cra-icon.svg`, svg());
fs.writeFileSync(`${out}/cra-icon-small.svg`, svg({ simple: true }));
console.log('ok', { bottom, rows: [...Array(P.rows).keys()].map(rowY) });
