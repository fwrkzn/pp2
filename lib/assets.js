const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const GREEN = "#1DF06A";
const BLACK = "#0A0A0A";
const WHITE = "#FFFFFF";
const GRAY = "#6E6E73";
const GRAY_LIGHT = "#A1A1A6";
const GLASS = "rgba(255,255,255,0.08)";

async function svgToBase64(svg, width, height) {
  const buf = await sharp(Buffer.from(svg)).png().resize(width, height).toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function phoneFrame(innerContent, w = 280, h = 560) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1C1C1E"/>
        <stop offset="100%" stop-color="#0A0A0A"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>
    <rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="36" fill="#1C1C1E" filter="url(#shadow)"/>
    <rect x="16" y="16" width="${w - 32}" height="${h - 32}" rx="28" fill="url(#bg)"/>
    <rect x="${w / 2 - 40}" y="28" width="80" height="6" rx="3" fill="#2C2C2E"/>
    ${innerContent}
  </svg>`;
}

function laptopFrame(innerContent, w = 520, h = 340) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <rect x="40" y="20" width="440" height="260" rx="12" fill="#2C2C2E" filter="url(#shadow)"/>
    <rect x="48" y="28" width="424" height="236" rx="6" fill="#0A0A0A"/>
    ${innerContent}
    <path d="M 0 290 L 40 280 L 480 280 L 520 290 L 520 310 L 0 310 Z" fill="#3A3A3C"/>
    <ellipse cx="260" cy="300" rx="30" ry="4" fill="#1C1C1E"/>
  </svg>`;
}

const ASSETS = {
  phoneEmpty: () => phoneFrame(`
    <rect x="36" y="60" width="208" height="32" rx="16" fill="#2C2C2E"/>
    <circle cx="52" cy="76" r="8" fill="${GRAY}"/>
    <rect x="68" y="72" width="100" height="8" rx="4" fill="${GRAY_LIGHT}" opacity="0.5"/>
    <rect x="36" y="110" width="208" height="60" rx="12" fill="#2C2C2E" opacity="0.6"/>
    <rect x="48" y="124" width="120" height="8" rx="4" fill="${GRAY}" opacity="0.4"/>
    <rect x="48" y="140" width="80" height="6" rx="3" fill="${GRAY}" opacity="0.3"/>
    <text x="140" y="200" text-anchor="middle" fill="${GRAY}" font-family="system-ui,sans-serif" font-size="11">Aucun résultat clair</text>
    <rect x="60" y="230" width="160" height="120" rx="12" fill="#1C1C1E" stroke="#2C2C2E" stroke-width="1" stroke-dasharray="4 4"/>
  `),

  phonePremium: () => phoneFrame(`
    <rect x="36" y="52" width="208" height="140" rx="12" fill="#1C1C1E"/>
    <rect x="36" y="52" width="208" height="50" rx="12" fill="url(#hero)"/>
    <defs><linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1C1C1E"/><stop offset="100%" stop-color="#0A0A0A"/></linearGradient></defs>
    <rect x="48" y="64" width="80" height="6" rx="3" fill="${WHITE}"/>
    <rect x="48" y="78" width="120" height="4" rx="2" fill="${GRAY_LIGHT}" opacity="0.6"/>
    <rect x="48" y="92" width="60" height="14" rx="7" fill="${GREEN}"/>
    <rect x="36" y="200" width="100" height="50" rx="8" fill="#2C2C2E"/>
    <rect x="44" y="210" width="60" height="5" rx="2" fill="${WHITE}" opacity="0.8"/>
    <rect x="44" y="222" width="80" height="4" rx="2" fill="${GRAY_LIGHT}" opacity="0.5"/>
    <rect x="144" y="200" width="100" height="50" rx="8" fill="#2C2C2E"/>
    <rect x="152" y="210" width="60" height="5" rx="2" fill="${WHITE}" opacity="0.8"/>
    <rect x="36" y="260" width="208" height="80" rx="10" fill="#1C1C1E" stroke="#2C2C2E"/>
    <rect x="48" y="276" width="100" height="5" rx="2" fill="${WHITE}"/>
    <rect x="48" y="290" width="140" height="4" rx="2" fill="${GRAY_LIGHT}" opacity="0.5"/>
    <rect x="48" y="310" width="80" height="16" rx="8" fill="${GREEN}"/>
  `),

  laptopSite: () => laptopFrame(`
    <rect x="60" y="44" width="400" height="44" fill="#111"/>
    <circle cx="76" cy="66" r="5" fill="${GREEN}"/>
    <rect x="90" y="62" width="60" height="8" rx="4" fill="${WHITE}" opacity="0.9"/>
    <rect x="380" y="60" width="50" height="12" rx="6" fill="${GREEN}"/>
    <rect x="60" y="88" width="400" height="160" fill="#0A0A0A"/>
    <rect x="80" y="108" width="200" height="16" rx="4" fill="${WHITE}"/>
    <rect x="80" y="132" width="280" height="8" rx="4" fill="${GRAY_LIGHT}" opacity="0.5"/>
    <rect x="80" y="152" width="100" height="24" rx="12" fill="${GREEN}"/>
    <rect x="80" y="190" width="90" height="40" rx="8" fill="#1C1C1E"/>
    <rect x="180" y="190" width="90" height="40" rx="8" fill="#1C1C1E"/>
    <rect x="280" y="190" width="90" height="40" rx="8" fill="#1C1C1E"/>
    <rect x="90" y="200" width="50" height="5" rx="2" fill="${WHITE}" opacity="0.7"/>
    <rect x="190" y="200" width="50" height="5" rx="2" fill="${WHITE}" opacity="0.7"/>
    <rect x="290" y="200" width="50" height="5" rx="2" fill="${WHITE}" opacity="0.7"/>
  `),

  wireframeSite: () => laptopFrame(`
    <rect x="60" y="44" width="400" height="32" fill="none" stroke="#3A3A3C" stroke-width="1" stroke-dasharray="6 4"/>
    <rect x="80" y="54" width="80" height="8" rx="2" fill="none" stroke="#3A3A3C" stroke-width="1"/>
    <rect x="60" y="88" width="400" height="160" fill="none" stroke="#3A3A3C" stroke-width="1" stroke-dasharray="6 4"/>
    <rect x="80" y="108" width="180" height="14" rx="2" fill="none" stroke="#3A3A3C" stroke-width="1"/>
    <rect x="80" y="132" width="260" height="8" rx="2" fill="none" stroke="#3A3A3C" stroke-width="1"/>
    <rect x="80" y="152" width="80" height="20" rx="4" fill="none" stroke="${GREEN}" stroke-width="1" opacity="0.5"/>
    <rect x="80" y="190" width="90" height="40" rx="4" fill="none" stroke="#3A3A3C" stroke-width="1"/>
    <rect x="180" y="190" width="90" height="40" rx="4" fill="none" stroke="#3A3A3C" stroke-width="1"/>
    <rect x="280" y="190" width="90" height="40" rx="4" fill="none" stroke="#3A3A3C" stroke-width="1"/>
  `),

  searchBar: () => `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="56" viewBox="0 0 480 56">
    <rect x="0" y="0" width="480" height="56" rx="28" fill="#1C1C1E" stroke="#2C2C2E" stroke-width="1"/>
    <circle cx="32" cy="28" r="10" fill="none" stroke="${GRAY_LIGHT}" stroke-width="2"/>
    <line x1="38" y1="34" x2="44" y2="40" stroke="${GRAY_LIGHT}" stroke-width="2" stroke-linecap="round"/>
    <text x="60" y="34" fill="${WHITE}" font-family="system-ui,sans-serif" font-size="16" opacity="0.9">Votre entreprise</text>
    <rect x="462" y="22" width="2" height="20" rx="1" fill="${GREEN}"/>
  </svg>`,

  mockupBuilding: () => laptopFrame(`
    <rect x="60" y="44" width="400" height="204" fill="#111"/>
    <rect x="80" y="64" width="360" height="24" rx="4" fill="#2C2C2E" opacity="0.8"/>
    <rect x="80" y="100" width="200" height="12" rx="3" fill="${GREEN}" opacity="0.6"/>
    <rect x="80" y="124" width="280" height="8" rx="2" fill="#3A3A3C"/>
    <rect x="80" y="148" width="100" height="28" rx="6" fill="${GREEN}" opacity="0.4"/>
    <rect x="80" y="190" width="110" height="48" rx="6" fill="#2C2C2E"/>
    <rect x="200" y="190" width="110" height="48" rx="6" fill="#1C1C1E" stroke="#2C2C2E" stroke-width="1" stroke-dasharray="4 4"/>
    <rect x="320" y="190" width="110" height="48" rx="6" fill="#1C1C1E" stroke="#2C2C2E" stroke-width="1" stroke-dasharray="4 4"/>
  `),

  beforePanel: () => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
    <rect x="20" y="20" width="160" height="240" rx="16" fill="#1C1C1E" opacity="0.5"/>
    <rect x="36" y="48" width="100" height="8" rx="4" fill="${GRAY}" opacity="0.3"/>
    <rect x="36" y="68" width="128" height="6" rx="3" fill="${GRAY}" opacity="0.2"/>
    <rect x="36" y="100" width="128" height="80" rx="8" fill="#2C2C2E" opacity="0.4"/>
    <rect x="36" y="200" width="80" height="40" rx="8" fill="#2C2C2E" opacity="0.3"/>
    <text x="100" y="260" text-anchor="middle" fill="${GRAY}" font-family="system-ui" font-size="10" opacity="0.5">?</text>
  </svg>`,

  afterPanel: () => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
    <rect x="20" y="20" width="160" height="240" rx="16" fill="#1C1C1E"/>
    <rect x="36" y="44" width="80" height="8" rx="4" fill="${WHITE}"/>
    <rect x="36" y="60" width="120" height="5" rx="2" fill="${GRAY_LIGHT}" opacity="0.6"/>
    <rect x="36" y="76" width="56" height="14" rx="7" fill="${GREEN}"/>
    <rect x="36" y="100" width="128" height="60" rx="8" fill="#2C2C2E"/>
    <rect x="44" y="112" width="60" height="5" rx="2" fill="${WHITE}" opacity="0.8"/>
    <rect x="44" y="126" width="100" height="4" rx="2" fill="${GRAY_LIGHT}" opacity="0.5"/>
    <rect x="36" y="180" width="60" height="36" rx="6" fill="#2C2C2E"/>
    <rect x="104" y="180" width="60" height="36" rx="6" fill="#2C2C2E"/>
    <rect x="44" y="192" width="40" height="4" rx="2" fill="${WHITE}" opacity="0.7"/>
    <rect x="112" y="192" width="40" height="4" rx="2" fill="${WHITE}" opacity="0.7"/>
  </svg>`,
};

async function loadAllAssets() {
  const logoPath = path.join(__dirname, "../assets/logosite.webp");
  const logoBuf = fs.readFileSync(logoPath);
  const logoPng = await sharp(logoBuf).png().resize(400).toBuffer();

  const result = {
    logo: "image/png;base64," + logoPng.toString("base64"),
  };

  const sizes = {
    phoneEmpty: [280, 560],
    phonePremium: [280, 560],
    laptopSite: [520, 340],
    wireframeSite: [520, 340],
    searchBar: [480, 56],
    mockupBuilding: [520, 340],
    beforePanel: [200, 280],
    afterPanel: [200, 280],
  };

  for (const [key, fn] of Object.entries(ASSETS)) {
    const [w, h] = sizes[key];
    result[key] = await svgToBase64(fn(), w, h);
  }

  return result;
}

module.exports = { loadAllAssets, GREEN, BLACK, WHITE, GRAY, GRAY_LIGHT };