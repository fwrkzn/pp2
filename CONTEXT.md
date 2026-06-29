# Zerosix Pitch Deck — Project Context

## Overview

Premium consultative pitch deck for **Zerosix** (agency targeting clients without a website).  
**Primary deliverable:** full-screen web deck in the browser (PowerPoint-style), not a `.pptx` file.

- **Language:** French
- **Tone:** consultative, elegant, Apple/Keynote-inspired
- **Slides:** 9
- **Style:** black / white / gray + accent green `#1DF06A`

---

## Run locally

```bash
cd pp2   # or full path: /Users/furkan/Documents/pitchclientzs/pp2
python3 -m http.server 3456
```

Open: **http://localhost:3456**

---

## Deploy (static)

Build copies only `index.html`, `css/`, `js/`, `assets/` → `public/` (~112 KB). Excludes `node_modules`, pptx, etc.

| Setting | Value |
|---------|--------|
| **Root directory** | `/` (repo root) |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |
| **Output directory** | `public` |

**Git remote:** *(set your second repo — see below)*

```bash
cd pp2
git remote add origin https://github.com/fwrkzn/YOUR-REPO.git
git push -u origin main
```

**Cloudflare Workers:** `wrangler.toml` sets `assets.directory = "./public"` — fixes the 121 MiB `node_modules` upload error.

**Do not** use `npx start` as build/deploy command.

**Vercel:** `vercel.json` → build `public/`, output `public`.

**Local preview of production build:** `npm run build && npx serve public`

---

## File structure

| File | Role |
|------|------|
| `index.html` | 9 slides, French copy, `data-transition` per slide |
| `css/deck.css` | Layout, typography, mockups, glass cards, responsive |
| `css/transitions.css` | Page enter transitions, element choreography, ambient motion |
| `js/deck.js` | Navigation, fullscreen, hash sync, transition orchestration |
| `assets/logosite.webp` | Zerosix logo (slide 9) |
| `assets/logo.svg` | Logo SVG asset |

### Legacy / optional (ignore for web deck)

| File | Role |
|------|------|
| `zerosix-pitch-sans-site.pptx` | Original PPTX export |
| `generate-deck.js`, `build.sh`, `unpacked/` | PPTX build pipeline |
| `package.json` | Node deps for PPTX generation (`pptxgenjs`, etc.) |

---

## Slides

| # | `data-transition` | Title / theme |
|---|-------------------|---------------|
| 1 | `hook` | Search hook — "Si un client entend parler de vous..." |
| 2 | `timeline` | 3-step journey (entend → cherche → décide) |
| 3 | `doubt` | Empty search / doubt installs |
| 4 | `questions` | 2×2 white cards — site must reassure |
| 5 | `vision` | Laptop wireframe → final design + mobile + tags |
| 6 | `compare` | Avant / Après split panels |
| 7 | `glass` | 6 glassmorphism feature cards |
| 8 | `build` | Process steps + browser mockup building |
| 9 | `closing` | CTA, logo, tilted phone |

---

## Navigation & UI

- **Visible UI:** fullscreen button only (top-right)
- **Fullscreen:** button click or `F` key
- **Navigate:** arrow keys, space, Page Up/Down, click zones (left/right third), swipe, mouse wheel
- **Hash sync:** `#1` … `#9` in URL
- **No** nav arrows, progress bar, or slide counter in UI

---

## Transitions

### Page transitions
- **Enter only** — no exit animation (outgoing slide cuts instantly)
- Forward: `enter-fwd` / Backward: `enter-back`
- Per-slide enter keyframes in `transitions.css`

### Element choreography
- Class `play-animations` triggers staggered entrance per slide
- Elements reset to `opacity: 0` until their animation runs
- `replayElements()` reflows animations on slide change

### Ambient motion (foreground elements)
- Class `ambient-active` added after choreography completes (`CHOREOGRAPHY` timings in `deck.js`)
- Subtle float, pulse, glow on cards/mockups
- Visibility locked via `.slide.ambient-active` opacity rules

### Background
- **Plain black** — no decorations (`var(--black)` on `html, body, .deck`)
- All background-decoration experiments (SVG motifs, aurora/particles, stage light, Lottie waves/pulse) were tried and removed; plain black preferred

---

## Design tokens (`deck.css`)

```css
--black: #0a0a0a
--green: #1df06a
--gray-light: #a1a1a6
--gray-mid: #6e6e73
--font: Inter
--ease-out: cubic-bezier(0.22, 1, 0.36, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## Timing reference (`deck.js`)

### Page enter durations (ms)
`hook:700, timeline:600, doubt:750, questions:650, vision:800, compare:700, glass:650, build:700, closing:850`

### Choreography durations (ms) — when `ambient-active` starts
`hook:2800, timeline:1900, doubt:3450, questions:1550, vision:3550, compare:3350, glass:1700, build:2150, closing:2400`

---

## Copy rules

- No em dashes (—) in visible text — use commas or rephrase
- French throughout

---

## Session history

1. Built web deck (replaced PPTX as primary deliverable)
2. Removed nav arrows / progress bar — fullscreen only
3. Removed em dashes from copy
4. Fixed slide 1 layout (text + search bar centered vertically)
5. Transitions: enter-only, no exit
6. Fixed elements not appearing (ambient animations timing)
7. Slide 2: reduced step-card height
8. Slide 1: enlarged side blur cards
9. Removed all background blur/glow shadows per slide
10. ~~Added SVG background decorations~~ — reverted
11. ~~Per-slide line-art motifs + dot grid~~ — too bloated/ugly, replaced
12. ~~Aurora + particles + vignette~~ — too generic/AI, replaced
13. ~~Stage light + ember + grain~~ — radial glow still too AI, replaced
14. ~~Lottie waves + sonar pulse~~ — removed
15. Background: plain black (final preference — all decoration removed)

---

## Known considerations

- First load: slide 1 gets `is-entering` + `enter-fwd` then `play-animations`
- `compare-divider` parent has `opacity: 1` (only inner `span` animates)
- Vision `final-layer` hidden until morph animation
- Responsive breakpoints at 900px and 600px in `deck.css`
- `prefers-reduced-motion` disables animations in `transitions.css`