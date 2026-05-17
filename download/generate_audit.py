#!/usr/bin/env python3
"""ONIT-PNG Security & Code Quality Audit Report - PDF Generator"""
import os, sys, hashlib

# ━━ Color Palette (auto-generated) ━━
from reportlab.lib import colors
ACCENT       = colors.HexColor('#308baa')
TEXT_PRIMARY  = colors.HexColor('#252321')
TEXT_MUTED    = colors.HexColor('#807b74')
BG_SURFACE   = colors.HexColor('#e9e5e0')
BG_PAGE      = colors.HexColor('#f2f0ed')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# Semantic
CRITICAL = colors.HexColor('#c0392b')
HIGH = colors.HexColor('#d35400')
MEDIUM = colors.HexColor('#f39c12')
LOW = colors.HexColor('#27ae60')

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Font registration
pdfmetrics.registerFont(TTFont('LibSerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-Bold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-Italic', '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'))
pdfmetrics.registerFont(TTFont('LibSans', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LibSans-Bold', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMono', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
registerFontFamily('LibSerif', normal='LibSerif', bold='LibSerif-Bold', italic='LibSerif-Italic')
registerFontFamily('LibSans', normal='LibSans', bold='LibSans-Bold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

PAGE_W, PAGE_H = A4
LEFT_M = 1.0*inch
RIGHT_M = 1.0*inch
TOP_M = 0.8*inch
BOTTOM_M = 0.8*inch
CONTENT_W = PAGE_W - LEFT_M - RIGHT_M

# Styles
styles = getSampleStyleSheet()

title_style = ParagraphStyle('Title2', fontName='LibSerif', fontSize=28, leading=34,
    textColor=ACCENT, alignment=TA_LEFT, spaceAfter=12)

h1_style = ParagraphStyle('H1', fontName='LibSerif', fontSize=18, leading=24,
    textColor=ACCENT, spaceBefore=18, spaceAfter=10)

h2_style = ParagraphStyle('H2', fontName='LibSerif', fontSize=14, leading=20,
    textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8)

h3_style = ParagraphStyle('H3', fontName='LibSerif', fontSize=12, leading=17,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6)

body_style = ParagraphStyle('Body', fontName='LibSerif', fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6)

body_left = ParagraphStyle('BodyLeft', fontName='LibSerif', fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6)

bullet_style = ParagraphStyle('Bullet', fontName='LibSerif', fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=4, leftIndent=24, bulletIndent=12)

code_style = ParagraphStyle('Code', fontName='DejaVuSans', fontSize=9, leading=13,
    textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=4, leftIndent=12)

caption_style = ParagraphStyle('Caption', fontName='LibSerif', fontSize=9, leading=13,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=6, spaceBefore=3)

header_cell = ParagraphStyle('HCell', fontName='LibSerif', fontSize=10, leading=14,
    textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER)

cell_style = ParagraphStyle('Cell', fontName='LibSerif', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')

cell_center = ParagraphStyle('CellC', fontName='LibSerif', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER)

toc_h1 = ParagraphStyle('TOCH1', fontName='LibSerif', fontSize=13, leftIndent=20)
toc_h2 = ParagraphStyle('TOCH2', fontName='LibSerif', fontSize=11, leftIndent=40)

# Severity badge helper
def sev_badge(level):
    colors_map = {'CRITIQUE': CRITICAL, 'HAUTE': HIGH, 'MOYENNE': MEDIUM, 'BASSE': LOW}
    c = colors_map.get(level, TEXT_MUTED)
    return Paragraph(f'<b>{level}</b>', ParagraphStyle('Sev', fontName='LibSerif',
        fontSize=9, leading=13, textColor=c, alignment=TA_CENTER))

# TOC DocTemplate
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

H1_ORPHAN = (PAGE_H - TOP_M - BOTTOM_M) * 0.15

def section_h1(text):
    return [CondPageBreak(H1_ORPHAN), add_heading(f'<b>{text}</b>', h1_style, level=0)]

def section_h2(text):
    return [add_heading(f'<b>{text}</b>', h2_style, level=1)]

def section_h3(text):
    return [add_heading(f'<b>{text}</b>', h3_style)]

def p(text):
    return Paragraph(text, body_style)

def pleft(text):
    return Paragraph(text, body_left)

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', bullet_style)

def make_table(headers, rows, col_ratios=None):
    hdr = [Paragraph(f'<b>{h}</b>', header_cell) for h in headers]
    data = [hdr]
    for row in rows:
        data.append([Paragraph(str(c), cell_style) if not isinstance(c, Paragraph) else c for c in row])
    
    if col_ratios:
        col_widths = [r * CONTENT_W for r in col_ratios]
    else:
        col_widths = [CONTENT_W / len(headers)] * len(headers)
    
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

# Build document
output_path = '/home/z/my-project/download/Audit_ONIT-PNG_2026.pdf'
doc = TocDocTemplate(output_path, pagesize=A4,
    leftMargin=LEFT_M, rightMargin=RIGHT_M, topMargin=TOP_M, bottomMargin=BOTTOM_M)

story = []

# ── TABLE OF CONTENTS ──
story.append(Paragraph('<b>Table des Matieres</b>', ParagraphStyle('TOCTitle',
    fontName='LibSerif', fontSize=20, leading=26, textColor=ACCENT, spaceAfter=18)))
toc = TableOfContents()
toc.levelStyles = [toc_h1, toc_h2]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════
# 1. RESUME EXECUTIF
# ═══════════════════════════════════════════
story.extend(section_h1('1. Resume Executif'))
story.append(p(
    "Ce rapport presente les resultats de l'audit complet de securite et de qualite de code de la plateforme "
    "<b>ONIT-PNG</b> (Observatoire National Intelligent des Telecommunications), une application Next.js destinee "
    "a la supervision des telecommunications en Republique de Guinee, developpee pour l'ARPT. L'audit a ete "
    "conduit sur l'ensemble du codebase comprenant les routes API, le schema Prisma, la configuration Docker, "
    "le middleware de securite, le systeme RBAC, et les composants frontend."
))
story.append(p(
    "L'audit a revele <b>34 vulnerabilites et problemes</b> repartis en quatre categories : securite critique, "
    "securite elevee, qualite architecturale, et qualite de code. Parmi les decouvertes les plus preocupantes, "
    "on note l'absence de verification d'authentification sur plusieurs endpoints API sensibles (dashboard, "
    "cartographie, scoring), la presence de donnees simulees melangees aux donnees reelles dans les reponses API, "
    "une base de donnees SQLite inadaptee a la production, et des problemes de validation des entrees qui "
    "pourraient permettre des attaques par injection ou des assignments de masse."
))
story.append(p(
    "La plateforme presente neanmoins des fondations solides avec un systeme RBAC bien structure, une journalisation "
    "d'audit exhaustive, une validation Zod systematique sur les routes critiques, un nettoyage HTML (stripHtml) "
    "contre les attaques XSS, et un middleware de securite avec en-tetes de protection et limitation de debit. "
    "Cependant, plusieurs de ces mecanismes presentent des lacunes d'implementation qui necessitent une correction "
    "prioritaire avant tout deploiement en production."
))

# Summary table
summary_data = [
    ['Securite Critique', '8', 'Correction immediate requise'],
    ['Securite Elevee', '6', 'Correction avant mise en production'],
    ['Architecture', '9', 'Refactorisation planifiee'],
    ['Qualite de Code', '11', 'Amelioration continue'],
]
story.append(Spacer(1, 12))
story.append(make_table(['Categorie', 'Nombre', 'Priorite'], summary_data, [0.30, 0.15, 0.55]))
story.append(Paragraph('Tableau 1 : Synthese des vulnerabilites identifiees', caption_style))

# ═══════════════════════════════════════════
# 2. VULNERABILITES DE SECURITE CRITIQUES
# ═══════════════════════════════════════════
story.extend(section_h1('2. Vulnerabilites de Securite Critiques'))

story.extend(section_h2('2.1 Acces non authentifie aux endpoints sensibles'))
story.append(p(
    "Plusieurs routes API critiques ne verifient pas l'authentification de l'utilisateur avant de renvoyer des "
    "donnees sensibles. L'endpoint <b>GET /api/dashboard</b> constitue le cas le plus grave : il retourne des KPIs "
    "nationaux, le classement des operateurs, les alertes actives, et les statistiques regionales sans aucune "
    "verification de session. Si l'utilisateur n'est pas authentifie, la route definit un role par defaut "
    "\"PUBLIC\" et continue l'execution normale, retournant potentiellement des donnees confidentielles."
))
story.append(p(
    "De meme, les endpoints <b>GET /api/map</b> et <b>GET /api/scoring</b> suivent le meme pattern dangereux : "
    "attribution d'un role \"PUBLIC\" en cas d'absence de session et poursuite du traitement. Bien que le systeme "
    "RLS (Row-Level Security) tente de filtrer les donnees selon le scope du role, la politique par defaut "
    "retourne \"public_only\" lorsqu'aucune politique n'existe, ce qui peut inadvertament exposer plus de donnees "
    "que prevu. L'endpoint de scoring expose notamment les sous-scores detailles de chaque operateur, leurs "
    "tendances historiques, et leurs recommandations strategiques."
))
story.append(Spacer(1, 6))
vuln1_data = [
    [sev_badge('CRITIQUE'), Paragraph('GET /api/dashboard', cell_style), Paragraph('Donnees KPI, alertes, scores operateurs accessibles sans authentification', cell_style)],
    [sev_badge('CRITIQUE'), Paragraph('GET /api/map', cell_style), Paragraph('Donnees cartographiques, points de mesure, couverture regionale sans authentification', cell_style)],
    [sev_badge('CRITIQUE'), Paragraph('GET /api/scoring', cell_style), Paragraph('Scores detailles, recommandations strategiques des operateurs sans authentification', cell_style)],
]
story.append(make_table(['Severite', 'Endpoint', 'Impact'], vuln1_data, [0.12, 0.20, 0.68]))
story.append(Paragraph('Tableau 2 : Endpoints sans verification d\'authentification', caption_style))
story.append(Spacer(1, 8))
story.append(p("<b>Recommandation :</b> Ajouter une verification de session obligatoire en debut de chaque handler GET. "
    "Retourner une erreur 401 si aucun utilisateur authentifie n'est detecte. Pour les donnees publiques legitimes, "
    "creer des endpoints distincts avec un filtrage explicite du contenu autorise."))

story.extend(section_h2('2.2 Donnees simulees/falsifiees dans les reponses API'))
story.append(p(
    "L'endpoint <b>GET /api/dashboard</b> contient des manipulations de donnees inquietantes qui faussent les "
    "indicateurs presents aux decideurs. La ligne de code suivante est particulierement grave : le compteur de "
    "zones blanches est artificiellement augmente de 200 unités avant d'etre renvoye au frontend. Cette pratique "
    "est qualifiee de falsification de donnees et constitue un risque majeur pour la credibilite de l'observatoire."
))
story.append(Paragraph(
    '<font name="DejaVuSans" size="8">zonesBlanches: { value: zonesBlanches + 200, ... }</font>',
    ParagraphStyle('CodeBlock', fontName='DejaVuSans', fontSize=8, leading=12,
        textColor=CRITICAL, leftIndent=24, spaceAfter=6)))
story.append(p(
    "De plus, la taille des fichiers de rapports est generee aleatoirement avec Math.random(), "
    "rendant les informations de taille completes fictives. L'endpoint /api/qos utilise des valeurs de repli "
    "codées en dur lorsque les donnees reelles sont insuffisantes, sans aucune indication visuelle que les "
    "donnees presentees sont estimees et non mesurees. Les tendances d'evolution des operateurs sont simulees "
    "avec des valeurs predefinies si les donnees historiques sont insuffisantes."
))
story.append(p("<b>Recommandation :</b> Supprimer toute manipulation de donnees dans les reponses API. Les valeurs "
    "par defaut doivent etre clairement identifiees comme telles dans la reponse JSON (ex: champ \"estimated\": true). "
    "Ajouter des metadonnees sur la source et la fiabilite de chaque indicateur."))

story.extend(section_h2('2.3 Exposition des emails de comptes de demonstration'))
story.append(p(
    "Le composant <b>login-modal.tsx</b> contient un tableau hardcode de 10 comptes de demonstration avec leurs "
    "adresses email completes, leurs roles et leurs organisations. Ces emails sont directement visibles dans le "
    "code JavaScript cote client, accessibles a quiconque consulte le code source de la page. Cette exposition "
    "facilite les attaques par ingenierie sociale et les tentatives d'acces non autorise, en revelant la structure "
    "des identifiants internes de l'ARPT et des operateurs."
))
story.append(p("<b>Recommandation :</b> Ne jamais exposer les emails de comptes reels dans le code client. "
    "Utiliser des identifiants de demonstration generiques (demo@onit.gn) ou implementer un mecanisme de "
    "selection de role cote serveur qui ne divulgue pas les identifiants reels."))

story.extend(section_h2('2.4 Recherche d\'operateur par correspondance floue'))
story.append(p(
    "La fonction <b>getAccessibleOperators</b> dans rbac.ts utilise une recherche par correspondance partielle "
    "pour resoudre l'operateur associe a un utilisateur : la methode utilise <b>contains</b> avec uniquement le "
    "premier mot de l'organisation. Cette approche est dangereuse car un utilisateur dont l'organisation est "
    "\"Orange Pirates\" obtiendrait acces aux donnees de l'operateur Orange. De meme, une organisation nommee "
    "\"MT\" pourrait matcher avec \"MTN Guinee\". La resolution d'identite par correspondance de chaine est "
    "intrinsequement vulnerable aux faux positifs."
))
story.append(p("<b>Recommandation :</b> Utiliser une correspondance exacte (code operateur ou ID) plutot qu'une "
    "recherche partielle. Ajouter un champ operateurId directement sur le modele User pour une association "
    "deterministe et fiable."))

story.extend(section_h2('2.5 Enregistrement d\'alertes sans limitation de debit'))
story.append(p(
    "L'endpoint <b>POST /api/alerts</b> permet la creation d'alertes de type SIGNALEMENT_PUBLIC sans "
    "authentification et sans aucune limitation de debit. Un attaquant pourrait automatiser la creation "
    "de milliers d'alertes fictives, saturant le systeme de notification et noyant les alertes legitimes "
    "dans le bruit. Le handler PATCH de resolution d'alertes verifie bien les permissions, mais le POST "
    "de creation ne limite pas le volume de soumissions."
))
story.append(p("<b>Recommandation :</b> Implementer une limitation de debit specifique pour les soumissions "
    "publiques d'alertes (ex: 5 soumissions par heure par adresse IP). Utiliser un middleware de rate limiting "
    "persistant (Redis) plutot que le systeme actuel en memoire."))

# ═══════════════════════════════════════════
# 3. VULNERABILITES DE SECURITE ELEVEES
# ═══════════════════════════════════════════
story.extend(section_h1('3. Vulnerabilites de Securite Elevees'))

story.extend(section_h2('3.1 Limitation de debit en memoire non persistante'))
story.append(p(
    "Le middleware implemente un systeme de limitation de debit base sur un Map en memoire. Ce systeme presente "
    "deux defauts majeurs : premierement, tout l'etat est perdu lors du redemarrage du serveur, permettant "
    "effectivement a un attaquant de reinitialiser ses compteurs en provoquant un redemarrage. Deuxiemement, "
    "ce mecanisme est totalement inefficace dans un deploiement multi-instances (plusieurs conteneurs ou pods), "
    "chaque instance maintenant ses propres compteurs independants. Un attaquant pourrait simplement envoyer ses "
    "requetes vers differentes instances pour contourner la limitation."
))
story.append(p("<b>Recommandation :</b> Migrer vers un systeme de rate limiting persistant utilisant Redis ou "
    "une base de donnees. Implementer des clés de limitation au niveau utilisateur authentifie en plus de l'IP. "
    "Ajouter des limitations specifiques par endpoint (login, creation d'alertes, import en masse)."))

story.extend(section_h2('3.2 Base de donnees SQLite en production'))
story.append(p(
    "La configuration Docker (docker-compose.yml) utilise SQLite comme base de donnees de production avec "
    "DATABASE_URL=file:/app/db/onit-png.db. SQLite est un excellent choix pour le developpement et les "
    "applications mono-utilisateur, mais il est fondamentalement inadapte a un systeme de supervision nationale "
    "multi-utilisateurs. SQLite ne gere pas les acces concurrents en ecriture (verrouillage au niveau fichier), "
    "ne supporte pas les connexions reseau, ne dispose pas de mecanismes de replication, et ne permet pas "
    "de scaling horizontal. Pour un observatoire national avec potentiellement des dizaines d'utilisateurs "
    "simultanes et des imports en masse de mesures QoS, cette limitation est critique."
))
story.append(p("<b>Recommandation :</b> Migrer vers PostgreSQL pour la production. Le schema Prisma est deja "
    "compatible avec PostgreSQL (seule la datasource du schema et l'URL changent). Configurer les variables "
    "d'environnement Docker pour pointer vers une instance PostgreSQL."))

story.extend(section_h2('3.3 Absence de strategie de migration de base de donnees'))
story.append(p(
    "Le Dockerfile utilise <b>prisma db push --skip-generate</b> au demarrage du conteneur. Cette commande "
    "synchronise le schema Prisma avec la base de donnees sans creer de fichiers de migration, ce qui est "
    "acceptables en developpement mais dangereux en production. En cas de modification du schema, cette commande "
    "peut silently alterer ou supprimer des colonnes de donnees existantes sans mechanisme de retour en arriere. "
    "Il n'existe aucun historique des modifications de schema, aucune possibilite de rollback, et aucune "
    "verification de coherence avant application."
))
story.append(p("<b>Recommandation :</b> Utiliser <b>prisma migrate deploy</b> en production au lieu de "
    "db push. Creer des migrations explicites avec prisma migrate dev en developpement. Versionner les "
    "fichiers de migration dans le depot de code."))

story.extend(section_h2('3.4 Credentials hardcodes dans les fichiers de configuration'))
story.append(p(
    "Le fichier .env.local contient des credentials en clair : le mot de passe de la base de donnees "
    "(password123), le secret NextAuth (dev-secret-not-for-production), et des cles AWS d'exemple. "
    "Si ce fichier est commité dans le depot Git, ces secrets sont accessibles a toute personne ayant "
    "acces au code source. Le docker-compose.yml exige NEXTAUTH_SECRET via une variable d'environnement, "
    "mais la configuration de developpement utilise un secret faible et previsibles."
))
story.append(p("<b>Recommandation :</b> Verifier que .env.local est dans .gitignore. Utiliser un gestionnaire "
    "de secrets (Vault, AWS Secrets Manager) pour la production. Generer des secrets forts avec "
    "openssl rand -base64 32. Ne jamais commité de fichiers contenant des credentials reels."))

story.extend(section_h2('3.5 Absence de pagination sur les endpoints de liste'))
story.append(p(
    "L'endpoint <b>GET /api/users</b> retourne la liste complete de tous les utilisateurs sans pagination. "
    "Pour une plateforme nationale, cette liste pourrait contenir des centaines d'utilisateurs, et chaque "
    "requete charge l'integralite en memoire. Les endpoints /api/alerts et /api/campaigns presentent le meme "
    "probleme. L'endpoint /api/mesures implemente correctement la pagination (limit/offset), ce qui demontre "
    "que le pattern est connu mais n'a pas ete applique uniformement."
))
story.append(p("<b>Recommandation :</b> Implementer la pagination (limit/offset) sur tous les endpoints de liste. "
    "Appliquer une limite maximale par defaut (ex: 100 elements). Ajouter des liens de pagination dans les "
    "reponses (hasMore, total, nextOffset)."))

story.extend(section_h2('3.6 Absence de validation CSRF explicite'))
story.append(p(
    "Bien que NextAuth fournisse une protection CSRF de base via des tokens dans les cookies, l'application "
    "n'ajoute aucune protection CSRF supplementaire pour les routes API personnalisees. Les endpoints POST/PATCH/PUT "
    "acceptent des requetes JSON sans verification de l'origine. Un attaquant pourrait potentiellement "
    "soumettre des formulaires malveillants depuis un site tiers si l'utilisateur est deja authentifie."
))
story.append(p("<b>Recommandation :</b> Verifier l'en-tete Origin/Referer sur toutes les requetes mutantes. "
    "Implementer un token CSRF personnalise pour les endpoints sensibles. Utiliser l'en-tete SameSite=Strict "
    "sur les cookies de session."))

# ═══════════════════════════════════════════
# 4. PROBLEMES D'ARCHITECTURE
# ═══════════════════════════════════════════
story.extend(section_h1('4. Problemes d\'Architecture'))

story.extend(section_h2('4.1 Monolithisme frontend et absence de routing serveur'))
story.append(p(
    "L'application est construite comme un SPA (Single Page Application) avec un routage entierement cote client. "
    "Le fichier page.tsx gere tous les onglets de navigation via un etat React, chargeant dynamiquement les "
    "composants dashboard sans URL distinctes. Cette architecture pose plusieurs problemes : impossibilite "
    "de partager un lien direct vers un onglet specifique, absence de navigation par URL (aucun historique "
    "de navigation), SEO inexistant, et difficulte a implementer des garde-fous de securite au niveau du routeur."
))
story.append(p("<b>Recommandation :</b> Migrer vers le routage App Router de Next.js avec des pages distinctes "
    "par section (/dashboard, /qos, /scoring, etc.). Utiliser les layouts pour le sidebar commun. Implementer "
    "la protection des routes au niveau du middleware Next.js."))

story.extend(section_h2('4.2 Absence d\'infrastructure de test'))
story.append(p(
    "Le fichier package.json ne contient aucune dependance de test : pas de Jest, Vitest, React Testing Library, "
    "Playwright Test, ni Cypress. Il n'existe aucun script de test configure. Pour une plateforme gouvernementale "
    "critique de supervision des telecommunications, cette absence est inacceptable. Les regressions ne peuvent "
    "etre detectees que manuellement, et la confiance dans les modifications du code est nulle."
))
story.append(p("<b>Recommandation :</b> Ajouter Vitest pour les tests unitaires, React Testing Library pour les "
    "composants, et Playwright pour les tests end-to-end. Cibler un minimum de 80% de couverture sur les routes "
    "API et les fonctions de securite. Integrer les tests dans le pipeline CI/CD."))

story.extend(section_h2('4.3 Duplication massive du code de mapping'))
story.append(p(
    "Les mappings de labels de roles (roleLabels), de couleurs de badges (roleBadgeColors), et de couleurs "
    "d'operateurs sont dupliques dans au moins 5 composants differents : onit-layout.tsx, login-modal.tsx, "
    "dashboard-admin.tsx, user-menu.tsx, et les fichiers d'API. Toute modification d'un role ou d'une couleur "
    "necessite des changements coordonnes dans tous ces fichiers, avec un risque eleve d'incoherence."
))
story.append(p("<b>Recommandation :</b> Centraliser les constantes de mapping dans des fichiers dedies "
    "(lib/constants/roles.ts, lib/constants/operators.ts). Exporter et importer ces constantes partout "
    "ou necessaire. Utiliser des variables CSS pour les couleurs cote client."))

story.extend(section_h2('4.4 Casts de type repetes et non securises'))
story.append(p(
    "Le pattern <b>(session.user as Record&lt;string, unknown&gt;).role</b> est repete plus de 30 fois a travers "
    "le codebase, dans chaque route API et chaque composant frontend. Ce pattern est fragile car il suppose "
    "une structure de session specifique sans verification formelle. Si la structure de la session change, "
    "aucune erreur de compilation ne sera generee, et les erreurs ne se manifesteront qu'au runtime."
))
story.append(p("<b>Recommandation :</b> Creer des utilitaires de type securise (ex: getUserRole(session), "
    "getUserOrg(session)) qui centralisent les casts et ajoutent des verifications. Definir une interface "
    "NextAuth Session etendue correctement typee."))

story.extend(section_h2('4.5 Absence de health check fonctionnel'))
story.append(p(
    "L'endpoint /api/route.ts retourne simplement { message: \"Hello, world!\" } sans verifier l'etat "
    "reel du systeme. Le Dockerfile configure un healthcheck sur /api/auth/session, ce qui est meilleur "
    "mais ne verifie pas la connectivite base de donnees ni l'etat des services externes. Un veritable "
    "health check devrait verifier la connexion a la base de donnees, la disponibilite des services externes, "
    "et l'etat general de l'application."
))
story.append(p("<b>Recommandation :</b> Creer un endpoint /api/health qui verifie : connexion DB (SELECT 1), "
    "disponibilite du stockage S3, etat du systeme d'authentification, et version de l'application. "
    "Utiliser cet endpoint pour le Docker HEALTHCHECK."))

story.extend(section_h2('4.6 Absence de gestion des transactions'))
story.append(p(
    "Les operations multi-etapes comme la creation d'utilisateur avec hashage du mot de passe, ou la resolution "
    "d'alertes avec journalisation d'audit, ne sont pas encapsulees dans des transactions Prisma. Si l'etape "
    "de journalisation echoue apres une modification reussie, le systeme se retrouve dans un etat incoherent "
    "sans trace de l'operation effectuee. Pour un systeme d'audit reglementaire, cette coherence est essentielle."
))
story.append(p("<b>Recommandation :</b> Utiliser db.$transaction() pour les operations multi-etapes critiques. "
    "Implementer des mecanismes de compensation pour les operations qui ne peuvent pas etre transactionnelles "
    "(ex: envoi d'email)."))

story.extend(section_h2('4.7 Schema Prisma : index manquants'))
story.append(p(
    "Le schema Prisma manque d'index sur les champs frequemment requetes. Les champs operateurId, regionId, "
    "campagneId de MesureQoS sont utilises dans presque toutes les requetes de filtrage mais n'ont pas d'index "
    "dedie. De meme, le champ statut de Campagne et le champ isResolved de Alerte sont filtres regulierement "
    "sans index. Avec la croissance des donnees (potentiellement des millions de mesures QoS), les performances "
    "se degraderont significativement."
))
story.append(p("<b>Recommandation :</b> Ajouter des index composites sur les colonnes de filtrage frequent. "
    "Exemples : @@index([operateurId, regionId]) sur MesureQoS, @@index([statut]) sur Campagne, "
    "@@index([isResolved, createdAt]) sur Alerte."))

story.extend(section_h2('4.8 Absence de logging structure externe'))
story.append(p(
    "Le systeme de logging actuel se limite a console.error avec des messages en texte brut. Il n'y a pas de "
    "niveaux de log configurables, pas de rotation des logs, pas d'envoi vers un systeme d'agregation centralise "
    "(ELK, Datadog, etc.), et pas de distinction entre les environnements. Pour un systeme de supervision "
    "national, la capacite d'analyser les incidents retroactivement est cruciale."
))
story.append(p("<b>Recommandation :</b> Implementer un systeme de logging structure avec niveaux (debug, info, "
    "warn, error). Configurer l'envoi des logs vers un systeme d'aggregation. Ajouter des correlation IDs "
    "pour tracer les requetes a travers les differents services."))

story.extend(section_h2('4.9 Compatibilite des dependances'))
story.append(p(
    "Le projet utilise Next.js 16 avec next-auth version 4, qui est concu pour Next.js 13-14. Le paquet "
    "@auth/prisma-adapter est installe mais est concu pour Auth.js v5, creant une incompatibilite potentielle. "
    "Zod v4 est utilise, mais l'API de Zod a evolue significativement entre v3 et v4, et certaines methodes "
    "utilisees pourraient ne pas fonctionner correctement. L'utilisation conjointe de Prisma 6 et du client "
    "Prisma 5 pourrait egalement poser des problemes de compatibilite."
))
story.append(p("<b>Recommandation :</b> Aligner les versions des dependances. Migrer vers next-auth v5 (Auth.js) "
    "ou rester sur une version de Next.js compatible avec v4. Verifier la compatibilite de Zod v4 avec "
    "les schemas definis. Utiliser une version coherente de Prisma."))

# ═══════════════════════════════════════════
# 5. QUALITE DE CODE
# ═══════════════════════════════════════════
story.extend(section_h1('5. Qualite de Code'))

story.extend(section_h2('5.1 Points positifs identifies'))
story.append(p(
    "Malgre les vulnerabilites identifiees, le codebase presente plusieurs pratiques louables qui meritent "
    "d'etre soulignees et preservees lors des corrections :"
))
story.append(bullet("<b>Validation Zod systematique :</b> Toutes les routes POST/PUT/PATCH utilisent des schemas Zod "
    "pour valider les entrees, avec des transformations de nettoyage HTML (stripHtml) preventives contre les XSS."))
story.append(bullet("<b>Journalisation d'audit :</b> La plupart des operations sensibles sont enregistrees dans la "
    "table AuditLog avec l'identifiant utilisateur, l'action, la ressource et les details."))
story.append(bullet("<b>Nettoyage HTML :</b> La fonction stripHtml est appliquee systematiquement sur les champs texte "
    "des schemas Zod, prevenant les injections de scripts dans les donnees persistees."))
story.append(bullet("<b>En-tetes de securite :</b> Le middleware ajoute des en-tetes de protection (X-Content-Type-Options, "
    "X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy) a toutes les reponses."))
story.append(bullet("<b>Cookies securises :</b> La configuration NextAuth adapte les cookies securises selon l'environnement "
    "(HTTPS en production, HTTP en developpement) avec les flags httpOnly et sameSite."))
story.append(bullet("<b>RBAC structure :</b> Le systeme de controle d'acces base sur les roles avec des politiques "
    "d'acces aux donnees (RLS) est bien concu et granulaire."))
story.append(bullet("<b>Non-exposition du mot de passe :</b> Le schema Prisma utilise passwordHash et les reponses API "
    "n'exposent jamais le hash du mot de passe."))
story.append(bullet("<b>Prevention de desactivation self :</b> Un administrateur ne peut pas desactiver son propre compte."))

story.extend(section_h2('5.2 Problemes de duplication de code'))
story.append(p(
    "La duplication de code est repandue a travers le codebase. Outre les mappings de roles et couleurs deja "
    "mentionnes, on retrouve des patterns repetes non extraits en fonctions partagees : la resolution d'ID "
    "operateur a partir d'un code est implementee independamment dans /api/mesures, /api/alerts, /api/scores, "
    "et /api/qos. La logique de calcul de couverture (filtrage par rssi > -100, calcul de pourcentage) est "
    "dupliquee entre /api/dashboard et /api/map. La fonction formatTimeAgo est implementee trois fois "
    "separement. La logique de construction des filtres RLS (spread operateur avec conditions scope) est "
    "reperee dans chaque route API sans abstraction."
))
story.append(p("<b>Recommandation :</b> Extraire les logiques partagees dans des fonctions utilitaires : "
    "resolveOperatorId(code), calculateCoverage(measures), formatTimeAgo(date), buildRLSFilter(scope, opIds, regIds). "
    "Creer un hook React useApiWithRLS pour standardiser les appels API cote client."))

story.extend(section_h2('5.3 Gestion des erreurs insuffisante'))
story.append(p(
    "La gestion des erreurs est uniforme et basique : chaque route API catch les erreurs et retourne un "
    "generic \"Erreur serveur\" avec un status 500. Il n'y a pas de distinction entre les erreurs de validation "
    "(400), les erreurs d'autorisation (403), les ressources introuvables (404), et les erreurs serveur "
    "internes (500). Le logging des erreurs se limite a console.error sans contexte suffisant pour le diagnostic. "
    "Les erreurs Prisma specifiques (contrainte unique, enregistrement introuvable) ne sont pas traduites "
    "en reponses HTTP appropriees."
))
story.append(p("<b>Recommandation :</b> Implementer des classes d'erreur personnalisees (NotFoundError, "
    "AuthorizationError, ValidationError) avec des handlers centralises. Ajouter des correlation IDs "
    "dans les reponses d'erreur pour faciliter le diagnostic. Logger les erreurs avec suffisamment de "
    "contexte (endpoint, parametres, userId) sans exposer d'informations sensibles."))

story.extend(section_h2('5.4 Absence de documentation technique'))
story.append(p(
    "Le projet ne contient aucune documentation technique : pas de README detaille, pas de documentation "
    "d'API, pas de guide de deploiement, pas de documentation d'architecture. Les seuls commentaires "
    "present dans le code sont des separateurs decoratifs. Pour une plateforme gouvernementale qui sera "
    "potentiellement maintenue par differentes equipes au fil du temps, cette absence rend la maintenance "
    "extremement difficile et couteuse."
))
story.append(p("<b>Recommandation :</b> Creer un README.md complet avec les instructions d'installation, "
    "de configuration et de deploiement. Documenter l'architecture RBAC et les politiques RLS. Generer "
    "une documentation d'API avec Swagger/OpenAPI. Documenter les procedures de sauvegarde et restauration."))

story.extend(section_h2('5.5 Problèmes de configuration Docker'))
story.append(p(
    "La configuration Docker presente plusieurs problemes de securite et de bonnes pratiques. Le Dockerfile "
    "copie les scripts de seed dans l'image de production, ce qui est inutile et augmente la surface d'attaque. "
    "L'instruction COPY --from=builder /app/db ./db copie potentiellement la base de donnees de developpement "
    "dans l'image. Le script de demarrage execute prisma db push a chaque demarrage, ce qui est dangereux "
    "comme mentionne precedemment. Les limites de ressources (memoire, CPU) ne sont pas configurees dans "
    "docker-compose.yml."
))
story.append(p("<b>Recommandation :</b> Nettoyer le Dockerfile pour ne copier que les fichiers necessaires en "
    "production. Utiliser prisma migrate deploy au lieu de db push. Configurer les limites de ressources. "
    "Ajouter un utilisateur non-root pour l'execution (deja partiellement fait avec nextjs)."))

# ═══════════════════════════════════════════
# 6. RECOMMANDATIONS PRIORITAIRES
# ═══════════════════════════════════════════
story.extend(section_h1('6. Recommandations Prioritaires'))

story.append(p(
    "Les recommandations suivantes sont classees par priorite et estimees en effort d'implementation. "
    "Les corrections critiques doivent etre appliquees avant tout deploiement en production."
))

rec_data = [
    [sev_badge('CRITIQUE'), Paragraph('Ajouter authentification sur tous les endpoints sensibles', cell_style), Paragraph('2 jours', cell_center)],
    [sev_badge('CRITIQUE'), Paragraph('Supprimer les falsifications de donnees (zonesBlanches + 200, Math.random())', cell_style), Paragraph('1 jour', cell_center)],
    [sev_badge('CRITIQUE'), Paragraph('Retirer les emails de comptes du code client', cell_style), Paragraph('0.5 jour', cell_center)],
    [sev_badge('CRITIQUE'), Paragraph('Corriger la resolution d\'operateur (correspondance exacte)', cell_style), Paragraph('1 jour', cell_center)],
    [sev_badge('HAUTE'), Paragraph('Migrer vers PostgreSQL pour la production', cell_style), Paragraph('3 jours', cell_center)],
    [sev_badge('HAUTE'), Paragraph('Implementer le rate limiting persistant (Redis)', cell_style), Paragraph('2 jours', cell_center)],
    [sev_badge('HAUTE'), Paragraph('Ajouter la pagination sur tous les endpoints de liste', cell_style), Paragraph('2 jours', cell_center)],
    [sev_badge('HAUTE'), Paragraph('Migrer vers prisma migrate deploy en production', cell_style), Paragraph('1 jour', cell_center)],
    [sev_badge('HAUTE'), Paragraph('Securiser les fichiers de configuration et les secrets', cell_style), Paragraph('1 jour', cell_center)],
    [sev_badge('HAUTE'), Paragraph('Ajouter la protection CSRF', cell_style), Paragraph('1 jour', cell_center)],
    [sev_badge('MOYENNE'), Paragraph('Ajouter les index Prisma manquants', cell_style), Paragraph('1 jour', cell_center)],
    [sev_badge('MOYENNE'), Paragraph('Implementer l\'infrastructure de test (Vitest + Playwright)', cell_style), Paragraph('5 jours', cell_center)],
    [sev_badge('MOYENNE'), Paragraph('Refactorer le code duplique (mappings, utilitaires)', cell_style), Paragraph('3 jours', cell_center)],
    [sev_badge('MOYENNE'), Paragraph('Migrer vers le routage App Router de Next.js', cell_style), Paragraph('5 jours', cell_center)],
    [sev_badge('BASSE'), Paragraph('Ajouter la documentation technique', cell_style), Paragraph('3 jours', cell_center)],
    [sev_badge('BASSE'), Paragraph('Implementer le logging structure', cell_style), Paragraph('2 jours', cell_center)],
]
story.append(Spacer(1, 12))
story.append(make_table(['Priorite', 'Recommandation', 'Effort'], rec_data, [0.12, 0.68, 0.20]))
story.append(Paragraph('Tableau 3 : Plan d\'action prioritaire', caption_style))

# ═══════════════════════════════════════════
# 7. MATRICE DES VULNERABILITES
# ═══════════════════════════════════════════
story.extend(section_h1('7. Matrice Complete des Vulnerabilites'))

vulns = [
    ['V-001', 'Acces non authentifie /api/dashboard', 'CRITIQUE', 'Securite', '2.1'],
    ['V-002', 'Acces non authentifie /api/map', 'CRITIQUE', 'Securite', '2.1'],
    ['V-003', 'Acces non authentifie /api/scoring', 'CRITIQUE', 'Securite', '2.1'],
    ['V-004', 'Falsification donnees (zonesBlanches + 200)', 'CRITIQUE', 'Integrite', '2.2'],
    ['V-005', 'Tailles de rapports aleatoires (Math.random)', 'CRITIQUE', 'Integrite', '2.2'],
    ['V-006', 'Donnees de repli non identifiees comme estimees', 'CRITIQUE', 'Integrite', '2.2'],
    ['V-007', 'Exposition emails de comptes dans le code client', 'CRITIQUE', 'Securite', '2.3'],
    ['V-008', 'Resolution operateur par correspondance floue', 'CRITIQUE', 'Securite', '2.4'],
    ['V-009', 'Alertes publiques sans limitation de debit', 'HAUTE', 'Securite', '2.5'],
    ['V-010', 'Rate limiting en memoire non persistant', 'HAUTE', 'Securite', '3.1'],
    ['V-011', 'SQLite en production', 'HAUTE', 'Architecture', '3.2'],
    ['V-012', 'Absence de migrations (prisma db push en prod)', 'HAUTE', 'Architecture', '3.3'],
    ['V-013', 'Credentials hardcodes dans .env.local', 'HAUTE', 'Securite', '3.4'],
    ['V-014', 'Absence de pagination (users, alerts, campaigns)', 'HAUTE', 'Performance', '3.5'],
    ['V-015', 'Absence de protection CSRF explicite', 'HAUTE', 'Securite', '3.6'],
    ['V-016', 'Architecture SPA sans routing serveur', 'MOYENNE', 'Architecture', '4.1'],
    ['V-017', 'Absence d\'infrastructure de test', 'MOYENNE', 'Qualite', '4.2'],
    ['V-018', 'Duplication massive du code de mapping', 'MOYENNE', 'Qualite', '4.3'],
    ['V-019', 'Casts de type repetes et non securises', 'MOYENNE', 'Qualite', '4.4'],
    ['V-020', 'Health check non fonctionnel', 'MOYENNE', 'Architecture', '4.5'],
    ['V-021', 'Absence de gestion des transactions', 'MOYENNE', 'Architecture', '4.6'],
    ['V-022', 'Index Prisma manquants', 'MOYENNE', 'Performance', '4.7'],
    ['V-023', 'Absence de logging structure externe', 'MOYENNE', 'Observabilite', '4.8'],
    ['V-024', 'Incompatibilite de dependances (next-auth v4 + Next.js 16)', 'MOYENNE', 'Architecture', '4.9'],
    ['V-025', 'Duplication de la logique de resolution d\'ID operateur', 'BASSE', 'Qualite', '5.2'],
    ['V-026', 'Duplication du calcul de couverture', 'BASSE', 'Qualite', '5.2'],
    ['V-027', 'Duplication de formatTimeAgo', 'BASSE', 'Qualite', '5.2'],
    ['V-028', 'Gestion des erreurs generique et insuffisante', 'BASSE', 'Qualite', '5.3'],
    ['V-029', 'Absence de documentation technique', 'BASSE', 'Qualite', '5.4'],
    ['V-030', 'Problemes de configuration Docker', 'BASSE', 'DevOps', '5.5'],
    ['V-031', 'Donnees mock non separees du code de production', 'BASSE', 'Qualite', '-'],
    ['V-032', 'Absence de limites de ressources Docker', 'BASSE', 'DevOps', '-'],
    ['V-033', 'Composant cyber dashboard sans donnees reelles', 'BASSE', 'Fonctionnel', '-'],
    ['V-034', 'Absence de mecanisme de changement de mot de passe', 'BASSE', 'Securite', '-'],
]

vuln_rows = []
for v in vulns:
    sev = v[2]
    sev_p = sev_badge(sev)
    vuln_rows.append([Paragraph(v[0], cell_center), Paragraph(v[1], cell_style), sev_p,
        Paragraph(v[3], cell_style), Paragraph(v[4], cell_center)])

story.append(Spacer(1, 12))
story.append(make_table(['ID', 'Description', 'Severite', 'Categorie', 'Section'], vuln_rows,
    [0.07, 0.48, 0.12, 0.18, 0.08]))
story.append(Paragraph('Tableau 4 : Matrice complete des vulnerabilites identifiees', caption_style))

# ═══════════════════════════════════════════
# 8. CONCLUSION
# ═══════════════════════════════════════════
story.extend(section_h1('8. Conclusion'))
story.append(p(
    "La plateforme ONIT-PNG presente une base fonctionnelle solide avec un systeme RBAC bien concu, une validation "
    "des entrees rigoureuse via Zod, et une journalisation d'audit adequate. Cependant, les vulnerabilites "
    "de securite identifiees, notamment l'acces non authentifie a des donnees sensibles et la falsification "
    "d'indicateurs, necessitent une correction immediate avant toute mise en production. La migration vers "
    "PostgreSQL, l'ajout d'une infrastructure de test, et la refactorisation du code duplique sont des "
    "investissements necessaires pour garantir la fiabilite, la securite et la maintenabilite a long terme "
    "de l'observatoire national."
))
story.append(p(
    "L'effort total eststime pour corriger les vulnerabilites critiques et elevees est d'environ "
    "<b>15 jours-homme</b>, tandis que les ameliorations architecturales et de qualite representent environ "
    "<b>20 jours-homme</b> supplementaires. Il est recommande de prioriser les corrections de securite "
    "et de planifier les ameliorations architecturales sur les sprints suivants."
))

# Build
doc.multiBuild(story)
print(f"PDF generated: {output_path}")
