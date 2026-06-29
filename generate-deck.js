const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const { loadAllAssets } = require("./lib/assets");

const C = {
  BLACK: "0A0A0A",
  WHITE: "FFFFFF",
  GRAY: "6E6E73",
  GRAY_LIGHT: "A1A1A6",
  GRAY_DARK: "2C2C2E",
  GREEN: "1DF06A",
};

const FONT_TITLE = "Helvetica Neue";
const FONT_BODY = "Helvetica Neue";

function makeShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.2 };
}

function makeGlassShadow() {
  return { type: "outer", color: "000000", blur: 12, offset: 4, angle: 135, opacity: 0.25 };
}

async function iconToBase64(svgPath, color = C.GREEN, size = 256) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const ICONS = {
  ear: '<path d="M6 8.5a6 6 0 1 1 12 0c0 3-2 4-2 6.5"/><path d="M10 17a2 2 0 0 0 4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  decide: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
  who: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>',
  what: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 10h8M8 14h5"/>',
  trust: '<path d="M12 2l3 6 6 .9-4.5 4.4 1 6.1L12 17l-5.5 2.4 1-6.1L3 8.9 9 8z"/>',
  contact: '<path d="M4 6h16v12H4z"/><path d="m4 6 8 7 8-7"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 17-5-5-4 4-2-2-5 5"/>',
  message: '<path d="M4 6h16v10H7l-3 3z"/>',
  mobile: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  proof: '<path d="M9 12l2 2 4-4"/><path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M5.6 18.4l2.1-2.1M12 21v-3M18.4 18.4l-2.1-2.1M21 12h-3M18.4 5.6l-2.1 2.1"/>',
  cta: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  phone: '<path d="M6 4h4l2 5-3 2c1.5 3 4 5.5 7 7l2-3 5 2v4c0 1-1 2-2 2C9 19 5 15 4 8c0-1 1-2 2-2z"/>',
};

function addTitle(slide, text, y = 0.45, name = "title") {
  slide.addText(text, {
    x: 0.7, y, w: 8.6, h: 1.1,
    fontSize: 28, fontFace: FONT_TITLE, color: C.WHITE, bold: true,
    align: "left", valign: "top", margin: 0, objectName: name,
    lineSpacingMultiple: 1.05,
  });
}

function addSubtitle(slide, text, y = 1.55, name = "subtitle") {
  slide.addText(text, {
    x: 0.7, y, w: 7.5, h: 0.7,
    fontSize: 13, fontFace: FONT_BODY, color: C.GRAY_LIGHT,
    align: "left", valign: "top", margin: 0, objectName: name,
    lineSpacingMultiple: 1.3,
  });
}

function addGlassCard(slide, pres, { x, y, w, h, title, iconKey, name }) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: C.GRAY_DARK, transparency: 35 },
    line: { color: C.WHITE, width: 0.5, transparency: 85 },
    shadow: makeGlassShadow(), objectName: name,
  });
  if (iconKey) {
    slide.addImage({
      data: iconKey, x: x + 0.2, y: y + 0.22, w: 0.35, h: 0.35, objectName: `${name}-icon`,
    });
  }
  slide.addText(title, {
    x: x + 0.15, y: y + (iconKey ? 0.65 : 0.35), w: w - 0.3, h: h - 0.5,
    fontSize: 11, fontFace: FONT_BODY, color: C.WHITE, bold: true,
    align: "center", valign: "top", margin: 0, objectName: `${name}-text`,
  });
}

function addStepCard(slide, pres, { x, y, w, h, num, title, iconData, name }) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: C.GRAY_DARK },
    line: { color: C.WHITE, width: 0.5, transparency: 90 },
    shadow: makeShadow(), objectName: name,
  });
  slide.addShape(pres.shapes.OVAL, {
    x: x + w / 2 - 0.22, y: y + 0.25, w: 0.44, h: 0.44,
    fill: { color: C.GREEN, transparency: 85 },
    line: { color: C.GREEN, width: 1, transparency: 50 },
    objectName: `${name}-icon-bg`,
  });
  slide.addImage({
    data: iconData, x: x + w / 2 - 0.15, y: y + 0.32, w: 0.3, h: 0.3,
    objectName: `${name}-icon`,
  });
  slide.addText(num, {
    x: x + 0.15, y: y + 0.15, w: 0.4, h: 0.3,
    fontSize: 10, color: C.GREEN, bold: true, margin: 0, objectName: `${name}-num`,
  });
  slide.addText(title, {
    x: x + 0.15, y: y + 0.85, w: w - 0.3, h: 0.6,
    fontSize: 10, fontFace: FONT_BODY, color: C.WHITE, align: "center", margin: 0,
    objectName: `${name}-text`,
  });
}

async function buildDeck() {
  const assets = await loadAllAssets();
  const iconCache = {};
  for (const [key, path] of Object.entries(ICONS)) {
    iconCache[key] = await iconToBase64(path, `#${C.GREEN}`);
  }

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Zerosix";
  pres.title = "Zerosix — Première impression en ligne";
  pres.subject = "Pitch clients sans site internet";

  // ── Slide 1 — Hook ──────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };

    s.addText("Si un client entend parler de vous aujourd'hui,\nque trouve-t-il ?", {
      x: 0.7, y: 0.5, w: 8.6, h: 1.4,
      fontSize: 32, fontFace: FONT_TITLE, color: C.WHITE, bold: true,
      align: "center", valign: "middle", margin: 0, objectName: "s1-title",
      lineSpacingMultiple: 1.1,
    });

    s.addText([
      { text: "Avant d'appeler, beaucoup de clients vérifient en ligne.", options: { breakLine: true } },
      { text: "Ce qu'ils trouvent — ou ne trouvent pas — influence déjà leur niveau de confiance." },
    ], {
      x: 1.5, y: 1.95, w: 7, h: 0.8,
      fontSize: 12, fontFace: FONT_BODY, color: C.GRAY_LIGHT,
      align: "center", margin: 0, objectName: "s1-subtitle",
      lineSpacingMultiple: 1.4,
    });

    s.addImage({
      data: assets.searchBar, x: 2.6, y: 3.2, w: 4.8, h: 0.56, objectName: "s1-search",
    });

    const blurCards = [
      { x: 0.9, y: 2.6, w: 1.6, h: 1.0 },
      { x: 7.5, y: 2.5, w: 1.5, h: 0.9 },
      { x: 1.2, y: 4.3, w: 1.4, h: 0.85 },
      { x: 7.3, y: 4.2, w: 1.6, h: 0.95 },
    ];
    blurCards.forEach((c, i) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        ...c, rectRadius: 0.12,
        fill: { color: C.GRAY_DARK, transparency: 60 },
        line: { color: C.WHITE, width: 0.5, transparency: 92 },
        objectName: `s1-card-${i}`,
      });
    });
  }

  // ── Slide 2 — Comportement client ───────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };
    addTitle(s, "Le premier contact commence souvent\navant le premier appel.", 0.45, "s2-title");
    addSubtitle(s, "Aujourd'hui, un client veut comprendre rapidement qui vous êtes, ce que vous faites, et s'il peut vous faire confiance.", 1.65, "s2-subtitle");

    const steps = [
      { title: "Il entend\nparler de vous", icon: iconCache.ear },
      { title: "Il vous\ncherche", icon: iconCache.search },
      { title: "Il décide s'il\nvous contacte", icon: iconCache.decide },
    ];
    steps.forEach((step, i) => {
      addStepCard(s, pres, {
        x: 0.9 + i * 3.05, y: 2.7, w: 2.7, h: 2.2,
        num: String(i + 1), title: step.title, iconData: step.icon, name: `s2-step-${i}`,
      });
      if (i < 2) {
        s.addShape(pres.shapes.LINE, {
          x: 3.55 + i * 3.05, y: 3.75, w: 0.4, h: 0,
          line: { color: C.GREEN, width: 1, transparency: 50 },
          objectName: `s2-arrow-${i}`,
        });
      }
    });
  }

  // ── Slide 3 — Problème caché ──────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };
    addTitle(s, "Quand il ne trouve rien de clair,\nle doute s'installe.", 0.45, "s3-title");
    addSubtitle(s, 'Le client ne pense pas forcément que l\'entreprise est mauvaise.\nIl pense simplement : "Je ne sais pas assez."', 1.65, "s3-subtitle");

    s.addImage({
      data: assets.phoneEmpty, x: 1.0, y: 2.3, w: 2.2, h: 4.4, objectName: "s3-phone",
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 4.0, y: 3.2, w: 1.8, h: 0.9, rectRadius: 0.15,
      fill: { color: C.GRAY_DARK, transparency: 30 },
      line: { color: C.WHITE, width: 0.5, transparency: 88 },
      objectName: "s3-doubt-card",
    });
    s.addText("doute", {
      x: 4.0, y: 3.35, w: 1.8, h: 0.6,
      fontSize: 18, fontFace: FONT_TITLE, color: C.GRAY_LIGHT, italic: true,
      align: "center", valign: "middle", margin: 0, objectName: "s3-doubt-text",
    });

    const thoughts = [
      { text: "Pas assez d'infos", x: 5.5, y: 2.5 },
      { text: "Pas de photos", x: 6.8, y: 3.1 },
      { text: "Pas de preuve", x: 5.8, y: 3.9 },
      { text: "Pas clair", x: 7.0, y: 4.6 },
    ];
    thoughts.forEach((t, i) => {
      s.addText(t.text, {
        x: t.x, y: t.y, w: 2.0, h: 0.35,
        fontSize: 10, fontFace: FONT_BODY, color: C.GRAY, italic: true,
        align: "left", margin: 0, objectName: `s3-thought-${i}`,
      });
    });
  }

  // ── Slide 4 — Rôle d'un site ────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };
    addTitle(s, "Un bon site ne sert pas à faire joli.\nIl sert à rassurer.", 0.45, "s4-title");
    addSubtitle(s, "En quelques secondes, il doit répondre aux questions que le client se pose déjà.", 1.65, "s4-subtitle");

    const questions = [
      { title: "Qui êtes-vous ?", icon: iconCache.who },
      { title: "Que proposez-vous ?", icon: iconCache.what },
      { title: "Pourquoi vous faire\nconfiance ?", icon: iconCache.trust },
      { title: "Comment vous\ncontacter ?", icon: iconCache.contact },
    ];
    const positions = [
      { x: 0.9, y: 2.5 }, { x: 5.2, y: 2.5 },
      { x: 0.9, y: 4.0 }, { x: 5.2, y: 4.0 },
    ];
    questions.forEach((q, i) => {
      const p = positions[i];
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: p.x, y: p.y, w: 3.9, h: 1.25, rectRadius: 0.08,
        fill: { color: C.WHITE },
        line: { color: C.GRAY_LIGHT, width: 0.5, transparency: 70 },
        shadow: makeShadow(), objectName: `s4-card-${i}`,
      });
      s.addImage({
        data: q.icon, x: p.x + 0.25, y: p.y + 0.35, w: 0.4, h: 0.4,
        objectName: `s4-icon-${i}`,
      });
      s.addText(q.title, {
        x: p.x + 0.8, y: p.y + 0.2, w: 2.9, h: 0.9,
        fontSize: 14, fontFace: FONT_TITLE, color: C.BLACK, bold: true,
        align: "left", valign: "middle", margin: 0, objectName: `s4-text-${i}`,
      });
    });
  }

  // ── Slide 5 — Vision Zerosix ──────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };
    addTitle(s, "On ne construit pas juste un site.\nOn construit une première impression.", 0.45, "s5-title");
    addSubtitle(s, "Votre site doit rendre votre activité claire, crédible et facile à contacter.", 1.65, "s5-subtitle");

    s.addImage({
      data: assets.wireframeSite, x: 0.8, y: 2.3, w: 4.5, h: 2.95, objectName: "s5-wireframe",
    });
    s.addImage({
      data: assets.laptopSite, x: 0.8, y: 2.3, w: 4.5, h: 2.95, objectName: "s5-final",
    });
    s.addImage({
      data: assets.phonePremium, x: 5.8, y: 2.8, w: 1.5, h: 3.0, objectName: "s5-phone",
    });

    const labels = ["Clarté", "Confiance", "Crédibilité", "Contact"];
    labels.forEach((label, i) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 7.5, y: 2.5 + i * 0.65, w: 1.8, h: 0.45, rectRadius: 0.2,
        fill: { color: C.GREEN, transparency: 88 },
        line: { color: C.GREEN, width: 0.5, transparency: 60 },
        objectName: `s5-label-bg-${i}`,
      });
      s.addText(label, {
        x: 7.5, y: 2.5 + i * 0.65, w: 1.8, h: 0.45,
        fontSize: 11, fontFace: FONT_BODY, color: C.GREEN, bold: true,
        align: "center", valign: "middle", margin: 0, objectName: `s5-label-${i}`,
      });
    });
  }

  // ── Slide 6 — Avant / Après ─────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };
    addTitle(s, "Même entreprise. Perception différente.", 0.45, "s6-title");

    s.addText("Avant", {
      x: 0.9, y: 1.5, w: 4, h: 0.4,
      fontSize: 16, color: C.GRAY_LIGHT, bold: true, margin: 0, objectName: "s6-avant-label",
    });
    s.addText([
      { text: "Le client entend parler de vous.", options: { breakLine: true } },
      { text: "Il cherche.", options: { breakLine: true } },
      { text: "Il ne trouve pas assez.", options: { breakLine: true } },
      { text: "Il hésite." },
    ], {
      x: 0.9, y: 1.95, w: 3.8, h: 1.5,
      fontSize: 11, color: C.GRAY, margin: 0, objectName: "s6-avant-text",
      lineSpacingMultiple: 1.5,
    });
    s.addImage({
      data: assets.beforePanel, x: 0.9, y: 3.5, w: 2.0, h: 2.8, objectName: "s6-avant-visual",
    });

    s.addShape(pres.shapes.LINE, {
      x: 5.0, y: 1.5, w: 0, h: 4.0,
      line: { color: C.GREEN, width: 2, transparency: 30 },
      objectName: "s6-divider",
    });

    s.addText("Après", {
      x: 5.3, y: 1.5, w: 4, h: 0.4,
      fontSize: 16, color: C.GREEN, bold: true, margin: 0, objectName: "s6-apres-label",
    });
    s.addText([
      { text: "Il cherche.", options: { breakLine: true } },
      { text: "Il comprend.", options: { breakLine: true } },
      { text: "Il est rassuré.", options: { breakLine: true } },
      { text: "Il vous contacte." },
    ], {
      x: 5.3, y: 1.95, w: 3.8, h: 1.5,
      fontSize: 11, color: C.WHITE, margin: 0, objectName: "s6-apres-text",
      lineSpacingMultiple: 1.5,
    });
    s.addImage({
      data: assets.afterPanel, x: 5.3, y: 3.5, w: 2.0, h: 2.8, objectName: "s6-apres-visual",
    });
  }

  // ── Slide 7 — Ce que Zerosix met en place ─────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };
    addTitle(s, "Une présence simple, premium et utile.", 0.45, "s7-title");
    addSubtitle(s, "Pas besoin d'un site compliqué. Il faut un site qui inspire confiance et guide le client vers l'action.", 1.35, "s7-subtitle");

    const items = [
      { title: "Image\nprofessionnelle", icon: iconCache.image },
      { title: "Message\nclair", icon: iconCache.message },
      { title: "Design\nmobile-first", icon: iconCache.mobile },
      { title: "Preuves de\nconfiance", icon: iconCache.proof },
      { title: "Appels à\nl'action", icon: iconCache.cta },
      { title: "Contact\nfacile", icon: iconCache.phone },
    ];
    items.forEach((item, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      addGlassCard(s, pres, {
        x: 0.8 + col * 3.05, y: 2.4 + row * 1.55, w: 2.75, h: 1.3,
        title: item.title, iconKey: item.icon, name: `s7-card-${i}`,
      });
    });
  }

  // ── Slide 8 — Approche sans pression ──────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };
    addTitle(s, "On commence par vous montrer,\npas par vous convaincre.", 0.45, "s8-title");
    addSubtitle(s, [
      { text: "Avant de parler d'un projet complet, on peut préparer une première maquette.", options: { breakLine: true } },
      { text: "Vous voyez concrètement à quoi votre présence en ligne pourrait ressembler.", options: { breakLine: true } },
      { text: "Ensuite seulement, vous décidez si ça vaut la peine d'aller plus loin." },
    ], 1.65, "s8-subtitle");

    s.addImage({
      data: assets.mockupBuilding, x: 0.7, y: 2.5, w: 4.8, h: 3.1, objectName: "s8-mockup",
    });

    const processSteps = [
      "On comprend\nvotre activité",
      "On crée une première\ndirection visuelle",
      "Vous décidez si\non continue",
    ];
    processSteps.forEach((step, i) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 6.0, y: 2.6 + i * 1.15, w: 3.3, h: 0.95, rectRadius: 0.08,
        fill: { color: C.GRAY_DARK, transparency: 25 },
        line: { color: C.WHITE, width: 0.5, transparency: 90 },
        objectName: `s8-step-${i}`,
      });
      s.addText(String(i + 1), {
        x: 6.15, y: 2.75 + i * 1.15, w: 0.35, h: 0.35,
        fontSize: 14, color: C.GREEN, bold: true, align: "center", margin: 0,
        objectName: `s8-step-num-${i}`,
      });
      s.addText(step, {
        x: 6.55, y: 2.7 + i * 1.15, w: 2.6, h: 0.7,
        fontSize: 11, color: C.WHITE, align: "left", valign: "middle", margin: 0,
        objectName: `s8-step-text-${i}`,
      });
    });
  }

  // ── Slide 9 — Closing ─────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.BLACK };

    s.addText("Votre entreprise existe déjà.\nNotre travail, c'est de la rendre évidente en ligne.", {
      x: 0.7, y: 0.55, w: 6.5, h: 1.6,
      fontSize: 30, fontFace: FONT_TITLE, color: C.WHITE, bold: true,
      align: "left", valign: "top", margin: 0, objectName: "s9-title",
      lineSpacingMultiple: 1.1,
    });

    s.addText("Quand quelqu'un vous cherche, il doit comprendre en quelques secondes pourquoi il peut vous faire confiance.", {
      x: 0.7, y: 2.2, w: 5.8, h: 0.7,
      fontSize: 12, fontFace: FONT_BODY, color: C.GRAY_LIGHT,
      align: "left", margin: 0, objectName: "s9-subtitle",
      lineSpacingMultiple: 1.35,
    });

    s.addText("Zerosix — Sites premium pour entreprises ambitieuses", {
      x: 0.7, y: 3.1, w: 5.5, h: 0.4,
      fontSize: 11, color: C.GREEN, bold: true, margin: 0, objectName: "s9-cta",
    });

    s.addShape(pres.shapes.OVAL, {
      x: 6.8, y: 2.0, w: 2.5, h: 2.5,
      fill: { color: C.GREEN, transparency: 92 },
      line: { color: C.GREEN, width: 0, transparency: 100 },
      objectName: "s9-glow",
    });

    s.addImage({
      data: assets.phonePremium, x: 7.0, y: 1.8, w: 2.1, h: 4.2, objectName: "s9-phone",
    });

    s.addImage({
      data: assets.logo, x: 0.7, y: 4.8, w: 2.2, h: 0.55, objectName: "s9-logo",
    });
  }

  const outPath = "/Users/furkan/Documents/pitchclientzs/zerosix-pitch-sans-site.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("Deck generated:", outPath);
  return outPath;
}

buildDeck().catch((err) => {
  console.error(err);
  process.exit(1);
});