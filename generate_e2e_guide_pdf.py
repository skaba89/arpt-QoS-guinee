#!/usr/bin/env python3
"""
ONIT-PNG — Guide Complet des Tests End-to-End
Génère un PDF documentant tous les scénarios de test E2E
pour la plateforme ONIT-PNG en conditions réelles de production.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ============================================================================
# CONFIGURATION
# ============================================================================
OUTPUT_DIR = "/home/z/my-project/download"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "ONIT-PNG_Guide_Tests_E2E_Production.pdf")

# Palette
ACCENT       = colors.HexColor('#3194b5')
TEXT_PRIMARY  = colors.HexColor('#1c1b19')
TEXT_MUTED    = colors.HexColor('#848077')
BG_SURFACE   = colors.HexColor('#e3e1dd')
BG_PAGE      = colors.HexColor('#f6f5f2')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# Fonts
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans', '/usr/share/fonts/truetype/chinese/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerif', '/usr/share/fonts/truetype/chinese/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationMono', '/usr/share/fonts/truetype/chinese/LiberationMono-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSCBold')
registerFontFamily('LiberationSans', normal='LiberationSans', bold='LiberationSans')
registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerif')
registerFontFamily('LiberationMono', normal='LiberationMono', bold='LiberationMono')

# ============================================================================
# STYLES
# ============================================================================
PAGE_W, PAGE_H = A4
LEFT_M = 1.2 * inch
RIGHT_M = 1.2 * inch
TOP_M = 1.0 * inch
BOTTOM_M = 1.0 * inch
CONTENT_W = PAGE_W - LEFT_M - RIGHT_M

body_style = ParagraphStyle(
    name='Body', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    alignment=TA_LEFT, wordWrap='CJK', spaceAfter=6,
    textColor=TEXT_PRIMARY,
)
body_en = ParagraphStyle(
    name='BodyEN', fontName='LiberationSerif', fontSize=10.5, leading=18,
    alignment=TA_LEFT, spaceAfter=6, textColor=TEXT_PRIMARY,
)
h1_style = ParagraphStyle(
    name='H1', fontName='NotoSerifSC', fontSize=20, leading=28,
    alignment=TA_LEFT, spaceBefore=18, spaceAfter=12,
    textColor=ACCENT,
)
h2_style = ParagraphStyle(
    name='H2', fontName='NotoSerifSC', fontSize=15, leading=22,
    alignment=TA_LEFT, spaceBefore=14, spaceAfter=8,
    textColor=TEXT_PRIMARY,
)
h3_style = ParagraphStyle(
    name='H3', fontName='NotoSerifSC', fontSize=12, leading=18,
    alignment=TA_LEFT, spaceBefore=10, spaceAfter=6,
    textColor=TEXT_PRIMARY,
)
code_style = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=8.5, leading=13,
    alignment=TA_LEFT, spaceAfter=4, leftIndent=12,
    textColor=TEXT_MUTED, backColor=colors.HexColor('#f5f5f5'),
)
header_cell = ParagraphStyle(
    name='HeaderCell', fontName='NotoSerifSC', fontSize=9.5, leading=14,
    alignment=TA_CENTER, textColor=TABLE_HEADER_TEXT,
)
cell_style = ParagraphStyle(
    name='Cell', fontName='NotoSerifSC', fontSize=9, leading=13,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, wordWrap='CJK',
)
cell_center = ParagraphStyle(
    name='CellCenter', fontName='NotoSerifSC', fontSize=9, leading=13,
    alignment=TA_CENTER, textColor=TEXT_PRIMARY,
)
caption_style = ParagraphStyle(
    name='Caption', fontName='NotoSerifSC', fontSize=9, leading=14,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceBefore=3, spaceAfter=6,
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    alignment=TA_LEFT, wordWrap='CJK', spaceAfter=4,
    leftIndent=20, bulletIndent=8, bulletFontSize=10,
    textColor=TEXT_PRIMARY,
)

def P(text, style=body_style):
    return Paragraph(text, style)

def make_table(headers, rows, col_ratios=None):
    """Create a styled table with proper Paragraph wrapping."""
    if col_ratios is None:
        col_ratios = [1.0 / len(headers)] * len(headers)
    col_widths = [r * CONTENT_W for r in col_ratios]

    data = []
    header_row = [Paragraph('<b>{}</b>'.format(h), header_cell) for h in headers]
    data.append(header_row)
    for row in rows:
        data.append([Paragraph(str(c), cell_style) for c in row])

    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


# ============================================================================
# DOCUMENT CONTENT
# ============================================================================
story = []

# --- TOC ---
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle(name='TOC1', fontName='NotoSerifSC', fontSize=13, leftIndent=20, leading=22, spaceBefore=6, spaceAfter=3, textColor=TEXT_PRIMARY),
    ParagraphStyle(name='TOC2', fontName='NotoSerifSC', fontSize=11, leftIndent=40, leading=18, spaceBefore=3, spaceAfter=2, textColor=TEXT_MUTED),
]
story.append(P('<b>Table des matieres</b>', h1_style))
story.append(toc)
story.append(PageBreak())

# ============================================================================
# SECTION 1: Introduction
# ============================================================================
story.append(P('<b>1. Introduction et objectifs des tests E2E</b>', h1_style))

story.append(P(
    "Ce document constitue le guide complet des tests end-to-end (E2E) de la plateforme "
    "ONIT-PNG (Observatoire National Intelligent des Telecommunications - Plateforme Nationale "
    "de Supervision) developpee pour l'ARPT (Autorite de Regulation des Postes et Telecommunications) "
    "de la Republique de Guinee. L'objectif principal de ces tests est de simuler des scenarios reels "
    "d'utilisation en production, comme si un operateur, un analyste, un prestataire ou un citoyen "
    "utilisait l'application au quotidien. Chaque scenario couvre un flux complet de bout en bout, "
    "depuis l'authentification jusqu'a la verification finale des donnees en passant par toutes les "
    "etapes intermediaires.", body_style))

story.append(P(
    "Les tests E2E de production different des tests unitaires ou d'integration classiques car ils "
    "valident le fonctionnement complet du systeme dans des conditions proches de la realite. Cela "
    "inclut les flux de donnees entre les differents composants (authentification, API, base de donnees, "
    "interface utilisateur), les controles d'acces base sur les roles (RBAC), la securite au niveau "
    "des lignes de donnees (RLS), et les interactions reelles avec les fichiers CSV et JSON pour "
    "l'import de mesures QoS. Ce guide detaille egalement les liens API que les prestataires "
    "peuvent utiliser pour remonter automatiquement des donnees vers la plateforme.", body_style))

story.append(P('<b>1.1 Stack technique testee</b>', h2_style))
story.append(make_table(
    ['Composant', 'Technologie', 'Version'],
    [
        ['Framework', 'Next.js (App Router + Turbopack)', '16.1.3'],
        ['ORM', 'Prisma + SQLite', '6.11.1'],
        ['Authentification', 'NextAuth v4 (JWT)', '4.x'],
        ['Tests E2E', 'Playwright', '1.60.0'],
        ['Cartographie', 'Leaflet.js + react-leaflet', '1.9.4 / 5.0.0'],
        ['Graphiques', 'Recharts', '2.15.4'],
        ['Validation', 'Zod', '4.0.2'],
        ['UI', 'shadcn/ui + Tailwind CSS 4', 'Latest'],
    ],
    col_ratios=[0.25, 0.50, 0.25]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 2: Comptes de test
# ============================================================================
story.append(P('<b>2. Comptes de test et identification</b>', h1_style))

story.append(P(
    "Tous les comptes de test partagent le meme mot de passe par defaut : <b>Admin@2026!</b>. "
    "Ces comptes sont crees par le script de seeding (prisma/seed.ts) et representent les differents "
    "roles de la plateforme. Chaque role dispose de permissions specifiques qui determinent les "
    "fonctionnalites accessibles via l'interface et les API. Il est essentiel de tester chaque role "
    "pour verifier que le controle d'acces RBAC fonctionne correctement et que chaque utilisateur "
    "ne peut acceder qu'aux donnees et actions autorisees par son profil.", body_style))

story.append(make_table(
    ['Email', 'Role', 'Organisation', 'Acces'],
    [
        ['admin@arpt.gn', 'SUPER_ADMIN', 'ARPT', 'Total (lecture + ecriture + admin)'],
        ['dg@arpt.gn', 'DG', 'ARPT', 'Dashboard + rapports + scoring + audit'],
        ['dga@arpt.gn', 'DGA', 'ARPT', 'Dashboard + rapports + scoring'],
        ['dir.tech@arpt.gn', 'DIRECTEUR_TECHNIQUE', 'ARPT', 'QoS + SIG + cyber + mesures'],
        ['ing.rf@arpt.gn', 'INGENIEUR_RF', 'ARPT', 'Mesures + campagnes + SIG'],
        ['analyste@arpt.gn', 'ANALYSTE_QOS', 'ARPT', 'Mesures + rapports + alertes'],
        ['auditeur@arpt.gn', 'AUDITEUR', 'ARPT', 'Lecture mesures + campagnes'],
        ['tech@orange.gn', 'OPERATEUR_READONLY', 'Orange Guinee', 'Lecture ses donnees uniquement'],
        ['tech@mtn.gn', 'OPERATEUR_READONLY', 'MTN Guinee', 'Lecture ses donnees uniquement'],
        ['tech@celcom.gn', 'OPERATEUR_READONLY', 'Celcom Guinee', 'Lecture ses donnees uniquement'],
    ],
    col_ratios=[0.25, 0.20, 0.20, 0.35]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 3: Scenarios de test E2E
# ============================================================================
story.append(P('<b>3. Scenarios de test en conditions reelles</b>', h1_style))

story.append(P(
    "Chaque scenario ci-dessous simule un cas d'utilisation reel de la plateforme. Les etapes "
    "sont ordonnees chronologiquement et doivent etre executees sequentiellement pour reproduire "
    "le flux complet. Les resultats attendus sont indiques pour chaque etape afin de valider "
    "le bon fonctionnement du systeme.", body_style))

# Scenario 1
story.append(P('<b>3.1 Scenario 1 : Operateur Orange consulte ses donnees</b>', h2_style))
story.append(P(
    "Ce scenario simule un technicien d'Orange Guinee qui se connecte a la plateforme pour "
    "consulter les donnees de qualite de service de son operateur. L'operateur a un acces en "
    "lecture seule : il peut voir ses mesures, ses campagnes et ses scores, mais ne peut ni "
    "creer de nouvelles donnees ni modifier les existantes. Ce test valide le fonctionnement "
    "du controle d'acces RBAC et la securite au niveau des lignes de donnees (RLS) qui filtre "
    "automatiquement les donnees pour ne montrer que celles de l'operateur authentifie.", body_style))

story.append(make_table(
    ['Etape', 'Action', 'Endpoint / UI', 'Resultat attendu'],
    [
        ['1', 'Connexion avec tech@orange.gn', 'POST /api/auth/callback/credentials', 'Session JWT creee (200 ou 302)'],
        ['2', 'Consulter le dashboard', 'GET /api/dashboard', '200 - KPIs visibles'],
        ['3', 'Lister ses mesures', 'GET /api/mesures?operateur=ORG', '200 - Mesures ORG uniquement'],
        ['4', 'Lister ses campagnes', 'GET /api/campaigns?operateurCode=ORG', '200 - Campagnes ORG uniquement'],
        ['5', 'Consulter ses scores', 'GET /api/scores?operateur=ORG', '200 - Scores ORG'],
        ['6', 'Tenter acces utilisateurs', 'GET /api/users', '403 - Interdit'],
        ['7', 'Tenter creation mesure', 'POST /api/mesures', '403 - Interdit (readonly)'],
    ],
    col_ratios=[0.06, 0.28, 0.30, 0.36]
))
story.append(Spacer(1, 12))

# Scenario 2
story.append(P('<b>3.2 Scenario 2 : Analyste ARPT importe des donnees de campagne</b>', h2_style))
story.append(P(
    "L'analyste QoS de l'ARPT cree une campagne de mesure, puis importe les donnees collectees "
    "par les equipes terrain via un fichier CSV. Ce scenario valide le flux complet d'import de "
    "donnees : authentification, recuperation des IDs de reference, creation de campagne, import "
    "CSV en masse, et verification des donnees importees. C'est un des flux les plus critiques "
    "de la plateforme car il constitue la porte d'entree principale des donnees de qualite de "
    "service remontees par les prestataires de mesure sur le terrain.", body_style))

story.append(make_table(
    ['Etape', 'Action', 'Endpoint', 'Resultat attendu'],
    [
        ['1', 'Connexion analyste QoS', 'POST /api/auth/callback/credentials', 'Session validee'],
        ['2', 'Recuperer IDs operateur/region', 'GET /api/dashboard', '200 - operateurs + regions'],
        ['3', 'Lister les campagnes', 'GET /api/campaigns', '200 - Liste des campagnes'],
        ['4', 'Importer mesures CSV', 'PUT /api/mesures?campagneId=XXX', '201 - inserted > 0'],
        ['5', 'Verifier les mesures', 'GET /api/mesures?limit=5', '200 - Mesures importees'],
    ],
    col_ratios=[0.06, 0.28, 0.32, 0.34]
))
story.append(Spacer(1, 12))

# Scenario 3
story.append(P('<b>3.3 Scenario 3 : Citoyen signale un probleme reseau</b>', h2_style))
story.append(P(
    "Un citoyen guineen signale un probleme de reseau via le portail public sans authentification. "
    "Ce scenario valide le mecanisme de signalement public, qui est une fonctionnalite cle de la "
    "plateforme pour permettre a la population de remonter les problemes de couverture. L'alerte "
    "creee est automatiquement de type SIGNALEMENT_PUBLIC et ne necessite aucune authentification. "
    "En revanche, les autres types d'alertes (DEGRADATION, SEUIL_DEPASSE, etc.) requierent une "
    "authentification, ce qui est egalement verifie dans ce scenario.", body_style))

story.append(make_table(
    ['Etape', 'Action', 'Endpoint', 'Resultat attendu'],
    [
        ['1', 'Acces dashboard public', 'GET /api/dashboard (sans auth)', '200 - KPIs publics'],
        ['2', 'Consulter rapports publics', 'GET /api/reports (sans auth)', '200 - Rapports isPublic=true'],
        ['3', 'Signaler probleme reseau', 'POST /api/alerts (type=SIGNALEMENT_PUBLIC)', '201 - Alerte creee'],
        ['4', 'Verifier signalement visible', 'Verification via compte admin', 'Alerte presente, non resolue'],
        ['5', 'Tenter alerte non publique', 'POST /api/alerts (type=DEGRADATION)', '401 - Non autorise'],
    ],
    col_ratios=[0.06, 0.28, 0.34, 0.32]
))
story.append(Spacer(1, 12))

# Scenario 4
story.append(P('<b>3.4 Scenario 4 : Super Admin gere une alerte critique bout en bout</b>', h2_style))
story.append(P(
    "Le Super Admin detecte une alerte critique de degradation reseau, la cree manuellement "
    "dans le systeme, verifie sa presence dans les alertes non resolues, consulte le journal "
    "d'audit pour tracer l'action, puis resout l'alerte apres intervention technique. Ce scenario "
    "valide le cycle de vie complet d'une alerte et la tracabilite des actions dans le journal d'audit, "
    "qui est une exigence reglementaire pour l'ARPT.", body_style))

story.append(make_table(
    ['Etape', 'Action', 'Endpoint', 'Resultat attendu'],
    [
        ['1', 'Connexion Super Admin', 'POST /api/auth/callback/credentials', 'Session admin validee'],
        ['2', 'Creer alerte critique', 'POST /api/alerts (CRITIQUE)', '201 - Alerte creee, isResolved=false'],
        ['3', 'Verifier dans alertes actives', 'GET /api/alerts?isResolved=false', 'Alerte presente'],
        ['4', 'Verifier audit log', 'GET /api/audit-logs', '200 - Log de creation present'],
        ['5', 'Resoudre l\'alerte', 'PATCH /api/alerts (isResolved=true)', '200 - resolvedAt renseigne'],
        ['6', 'Verifier resolution', 'GET /api/alerts?isResolved=true', 'Alerte resolue confirmee'],
    ],
    col_ratios=[0.06, 0.26, 0.34, 0.34]
))
story.append(Spacer(1, 12))

# Scenario 5
story.append(P('<b>3.5 Scenario 5 : Prestataire importe des donnees QoS en masse (JSON)</b>', h2_style))
story.append(P(
    "Un prestataire externe envoie un grand volume de mesures QoS via l'API en utilisant le format "
    "JSON. Ce scenario simule l'integration automatique d'un systeme d'information tiers qui pousse "
    "des donnees de campagne vers la plateforme ONIT-PNG. Le prestataire doit d'abord s'authentifier, "
    "recuperer l'ID d'une campagne existante, puis envoyer les mesures en masse. Apres l'import, "
    "il verifie que les donnees sont correctement accessibles via les filtres par operateur et par "
    "region.", body_style))

story.append(make_table(
    ['Etape', 'Action', 'Endpoint', 'Resultat attendu'],
    [
        ['1', 'Authentification prestataire', 'POST /api/auth/callback/credentials', 'Session validee'],
        ['2', 'Recuperer campagne ID', 'GET /api/campaigns', '200 - campaignId obtenu'],
        ['3', 'Import JSON (10+ mesures)', 'PUT /api/mesures (application/json)', '201 - inserted = N'],
        ['4', 'Verifier par operateur', 'GET /api/mesures?operateur=ORG', 'Mesures ORG presentes'],
        ['5', 'Verifier par region', 'GET /api/mesures?region=CKY', 'Mesures CKY presentes'],
    ],
    col_ratios=[0.06, 0.28, 0.34, 0.32]
))
story.append(Spacer(1, 12))

# Scenario 6
story.append(P('<b>3.6 Scenario 6 : Directeur General consulte le dashboard et genere un rapport</b>', h2_style))
story.append(P(
    "Le Directeur General de l'ARPT se connecte pour consulter les KPIs nationaux, examiner "
    "le scoring des operateurs, verifier les metriques QoS detaillees et les alertes actives, "
    "puis cree un rapport reglementaire trimestriel. Ce scenario represente l'utilisation "
    "quotidienne de la plateforme par la direction pour le suivi operationnel et la production "
    "de rapports officiels destines aux autorites de regulation et aux operateurs.", body_style))

story.append(make_table(
    ['Etape', 'Action', 'Endpoint', 'Resultat attendu'],
    [
        ['1', 'Connexion DG', 'POST /api/auth/callback/credentials', 'Session DG validee'],
        ['2', 'Consulter KPIs nationaux', 'GET /api/dashboard', '200 - KPIs + 3 operateurs'],
        ['3', 'Consulter scoring operateurs', 'GET /api/scoring', '200 - Classement operateurs'],
        ['4', 'Consulter metriques QoS', 'GET /api/qos', '200 - Metriques detaillees'],
        ['5', 'Consulter alertes actives', 'GET /api/alerts?isResolved=false', '200 - Liste alertes'],
        ['6', 'Lister rapports existants', 'GET /api/reports', '200 - Liste rapports'],
        ['7', 'Creer rapport reglementaire', 'POST /api/reports', '201 - Rapport cree'],
        ['8', 'Consulter journal audit', 'GET /api/audit-logs', '200 - Logs tracabilite'],
    ],
    col_ratios=[0.06, 0.28, 0.30, 0.36]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 4: API Prestataires
# ============================================================================
story.append(P('<b>4. API pour les prestataires - Liens et integration</b>', h1_style))

story.append(P(
    "Cette section documente tous les endpoints API disponibles pour les prestataires et operateurs "
    "qui souhaitent remonter automatiquement des donnees vers la plateforme ONIT-PNG. Chaque endpoint "
    "est accompagne de la methode HTTP, du format attendu, des permissions requises et d'un exemple "
    "d'utilisation avec curl. Les prestataires doivent d'abord s'authentifier via l'endpoint NextAuth "
    "pour obtenir un cookie de session JWT, puis inclure ce cookie dans toutes les requetes suivantes.", body_style))

story.append(P('<b>4.1 Authentification</b>', h2_style))
story.append(P(
    "Tous les prestataires doivent s'authentifier avant d'appeler les API protegees. L'authentification "
    "utilise le fournisseur NextAuth Credentials avec un email et un mot de passe. En retour, un cookie "
    "de session JWT est emis avec une duree de validite de 8 heures. Ce cookie doit etre conserve et "
    "inclus dans toutes les requetes subsequentes via l'en-tete Cookie ou l'option -b de curl.", body_style))

story.append(P(
    '<b>POST /api/auth/callback/credentials</b>', code_style))
story.append(P(
    'curl -X POST "http://SERVEUR:3000/api/auth/callback/credentials" -H "Content-Type: application/x-www-form-urlencoded" '
    '-d "email=admin@arpt.gn&amp;password=Admin@2026!&amp;callbackUrl=http://localhost:3000&amp;json=true" -c cookies.txt -L', code_style))
story.append(Spacer(1, 8))

story.append(P('<b>4.2 Envoi de mesures QoS</b>', h2_style))
story.append(P(
    "L'endpoint de mesures est le point d'entree principal pour les prestataires. Il supporte trois "
    "modes d'utilisation : la creation d'une mesure unique (POST), l'import en masse au format JSON "
    "(PUT), et l'import en masse au format CSV (PUT). Le format JSON est recommande pour les gros "
    "volumes car il permet d'inclure le campagneId dans le corps de la requete, tandis que le format "
    "CSV necessite de passer le campagneId en parametre de requete.", body_style))

story.append(make_table(
    ['Methode', 'Endpoint', 'Content-Type', 'Usage', 'Permission'],
    [
        ['POST', '/api/mesures', 'application/json', 'Mesure unique', 'campaign:write'],
        ['PUT', '/api/mesures', 'application/json', 'Import JSON masse', 'campaign:write'],
        ['PUT', '/api/mesures?campagneId=X', 'text/csv', 'Import CSV masse', 'campaign:write'],
        ['GET', '/api/mesures', '-', 'Lister (filtre)', 'Authentifie'],
    ],
    col_ratios=[0.10, 0.25, 0.20, 0.20, 0.25]
))
story.append(Spacer(1, 12))

story.append(P('<b>4.3 Gestion des alertes</b>', h2_style))
story.append(P(
    "Les prestataires et systemes de monitoring peuvent creer des alertes pour signaler des "
    "problemes detectes. Le type SIGNALEMENT_PUBLIC ne necessite pas d'authentification, ce qui "
    "permet aux applications citoyennes de signaler des pannes. Les autres types d'alertes "
    "requierent une authentification et les permissions appropriees.", body_style))

story.append(make_table(
    ['Methode', 'Endpoint', 'Usage', 'Auth requise'],
    [
        ['POST', '/api/alerts', 'Creer une alerte', 'Oui (sauf SIGNALEMENT_PUBLIC)'],
        ['PATCH', '/api/alerts', 'Resoudre/rouvrir', 'Oui (alert:write)'],
        ['GET', '/api/alerts', 'Lister (filtre)', 'Oui'],
    ],
    col_ratios=[0.12, 0.25, 0.35, 0.28]
))
story.append(Spacer(1, 12))

story.append(P('<b>4.4 Mise a jour des scores operateurs</b>', h2_style))
story.append(P(
    "Le systeme de scoring automatique ou les analystes ARPT mettent a jour les scores de chaque "
    "operateur par periode trimestrielle. L'endpoint utilise un mecanisme d'upsert : si un score "
    "existe deja pour le couple operateurId + periode, il est mis a jour ; sinon, un nouveau score "
    "est cree. Tous les scores doivent etre compris entre 0 et 100.", body_style))

story.append(P(
    '<b>POST /api/scores</b> (upsert)', code_style))
story.append(P(
    'curl -X POST "http://SERVEUR:3000/api/scores" -b cookies.txt -H "Content-Type: application/json" '
    '-d \'{"operatorCode":"ORG","periode":"2026-Q2","scoreGlobal":78,"scoreCouverture":82,'
    '"scoreQoS":75,"scoreQoE":78,"scoreConformite":90}\'', code_style))
story.append(Spacer(1, 8))

story.append(P('<b>4.5 Campagnes de mesure</b>', h2_style))
story.append(P(
    "Les prestataires peuvent consulter les campagnes existantes pour obtenir les IDs necessaires "
    "a l'import de mesures. La creation de nouvelles campagnes est reservee aux roles disposant "
    "de la permission campaign:write. Les statuts valides sont : PLANIFIEE, EN_COURS, TERMINEE, "
    "ANNULEE. L'import de mesures dans une campagne planifiee declenche automatiquement le passage "
    "au statut EN_COURS.", body_style))

story.append(make_table(
    ['Methode', 'Endpoint', 'Usage', 'Permission'],
    [
        ['GET', '/api/campaigns', 'Lister les campagnes', 'Authentifie'],
        ['POST', '/api/campaigns', 'Creer une campagne', 'campaign:write'],
        ['PATCH', '/api/campaigns', 'Modifier le statut', 'campaign:write'],
    ],
    col_ratios=[0.12, 0.25, 0.33, 0.30]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 5: Fichiers de test
# ============================================================================
story.append(P('<b>5. Fichiers de donnees de test disponibles</b>', h1_style))

story.append(P(
    "Plusieurs fichiers de donnees de test sont fournis dans le repertoire e2e/fixtures/ pour "
    "faciliter les tests manuels et automatises. Ces fichiers contiennent des donnees realistes "
    "couvrant les trois operateurs (Orange, MTN, Celcom) dans les huit regions administratives "
    "de Guinee, avec des valeurs de metriques QoS representatives des conditions reelles.", body_style))

story.append(make_table(
    ['Fichier', 'Format', 'Contenu', 'Utilisation'],
    [
        ['test-data.ts', 'TypeScript', 'Comptes, codes, payloads', 'Reference pour tous les tests'],
        ['production-mesures-import.json', 'JSON', '19 mesures realistes multi-operateurs', 'PUT /api/mesures (JSON)'],
        ['production-drive-test-conakry-q2-2026.csv', 'CSV', '40 mesures drive test complet', 'PUT /api/mesures (CSV)'],
        ['sample-mesures-import.json', 'JSON', '4 mesures echantillon', 'Tests basiques'],
        ['sample-mesures-import.csv', 'CSV', '10 mesures echantillon', 'Tests basiques'],
        ['api-prestataires-curl.sh', 'Shell', 'Commandes curl completes', 'Tests manuels API'],
    ],
    col_ratios=[0.32, 0.10, 0.30, 0.28]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 6: Codes de reference
# ============================================================================
story.append(P('<b>6. Codes de reference et nomenclature</b>', h1_style))

story.append(P('<b>6.1 Codes operateurs</b>', h2_style))
story.append(make_table(
    ['Code', 'Operateur', 'Couleur', 'Type'],
    [
        ['ORG', 'Orange Guinee', '#FF7900', 'Mobile + Internet'],
        ['MTN', 'MTN Guinee', '#FFCC00', 'Mobile + Internet'],
        ['CEL', 'Celcom Guinee', '#00B4D8', 'Mobile + Internet'],
    ],
    col_ratios=[0.15, 0.30, 0.20, 0.35]
))
story.append(Spacer(1, 10))

story.append(P('<b>6.2 Codes regions</b>', h2_style))
story.append(make_table(
    ['Code', 'Region', 'Latitude', 'Longitude'],
    [
        ['CKY', 'Conakry', '9.5092', '-13.7122'],
        ['KND', 'Kindia', '10.0580', '-12.8600'],
        ['BOK', 'Boke', '10.9333', '-14.3000'],
        ['LAB', 'Labe', '11.3167', '-12.5000'],
        ['MAM', 'Mamou', '10.5000', '-12.0833'],
        ['FRN', 'Faranah', '10.0333', '-10.7333'],
        ['KNK', 'Kankan', '10.3833', '-9.3000'],
        ['NZR', 'N\'Zerekore', '7.7500', '-8.8167'],
    ],
    col_ratios=[0.15, 0.30, 0.275, 0.275]
))
story.append(Spacer(1, 10))

story.append(P('<b>6.3 Types de mesures et alertes</b>', h2_style))
story.append(make_table(
    ['Categorie', 'Valeurs possibles'],
    [
        ['Types de mesure', 'MOBILE, INTERNET, RF_DRIVE, WALK_TEST'],
        ['Types d\'alerte', 'DEGRADATION, SEUIL_DEPASSE, NON_CONFORMITE, ZONE_BLANCHE, SIGNALEMENT_PUBLIC'],
        ['Severites', 'CRITIQUE, HAUTE, MOYENNE, BASSE'],
        ['Statuts campagne', 'PLANIFIEE, EN_COURS, TERMINEE, ANNULEE'],
        ['Statuts rapport', 'PLANIFIE, EN_COURS, GENERE, PUBLIE, ARCHIVE'],
        ['Types campagne', 'DRIVE_TEST, WALK_TEST, QOS_INTERNET, QOS_MOBILE'],
        ['Types rapport', 'REGLEMENTAIRE, OPERATEUR, PUBLIC, INTERNE, BENCHMARK'],
    ],
    col_ratios=[0.30, 0.70]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 7: Plages de validation
# ============================================================================
story.append(P('<b>7. Regles de validation des donnees QoS</b>', h1_style))

story.append(P(
    "L'API de mesures applique des regles de validation strictes sur les valeurs soumises. Toute "
    "valeur hors plage est rejetee avec un code 400 et un message d'erreur detaille. Les plages "
    "sont calibrees sur les standards de l'ITU-T et les specifications 3GPP pour les reseaux "
    "mobiles 2G/3G/4G/5G. Il est essentiel que les prestataires respectent ces plages pour que "
    "les donnees soient acceptees par la plateforme.", body_style))

story.append(make_table(
    ['Metrique', 'Unite', 'Min', 'Max', 'Exemple'],
    [
        ['RSSI', 'dBm', '-150', '-30', '-72'],
        ['RSRP', 'dBm', '-140', '-44', '-90'],
        ['RSRQ', 'dB', '-20', '-3', '-9'],
        ['SINR', 'dB', '-20', '30', '14'],
        ['Latence', 'ms', '0', '5000', '38'],
        ['Debit descendant', 'Mbps', '0', '1000', '28'],
        ['Debit montant', 'Mbps', '0', '500', '9'],
        ['Gigue', 'ms', '0', '1000', '4'],
        ['Taux appel reussi', '%', '0', '100', '98'],
        ['Taux drop call', '%', '0', '100', '1'],
        ['Score QoE', '/100', '0', '100', '86'],
        ['Page load time', 'ms', '0', '30000', '1000'],
        ['Video buffering', 's', '0', '60', '0.3'],
    ],
    col_ratios=[0.22, 0.12, 0.12, 0.12, 0.12, 0.30]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 8: Commandes pour executer les tests
# ============================================================================
story.append(P('<b>8. Execution des tests E2E</b>', h1_style))

story.append(P('<b>8.1 Configuration Playwright</b>', h2_style))
story.append(P(
    "Les tests E2E sont configures via le fichier playwright.config.ts a la racine du projet. "
    "La configuration utilise un seul worker (workers: 1) pour eviter les conflits avec la base "
    "SQLite, et execute les tests en mode sequentiel (fullyParallel: false). Le serveur de "
    "developpement est lance automatiquement avant les tests et utilise le port 3000.", body_style))

story.append(P('<b>8.2 Commandes d\'execution</b>', h2_style))
story.append(make_table(
    ['Commande', 'Description'],
    [
        ['npm run test:e2e', 'Execute tous les tests E2E en mode headless'],
        ['npm run test:e2e:headed', 'Execute les tests avec navigateur visible'],
        ['npm run test:e2e:ui', 'Interface graphique Playwright pour debug'],
        ['npm run test:e2e:report', 'Ouvre le rapport HTML des derniers tests'],
        ['npx playwright test e2e/auth.spec.ts', 'Execute uniquement les tests d\'authentification'],
        ['npx playwright test e2e/production-scenarios.spec.ts', 'Execute les scenarios de production'],
        ['npx playwright test e2e/prestataire-api.spec.ts', 'Execute les tests API prestataires'],
    ],
    col_ratios=[0.55, 0.45]
))
story.append(Spacer(1, 12))

story.append(P('<b>8.3 Structure des fichiers de test</b>', h2_style))
story.append(make_table(
    ['Fichier', 'Tests', 'Couverture'],
    [
        ['auth.spec.ts', '7', 'Connexion, echec, session, health check'],
        ['rbac.spec.ts', '~25', 'Matrice d\'acces par role (SUPER_ADMIN, OPERATEUR, ANALYSTE, Public)'],
        ['api-mesures.spec.ts', '~15', 'CRUD mesures, import JSON/CSV, validation, pagination'],
        ['api-campaigns.spec.ts', '~12', 'CRUD campagnes, filtrage, statuts, RBAC'],
        ['api-alerts.spec.ts', '~14', 'CRUD alertes, signalement public, resolution, RBAC'],
        ['api-reports.spec.ts', '~12', 'CRUD rapports, acces public/prive, statuts'],
        ['api-users-roles-scores.spec.ts', '~25', 'CRUD utilisateurs, roles, permissions, scores upsert'],
        ['api-dashboard-map.spec.ts', '~8', 'Dashboard KPIs, carte, QoS, scoring, audit'],
        ['ui-navigation.spec.ts', '7', 'Navigation, login modal, onglets, responsive'],
        ['ui-map.spec.ts', '4', 'Carte Leaflet, CNT toggle, polygones, zoom'],
        ['production-scenarios.spec.ts', '~40', '8 scenarios de production complets'],
        ['prestataire-api.spec.ts', '~30', '6 scenarios integration prestataires'],
    ],
    col_ratios=[0.32, 0.08, 0.60]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 9: Flux de donnees prestataires
# ============================================================================
story.append(P('<b>9. Flux de donnees complet - Du prestataire au dashboard</b>', h1_style))

story.append(P(
    "Le schema ci-dessous decrit le flux de donnees complet depuis la collecte sur le terrain "
    "par un prestataire jusqu'a l'affichage sur le dashboard du Directeur General. Ce flux "
    "comprend les etapes de collecte, d'import, de validation, de stockage, de calcul des scores "
    "et de restitution visuelle. Chaque etape est critique et doit etre validee par les tests E2E "
    "pour garantir la fiabilite du systeme en production.", body_style))

story.append(make_table(
    ['Etape', 'Acteur', 'Action', 'Endpoint / Systeme'],
    [
        ['1', 'Prestataire terrain', 'Collecte mesures (drive test)', 'Equipement mobile / Gps'],
        ['2', 'Prestataire SI', 'Authentification API', 'POST /api/auth/callback/credentials'],
        ['3', 'Prestataire SI', 'Import mesures (JSON/CSV)', 'PUT /api/mesures'],
        ['4', 'ONIT-PNG', 'Validation des donnees', 'Zod schema validation'],
        ['5', 'ONIT-PNG', 'Stockage en base', 'Prisma SQLite'],
        ['6', 'ONIT-PNG', 'Mise a jour campagne (statut)', 'Automatique si PLANIFIEE'],
        ['7', 'Systeme scoring', 'Calcul scores operateurs', 'POST /api/scores'],
        ['8', 'Systeme monitoring', 'Detection seuils depasses', 'POST /api/alerts'],
        ['9', 'DG / Analyste', 'Consultation dashboard', 'GET /api/dashboard'],
        ['10', 'DG / Analyste', 'Generation rapport', 'POST /api/reports'],
    ],
    col_ratios=[0.06, 0.20, 0.34, 0.40]
))
story.append(Spacer(1, 12))

# ============================================================================
# SECTION 10: Matrice RBAC
# ============================================================================
story.append(P('<b>10. Matrice de controle d\'acces RBAC complete</b>', h1_style))

story.append(P(
    "Le tableau ci-dessous resume les droits d'acces de chaque role sur les differents endpoints "
    "de l'API. Les codes suivants sont utilises : 200 (acces autorise en lecture), 201 (creation "
    "autorisee), 403 (acces interdit - permission insuffisante), 401 (non authentifie). Cette "
    "matrice constitue la reference pour la validation du controle d'acces lors des tests E2E "
    "et doit etre verifiee pour chaque role et chaque endpoint.", body_style))

rbac_headers = ['Endpoint', 'SUPER_ADMIN', 'DG', 'ANALYSTE_QOS', 'OPERATEUR', 'Public']
rbac_rows = [
    ['GET /api/dashboard', '200', '200', '200', '200', '200'],
    ['GET /api/mesures', '200', '200', '200', '200', '401'],
    ['POST /api/mesures', '201', '201', '201', '403', '401'],
    ['PUT /api/mesures', '201', '201', '201', '403', '401'],
    ['GET /api/alerts', '200', '200', '200', '200', '401'],
    ['POST /api/alerts', '201', '201', '201', '403', '401*'],
    ['PATCH /api/alerts', '200', '200', '200', '403', '401'],
    ['GET /api/campaigns', '200', '200', '200', '200', '401'],
    ['POST /api/campaigns', '201', '201', '201', '403', '401'],
    ['GET /api/reports', '200', '200', '200', '200', '200**'],
    ['POST /api/reports', '201', '201', '201', '403', '401'],
    ['GET /api/scores', '200', '200', '200', '200', '200'],
    ['POST /api/scores', '201', '201', '201', '403', '401'],
    ['GET /api/users', '200', '403', '403', '403', '401'],
    ['GET /api/roles', '200', '403', '403', '403', '401'],
    ['GET /api/audit-logs', '200', '200', '403', '403', '401'],
    ['GET /api/qos', '200', '200', '200', '200', '401'],
    ['GET /api/scoring', '200', '200', '200', '200', '200'],
    ['GET /api/map', '200', '200', '200', '200', '200'],
]
story.append(make_table(rbac_headers, rbac_rows, col_ratios=[0.28, 0.14, 0.12, 0.16, 0.14, 0.16]))
story.append(Spacer(1, 6))
story.append(P("* Signalement public (type=SIGNALEMENT_PUBLIC) autorise sans authentification", caption_style))
story.append(P("** Public ne voit que les rapports avec isPublic=true", caption_style))
story.append(Spacer(1, 18))

# ============================================================================
# BUILD
# ============================================================================
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

import hashlib

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

# Re-add headings with bookmark support
# Since the story is already built, we need to rebuild with bookmarks
final_story = []
toc2 = TableOfContents()
toc2.levelStyles = [
    ParagraphStyle(name='TOC1', fontName='NotoSerifSC', fontSize=13, leftIndent=20, leading=22, spaceBefore=6, spaceAfter=3, textColor=TEXT_PRIMARY),
    ParagraphStyle(name='TOC2', fontName='NotoSerifSC', fontSize=11, leftIndent=40, leading=18, spaceBefore=3, spaceAfter=2, textColor=TEXT_MUTED),
]
final_story.append(P('<b>Table des matieres</b>', h1_style))
final_story.append(toc2)
final_story.append(PageBreak())

# Add content with proper bookmarks
for item in story[3:]:  # Skip the initial TOC we added
    if isinstance(item, Paragraph):
        text = item.text
        style = item.style
        # Check if it's a heading
        if style.name == 'H1' and text.startswith('<b>') and text.endswith('</b>'):
            clean_text = text[3:-4]
            final_story.append(add_heading(text, style, level=0))
        elif style.name == 'H2' and text.startswith('<b>') and text.endswith('</b>'):
            final_story.append(add_heading(text, style, level=1))
        else:
            final_story.append(item)
    else:
        final_story.append(item)

doc = TocDocTemplate(
    OUTPUT_FILE,
    pagesize=A4,
    leftMargin=LEFT_M,
    rightMargin=RIGHT_M,
    topMargin=TOP_M,
    bottomMargin=BOTTOM_M,
    title='ONIT-PNG - Guide des Tests End-to-End en Production',
    author='ARPT - Observatoire National des Telecommunications',
    creator='Z.ai',
)

doc.multiBuild(final_story)
print(f"PDF genere avec succes : {OUTPUT_FILE}")
