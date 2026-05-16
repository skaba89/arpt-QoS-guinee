#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ONIT-PNG — Architecture Technique & Cahier des Charges Détaillé
Body PDF generation using ReportLab with auto-TOC (multiBuild)
"""

import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.units import inch, cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
    PageBreak, KeepTogether, ListFlowable, ListItem, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate, Frame
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.lib.sequencer import Sequencer

# ═══════════════════════════════════════════════════════
#  PALETTE
# ═══════════════════════════════════════════════════════
ACCENT       = colors.HexColor('#5f3acc')
TEXT_PRIMARY  = colors.HexColor('#1b1a18')
TEXT_MUTED    = colors.HexColor('#7e7c74')
PAGE_BG      = colors.HexColor('#f0f0ef')
CARD_BG      = colors.HexColor('#f0efec')
TABLE_STRIPE = colors.HexColor('#f3f2f0')
HEADER_FILL  = colors.HexColor('#5d543b')
BORDER       = colors.HexColor('#d5d0c1')
SEM_SUCCESS  = colors.HexColor('#4f8e64')
SEM_WARNING  = colors.HexColor('#a98a4c')
SEM_ERROR    = colors.HexColor('#99514b')
SEM_INFO     = colors.HexColor('#3f6992')
NAVY         = colors.HexColor('#1a2744')
GOLD         = colors.HexColor('#c9a84c')

# ═══════════════════════════════════════════════════════
#  FONTS
# ═══════════════════════════════════════════════════════
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-Bold', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-Italic', '/usr/share/fonts/truetype/english/Carlito-Italic.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-BoldItalic', '/usr/share/fonts/truetype/english/Carlito-BoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('Tinos', '/usr/share/fonts/truetype/english/Tinos-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Tinos-Bold', '/usr/share/fonts/truetype/english/Tinos-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Tinos-Italic', '/usr/share/fonts/truetype/english/Tinos-Italic.ttf'))
pdfmetrics.registerFont(TTFont('Tinos-BoldItalic', '/usr/share/fonts/truetype/english/Tinos-BoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))

registerFontFamily('Carlito', normal='Carlito', bold='Carlito-Bold', italic='Carlito-Italic', boldItalic='Carlito-BoldItalic')
registerFontFamily('Tinos', normal='Tinos', bold='Tinos-Bold', italic='Tinos-Italic', boldItalic='Tinos-BoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans-Bold')

# ═══════════════════════════════════════════════════════
#  STYLES
# ═══════════════════════════════════════════════════════
BODY_FONT = 'Carlito'
HEAD_FONT = 'Tinos'
SANS_FONT = 'DejaVuSans'

styles = getSampleStyleSheet()

s_title = ParagraphStyle('DocTitle', fontName=HEAD_FONT, fontSize=22, leading=28,
    textColor=NAVY, alignment=TA_LEFT, spaceAfter=6, spaceBefore=0)
s_h1 = ParagraphStyle('H1', fontName=HEAD_FONT, fontSize=17, leading=22,
    textColor=NAVY, spaceBefore=18, spaceAfter=10, borderPadding=(0,0,4,0))
s_h2 = ParagraphStyle('H2', fontName=HEAD_FONT, fontSize=13, leading=17,
    textColor=colors.HexColor('#2c3e6b'), spaceBefore=12, spaceAfter=6)
s_h3 = ParagraphStyle('H3', fontName=HEAD_FONT, fontSize=11, leading=15,
    textColor=colors.HexColor('#3d4a63'), spaceBefore=8, spaceAfter=4)
s_body = ParagraphStyle('Body', fontName=BODY_FONT, fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceBefore=3, spaceAfter=6)
s_body_indent = ParagraphStyle('BodyIndent', parent=s_body, leftIndent=18)
s_bullet = ParagraphStyle('Bullet', parent=s_body, leftIndent=24, bulletIndent=12,
    bulletFontName=BODY_FONT, bulletFontSize=9)
s_caption = ParagraphStyle('Caption', fontName=BODY_FONT, fontSize=8, leading=11,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=12)
s_toc_h1 = ParagraphStyle('TOCH1', fontName=HEAD_FONT, fontSize=11, leading=18,
    leftIndent=10, textColor=NAVY)
s_toc_h2 = ParagraphStyle('TOCH2', fontName=BODY_FONT, fontSize=9.5, leading=16,
    leftIndent=28, textColor=colors.HexColor('#3d4a63'))
s_toc_h3 = ParagraphStyle('TOCH3', fontName=BODY_FONT, fontSize=8.5, leading=14,
    leftIndent=46, textColor=TEXT_MUTED)
s_footer = ParagraphStyle('Footer', fontName=BODY_FONT, fontSize=7.5,
    textColor=TEXT_MUTED, alignment=TA_CENTER)
s_table_header = ParagraphStyle('TH', fontName='Carlito-Bold', fontSize=8.5,
    leading=11, textColor=colors.white, alignment=TA_CENTER)
s_table_cell = ParagraphStyle('TC', fontName=BODY_FONT, fontSize=8.5,
    leading=11, textColor=TEXT_PRIMARY, alignment=TA_LEFT)
s_table_cell_c = ParagraphStyle('TCC', parent=s_table_cell, alignment=TA_CENTER)
s_gold_line = ParagraphStyle('GoldLine', fontName=BODY_FONT, fontSize=2,
    leading=2, textColor=GOLD)

# ═══════════════════════════════════════════════════════
#  DOCUMENT TEMPLATE WITH TOC
# ═══════════════════════════════════════════════════════
IMG_DIR = '/home/z/my-project/download/'
OUTPUT  = os.path.join(IMG_DIR, 'ONIT-PNG_body.pdf')

PAGE_W, PAGE_H = A4  # 595.27 x 841.89 pt
MARGIN_L = 60
MARGIN_R = 55
MARGIN_T = 60
MARGIN_B = 55

class TocDocTemplate(BaseDocTemplate):
    """Custom doc template that supports auto-TOC via multiBuild."""
    def __init__(self, filename, **kwargs):
        BaseDocTemplate.__init__(self, filename, **kwargs)
        frame = Frame(MARGIN_L, MARGIN_B, PAGE_W - MARGIN_L - MARGIN_R,
                      PAGE_H - MARGIN_T - MARGIN_B, id='main',
                      topPadding=0, bottomPadding=0)
        template = PageTemplate(id='main', frames=[frame],
                                onPage=self._add_page_deco)
        self.addPageTemplates([template])
        self.page_count = 0

    def _add_page_deco(self, canvas, doc):
        canvas.saveState()
        # Top line
        canvas.setStrokeColor(NAVY)
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN_L, PAGE_H - 40, PAGE_W - MARGIN_R, PAGE_H - 40)
        # Gold sub-line
        canvas.setStrokeColor(GOLD)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN_L, PAGE_H - 43, PAGE_W - MARGIN_R, PAGE_H - 43)
        # Header text
        canvas.setFont('Carlito', 7)
        canvas.setFillColor(TEXT_MUTED)
        canvas.drawString(MARGIN_L, PAGE_H - 36, 'ONIT-PNG — Architecture Technique & Cahier des Charges')
        canvas.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 36, 'ARPT Guinée — Mai 2026')
        # Bottom line
        canvas.setStrokeColor(NAVY)
        canvas.setLineWidth(1)
        canvas.line(MARGIN_L, MARGIN_B - 15, PAGE_W - MARGIN_R, MARGIN_B - 15)
        # Page number
        canvas.setFont('Carlito', 8)
        canvas.setFillColor(NAVY)
        canvas.drawCentredString(PAGE_W / 2, MARGIN_B - 28, f'{doc.page}')
        canvas.restoreState()

    def afterFlowable(self, flowable):
        """Register TOC entries for headings."""
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            text = flowable.getPlainText()
            if style == 'H1':
                self.notify('TOCEntry', (0, text, self.page))
            elif style == 'H2':
                self.notify('TOCEntry', (1, text, self.page))
            elif style == 'H3':
                self.notify('TOCEntry', (2, text, self.page))


# ═══════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════
def P(text, style=s_body):
    return Paragraph(text, style)

def H1(text):
    return Paragraph(text, s_h1)

def H2(text):
    return Paragraph(text, s_h2)

def H3(text):
    return Paragraph(text, s_h3)

def Sp(h=6):
    return Spacer(1, h)

def GoldLine():
    return HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceBefore=4, spaceAfter=8)

def NavyLine():
    return HRFlowable(width="100%", thickness=0.5, color=NAVY, spaceBefore=2, spaceAfter=6)

def BulletList(items, style=s_bullet):
    """Create a bullet list from a list of text strings."""
    flowables = []
    for item in items:
        flowables.append(Paragraph(f'<bullet>&bull;</bullet> {item}', style))
    return flowables

def make_table(headers, rows, col_widths=None):
    """Create a styled table with header row."""
    header_row = [Paragraph(h, s_table_header) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), s_table_cell) for c in row])
    if col_widths is None:
        col_widths = [(PAGE_W - MARGIN_L - MARGIN_R - 10) / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths, hAlign='CENTER', repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Carlito-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('FONTNAME', (0, 1), (-1, -1), BODY_FONT),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def embed_image(filename, max_w=440, max_h=300):
    """Embed an image if it exists, otherwise return a placeholder."""
    path = os.path.join(IMG_DIR, filename)
    if not os.path.exists(path):
        return [P(f'<i>[Image non disponible : {filename}]</i>', s_caption)]
    from reportlab.lib.utils import ImageReader
    img_reader = ImageReader(path)
    iw, ih = img_reader.getSize()
    scale = min(max_w / iw, max_h / ih, 1.0)
    w, h = iw * scale, ih * scale
    img = Image(path, width=w, height=h)
    return [img, Sp(4), P(f'<i>Figure : {filename}</i>', s_caption)]


# ═══════════════════════════════════════════════════════
#  BUILD DOCUMENT CONTENT
# ═══════════════════════════════════════════════════════
story = []

# ── TABLE DES MATIÈRES ──
story.append(P('Table des Matières', s_title))
story.append(GoldLine())
story.append(Sp(8))
toc = TableOfContents()
toc.levelStyles = [s_toc_h1, s_toc_h2, s_toc_h3]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 1 : Vision Stratégique et Executive Summary
# ═══════════════════════════════════════════════════════
story.append(H1('1. Vision Stratégique et Executive Summary'))
story.append(GoldLine())

story.append(H2('1.1 Contexte national des télécommunications en Guinée'))
story.append(P(
    'La République de Guinée connaît une transformation numérique accélérée depuis le début de la décennie 2020. '
    'Avec une population estimée à plus de 14 millions d\'habitants et un taux de pénétration mobile dépassant 75 %, '
    'le secteur des télécommunications constitue un pilier stratégique du développement économique et social du pays. '
    'Trois opérateurs majeurs — Orange Guinée, MTN Guinée et Celcom Guinée — se partagent le marché mobile, tandis '
    'que plusieurs fournisseurs d\'accès Internet (FAI) opèrent sur le segment fixe et haut débit. Néanmoins, le '
    'pays fait face à des défis structurels majeurs : une couverture territoriale inégale avec d\'importantes zones '
    'blanches en milieu rural, une qualité de service (QoS) variable selon les régions et les opérateurs, et '
    'l\'absence d\'un système intégré de mesure et de supervision permettant à l\'Autorité de Régulation des Postes '
    'et Télécommunications (ARPT) de disposer d\'une vision en temps réel de la performance du secteur.'
))
story.append(P(
    'L\'ARPT, en tant qu\'organe de régulation, a besoin d\'outils robustes et intelligents pour assurer ses '
    'missions de contrôle, de benchmarking et de recommandation. Les méthodes actuelles de collecte de données, '
    'essentiellement basées sur des campagnes manuelles ponctuelles de drive tests, ne permettent pas d\'offrir '
    'une couverture temporelle et spatiale suffisante pour une régulation proactive. C\'est dans ce contexte '
    'qu\'émerge la nécessité de créer un Observatoire National Intelligent des Télécommunications, capable de '
    'centraliser, d\'analyser et de restituer les données de performance du secteur de manière automatisée et '
    'en temps réel.'
))

story.append(H2('1.2 Vision ONIT-PNG'))
story.append(P(
    'Le projet ONIT-PNG (Observatoire National Intelligent des Télécommunications et de la Performance Numérique '
    'de la Guinée) vise à doter l\'ARPT d\'une plateforme technologique de pointe, intégrant les dernières '
    'avancées en matière de Big Data, d\'intelligence artificielle et de systèmes d\'information géographique (SIG). '
    'La vision porte sur la création d\'un écosystème numérique souverain permettant la collecte automatisée des '
    'données QoS/QoE, leur analyse prédictive, leur cartographie interactive et leur restitution sous forme de '
    'dashboards exécutifs et de rapports réglementaires automatisés. L\'observatoire se positionne comme le '
    'centrage nerveux de la régulation numérique guinéenne, à l\'interface entre les opérateurs, le régulateur '
    'et les citoyens.'
))
story.append(P(
    'La vision ONIT-PNG s\'articule autour de cinq piliers fondamentaux : (1) la mesure objective et continue '
    'de la qualité de service à travers des audits terrain automatisés ; (2) la cartographie dynamique de la '
    'couverture réseau et des zones blanches ; (3) l\'analyse avancée des données télécom via des pipelines Big '
    'Data ; (4) l\'intelligence artificielle au service de la régulation prédictive ; et (5) la transparence '
    'institutionnelle via des dashboards et rapports publics. Ces piliers constituent les modules fonctionnels '
    'du système, chacun étant conçu comme un microservice indépendant, communicant via des API RESTful et des '
    'flux de données en temps réel.'
))

story.append(H2('1.3 Objectifs stratégiques'))
story.append(P(
    'Le projet ONIT-PNG poursuit les objectifs stratégiques suivants, alignés sur les priorités nationales de '
    'la politique numérique de la Guinée et les standards internationaux de régulation des télécommunications :'
))
for obj in [
    '<b>Objectif 1 — Mesure continue de la QoS/QoE</b> : Mettre en place un système de collecte automatisée et continue des indicateurs de qualité de service (latence, débit, taux d\'appel réussi, jitter, disponibilité) pour l\'ensemble des opérateurs et des régions, avec une fréquence de rafraîchissement inférieure à 5 minutes pour les KPIs temps réel.',
    '<b>Objectif 2 — Cartographie numérique souveraine</b> : Développer une plateforme SIG interactive permettant de visualiser la couverture réseau, d\'identifier les zones blanches et de cartographier les disparités de performance entre les opérateurs et les régions administratives.',
    '<b>Objectif 3 — Régulation basée sur les données</b> : Fonder les décisions réglementaires sur des données objectives, historisées et statistiquement significatives, en remplacement des méthodes d\'évaluation ponctuelles et déclaratives.',
    '<b>Objectif 4 — Prédiction et anticipation</b> : Utiliser l\'intelligence artificielle pour détecter précocement les dégradations de service, prédire les zones de congestion et émettre des recommandations automatiques aux opérateurs.',
    '<b>Objectif 5 — Transparence et redevabilité</b> : Publier régulièrement des rapports publics de benchmarking multi-opérateurs et mettre à disposition des citoyens un portail de transparence sur la qualité du service télécom national.',
]:
    story.append(P(obj, s_bullet))

story.append(H2('1.4 Positionnement international'))
story.append(P(
    'Le positionnement de l\'ONIT-PNG s\'inscrit dans une tendance mondiale de modernisation des autorités de '
    'régulation des télécommunications. L\'ARCEP (France) a déployé son dispositif Mon Réseau Mobile combinant '
    'mesures crowd-sourcées et drive tests, l\'Ofcom (Royaume-Uni) opère un système de publication en temps réel '
    'des indicateurs de couverture, et le TRA (Émirats Arabes Unis) utilise l\'IA pour la supervision prédictive '
    'de son marché. En Afrique, le GSMA souligne l\'importance des observatoires numériques comme levier de '
    'régulation efficace, citant les exemples du Nigeria (NCC) et du Kenya (CA). L\'ONIT-PNG se positionne comme '
    'le premier observatoire intelligent intégré d\'Afrique de l\'Ouest francophone, combinant mesure terrain, '
    'Big Data, IA et cartographie dans une plateforme unifiée au service de la Smart Regulation.'
))

story.append(H2('1.5 Bénéfices attendus'))
story.append(P(
    'Les bénéfices du projet ONIT-PNG sont multiples et concernent l\'ensemble des parties prenantes de '
    'l\'écosystème télécom guinéen :'
))
story.append(make_table(
    ['Bénéficiaire', 'Bénéfices principaux'],
    [
        ['ARPT', 'Supervision temps réel, régulation basée sur les données, détection prédictive des anomalies, génération automatisée des rapports réglementaires, conformité aux standards UIT/ATU'],
        ['Opérateurs', 'Benchmarking objectif, identification des zones d\'amélioration, recommandations personnalisées, réduction des contentieux par la transparence des mesures'],
        ['Citoyens', 'Transparence sur la QoS, portail public de signalement, informations sur la couverture, participation à l\'amélioration du service'],
        ['Gouvernement', 'Pilotage stratégique du numérique, identification des zones blanches pour les subventions, suivi des obligations de couverture universelle'],
    ],
    col_widths=[90, PAGE_W - MARGIN_L - MARGIN_R - 100]
))
story.append(Sp(8))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 2 : Architecture Globale du Système
# ═══════════════════════════════════════════════════════
story.append(H1('2. Architecture Globale du Système'))
story.append(GoldLine())

story.append(H2('2.1 Vue d\'ensemble de l\'architecture'))
story.append(P(
    'L\'architecture du système ONIT-PNG est conçue selon les principes du cloud-native et du microservice, '
    'assurant une scalabilité horizontale, une résilience native et une évolutivité maximale. Le système est '
    'organisé en six modules fonctionnels autonomes — Audit Terrain, Cartographie SIG, Big Data & Analytics, '
    'Intelligence Artificielle, Dashboard Exécutif et Rapports — communiquant via un bus de données Apache Kafka '
    'et des API RESTful/GraphQL. Chaque module est conteneurisé via Docker et orchestré par Kubernetes, permettant '
    'un déploiement Blue-Green et une gestion fine des ressources de calcul.'
))
story.extend(embed_image('arch_system.png'))
story.append(Sp(4))

story.append(H2('2.2 Principes architecturaux'))
story.append(P(
    'L\'architecture repose sur les principes fondamentaux suivants, qui guident l\'ensemble des choix techniques '
    'et organisationnels du projet :'
))
for pr in [
    '<b>Microservices</b> : Chaque module fonctionnel est un service indépendant avec sa propre base de données, ses API et son cycle de déploiement. Cette approche permet une évolution isolée de chaque composant et une résilience accrue du système global.',
    '<b>Cloud-Native</b> : L\'ensemble de l\'infrastructure est conçue pour le cloud, avec conteneurisation Docker, orchestration Kubernetes, et gestion déclarative de la configuration via Helm Charts.',
    '<b>API-First</b> : Toute fonctionnalité est exposée via des API (REST et GraphQL) avant toute implémentation d\'interface utilisateur, garantissant l\'interopérabilité et la réutilisabilité des services.',
    '<b>Event-Driven</b> : Les flux de données inter-modules transitent via Apache Kafka, permettant un couplage lâche, une rétention des événements et une replay capability en cas d\'incident.',
    '<b>Sovereign-by-Design</b> : Les données sensibles résident sur des infrastructures d\'hébergement locales ou régionales, et le système est conçu pour minimiser les dépendances vis-à-vis des fournisseurs cloud étrangers.',
]:
    story.append(P(pr, s_bullet))

story.append(H2('2.3 Stack technique détaillée'))
story.append(P(
    'Le choix de la stack technique a été guidé par des critères de maturité, de communauté, de performance '
    'et de souveraineté technologique. Le tableau ci-dessous détaille les technologies retenues pour chaque '
    'couche du système :'
))
story.append(make_table(
    ['Couche', 'Technologies', 'Justification'],
    [
        ['Frontend', 'Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui', 'SSR pour le SEO, composants accessibles, typage fort, design system cohérent'],
        ['Backend', 'FastAPI (Python 3.11+), GraphQL (Strawberry), Celery', 'Performance asynchrone, documentation auto OpenAPI, typage Python, tâches de fond fiables'],
        ['Data', 'PostgreSQL 16, PostGIS, MinIO, Apache Kafka, Apache Airflow', 'BD relationnelle robuste, extension géographique, stockage objet, streaming, orchestration ETL'],
        ['IA / ML', 'Scikit-learn, MLflow, XGBoost, SHAP', 'Modèles interprétables, suivi d\'expériences, gradient boosting, explicabilité'],
        ['DevOps', 'Docker, Kubernetes, GitHub Actions, Terraform, Helm', 'Conteneurisation, orchestration, CI/CD, Infrastructure as Code, gestion des releases'],
        ['Monitoring', 'Prometheus, Grafana, Loki, AlertManager', 'Métriques, visualisation, logs centralisés, alertes automatiques'],
        ['Sécurité', 'Keycloak (RBAC), Vault, OpenSSL, WAF', 'Gestion des identités, secrets, chiffrement, protection applicative'],
    ],
    col_widths=[65, 185, 220]
))
story.append(Sp(8))

story.append(H2('2.4 Architecture de déploiement'))
story.append(P(
    'Le déploiement du système ONIT-PNG suit une stratégie Blue-Green sur un cluster Kubernetes dédié. '
    'L\'infrastructure est divisée en trois environnements distincts — Développement (Dev), Staging et '
    'Production — chacun disposant de son propre namespace Kubernetes et de ses propres secrets. Le pipeline '
    'CI/CD est géré par GitHub Actions, avec des étapes de build, de test unitaire, de test d\'intégration, '
    'de scan de sécurité (Trivy, SonarQube) et de déploiement progressif (Canary puis Blue-Green). Les '
    'images Docker sont stockées dans un registre privé Harbor, et les artefacts de build sont versionnés '
    'sémantiquement (SemVer). Le rollback automatisé est activé en cas d\'échec des health checks post-déploiement.'
))

story.append(H2('2.5 Flux de données principaux'))
story.append(P(
    'Les flux de données du système ONIT-PNG suivent un pipeline en cinq étapes principales : '
    '(1) Ingestion — les données brutes des drive tests, walk tests, tests FAI et mesures crowd-sourcées '
    'sont collectées et envoyées vers Apache Kafka ; '
    '(2) Stockage brut — les événements sont persistés dans MinIO (data lake objet) et PostgreSQL brut ; '
    '(3) Transformation — Apache Airflow orchestre les ETL de nettoyage, d\'agrégation et d\'enrichissement ; '
    '(4) Analyse — les données transformées alimentent les modèles IA et les dashboards temps réel ; '
    '(5) Diffusion — les résultats sont publiés via les API, les dashboards et les rapports automatisés. '
    'Ce pipeline garantit la traçabilité complète des données de la collecte à la restitution, avec une '
    'latence de bout en bout inférieure à 5 minutes pour les flux temps réel.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 3 : Module Audit Terrain
# ═══════════════════════════════════════════════════════
story.append(H1('3. Cahier des Charges — Module Audit Terrain'))
story.append(GoldLine())

story.append(H2('3.1 Drive tests et Walk tests'))
story.append(P(
    'Le module Audit Terrain constitue le socle de collecte de données du système ONIT-PNG. Il permet la '
    'planification, l\'exécution et le suivi des campagnes de drive tests et de walk tests sur l\'ensemble '
    'du territoire national. Les drive tests sont réalisés à bord de véhicules équipés de smartphones de '
    'référence (Samsung Galaxy S24, iPhone 15 Pro) et de probateurs TEMS/Easy-RF, parcourant les axes '
    'routiers principaux et secondaires selon des routes prédéfinies et reproductibles. Les walk tests sont '
    'effectués dans les zones urbaines denses, les centres commerciaux, les gares et les zones à forte '
    'affluence, à l\'aide de terminaux portables et d\'applications de mesure QoS/QoE (QUIC, Accutest). '
    'Chaque campagne est planifiée dans le module de scheduling, avec définition des routes, des créneaux '
    'horaires, des opérateurs à tester et des indicateurs à mesurer. Les résultats sont automatiquement '
    'remontés vers le Data Warehouse via l\'API d\'ingestion.'
))

story.append(H2('3.2 Tests fixes FAI'))
story.append(P(
    'Les tests fixes des fournisseurs d\'accès Internet (FAI) sont réalisés via des sondes Raspberry Pi 4 '
    'déployées dans les principaux points de présence (PoP) du pays. Chaque sonde exécute un cycle de tests '
    'automatisé toutes les 15 minutes, comprenant des mesures de débit descendant et montant (via Speedtest CLI '
    'et iperf3), de latence (ping vers des serveurs de référence), de gigue (jitter) et de perte de paquets. '
    'Les protocoles de test incluent ICMP, UDP, TCP et HTTP/HTTPS, avec des serveurs cibles locaux (hébergés '
    'en Guinée) et internationaux (Europe, Amérique). Les résultats sont agrégés par période de 1 heure et '
    'stockés dans le Data Warehouse avec les métadonnées de localisation, d\'opérateur et de configuration '
    'de la sonde. Le déploiement initial prévoit 50 sondes réparties sur les 8 régions administratives.'
))

story.append(H2('3.3 QoS Mobile : KPIs et seuils réglementaires'))
story.append(P(
    'La qualité de service mobile est mesurée selon les indicateurs clés définis par les spécifications '
    'UIT-T E.800 et les arrêtés réglementaires de l\'ARPT. Les KPIs principaux et leurs seuils réglementaires '
    'sont les suivants :'
))
story.append(make_table(
    ['KPI', 'Seuil ARPT', 'Unité', 'Fréquence de mesure'],
    [
        ['Taux d\'appel réussi (CSCR)', '≥ 95 %', '%', 'Par campagne / continu'],
        ['Taux d\'appel tombé (CDR)', '≤ 2 %', '%', 'Par campagne / continu'],
        ['Qualité de la voix (MOS)', '≥ 3.5', 'Score 1-5', 'Par campagne'],
        ['Latence (Round Trip)', '≤ 100 ms', 'ms', 'Continu (15 min)'],
        ['Débit descendant', '≥ 5 Mbps (4G)', 'Mbps', 'Continu (15 min)'],
        ['Débit montant', '≥ 2 Mbps (4G)', 'Mbps', 'Continu (15 min)'],
        ['Jitter', '≤ 30 ms', 'ms', 'Continu (15 min)'],
        ['Perte de paquets', '≤ 1 %', '%', 'Continu (15 min)'],
        ['Disponibilité du réseau', '≥ 99.5 %', '%', 'Mensuel'],
        ['Temps d\'établissement d\'appel', '≤ 5 s', 's', 'Par campagne'],
    ],
    col_widths=[145, 85, 65, 175]
))
story.append(Sp(8))

story.append(H2('3.4 QoS Internet : métriques et benchmarks'))
story.append(P(
    'Les métriques de QoS Internet couvrent à la fois les services fixes (FAI) et mobiles (data mobile). '
    'Elles comprennent le débit descendant et montant (TCP/UDP), la latence vers les serveurs locaux et '
    'internationaux, la gigue, la perte de paquets, le temps de chargement des pages web (web browsing), '
    'la qualité du streaming vidéo (MESURE YouTube, Netflix), et la performance du VoIP (MOS, jitter, perte). '
    'Les benchmarks sont établis par comparaison entre opérateurs, entre régions et par rapport aux seuils '
    'réglementaires. Des benchmarks internationaux sont également calculés en référence aux performances '
    'observées dans les pays voisins (Sénégal, Mali, Côte d\'Ivoire) et aux standards du GSMA.'
))

story.append(H2('3.5 QoE Utilisateur'))
story.append(P(
    'La qualité d\'expérience (QoE) est évaluée selon le modèle ITU-T P.800 et les recommandations ETSI '
    'TR 102 595. Elle complète les mesures objectives de QoS par une évaluation de la perception utilisateur, '
    'incluant le Mean Opinion Score (MOS) pour la voix, le Video MOS pour le streaming, et le QoE score '
    'composite pour les services data. La méthodologie combine des mesures instrumentées (sondes, applications '
    'de test) et du crowd-sourcing via une application mobile ONIT-PNG permettant aux utilisateurs de signaler '
    'leur expérience en temps réel. Les données QoE sont corrélées aux mesures QoS pour établir des modèles '
    'de prédiction de la satisfaction utilisateur.'
))

story.append(H2('3.6 Benchmark multi-opérateurs'))
story.append(P(
    'Le benchmark multi-opérateurs permet de comparer les performances des trois opérateurs mobiles '
    '(Orange, MTN, Celcom) et des FAI sur l\'ensemble des indicateurs QoS/QoE. Le cadre comparatif '
    'est structuré en trois niveaux : (1) un comparatif national agrégé, publié trimestriellement ; '
    '(2) un comparatif régional détaillé, par région administrative ; (3) un comparatif local, par '
    'site ou par axe routier. Chaque niveau de benchmark est généré automatiquement par le pipeline '
    'de données et validé par le comité réglementaire avant publication. Les écarts significatifs '
    'par rapport aux seuils ARPT déclenchent des alertes et des recommandations d\'action.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 4 : Module Cartographie SIG
# ═══════════════════════════════════════════════════════
story.append(H1('4. Cahier des Charges — Module Cartographie SIG'))
story.append(GoldLine())

story.append(H2('4.1 Architecture SIG'))
story.append(P(
    'Le module Cartographie SIG repose sur une architecture moderne combinant les capacités géospatiales de '
    'PostGIS en base de données, le moteur de rendu QGIS Server pour la génération de cartes statiques, et '
    'les bibliothèques Mapbox GL JS et Leaflet pour les cartes interactives côté frontend. L\'architecture '
    'est conçue pour supporter des volumes importants de données géographiques (plusieurs millions de points '
    'de mesure) tout en maintenant des performances de rendu optimales (temps de chargement inférieur à 2 '
    'secondes pour une vue nationale). Les tuiles vectorielles sont générées à la volée via un serveur '
    'tile server (tilelive/tessera) et mises en cache via un CDN local.'
))
story.extend(embed_image('arch_sig.png'))
story.append(Sp(4))

story.append(H2('4.2 Carte interactive de couverture'))
story.append(P(
    'La carte interactive de couverture constitue la fonctionnalité centrale du module SIG. Elle permet de '
    'visualiser en temps réel la couverture réseau de chaque opérateur, par technologie (2G, 3G, 4G, 5G), '
    'avec des couches superposables : couverture voice, couverture data, couverture 4G LTE, qualité de signal '
    '(RSRP, RSRQ, SINR). L\'utilisateur peut filtrer par opérateur, par région administrative, par technologie '
    'et par période temporelle. Les outils de mesure incluent la possibilité de tracer des profils radio le long '
    'd\'un axe, de calculer la surface couverte par un rayon donné, et d\'exporter les données au format GeoJSON '
    'ou Shapefile. La carte supporte le zoom jusqu\'au niveau de la cellule individuelle avec affichage des '
    'paramètres de la station de base.'
))

story.append(H2('4.3 Identification des zones blanches'))
story.append(P(
    'L\'identification des zones blanches est réalisée par un algorithme multi-critères combinant les données '
    'de couverture réseau (niveau de signal RSRP < -110 dBm en extérieur), les données de population (densité '
    'démographique issue du recensement), et les données de terrain (modèle numérique d\'élévation SRTM pour '
    'la propagation). Les critères de classification sont les suivants : zone blanche (aucune couverture 2G+), '
    'zone grise (couverture 2G uniquement, pas de data), zone sous-desservie (couverture 3G mais débit < 1 Mbps), '
    'zone bien desservie (couverture 4G avec débit ≥ 5 Mbps). L\'algorithme de propagation utilise le modèle '
    'COST-231 Hata pour les zones urbaines et le modèle ITU-R P.1546 pour les zones rurales, calibré avec les '
    'données réelles des drive tests.'
))

story.append(H2('4.4 Heatmaps QoS'))
story.append(P(
    'Les heatmaps de qualité de service permettent de visualiser la distribution spatiale des indicateurs QoS '
    'sur l\'ensemble du territoire. Chaque indicateur (latence, débit, taux d\'appel réussi, etc.) est représenté '
    'par un dégradé de couleurs allant du vert (bonne performance) au rouge (performance critique), en passant '
    'par le jaune et l\'orange. Les heatmaps sont générées par interpolation IDW (Inverse Distance Weighting) des '
    'points de mesure, avec un pas de grille de 500 mètres en zone urbaine et de 2 kilomètres en zone rurale. '
    'Elles sont mises à jour quotidiennement pour les données agrégées et en temps réel (toutes les 5 minutes) '
    'pour les données des sondes fixes.'
))

story.append(H2('4.5 Stack SIG et modèle de données géographiques'))
story.append(P(
    'La stack SIG du module comprend les composants suivants : PostGIS 3.4 pour le stockage et les requêtes '
    'spatiales, QGIS Server 3.34 pour le rendu WMS/WFS, Mapbox GL JS pour les cartes vectorielles interactives, '
    'Leaflet pour les cartes raster légères, et GDAL/OGR pour les conversions de formats géographiques. Le modèle '
    'de données géographiques est structuré autour des entités principales suivantes : Region (polygone administratif), '
    'Prefecture (sous-division), Site (point de mesure), Antenne (localisation de station de base avec azimut et '
    'puissance), Route (axe routier linéaire), ZoneBlanche (polygone de non-couverture). Chaque entité hérite '
    'd\'un champ geom de type Geometry et dispose d\'index spatiaux GIST optimisés pour les requêtes de type '
    'ST_Contains, ST_Intersects et ST_DWithin.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 5 : Module Big Data & Analytics
# ═══════════════════════════════════════════════════════
story.append(H1('5. Cahier des Charges — Module Big Data & Analytics'))
story.append(GoldLine())

story.append(H2('5.1 Architecture Big Data'))
story.append(P(
    'L\'architecture Big Data du module Analytics est organisée autour d\'un Data Warehouse central de type '
    'Data Mesh, où chaque domaine fonctionnel (QoS Mobile, QoS Internet, QoE, Couverture) possède son propre '
    'data product avec un contrat de données explicite. L\'architecture suit le pattern Lambda avec une couche '
    'speed (Kafka Streams pour le temps réel) et une couche batch (Airflow + PostgreSQL pour les agrégations '
    'historiques). Le stockage objet MinIO sert de data lake brut pour la rétention long terme, tandis que '
    'PostgreSQL héberge les données structurées et agrégées. La coordination des pipelines ETL est assurée par '
    'Apache Airflow, avec des DAGs (Directed Acyclic Graphs) planifiés pour les agrégations horaires, '
    'quotidiennes, hebdomadaires et mensuelles.'
))
story.extend(embed_image('arch_bigdata.png'))
story.append(Sp(4))

story.append(H2('5.2 Data Warehouse télécom'))
story.append(P(
    'Le Data Warehouse télécom est structuré selon un modèle en étoile avec une table de faits centrale '
    '(mesures QoS/QoE) et des tables de dimension (temps, géographie, opérateur, technologie, type de test). '
    'La table de faits contient les mesures brutes et agrégées, avec une granularité temporelle allant de la '
    'minute (données temps réel) au mois (données historiques). Les partitions sont organisées par mois et par '
    'opérateur pour optimiser les performances des requêtes analytiques. Le volume estimé est de 50 millions '
    'de mesures par mois, soit environ 5 Go de données brutes et 500 Mo de données agrégées. La rétention '
    'des données brutes est de 24 mois, et celle des données agrégées de 10 ans, conformément aux exigences '
    'réglementaires de l\'ARPT.'
))

story.append(H2('5.3 Historisation des campagnes'))
story.append(P(
    'La stratégie de rétention des données distingue quatre niveaux : (1) données brutes (durée de vie : '
    '24 mois, stockage MinIO compressé en Parquet) ; (2) données agrégées horaires (durée de vie : 3 ans, '
    'PostgreSQL partitionné) ; (3) données agrégées quotidiennes et mensuelles (durée de vie : 10 ans, '
    'PostgreSQL optimisé) ; (4) données de synthèse pour les rapports (durée de vie : illimitée, PostgreSQL '
    'archivé). Un processus de purge automatique est exécuté mensuellement via Airflow, avec archivage des '
    'données expirées au format Parquet sur MinIO avant suppression. L\'historisation permet les analyses '
    'tendancielles sur plusieurs années et le calcul des indicateurs de progression de la couverture nationale.'
))

story.append(H2('5.4 KPIs réglementaires'))
story.append(P(
    'Les KPIs réglementaires sont calculés automatiquement par le pipeline de données selon les formules '
    'définies par les arrêtés de l\'ARPT et les spécifications UIT-T. Chaque KPI est associé à un identifiant '
    'unique, une définition normalisée, une formule de calcul, une source de données, une fréquence de calcul '
    'et un seuil de conformité. Le tableau ci-dessous présente les principaux KPIs réglementaires :'
))
story.append(make_table(
    ['ID KPI', 'Nom', 'Formule', 'Seuil'],
    [
        ['KPI-001', 'Taux d\'appel réussi', 'Appels réussis / Appels tentés × 100', '≥ 95 %'],
        ['KPI-002', 'Taux d\'appel tombé', 'Appels tombés / Appels établis × 100', '≤ 2 %'],
        ['KPI-003', 'Taux de coupure d\'appel', 'Coupures / Appels établis × 100', '≤ 1 %'],
        ['KPI-004', 'Débit moyen descendant', 'Moyenne des débits TCP descendants', '≥ 5 Mbps'],
        ['KPI-005', 'Latence moyenne', 'Moyenne des RTT ICMP', '≤ 100 ms'],
        ['KPI-006', 'Disponibilité réseau', 'Temps actif / Temps total × 100', '≥ 99.5 %'],
        ['KPI-007', 'Score QoE composite', 'Moyenne pondérée des MOS voix/data/video', '≥ 3.5/5'],
        ['KPI-008', 'Taux de couverture 4G', 'Population couverte 4G / Pop totale × 100', '≥ 60 %'],
    ],
    col_widths=[55, 130, 180, 105]
))
story.append(Sp(8))

story.append(H2('5.5 Détection d\'anomalies'))
story.append(P(
    'La détection d\'anomalies est réalisée par un ensemble d\'algorithmes complémentaires opérant sur les '
    'flux de données temps réel et les données historiques. L\'algorithme principal est le Z-Score modifié '
    '(MAD - Median Absolute Deviation) pour la détection en temps réel des valeurs aberrantes sur les KPIs '
    'individuels. Un algorithme Isolation Forest est utilisé pour la détection multivariée d\'anomalies '
    'contextuelles, prenant en compte les corrélations entre indicateurs. Un modèle ARIMA saisonnier est '
    'déployé pour la détection des déviations tendancielles par rapport aux patterns historiques. Les '
    'anomalies détectées sont classées par sévérité (critique, majeure, mineure) et font l\'objet d\'alertes '
    'automatiques envoyées aux équipes de supervision via les dashboards et les canaux de notification '
    '(email, SMS, webhook).'
))

story.append(H2('5.6 Pipeline de données'))
story.append(P(
    'Le pipeline de données suit le flux Kafka → MinIO → Airflow → PostgreSQL, avec les étapes suivantes : '
    '(1) les données brutes des sondes, des drive tests et du crowd-sourcing sont publiées dans des topics '
    'Kafka dédiés (qos-mobile, qos-internet, qoe, coverage) ; (2) les consommateurs Kafka persist les '
    'événements en temps réel dans MinIO (format Parquet, partitionné par date/opérateur) et dans les '
    'tables brutes PostgreSQL ; (3) les DAGs Airflow exécutent les transformations d\'agrégation (horaire, '
    'quotidienne, mensuelle) et les calculs de KPIs selon les planning définis ; (4) les résultats agrégés '
    'sont stockés dans les tables analytiques PostgreSQL et exposés via l\'API GraphQL ; (5) les alertes '
    'et notifications sont déclenchées par le module de monitoring en cas de franchissement des seuils. '
    'Le pipeline garantit une latence de traitement inférieure à 2 minutes pour les flux temps réel et '
    'inférieure à 30 minutes pour les agrégations batch.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 6 : Module Intelligence Artificielle
# ═══════════════════════════════════════════════════════
story.append(H1('6. Cahier des Charges — Module Intelligence Artificielle'))
story.append(GoldLine())

story.append(H2('6.1 Architecture IA'))
story.append(P(
    'Le module Intelligence Artificielle de l\'ONIT-PNG est structuré autour d\'un pipeline de Machine Learning '
    'Operations (MLOps) complet, de la préparation des données au déploiement des modèles en production. '
    'L\'architecture comprend quatre composants principaux : (1) un Feature Store centralisé pour le stockage '
    'et la version des caractéristiques utilisées par les modèles ; (2) un moteur d\'entraînement utilisant '
    'Scikit-learn et XGBoost avec tracking des expériences via MLflow ; (3) un registre de modèles pour la '
    'gestion des versions et la promotion des modèles de staging vers la production ; (4) un moteur d\'inférence '
    'temps réel exposé via des API REST, avec un mécanisme de A/B testing pour l\'évaluation continue des '
    'modèles en production. L\'ensemble du cycle de vie des modèles est automatisé via des DAGs Airflow dédiés.'
))
story.extend(embed_image('arch_ia.png'))
story.append(Sp(4))

story.append(H2('6.2 Scoring intelligent des opérateurs'))
story.append(P(
    'Le scoring intelligent des opérateurs est le modèle phare du module IA. Il attribue à chaque opérateur '
    'un score composite sur 100, calculé à partir de quatre dimensions pondérées : Couverture (25 %), '
    'QoS technique (30 %), QoE utilisateur (25 %) et Conformité réglementaire (20 %). Chaque dimension est '
    'elle-même décomposée en sous-indicateurs avec des pondérations internes. Le modèle utilise un algorithme '
    'de normalisation min-max adapté pour ramener chaque indicateur à une échelle 0-100, puis calcule le score '
    'composite par somme pondérée. Les pondérations sont configurables par l\'ARPT via le dashboard DG et '
    'peuvent être ajustées en fonction des priorités réglementaires du moment. Le scoring est calculé '
    'quotidiennement et historisé pour permettre l\'analyse des tendances.'
))
story.append(make_table(
    ['Dimension', 'Pondération', 'Sous-indicateurs'],
    [
        ['Couverture', '25 %', 'Taux couverture 2G/3G/4G, Surface couverte, Population couverte, Zones blanches résiduelles'],
        ['QoS Technique', '30 %', 'Latence, Débit descendant/montant, Taux appel réussi, Jitter, Perte paquets, Disponibilité'],
        ['QoE Utilisateur', '25 %', 'MOS voix, Video MOS, Temps chargement web, Score crowd-sourcing, Taux de réclamation'],
        ['Conformité', '20 %', 'Respect seuils ARPT, Délai traitement incidents, Transparence données, Obligations couverture'],
    ],
    col_widths=[90, 70, 310]
))
story.append(Sp(8))

story.append(H2('6.3 Détection prédictive des dégradations'))
story.append(P(
    'La détection prédictive des dégradations utilise des modèles de séries temporelles (ARIMA saisonnier, '
    'Prophet) et de classification (XGBoost, Random Forest) pour anticiper les baisses de qualité de service '
    'avant qu\'elles ne deviennent critiques. Le modèle est entraîné sur les données historiques de QoS et '
    'prend en compte les patterns saisonniers (variation diurne/nocturne, jours ouvrés/week-end), les '
    'événements spéciaux (fêtes, manifestations) et les corrélations entre indicateurs. Les features '
    'd\'entrée incluent les KPIs des 7 derniers jours (fenêtre glissante), les indicateurs de charge réseau, '
    'les données météorologiques et les événements calendaires. Le modèle émet une alerte prédictive '
    'lorsque la probabilité de franchissement d\'un seuil critique dans les 24 heures dépasse 70 %, '
    'permettant à l\'ARPT d\'anticiper les actions réglementaires.'
))

story.append(H2('6.4 Analyse comportementale du réseau'))
story.append(P(
    'L\'analyse comportementale du réseau repose sur des techniques de feature engineering avancées pour '
    'caractériser les patterns de fonctionnement normal et anormal du réseau. Les features sont extraites '
    'des données brutes de mesure et incluent : les statistiques roulantes (moyenne, écart-type, min, max) '
    'sur des fenêtres de 1h, 6h, 24h et 7j ; les dérivées temporelles (tendance, accélération) des KPIs ; '
    'les ratios entre indicateurs (ex. débit/latence, appels réussis/tentés) ; les distances aux centroïdes '
    'de comportement normal (clustering K-Means) ; et les profils de charge par région et par opérateur. '
    'Ces features alimentent les modèles de détection d\'anomalies et de scoring, et sont visualisables '
    'sur le dashboard technique.'
))

story.append(H2('6.5 Recommandations automatiques'))
story.append(P(
    'Le moteur de recommandations automatiques génère des préconisations d\'action à destination des '
    'opérateurs et de l\'ARPT, basées sur les résultats du scoring et de la détection d\'anomalies. Le '
    'moteur utilise un système de règles (rule-based) combiné à des suggestions issues du modèle de '
    'scoring. Les types de recommandations incluent : (1) optimisation du réseau (ajout de sites, '
    'réorientation d\'antennes) ; (2) résorption de zones blanches (extension de couverture, partage '
    'd\'infrastructure) ; (3) amélioration de la QoS (augmentation de capacité, optimisation des handovers) ; '
    '(4) actions réglementaires (mise en demeure, sanction, plan d\'amélioration). Chaque recommandation '
    'est associée à un niveau de priorité (critique, élevé, moyen, faible) et à une estimation de l\'impact '
    'attendu sur le score de l\'opérateur.'
))

story.append(H2('6.6 Priorisation des zones critiques'))
story.append(P(
    'L\'algorithme de priorisation des zones critiques combine trois critères : l\'écart au seuil réglementaire '
    '(poids 40 %), la population affectée (poids 35 %) et la tendance d\'évolution (détérioration vs. '
    'amélioration, poids 25 %). Chaque zone géographique (région, préfecture, quartier) reçoit un score de '
    'criticité normalisé entre 0 et 100, permettant à l\'ARPT de classer les interventions par ordre de '
    'priorité. L\'algorithme est exécuté hebdomadairement et les résultats sont présentés sur le dashboard '
    'DG sous forme de carte choroplèthe et de tableau de classement. Les zones avec un score supérieur à 80 '
    'déclenchent automatiquement une alerte critique et l\'ouverture d\'un dossier de suivi réglementaire.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 7 : Module Dashboard Exécutif
# ═══════════════════════════════════════════════════════
story.append(H1('7. Cahier des Charges — Module Dashboard Exécutif'))
story.append(GoldLine())

story.append(H2('7.1 Dashboard DG ARPT'))
story.append(P(
    'Le dashboard du Directeur Général de l\'ARPT est conçu comme un tableau de bord stratégique offrant '
    'une vue synthétique de l\'état du secteur des télécommunications en Guinée. Il présente les indicateurs '
    'clés de performance à l\'échelle nationale : taux de couverture nationale, score QoS global, nombre de '
    'zones blanches, population couverte, classement des opérateurs et taux de conformité réglementaire. '
    'L\'interface comprend une carte de Guinée avec visualisation heatmap de la couverture, des cartes de '
    'classement des opérateurs avec sous-métriques détaillées, un flux d\'alertes en temps réel et une '
    'jauge de conformité SLA. Le design suit les principes de l\'information dense avec une priorité donnée '
    'aux alertes critiques et aux tendances de dégradation.'
))
story.extend(embed_image('dashboard_dg.png'))
story.append(Sp(4))

story.append(H2('7.2 Dashboard technique QoS'))
story.append(P(
    'Le dashboard technique QoS est destiné aux équipes d\'ingénierie et de supervision de l\'ARPT. Il '
    'offre une vue détaillée et multi-dimensionnelle des indicateurs de qualité de service, avec des '
    'fonctionnalités de filtrage par opérateur, par région, par période et par type de technologie. '
    'L\'interface comprend cinq cartes KPI (latence, débit, taux d\'appel réussi, jitter, disponibilité), '
    'un graphique de tendances QoS par opérateur sur 7 jours, un graphique de benchmark comparatif avec '
    'lignes de seuils ARPT, une heatmap QoS par région et une table détaillée des métriques par opérateur '
    'avec comparaison aux seuils. Les données sont rafraîchies toutes les 5 minutes pour les KPIs temps '
    'réel et toutes les heures pour les données agrégées.'
))
story.extend(embed_image('dashboard_qos.png'))
story.append(Sp(4))

story.append(H2('7.3 Dashboard réglementaire'))
story.append(P(
    'Le dashboard réglementaire est dédié au suivi de la conformité des opérateurs aux obligations '
    'réglementaires définies par l\'ARPT. Il affiche le statut de conformité de chaque opérateur par '
    'rapport à chaque KPI réglementaire, avec un code couleur (vert : conforme, jaune : en observation, '
    'rouge : non conforme). Il comprend également le suivi des mises en demeure, des plans d\'amélioration '
    'et des sanctions, avec un historique des actions réglementaires. Les indicateurs de conformité sont '
    'calculés mensuellement et publiés dans le rapport réglementaire trimestriel.'
))

story.append(H2('7.4 Dashboard grand public'))
story.append(P(
    'Le dashboard grand public est un portail de transparence accessible à tout citoyen guinéen, sans '
    'authentification. Il présente de manière simplifiée et accessible les principaux indicateurs du secteur : '
    'taux de couverture nationale, score QoS global, population couverte, nombre de zones blanches, '
    'comparaison simplifiée des opérateurs et liste des derniers rapports publics disponibles en téléchargement. '
    'Il comprend également un bouton de signalement permettant aux citoyens de rapporter un problème de '
    'couverture ou de qualité de service dans leur localité, contribuant ainsi au dispositif de crowd-sourcing. '
    'Le design est épuré et responsive, adapté à la consultation sur mobile.'
))
story.extend(embed_image('dashboard_public.png'))
story.append(Sp(4))

story.append(H2('7.5 KPIs temps réel et SLA Monitoring'))
story.append(P(
    'Les KPIs temps réel sont calculés et rafraîchis selon les fréquences suivantes : KPIs de latence, débit '
    'et disponibilité — toutes les 5 minutes (source : sondes fixes) ; KPIs de couverture — quotidiennement '
    '(source : drive tests + propagation) ; KPIs de conformité — mensuellement (source : agrégations batch). '
    'Le SLA Monitoring assure la supervision des engagements de service des opérateurs, avec des alertes '
    'automatiques en cas de non-respect. Les seuils d\'alerte sont configurés à trois niveaux : '
    'avertissement (80 % du seuil réglementaire), critique (95 % du seuil) et violation (dépassement du '
    'seuil). Chaque alerte est tracée dans le système d\'audit logs et fait l\'objet d\'un suivi jusqu\'à '
    'résolution.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 8 : Module Rapports
# ═══════════════════════════════════════════════════════
story.append(H1('8. Cahier des Charges — Module Rapports'))
story.append(GoldLine())

story.append(H2('8.1 Rapports PDF automatisés'))
story.append(P(
    'Le module Rapports permet la génération automatisée de rapports au format PDF, Excel et PowerPoint, '
    'selon des templates prédéfinis et des plannings réguliers. Les rapports PDF sont générés à l\'aide '
    'du moteur ReportLab avec un système de templates personnalisables, incluant la page de couverture ARPT, '
    'la table des matières, les graphiques embarqués (matplotlib/plotly) et les tableaux de données. '
    'Le scheduling est assuré par Airflow, avec des DAGs dédiés pour chaque type de rapport : rapport '
    'quotidien de supervision (généré à 6h00), rapport hebdomadaire de tendances (généré le lundi à 8h00), '
    'rapport mensuel de conformité (généré le 1er de chaque mois) et rapport trimestriel réglementaire '
    '(généré en fin de trimestre). Chaque rapport est versionné et archivé dans le Data Warehouse.'
))

story.append(H2('8.2 Rapports réglementaires'))
story.append(P(
    'Les rapports réglementaires sont les documents officiels de l\'ARPT destinés aux instances de '
    'gouvernance (Ministère, Présidence) et aux opérateurs. Ils comprennent le rapport trimestriel de '
    'conformité (détail des KPIs par opérateur, comparaison aux seuils, actions réglementaires), le '
    'rapport annuel sur l\'état du secteur (synthèse nationale, tendances, recommandations stratégiques) '
    'et les rapports spéciaux sur les zones blanches (cartographie, estimation des coûts de résorption, '
    'plans d\'action). Ces rapports suivent un format normalisé conforme aux exigences de l\'UIT et de '
    'l\'Union Africaine des Télécommunications (ATU), et sont signés électroniquement par le DG de l\'ARPT.'
))

story.append(H2('8.3 Rapports opérateurs'))
story.append(P(
    'Les rapports opérateurs sont adressés individuellement à chaque opérateur et contiennent les '
    'données de performance qui le concernent, comparées au benchmark du marché. Ils comprennent le '
    'score de l\'opérateur avec détail des sous-dimensions, le classement par rapport aux concurrents, '
    'les zones de non-conformité identifiées, les recommandations d\'amélioration et le plan d\'actions '
    'correctives si nécessaire. Ces rapports sont générés mensuellement et transmis via une interface '
    'sécurisée dédiée à chaque opérateur. La fréquence peut être augmentée en cas de non-conformité '
    'persistante (rapport hebdomadaire avec suivi des actions).'
))

story.append(H2('8.4 Rapports publics de benchmark'))
story.append(P(
    'Les rapports publics de benchmark sont publiés trimestriellement sur le portail de transparence '
    'ONIT-PNG. Ils présentent une comparaison anonymisée ou identifiée (selon la politique de l\'ARPT) '
    'des performances des opérateurs, sans révéler de données commercialement sensibles. Le format est '
    'simplifié et accessible au grand public, avec des graphiques de comparaison clairs et des explications '
    'des indicateurs mesurés. Ces rapports visent à informer les citoyens et à encourager l\'émulation '
    'concurrentielle entre opérateurs pour l\'amélioration de la qualité de service.'
))

story.append(H2('8.5 Exports multi-formats'))
story.append(P(
    'Le module Rapports supporte l\'export des données et rapports en trois formats principaux : '
    'PDF (pour les rapports officiels et les documents réglementaires, générés via ReportLab), '
    'Excel/XLSX (pour les données tabulaires détaillées, exportées via openpyxl avec mise en forme '
    'conditionnelle et graphiques embarqués), et PowerPoint/PPTX (pour les présentations exécutives, '
    'générées via python-pptx avec templates graphiques). Chaque format dispose d\'une API dédiée '
    'permettant la génération à la demande, avec paramétrage du contenu, de la période et des filtres. '
    'Les exports sont accessibles via le dashboard et l\'API REST, avec un système de quota pour '
    'prévenir les usages abusifs.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 9 : Plan de Cybersécurité
# ═══════════════════════════════════════════════════════
story.append(H1('9. Plan de Cybersécurité'))
story.append(GoldLine())

story.append(H2('9.1 Architecture cybersécurité'))
story.append(P(
    'L\'architecture de cybersécurité de l\'ONIT-PNG suit le modèle Defense in Depth (défense en profondeur), '
    'avec des couches de protection à chaque niveau de la stack : réseau (firewall, WAF, IDS/IPS), '
    'application (authentification forte, validation des entrées, protection CSRF/XSS), données (chiffrement '
    'au repos et en transit, masquage des données sensibles), et infrastructure (hardening des serveurs, '
    'gestion des vulnérabilités, segmentation réseau). Le socle de sécurité est renforcé par un SOC '
    '(Security Operations Center) intégré, utilisant les données de Prometheus et Loki pour la détection '
    'des comportements suspects, et AlertManager pour la notification des incidents de sécurité.'
))
story.extend(embed_image('arch_cyber.png'))
story.append(Sp(4))

story.append(H2('9.2 Gestion RBAC'))
story.append(P(
    'La gestion des accès est basée sur le modèle RBAC (Role-Based Access Control), implémentée via Keycloak. '
    'Les rôles prédéfinis sont les suivants : SuperAdmin (accès complet au système), DG ARPT (accès à tous '
    'les dashboards et rapports), Directeur Technique (accès aux dashboards techniques et à la configuration), '
    'Ingénieur QoS (accès aux outils de mesure et d\'analyse), Analyste Data (accès aux données brutes et '
    'aux pipelines), Responsable Réglementaire (accès aux rapports réglementaires et aux actions de conformité), '
    'Opérateur (accès restreint à ses propres données de performance), et Public (accès au portail de '
    'transparence uniquement). Chaque rôle dispose de permissions finement granulaires sur les modules, '
    'les API et les données, avec un principe de moindre privilège.'
))

story.append(H2('9.3 Audit logs et traçabilité'))
story.append(P(
    'Le système d\'audit logs enregistre de manière exhaustive toutes les actions effectuées dans le système : '
    'connexions et déconnexions, consultations de données, modifications de configuration, génération de '
    'rapports, actions réglementaires, exports de données. Chaque entrée de log comprend l\'identité de '
    'l\'utilisateur, l\'horodatage précis (UTC), l\'adresse IP source, l\'action effectuée, les données '
    'consultées ou modifiées, et le résultat de l\'action. Les logs sont stockés dans une base de données '
    'immuable (append-only) avec une rétention de 5 ans, conforme aux exigences de conformité réglementaire. '
    'Un mécanisme de détection d\'anomalies sur les logs est en place pour identifier les comportements '
    'suspects (accès inhabituels, tentatives d\'élévation de privilège, exfiltration de données).'
))

story.append(H2('9.4 Chiffrement'))
story.append(P(
    'Le chiffrement est appliqué à tous les niveaux du système. En transit, les communications utilisent '
    'TLS 1.3 avec des certificats gérés par Vault PKI, renouvelés automatiquement tous les 90 jours. '
    'Les API internes communiquent via mTLS (mutual TLS) pour l\'authentification service-à-service. '
    'Au repos, les données sensibles (identifiants, tokens, données personnelles) sont chiffrées via '
    'AES-256-GCM avec gestion des clés par HashiCorp Vault. Les backups sont chiffrés avec une clé '
    'séparée stockée dans un coffre hors ligne. Le chiffrement des bases de données PostgreSQL est '
    'assuré par le module pgcrypto pour les champs sensibles et par le chiffrement transparent (TDE) '
    'au niveau du stockage.'
))

story.append(H2('9.5 Conformité réglementaire'))
story.append(P(
    'La stratégie de cybersécurité de l\'ONIT-PNG est alignée sur les référentiels internationaux et '
    'les exigences réglementaires guinéennes. En matière de protection des données personnelles, le '
    'système respecte les principes du RGPD européen (en l\'absence de loi guinéenne spécifique), avec '
    'un DPO (Délégué à la Protection des Données) désigné, un registre des traitements et des procédures '
    'd\'exercice des droits. La loi guinéenne sur les transactions électroniques et la protection des '
    'données personnelles (Loi L/2017/019/AN) est pleinement respectée. Le système est également conforme '
    'aux recommandations de l\'UIT sur la sécurité des infrastructures télécom (UIT-T X.805) et aux '
    'standards ISO 27001/27002 pour le système de management de la sécurité de l\'information.'
))

story.append(H2('9.6 Plan de réponse aux incidents'))
story.append(P(
    'Le plan de réponse aux incidents définit les procédures de gestion des incidents de sécurité, de la '
    'détection à la résolution, en quatre phases : (1) Détection et identification — les alertes de sécurité '
    'sont centralisées dans le SOC, classées par sévérité (P1 à P4) et assignées à un analyste ; '
    '(2) Confinement — les mesures de confinement immédiat sont appliquées (isolation du composant affecté, '
    'révocation des accès compromis, coupure réseau si nécessaire) ; (3) Éradication et récupération — '
    'la cause racine est identifiée, les systèmes sont restaurés à partir des backups vérifiés et les '
    'vulnérabilités sont corrigées ; (4) Post-incident — un rapport d\'incident est rédigé, les leçons '
    'apprises sont documentées et les procédures sont mises à jour. Les temps de réponse cibles sont : '
    'P1 (critique) — 15 minutes, P2 (élevé) — 1 heure, P3 (moyen) — 4 heures, P4 (faible) — 24 heures.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 10 : Modèle de Données
# ═══════════════════════════════════════════════════════
story.append(H1('10. Modèle de Données'))
story.append(GoldLine())

story.append(H2('10.1 Entités principales'))
story.append(P(
    'Le modèle de données de l\'ONIT-PNG est structuré autour d\'une vingtaine d\'entités principales, '
    'organisées en cinq domaines fonctionnels : Mesure (Campaign, DriveTest, WalkTest, FixedTest, '
    'Measurement), Référentiel (Operator, Region, Prefecture, Site, Technology, Antenna), Analyse '
    '(KPIDefinition, KPIResult, Anomaly, Score, Recommendation), Rapport (Report, ReportTemplate, '
    'Export) et Sécurité (User, Role, Permission, AuditLog). Chaque entité est dotée d\'un identifiant '
    'UUID, de timestamps de création et modification, et de relations avec les entités adjacentes. '
    'Le schéma relationnel suit les principes de normalisation (3NF) pour les données transactionnelles '
    'et de dénormalisation contrôlée pour les données analytiques.'
))
story.extend(embed_image('data_model.png'))
story.append(Sp(4))

story.append(H2('10.2 Schéma relationnel détaillé'))
story.append(P(
    'Le schéma relationnel détaillé ci-dessous présente les principales tables et leurs relations. '
    'La table Campaign est la table centrale du domaine Mesure, liée à Operator (l\'opérateur testé), '
    'Region (la zone géographique) et User (le chef de mission). Chaque Campaign contient plusieurs '
    'DriveTest ou WalkTest, chacun composé de multiples Measurement (la mesure individuelle). La table '
    'KPIResult est liée à KPIDefinition, Operator et Region, et stocke les résultats calculés par le '
    'pipeline d\'agrégation. La table Score est liée à Operator et calcule les scores composites selon '
    'le modèle de pondération. La table Anomaly référence les anomalies détectées, liées à un KPI, '
    'un opérateur et une région. Les contraintes d\'intégrité référentielle sont assurées par des clés '
    'étrangères avec index.'
))

story.append(H2('10.3 Dictionnaire de données'))
story.append(P(
    'Le dictionnaire de données documente l\'ensemble des champs de chaque entité, avec leur type, '
    'leur contrainte, leur signification et leur règle de gestion. Voici un extrait pour les entités '
    'principales du domaine Mesure :'
))
story.append(make_table(
    ['Table', 'Champ', 'Type', 'Description'],
    [
        ['Campaign', 'id', 'UUID', 'Identifiant unique de la campagne'],
        ['Campaign', 'operator_id', 'UUID FK', 'Opérateur testé'],
        ['Campaign', 'region_id', 'UUID FK', 'Région couverte'],
        ['Campaign', 'campaign_type', 'ENUM', 'Type : DRIVE_TEST, WALK_TEST, FIXED_TEST'],
        ['Campaign', 'status', 'ENUM', 'Statut : PLANNED, IN_PROGRESS, COMPLETED, CANCELLED'],
        ['Campaign', 'start_date', 'TIMESTAMPTZ', 'Date et heure de début'],
        ['Campaign', 'end_date', 'TIMESTAMPTZ', 'Date et heure de fin'],
        ['Measurement', 'id', 'UUID', 'Identifiant unique de la mesure'],
        ['Measurement', 'campaign_id', 'UUID FK', 'Campagne parente'],
        ['Measurement', 'kpi_code', 'VARCHAR(20)', 'Code du KPI mesuré (ex: LATENCY, THROUGHPUT_DL)'],
        ['Measurement', 'value', 'FLOAT', 'Valeur mesurée'],
        ['Measurement', 'unit', 'VARCHAR(10)', 'Unité de mesure (ms, Mbps, %, score)'],
        ['Measurement', 'geom', 'GEOGRAPHY', 'Point de mesure (lat/lon)'],
        ['Measurement', 'measured_at', 'TIMESTAMPTZ', 'Horodatage de la mesure'],
    ],
    col_widths=[80, 85, 85, 220]
))
story.append(Sp(8))

story.append(H2('10.4 Stratégie d\'indexation'))
story.append(P(
    'La stratégie d\'indexation est optimisée pour les patterns de requêtes les plus fréquents du système : '
    '(1) Index B-Tree sur les clés primaires et étrangères pour les jointures ; (2) Index B-Tree composites '
    'sur (operator_id, measured_at) et (region_id, measured_at) pour les requêtes temporelles par opérateur '
    'et région ; (3) Index GIST sur les champs geom pour les requêtes spatiales (ST_Contains, ST_DWithin) ; '
    '(4) Index BRIN sur measured_at pour les requêtes de plage temporelle sur les grandes tables partitionnées ; '
    '(5) Index partiel sur (status = \'ACTIVE\') pour les requêtes filtrant les enregistrements actifs. '
    'Les tables de mesures sont partitionnées par mois (range partitioning) pour optimiser les performances '
    'des requêtes temporelles et faciliter la gestion de la rétention des données. Le VACUUM et l\'ANALYZE '
    'sont exécutés automatiquement via l\'autovacuum PostgreSQL configuré avec des seuils adaptés aux '
    'volumes du système.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 11 : Organisation et Gouvernance du Projet
# ═══════════════════════════════════════════════════════
story.append(H1('11. Organisation et Gouvernance du Projet'))
story.append(GoldLine())

story.append(H2('11.1 Structure de l\'équipe projet'))
story.append(P(
    'L\'équipe projet ONIT-PNG est structurée selon un modèle agile avec une gouvernance bicéphale : '
    'un Comité de Pilotage (COPIL) pour la direction stratégique et une équipe de delivery pour '
    'l\'exécution opérationnelle. Le COPIL est composé du Directeur Général de l\'ARPT (président), '
    'du Directeur Technique, du Directeur Réglementaire et du Chef de Projet ONIT-PNG. Il se réunit '
    'mensuellement pour valider les orientations, arbitrer les arbitrages et suivre l\'avancement. '
    'L\'équipe de delivery comprend un Chef de Projet, un Architecte Solution, deux Architectes '
    'Techniques (Backend/Frontend), quatre développeurs Backend (Python/FastAPI), trois développeurs '
    'Frontend (React/Next.js), un Data Engineer, un ML Engineer, un Ingénieur DevOps, un Ingénieur '
    'Sécurité, deux testeurs QA et un Ingénieur SIG.'
))

story.append(H2('11.2 Rôles et responsabilités'))
story.append(make_table(
    ['Rôle', 'Responsabilités clés', 'Rendement'],
    [
        ['Chef de Projet', 'Coordination, planning, risques, reporting COPIL, communication', '100 %'],
        ['Architecte Solution', 'Conception architecture, choix techniques, revue de code, mentoring', '100 %'],
        ['Dev Backend', 'Développement API FastAPI/GraphQL, pipeline données, intégration Kafka', '100 %'],
        ['Dev Frontend', 'Développement dashboards Next.js/React, composants UI, intégration API', '100 %'],
        ['Data Engineer', 'Pipeline ETL Airflow, modélisation DWH, optimisation requêtes', '100 %'],
        ['ML Engineer', 'Modèles IA/ML, MLOps, feature engineering, tracking MLflow', '100 %'],
        ['DevOps', 'CI/CD, Kubernetes, monitoring, sécurité infrastructure', '100 %'],
        ['Ingénieur SIG', 'Cartographie PostGIS/QGIS, tuiles vectorielles, algorithme propagation', '100 %'],
        ['QA', 'Tests fonctionnels, tests de performance, tests de sécurité, recette', '100 %'],
    ],
    col_widths=[90, 290, 90]
))
story.append(Sp(8))

story.append(H2('11.3 Gouvernance et comitologie'))
story.append(P(
    'La gouvernance du projet repose sur trois instances de décision : (1) le Comité de Pilotage (COPIL), '
    'réunissant les décideurs de l\'ARPT, qui se réunit mensuellement pour valider les livrables majeurs '
    'et arbitrer les orientations stratégiques ; (2) le Comité Technique (COTECH), réunissant l\'architecte '
    'solution et les leads techniques, qui se réunit hebdomadairement pour valider les choix d\'implémentation '
    'et résoudre les blocages techniques ; (3) les cérémonies Agile (Daily Standup, Sprint Planning, Sprint '
    'Review, Rétrospective) pour le pilotage opérationnel au quotidien. Un rapport d\'avancement est '
    'produit chaque sprint (2 semaines) et remonté au COPIL via le Chef de Projet.'
))

story.append(H2('11.4 Méthodologie Agile/Scrum'))
story.append(P(
    'Le projet ONIT-PNG adopte une méthodologie Agile/Scrum adaptée au contexte institutionnel. Les sprints '
    'durent 2 semaines, avec une vélocité cible de 80 points de story par sprint. Le Product Backlog est '
    'structuré par module fonctionnel et priorisé selon la valeur métier et les dépendances techniques. '
    'Chaque User Story suit le format : "En tant que [rôle], je veux [action] afin de [bénéfice]" et est '
    'estimée en points de story (Fibonacci : 1, 2, 3, 5, 8, 13, 21). Les Definition of Ready (DoR) et '
    'Definition of Done (DoD) sont formellement définies et appliquées. La gestion du backlog et le suivi '
    'des sprints sont réalisés via GitHub Projects, avec intégration au pipeline CI/CD pour le suivi des '
    'déploiements associés à chaque story.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 12 : Stratégie de Déploiement
# ═══════════════════════════════════════════════════════
story.append(H1('12. Stratégie de Déploiement'))
story.append(GoldLine())

story.append(H2('12.1 Environnements'))
story.append(P(
    'Le système ONIT-PNG est déployé sur trois environnements isolés, chacun disposant de son propre '
    'cluster Kubernetes et de ses propres bases de données : l\'environnement de Développement (Dev), '
    'utilisé par les développeurs pour les tests unitaires et l\'intégration continue ; l\'environnement '
    'de Staging, réplique exacte de la production (même topology, mêmes volumes de données anonymisées), '
    'utilisé pour les tests d\'intégration, les tests de performance et la recette fonctionnelle ; et '
    'l\'environnement de Production (Prod), hébergeant le système en conditions réelles avec les données '
    'de production. Chaque environnement est déployé via des Helm Charts versionnés, avec une gestion '
    'des secrets via HashiCorp Vault et une configuration externalisée via ConfigMaps Kubernetes.'
))

story.append(H2('12.2 Stratégie Blue-Green Deployment'))
story.append(P(
    'La stratégie de déploiement en production suit le pattern Blue-Green : deux environnements identiques '
    '(Blue = version actuelle, Green = nouvelle version) coexistent en parallèle. Le déploiement se déroule '
    'en quatre étapes : (1) déploiement de la nouvelle version sur l\'environnement Green ; (2) exécution '
    'automatique des tests de smoke et de santé (health checks) ; (3) si les tests passent, bascule du '
    'traffic de l\'ingress Kubernetes vers l\'environnement Green ; (4) surveillance pendant 30 minutes, '
    'avec rollback automatique en cas d\'erreur (taux d\'erreur > 1 % ou latence P99 > 2x la baseline). '
    'Cette stratégie garantit un temps d\'indisponibilité nul (zero-downtime) et un rollback instantané.'
))

story.append(H2('12.3 CI/CD Pipeline'))
story.append(P(
    'Le pipeline CI/CD est implémenté via GitHub Actions et comprend les étapes suivantes : (1) Lint et '
    'formatage (Ruff pour Python, ESLint/Prettier pour TypeScript) ; (2) Tests unitaires (pytest avec '
    'couverture ≥ 80 %, Jest pour le frontend) ; (3) Build des images Docker multi-stage (optimisées '
    'pour la taille, base Alpine/Distroless) ; (4) Scan de sécurité des images (Trivy, Snyk) ; (5) Push '
    'des images vers le registre Harbor privé ; (6) Déploiement sur l\'environnement Staging via Helm ; '
    '(7) Tests d\'intégration et de performance sur Staging (k6 pour les tests de charge) ; (8) Approval '
    'manuel pour le déploiement en production ; (9) Déploiement Blue-Green en production ; (10) Tests de '
    'smoke post-déploiement. Le pipeline complet s\'exécute en moins de 30 minutes pour un déploiement '
    'de routine et en moins de 2 heures pour un déploiement majeur.'
))

story.append(H2('12.4 Monitoring et observabilité'))
story.append(P(
    'L\'observabilité du système repose sur les trois piliers : métriques (Prometheus avec exporteurs '
    'personnalisés pour chaque microservice), logs (Loki pour l\'agrégation et la recherche centralisée '
    'des logs structurés), et traces (Jaeger pour le distributed tracing inter-services). Grafana sert '
    'de plateforme de visualisation unifiée, avec des dashboards prédéfinis pour chaque composant du '
    'système (API Gateway, services backend, base de données, Kafka, Kubernetes). Les alertes sont '
    'gérées par AlertManager avec des règles définies en code (recording rules + alerting rules) et '
    'des canaux de notification configurables (email, SMS, Slack, webhook). Le SLA de disponibilité '
    'cible est de 99.9 % (soit un temps d\'indisponibilité maximal de 8h45 par an).'
))

story.append(H2('12.5 Plan de contingence et rollback'))
story.append(P(
    'Le plan de contingence prévoit les procédures de réponse pour les scénarios d\'incident les plus '
    'probables : (1) Défaillance d\'un microservice — le circuit breaker (Istio) isole le service '
    'défaillant et les retries automatiques sont activés ; (2) Corruption de données — restauration à '
    'partir du dernier backup vérifié (RPO < 1h, RTO < 4h) ; (3) Panne infrastructure — bascule vers '
    'le cluster de secours (DR site) avec réplication synchrone des données ; (4) Attaque de sécurité — '
    'activation du plan de réponse aux incidents (cf. section 9.6). Les backups complets sont réalisés '
    'toutes les 6 heures, avec une rétention de 30 jours. Des exercices de reprise d\'activité sont '
    'conduits trimestriellement pour valider les procédures et mesurer le RTO effectif.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 13 : Stratégie Réglementaire
# ═══════════════════════════════════════════════════════
story.append(H1('13. Stratégie Réglementaire'))
story.append(GoldLine())

story.append(H2('13.1 Cadre juridique guinéen'))
story.append(P(
    'Le cadre juridique guinéen des télécommunications repose sur la Loi L/2015/021/AN du 29 juin 2015 '
    'portant régime général des télécommunications en République de Guinée, qui définit les missions de '
    'l\'ARPT, les droits et obligations des opérateurs, et les sanctions applicables en cas de non-respect '
    'des cahiers des charges. Le Décret D/2016/167/PRG/SGG portant organisation et fonctionnement de l\'ARPT '
    'précise les pouvoirs de contrôle et de sanction du régulateur. L\'Arrêté ARPT/2018/045 définissant les '
    'indicateurs de qualité de service et les seuils minimaux constitue le référentiel de base pour la mesure '
    'de la QoS. Enfin, la Loi L/2017/019/AN sur la protection des données personnelles encadre le traitement '
    'des données collectées par l\'ONIT-PNG, imposant des obligations de consentement, de minimisation et de '
    'sécurisation des données personnelles des utilisateurs.'
))

story.append(H2('13.2 Indicateurs réglementaires et seuils'))
story.append(P(
    'Les indicateurs réglementaires de l\'ARPT sont alignés sur les recommandations de l\'UIT-T et '
    'adaptés au contexte guinéen. Ils couvrent les services mobiles (voix et data), les services fixes '
    '(FAI) et les services à valeur ajoutée. Les seuils sont révisés tous les 3 ans par l\'ARPT en '
    'consultation avec les opérateurs, en tenant compte de l\'évolution technologique (transition 3G→4G→5G) '
    'et des attentes des utilisateurs. Le système ONIT-PNG permet de calculer automatiquement la conformité '
    'de chaque opérateur à chaque indicateur, avec un reporting réglementaire automatisé et un suivi '
    'des plans d\'amélioration en cas de non-conformité.'
))

story.append(H2('13.3 Processus de sanction et recommandation'))
story.append(P(
    'Le processus de sanction et de recommandation suit une procédure graduée en quatre étapes : '
    '(1) Observation — notification à l\'opérateur d\'un écart au seuil réglementaire constaté par '
    'l\'ONIT-PNG, avec demande de plan d\'amélioration sous 30 jours ; (2) Mise en demeure — si l\'écart '
    'persiste au-delà de 90 jours, mise en demeure formelle avec plan d\'actions correctives sous 60 jours ; '
    '(3) Sanction financière — en cas de non-respect de la mise en demeure, application d\'une amende '
    'calculée selon la gravité et la durée de la non-conformité (de 1 % à 5 % du chiffre d\'affaires) ; '
    '(4) Sanction administrative — en cas de récidive ou de non-conformité grave, suspension ou retrait '
    'partiel de licence. Chaque étape est documentée et tracée dans le système, avec des délais et des '
    'critères de passage clairement définis.'
))

story.append(H2('13.4 Benchmark réglementaire international'))
story.append(P(
    'Le benchmark réglementaire international positionne les pratiques de l\'ARPT par rapport aux '
    'régulateurs de référence : l\'ARCEP (France) utilise un système de scoring similaire avec publication '
    'des résultats, l\'Ofcom (Royaume-Uni) impose des obligations de couverture avec sanctions automatiques, '
    'le TRA (Émirats Arabes Unis) combine régulation prédictive et incitations financières, et la NCC '
    '(Nigeria) a déployé un observatoire QoS avec crowd-sourcing. L\'ONIT-PNG s\'inspire de ces modèles '
    'en les adaptant au contexte guinéen, avec une particularité : l\'intégration de l\'intelligence '
    'artificielle pour la régulation prédictive, une innovation en Afrique de l\'Ouest francophone.'
))

story.append(H2('13.5 Conformité UIT/ATU'))
story.append(P(
    'Le système ONIT-PNG est conçu pour être pleinement conforme aux recommandations de l\'Union '
    'Internationale des Télécommunications (UIT) et de l\'Union Africaine des Télécommunications (ATU). '
    'Les indicateurs de QoS sont alignés sur les spécifications UIT-T E.800 (définitions QoS), '
    'UIT-T G.1000 (framework QoS), UIT-T P.800 (MOS) et UIT-T Y.1540/1541 (QoS IP). Les méthodes de '
    'mesure suivent les recommandations UIT-T O.41 (mesure de la qualité de transmission) et les '
    'spécifications GSMA IR.42 (QoS measurement guidelines). L\'ATU recommande l\'harmonisation des '
    'indicateurs de régulation en Afrique, et l\'ONIT-PNG contribuera à cet objectif en servant de '
    'modèle pour les autres pays de la sous-région.'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 14 : Stratégie de Souveraineté Numérique
# ═══════════════════════════════════════════════════════
story.append(H1('14. Stratégie de Souveraineté Numérique'))
story.append(GoldLine())

story.append(H2('14.1 Cloud souverain et hébergement local'))
story.append(P(
    'La stratégie de souveraineté numérique de l\'ONIT-PNG repose sur le principe que les données de '
    'régulation télécom sont un actif stratégique de l\'État guinéen et doivent résider sur des '
    'infrastructures sous contrôle souverain. Le système est hébergé sur un cloud souverain déployé '
    'au sein du Data Center National de Guinée (DCNG) à Conakry, avec un site de reprise d\'activité '
    '(DR) à Kankan. L\'infrastructure est composée de serveurs bare-metal loués ou propriétés de l\'État, '
    'sur lesquels est déployée une plateforme Kubernetes managée en interne. Les technologies open-source '
    'sont privilégiées pour minimiser les dépendances vis-à-vis des fournisseurs propriétaires et assurer '
    'la pérennité du système. En cas de besoin de capacité supplémentaire, le recours à un cloud régional '
    'africain (ex : Africa Data Centres, OpenWord) est envisagé comme extension, avec la garantie que les '
    'données sensibles restent sur le territoire national.'
))

story.append(H2('14.2 Données sensibles et résidence des données'))
story.append(P(
    'La classification des données du système ONIT-PNG distingue quatre niveaux de sensibilité : '
    '(1) Données publiques — rapports de benchmark publiés, indicateurs agrégés nationaux ; '
    '(2) Données internes — KPIs détaillés par opérateur, configurations système, audit logs ; '
    '(3) Données confidentielles — données de mesure brutes, algorithmes de scoring, modèles IA ; '
    '(4) Données sensibles — données personnelles des utilisateurs crowd-sourcing, secrets de chiffrement, '
    'données de localisation individuelles. La politique de résidence des données impose que les données '
    'de niveau 2 et supérieur restent sur le territoire guinéen, sans réplication vers des serveurs '
    'étrangers. Les données de niveau 1 peuvent être répliquées vers un CDN régional pour améliorer '
    'les performances du portail public.'
))

story.append(H2('14.3 Indépendance technologique'))
story.append(P(
    'L\'indépendance technologique est assurée par le choix exclusif de technologies open-source pour '
    'les composants critiques du système : Linux (Ubuntu Server) comme système d\'exploitation, '
    'Kubernetes comme orchestrateur, PostgreSQL comme base de données, Apache Kafka comme bus de '
    'messages, FastAPI comme framework backend, et React/Next.js comme framework frontend. Aucune '
    'dépendance propriétaire n\'existe pour les composants de base, ce qui garantit la liberté de '
    'modification, d\'évolution et de migration. Les compétences techniques sont développées en interne '
    'via un programme de formation et de transfert de compétences, incluant des certifications Kubernetes '
    '(CKA/CKAD), PostgreSQL et sécurité informatique pour les ingénieurs guinéens de l\'équipe projet.'
))

story.append(H2('14.4 Partenariats stratégiques'))
story.append(P(
    'Les partenariats stratégiques visent à compléter les compétences internes sans compromettre la '
    'souveraineté du système. Trois types de partenariats sont envisagés : (1) Partenariats académiques — '
    'avec l\'Université de Conakry et l\'Université Gamal Abdel Nasser pour la recherche en IA appliquée '
    'aux télécoms et la formation des ingénieurs ; (2) Partenariats institutionnels — avec l\'UIT, l\'ATU '
    'et la Banque Mondiale pour le financement, l\'assistance technique et le partage de bonnes pratiques ; '
    '(3) Partenariats technologiques — avec des entreprises spécialisées en SIG (Oslandia), en MLOps '
    '(Metaflow) et en sécurité (ANSSI) pour l\'accompagnement technique ponctuel, dans le respect de la '
    'propriété intellectuelle de l\'ARPT sur l\'ensemble du code et des modèles développés.'
))

story.append(H2('14.5 Vision Smart Regulation Guinea 2030'))
story.append(P(
    'La vision Smart Regulation Guinea 2030 positionne l\'ARPT comme un régulateur de classe mondiale, '
    'tirant parti de l\'intelligence artificielle, du Big Data et de l\'automatisation pour une régulation '
    'proactive, transparente et efficiente. À l\'horizon 2030, l\'ONIT-PNG aura évolué vers un écosystème '
    'de régulation numérique intégré, connecté aux systèmes des opérateurs via des API standardisées, '
    'capable de prédire les dégradations avant qu\'elles ne se produisent, de recommander automatiquement '
    'les actions correctives et de publier en temps réel les indicateurs de performance du secteur. '
    'La Guinée deviendra un pays pilote en Afrique de l\'Ouest pour la Smart Regulation, exportant son '
    'modèle et son expertise vers les pays de la sous-région via l\'ATU et la CEDEAO. L\'ONIT-PNG sera '
    'le socle technologique de cette ambition, en constante évolution pour intégrer les innovations '
    'émergentes (5G, IoT, edge computing, IA générative).'
))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
#  SECTION 15 : Roadmap et Planning
# ═══════════════════════════════════════════════════════
story.append(H1('15. Roadmap et Planning'))
story.append(GoldLine())

story.append(H2('15.1 Roadmap 3 ans'))
story.append(P(
    'La roadmap du projet ONIT-PNG s\'étend sur trois années (2026-2028), structurée en trois phases '
    'progressives permettant une mise en service incrémentale du système. Chaque phase produit des '
    'livrables opérationnels exploitables par l\'ARPT, tout en posant les fondations pour la phase '
    'suivante. L\'approche progressive permet de valider les usages, d\'ajuster les priorités et de '
    'minimiser les risques de dépassement.'
))
story.extend(embed_image('roadmap_onit_png.png'))
story.append(Sp(4))

story.append(H2('15.2 Phase 1 : Fondations (2026)'))
story.append(P(
    'La Phase 1 est consacrée à la mise en place des fondations techniques et fonctionnelles du système. '
    'Les principaux livrables de cette phase sont : le déploiement de l\'infrastructure cloud souveraine '
    '(cluster Kubernetes, CI/CD, monitoring) ; le développement du module Audit Terrain avec les '
    'fonctionnalités de drive test et walk test ; le module Cartographie SIG avec la carte interactive '
    'de couverture et l\'identification des zones blanches ; le Data Warehouse avec les pipelines '
    'd\'ingestion et d\'agrégation ; et le Dashboard Exécutif DG avec les KPIs nationaux. À l\'issue '
    'de cette phase, l\'ARPT dispose d\'un premier système opérationnel permettant la collecte de '
    'données terrain, leur visualisation cartographique et leur restitution via un dashboard stratégique.'
))
story.append(make_table(
    ['Jalon', 'Date cible', 'Livrable'],
    [
        ['J1 — Infrastructure prête', 'Mars 2026', 'Cluster Kubernetes, CI/CD, monitoring opérationnels'],
        ['J2 — Module Audit Terrain v1', 'Juin 2026', 'Drive tests, walk tests, ingestion automatique'],
        ['J3 — Module SIG v1', 'Sept. 2026', 'Carte interactive, zones blanches, heatmaps'],
        ['J4 — Data Warehouse v1', 'Nov. 2026', 'Pipeline ingestion, agrégation, KPIs calculés'],
        ['J5 — Dashboard DG v1', 'Déc. 2026', 'Dashboard stratégique avec KPIs nationaux'],
    ],
    col_widths=[130, 90, 270]
))
story.append(Sp(8))

story.append(H2('15.3 Phase 2 : Intelligence & Analytics (2027)'))
story.append(P(
    'La Phase 2 enrichit le système de capacités analytiques et intelligentes. Les principaux livrables '
    'sont : le module Big Data & Analytics avec les KPIs réglementaires automatisés et le benchmarking '
    'analytique ; le module Intelligence Artificielle avec le scoring des opérateurs, la détection '
    'prédictive et les recommandations automatiques ; les dashboards techniques et réglementaires ; '
    'le module Rapports avec la génération automatisée des rapports PDF/Excel/PPT ; et les tests fixes '
    'FAI avec le déploiement des 50 sondes Raspberry Pi. Cette phase transforme l\'observatoire en un '
    'outil de régulation intelligent, capable d\'anticiper les problèmes et de recommander des actions.'
))
story.append(make_table(
    ['Jalon', 'Date cible', 'Livrable'],
    [
        ['J6 — Module Big Data v1', 'Mars 2027', 'KPIs réglementaires, benchmarking, détection anomalies'],
        ['J7 — Module IA v1', 'Juin 2027', 'Scoring opérateurs, détection prédictive, recommandations'],
        ['J8 — Dashboards techniques', 'Sept. 2027', 'Dashboard QoS, réglementaire, opérateur'],
        ['J9 — Module Rapports v1', 'Nov. 2027', 'Rapports automatisés PDF/Excel/PPT'],
        ['J10 — Tests FAI déployés', 'Déc. 2027', '50 sondes fixes opérationnelles sur 8 régions'],
    ],
    col_widths=[130, 90, 270]
))
story.append(Sp(8))

story.append(H2('15.4 Phase 3 : Excellence & Souveraineté (2028)'))
story.append(P(
    'La Phase 3 porte le système vers l\'excellence opérationnelle et la souveraineté numérique complète. '
    'Les livrables incluent : le portail grand public de transparence avec le crowd-sourcing citoyen ; '
    'le durcissement de la cybersécurité (SOC, certification ISO 27001) ; l\'optimisation des modèles IA '
    'avec le A/B testing en production et l\'explicabilité (SHAP) ; la connectivité API avec les systèmes '
    'des opérateurs pour l\'échange automatisé de données ; la préparation à la 5G avec les indicateurs '
    'de performance avancés (latence URLLC, débit eMBB, densité mMTC) ; et la documentation complète '
    'pour le transfert de compétences. À l\'issue de cette phase, l\'ONIT-PNG est un système mature, '
    'souverain et prêt à servir de modèle pour la sous-région.'
))
story.append(make_table(
    ['Jalon', 'Date cible', 'Livrable'],
    [
        ['J11 — Portail public', 'Mars 2028', 'Dashboard public, crowd-sourcing, signalement citoyen'],
        ['J12 — Cybersécurité renforcée', 'Juin 2028', 'SOC opérationnel, ISO 27001 en cours de certification'],
        ['J13 — IA avancée', 'Sept. 2028', 'A/B testing, SHAP, modèles optimisés v2'],
        ['J14 — API opérateurs', 'Nov. 2028', 'Connectivité API standardisée avec les 3 opérateurs'],
        ['J15 — Livraison finale', 'Déc. 2028', 'Documentation, transfert de compétences, formation'],
    ],
    col_widths=[130, 90, 270]
))
story.append(Sp(12))

# ── CONCLUSION ──
story.append(H1('Conclusion'))
story.append(GoldLine())
story.append(P(
    'Le projet ONIT-PNG représente une avancée majeure pour la régulation des télécommunications en '
    'Guinée et en Afrique de l\'Ouest francophone. En combinant les technologies de collecte terrain, '
    'de cartographie SIG, de Big Data, d\'intelligence artificielle et de visualisation temps réel dans '
    'une plateforme souveraine et intégrée, l\'Observatoire National Intelligent dotera l\'ARPT d\'un '
    'outil sans précédent pour l\'exercice de ses missions de régulation. La roadmap triennale assure '
    'une mise en œuvre progressive et maitrisée, avec des livrables opérationnels dès la première année. '
    'L\'engagement de l\'ARPT en faveur de la Smart Regulation et de la souveraineté numérique fera de '
    'la Guinée un pays pionnier dans la modernisation de la régulation télécom sur le continent africain.'
))
story.append(Sp(20))
story.append(NavyLine())
story.append(P('<i>Document confidentiel — ARPT Guinée — Mai 2026</i>', s_caption))

# ═══════════════════════════════════════════════════════
#  BUILD
# ═══════════════════════════════════════════════════════
doc = TocDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=MARGIN_L,
    rightMargin=MARGIN_R,
    topMargin=MARGIN_T,
    bottomMargin=MARGIN_B,
    title='ONIT-PNG — Architecture Technique & Cahier des Charges Détaillé',
    author='ARPT Guinée',
    subject='Observatoire National Intelligent des Télécommunications et de la Performance Numérique de la Guinée',
)

doc.multiBuild(story)
print(f'PDF body generated: {OUTPUT}')
print(f'Pages: {doc.page}')
