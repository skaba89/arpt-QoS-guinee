#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ONIT-PNG Guide des Sources de Données - Body PDF Generator (ReportLab)
"""
import os
import sys
import hashlib

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, Preformatted
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
OUTPUT_DIR = "/home/z/my-project/download"
BODY_PDF = os.path.join(OUTPUT_DIR, "onit_body.pdf")

# ── Fonts ── (using available fonts on this system)
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SimHeiBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-SemiBold.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/chinese/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRomanBold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))

registerFontFamily('SimHei', normal='SimHei', bold='SimHeiBold')
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')
registerFontFamily('TimesNewRoman', normal='TimesNewRoman', bold='TimesNewRomanBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')

# Install font fallback for mixed French text with accents
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, 'scripts'))
from pdf import install_font_fallback
install_font_fallback()

# ── Palette ──
ACCENT       = colors.HexColor('#308dad')
TEXT_PRIMARY  = colors.HexColor('#232527')
TEXT_MUTED    = colors.HexColor('#747980')
BG_SURFACE   = colors.HexColor('#d6dbe2')
BG_PAGE      = colors.HexColor('#ebedef')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ── Page setup ──
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 1.0 * inch
RIGHT_MARGIN = 1.0 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.8 * inch
AVAILABLE_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ── Styles ──
body_style = ParagraphStyle(
    name='Body', fontName='TimesNewRoman', fontSize=10.5,
    leading=17, alignment=TA_JUSTIFY, spaceAfter=6,
    firstLineIndent=20
)

body_no_indent = ParagraphStyle(
    name='BodyNoIndent', fontName='TimesNewRoman', fontSize=10.5,
    leading=17, alignment=TA_JUSTIFY, spaceAfter=6,
)

h1_style = ParagraphStyle(
    name='H1', fontName='TimesNewRoman', fontSize=18,
    leading=24, alignment=TA_LEFT, spaceBefore=12, spaceAfter=10,
    textColor=ACCENT
)

h2_style = ParagraphStyle(
    name='H2', fontName='TimesNewRoman', fontSize=14,
    leading=20, alignment=TA_LEFT, spaceBefore=10, spaceAfter=6,
    textColor=TEXT_PRIMARY
)

h3_style = ParagraphStyle(
    name='H3', fontName='TimesNewRoman', fontSize=12,
    leading=17, alignment=TA_LEFT, spaceBefore=8, spaceAfter=4,
    textColor=TEXT_PRIMARY
)

toc_h1_style = ParagraphStyle(
    name='TOCH1', fontName='TimesNewRoman', fontSize=13,
    leftIndent=20, leading=22
)

toc_h2_style = ParagraphStyle(
    name='TOCH2', fontName='TimesNewRoman', fontSize=11,
    leftIndent=40, leading=18
)

header_cell_style = ParagraphStyle(
    name='HeaderCell', fontName='TimesNewRoman', fontSize=9,
    textColor=colors.white, alignment=TA_CENTER, leading=12
)

cell_style = ParagraphStyle(
    name='Cell', fontName='TimesNewRoman', fontSize=9,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, leading=12
)

cell_left_style = ParagraphStyle(
    name='CellLeft', fontName='TimesNewRoman', fontSize=9,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leading=12
)

code_style = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=8,
    leading=11, alignment=TA_LEFT, spaceAfter=4,
    backColor=colors.HexColor('#f5f5f5'),
    leftIndent=10, rightIndent=10,
    spaceBefore=4
)

bullet_style = ParagraphStyle(
    name='Bullet', fontName='TimesNewRoman', fontSize=10.5,
    leading=17, alignment=TA_LEFT, spaceAfter=4,
    leftIndent=30, bulletIndent=15
)

caption_style = ParagraphStyle(
    name='Caption', fontName='TimesNewRoman', fontSize=9,
    leading=13, alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceBefore=3, spaceAfter=6
)

# ── Helper functions ──
def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, '<b>%s</b>' % text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

H1_ORPHAN_THRESHOLD = (PAGE_H - TOP_MARGIN - BOTTOM_MARGIN) * 0.15

def add_major_section(text):
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, h1_style, level=0),
    ]

def make_table(data, col_widths, caption_text=None):
    """Create a styled table with proper Paragraph wrapping."""
    elements = []
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    # Alternating row colors
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_commands.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_commands))
    elements.append(Spacer(1, 18))
    elements.append(t)
    if caption_text:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(caption_text, caption_style))
    elements.append(Spacer(1, 18))
    return elements

def P(text, style=None):
    return Paragraph(text, style or body_style)

def PNI(text, style=None):
    return Paragraph(text, style or body_no_indent)

def HC(text):
    return Paragraph('<b>%s</b>' % text, header_cell_style)

def C(text):
    return Paragraph(text, cell_style)

def CL(text):
    return Paragraph(text, cell_left_style)

# ── TocDocTemplate ──
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ── Build document ──
doc = TocDocTemplate(
    BODY_PDF, pagesize=A4,
    leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN, bottomMargin=BOTTOM_MARGIN,
    showBoundary=0
)

story = []

# ── Table of Contents ──
story.append(Paragraph('<b>Table des Matières</b>', ParagraphStyle(
    name='TOCTitle', fontName='TimesNewRoman', fontSize=20,
    leading=28, alignment=TA_LEFT, textColor=ACCENT, spaceAfter=18
)))
toc = TableOfContents()
toc.levelStyles = [toc_h1_style, toc_h2_style]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════
# Section 1: Introduction
# ═══════════════════════════════════════════════
story.extend(add_major_section('1. Introduction'))

story.append(P(
    "L'Observatoire National Intelligent des Télécommunications de Guinée (ONIT-PNG) est la plateforme "
    "nationale de surveillance et de suivi de la qualité de service des télécommunications en République "
    "de Guinée. Mis en place sous l'égide de l'Autorité de Régulation des Postes et Télécommunications "
    "(ARPT), cet observatoire constitue un outil stratégique pour le pilotage de la politique nationale "
    "en matière de télécommunications, assurant une collecte systématique, une analyse rigoureuse et "
    "une diffusion transparente des données de qualité de service."
))

story.append(P(
    "Le présent document a pour objectif de fournir une référence complète sur les sources de données "
    "alimentant ONIT-PNG, les formats de fichiers utilisés pour l'importation, ainsi que les méthodes "
    "de collecte associées. Il s'adresse aux ingénieurs réseau, aux analystes QoS, aux développeurs "
    "intégrateurs et à tout acteur impliqué dans le processus de collecte et de traitement des données "
    "au sein de l'observatoire."
))

story.append(P(
    "ONIT-PNG s'appuie sur cinq sources de données principales, chacune couvrant un aspect complémentaire "
    "de la qualité de service :"
))

sources_list = [
    "<b>Drive Test / Walk Test</b> : Mesures terrain effectuées par des ingénieurs avec des outils professionnels d'analyse RF, capturant des métriques radio et de performance en conditions réelles.",
    "<b>QoS Internet</b> : Mesures automatisées et manuelles de la qualité de service Internet, incluant les débits, la latence et l'expérience utilisateur, réalisées via des sondes et des outils spécialisés.",
    "<b>Signalement Citoyen</b> : Contributions des citoyens via l'application mobile ONIT Citizen ou le portail web public, permettant une couverture participative du territoire.",
    "<b>Scores Opérateurs</b> : Notes calculées trimestriellement par le moteur de scoring, agrégeant les différentes métriques de QoS en un score composite par opérateur.",
    "<b>Alertes Automatiques</b> : Notifications générées automatiquement par le système lorsque les seuils critiques de qualité de service sont dépassés."
]
for item in sources_list:
    story.append(Paragraph(item, bullet_style))

story.append(Spacer(1, 12))
story.append(P(
    "Ce guide décrit pour chaque source les outils utilisés, les métriques collectées, les formats "
    "de données attendus (CSV ou JSON), des exemples concrets, ainsi que les méthodes d'intégration "
    "dans la plateforme ONIT-PNG via l'interface d'importation ou l'API REST."
))

# ═══════════════════════════════════════════════
# Section 2: Drive Test / Walk Test
# ═══════════════════════════════════════════════
story.extend(add_major_section('2. Source 1 - Drive Test / Walk Test'))

story.append(add_heading('2.1 Outils utilisés', h2_style, level=1))
story.append(P(
    "Les campagnes de Drive Test et Walk Test constituent le pilier fondamental de la collecte de "
    "données terrain pour ONIT-PNG. Elles sont réalisées à l'aide d'outils professionnels de mesure "
    "RF (Radio Frequency) reconnus dans l'industrie des télécommunications :"
))
tools_dt = [
    "<b>TEMS Investigation</b> (by Infovista) : Solution de référence mondiale pour les mesures RF, "
    "supportant les technologies 2G, 3G, 4G et 5G. Offre une capture à haute résolution temporelle "
    "avec synchronisation GPS précise et analyse en temps réel des canaux radio.",
    "<b>Nemo Handy</b> (by Rohde and Schwarz) : Solution portable compacte pour les mesures terrain, "
    "particulièrement adaptée aux Walk Tests en environnement intérieur et aux zones urbaines denses.",
    "<b>SwissQual DivOS</b> : Outil spécialisé dans l'évaluation de la qualité d'expérience (QoE) "
    "avec des algorithmes avancés de scoring perceptuel pour les services vocaux et data."
]
for item in tools_dt:
    story.append(Paragraph(item, bullet_style))

story.append(add_heading('2.2 Méthode de collecte', h2_style, level=1))
story.append(P(
    "Les ingénieurs de l'ARPT et des opérateurs effectuent des campagnes de mesure en se déplaçant "
    "(en véhicule pour les Drive Tests, à pied pour les Walk Tests) dans les zones à évaluer. Les "
    "outils de mesure enregistrent les métriques radio et de performance à intervalles réguliers "
    "(toutes les 1 à 5 secondes), chaque mesure étant géolocalisée par GPS. Les campagnes couvrent "
    "les 8 régions administratives de la Guinée selon un planning trimestriel défini par l'ARPT."
))

story.append(add_heading('2.3 Métriques collectées', h2_style, level=1))
metrics_dt = [
    "RSSI (dBm) : Puissance du signal reçu",
    "RSRP (dBm) : Puissance du signal de référence reçu",
    "RSRQ (dB) : Qualité du signal de référence reçu",
    "SINR (dB) : Rapport signal sur interférence plus bruit",
    "Débit descendant (Mbps) : Vitesse de téléchargement",
    "Débit montant (Mbps) : Vitesse d'envoi",
    "Latence (ms) : Temps de réponse du réseau",
    "Gigue (ms) : Variation de la latence",
    "Taux d\'appel réussi (%) : Pourcentage d\'appels aboutis",
    "Taux de drop call (%) : Pourcentage d\'appels coupés"
]
for m in metrics_dt:
    story.append(Paragraph("• " + m, bullet_style))

story.append(add_heading('2.4 Format des données : CSV', h2_style, level=1))
story.append(P(
    "Les données de Drive Test sont importées au format CSV. Le séparateur est la virgule (,), "
    "l'encodage UTF-8 est requis. Le fichier doit contenir une ligne d'en-tête avec les noms de "
    "champs normalisés suivants :"
))

# CSV example table
dt_headers = ['operateur', 'region', 'latitude', 'longitude', 'typeMesure', 'timestamp',
              'rssi', 'rsrp', 'rsrq', 'sinr', 'debitDescendant', 'latence', 'campagne']
dt_rows = [
    ['ORANGE', 'CON', '10.0666', '-12.8569', 'MOBILE', '2026-05-15T08:00:00Z',
     '-65', '-90', '-12', '8', '25.3', '45', 'Drive Test Conakry Q2 2026'],
    ['MTN', 'CON', '10.0700', '-12.8600', 'MOBILE', '2026-05-15T08:05:00Z',
     '-72', '-95', '-15', '5', '18.7', '62', 'Drive Test Conakry Q2 2026'],
    ['CELCOM', 'BOK', '11.0500', '-14.2000', 'MOBILE', '2026-05-15T09:00:00Z',
     '-80', '-102', '-18', '3', '8.2', '95', 'Drive Test Boké Q2 2026'],
]
csv_col_w = [0.10, 0.06, 0.08, 0.08, 0.08, 0.15, 0.05, 0.05, 0.05, 0.05, 0.09, 0.06, 0.15]
csv_col_w = [w * AVAILABLE_WIDTH for w in csv_col_w]
csv_data = [[HC(h) for h in dt_headers]]
for row in dt_rows:
    csv_data.append([C(v) for v in row])
story.extend(make_table(csv_data, csv_col_w, "Tableau 1 : Exemple de données Drive Test (format CSV)"))

story.append(add_heading('2.5 Fréquence et intégration', h2_style, level=1))
story.append(P(
    "Les campagnes de Drive Test sont organisées trimestriellement pour chaque région administrative "
    "de la Guinée. Les données collectées sont intégrées dans ONIT-PNG de deux manières : via le "
    "module \"Import Données\" de l'interface web, en chargeant le fichier CSV directement, ou via "
    "l'API REST en effectuant une requête POST /api/import avec le fichier en pièce jointe. Le "
    "système valide automatiquement les codes opérateur, les codes région et les coordonnées GPS "
    "avant l'insertion en base de données."
))

# ═══════════════════════════════════════════════
# Section 3: QoS Internet
# ═══════════════════════════════════════════════
story.extend(add_major_section('3. Source 2 - QoS Internet'))

story.append(add_heading('3.1 Outils utilisés', h2_style, level=1))
story.append(P(
    "Les mesures de qualité de service Internet reposent sur une combinaison d'outils automatisés "
    "et manuels, déployés à travers les 8 régions de la Guinée :"
))
qos_tools = [
    "<b>Speedtest by Ookla</b> : Référence mondiale pour la mesure des débits Internet. Les serveurs "
    "de test sont hébergés localement pour minimiser l'impact de la latence du réseau dorsal.",
    "<b>NetMetric</b> : Solution de surveillance continue de la QoS, déployée sur des sondes "
    "permanentes installées dans les capitales régionales. NetMetric permet des tests automatisés "
    "à fréquence élevée avec une couverture temporelle complète.",
    "<b>Sondes personnalisées</b> : Des scripts de mesure développés en interne par l'ARPT, "
    "exécutés sur des mini-PC déployés dans les sites techniques des opérateurs. Ces sondes "
    "réalisent des tests de débit, de latence et de résolution DNS à intervalles configurables."
]
for item in qos_tools:
    story.append(Paragraph(item, bullet_style))

story.append(add_heading('3.2 Méthode de collecte', h2_style, level=1))
story.append(P(
    "La collecte des données QoS Internet s'effectue selon trois modes complémentaires. Premièrement, "
    "les sondes automatisées installées dans les 8 régions exécutent des tests de performance toutes "
    "les 15 à 30 minutes, fournissant une couverture temporelle dense et continue. Deuxièmement, "
    "les analystes QoS de l'ARPT effectuent des tests manuels ponctuels à l'aide de Speedtest ou "
    "NetMetric pour compléter les mesures automatisées ou investiguer des anomalies spécifiques. "
    "Troisièmement, les citoyens équipés de l'application ONIT Citizen peuvent réaliser des tests "
    "de débit depuis leur smartphone, contribuant ainsi à une couverture participative du territoire."
))

story.append(add_heading('3.3 Métriques collectées', h2_style, level=1))
metrics_qos = [
    "Débit download (Mbps) : Vitesse de téléchargement Internet",
    "Débit upload (Mbps) : Vitesse d\'envoi Internet",
    "Ping (ms) : Temps de réponse vers le serveur de test",
    "DNS lookup time (ms) : Temps de résolution DNS",
    "TCP connect time (ms) : Temps d\'établissement de la connexion TCP",
    "Score QoE (0-100) : Score de qualité d\'expérience calculé",
    "Page load time (s) : Temps de chargement d\'une page web de référence",
    "Video buffering (s) : Temps de mise en mémoire tampon vidéo"
]
for m in metrics_qos:
    story.append(Paragraph("• " + m, bullet_style))

story.append(add_heading('3.4 Format des données : CSV', h2_style, level=1))
story.append(P(
    "Les données QoS Internet sont importées au format CSV avec la même convention que les Drive "
    "Tests (séparateur virgule, encodage UTF-8). Les champs spécifiques à cette source sont "
    "présentés dans l'exemple ci-dessous :"
))

qos_headers = ['operateur', 'region', 'latitude', 'longitude', 'typeMesure', 'timestamp',
               'debitDownload', 'debitUpload', 'ping', 'dnsLookupTime', 'tcpConnectTime',
               'scoreQoE', 'campagne']
qos_rows = [
    ['ORANGE', 'CON', '10.0666', '-12.8569', 'INTERNET', '2026-05-15T14:00:00Z',
     '22.5', '8.3', '42', '15', '48', '75', 'QoS Internet Conakry Q2 2026'],
    ['MTN', 'CON', '10.0666', '-12.8569', 'INTERNET', '2026-05-15T14:05:00Z',
     '18.2', '6.1', '55', '20', '62', '68', 'QoS Internet Conakry Q2 2026'],
    ['CELCOM', 'KIN', '10.0500', '-12.3000', 'INTERNET', '2026-05-15T14:30:00Z',
     '8.2', '3.1', '85', '32', '92', '45', 'QoS Internet Kindia Q2 2026'],
]
qos_col_ratios = [0.09, 0.05, 0.07, 0.07, 0.07, 0.14, 0.08, 0.07, 0.05, 0.07, 0.08, 0.06, 0.13]
qos_col_w = [r * AVAILABLE_WIDTH for r in qos_col_ratios]
qos_data = [[HC(h) for h in qos_headers]]
for row in qos_rows:
    qos_data.append([C(v) for v in row])
story.extend(make_table(qos_data, qos_col_w, "Tableau 2 : Exemple de données QoS Internet (format CSV)"))

story.append(add_heading('3.5 Intégration dans ONIT-PNG', h2_style, level=1))
story.append(P(
    "Les données QoS Internet sont intégrées dans ONIT-PNG soit par téléchargement du fichier CSV "
    "via le module \"Import Données\" de l'interface web, soit par appel API POST /api/import avec "
    "le paramètre format=csv. Le processus de validation vérifie la cohérence des codes opérateur "
    "et région, la validité des coordonnées GPS, et la conformité des plages de valeurs pour chaque "
    "métrique avant l'enregistrement en base de données."
))

# ═══════════════════════════════════════════════
# Section 4: Signalement Citoyen
# ═══════════════════════════════════════════════
story.extend(add_major_section('4. Source 3 - Signalement Citoyen'))

story.append(add_heading('4.1 Outils utilisés', h2_style, level=1))
story.append(P(
    "Le signalement citoyen repose sur deux canaux de collecte accessibles au grand public, "
    "permettant une couverture participative du territoire guinéen :"
))
cit_tools = [
    "<b>Application mobile ONIT Citizen</b> : Disponible sur Android et iOS, cette application "
    "permet aux citoyens de signaler des problèmes réseau en quelques clics. L'utilisateur décrit "
    "son problème, l'application effectue automatiquement un test de connexion rapide et capture les "
    "coordonnées GPS, puis soumet le signalement au serveur ONIT-PNG.",
    "<b>Portail web public</b> : Accessible depuis tout navigateur, le portail de signalement "
    "offre un formulaire simplifié permettant de décrire un problème de connectivité et de "
    "saisir manuellement sa localisation. Ce canal est particulièrement adapté aux utilisateurs "
    "ne disposant pas de smartphone ou souhaitant faire un signalement depuis un ordinateur."
]
for item in cit_tools:
    story.append(Paragraph(item, bullet_style))

story.append(add_heading('4.2 Méthode de collecte', h2_style, level=1))
story.append(P(
    "Le processus de signalement citoyen est conçu pour être le plus simple et accessible possible. "
    "Le citoyen télécharge l'application ONIT Citizen ou accède au portail web, décrit le problème "
    "rencontré (mauvaise couverture, Internet lent, appels coupés, etc.), et soumet son signalement. "
    "L'application capture automatiquement la position GPS, l'opérateur connecté et des métriques "
    "de performance basiques (débit, ping). Les données partielles sont acceptées : un signalement "
    "peut ne contenir que la description du problème et la localisation, sans métriques techniques "
    "détaillées. Cette flexibilité garantit que même les citoyens avec une connexion dégradée "
    "peuvent contribuer à l'observatoire."
))

story.append(add_heading('4.3 Métriques collectées', h2_style, level=1))
story.append(P(
    "Contrairement aux sources techniques, le signalement citoyen accepte des données partielles. "
    "Toutes les métriques disponibles sont collectées, mais seules les informations de base sont "
    "obligatoires : opérateur, région, localisation GPS, type de problème et description. Les "
    "métriques techniques optionnelles incluent le débit de téléchargement, le ping, le score QoE, "
    "le temps de chargement de page et le temps de buffering vidéo."
))

story.append(add_heading('4.4 Format des données : JSON', h2_style, level=1))
story.append(P(
    "Les signalements citoyens sont transmis et stockés au format JSON, qui offre une structure "
    "flexible adaptée aux données partielles. Voici un exemple de signalement :"
))

json_example_citoyen = """{
  "measurements": [
    {
      "operateur": "ORANGE",
      "region": "CON",
      "latitude": 10.0666,
      "longitude": -12.8569,
      "typeMesure": "INTERNET",
      "timestamp": "2026-05-15T16:30:00Z",
      "debitDownload": 5.2,
      "ping": 95,
      "scoreQoE": 25,
      "pageLoadTime": 8.5,
      "videoBuffering": 5.2,
      "campagne": "Signalement Citoyen Conakry Mai 2026"
    }
  ]
}"""
story.append(Spacer(1, 8))
story.append(Preformatted(json_example_citoyen, code_style))
story.append(Spacer(1, 8))

story.append(add_heading('4.5 Intégration dans ONIT-PNG', h2_style, level=1))
story.append(P(
    "Les signalements citoyens peuvent être intégrés dans ONIT-PNG de trois manières : "
    "téléchargement du fichier JSON via le module \"Import Données\" de l'interface web, "
    "envoi direct par appel API POST /api/import avec le contenu JSON, ou soumission via "
    "l'endpoint dédié POST /api/alerts qui crée simultanément le signalement et une alerte "
    "associée. L'application ONIT Citizen utilise ce dernier canal pour une intégration en "
    "temps réel des signalements dans le système d'alerte."
))

# ═══════════════════════════════════════════════
# Section 5: Scores Opérateurs
# ═══════════════════════════════════════════════
story.extend(add_major_section('5. Source 4 - Scores Opérateurs'))

story.append(add_heading('5.1 Principe de calcul', h2_style, level=1))
story.append(P(
    "Chaque trimestre, le moteur de scoring d'ONIT-PNG agrège l'ensemble des mesures de qualité "
    "de service collectées au cours de la période pour calculer un score composite par opérateur. "
    "Ce score est décomposé en cinq sous-scores pondérés, reflétant les différentes dimensions de "
    "la performance télécom :"
))

scoring_data = [
    [HC('Composante'), HC('Poids'), HC('Description')],
    [C('Qualité de Service (QoS)'), C('40%'), CL('Performance réseau : débits, latence, taux d\'appel réussi')],
    [C('Couverture'), C('25%'), CL('Étendue de la couverture radio mesurée par les Drive Tests')],
    [C('Qualité d\'Expérience (QoE)'), C('20%'), CL('Perception utilisateur : chargement de pages, streaming vidéo')],
    [C('Conformité'), C('15%'), CL('Respect des seuils réglementaires définis par l\'ARPT')],
]
scoring_cw = [0.25 * AVAILABLE_WIDTH, 0.12 * AVAILABLE_WIDTH, 0.58 * AVAILABLE_WIDTH]
story.extend(make_table(scoring_data, scoring_cw, "Tableau 3 : Pondération des composantes du score opérateur"))

story.append(add_heading('5.2 Algorithme de scoring', h2_style, level=1))
story.append(P(
    "La formule de calcul du score global est la suivante :"
))
story.append(Paragraph(
    '<b>Score Global = 40% × scoreQoS + 25% × scoreCouverture + 20% × scoreQoE + 15% × scoreConformité</b>',
    ParagraphStyle(name='Formula', fontName='TimesNewRoman', fontSize=11, leading=18,
                   alignment=TA_CENTER, spaceBefore=8, spaceAfter=8, textColor=ACCENT)
))
story.append(P(
    "Chaque sous-score est normalisé sur une échelle de 0 à 100, où 100 représente la performance "
    "maximale. Les seuils de conformité sont définis par les spécifications techniques de l'ARPT "
    "et peuvent être révisés périodiquement en fonction de l'évolution du marché et des standards "
    "internationaux. Le système génère également une recommandation textuelle automatique associée "
    "à chaque score, destinée à guider les opérateurs dans leurs plans d'investissement."
))

story.append(add_heading('5.3 Métriques', h2_style, level=1))
score_metrics = [
    "scoreGlobal : Score composite pondéré (0-100)",
    "scoreCouverture : Score de couverture radio (0-100)",
    "scoreQoS : Score de qualité de service (0-100)",
    "scoreQoE : Score de qualité d\'expérience (0-100)",
    "scoreConformite : Score de conformité réglementaire (0-100)",
    "recommandation : Recommandation textuelle automatique"
]
for m in score_metrics:
    story.append(Paragraph("• " + m, bullet_style))

story.append(add_heading('5.4 Format des données : JSON', h2_style, level=1))
story.append(P(
    "Les scores opérateurs sont exportés au format JSON. Voici un exemple de structure :"
))

json_example_score = """{
  "scores": [
    {
      "operateur": "ORANGE",
      "periode": "2026-Q2",
      "scoreGlobal": 82.5,
      "scoreCouverture": 85.0,
      "scoreQoS": 80.0,
      "scoreQoE": 78.0,
      "scoreConformite": 87.0,
      "recommandation": "Maintenir les investissements en infrastructure 4G"
    }
  ]
}"""
story.append(Spacer(1, 8))
story.append(Preformatted(json_example_score, code_style))
story.append(Spacer(1, 8))

story.append(add_heading('5.5 Intégration dans ONIT-PNG', h2_style, level=1))
story.append(P(
    "Les scores opérateurs sont principalement calculés automatiquement par le moteur de scoring "
    "d'ONIT-PNG à partir des données de mesure agrégées. Cependant, pour les données historiques "
    "antérieures à la mise en place du système, ou pour les corrections rétroactives, les scores "
    "peuvent être importés manuellement au format JSON via le module \"Import Données\" ou l'API "
    "POST /api/import. Cette flexibilité permet d'assurer la continuité des séries temporelles "
    "de scoring."
))

# ═══════════════════════════════════════════════
# Section 6: Alertes Automatiques
# ═══════════════════════════════════════════════
story.extend(add_major_section('6. Source 5 - Alertes Automatiques'))

story.append(add_heading('6.1 Principe de fonctionnement', h2_style, level=1))
story.append(P(
    "Le système d'alertes automatiques d'ONIT-PNG surveille en temps réel les mesures entrantes "
    "et déclenche des alertes lorsque les seuils prédéfinis sont dépassés. Ce mécanisme permet "
    "une détection précoce des dégradations de qualité de service et une réaction rapide de la "
    "part de l'ARPT et des opérateurs. Les alertes sont classées en trois niveaux de sévérité : "
    "Critique, Haute et Moyenne, correspondant à des seuils de déclenchement progressifs."
))

story.append(add_heading('6.2 Seuils d\'alerte', h2_style, level=1))
story.append(P(
    "Le tableau ci-dessous présente les seuils d'alerte pour les principales métriques surveillées :"
))

thresh_data = [
    [HC('Métrique'), HC('Seuil Critique'), HC('Seuil Haute'), HC('Seuil Moyenne')],
    [CL('RSRP'), C('< -110 dBm'), C('< -100 dBm'), C('< -90 dBm')],
    [CL('Débit'), C('< 2 Mbps'), C('< 5 Mbps'), C('< 10 Mbps')],
    [CL('Taux Drop Call'), C('> 5%'), C('> 3%'), C('> 1.5%')],
    [CL('Latence'), C('> 200 ms'), C('> 100 ms'), C('> 50 ms')],
    [CL('Taux Appel Réussi'), C('< 70%'), C('< 85%'), C('< 95%')],
]
thresh_cw = [0.28 * AVAILABLE_WIDTH, 0.24 * AVAILABLE_WIDTH, 0.24 * AVAILABLE_WIDTH, 0.24 * AVAILABLE_WIDTH]
story.extend(make_table(thresh_data, thresh_cw, "Tableau 4 : Seuils d'alerte par métrique et niveau de sévérité"))

story.append(add_heading('6.3 Types d\'alertes', h2_style, level=1))
story.append(P(
    "Le système d'alertes distingue quatre types d'anomalies, chacun correspondant à un scénario "
    "de dégradation spécifique :"
))
alert_types = [
    "<b>DEGRADATION</b> : Baisse continue et significative d'une ou plusieurs métriques sur "
    "une zone donnée, détectée par analyse de tendance temporelle.",
    "<b>SEUIL_DEPASSE</b> : Franchissement immédiat d'un seuil critique ou haut lors de "
    "l'acquisition d'une nouvelle mesure.",
    "<b>NON_CONFORMITE</b> : Non-respect des spécifications minimales de qualité de service "
    "définies par les régulations de l'ARPT sur une période complète.",
    "<b>ZONE_BLANCHE</b> : Absence totale de signal mesuré dans une zone normalement couverte, "
    "indiquant une panne d'infrastructure ou un manque de capacité."
]
for item in alert_types:
    story.append(Paragraph(item, bullet_style))

story.append(add_heading('6.4 Création d\'alertes', h2_style, level=1))
story.append(P(
    "Les alertes peuvent être créées de deux manières : automatiquement par le système de "
    "surveillance des seuils, ou manuellement par un opérateur via l'interface utilisateur "
    "(formulaire de création d'alerte) ou via l'API REST. Voici un exemple d'appel API :"
))

api_example = """POST /api/alerts
Content-Type: application/json

{
  "type": "DEGRADATION",
  "severity": "CRITIQUE",
  "operateurId": "...",
  "regionId": "...",
  "message": "RSRP inférieur à -110 dBm sur 40% des mesures"
}"""
story.append(Spacer(1, 8))
story.append(Preformatted(api_example, code_style))
story.append(Spacer(1, 8))

story.append(P(
    "L'endpoint POST /api/alerts accepte les alertes au format JSON. Les champs obligatoires "
    "sont le type d'alerte, la sévérité, l'identifiant de l'opérateur concerné et un message "
    "descriptif. L'identifiant de la région est recommandé mais optionnel. Le système enrichit "
    "automatiquement l'alerte avec la date de création, l'utilisateur à l'origine et le contexte "
    "des mesures associées."
))

# ═══════════════════════════════════════════════
# Section 7: Flux de Données dans la Solution
# ═══════════════════════════════════════════════
story.extend(add_major_section('7. Flux de Données dans la Solution'))

story.append(add_heading('7.1 Architecture du flux de données', h2_style, level=1))
story.append(P(
    "Le flux de données dans ONIT-PNG suit un pipeline structuré en neuf étapes, depuis la "
    "collecte terrain jusqu'à la visualisation et l'alerte. Cette architecture garantit la "
    "traçabilité, la qualité et l'accessibilité des données à chaque étape du processus."
))

flow_steps = [
    ("<b>1. Collecte</b> : Les données sont collectées sur le terrain via des Drive Tests, "
     "des sondes automatiques, ou des signalements citoyens. Chaque source utilise ses outils "
     "spécifiques (TEMS, Speedtest, ONIT Citizen) et ses protocoles de mesure."),
    ("<b>2. Formatage</b> : Les données brutes sont mises au format CSV ou JSON selon les "
     "modèles normalisés fournis par ONIT-PNG. Les templates garantissent la cohérence des noms "
     "de champs, des unités et des formats de date."),
    ("<b>3. Import</b> : Les données formatées sont importées dans ONIT-PNG via le module "
     "\"Import Données\" de l'interface web ou via l'API REST (POST /api/import)."),
    ("<b>4. Validation</b> : Le système valide automatiquement les données importées : vérification "
     "des codes opérateur, des codes région, de la validité des coordonnées GPS, de la cohérence "
     "des plages de valeurs et de l'absence de doublons."),
    ("<b>5. Stockage</b> : Les données validées sont stockées dans la base de données SQLite "
     "via l'ORM Prisma. Le schéma de base de données assure l'intégrité référentielle entre "
     "les mesures, les campagnes, les opérateurs et les régions."),
    ("<b>6. Traitement</b> : Le moteur de scoring calcule les scores agrégés par opérateur "
     "et par trimestre. Les agrégations statistiques (moyennes, percentiles, écarts-types) "
     "sont pré-calculées pour optimiser les performances d'affichage."),
    ("<b>7. Visualisation</b> : Les données apparaissent dans les tableaux de bord : tableau "
     "de bord de suivi QoS, carte SIG géolocalisée, et tableau de bord de scoring comparatif."),
    ("<b>8. Alerte</b> : Le système de surveillance des seuils génère automatiquement des "
     "alertes lorsque les métriques dépassent les valeurs critiques, informant les opérateurs "
     "et les responsables de l'ARPT."),
    ("<b>9. Reporting</b> : Des rapports synthétiques peuvent être générés à partir des données "
     "agrégées, sous forme de tableaux de bord exportables ou de rapports PDF trimestriels.")
]
for item in flow_steps:
    story.append(Paragraph(item, bullet_style))

story.append(add_heading('7.2 Diagramme du flux de données', h2_style, level=1))
story.append(P(
    "Le schéma synoptique ci-dessous résume le flux principal de données dans ONIT-PNG :"
))

flow_diagram = (
    "Collecte Terrain  →  Formatage CSV/JSON  →  Import ONIT-PNG  →  "
    "Validation  →  Base de Données  →  Tableaux de Bord"
)
story.append(Spacer(1, 8))
story.append(Paragraph(
    '<b>' + flow_diagram + '</b>',
    ParagraphStyle(name='FlowDiagram', fontName='TimesNewRoman', fontSize=10,
                   leading=16, alignment=TA_CENTER, spaceBefore=8, spaceAfter=8,
                   textColor=ACCENT, backColor=colors.HexColor('#f0f7fa'),
                   borderPadding=10)
))
story.append(Spacer(1, 8))

story.append(add_heading('7.3 Détail des étapes', h2_style, level=1))
story.append(P(
    "Chaque étape du pipeline implique des contrôles qualité spécifiques. L'étape de validation "
    "rejette toute mesure dont les coordonnées GPS sont en dehors du territoire guinéen (latitude "
    "hors de la plage 7.0-12.5, longitude hors de la plage -15.0 à -8.0), dont les codes opérateur "
    "ou région ne correspondent pas aux référentiels du système, ou dont les valeurs de métriques "
    "sont en dehors des plages plausibles. Les mesures rejetées sont journalisées avec le motif du "
    "rejet pour permettre l'audit et la correction par les équipes responsables."
))

story.append(P(
    "L'étape de traitement inclut non seulement le calcul des scores, mais aussi la détection "
    "d'anomalies statistiques (valeurs aberrantes, discontinuités temporelles) et la production "
    "d'indicateurs dérivés (tendances, comparaisons inter-opérateurs, évolution trimestrielle). "
    "Ces indicateurs alimentent directement les tableaux de bord et les mécanismes d'alerte."
))

# ═══════════════════════════════════════════════
# Section 8: Référence des Champs de Données
# ═══════════════════════════════════════════════
story.extend(add_major_section('8. Référence des Champs de Données'))

story.append(PNI(
    "Cette section présente la référence complète de tous les champs du modèle MesureQoS, "
    "incluant le type de données, l'unité de mesure, la plage typique et une description détaillée. "
    "Ces spécifications constituent la norme à respecter pour toute importation de données dans "
    "ONIT-PNG."
))

ref_data = [
    [HC('Champ'), HC('Type'), HC('Unité'), HC('Plage Typique'), HC('Description')],
    [CL('operateur'), C('String'), C('-'), CL('ORANGE, MTN, CELCOM'), CL('Code opérateur')],
    [CL('region'), C('String'), C('-'), CL('CON, KIN, BOK, LAB, MAM, FAR, KAN, NZE'), CL('Code région')],
    [CL('latitude'), C('Float'), C('degrés'), CL('7.0 - 12.5'), CL('Latitude GPS')],
    [CL('longitude'), C('Float'), C('degrés'), CL('-15.0 - -8.0'), CL('Longitude GPS')],
    [CL('typeMesure'), C('String'), C('-'), CL('MOBILE, INTERNET'), CL('Type de mesure')],
    [CL('rssi'), C('Float'), C('dBm'), CL('-50 à -100'), CL('Puissance du signal')],
    [CL('rsrp'), C('Float'), C('dBm'), CL('-80 à -120'), CL('Puissance signal de référence')],
    [CL('rsrq'), C('Float'), C('dB'), CL('-5 à -20'), CL('Qualité signal de référence')],
    [CL('sinr'), C('Float'), C('dB'), CL('-5 à 25'), CL('Rapport signal sur bruit')],
    [CL('debitDescendant'), C('Float'), C('Mbps'), CL('0 - 100'), CL('Débit descendant mobile')],
    [CL('debitMontant'), C('Float'), C('Mbps'), CL('0 - 50'), CL('Débit montant mobile')],
    [CL('latence'), C('Float'), C('ms'), CL('10 - 500'), CL('Temps de latence')],
    [CL('gigue'), C('Float'), C('ms'), CL('1 - 100'), CL('Variation de latence')],
    [CL('tauxAppelReussi'), C('Float'), C('%'), CL('0 - 100'), CL('Taux d\'appels réussis')],
    [CL('tauxDropCall'), C('Float'), C('%'), CL('0 - 100'), CL('Taux d\'appels coupés')],
    [CL('debitDownload'), C('Float'), C('Mbps'), CL('0 - 200'), CL('Débit téléchargement Internet')],
    [CL('debitUpload'), C('Float'), C('Mbps'), CL('0 - 100'), CL('Débit envoi Internet')],
    [CL('ping'), C('Float'), C('ms'), CL('5 - 500'), CL('Temps de réponse ping')],
    [CL('dnsLookupTime'), C('Float'), C('ms'), CL('1 - 200'), CL('Temps résolution DNS')],
    [CL('tcpConnectTime'), C('Float'), C('ms'), CL('5 - 500'), CL('Temps connexion TCP')],
    [CL('scoreQoE'), C('Float'), C('0-100'), CL('0 - 100'), CL('Score qualité d\'expérience')],
    [CL('pageLoadTime'), C('Float'), C('s'), CL('0.5 - 30'), CL('Temps chargement page')],
    [CL('videoBuffering'), C('Float'), C('s'), CL('0 - 30'), CL('Temps buffering vidéo')],
]
ref_cw = [0.17 * AVAILABLE_WIDTH, 0.08 * AVAILABLE_WIDTH, 0.08 * AVAILABLE_WIDTH,
          0.27 * AVAILABLE_WIDTH, 0.35 * AVAILABLE_WIDTH]
story.extend(make_table(ref_data, ref_cw, "Tableau 5 : Référence complète des champs MesureQoS"))

# ═══════════════════════════════════════════════
# Section 9: Modèles de Fichiers Téléchargeables
# ═══════════════════════════════════════════════
story.extend(add_major_section('9. Modèles de Fichiers Téléchargeables'))

story.append(PNI(
    "ONIT-PNG fournit un ensemble de modèles de fichiers pré-formatés pour faciliter la préparation "
    "des données avant importation. Ces modèles garantissent le respect des conventions de nommage "
    "des champs, des formats de date et des unités de mesure. Ils sont téléchargeables directement "
    "depuis le module \"Import Données\" de l'interface ONIT-PNG."
))

story.append(add_heading('9.1 Modèles CSV', h2_style, level=1))
csv_templates = [
    ("/templates/modele_mesures_onit.csv", "Modèle général CSV pour toutes les mesures"),
    ("/templates/modele_drive_test_tems.csv", "Modèle spécifique Drive Test TEMS Investigation"),
    ("/templates/modele_qos_internet.csv", "Modèle spécifique QoS Internet Speedtest"),
]
tmpl_data_csv = [[HC('Chemin du fichier'), HC('Description')]]
for path, desc in csv_templates:
    tmpl_data_csv.append([CL(path), CL(desc)])
tmpl_cw = [0.50 * AVAILABLE_WIDTH, 0.45 * AVAILABLE_WIDTH]
story.extend(make_table(tmpl_data_csv, tmpl_cw, "Tableau 6 : Modèles de fichiers CSV disponibles"))

story.append(add_heading('9.2 Modèles JSON', h2_style, level=1))
json_templates = [
    ("/templates/modele_mesures_onit.json", "Modèle général JSON pour toutes les mesures"),
    ("/templates/modele_signalement_citoyen.json", "Modèle spécifique Signalement Citoyen"),
    ("/templates/modele_scoring_operateur.json", "Modèle spécifique Scores Opérateurs"),
]
tmpl_data_json = [[HC('Chemin du fichier'), HC('Description')]]
for path, desc in json_templates:
    tmpl_data_json.append([CL(path), CL(desc)])
story.extend(make_table(tmpl_data_json, tmpl_cw, "Tableau 7 : Modèles de fichiers JSON disponibles"))

story.append(P(
    "Chaque modèle inclut une ligne d'en-tête (CSV) ou une structure de base (JSON) avec des "
    "valeurs exemples commentées, permettant aux utilisateurs de comprendre le format attendu "
    "sans ambiguïté. Les modèles sont versionnés et mis à jour en même temps que l'application "
    "ONIT-PNG pour maintenir la compatibilité."
))

# ═══════════════════════════════════════════════
# Section 10: API de Collecte de Données
# ═══════════════════════════════════════════════
story.extend(add_major_section('10. API de Collecte de Données'))

story.append(PNI(
    "ONIT-PNG expose une API REST permettant l'intégration automatisée des données depuis des "
    "systèmes externes. Cette section décrit les endpoints disponibles et fournit des exemples "
    "d'utilisation avec curl."
))

story.append(add_heading('10.1 Import en masse - POST /api/import', h2_style, level=1))
story.append(P(
    "Cet endpoint permet l'importation de fichiers CSV ou JSON contenant plusieurs mesures. "
    "Il est utilisé pour les imports de campagnes complètes ou les chargements par lots."
))

curl_import = """curl -X POST https://onit-png.arpt.gn/api/import \\
  -H "Authorization: Bearer <token>" \\
  -F "file=@mesures_q2_2026.csv" \\
  -F "format=csv" """
story.append(Preformatted(curl_import, code_style))

story.append(add_heading('10.2 Création de mesure individuelle - POST /api/measurements', h2_style, level=1))
story.append(P(
    "Cet endpoint permet la création d'une mesure individuelle. Il est utilisé par les sondes "
    "automatisées pour envoyer leurs résultats en temps réel."
))

curl_measurement = """curl -X POST https://onit-png.arpt.gn/api/measurements \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operateur": "ORANGE",
    "region": "CON",
    "latitude": 10.0666,
    "longitude": -12.8569,
    "typeMesure": "INTERNET",
    "debitDownload": 22.5,
    "ping": 42,
    "scoreQoE": 75
  }' """
story.append(Preformatted(curl_measurement, code_style))

story.append(add_heading('10.3 Création de campagne - POST /api/campaigns', h2_style, level=1))
story.append(P(
    "Cet endpoint permet de créer une nouvelle campagne de mesure, qui regroupe un ensemble "
    "de mesures liées (Drive Test, QoS Internet, etc.)."
))

curl_campaign = """curl -X POST https://onit-png.arpt.gn/api/campaigns \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nom": "Drive Test Conakry Q2 2026",
    "type": "DRIVE_TEST",
    "region": "CON",
    "dateDebut": "2026-05-15",
    "dateFin": "2026-05-20"
  }' """
story.append(Preformatted(curl_campaign, code_style))

story.append(add_heading('10.4 Création d\'alerte - POST /api/alerts', h2_style, level=1))
story.append(P(
    "Cet endpoint permet de créer une alerte manuelle ou de soumettre un signalement citoyen "
    "qui déclenche automatiquement une alerte associée."
))

curl_alert = """curl -X POST https://onit-png.arpt.gn/api/alerts \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "DEGRADATION",
    "severity": "CRITIQUE",
    "operateurId": "orange-gn",
    "regionId": "con",
    "message": "RSRP inférieur à -110 dBm sur 40% des mesures"
  }' """
story.append(Preformatted(curl_alert, code_style))

story.append(add_heading('10.5 Liste des mesures - GET /api/measurements', h2_style, level=1))
story.append(P(
    "Cet endpoint permet de lister les mesures avec des filtres optionnels par opérateur, région, "
    "type de mesure et période. La pagination est gérée via les paramètres page et limit."
))

curl_list = """curl -X GET "https://onit-png.arpt.gn/api/measurements?\\
operateur=ORANGE&region=CON&typeMesure=INTERNET&\\
startDate=2026-04-01&endDate=2026-06-30&\\
page=1&limit=100" \\
  -H "Authorization: Bearer <token>" """
story.append(Preformatted(curl_list, code_style))

story.append(Spacer(1, 18))
story.append(P(
    "Tous les endpoints API nécessitent une authentification par jeton Bearer. Les tokens "
    "sont obtenus via l'endpoint d'authentification POST /api/auth/login avec les identifiants "
    "de l'utilisateur. Les réponses sont au format JSON avec un code HTTP standard (200 pour "
    "le succès, 400 pour une erreur de validation, 401 pour une authentification invalide, "
    "500 pour une erreur serveur)."
))

# ── Build ──
doc.multiBuild(story)
print(f"Body PDF generated: {BODY_PDF}")
