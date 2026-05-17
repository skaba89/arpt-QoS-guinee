#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ONIT-PNG Audit Complet - Rapport PDF
Observatoire National Intelligent des Telecommunications
Republique de Guinee - ARPT
"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ═══ Font Registration ═══
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-Bold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('LibSerif', normal='LibSerif', bold='LibSerif-Bold')
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')

# ═══ Color Palette ═══
ACCENT       = colors.HexColor('#5a36c6')
TEXT_PRIMARY  = colors.HexColor('#1d1f20')
TEXT_MUTED    = colors.HexColor('#858a90')
BG_SURFACE   = colors.HexColor('#dbdfe4')
BG_PAGE      = colors.HexColor('#f1f2f3')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ═══ Status Colors ═══
GREEN = colors.HexColor('#16a34a')
RED   = colors.HexColor('#dc2626')
AMBER = colors.HexColor('#d97706')
BLUE  = colors.HexColor('#2563eb')

# ═══ Page Setup ═══
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 1.0 * inch
RIGHT_MARGIN = 1.0 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.8 * inch
AVAILABLE_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ═══ Styles ═══
body_font = 'LibSerif'
heading_font = 'LibSerif'

styles = {}
styles['Title'] = ParagraphStyle('Title', fontName=heading_font, fontSize=22, leading=28,
    alignment=TA_CENTER, textColor=ACCENT, spaceBefore=6, spaceAfter=12)
styles['H1'] = ParagraphStyle('H1', fontName=heading_font, fontSize=18, leading=24,
    textColor=ACCENT, spaceBefore=18, spaceAfter=10)
styles['H2'] = ParagraphStyle('H2', fontName=heading_font, fontSize=14, leading=20,
    textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8)
styles['H3'] = ParagraphStyle('H3', fontName=heading_font, fontSize=12, leading=17,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6)
styles['Body'] = ParagraphStyle('Body', fontName=body_font, fontSize=10.5, leading=16,
    alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=6)
styles['BodyLeft'] = ParagraphStyle('BodyLeft', fontName=body_font, fontSize=10.5, leading=16,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=6)
styles['Muted'] = ParagraphStyle('Muted', fontName=body_font, fontSize=9.5, leading=14,
    alignment=TA_LEFT, textColor=TEXT_MUTED, spaceBefore=0, spaceAfter=4)
styles['TableHeader'] = ParagraphStyle('TableHeader', fontName=body_font, fontSize=10,
    textColor=colors.white, alignment=TA_CENTER)
styles['TableCell'] = ParagraphStyle('TableCell', fontName=body_font, fontSize=9.5,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, leading=13)
styles['TableCellLeft'] = ParagraphStyle('TableCellLeft', fontName=body_font, fontSize=9.5,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leading=13)
styles['Caption'] = ParagraphStyle('Caption', fontName=body_font, fontSize=9,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6)
styles['TOCTitle'] = ParagraphStyle('TOCTitle', fontName=heading_font, fontSize=18,
    leading=24, textColor=ACCENT, spaceBefore=6, spaceAfter=12)

# ═══ Helper Functions ═══
def P(text, style_name='Body'):
    return Paragraph(text, styles[style_name])

def H1(text):
    return Paragraph('<b>' + text + '</b>', styles['H1'])

def H2(text):
    return Paragraph('<b>' + text + '</b>', styles['H2'])

def H3(text):
    return Paragraph('<b>' + text + '</b>', styles['H3'])

def make_table(data, col_ratios=None, col_widths=None):
    if col_ratios:
        col_widths = [r * AVAILABLE_WIDTH for r in col_ratios]
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def status_cell(text, color):
    s = ParagraphStyle('status', fontName=body_font, fontSize=9.5, textColor=color, alignment=TA_CENTER, leading=13)
    return Paragraph('<b>' + text + '</b>', s)

# ═══ TOC Doc Template ═══
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

H1_ORPHAN_THRESHOLD = (PAGE_H - TOP_MARGIN - BOTTOM_MARGIN) * 0.15

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def add_major_section(text):
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, styles['H1'], level=0),
    ]

def add_subsection(text):
    return [add_heading(text, styles['H2'], level=1)]

# ═══ Build Document ═══
output_path = '/home/z/my-project/download/ONIT-PNG_Audit_Complet_Phase2.pdf'

doc = TocDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='ONIT-PNG Audit Complet - Phase 2',
    author='Z.ai',
    creator='Z.ai',
    subject='Audit complet de la plateforme ONIT-PNG: backend, frontend, securite et production'
)

story = []

# ═══ PAGE DE TITRE ═══
story.append(Spacer(1, 80))
story.append(Paragraph('<b>ONIT-PNG</b>', ParagraphStyle('BigTitle', fontName=heading_font,
    fontSize=36, leading=44, alignment=TA_CENTER, textColor=ACCENT)))
story.append(Spacer(1, 8))
story.append(Paragraph('Observatoire National Intelligent<br/>des Telecommunications', ParagraphStyle('SubTitle',
    fontName=body_font, fontSize=16, leading=22, alignment=TA_CENTER, textColor=TEXT_PRIMARY)))
story.append(Spacer(1, 6))
story.append(Paragraph('Republique de Guinee - ARPT', ParagraphStyle('Org', fontName=body_font,
    fontSize=13, leading=18, alignment=TA_CENTER, textColor=TEXT_MUTED)))
story.append(Spacer(1, 40))
story.append(Paragraph('<b>Audit Complet de la Plateforme</b>', ParagraphStyle('AuditTitle',
    fontName=heading_font, fontSize=22, leading=28, alignment=TA_CENTER, textColor=TEXT_PRIMARY)))
story.append(Spacer(1, 6))
story.append(Paragraph('Phase 2 - Backend, Frontend, Securite et Production', ParagraphStyle('AuditSub',
    fontName=body_font, fontSize=13, leading=18, alignment=TA_CENTER, textColor=TEXT_MUTED)))
story.append(Spacer(1, 50))
story.append(Paragraph('Date : 17 mai 2026', ParagraphStyle('Date', fontName=body_font,
    fontSize=11, leading=16, alignment=TA_CENTER, textColor=TEXT_MUTED)))
story.append(Paragraph('Version : 2.0', ParagraphStyle('Ver', fontName=body_font,
    fontSize=11, leading=16, alignment=TA_CENTER, textColor=TEXT_MUTED)))
story.append(Paragraph('Classification : Interne', ParagraphStyle('Class', fontName=body_font,
    fontSize=11, leading=16, alignment=TA_CENTER, textColor=TEXT_MUTED)))

story.append(PageBreak())

# ═══ TABLE DES MATIERES ═══
story.append(Paragraph('<b>Table des Matieres</b>', styles['TOCTitle']))
story.append(Spacer(1, 12))
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle('TOC1', fontName=body_font, fontSize=12, leftIndent=20, leading=20, spaceBefore=6),
    ParagraphStyle('TOC2', fontName=body_font, fontSize=10.5, leftIndent=40, leading=18, spaceBefore=3),
]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════
# 1. RESUME EXECUTIF
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('1. Resume Executif'))

story.append(P(
    "Ce rapport presente l'audit complet de la plateforme ONIT-PNG (Observatoire National Intelligent "
    "des Telecommunications), developpee pour l'Autorite de Regulation des Postes et Telecommunications "
    "(ARPT) de la Republique de Guinee. L'audit couvre l'ensemble des couches techniques : architecture "
    "backend, interface frontend, systeme d'authentification, modele de donnees, securite, et prete "
    "a la production. La plateforme est construite sur Next.js 16 avec TypeScript, Prisma ORM, SQLite, "
    "et NextAuth v4, deployee via Docker avec un reverse proxy Caddy."
))
story.append(P(
    "L'audit revele une plateforme fonctionnellement solide avec une couverture backend comprehensive "
    "(11 routes API), un systeme RBAC complet (9 roles, permissions granulaires, politiques RLS), et "
    "une interface utilisateur moderne comprenant 9 tableaux de bord specialises. Cependant, plusieurs "
    "vulnerabilites de securite et limitations techniques necessitent une attention prioritaire avant "
    "un deploiement en production, notamment le stockage de donnees sensibles dans les JWT, l'absence "
    "de validation des entrees sur certaines routes publiques, et la base SQLite non adaptee a la "
    "montee en charge."
))

# Score summary table
score_data = [
    [P('<b>Domaine</b>', 'TableHeader'), P('<b>Score</b>', 'TableHeader'), P('<b>Statut</b>', 'TableHeader')],
    [P('Architecture Backend', 'TableCell'), P('8.5/10', 'TableCell'), status_cell('BON', GREEN)],
    [P('Interface Frontend', 'TableCell'), P('8/10', 'TableCell'), status_cell('BON', GREEN)],
    [P('Authentification & RBAC', 'TableCell'), P('7.5/10', 'TableCell'), status_cell('MOYEN', AMBER)],
    [P('Securite', 'TableCell'), P('6.5/10', 'TableCell'), status_cell('ATTENTION', AMBER)],
    [P('Base de Donnees', 'TableCell'), P('6/10', 'TableCell'), status_cell('CRITIQUE', RED)],
    [P('Production-Readiness', 'TableCell'), P('6.5/10', 'TableCell'), status_cell('ATTENTION', AMBER)],
    [P('<b>Score Global</b>', 'TableCellLeft'), P('<b>7.2/10</b>', 'TableCell'), status_cell('ATTENTION', AMBER)],
]
story.append(Spacer(1, 12))
story.append(make_table(score_data, col_ratios=[0.45, 0.25, 0.30]))
story.append(P('Tableau 1 : Synthese des scores d\'audit par domaine', 'Caption'))
story.append(Spacer(1, 12))

# ═══════════════════════════════════════════════════════════════
# 2. ARCHITECTURE BACKEND
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('2. Architecture Backend'))

story.extend(add_subsection('2.1 Stack Technique'))

story.append(P(
    "La plateforme est construite sur un stack moderne et coherant. Le framework Next.js 16 (React 19) "
    "est utilise en mode standalone pour une production optimisee, avec un output statique et un serveur "
    "Node.js leger. TypeScript est active avec ignoreBuildErrors=false, garantissant la verification "
    "de type a la compilation. Le runtime Node.js 20 Alpine est utilise dans le Dockerfile multi-stage, "
    "et Bun est disponible comme alternative de package manager. Le mode strict React est active, ce qui "
    "aide a detecter les bugs potentiels en developpement."
))

stack_data = [
    [P('<b>Composant</b>', 'TableHeader'), P('<b>Technologie</b>', 'TableHeader'), P('<b>Version</b>', 'TableHeader')],
    [P('Framework', 'TableCellLeft'), P('Next.js', 'TableCell'), P('16.1.1', 'TableCell')],
    [P('UI Framework', 'TableCellLeft'), P('React', 'TableCell'), P('19.0.0', 'TableCell')],
    [P('ORM', 'TableCellLeft'), P('Prisma', 'TableCell'), P('6.11.1', 'TableCell')],
    [P('Base de donnees', 'TableCellLeft'), P('SQLite', 'TableCell'), P('N/A', 'TableCell')],
    [P('Authentification', 'TableCellLeft'), P('NextAuth', 'TableCell'), P('4', 'TableCell')],
    [P('Validation', 'TableCellLeft'), P('Zod', 'TableCell'), P('4.4.3', 'TableCell')],
    [P('Hashing', 'TableCellLeft'), P('bcryptjs', 'TableCell'), P('3.0.3', 'TableCell')],
    [P('Cartographie', 'TableCellLeft'), P('Leaflet / React-Leaflet', 'TableCell'), P('1.9.4 / 5.0.0', 'TableCell')],
    [P('Graphiques', 'TableCellLeft'), P('Recharts', 'TableCell'), P('2.15.4', 'TableCell')],
    [P('UI Components', 'TableCellLeft'), P('Radix UI + shadcn/ui', 'TableCell'), P('Multiple', 'TableCell')],
]
story.append(Spacer(1, 12))
story.append(make_table(stack_data, col_ratios=[0.35, 0.40, 0.25]))
story.append(P('Tableau 2 : Stack technique de la plateforme', 'Caption'))

story.extend(add_subsection('2.2 Routes API'))

story.append(P(
    "La plateforme expose 11 routes API couvrant l'ensemble des fonctionnalites metier. Chaque route "
    "implemente une verification d'authentification via getServerSession et un controle de permissions "
    "RBAC via checkPermission. Les routes de lecture publiques (dashboard, scoring, map, reports) "
    "acceptent les utilisateurs non authentifies avec un role PUBLIC par defaut, tandis que les routes "
    "d'ecriture requierent des permissions specifiques. La validation des entrees est systematiquement "
    "effectuee via Zod avec des schemas stricts incluant une sanitisation HTML (stripHtml). La pagination "
    "est implementee sur la route /api/mesures avec parametres limit/offset."
))

api_data = [
    [P('<b>Route</b>', 'TableHeader'), P('<b>Methode</b>', 'TableHeader'), P('<b>Auth</b>', 'TableHeader'), P('<b>RBAC</b>', 'TableHeader'), P('<b>Zod</b>', 'TableHeader')],
    [P('/api/dashboard', 'TableCellLeft'), P('GET', 'TableCell'), P('Optionnel', 'TableCell'), P('RLS', 'TableCell'), P('Non', 'TableCell')],
    [P('/api/campaigns', 'TableCellLeft'), P('GET/POST', 'TableCell'), P('Requis', 'TableCell'), P('write', 'TableCell'), P('Oui', 'TableCell')],
    [P('/api/mesures', 'TableCellLeft'), P('GET/POST/PUT', 'TableCell'), P('Requis', 'TableCell'), P('write', 'TableCell'), P('Oui', 'TableCell')],
    [P('/api/qos', 'TableCellLeft'), P('GET', 'TableCell'), P('Requis', 'TableCell'), P('RLS', 'TableCell'), P('Non', 'TableCell')],
    [P('/api/scoring', 'TableCellLeft'), P('GET', 'TableCell'), P('Optionnel', 'TableCell'), P('RLS', 'TableCell'), P('Non', 'TableCell')],
    [P('/api/scores', 'TableCellLeft'), P('GET/POST', 'TableCell'), P('GET: Optionnel', 'TableCell'), P('POST: write', 'TableCell'), P('Oui', 'TableCell')],
    [P('/api/alerts', 'TableCellLeft'), P('GET/POST/PATCH', 'TableCell'), P('GET/POST: Optionnel', 'TableCell'), P('PATCH: write', 'TableCell'), P('Oui', 'TableCell')],
    [P('/api/map', 'TableCellLeft'), P('GET', 'TableCell'), P('Optionnel', 'TableCell'), P('RLS', 'TableCell'), P('Non', 'TableCell')],
    [P('/api/reports', 'TableCellLeft'), P('GET/POST', 'TableCell'), P('GET: Optionnel', 'TableCell'), P('POST: write', 'TableCell'), P('Oui', 'TableCell')],
    [P('/api/users', 'TableCellLeft'), P('GET/POST/PATCH', 'TableCell'), P('Requis', 'TableCell'), P('admin', 'TableCell'), P('Oui', 'TableCell')],
    [P('/api/roles', 'TableCellLeft'), P('GET', 'TableCell'), P('Requis', 'TableCell'), P('admin', 'TableCell'), P('Non', 'TableCell')],
    [P('/api/audit-logs', 'TableCellLeft'), P('GET', 'TableCell'), P('Requis', 'TableCell'), P('read/admin', 'TableCell'), P('Non', 'TableCell')],
]
story.append(Spacer(1, 12))
story.append(make_table(api_data, col_ratios=[0.22, 0.15, 0.18, 0.20, 0.10]))
story.append(P('Tableau 3 : Inventaire des routes API', 'Caption'))

story.extend(add_subsection('2.3 Points Forts du Backend'))

story.append(P(
    "<b>Import en masse CSV/JSON :</b> La route PUT /api/mesures supporte l'import en masse de mesures "
    "QoS dans deux formats (JSON et CSV) avec validation Zod sur chaque ligne, resolution automatique "
    "des codes operateur/region en IDs, et insertion par lots de 100 elements. Le CSV supporte des "
    "noms de colonnes flexibles (français et anglais) avec tolerance d'erreur par ligne."
))
story.append(P(
    "<b>Audit trail complet :</b> Chaque action d'ecriture (CREATE, UPDATE, LOGIN) est enregistree "
    "dans la table AuditLog avec l'identifiant utilisateur, l'action, la ressource, les details "
    "serialises en JSON, et optionnellement l'adresse IP et le user-agent. Les connexions echouees "
    "sont egalement tracees pour la surveillance de securite."
))
story.append(P(
    "<b>Upsert des scores :</b> La route POST /api/scores utilise Prisma upsert pour creer ou mettre "
    "a jour les scores operateur par periode, evitant les doublons grace a la contrainte unique "
    "operateurId + periode."
))
story.append(P(
    "<b>Sanitisation HTML systematique :</b> Tous les schemas Zod pour les champs texte appliquent "
    "une fonction stripHtml qui supprime les balises HTML, prevenant les attaques XSS dans les "
    "donnees persistees."
))

story.extend(add_subsection('2.4 Problemes Identifies - Backend'))

story.append(P(
    "<b>1. Absence de validation Zod sur les routes GET :</b> Les routes /api/dashboard, /api/qos, "
    "/api/scoring, /api/map, /api/roles et /api/audit-logs n'appliquent pas de validation Zod sur "
    "les parametres de requete (query params). Bien que les parametres soient utilises dans les "
    "filtres Prisma, un utilisateur malveillant pourrait injecter des valeurs inattendues. Par exemple, "
    "le parametre 'limit' dans /api/mesures est correctement clamp (max 5000), mais les parametres "
    "de filtre comme 'operateur' ou 'region' sont directement utilises dans les requetes findFirst "
    "sans validation structuree."
))
story.append(P(
    "<b>2. Donnees simulees en dur :</b> Plusieurs routes API utilisent des valeurs par defaut simulees "
    "lorsque les donnees reelles sont insuffisantes. Par exemple, /api/dashboard ajoute +200 aux zones "
    "blanches comptees (ligne : zonesBlanches + 200), /api/qos utilise des valeurs de disponibilite "
    "hardcodees (99 - 1.9 pour Celcom, etc.), et le score 'innovation' est calcule comme un simple "
    "pourcentage du score QoS. Ces artifices faussent les indicateurs presentes aux decideurs."
))
story.append(P(
    "<b>3. Requetes N+1 potentielles :</b> Dans /api/mesures PUT (import CSV), chaque ligne resout "
    "independamment l'operateur et la region via des findFirst, generant potentiellement des milliers "
    "de requetes pour un import massif. Un cache ou une resolution par lot ameliorerait significativement "
    "les performances."
))
story.append(P(
    "<b>4. Gestion d'erreur insuffisante :</b> Toutes les routes API catchent les erreurs de maniere "
    "generique avec console.error et retournent un message vague 'Erreur serveur'. Aucune differentiation "
    "entre erreurs de validation, erreurs de base de donnees, et erreurs d'authentification interne. "
    "Les logs console.error ne sont pas structures et ne facilitent pas le monitoring en production."
))

# ═══════════════════════════════════════════════════════════════
# 3. INTERFACE FRONTEND
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('3. Interface Frontend'))

story.extend(add_subsection('3.1 Composants et Navigation'))

story.append(P(
    "L'interface utilisateur est organisee autour d'un layout principal (OnitLayout) avec une barre "
    "laterale de navigation, un en-tete avec recherche et notifications, et 9 tableaux de bord "
    "specialises. La navigation est filtrees par role : les onglets 'Cybersecurite' et 'Administration' "
    "ne sont visibles que pour les roles DIRECTEUR_TECHNIQUE+ et SUPER_ADMIN respectivement. L'interface "
    "est sombre (Dark Mode permanent) avec une palette elegante bleu-noir (#0A0F1E) et des accents "
    "dore (#D4A843) correspondant a l'identite visuelle institutionnelle guineenne."
))

dash_data = [
    [P('<b>Tableau de Bord</b>', 'TableHeader'), P('<b>Composant</b>', 'TableHeader'), P('<b>Fonctionnalites</b>', 'TableHeader'), P('<b>Acces</b>', 'TableHeader')],
    [P('Directeur', 'TableCellLeft'), P('DashboardDG', 'TableCell'), P('KPIs, carte, classement operateurs, alertes', 'TableCellLeft'), P('Tous auth', 'TableCell')],
    [P('Monitoring QoS', 'TableCellLeft'), P('DashboardQoS', 'TableCell'), P('Metriques, tendances, benchmark, heatmap', 'TableCellLeft'), P('Tous auth', 'TableCell')],
    [P('Cartographie SIG', 'TableCellLeft'), P('DashboardSIG', 'TableCell'), P('Carte Leaflet, couches, points de mesure', 'TableCellLeft'), P('Tous auth', 'TableCell')],
    [P('Scoring', 'TableCellLeft'), P('DashboardScoring', 'TableCell'), P('Radar, historique, recommandations IA', 'TableCellLeft'), P('Tous auth', 'TableCell')],
    [P('Audit Terrain', 'TableCellLeft'), P('DashboardAudit', 'TableCell'), P('Campagnes, resultats drive test', 'TableCellLeft'), P('Tous auth', 'TableCell')],
    [P('Rapports', 'TableCellLeft'), P('DashboardReports', 'TableCell'), P('Generation, telechargement, planification', 'TableCellLeft'), P('Tous auth', 'TableCell')],
    [P('Portail Public', 'TableCellLeft'), P('DashboardPublic', 'TableCell'), P('KPIs, carte, signalement, FAQ', 'TableCellLeft'), P('Public', 'TableCell')],
    [P('Cybersecurite', 'TableCellLeft'), P('DashboardCyber', 'TableCell'), P('Score securite, RBAC, chiffrement, audit', 'TableCellLeft'), P('Dir. Tech+', 'TableCell')],
    [P('Administration', 'TableCellLeft'), P('DashboardAdmin', 'TableCell'), P('Users, roles, journal audit, systeme', 'TableCellLeft'), P('Super Admin', 'TableCell')],
]
story.append(Spacer(1, 12))
story.append(make_table(dash_data, col_ratios=[0.18, 0.18, 0.40, 0.15]))
story.append(P('Tableau 4 : Inventaire des tableaux de bord', 'Caption'))

story.extend(add_subsection('3.2 Points Forts du Frontend'))

story.append(P(
    "<b>Cartographie Leaflet interactive :</b> Le composant GuineaMapLeaflet affiche une carte "
    "interactive de la Guinee avec des marqueurs par operateur, des polygones de couverture "
    "regionaux, et des couches selectionnables (couverture, heatmap QoS, zones blanches, axes "
    "routiers). Le chargement dynamique est correctement gere avec un composant Inner charge "
    "cote client uniquement."
))
story.append(P(
    "<b>Notifications en temps reel :</b> Le systeme de notifications interroge /api/alerts "
    "toutes les 30 secondes, affiche les alertes non resolues avec un badge compteur, et permet "
    "la resolution en masse. L'interface distingue les severites par couleur et icone."
))
story.append(P(
    "<b>Portail citoyen :</b> Le DashboardPublic offre un acces non authentifie avec des KPIs "
    "de transparence, une carte de couverture, la comparaison des operateurs, un formulaire de "
    "signalement de probleme, et une FAQ. Ce portail repond a l'obligation de transparence "
    "reglementaire de l'ARPT."
))
story.append(P(
    "<b>Administration complete :</b> Le DashboardAdmin permet la gestion des utilisateurs "
    "(creation, activation/desactivation), la visualisation des roles et permissions, la "
    "consultation du journal d'audit, et le suivi de l'etat du systeme. La protection contre "
    "l'auto-desactivation est implementee (un admin ne peut pas desactiver son propre compte)."
))

story.extend(add_subsection('3.3 Problemes Identifies - Frontend'))

story.append(P(
    "<b>1. Telechargement de rapports simule :</b> Le bouton de telechargement dans DashboardReports "
    "genere un fichier texte/CSV basique avec des donnees en dur, et non un vrai rapport PDF avec "
    "les donnees reelles de la base. Le format PDF est declare mais le contenu est texte brut avec "
    "extension .txt. Ceci ne repond pas aux exigences reglementaires d'un rapport officiel."
))
story.append(P(
    "<b>2. Resultats d'audit en dur :</b> Le DashboardAudit contient un tableau auditResults "
    "avec des valeurs codees en dur pour les resultats de test (latence, debit, taux d'appel). "
    "Ces donnees ne sont pas recuperees depuis l'API mais directement ecrites dans le composant, "
    "ce qui signifie qu'elles ne reflettent jamais les donnees reelles."
))
story.append(P(
    "<b>3. Absence de gestion d'erreur utilisateur :</b> Lorsqu'une requete API echoue, les "
    "composants affichent uniquement un message 'Chargement...' ou basculent sur des valeurs "
    "par defaut silencieusement. Aucune notification d'erreur n'est presentee a l'utilisateur "
    "pour les routes de lecture (dashboard, QoS, scoring, map). Seules les operations d'ecriture "
    "utilisent toast.error via Sonner."
))
story.append(P(
    "<b>4. Hydratation et performances :</b> Le composant page.tsx utilise useSyncExternalStore "
    "pour la detection du montage client, ce qui est correct mais inhabituel. Le rechargement "
    "complet de la page apres connexion (window.location.href = '/') est brute et pourrait etre "
    "remplace par un rafraichissement de session plus elegant."
))

# ═══════════════════════════════════════════════════════════════
# 4. AUTHENTIFICATION ET RBAC
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('4. Authentification et RBAC'))

story.extend(add_subsection('4.1 Systeme d\'Authentification'))

story.append(P(
    "L'authentification repose sur NextAuth v4 avec la strategie JWT (maximum 8 heures de session). "
    "Le fournisseur CredentialsProvider utilise bcryptjs (cost factor 12) pour la verification des "
    "mots de passe. Les cookies de session sont correctement configures avec les attributs de "
    "securite : httpOnly, sameSite=lax, et secure en production HTTPS. Le middleware implemente "
    "un rate limiter en memoire (5 tentatives par IP en 15 minutes) avec nettoyage automatique "
    "des entrees expirees. Les en-tetes de securite sont ajoutes a toutes les reponses : "
    "X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy et Permissions-Policy."
))

story.extend(add_subsection('4.2 Modele RBAC'))

story.append(P(
    "Le modele de controle d'acces base sur les roles (RBAC) est implemente avec 9 roles hierarchises "
    "allant de SUPER_ADMIN (acces complet) a PUBLIC (donnees publiques uniquement). Chaque role "
    "possede des permissions granulaires definies par paire ressource:action (ex: campaign:write, "
    "scoring:read, user:admin). Les politiques d'acces aux donnees (RLS - Row Level Security) "
    "sont definies dans la table DataAccessPolicy avec trois scopes : 'all' (toutes les donnees), "
    "'own_region' (donnees de ses regions uniquement), 'own_org' (donnees de son operateur), et "
    "'public_only' (donnees publiques uniquement)."
))

roles_data = [
    [P('<b>Role</b>', 'TableHeader'), P('<b>Priorite</b>', 'TableHeader'), P('<b>Scope RLS</b>', 'TableHeader'), P('<b>Permissions</b>', 'TableHeader')],
    [P('SUPER_ADMIN', 'TableCellLeft'), P('100', 'TableCell'), P('all', 'TableCell'), P('24 permissions', 'TableCell')],
    [P('DG', 'TableCellLeft'), P('90', 'TableCell'), P('all', 'TableCell'), P('12 permissions', 'TableCell')],
    [P('DGA', 'TableCellLeft'), P('80', 'TableCell'), P('all', 'TableCell'), P('11 permissions', 'TableCell')],
    [P('DIRECTEUR_TECHNIQUE', 'TableCellLeft'), P('70', 'TableCell'), P('all', 'TableCell'), P('11 permissions', 'TableCell')],
    [P('INGENIEUR_RF', 'TableCellLeft'), P('60', 'TableCell'), P('own_region', 'TableCell'), P('8 permissions', 'TableCell')],
    [P('ANALYSTE_QOS', 'TableCellLeft'), P('50', 'TableCell'), P('all', 'TableCell'), P('9 permissions', 'TableCell')],
    [P('AUDITEUR', 'TableCellLeft'), P('40', 'TableCell'), P('all', 'TableCell'), P('8 permissions', 'TableCell')],
    [P('OPERATEUR_READONLY', 'TableCellLeft'), P('20', 'TableCell'), P('own_org', 'TableCell'), P('4 permissions', 'TableCell')],
    [P('PUBLIC', 'TableCellLeft'), P('10', 'TableCell'), P('public_only', 'TableCell'), P('2 permissions', 'TableCell')],
]
story.append(Spacer(1, 12))
story.append(make_table(roles_data, col_ratios=[0.30, 0.15, 0.20, 0.25]))
story.append(P('Tableau 5 : Matrice des roles et permissions', 'Caption'))

story.extend(add_subsection('4.3 Problemes Identifies - Auth/RBAC'))

story.append(P(
    "<b>1. Donnees sensibles dans les JWT :</b> Le token JWT contient les permissions completes "
    "de l'utilisateur sous forme de tableau de chaines (resource:action). Avec le role SUPER_ADMIN "
    "et ses 24 permissions, le JWT peut devenir volumineux, depassant potentiellement la limite "
    "de taille des cookies (4 Ko). De plus, les permissions sont figees dans le token a la connexion "
    "et ne sont pas rafraichies si un admin modifie les permissions d'un role pendant la session."
))
story.append(P(
    "<b>2. Pas de changement de mot de passe :</b> L'interface utilisateur offre un bouton "
    "'Changer le mot de passe' dans le menu utilisateur, mais celui-ci ne declenche aucune action. "
    "Il n'existe aucune route API pour le changement de mot de passe, ni de mecanisme de reinitialisation. "
    "Les mots de passe sont definis une seule fois a la creation et ne peuvent jamais etre modifies "
    "par l'utilisateur."
))
story.append(P(
    "<b>3. Comptes demo avec meme mot de passe :</b> Le seed.ts definit le meme mot de passe "
    "'Admin@2026!' pour les 10 comptes utilisateurs. Bien que ce soit acceptable pour un environnement "
    "de demonstration, c'est inacceptable en production. Aucun mecanisme ne force le changement "
    "de mot de passe a la premiere connexion."
))
story.append(P(
    "<b>4. Rate limiter en memoire :</b> Le rate limiter du middleware est stocke en memoire "
    "dans un Map, ce qui signifie qu'il est reinitialise a chaque redemarrage du serveur et ne "
    "peut pas etre partage entre plusieurs instances. En cas de deploiement avec plusieurs "
    "conteneurs, le rate limiting sera inefficace."
))

# ═══════════════════════════════════════════════════════════════
# 5. BASE DE DONNEES
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('5. Base de Donnees'))

story.extend(add_subsection('5.1 Schema Prisma'))

story.append(P(
    "Le modele de donnees Prisma comprend 10 modeles couvrant les domaines metier : Role, Permission, "
    "User, DataAccessPolicy, Operateur, Region, Campagne, MesureQoS, ScoreOperateur, Alerte, Rapport, "
    "AuditLog et Session. Les relations sont correctement definies avec des cles etrangeres et des "
    "contraintes d'unicite (operateurId + periode pour les scores, email pour les utilisateurs, "
    "resource + action + roleId pour les permissions). Le modele MesureQoS est particulierement "
    "riche avec 22 metriques optionnelles couvrant la radio (RSSI, RSRP, RSRQ, SINR), le reseau "
    "(latence, debit, gigue, taux d'appel), Internet (download, upload, ping, DNS, TCP) et "
    "l'experience utilisateur (scoreQoE, pageLoadTime, videoBuffering)."
))

story.extend(add_subsection('5.2 Problemes Critiques - Base de Donnees'))

story.append(P(
    "<b>1. SQLite en production :</b> C'est le probleme le plus critique pour le deploiement en "
    "production. SQLite est une base de donnees fichier mono-utilisateur qui ne supporte pas les "
    "connexions concurrentes en ecriture. En cas d'acces simultane de plusieurs utilisateurs, "
    "la base se verrouille et les ecritures echouent avec SQLITE_BUSY. De plus, SQLite ne "
    "supporte pas le chiffrement au repos (sauf extension SEE payante), ce qui pose un probleme "
    "de conformite pour les donnees personnelles (RGPD/SOA). La migration vers PostgreSQL est "
    "imperative pour la production."
))
story.append(P(
    "<b>2. Absence de migrations :</b> Le projet utilise prisma db push au lieu de prisma migrate "
    "dev pour les changements de schema. Cette approche ne genere pas de fichiers de migration, "
    "rendant impossible le suivi des modifications de schema dans le temps, les retours en "
    "arriere, et la reproduction fiable de la base dans differents environnements. Le Dockerfile "
    "lui-meme execute prisma db push --skip-generate au demarrage, ce qui est risqué car cela "
    "peut modifier le schema de maniere inattendue en production."
))
story.append(P(
    "<b>3. Pas d'index explicites :</b> Malgre les requetes frequentes filtrant par operateurId, "
    "regionId, campagneId et typeMesure dans MesureQoS, aucun index explicite n'est defini dans "
    "le schema Prisma. Les seuls indexes implicites sont ceux des cles primaires et des contraintes "
    "@unique. Avec des milliers de mesures, les performances de requetes se degraderont "
    "significativement sans indexes composes."
))

# ═══════════════════════════════════════════════════════════════
# 6. SECURITE
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('6. Securite'))

story.extend(add_subsection('6.1 Mesures de Securite Existantes'))

story.append(P(
    "La plateforme implemente plusieurs mesures de securite notables. Les en-tetes de securite "
    "HTTP sont configures dans le middleware (X-Content-Type-Options: nosniff, X-Frame-Options: "
    "DENY, X-XSS-Protection: 1; mode=block, Referrer-Policy: strict-origin-when-cross-origin, "
    "Permissions-Policy restrictif). Le rate limiting sur la route de connexion est present avec "
    "5 tentatives maximales par IP en 15 minutes. La sanitisation HTML est systematique via Zod. "
    "Le hashing des mots de passe utilise bcryptjs avec un cost factor de 12. L'en-tete "
    "X-Powered-By est supprime dans next.config.ts pour eviter l'empreinte framework."
))

story.extend(add_subsection('6.2 Vulnerabilites Identifiees'))

story.append(P(
    "<b>1. Route de signalement publique sans limitation :</b> La route POST /api/alerts accepte "
    "des signalements publics (type SIGNALEMENT_PUBLIC) sans authentification ni rate limiting "
    "specifique. Un attaquant pourrait spammer cette route pour inonder la base de donnees "
    "d'alertes fictives, saturant l'equipe de surveillance. Le message est limite a 500 "
    "caracteres, mais aucune limitation de debit n'est appliquee."
))
story.append(P(
    "<b>2. Absence de CSP (Content Security Policy) :</b> Aucun en-tete Content-Security-Policy "
    "n'est defini. Sans CSP, la plateforme est vulnerable aux attaques XSS par injection de "
    "scripts malveillants, malgre la sanitisation HTML cote serveur. Un attaquant sophistique "
    "pourrait contourner les filtres et injecter du JavaScript dans les pages."
))
story.append(P(
    "<b>3. CORS non configure :</b> Aucune configuration CORS n'est visible dans le middleware "
    "ou next.config.ts. Par defaut, Next.js API routes acceptent les requetes de toute origine. "
    "En production avec le reverse proxy Caddy, cela pourrait permettre a des sites tiers "
    "d'appeler les API directement."
))
story.append(P(
    "<b>4. NEXTAUTH_SECRET en .env.example :</b> Le fichier .env.example contient la valeur "
    "'changez-cette-valeur-en-production' pour NEXTAUTH_SECRET. Bien que le code n'ait pas de "
    "valeur par defaut (ce qui est correct), le risque est qu'un operateur deploie la plateforme "
    "avec cette valeur par defaut du fichier .env.example sans la modifier."
))

# ═══════════════════════════════════════════════════════════════
# 7. DEPLOIEMENT ET PRODUCTION
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('7. Deploiement et Production'))

story.extend(add_subsection('7.1 Infrastructure Docker'))

story.append(P(
    "Le Dockerfile utilise un build multi-stage en trois etapes : deps (installation des dependances), "
    "builder (compilation et generation Prisma), et runner (execution en production). Le runner "
    "utilise node:20-alpine, cree un utilisateur non-root (nextjs:nodejs), et expose le port 3000. "
    "Un healthcheck est configure sur /api/auth/session avec un intervalle de 30 secondes. Le "
    "docker-compose.yml definit un service unique avec un volume persistant pour la base de donnees "
    "SQLite et une variable NEXTAUTH_SECRET obligatoire. Le reverse proxy Caddy est configure pour "
    "le port 81 avec transfert des en-tetes de proxy (X-Forwarded-For, X-Real-IP, X-Forwarded-Proto)."
))

story.extend(add_subsection('7.2 Problemes de Production'))

story.append(P(
    "<b>1. prisma db push au demarrage :</b> La commande CMD du Dockerfile execute 'prisma db push "
    "--skip-generate && node server.js'. L'utilisation de db push en production est risque car elle "
    "peut appliquer des modifications de schema de maniere destructive sans confirmation. En cas de "
    "regression de schema, les donnees existantes pourraient etre perdues. Il faudrait utiliser "
    "prisma migrate deploy pour appliquer uniquement les migrations validees."
))
story.append(P(
    "<b>2. Pas de strategy de sauvegarde :</b> Aucun mecanisme de sauvegarde automatique de la "
    "base SQLite n'est configure. Le volume Docker onit-db persiste les donnees entre les "
    "redemarrages, mais il n'y a pas de sauvegarde planifiee, de replication, ou de strategy "
    "de restauration. Une perte de volume signifie une perte totale de donnees."
))
story.append(P(
    "<b>3. Pas de monitoring :</b> Aucune solution de monitoring n'est configuree. Il n'y a ni "
    "logs structures (les erreurs sont envoyees a console.error), ni metriques d'application "
    "(Prometheus/Grafana), ni alerting automatique. Le healthcheck Docker est le seul mecanisme "
    "de surveillance, mais il ne verifie que la disponibilite du serveur, pas la sante de la "
    "base de donnees ou les performances des requetes."
))
story.append(P(
    "<b>4. Pas de HTTPS dans le Dockerfile :</b> Le Dockerfile et docker-compose.yml sont "
    "configures pour HTTP uniquement. La terminaison TLS est supposee etre geree par le reverse "
    "proxy Caddy, mais aucun certificat TLS n'est configure dans le Caddyfile fourni. En "
    "production, Caddy peut generer automatiquement des certificats Let's Encrypt, mais cela "
    "necessite une configuration DNS et une exposition directe a Internet."
))
story.append(P(
    "<b>5. Absence de tests automatises :</b> Le repertoire tests/ contient des modeles de "
    "donnees (CSV, JSON) et un script de test API basique (test_api_endpoints.sh), mais il "
    "n'y a aucun test unitaire, test d'integration, ou test de bout en bout automatisé. Aucun "
    "framework de test (Jest, Vitest, Playwright Test, Cypress) n'est configure dans package.json. "
    "C'est un risque majeur pour la maintenance et l'evolution de la plateforme."
))

# ═══════════════════════════════════════════════════════════════
# 8. RECOMMANDATIONS PRIORITAIRES
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('8. Recommandations Prioritaires'))

story.extend(add_subsection('8.1 Actions Critiques (Bloquantes pour la Production)'))

reco_crit_data = [
    [P('<b>Priorite</b>', 'TableHeader'), P('<b>Action</b>', 'TableHeader'), P('<b>Impact</b>', 'TableHeader'), P('<b>Effort</b>', 'TableHeader')],
    [status_cell('P0', RED), P('Migrer SQLite vers PostgreSQL', 'TableCellLeft'), P('Concurrence, performance, chiffrement', 'TableCellLeft'), P('3-5 jours', 'TableCell')],
    [status_cell('P0', RED), P('Ajouter Content-Security-Policy', 'TableCellLeft'), P('Protection XSS, conformite securite', 'TableCellLeft'), P('0.5 jour', 'TableCell')],
    [status_cell('P0', RED), P('Rate limiter sur POST /api/alerts', 'TableCellLeft'), P('Prevention spam signalements', 'TableCellLeft'), P('0.5 jour', 'TableCell')],
    [status_cell('P0', RED), P('Supprimer donnees en dur dans API', 'TableCellLeft'), P('Fiabilite des indicateurs', 'TableCellLeft'), P('2-3 jours', 'TableCell')],
]
story.append(Spacer(1, 12))
story.append(make_table(reco_crit_data, col_ratios=[0.10, 0.35, 0.35, 0.15]))
story.append(P('Tableau 6 : Actions critiques (P0)', 'Caption'))

story.extend(add_subsection('8.2 Actions Importantes (Avant Mise en Production)'))

reco_imp_data = [
    [P('<b>Priorite</b>', 'TableHeader'), P('<b>Action</b>', 'TableHeader'), P('<b>Impact</b>', 'TableHeader'), P('<b>Effort</b>', 'TableHeader')],
    [status_cell('P1', AMBER), P('Migrer vers prisma migrate deploy', 'TableCellLeft'), P('Reproductibilite des schemas', 'TableCellLeft'), P('1 jour', 'TableCell')],
    [status_cell('P1', AMBER), P('Ajouter indexes Prisma sur MesureQoS', 'TableCellLeft'), P('Performance des requetes', 'TableCellLeft'), P('0.5 jour', 'TableCell')],
    [status_cell('P1', AMBER), P('Implementer changement mot de passe', 'TableCellLeft'), P('Securite des comptes', 'TableCellLeft'), P('1-2 jours', 'TableCell')],
    [status_cell('P1', AMBER), P('Configurer CORS strict', 'TableCellLeft'), P('Prevention attaques cross-origin', 'TableCellLeft'), P('0.5 jour', 'TableCell')],
    [status_cell('P1', AMBER), P('Ajouter logs structures (pino/winston)', 'TableCellLeft'), P('Observabilite en production', 'TableCellLeft'), P('1-2 jours', 'TableCell')],
    [status_cell('P1', AMBER), P('Configurer sauvegardes automatiques', 'TableCellLeft'), P('Resilience des donnees', 'TableCellLeft'), P('1 jour', 'TableCell')],
]
story.append(Spacer(1, 12))
story.append(make_table(reco_imp_data, col_ratios=[0.10, 0.35, 0.35, 0.15]))
story.append(P('Tableau 7 : Actions importantes (P1)', 'Caption'))

story.extend(add_subsection('8.3 Actions Souhaitees (Ameliorations Continues)'))

reco_nice_data = [
    [P('<b>Priorite</b>', 'TableHeader'), P('<b>Action</b>', 'TableHeader'), P('<b>Impact</b>', 'TableHeader'), P('<b>Effort</b>', 'TableHeader')],
    [status_cell('P2', BLUE), P('Ajouter tests unitaires et E2E', 'TableCellLeft'), P('Qualite, maintenance, regression', 'TableCellLeft'), P('5-10 jours', 'TableCell')],
    [status_cell('P2', BLUE), P('Resolution par lot pour imports CSV', 'TableCellLeft'), P('Performance import masse', 'TableCellLeft'), P('1 jour', 'TableCell')],
    [status_cell('P2', BLUE), P('Generation de rapports PDF reels', 'TableCellLeft'), P('Conformite reglementaire', 'TableCellLeft'), P('3-5 jours', 'TableCell')],
    [status_cell('P2', BLUE), P('Monitoring Prometheus/Grafana', 'TableCellLeft'), P('Observabilite avancee', 'TableCellLeft'), P('2-3 jours', 'TableCell')],
    [status_cell('P2', BLUE), P('Internationalisation (i18n)', 'TableCellLeft'), P('Accessibilite multilingue', 'TableCellLeft'), P('2-3 jours', 'TableCell')],
    [status_cell('P2', BLUE), P('Cache Redis pour sessions/rate limiting', 'TableCellLeft'), P('Scalabilite multi-instance', 'TableCellLeft'), P('2 jours', 'TableCell')],
]
story.append(Spacer(1, 12))
story.append(make_table(reco_nice_data, col_ratios=[0.10, 0.35, 0.35, 0.15]))
story.append(P('Tableau 8 : Actions souhaitees (P2)', 'Caption'))

# ═══════════════════════════════════════════════════════════════
# 9. CONCLUSION
# ═══════════════════════════════════════════════════════════════
story.extend(add_major_section('9. Conclusion'))

story.append(P(
    "La plateforme ONIT-PNG constitue une base solide et fonctionnellement riche pour la supervision "
    "des telecommunications en Guinee. L'architecture technique est coherente, le modele RBAC est "
    "bien concu avec des politiques RLS granulaires, et l'interface utilisateur offre une experience "
    "professionnelle avec 9 tableaux de bord specialises. La couverture fonctionnelle est large, "
    "couvrant le monitoring QoS, la cartographie SIG, le scoring des operateurs, l'audit terrain, "
    "la gestion des rapports, le portail citoyen, la cybersecurite et l'administration."
))
story.append(P(
    "Cependant, la plateforme n'est pas encore prete pour un deploiement en production dans son "
    "etat actuel. Les points bloquants principaux sont : (1) l'utilisation de SQLite qui ne supporte "
    "pas la concurrence en ecriture, (2) l'absence de Content-Security-Policy, (3) les donnees "
    "simulees en dur qui faussent les indicateurs, et (4) le manque de tests automatises. Ces "
    "problemes doivent etre resolus en priorite avant toute mise en production. Les recommandations "
    "P0 representent environ 6-9 jours de travail, les P1 environ 5-7 jours, et les P2 environ "
    "15-23 jours. Avec un investissement de 2 a 3 semaines supplementaires, la plateforme pourrait "
    "atteindre un niveau de maturite production-ready conforme aux exigences reglementaires de l'ARPT."
))

# ═══ BUILD ═══
doc.multiBuild(story)
print(f"PDF generated: {output_path}")
