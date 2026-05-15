const pptxgen = require('pptxgenjs');
const html2pptx = require('/home/z/my-project/skills/ppt/scripts/html2pptx');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SLIDES_DIR = '/home/z/my-project/workspace/slides';
const IMG_DIR = '/home/z/my-project/download';
const OUTPUT = '/home/z/my-project/download/ONIT-PNG_Presentation_DG_ARPT.pptx';

// ── Custom Dark Navy Premium Theme ──
const T = {
  bg: '#0F172A',         // primary background
  surface: '#1E293B',    // slightly lighter
  card: '#334155',       // card layer
  cardHover: '#3B4A63',  // card hover
  border: '#475569',     // borders
  text: '#F1F5F9',       // primary text
  textSec: '#CBD5E1',    // secondary text
  muted: '#94A3B8',      // muted text
  gold: '#D4A843',       // accent gold
  blue: '#3B82F6',       // accent blue
  deepBg: '#060B16',     // deepest background
  titleBar: '#0C1424',   // title bar bg
  goldDim: '#8B7330',    // dimmed gold
};

const FONT_BODY = "'Corbel','Microsoft YaHei',sans-serif";
const FONT_TITLE = "'Gill Sans MT','Microsoft YaHei',sans-serif";
const FONT_NUM = "'Trebuchet MS','Microsoft YaHei',sans-serif";

// ── Step 1: Generate gradient/background PNGs ──
async function generateAssets() {
  // Cover geometric background
  const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <rect width="100%" height="100%" fill="${T.bg}"/>
    <line x1="0" y1="0" x2="400" y2="1080" stroke="${T.gold}" stroke-width="1.5" opacity="0.15"/>
    <line x1="100" y1="0" x2="500" y2="1080" stroke="${T.gold}" stroke-width="1" opacity="0.1"/>
    <line x1="1520" y1="0" x2="1920" y2="1080" stroke="${T.gold}" stroke-width="1.5" opacity="0.15"/>
    <line x1="1420" y1="0" x2="1820" y2="1080" stroke="${T.gold}" stroke-width="1" opacity="0.1"/>
    <line x1="0" y1="200" x2="1920" y2="200" stroke="${T.gold}" stroke-width="0.5" opacity="0.08"/>
    <line x1="0" y1="880" x2="1920" y2="880" stroke="${T.gold}" stroke-width="0.5" opacity="0.08"/>
    <rect x="80" y="420" width="60" height="3" fill="${T.gold}" opacity="0.25"/>
    <rect x="1780" y="650" width="60" height="3" fill="${T.gold}" opacity="0.25"/>
    <circle cx="160" cy="180" r="4" fill="${T.gold}" opacity="0.2"/>
    <circle cx="1760" cy="900" r="4" fill="${T.gold}" opacity="0.2"/>
    <rect x="200" y="880" width="1520" height="1" fill="${T.gold}" opacity="0.06"/>
  </svg>`;
  await sharp(Buffer.from(coverSvg)).png().toFile(path.join(SLIDES_DIR, 'cover-bg.png'));

  // Closing geometric background (echoing cover)
  const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <rect width="100%" height="100%" fill="${T.deepBg}"/>
    <line x1="0" y1="1080" x2="400" y2="0" stroke="${T.gold}" stroke-width="1.5" opacity="0.15"/>
    <line x1="100" y1="1080" x2="500" y2="0" stroke="${T.gold}" stroke-width="1" opacity="0.1"/>
    <line x1="1520" y1="1080" x2="1920" y2="0" stroke="${T.gold}" stroke-width="1.5" opacity="0.15"/>
    <line x1="1420" y1="1080" x2="1820" y2="0" stroke="${T.gold}" stroke-width="1" opacity="0.1"/>
    <rect x="200" y="200" width="1520" height="1" fill="${T.gold}" opacity="0.06"/>
    <circle cx="160" cy="900" r="4" fill="${T.gold}" opacity="0.2"/>
    <circle cx="1760" cy="180" r="4" fill="${T.gold}" opacity="0.2"/>
  </svg>`;
  await sharp(Buffer.from(closeSvg)).png().toFile(path.join(SLIDES_DIR, 'close-bg.png'));

  // Gold accent bar (horizontal)
  const barSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="6">
    <rect width="800" height="6" fill="${T.gold}"/>
  </svg>`;
  await sharp(Buffer.from(barSvg)).png().toFile(path.join(SLIDES_DIR, 'gold-bar.png'));

  console.log('Assets generated.');
}

// ── Step 2: Write HTML slide files ──
function writeSlides() {
  const slides = [];

  // ═══════════════════════════════════════════════
  // SLIDE 1: COVER
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide01_cover', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;
  background-image:url('${SLIDES_DIR}/cover-bg.png');background-size:cover;
  font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="position:absolute;top:0;left:0;width:720pt;height:405pt;background-color:rgba(15,23,42,0.55);"></div>
  <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 80pt;">
    <div style="width:48pt;height:3pt;background:${T.gold};margin:0 0 28pt 0;"></div>
    <h1 style="font-size:48pt;font-weight:bold;color:${T.gold};margin:0 0 16pt 0;line-height:1.1;text-align:center;letter-spacing:3pt;">ONIT-PNG</h1>
    <div style="width:48pt;height:3pt;background:${T.gold};margin:0 0 24pt 0;"></div>
    <p style="font-size:16pt;color:${T.textSec};margin:0 0 8pt 0;line-height:1.4;text-align:center;max-width:560pt;">Observatoire National Intelligent des T\u00e9l\u00e9communications</p>
    <p style="font-size:16pt;color:${T.textSec};margin:0 0 28pt 0;line-height:1.4;text-align:center;max-width:560pt;">et de la Performance Num\u00e9rique de la Guin\u00e9e</p>
    <div style="width:30pt;height:1pt;background:${T.muted};margin:0 0 20pt 0;"></div>
    <p style="font-size:14pt;color:${T.muted};margin:0 0 6pt 0;line-height:1.4;text-align:center;">Pr\u00e9sentation au Directeur G\u00e9n\u00e9ral \u2014 ARPT Guin\u00e9e</p>
    <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;text-align:center;">Mai 2026</p>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 2: VISION
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide02_vision', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="height:4pt;background:${T.gold};"></div>
  <div style="padding:36pt 60pt 0 60pt;text-align:center;">
    <p style="font-size:13pt;color:${T.gold};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">NOTRE VISION</p>
    <h2 style="font-size:28pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Vision Strat\u00e9gique</h2>
    <div style="width:40pt;height:2pt;background:${T.gold};margin:12pt auto 0 auto;"></div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 60pt;">
    <p style="font-size:17pt;font-style:italic;color:${T.textSec};margin:0 0 32pt 0;line-height:1.5;text-align:center;max-width:540pt;">\u00ab La future infrastructure nationale intelligente de supervision et de r\u00e9gulation t\u00e9l\u00e9com de la R\u00e9publique de Guin\u00e9e \u00bb</p>
    <div style="display:flex;gap:20pt;">
      <div style="width:180pt;background:${T.surface};border:1pt solid ${T.border};border-radius:10pt;padding:24pt 16pt;text-align:center;">
        <p style="font-size:32pt;font-weight:bold;color:${T.gold};margin:0 0 8pt 0;line-height:1;">IA</p>
        <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 6pt 0;line-height:1.3;">Intelligence Artificielle</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Scoring, pr\u00e9diction, recommandations</p>
      </div>
      <div style="width:180pt;background:${T.surface};border:1pt solid ${T.border};border-radius:10pt;padding:24pt 16pt;text-align:center;">
        <p style="font-size:32pt;font-weight:bold;color:${T.blue};margin:0 0 8pt 0;line-height:1;">BD</p>
        <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 6pt 0;line-height:1.3;">Big Data Analytics</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Historisation, KPIs, tendances</p>
      </div>
      <div style="width:180pt;background:${T.surface};border:1pt solid ${T.border};border-radius:10pt;padding:24pt 16pt;text-align:center;">
        <p style="font-size:32pt;font-weight:bold;color:${T.gold};margin:0 0 8pt 0;line-height:1;">SIG</p>
        <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 6pt 0;line-height:1.3;">Cartographie SIG</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Cartes interactives, heatmaps</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 3: CONTEXTE NATIONAL
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide03_contexte', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.deepBg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="padding:36pt 60pt 0 60pt;text-align:center;">
    <p style="font-size:13pt;color:${T.gold};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">CONTEXTE</p>
    <h2 style="font-size:28pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Contexte National</h2>
    <div style="width:40pt;height:2pt;background:${T.gold};margin:12pt auto 0 auto;"></div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 48pt;">
    <div style="display:flex;gap:16pt;margin-bottom:20pt;">
      <div style="width:148pt;background:rgba(255,255,255,0.04);border:1pt solid rgba(255,255,255,0.08);border-radius:10pt;padding:24pt 12pt;text-align:center;">
        <p style="font-size:44pt;font-weight:bold;color:${T.gold};margin:0 0 8pt 0;line-height:1;">3</p>
        <p style="font-size:13pt;color:${T.textSec};margin:0;line-height:1.3;">Op\u00e9rateurs</p>
        <p style="font-size:11pt;color:${T.muted};margin:4pt 0 0 0;line-height:1.3;">Orange, MTN, Celcom</p>
      </div>
      <div style="width:148pt;background:rgba(255,255,255,0.04);border:1pt solid rgba(255,255,255,0.08);border-radius:10pt;padding:24pt 12pt;text-align:center;">
        <p style="font-size:44pt;font-weight:bold;color:${T.blue};margin:0 0 8pt 0;line-height:1;">13M</p>
        <p style="font-size:13pt;color:${T.textSec};margin:0;line-height:1.3;">Habitants</p>
        <p style="font-size:11pt;color:${T.muted};margin:4pt 0 0 0;line-height:1.3;">Population Guin\u00e9e</p>
      </div>
      <div style="width:148pt;background:rgba(255,255,255,0.04);border:1pt solid rgba(255,255,255,0.08);border-radius:10pt;padding:24pt 12pt;text-align:center;">
        <p style="font-size:44pt;font-weight:bold;color:${T.gold};margin:0 0 8pt 0;line-height:1;">67%</p>
        <p style="font-size:13pt;color:${T.textSec};margin:0;line-height:1.3;">Couverture</p>
        <p style="font-size:11pt;color:${T.muted};margin:4pt 0 0 0;line-height:1.3;">Taux couverture mobile</p>
      </div>
      <div style="width:148pt;background:rgba(255,255,255,0.04);border:1pt solid rgba(255,255,255,0.08);border-radius:10pt;padding:24pt 12pt;text-align:center;">
        <p style="font-size:44pt;font-weight:bold;color:${T.blue};margin:0 0 8pt 0;line-height:1;">234</p>
        <p style="font-size:13pt;color:${T.textSec};margin:0;line-height:1.3;">Zones Blanches</p>
        <p style="font-size:11pt;color:${T.muted};margin:4pt 0 0 0;line-height:1.3;">Sans couverture</p>
      </div>
    </div>
    <div style="background:${T.surface};border-left:4pt solid ${T.gold};border-radius:0 8pt 8pt 0;padding:16pt 20pt;">
      <p style="font-size:14pt;color:${T.textSec};margin:0;line-height:1.5;">La Guin\u00e9e dispose de 3 op\u00e9rateurs t\u00e9l\u00e9coms (Orange, MTN, Celcom) desservant 13 millions d'habitants avec un taux de couverture de 67%. 234 zones blanches restent sans acc\u00e8s mobile, n\u00e9cessitant une supervision intelligente et centralis\u00e9e.</p>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 4: OBJECTIFS STRAT\u00c9GIQUES
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide04_objectifs', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Objectifs Strat\u00e9giques</h2>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:12pt 48pt;gap:10pt;">
    <div style="display:flex;align-items:flex-start;gap:12pt;">
      <div style="width:28pt;height:28pt;background:${T.gold};border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        <p style="font-size:13pt;font-weight:bold;color:${T.deepBg};margin:0;line-height:1;">1</p>
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;line-height:1.4;">Audit National Terrain</p>
        <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Drive/Walk tests syst\u00e9matiques sur l'ensemble du territoire national</p>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12pt;">
      <div style="width:28pt;height:28pt;background:${T.blue};border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        <p style="font-size:13pt;font-weight:bold;color:#FFFFFF;margin:0;line-height:1;">2</p>
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;line-height:1.4;">Pilotage Qualit\u00e9 de Service</p>
        <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Supervision en temps r\u00e9el des KPIs QoS/QoE par op\u00e9rateur et r\u00e9gion</p>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12pt;">
      <div style="width:28pt;height:28pt;background:${T.gold};border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        <p style="font-size:13pt;font-weight:bold;color:${T.deepBg};margin:0;line-height:1;">3</p>
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;line-height:1.4;">Identification Zones Blanches</p>
        <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Cartographie pr\u00e9cise des 234 zones sans couverture mobile</p>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12pt;">
      <div style="width:28pt;height:28pt;background:${T.blue};border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        <p style="font-size:13pt;font-weight:bold;color:#FFFFFF;margin:0;line-height:1;">4</p>
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;line-height:1.4;">Benchmark Op\u00e9rateurs</p>
        <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Comparaison objective des performances Orange, MTN, Celcom</p>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12pt;">
      <div style="width:28pt;height:28pt;background:${T.gold};border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        <p style="font-size:13pt;font-weight:bold;color:${T.deepBg};margin:0;line-height:1;">5</p>
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;line-height:1.4;">Rapports R\u00e9glementaires</p>
        <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">G\u00e9n\u00e9ration automatique des rapports de conformit\u00e9 ARPT</p>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12pt;">
      <div style="width:28pt;height:28pt;background:${T.blue};border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        <p style="font-size:13pt;font-weight:bold;color:#FFFFFF;margin:0;line-height:1;">6</p>
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;line-height:1.4;">Observatoire Intelligent</p>
        <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Plateforme IA de supervision, scoring et recommandation automatique</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 5: ARCHITECTURE GLOBALE
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide05_archi', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Architecture Globale</h2>
  </div>
  <div style="flex:1;display:flex;padding:8pt 48pt 12pt 48pt;gap:16pt;align-items:center;">
    <div style="width:420pt;display:flex;align-items:center;justify-content:center;">
      <img src="${IMG_DIR}/arch_system.png" style="width:420pt;height:280pt;object-fit:contain;border-radius:8pt;display:block;" />
    </div>
    <div style="width:200pt;display:flex;flex-direction:column;justify-content:center;gap:10pt;">
      <div style="background:${T.surface};border-left:3pt solid ${T.gold};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:13pt;font-weight:bold;color:${T.gold};margin:0 0 2pt 0;">Couche 1</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;line-height:1.3;">Collecte Terrain</p>
      </div>
      <div style="background:${T.surface};border-left:3pt solid ${T.blue};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:13pt;font-weight:bold;color:${T.blue};margin:0 0 2pt 0;">Couche 2</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;line-height:1.3;">Data Lake & SIG</p>
      </div>
      <div style="background:${T.surface};border-left:3pt solid ${T.gold};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:13pt;font-weight:bold;color:${T.gold};margin:0 0 2pt 0;">Couche 3</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;line-height:1.3;">Big Data Analytics</p>
      </div>
      <div style="background:${T.surface};border-left:3pt solid ${T.blue};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:13pt;font-weight:bold;color:${T.blue};margin:0 0 2pt 0;">Couche 4</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;line-height:1.3;">Intelligence Artificielle</p>
      </div>
      <div style="background:${T.surface};border-left:3pt solid ${T.gold};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:13pt;font-weight:bold;color:${T.gold};margin:0 0 2pt 0;">Couche 5</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;line-height:1.3;">Dashboards & Portail</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 6: MODULE AUDIT TERRAIN
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide06_audit', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.deepBg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="padding:32pt 60pt 0 60pt;">
    <p style="font-size:13pt;color:${T.gold};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">MODULE 1</p>
    <h2 style="font-size:26pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Audit Terrain</h2>
    <div style="width:40pt;height:2pt;background:${T.gold};margin:10pt 0 0 0;"></div>
  </div>
  <div style="flex:1;display:flex;padding:16pt 48pt 20pt 48pt;gap:20pt;">
    <div style="width:310pt;display:flex;flex-direction:column;justify-content:center;gap:12pt;">
      <div style="display:flex;align-items:flex-start;gap:10pt;">
        <div style="width:4pt;height:28pt;background:${T.gold};flex-shrink:0;border-radius:2pt;margin-top:2pt;"></div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;">Drive & Walk Tests</p>
          <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Mesures terrain syst\u00e9matiques sur axes routiers et zones urbaines</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10pt;">
        <div style="width:4pt;height:28pt;background:${T.blue};flex-shrink:0;border-radius:2pt;margin-top:2pt;"></div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;">QoS Mobile & Internet</p>
          <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">D\u00e9bit, latence, taux d'appel, disponibilit\u00e9 du r\u00e9seau</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10pt;">
        <div style="width:4pt;height:28pt;background:${T.gold};flex-shrink:0;border-radius:2pt;margin-top:2pt;"></div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 2pt 0;">QoE & Benchmark</p>
          <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Exp\u00e9rience utilisateur et comparaison op\u00e9rateurs</p>
        </div>
      </div>
    </div>
    <div style="width:310pt;background:${T.surface};border:1pt solid ${T.border};border-radius:8pt;padding:16pt;display:flex;flex-direction:column;">
      <p style="font-size:14pt;font-weight:bold;color:${T.gold};margin:0 0 10pt 0;">KPIs Cl\u00e9s</p>
      <div style="display:flex;gap:8pt;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.muted};margin:0;width:140pt;">D\u00e9bit descendant</p>
        <p style="font-size:12pt;font-weight:bold;color:${T.text};margin:0;">12.4 Mbps</p>
      </div>
      <div style="display:flex;gap:8pt;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.muted};margin:0;width:140pt;">Latence</p>
        <p style="font-size:12pt;font-weight:bold;color:${T.text};margin:0;">78 ms</p>
      </div>
      <div style="display:flex;gap:8pt;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.muted};margin:0;width:140pt;">Taux appel r\u00e9ussi</p>
        <p style="font-size:12pt;font-weight:bold;color:${T.text};margin:0;">91.5%</p>
      </div>
      <div style="display:flex;gap:8pt;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.muted};margin:0;width:140pt;">Jitter</p>
        <p style="font-size:12pt;font-weight:bold;color:${T.text};margin:0;">24 ms</p>
      </div>
      <div style="display:flex;gap:8pt;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.muted};margin:0;width:140pt;">Disponibilit\u00e9</p>
        <p style="font-size:12pt;font-weight:bold;color:${T.text};margin:0;">98.2%</p>
      </div>
      <div style="display:flex;gap:8pt;">
        <p style="font-size:12pt;color:${T.muted};margin:0;width:140pt;">Couverture mobile</p>
        <p style="font-size:12pt;font-weight:bold;color:${T.text};margin:0;">67%</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 7: MODULE SIG
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide07_sig', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <p style="font-size:12pt;color:${T.blue};margin:0 12pt 0 0;">MODULE 2</p>
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Cartographie SIG</h2>
  </div>
  <div style="flex:1;display:flex;padding:8pt 48pt 16pt 48pt;gap:20pt;align-items:center;">
    <div style="width:260pt;display:flex;flex-direction:column;justify-content:center;gap:14pt;">
      <div style="background:${T.surface};border-left:4pt solid ${T.blue};border-radius:0 8pt 8pt 0;padding:14pt 16pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 4pt 0;">Cartes Interactives</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Visualisation multi-couches de la couverture nationale par op\u00e9rateur</p>
      </div>
      <div style="background:${T.surface};border-left:4pt solid ${T.gold};border-radius:0 8pt 8pt 0;padding:14pt 16pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 4pt 0;">Heatmaps QoS</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Cartes de chaleur de la qualit\u00e9 de service par r\u00e9gion</p>
      </div>
      <div style="background:${T.surface};border-left:4pt solid ${T.blue};border-radius:0 8pt 8pt 0;padding:14pt 16pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 4pt 0;">Zones Blanches</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Identification et suivi des 234 zones sans couverture</p>
      </div>
    </div>
    <div style="width:380pt;display:flex;align-items:center;justify-content:center;">
      <img src="${IMG_DIR}/arch_sig.png" style="width:380pt;height:280pt;object-fit:contain;border-radius:8pt;display:block;" />
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 8: MODULE BIG DATA
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide08_bigdata', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.deepBg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="padding:28pt 60pt 0 60pt;">
    <p style="font-size:13pt;color:${T.gold};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">MODULE 3</p>
    <h2 style="font-size:24pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Big Data & Analytics</h2>
    <div style="width:40pt;height:2pt;background:${T.gold};margin:8pt 0 0 0;"></div>
  </div>
  <div style="flex:1;display:flex;padding:12pt 48pt 20pt 48pt;gap:20pt;align-items:center;">
    <div style="width:380pt;display:flex;align-items:center;justify-content:center;">
      <img src="${IMG_DIR}/arch_bigdata.png" style="width:380pt;height:280pt;object-fit:contain;border-radius:8pt;display:block;" />
    </div>
    <div style="width:240pt;display:flex;flex-direction:column;justify-content:center;gap:14pt;">
      <div style="background:rgba(255,255,255,0.04);border:1pt solid rgba(255,255,255,0.08);border-radius:8pt;padding:16pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.blue};margin:0 0 4pt 0;">Data Warehouse</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Centralisation de toutes les donn\u00e9es terrain et r\u00e9seau</p>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1pt solid rgba(255,255,255,0.08);border-radius:8pt;padding:16pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.gold};margin:0 0 4pt 0;">Historisation</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Suivi temporel des indicateurs et tendances</p>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1pt solid rgba(255,255,255,0.08);border-radius:8pt;padding:16pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.blue};margin:0 0 4pt 0;">KPIs R\u00e9glementaires</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Calcul automatique des seuils de conformit\u00e9 ARPT</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 9: MODULE IA
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide09_ia', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <p style="font-size:12pt;color:${T.gold};margin:0 12pt 0 0;">MODULE 4</p>
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Intelligence Artificielle</h2>
  </div>
  <div style="flex:1;display:flex;padding:8pt 48pt 16pt 48pt;gap:20pt;align-items:center;">
    <div style="width:280pt;display:flex;flex-direction:column;justify-content:center;gap:14pt;">
      <div style="background:${T.surface};border-radius:10pt;padding:16pt;border:1pt solid ${T.border};">
        <p style="font-size:16pt;font-weight:bold;color:${T.gold};margin:0 0 6pt 0;">Scoring Op\u00e9rateurs</p>
        <p style="font-size:13pt;color:${T.textSec};margin:0;line-height:1.4;">\u00c9valuation automatique multi-crit\u00e8res de chaque op\u00e9rateur avec score composite</p>
      </div>
      <div style="background:${T.surface};border-radius:10pt;padding:16pt;border:1pt solid ${T.border};">
        <p style="font-size:16pt;font-weight:bold;color:${T.blue};margin:0 0 6pt 0;">Pr\u00e9diction</p>
        <p style="font-size:13pt;color:${T.textSec};margin:0;line-height:1.4;">Anticipation des d\u00e9gradations QoS et des zones \u00e0 risque</p>
      </div>
      <div style="background:${T.surface};border-radius:10pt;padding:16pt;border:1pt solid ${T.border};">
        <p style="font-size:16pt;font-weight:bold;color:${T.gold};margin:0 0 6pt 0;">Recommandations</p>
        <p style="font-size:13pt;color:${T.textSec};margin:0;line-height:1.4;">Actions correctives prioritaires g\u00e9n\u00e9r\u00e9es par le moteur IA</p>
      </div>
    </div>
    <div style="width:340pt;display:flex;align-items:center;justify-content:center;">
      <img src="${IMG_DIR}/arch_ia.png" style="width:340pt;height:270pt;object-fit:contain;border-radius:8pt;display:block;" />
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 10: DASHBOARD DG
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide10_dg', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.deepBg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="padding:24pt 48pt 0 48pt;">
    <p style="font-size:13pt;color:${T.gold};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">TABLEAU DE BORD</p>
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Directeur G\u00e9n\u00e9ral</h2>
  </div>
  <div style="display:flex;gap:10pt;padding:10pt 48pt 0 48pt;">
    <div style="width:148pt;background:rgba(212,168,67,0.12);border:1pt solid rgba(212,168,67,0.3);border-radius:8pt;padding:14pt 10pt;text-align:center;">
      <p style="font-size:28pt;font-weight:bold;color:${T.gold};margin:0 0 4pt 0;line-height:1;">67%</p>
      <p style="font-size:11pt;color:${T.textSec};margin:0;">Couverture</p>
    </div>
    <div style="width:148pt;background:rgba(59,130,246,0.12);border:1pt solid rgba(59,130,246,0.3);border-radius:8pt;padding:14pt 10pt;text-align:center;">
      <p style="font-size:28pt;font-weight:bold;color:${T.blue};margin:0 0 4pt 0;line-height:1;">72/100</p>
      <p style="font-size:11pt;color:${T.textSec};margin:0;">QoS Score</p>
    </div>
    <div style="width:148pt;background:rgba(212,168,67,0.12);border:1pt solid rgba(212,168,67,0.3);border-radius:8pt;padding:14pt 10pt;text-align:center;">
      <p style="font-size:28pt;font-weight:bold;color:${T.gold};margin:0 0 4pt 0;line-height:1;">234</p>
      <p style="font-size:11pt;color:${T.textSec};margin:0;">Zones Blanches</p>
    </div>
    <div style="width:148pt;background:rgba(59,130,246,0.12);border:1pt solid rgba(59,130,246,0.3);border-radius:8pt;padding:14pt 10pt;text-align:center;">
      <p style="font-size:28pt;font-weight:bold;color:${T.blue};margin:0 0 4pt 0;line-height:1;">8.2M</p>
      <p style="font-size:11pt;color:${T.textSec};margin:0;">Pop. Couverte</p>
    </div>
  </div>
  <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:8pt 48pt 16pt 48pt;">
    <img src="${IMG_DIR}/dashboard_dg.png" style="width:624pt;height:220pt;object-fit:contain;border-radius:8pt;display:block;" />
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 11: DASHBOARD TECHNIQUE QOS
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide11_qos', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Monitoring Technique QoS</h2>
  </div>
  <div style="flex:1;display:flex;padding:8pt 48pt 12pt 48pt;gap:16pt;">
    <div style="width:420pt;display:flex;align-items:center;justify-content:center;">
      <img src="${IMG_DIR}/dashboard_qos.png" style="width:420pt;height:290pt;object-fit:contain;border-radius:8pt;display:block;" />
    </div>
    <div style="width:190pt;display:flex;flex-direction:column;justify-content:center;gap:10pt;">
      <div style="background:${T.surface};border-left:3pt solid ${T.gold};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:11pt;color:${T.muted};margin:0;">Latence</p>
        <p style="font-size:20pt;font-weight:bold;color:${T.gold};margin:0;line-height:1;">78 ms</p>
      </div>
      <div style="background:${T.surface};border-left:3pt solid ${T.blue};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:11pt;color:${T.muted};margin:0;">D\u00e9bit</p>
        <p style="font-size:20pt;font-weight:bold;color:${T.blue};margin:0;line-height:1;">12.4 Mbps</p>
      </div>
      <div style="background:${T.surface};border-left:3pt solid ${T.gold};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:11pt;color:${T.muted};margin:0;">Taux appel r\u00e9ussi</p>
        <p style="font-size:20pt;font-weight:bold;color:${T.gold};margin:0;line-height:1;">91.5%</p>
      </div>
      <div style="background:${T.surface};border-left:3pt solid ${T.blue};padding:10pt 14pt;border-radius:0 6pt 6pt 0;">
        <p style="font-size:11pt;color:${T.muted};margin:0;">Disponibilit\u00e9</p>
        <p style="font-size:20pt;font-weight:bold;color:${T.blue};margin:0;line-height:1;">98.2%</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 12: DASHBOARD SIG
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide12_sig_dash', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.deepBg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="padding:28pt 60pt 0 60pt;text-align:center;">
    <p style="font-size:13pt;color:${T.blue};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">CARTOGRAPHIE</p>
    <h2 style="font-size:24pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Cartographie Interactive</h2>
  </div>
  <div style="flex:1;display:flex;padding:10pt 48pt 16pt 48pt;align-items:center;justify-content:center;">
    <img src="${IMG_DIR}/dashboard_sig.png" style="width:600pt;height:280pt;object-fit:contain;border-radius:8pt;display:block;" />
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 13: PORTAIL PUBLIC
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide13_public', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Portail de Transparence</h2>
  </div>
  <div style="flex:1;display:flex;padding:8pt 48pt 12pt 48pt;gap:16pt;">
    <div style="width:420pt;display:flex;align-items:center;justify-content:center;">
      <img src="${IMG_DIR}/dashboard_public.png" style="width:420pt;height:290pt;object-fit:contain;border-radius:8pt;display:block;" />
    </div>
    <div style="width:190pt;display:flex;flex-direction:column;justify-content:center;gap:12pt;">
      <div style="background:${T.surface};border-radius:8pt;padding:14pt;border:1pt solid ${T.border};">
        <p style="font-size:14pt;font-weight:bold;color:${T.gold};margin:0 0 4pt 0;">KPIs Publics</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Indicateurs cl\u00e9s accessibles aux citoyens</p>
      </div>
      <div style="background:${T.surface};border-radius:8pt;padding:14pt;border:1pt solid ${T.border};">
        <p style="font-size:14pt;font-weight:bold;color:${T.blue};margin:0 0 4pt 0;">Comparaison Op\u00e9rateurs</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Classement public des op\u00e9rateurs</p>
      </div>
      <div style="background:${T.surface};border-radius:8pt;padding:14pt;border:1pt solid ${T.border};">
        <p style="font-size:14pt;font-weight:bold;color:${T.gold};margin:0 0 4pt 0;">Signaler un Probl\u00e8me</p>
        <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;">Canal citoyen de signalement QoS</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 14: SCORING OP\u00c9RATEURS
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide14_scoring', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.deepBg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="padding:28pt 60pt 0 60pt;">
    <p style="font-size:13pt;color:${T.gold};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">MOTEUR DE SCORING</p>
    <h2 style="font-size:24pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Scoring Intelligent</h2>
  </div>
  <div style="display:flex;gap:14pt;padding:16pt 48pt 0 48pt;">
    <div style="width:192pt;background:rgba(255,165,0,0.08);border:1pt solid rgba(255,165,0,0.25);border-radius:10pt;padding:20pt 14pt;text-align:center;">
      <p style="font-size:40pt;font-weight:bold;color:#FF8C00;margin:0 0 6pt 0;line-height:1;">78</p>
      <p style="font-size:16pt;font-weight:bold;color:${T.text};margin:0 0 8pt 0;">Orange</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;line-height:1.3;">Couverture: 82% | QoS: 76 | QoE: 80</p>
    </div>
    <div style="width:192pt;background:rgba(212,168,67,0.08);border:1pt solid rgba(212,168,67,0.25);border-radius:10pt;padding:20pt 14pt;text-align:center;">
      <p style="font-size:40pt;font-weight:bold;color:${T.gold};margin:0 0 6pt 0;line-height:1;">74</p>
      <p style="font-size:16pt;font-weight:bold;color:${T.text};margin:0 0 8pt 0;">MTN</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;line-height:1.3;">Couverture: 78% | QoS: 72 | QoE: 74</p>
    </div>
    <div style="width:192pt;background:rgba(59,130,246,0.08);border:1pt solid rgba(59,130,246,0.25);border-radius:10pt;padding:20pt 14pt;text-align:center;">
      <p style="font-size:40pt;font-weight:bold;color:${T.blue};margin:0 0 6pt 0;line-height:1;">65</p>
      <p style="font-size:16pt;font-weight:bold;color:${T.text};margin:0 0 8pt 0;">Celcom</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;line-height:1.3;">Couverture: 64% | QoS: 62 | QoE: 70</p>
    </div>
  </div>
  <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:4pt 48pt 16pt 48pt;">
    <img src="${IMG_DIR}/dashboard_scoring.png" style="width:580pt;height:140pt;object-fit:contain;border-radius:6pt;display:block;" />
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 15: CYBERS\u00c9CURIT\u00c9
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide15_cyber', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Plan de Cybers\u00e9curit\u00e9</h2>
  </div>
  <div style="flex:1;display:flex;padding:8pt 48pt 16pt 48pt;gap:16pt;">
    <div style="width:300pt;display:flex;flex-direction:column;justify-content:center;gap:10pt;">
      <div style="display:flex;align-items:flex-start;gap:10pt;">
        <div style="width:4pt;height:32pt;background:${T.gold};flex-shrink:0;border-radius:2pt;margin-top:2pt;"></div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 3pt 0;">RBAC \u2014 Contr\u00f4le d'Acc\u00e8s</p>
          <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Gestion des r\u00f4les et permissions par profil utilisateur</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10pt;">
        <div style="width:4pt;height:32pt;background:${T.blue};flex-shrink:0;border-radius:2pt;margin-top:2pt;"></div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 3pt 0;">Chiffrement de Donn\u00e9es</p>
          <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Chiffrement AES-256 au repos et TLS en transit</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10pt;">
        <div style="width:4pt;height:32pt;background:${T.gold};flex-shrink:0;border-radius:2pt;margin-top:2pt;"></div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 3pt 0;">Audit Logs</p>
          <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Tra\u00e7abilit\u00e9 compl\u00e8te de toutes les actions syst\u00e8me</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10pt;">
        <div style="width:4pt;height:32pt;background:${T.blue};flex-shrink:0;border-radius:2pt;margin-top:2pt;"></div>
        <div style="flex:1;min-width:0;">
          <p style="font-size:15pt;font-weight:bold;color:${T.text};margin:0 0 3pt 0;">Conformit\u00e9 R\u00e9glementaire</p>
          <p style="font-size:13pt;color:${T.muted};margin:0;line-height:1.4;">Respect des normes internationales de s\u00e9curit\u00e9</p>
        </div>
      </div>
    </div>
    <div style="width:310pt;display:flex;align-items:center;justify-content:center;">
      <img src="${IMG_DIR}/arch_cyber.png" style="width:310pt;height:280pt;object-fit:contain;border-radius:8pt;display:block;" />
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 16: ROADMAP
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide16_roadmap', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.deepBg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="padding:28pt 60pt 0 60pt;text-align:center;">
    <p style="font-size:13pt;color:${T.gold};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">ROADMAP</p>
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Roadmap Strat\u00e9gique 2026\u20132028</h2>
  </div>
  <div style="display:flex;gap:12pt;padding:16pt 48pt 0 48pt;">
    <div style="width:192pt;background:rgba(212,168,67,0.08);border:1pt solid rgba(212,168,67,0.25);border-radius:10pt;padding:16pt;text-align:center;">
      <p style="font-size:28pt;font-weight:bold;color:${T.gold};margin:0 0 4pt 0;line-height:1;">2026</p>
      <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 6pt 0;">Phase 1: Fondations</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;line-height:1.4;">Audit terrain, SIG, collecte donn\u00e9es, dashboards de base</p>
    </div>
    <div style="width:192pt;background:rgba(59,130,246,0.08);border:1pt solid rgba(59,130,246,0.25);border-radius:10pt;padding:16pt;text-align:center;">
      <p style="font-size:28pt;font-weight:bold;color:${T.blue};margin:0 0 4pt 0;line-height:1;">2027</p>
      <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 6pt 0;">Phase 2: Intelligence</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;line-height:1.4;">Big Data, IA, scoring, pr\u00e9diction, portail public</p>
    </div>
    <div style="width:192pt;background:rgba(212,168,67,0.08);border:1pt solid rgba(212,168,67,0.25);border-radius:10pt;padding:16pt;text-align:center;">
      <p style="font-size:28pt;font-weight:bold;color:${T.gold};margin:0 0 4pt 0;line-height:1;">2028</p>
      <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 6pt 0;">Phase 3: Excellence</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;line-height:1.4;">Automatisation avanc\u00e9e, conformit\u00e9, observatoire complet</p>
    </div>
  </div>
  <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:8pt 48pt 16pt 48pt;">
    <img src="${IMG_DIR}/roadmap_onit_png.png" style="width:560pt;height:120pt;object-fit:contain;border-radius:6pt;display:block;" />
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 17: ORGANISATION PROJET
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide17_orga', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Organisation Projet</h2>
  </div>
  <div style="flex:1;display:flex;padding:12pt 48pt 16pt 48pt;gap:20pt;">
    <div style="width:310pt;display:flex;flex-direction:column;justify-content:center;gap:10pt;">
      <div style="background:${T.surface};border-left:4pt solid ${T.gold};border-radius:0 8pt 8pt 0;padding:12pt 16pt;">
        <p style="font-size:14pt;font-weight:bold;color:${T.gold};margin:0;">Comit\u00e9 de Pilotage</p>
        <p style="font-size:12pt;color:${T.muted};margin:4pt 0 0 0;line-height:1.3;">DG ARPT + Directeurs techniques</p>
      </div>
      <div style="background:${T.surface};border-left:4pt solid ${T.blue};border-radius:0 8pt 8pt 0;padding:12pt 16pt;">
        <p style="font-size:14pt;font-weight:bold;color:${T.blue};margin:0;">Chef de Projet</p>
        <p style="font-size:12pt;color:${T.muted};margin:4pt 0 0 0;line-height:1.3;">Coordination g\u00e9n\u00e9rale et reporting</p>
      </div>
      <div style="background:${T.surface};border-left:4pt solid ${T.gold};border-radius:0 8pt 8pt 0;padding:12pt 16pt;">
        <p style="font-size:14pt;font-weight:bold;color:${T.gold};margin:0;">Architectes</p>
        <p style="font-size:12pt;color:${T.muted};margin:4pt 0 0 0;line-height:1.3;">Architecture technique et SIG</p>
      </div>
      <div style="background:${T.surface};border-left:4pt solid ${T.blue};border-radius:0 8pt 8pt 0;padding:12pt 16pt;">
        <p style="font-size:14pt;font-weight:bold;color:${T.blue};margin:0;">D\u00e9veloppeurs & QA</p>
        <p style="font-size:12pt;color:${T.muted};margin:4pt 0 0 0;line-height:1.3;">D\u00e9veloppement, tests et validation</p>
      </div>
    </div>
    <div style="width:310pt;background:${T.surface};border:1pt solid ${T.border};border-radius:10pt;padding:20pt;display:flex;flex-direction:column;justify-content:center;">
      <p style="font-size:16pt;font-weight:bold;color:${T.text};margin:0 0 12pt 0;">M\u00e9thodologie Agile / Scrum</p>
      <div style="display:flex;gap:8pt;margin-bottom:10pt;">
        <div style="width:80pt;background:${T.card};border-radius:6pt;padding:10pt 8pt;text-align:center;">
          <p style="font-size:18pt;font-weight:bold;color:${T.gold};margin:0;line-height:1;">2</p>
          <p style="font-size:11pt;color:${T.muted};margin:4pt 0 0 0;">Sem. / Sprint</p>
        </div>
        <div style="width:80pt;background:${T.card};border-radius:6pt;padding:10pt 8pt;text-align:center;">
          <p style="font-size:18pt;font-weight:bold;color:${T.blue};margin:0;line-height:1;">6</p>
          <p style="font-size:11pt;color:${T.muted};margin:4pt 0 0 0;">Sprints / Ph.</p>
        </div>
        <div style="width:80pt;background:${T.card};border-radius:6pt;padding:10pt 8pt;text-align:center;">
          <p style="font-size:18pt;font-weight:bold;color:${T.gold};margin:0;line-height:1;">36</p>
          <p style="font-size:11pt;color:${T.muted};margin:4pt 0 0 0;">Sprints Total</p>
        </div>
      </div>
      <p style="font-size:12pt;color:${T.textSec};margin:0;line-height:1.5;">Revue de sprint bimensuelle avec le comit\u00e9 de pilotage. Backlog prioritis\u00e9 par valeur m\u00e9tier. D\u00e9monstration incr\u00e9mentale \u00e0 chaque fin de sprint.</p>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 18: BUDGET
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide18_budget', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.deepBg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="padding:28pt 60pt 0 60pt;text-align:center;">
    <p style="font-size:13pt;color:${T.gold};margin:0 0 8pt 0;letter-spacing:2pt;white-space:nowrap;">BUDGET</p>
    <h2 style="font-size:24pt;font-weight:bold;color:${T.text};margin:0;line-height:1.2;white-space:nowrap;">Budget Estimatif</h2>
  </div>
  <div style="display:flex;gap:14pt;padding:16pt 48pt 0 48pt;">
    <div style="width:192pt;background:rgba(212,168,67,0.10);border:1pt solid rgba(212,168,67,0.3);border-radius:10pt;padding:20pt 14pt;text-align:center;">
      <p style="font-size:34pt;font-weight:bold;color:${T.gold};margin:0 0 6pt 0;line-height:1;">2.8M</p>
      <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 4pt 0;">Phase 1</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;">Fondations 2026</p>
    </div>
    <div style="width:192pt;background:rgba(59,130,246,0.10);border:1pt solid rgba(59,130,246,0.3);border-radius:10pt;padding:20pt 14pt;text-align:center;">
      <p style="font-size:34pt;font-weight:bold;color:${T.blue};margin:0 0 6pt 0;line-height:1;">3.2M</p>
      <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 4pt 0;">Phase 2</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;">Intelligence 2027</p>
    </div>
    <div style="width:192pt;background:rgba(212,168,67,0.10);border:1pt solid rgba(212,168,67,0.3);border-radius:10pt;padding:20pt 14pt;text-align:center;">
      <p style="font-size:34pt;font-weight:bold;color:${T.gold};margin:0 0 6pt 0;line-height:1;">2.1M</p>
      <p style="font-size:14pt;font-weight:bold;color:${T.text};margin:0 0 4pt 0;">Phase 3</p>
      <p style="font-size:11pt;color:${T.muted};margin:0;">Excellence 2028</p>
    </div>
  </div>
  <div style="padding:12pt 48pt 0 48pt;">
    <div style="background:${T.surface};border:1pt solid ${T.border};border-radius:8pt;padding:16pt;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8pt;">
        <p style="font-size:13pt;font-weight:bold;color:${T.text};margin:0;">Composante</p>
        <p style="font-size:13pt;font-weight:bold;color:${T.gold};margin:0;">Montant (EUR)</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.textSec};margin:0;">Audit Terrain & SIG</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;">1.8M</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.textSec};margin:0;">Big Data & Analytics</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;">2.2M</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.textSec};margin:0;">Intelligence Artificielle</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;">1.9M</p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6pt;">
        <p style="font-size:12pt;color:${T.textSec};margin:0;">Dashboards & Portail</p>
        <p style="font-size:12pt;color:${T.textSec};margin:0;">1.4M</p>
      </div>
      <div style="display:flex;justify-content:space-between;border-top:1pt solid ${T.border};padding-top:6pt;">
        <p style="font-size:13pt;font-weight:bold;color:${T.gold};margin:0;">TOTAL (3 ans)</p>
        <p style="font-size:13pt;font-weight:bold;color:${T.gold};margin:0;">8.1M EUR</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 19: IMPACT ATTENDU
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide19_impact', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;background-color:${T.bg};font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="width:720pt;height:56pt;background:${T.titleBar};display:flex;align-items:center;padding:0 48pt;">
    <h2 style="font-size:22pt;font-weight:bold;color:${T.text};margin:0;line-height:1.25;">Impact Attendu</h2>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;padding:8pt 48pt 8pt 48pt;gap:10pt;">
    <div style="display:flex;gap:14pt;">
      <div style="width:200pt;background:${T.surface};border-top:3pt solid ${T.gold};border-radius:0 0 8pt 8pt;padding:14pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.gold};margin:0 0 8pt 0;">Pour l'ARPT</p>
        <ul style="font-size:12pt;color:${T.textSec};margin:0;padding-left:16pt;line-height:19pt;">
          <li>R\u00e9gulation intelligente</li>
          <li>Conformit\u00e9 automatis\u00e9e</li>
          <li>Transparence des KPIs</li>
          <li>D\u00e9cisions bas\u00e9es sur donn\u00e9es</li>
        </ul>
      </div>
      <div style="width:200pt;background:${T.surface};border-top:3pt solid ${T.blue};border-radius:0 0 8pt 8pt;padding:14pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.blue};margin:0 0 8pt 0;">Pour les Op\u00e9rateurs</p>
        <ul style="font-size:12pt;color:${T.textSec};margin:0;padding-left:16pt;line-height:19pt;">
          <li>Benchmarks objectifs</li>
          <li>Am\u00e9lioration continue</li>
          <li>Feedback en temps r\u00e9el</li>
          <li>Comp\u00e9tition saine</li>
        </ul>
      </div>
      <div style="width:200pt;background:${T.surface};border-top:3pt solid ${T.gold};border-radius:0 0 8pt 8pt;padding:14pt;">
        <p style="font-size:15pt;font-weight:bold;color:${T.gold};margin:0 0 8pt 0;">Pour les Citoyens</p>
        <ul style="font-size:12pt;color:${T.textSec};margin:0;padding-left:16pt;line-height:19pt;">
          <li>Qualit\u00e9 de service</li>
          <li>Couverture \u00e9largie</li>
          <li>Transparence publique</li>
          <li>Canal de signalement</li>
        </ul>
      </div>
    </div>
    <div style="display:flex;gap:16pt;justify-content:center;padding-top:6pt;">
      <div style="width:180pt;background:rgba(212,168,67,0.08);border:1pt solid rgba(212,168,67,0.2);border-radius:8pt;padding:14pt;text-align:center;">
        <p style="font-size:30pt;font-weight:bold;color:${T.gold};margin:0;line-height:1;">234</p>
        <p style="font-size:12pt;color:${T.textSec};margin:6pt 0 0 0;">Zones blanches identifi\u00e9es</p>
      </div>
      <div style="width:180pt;background:rgba(59,130,246,0.08);border:1pt solid rgba(59,130,246,0.2);border-radius:8pt;padding:14pt;text-align:center;">
        <p style="font-size:30pt;font-weight:bold;color:${T.blue};margin:0;line-height:1;">100%</p>
        <p style="font-size:12pt;color:${T.textSec};margin:6pt 0 0 0;">KPIs surveill\u00e9s en continu</p>
      </div>
      <div style="width:180pt;background:rgba(212,168,67,0.08);border:1pt solid rgba(212,168,67,0.2);border-radius:8pt;padding:14pt;text-align:center;">
        <p style="font-size:30pt;font-weight:bold;color:${T.gold};margin:0;line-height:1;">3</p>
        <p style="font-size:12pt;color:${T.textSec};margin:6pt 0 0 0;">Op\u00e9rateurs benchmark\u00e9s</p>
      </div>
    </div>
  </div>
</body></html>` });

  // ═══════════════════════════════════════════════
  // SLIDE 20: CLOSING
  // ═══════════════════════════════════════════════
  slides.push({ name: 'slide20_closing', html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="width:720pt;height:405pt;margin:0;padding:0;overflow:hidden;
  background-image:url('${SLIDES_DIR}/close-bg.png');background-size:cover;
  font-family:${FONT_BODY};display:flex;flex-direction:column;">
  <div style="position:absolute;top:0;left:0;width:720pt;height:405pt;background-color:rgba(6,11,22,0.60);"></div>
  <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 80pt;">
    <div style="width:48pt;height:3pt;background:${T.gold};margin:0 0 24pt 0;"></div>
    <p style="font-size:14pt;color:${T.gold};margin:0 0 12pt 0;letter-spacing:3pt;">SMART REGULATION GUINEA 2030</p>
    <h1 style="font-size:28pt;font-weight:bold;color:${T.text};margin:0 0 16pt 0;line-height:1.3;text-align:center;max-width:520pt;">Ensemble, construisons l'observatoire t\u00e9l\u00e9com intelligent de la Guin\u00e9e</h1>
    <div style="width:48pt;height:3pt;background:${T.gold};margin:0 0 28pt 0;"></div>
    <p style="font-size:14pt;color:${T.textSec};margin:0 0 4pt 0;line-height:1.4;text-align:center;">ARPT Guin\u00e9e \u2014 Autorit\u00e9 de R\u00e9gulation des Postes et T\u00e9l\u00e9communications</p>
    <p style="font-size:12pt;color:${T.muted};margin:0;line-height:1.4;text-align:center;">Conakry, R\u00e9publique de Guin\u00e9e \u2014 Mai 2026</p>
  </div>
</body></html>` });

  // Write all HTML files
  for (const s of slides) {
    fs.writeFileSync(path.join(SLIDES_DIR, `${s.name}.html`), s.html, 'utf-8');
  }
  console.log(`${slides.length} HTML slides written.`);
  return slides.map(s => `${s.name}.html`);
}

// ── Step 3: Convert to PPTX ──
async function convertToPptx(slideFiles) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'ARPT Guin\u00e9e';
  pptx.subject = 'ONIT-PNG';
  pptx.title = 'ONIT-PNG - Observatoire National Intelligent des T\u00e9l\u00e9communications';

  const fontConfig = { cjk: 'Microsoft YaHei', latin: 'Gill Sans MT' };
  const allWarnings = [];

  for (const file of slideFiles) {
    const htmlPath = path.join(SLIDES_DIR, file);
    console.log(`Converting: ${file}`);
    try {
      const { slide, placeholders, warnings } = await html2pptx(htmlPath, pptx, { fontConfig });
      if (warnings.length > 0) {
        console.log(`  Warnings for ${file}:`);
        warnings.forEach(w => console.log(`    ${w}`));
        allWarnings.push({ file, warnings });
      }
    } catch (e) {
      console.error(`  ERROR converting ${file}: ${e.message}`);
      // Try to continue with remaining slides
    }
  }

  await pptx.writeFile({ fileName: OUTPUT });
  console.log(`\nPPTX saved to: ${OUTPUT}`);
  
  if (allWarnings.length > 0) {
    console.log(`\n=== WARNINGS SUMMARY ===`);
    allWarnings.forEach(({ file, warnings }) => {
      console.log(`\n${file}:`);
      warnings.forEach(w => console.log(`  ${w}`));
    });
  }
}

// ── Main ──
(async () => {
  try {
    await generateAssets();
    const slideFiles = writeSlides();
    await convertToPptx(slideFiles);
    console.log('\nDone!');
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
})();
