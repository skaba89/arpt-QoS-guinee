#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ONIT-PNG — Rapport d'Audit E2E et Recommandations
Observatoire National Intelligent des Telecommunications - ARPT Guinee
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, Image,
    PageBreak, KeepTogether, CondPageBreak
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import hashlib

# ── Font Registration ──
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('CarlitoBold', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerifBold', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSCBold')
registerFontFamily('Carlito', normal='Carlito', bold='CarlitoBold')
registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerifBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ── Palette ──
PAGE_BG       = colors.HexColor('#eff0f0')
SECTION_BG    = colors.HexColor('#e8eae9')
CARD_BG       = colors.HexColor('#e5ebe8')
TABLE_STRIPE  = colors.HexColor('#f0f2f1')
HEADER_FILL   = colors.HexColor('#3e5d4e')
COVER_BLOCK   = colors.HexColor('#416c57')
BORDER        = colors.HexColor('#acc8ba')
ICON          = colors.HexColor('#417f60')
ACCENT        = colors.HexColor('#27728a')
ACCENT_2      = colors.HexColor('#40b8a9')
TEXT_PRIMARY   = colors.HexColor('#161917')
TEXT_MUTED     = colors.HexColor('#7e8883')
SEM_SUCCESS   = colors.HexColor('#4f8962')
SEM_WARNING   = colors.HexColor('#9c8049')
SEM_ERROR     = colors.HexColor('#ac544c')
SEM_INFO      = colors.HexColor('#577b9e')

# ── Page Setup ──
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 1.0 * inch
RIGHT_MARGIN = 1.0 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.8 * inch
CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ── Styles ──
FONT_BODY = 'Carlito'
FONT_HEADING = 'LiberationSerif'

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'CustomTitle', fontName=FONT_HEADING, fontSize=24, leading=30,
    alignment=TA_LEFT, textColor=ACCENT, spaceAfter=12
)

h1_style = ParagraphStyle(
    'CustomH1', fontName=FONT_HEADING, fontSize=18, leading=24,
    alignment=TA_LEFT, textColor=HEADER_FILL, spaceBefore=18, spaceAfter=10
)

h2_style = ParagraphStyle(
    'CustomH2', fontName=FONT_HEADING, fontSize=14, leading=18,
    alignment=TA_LEFT, textColor=ACCENT, spaceBefore=14, spaceAfter=8
)

h3_style = ParagraphStyle(
    'CustomH3', fontName=FONT_HEADING, fontSize=12, leading=16,
    alignment=TA_LEFT, textColor=ICON, spaceBefore=10, spaceAfter=6
)

body_style = ParagraphStyle(
    'CustomBody', fontName=FONT_BODY, fontSize=10.5, leading=17,
    alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY,
    spaceBefore=2, spaceAfter=6, firstLineIndent=0
)

body_indent = ParagraphStyle(
    'BodyIndent', parent=body_style, leftIndent=18
)

bullet_style = ParagraphStyle(
    'CustomBullet', fontName=FONT_BODY, fontSize=10.5, leading=17,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    spaceBefore=2, spaceAfter=4, leftIndent=24, bulletIndent=12
)

code_style = ParagraphStyle(
    'CustomCode', fontName='DejaVuSans', fontSize=9, leading=14,
    alignment=TA_LEFT, textColor=TEXT_MUTED,
    spaceBefore=2, spaceAfter=4, leftIndent=18,
    backColor=CARD_BG
)

header_cell_style = ParagraphStyle(
    'HeaderCell', fontName=FONT_BODY, fontSize=10, leading=14,
    alignment=TA_CENTER, textColor=colors.white
)

cell_style = ParagraphStyle(
    'CellStyle', fontName=FONT_BODY, fontSize=9.5, leading=14,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY
)

cell_center = ParagraphStyle(
    'CellCenter', fontName=FONT_BODY, fontSize=9.5, leading=14,
    alignment=TA_CENTER, textColor=TEXT_PRIMARY
)

caption_style = ParagraphStyle(
    'Caption', fontName=FONT_BODY, fontSize=9, leading=13,
    alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceBefore=3, spaceAfter=6
)

# Callout box styles
callout_critical = ParagraphStyle(
    'CalloutCritical', fontName=FONT_BODY, fontSize=10.5, leading=17,
    alignment=TA_LEFT, textColor=SEM_ERROR,
    spaceBefore=6, spaceAfter=6, leftIndent=12,
    borderColor=SEM_ERROR, borderWidth=1, borderPadding=8,
    backColor=colors.HexColor('#fef2f2')
)

callout_warning = ParagraphStyle(
    'CalloutWarning', fontName=FONT_BODY, fontSize=10.5, leading=17,
    alignment=TA_LEFT, textColor=SEM_WARNING,
    spaceBefore=6, spaceAfter=6, leftIndent=12,
    borderColor=SEM_WARNING, borderWidth=1, borderPadding=8,
    backColor=colors.HexColor('#fefce8')
)

callout_info = ParagraphStyle(
    'CalloutInfo', fontName=FONT_BODY, fontSize=10.5, leading=17,
    alignment=TA_LEFT, textColor=SEM_INFO,
    spaceBefore=6, spaceAfter=6, leftIndent=12,
    borderColor=SEM_INFO, borderWidth=1, borderPadding=8,
    backColor=colors.HexColor('#eff6ff')
)

callout_success = ParagraphStyle(
    'CalloutSuccess', fontName=FONT_BODY, fontSize=10.5, leading=17,
    alignment=TA_LEFT, textColor=SEM_SUCCESS,
    spaceBefore=6, spaceAfter=6, leftIndent=12,
    borderColor=SEM_SUCCESS, borderWidth=1, borderPadding=8,
    backColor=colors.HexColor('#f0fdf4')
)

# ── TOC DocTemplate ──
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ── Helpers ──
def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
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

def make_table(data, col_widths=None, h_align='CENTER'):
    if col_widths is None:
        col_widths = [CONTENT_W / len(data[0])] * len(data[0])
    t = Table(data, colWidths=col_widths, hAlign=h_align)
    style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = colors.white if i % 2 == 1 else TABLE_STRIPE
        style_commands.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_commands))
    return t

def bullet(text):
    return Paragraph('<bullet>&bull;</bullet> ' + text, bullet_style)

# ════════════════════════════════════════════════════
# DOCUMENT BUILD
# ════════════════════════════════════════════════════

OUTPUT_PATH = '/home/z/my-project/download/ONIT-PNG_Audit_E2E_Recommandations.pdf'
BODY_PDF = '/home/z/my-project/download/_audit_body.pdf'

doc = TocDocTemplate(
    BODY_PDF,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='ONIT-PNG - Audit E2E et Recommandations',
    author='ARPT Guinee',
    creator='Z.ai',
)

story = []

# ── TOC ──
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle(name='TOC1', fontSize=12, leftIndent=20, fontName=FONT_HEADING,
                   spaceBefore=6, spaceAfter=3, textColor=HEADER_FILL),
    ParagraphStyle(name='TOC2', fontSize=10.5, leftIndent=40, fontName=FONT_BODY,
                   spaceBefore=3, spaceAfter=2, textColor=ACCENT),
    ParagraphStyle(name='TOC3', fontSize=9.5, leftIndent=60, fontName=FONT_BODY,
                   spaceBefore=2, spaceAfter=1, textColor=TEXT_MUTED),
]
story.append(Paragraph('<b>Table des matieres</b>', title_style))
story.append(Spacer(1, 12))
story.append(toc)
story.append(PageBreak())

# ════════════════════════════════════════════════════
# 1. RESUME EXECUTIF
# ════════════════════════════════════════════════════
story.extend(add_major_section('1. Resume executif'))

story.append(Paragraph(
    "Ce rapport presente les resultats de l'audit end-to-end (E2E) complet de la plateforme "
    "ONIT-PNG (Observatoire National Intelligent des Telecommunications), developpee pour l'Autorite "
    "de Regulation des Postes et Telecommunications (ARPT) de la Republique de Guinee. L'audit couvre "
    "l'ensemble des composants de l'application : infrastructure, securite, architecture API, base de "
    "donnees, interface utilisateur et deploiement.", body_style))

story.append(Paragraph(
    "La plateforme ONIT-PNG est une application Next.js 16 utilisant Prisma ORM avec SQLite, "
    "NextAuth v4 pour l'authentification, et une architecture RBAC (Role-Based Access Control) "
    "avec politique RLS (Row-Level Security) pour le filtrage des donnees par role et par organisation. "
    "L'application comprend 15+ routes API, 9 tableaux de bord specialises, un systeme d'import "
    "de donnees (CSV/JSON), une API prestataire avec authentification par cle API securisee, et "
    "un systeme complet d'audit trail.", body_style))

story.append(Paragraph(
    "L'audit revele que la plateforme est dans un etat globalement satisfaisant avec des fondations "
    "architecturales solides. Cependant, plusieurs axes d'amelioration critiques ont ete identifies, "
    "notamment en matiere de securite avancee, de performance a l'echelle, de strategie de base de "
    "donnees pour la production, et d'observabilite operationnelle. Les recommandations sont classees "
    "par priorite : critique (a traiter avant toute mise en production), importante (a planifier rapidement), "
    "et souhaitable (ameliorations continues).", body_style))

# Summary KPI table
summary_data = [
    [Paragraph('<b>Domaine</b>', header_cell_style),
     Paragraph('<b>Statut</b>', header_cell_style),
     Paragraph('<b>Score</b>', header_cell_style),
     Paragraph('<b>Priorite</b>', header_cell_style)],
    [Paragraph('Securite', cell_style), Paragraph('Partiel', cell_center),
     Paragraph('6/10', cell_center), Paragraph('Critique', cell_center)],
    [Paragraph('Architecture API', cell_style), Paragraph('Bon', cell_center),
     Paragraph('8/10', cell_center), Paragraph('Important', cell_center)],
    [Paragraph('Base de donnees', cell_style), Paragraph('Partiel', cell_center),
     Paragraph('5/10', cell_center), Paragraph('Critique', cell_center)],
    [Paragraph('Authentification', cell_style), Paragraph('Bon', cell_center),
     Paragraph('7/10', cell_center), Paragraph('Important', cell_center)],
    [Paragraph('RBAC / RLS', cell_style), Paragraph('Tres bon', cell_center),
     Paragraph('9/10', cell_center), Paragraph('Souhaitable', cell_center)],
    [Paragraph('Deploiement', cell_style), Paragraph('Partiel', cell_center),
     Paragraph('6/10', cell_center), Paragraph('Critique', cell_center)],
    [Paragraph('Observabilite', cell_style), Paragraph('Insuffisant', cell_center),
     Paragraph('3/10', cell_center), Paragraph('Critique', cell_center)],
    [Paragraph('Tests', cell_style), Paragraph('Partiel', cell_center),
     Paragraph('5/10', cell_center), Paragraph('Important', cell_center)],
    [Paragraph('Code qualite', cell_style), Paragraph('Bon', cell_center),
     Paragraph('7/10', cell_center), Paragraph('Souhaitable', cell_center)],
]
cw = [CONTENT_W*0.35, CONTENT_W*0.20, CONTENT_W*0.20, CONTENT_W*0.25]
story.append(Spacer(1, 12))
story.append(make_table(summary_data, col_widths=cw))
story.append(Paragraph('Tableau 1 : Synthese des scores par domaine d\'audit', caption_style))
story.append(Spacer(1, 12))

# ════════════════════════════════════════════════════
# 2. SECURITE
# ════════════════════════════════════════════════════
story.extend(add_major_section('2. Securite'))

story.append(add_heading('2.1 Points forts identifie', h2_style, level=1))

story.append(Paragraph(
    "La plateforme dispose de plusieurs mecanismes de securite bien implementes qui constituent "
    "une base solide. L'authentification utilise NextAuth v4 avec une strategie JWT, des cookies "
    "securises (httpOnly, SameSite=Lax, Secure en production), et une validation du secret "
    "NEXTAUTH_SECRET au demarrage avec un fallback explicite en developpement. Le hachage des "
    "mots de passe utilise bcryptjs avec un cost factor de 12, ce qui est conforme aux bonnes "
    "pratiques actuelles.", body_style))

story.append(Paragraph(
    "Le systeme RBAC est particulierement bien concu avec 9 roles hierarchiques (de SUPER_ADMIN "
    "a PUBLIC), des permissions granulaires par ressource et action (read/write/admin), et un "
    "filtrage RLS (Row-Level Security) qui limite automatiquement l'acces aux donnees en fonction "
    "du role et de l'organisation de l'utilisateur. Ce filtrage s'applique de maniere coherente "
    "sur toutes les routes API qui manipulent des donnees operateur ou region.", body_style))

story.append(Paragraph(
    "Les routes API utilisent systematiquement la validation Zod pour les entrees, avec des "
    "transformations de sanitisation HTML (stripHtml) qui preveninent les attaques XSS. Le "
    "rate limiting est implemente sur les endpoints sensibles (alertes, prestataires) avec "
    "des limites appropriees. Les cles API prestataires sont hachees en SHA-256 avant stockage, "
    "et leur validation se fait par comparaison de hachage, jamais en clair.", body_style))

story.append(add_heading('2.2 Vulnerabilites critiques', h2_style, level=1))

story.append(Paragraph(
    '<b>V-CRIT-01 : Secret NEXTAUTH_SECRET expose et fallback faible</b>', callout_critical))
story.append(Paragraph(
    "Le fichier .env contient le secret NEXTAUTH_SECRET en clair et ce meme secret est utilise "
    "comme valeur par defaut dans docker-compose.yml. En cas d'acces non autorise au depot de "
    "code source ou a la configuration Docker, un attaquant peut forger des jetons JWT valides "
    "et prendre le controle total de l'application. De plus, le code source contient un fallback "
    "hardcoded ('dev-only-secret-do-not-use-in-production') qui, bien qu'accompagne d'un avertissement, "
    "represente un risque si l'environnement est mal configure.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager, ou "
    "variables d'environnement Docker Swarm/Kubernetes secrets). Supprimer le fallback hardcoded. "
    "Le demarrage de l'application doit echouer immediatement si NEXTAUTH_SECRET n'est pas defini "
    "en production, sans fallback possible.", body_style))

story.append(Paragraph(
    '<b>V-CRIT-02 : Absence de protection CSRF sur les routes API</b>', callout_critical))
story.append(Paragraph(
    "Bien que NextAuth fournisse un jeton CSRF pour les routes d'authentification, les autres "
    "routes API (POST /api/mesures, POST /api/scores, POST /api/campaigns, PATCH /api/users, etc.) "
    "ne verifient pas la presence d'un jeton CSRF. Un attaquant peut concevoir une page web "
    "malveillante qui soumet des requetes POST au nom d'un utilisateur authentifie (attaque CSRF), "
    "modifiant ainsi des donnees sans le consentement de la victime. Cette vulnerabilite est "
    "particulierement critique pour les operations d'ecriture sur les mesures QoS et les scores "
    "des operateurs.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Implementer un middleware CSRF qui genère un jeton par session et "
    "verifie sa presence dans les en-tetes (X-CSRF-Token) ou dans le corps des requetes POST/PATCH/DELETE. "
    "Alternativement, exiger l'en-tete Content-Type: application/json pour toutes les requetes "
    "mutantes (ce qui bloque les soumissions de formulaires HTML classiques).", body_style))

story.append(Paragraph(
    '<b>V-CRIT-03 : Absence de verrouillage de compte apres echecs</b>', callout_critical))
story.append(Paragraph(
    "L'authentification n'implemente aucun mecanisme de verrouillage de compte apres un nombre "
    "d'echecs consecutifs. Un attaquant peut effectuer des attaques par force brute ou par "
    "dictionnaire sans aucune limitation au niveau du compte. Le rate limiting existant est "
    "base sur l'adresse IP, ce qui est insuffisant contre les attaques distribuees ou les "
    "attaquants utilisant des proxies rotatifs. De plus, le message d'erreur retourne lors "
    "d'un echec de connexion ne divulgue pas d'information sensible, ce qui est positif, mais "
    "l'absence de verrouillage reste une faille majeure pour un systeme reglementaire.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Implementer un compteur d'echecs par compte utilisateur avec "
    "verrouillage progressif (5 echecs = 15 min, 10 echecs = 1h, 20 echecs = compte desactive). "
    "Logger les tentatives echouees dans l'audit trail avec l'adresse IP. Envoyer une notification "
    "a l'administrateur en cas de tentative suspecte.", body_style))

story.append(add_heading('2.3 Vulnerabilites importantes', h2_style, level=1))

story.append(Paragraph(
    '<b>V-IMP-01 : Rate limiting en memoire uniquement</b>', callout_warning))
story.append(Paragraph(
    "Le systeme de rate limiting utilise un Map en memoire (Map&lt;string, {count, resetTime}&gt;). "
    "Cette approche presente trois problemes majeurs en production. Premierement, les compteurs "
    "sont perdus a chaque redemarrage du serveur, permettant a un attaquant de contourner les "
    "limites en provoquant des redemarrages. Deuxiement, dans un deploiement multi-instance (load "
    "balancer), chaque instance maintient ses propres compteurs, divisant effectivement les limites "
    "par le nombre d'instances. Troisiemement, le nettoyage periodique via setInterval ne garantit "
    "pas une liberation immediate de la memoire sous forte charge.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Migrer le rate limiting vers Redis avec une strategy sliding window. "
    "Redis offre la persistance, le partage entre instances, et l'expiration automatique des cles. "
    "Si Redis n'est pas disponible, utiliser une base de donnees dediee avec un TTL.", body_style))

story.append(Paragraph(
    '<b>V-IMP-02 : Generation de cles API avec Math.random()</b>', callout_warning))
story.append(Paragraph(
    "La fonction generateApiKey() dans utils-api.ts utilise Math.random() pour generer la partie "
    "secrete des cles API. Math.random() n'est pas cryptographiquement sur et produit des sequences "
    "previsibles si le seed interne est devinable. Un attaquant determinant pourrait theoriquement "
    "generer des cles API valides pour un operateur donne.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Remplacer Math.random() par crypto.randomBytes(32) du module "
    "'crypto' de Node.js, qui utilise le generateur pseudo-aleatoire cryptographique du systeme "
    "d'exploitation (CSPRNG).", body_style))

story.append(Paragraph(
    '<b>V-IMP-03 : Absence de headers de securite HTTP</b>', callout_warning))
story.append(Paragraph(
    "L'application ne configure pas les en-tetes de securite HTTP recommandes : "
    "Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, "
    "X-Frame-Options, et Referrer-Policy. Sans CSP, l'application est vulnerable aux attaques XSS "
    "par injection de scripts meme avec la sanitisation Zod. Sans HSTS, les cookies de session "
    "peuvent etre interceptes lors d'une attaque man-in-the-middle sur la premiere connexion.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Ajouter un middleware Next.js qui injecte les en-tetes de securite "
    "sur toutes les reponses. Configurer CSP pour n'autoriser que les sources de scripts necessaires, "
    "HSTS avec un max-age d'au moins 1 an, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, "
    "et Referrer-Policy: strict-origin-when-cross-origin.", body_style))

story.append(add_heading('2.4 Ameliorations souhaitees de securite', h2_style, level=1))

story.append(Paragraph(
    '<b>V-SOU-01 : Absence d\'authentification multi-facteurs (2FA)</b>', callout_info))
story.append(Paragraph(
    "Pour une plateforme reglementaire gerant des donnees sensibles de telecommunications, "
    "l'authentification a facteur unique represente un risque acceptable uniquement si d'autres "
    "mesures compensatoires sont en place. L'ajout d'une authentification TOTP (Time-based "
    "One-Time Password) pour les roles admin et super-admin renforcerait significativement la "
    "posture de securite. L'implementation peut se faire via la bibliotheque otplib et un "
    "mechanisme de verification dans le callback authorize() de NextAuth.", body_style))

story.append(Paragraph(
    '<b>V-SOU-02 : Pas de rotation automatique des cles API</b>', callout_info))
story.append(Paragraph(
    "Les cles API prestataires sont statiques et n'ont pas de mecanisme d'expiration ou de "
    "rotation. Une cle compromise reste valide indefiniment. Il est recommande d'ajouter une "
    "date d'expiration aux cles API (ex: 90 jours) et un mecanisme de rotation sans interruption "
    "de service (generer une nouvelle cle pendant que l'ancienne reste valide pendant une "
    "periode de grace de 24h).", body_style))

# ════════════════════════════════════════════════════
# 3. BASE DE DONNEES
# ════════════════════════════════════════════════════
story.extend(add_major_section('3. Base de donnees et persistance'))

story.append(add_heading('3.1 SQLite : limites pour la production', h2_style, level=1))

story.append(Paragraph(
    "L'application utilise SQLite comme systeme de gestion de base de donnees via Prisma ORM. "
    "Si SQLite est parfaitement adapte au developpement et aux petites deployments mono-instance, "
    "il presente des limitations structurelles pour un usage en production a l'echelle nationale. "
    "SQLite ne supporte qu'un seul writer a la fois, ce qui signifie que toutes les operations "
    "d'ecriture sont serialisees. Sous charge concurrente (plusieurs utilisateurs important des "
    "donnees simultanement, ou plusieurs prestataires soumettant des mesures), les performances "
    "se degradent rapidement avec des contentions de verrous.", body_style))

story.append(Paragraph(
    "De plus, SQLite ne supporte pas les connexions reseau, ce qui rend impossible un deploiement "
    "multi-instance avec partage de base de donnees. Le fichier de base de donnees est stocke "
    "localement (file:/home/z/my-project/db/custom.db), ce qui cree une dependance forte au "
    "systeme de fichiers de la machine hote et complique les sauvegardes, la reprise apres "
    "sinistre, et la mise a l'echelle horizontale.", body_style))

db_data = [
    [Paragraph('<b>Critere</b>', header_cell_style),
     Paragraph('<b>SQLite</b>', header_cell_style),
     Paragraph('<b>PostgreSQL</b>', header_cell_style)],
    [Paragraph('Concurrence ecriture', cell_style),
     Paragraph('Serialisee (1 writer)', cell_center),
     Paragraph('Multi-writer MVCC', cell_center)],
    [Paragraph('Connexions reseau', cell_style),
     Paragraph('Non', cell_center),
     Paragraph('Oui (TCP)', cell_center)],
    [Paragraph('Index partiels', cell_style),
     Paragraph('Non', cell_center),
     Paragraph('Oui', cell_center)],
    [Paragraph('Full-text search', cell_style),
     Paragraph('FTS5 (basique)', cell_center),
     Paragraph('tsvector (avance)', cell_center)],
    [Paragraph('Scalabilite', cell_style),
     Paragraph('Mono-instance', cell_center),
     Paragraph('Horizontale', cell_center)],
    [Paragraph('Sauvegarde a chaud', cell_style),
     Paragraph('Limitation', cell_center),
     Paragraph('WAL streaming', cell_center)],
]
cw_db = [CONTENT_W*0.35, CONTENT_W*0.325, CONTENT_W*0.325]
story.append(Spacer(1, 12))
story.append(make_table(db_data, col_widths=cw_db))
story.append(Paragraph('Tableau 2 : Comparaison SQLite vs PostgreSQL pour ONIT-PNG', caption_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    "<b>Recommandation :</b> Migrer vers PostgreSQL pour la production. Prisma ORM facilite "
    "cette migration car il abstrait les differences SQL. Le schema Prisma actuel est compatible "
    "avec PostgreSQL (les enums, les relations, et les contraintes uniques sont supportes). "
    "La migration implique principalement le changement de la chaine de connexion DATABASE_URL "
    "et l'execution de prisma migrate deploy. Un plan de migration progressif est recommande : "
    "maintenir SQLite en developpement et PostgreSQL en staging/production.", body_style))

story.append(add_heading('3.2 Performance des requetes', h2_style, level=1))

story.append(Paragraph(
    "L'audit du code API revele un probleme de performance N+1 dans la route du tableau de "
    "bord principal (/api/dashboard/route.ts). La section calculant les statistiques par region "
    "execute une boucle de requetes SQL individuelles pour chaque region (comptage total, comptage "
    "couvert, aggregation QoE, comptage zones blanches), generant potentiellement 4*N requetes "
    "supplementaires ou N est le nombre de regions (8 en Guinee). Pour un total de 32 requetes "
    "supplementaires par appel au tableau de bord, ce qui est sous-optimal.", body_style))

story.append(Paragraph(
    "<b>Recommandation :</b> Remplacer la boucle de requetes individuelles par des requetes "
    "d'agregation groupBy. Par exemple, utiliser prisma.mesureQoS.groupBy({ by: ['regionId'], "
    "_count: true }) pour obtenir les comptes par region en une seule requete. Pour les metriques "
    "QoE, utiliser une requete SQL brute avec GROUP BY et AVG(). Cette optimisation reduirait "
    "le nombre de requetes de 32 a 4-5 environ, ameliorant le temps de reponse du dashboard "
    "de maniere significative.", body_style))

story.append(add_heading('3.3 Strategie d\'indexation', h2_style, level=1))

story.append(Paragraph(
    "Le schema Prisma actuel ne definit pas d'index explicites au-dela des cles primaires et "
    "des contraintes uniques. Pour les requetes frequentes identifiees dans l'audit, les index "
    "suivants sont recommandes pour ameliorer significativement les performances de lecture. "
    "Ces index sont particulierement importants lorsque le volume de mesures QoS augmente "
    "(des milliers a des centaines de milliers d'enregistrements).", body_style))

idx_data = [
    [Paragraph('<b>Table</b>', header_cell_style),
     Paragraph('<b>Index</b>', header_cell_style),
     Paragraph('<b>Justification</b>', header_cell_style)],
    [Paragraph('MesureQoS', cell_style),
     Paragraph('operateurId + timestamp', cell_style),
     Paragraph('Filtrage principal du dashboard', cell_style)],
    [Paragraph('MesureQoS', cell_style),
     Paragraph('regionId + timestamp', cell_style),
     Paragraph('Statistiques par region', cell_style)],
    [Paragraph('MesureQoS', cell_style),
     Paragraph('campagneId', cell_style),
     Paragraph('Liste des mesures par campagne', cell_style)],
    [Paragraph('Alerte', cell_style),
     Paragraph('operateurId + isResolved', cell_style),
     Paragraph('Comptage alertes actives par operateur', cell_style)],
    [Paragraph('Alerte', cell_style),
     Paragraph('type + isResolved + regionId', cell_style),
     Paragraph('Zones blanches par region', cell_style)],
    [Paragraph('ScoreOperateur', cell_style),
     Paragraph('operateurId + periode', cell_style),
     Paragraph('Dernier score par operateur (deja unique)', cell_style)],
    [Paragraph('AuditLog', cell_style),
     Paragraph('userId + createdAt', cell_style),
     Paragraph('Journal d\'audit par utilisateur', cell_style)],
]
cw_idx = [CONTENT_W*0.18, CONTENT_W*0.35, CONTENT_W*0.47]
story.append(Spacer(1, 12))
story.append(make_table(idx_data, col_widths=cw_idx))
story.append(Paragraph('Tableau 3 : Index recommandes pour la production', caption_style))
story.append(Spacer(1, 12))

story.append(add_heading('3.4 Strategie de migration', h2_style, level=1))

story.append(Paragraph(
    "L'application utilise actuellement prisma db push au lieu de prisma migrate dev pour "
    "la gestion du schema. La commande db push est concue pour le prototypage rapide et ne "
    "maintient pas d'historique des migrations. En production, c'est un risque majeur car "
    "il n'y a pas de traconabilite des changements de schema, pas de rollback possible, et "
    "pas de garantie que la base de donnees de production est dans un etat coherent avec le code. "
    "Pour un systeme reglementaire comme ONIT-PNG, la tracabilite des changements de schema "
    "est une exigence fondamentale.", body_style))

story.append(Paragraph(
    "<b>Recommandation :</b> Adopter Prisma Migrate comme strategie de gestion du schema. "
    "Creer la migration initiale a partir du schema actuel avec prisma migrate dev --name init. "
    "Ensuite, chaque modification du schema doit generer une migration avec prisma migrate dev "
    "--name description_du_changement. En production, utiliser prisma migrate deploy (pas dev) "
    "pour appliquer les migrations de maniere controlee. Stocker les fichiers de migration dans "
    "le depot de code source pour tracabilite.", body_style))

# ════════════════════════════════════════════════════
# 4. ARCHITECTURE API
# ════════════════════════════════════════════════════
story.extend(add_major_section('4. Architecture API et code'))

story.append(add_heading('4.1 Points forts', h2_style, level=1))

story.append(Paragraph(
    "L'architecture API est globalement bien concue avec une separation claire des responsabilites. "
    "Les routes API suivent un modele coherent : validation des permissions via RBAC, filtrage RLS "
    "des donnees, validation Zod des entrees, operations Prisma, et journalisation d'audit. "
    "La couche de librairie (src/lib/) est bien organisee avec des modules dedies : rbac.ts pour "
    "les permissions, error-handler.ts pour la gestion centralisee des erreurs, logger.ts pour "
    "la journalisation structuree, utils-api.ts pour les utilitaires partages, et db.ts pour "
    "le singleton PrismaClient.", body_style))

story.append(Paragraph(
    "L'API prestataire (/api/prestataires/) merite une mention speciale pour sa conception "
    "securisee. Elle utilise une authentification par cle API (X-API-Key) avec validation "
    "contre un hachage SHA-256 stocke en base, un rate limiting dedie (30 req/min), une "
    "journalisation d'audit specifique aux prestataires, et une validation Zod complete "
    "avec sanitisation HTML. Ce modele pourrait servir de reference pour d'autres endpoints "
    "externes futurs.", body_style))

story.append(add_heading('4.2 Code smells et ameliorations', h2_style, level=1))

story.append(Paragraph(
    '<b>CS-01 : Repetition du cast de session utilisateur</b>', callout_info))
story.append(Paragraph(
    "Chaque route API repete le meme pattern de cast : (session.user as Record&lt;string, "
    "unknown&gt;).role, (session.user as Record&lt;string, unknown&gt;).id, etc. Ce pattern "
    "est verbeux, sujet aux erreurs de frappe, et difficile a maintenir. Il existe environ "
    "30+ occurrences a travers le codebase.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Creer un fichier src/lib/session.ts avec des fonctions typees : "
    "getUserRole(session), getUserId(session), getUserOrg(session). Ces fonctions centralisent "
    "le cast et garantissent la coherence. Ajouter le type etendu dans next-auth.d.ts pour "
    "que TypeScript reconnaisse les proprietes etendues du session.user.", body_style))

story.append(Paragraph(
    '<b>CS-02 : Duplication de stripHtml</b>', callout_info))
story.append(Paragraph(
    "La fonction stripHtml (val.replace(/&lt;[^&gt;]*&gt;/g, '')) est definie independamment "
    "dans au moins 5 fichiers de routes API (alerts, scores, mesures, campaigns, reports) alors "
    "qu'elle existe deja dans utils-api.ts. Cette duplication cree un risque d'incoherence si "
    "un bug est corrige dans une copie mais pas dans les autres.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Supprimer les definitions locales et utiliser l'import depuis "
    "@/lib/utils-api : import { stripHtml } from '@/lib/utils-api'.", body_style))

story.append(Paragraph(
    '<b>CS-03 : Typage insuffisant des operations Prisma en masse</b>', callout_info))
story.append(Paragraph(
    "Plusieurs operations d'insertion en masse utilisent des casts 'as any' pour contourner "
    "les types Prisma stricts : db.mesureQoS.createMany({ data: chunk as any }). Ces casts "
    "suppriment la verification de type et pourraient masquer des erreurs de structure de "
    "donnees.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Definir des types Prisma.Prisma.MesureQoSCreateManyInput[] "
    "explicites pour les donnees d'insertion en masse. Utiliser les types generes par Prisma "
    "plutot que des types ad hoc.", body_style))

story.append(add_heading('4.3 Gestion des erreurs', h2_style, level=1))

story.append(Paragraph(
    "La gestion des erreurs est partiellement centralisee. Le module error-handler.ts definit "
    "des classes d'erreur personnalisees (AppError, ValidationError, AuthenticationError, "
    "AuthorizationError, NotFoundError) et une fonction handleApiError() pour formater les "
    "reponses d'erreur de maniere coherente. Cependant, la plupart des routes API utilisent "
    "encore le pattern try/catch avec console.error() et NextResponse.json() directs, sans "
    "passer par handleApiError(). Seule la route /api/dashboard/route.ts utilise cette "
    "fonction centralisee.", body_style))

story.append(Paragraph(
    "<b>Recommandation :</b> Generaliser l'utilisation de handleApiError() dans toutes les "
    "routes API. Standardiser le format d'erreur de reponse : { error: string, code?: string, "
    "details?: object }. Utiliser les classes d'erreur personnalisees dans les routes API "
    "pour lever des erreurs specifiques qui seront interceptees et formatees par le handler "
    "centralise. Ajouter les codes d'erreur normalises (VALIDATION_ERROR, AUTHENTICATION_ERROR, "
    "etc.) dans toutes les reponses d'erreur.", body_style))

# ════════════════════════════════════════════════════
# 5. DEPLOIEMENT
# ════════════════════════════════════════════════════
story.extend(add_major_section('5. Deploiement et infrastructure'))

story.append(add_heading('5.1 Configuration Docker', h2_style, level=1))

story.append(Paragraph(
    "L'application dispose d'un Dockerfile multi-stage bien concu avec trois etapes : "
    "dependencies, builder, et runner. Le runner utilise un utilisateur non-root (nextjs), "
    "ce qui est une bonne pratique de securite. Le healthcheck verifie l'endpoint /api/auth/session "
    "avec des parametres raisonnables (30s interval, 10s timeout, 3 retries). Cependant, "
    "plusieurs problemes ont ete identifies dans la configuration de deploiement.", body_style))

story.append(Paragraph(
    '<b>D-CRIT-01 : Secret par defaut dans docker-compose.yml</b>', callout_critical))
story.append(Paragraph(
    "Le fichier docker-compose.yml contient un secret par defaut hardcoded : "
    "NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-onit-png-secret-key-2026-guinee-docker}. "
    "Ce secret est visible dans le depot de code source et peut etre utilise en production "
    "si la variable d'environnement n'est pas explicitement definie. Combine avec la "
    "vulnerabilite V-CRIT-01, ceci cree un risque de forge de jetons JWT.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Supprimer la valeur par defaut du secret dans docker-compose.yml. "
    "Le fichier docker-compose.yml doit echouer au demarrage si NEXTAUTH_SECRET n'est pas "
    "defini. Utiliser Docker secrets ou un fichier .env.docker (exclu du depot) pour fournir "
    "les secrets au conteneur.", body_style))

story.append(Paragraph(
    '<b>D-IMP-01 : Absence de strategie de sauvegarde de base de donnees</b>', callout_warning))
story.append(Paragraph(
    "La base de donnees SQLite est montee dans un volume Docker (onit-db:/app/db), mais "
    "aucun mecanisme de sauvegarde automatique n'est configure. En cas de corruption du "
    "fichier SQLite ou de perte du volume, toutes les donnees sont perdues definitivement. "
    "Pour un systeme reglementaire, la perte de donnees de mesures QoS et de journaux d'audit "
    "est inacceptable et pourrait avoir des consequences legales.", body_style))
story.append(Paragraph(
    "<b>Recommandation :</b> Implementer un cron job de sauvegarde qui : (1) effectue un "
    "snapshot SQLite toutes les 6 heures via sqlite3 db .dump, (2) compresse et chiffre "
    "le dump, (3) le stocke dans un emplacement externe (S3, stockage objet, serveur de "
    "sauvegarde dedie). Tester regulierement la restauration. Ajouter un script de "
    "verification d'integrite (PRAGMA integrity_check) dans le healthcheck.", body_style))

story.append(add_heading('5.2 Reverse proxy et TLS', h2_style, level=1))

story.append(Paragraph(
    "Le Caddyfile configure un reverse proxy sur le port 81 vers le port 3000 de "
    "l'application. La configuration inclut les en-tetes X-Forwarded-For, X-Forwarded-Proto, "
    "et X-Real-IP, ce qui est correct. Cependant, la configuration n'utilise pas les "
    "capacites de gestion automatique de TLS de Caddy, qui est l'un des principaux avantages "
    "de ce serveur. Sans TLS, les communications entre le client et le serveur transitent "
    "en clair, exposant les cookies de session et les donnees sensibles.", body_style))

story.append(Paragraph(
    "<b>Recommandation :</b> Configurer Caddy avec un nom de domaine et activer le HTTPS "
    "automatique. Caddy gere automatiquement l'obtention et le renouvellement des certificats "
    "Let's Encrypt. Exemple : onit.arpt.gn { reverse_proxy localhost:3000 }. "
    "Si un domaine n'est pas encore disponible, utiliser au minimum un certificat "
    "auto-signe pour le staging et configurer HSTS.", body_style))

story.append(add_heading('5.3 Observabilite', h2_style, level=1))

story.append(Paragraph(
    "L'observabilite de l'application est actuellement insuffisante pour un systeme en "
    "production. Le logger implemente des niveaux de journalisation (debug, info, warn, error) "
    "avec un format structure, mais les logs sont diriges uniquement vers la console. Il n'y "
    "a pas de collecte centralisee, pas de metriques d'application (Prometheus, Datadog), pas "
    "de tracing distribue, et pas de tableau de bord de monitoring. Pour un systeme national "
    "de supervision des telecommunications, l'absence d'observabilite rend le diagnostic des "
    "problemes en production extremement difficile.", body_style))

story.append(Paragraph(
    "<b>Recommandation :</b> Implementer une strategie d'observabilite en trois couches. "
    "Premierement, ajouter un endpoint /api/health qui retourne le statut de l'application, "
    "de la base de donnees, et des services dependants. Deuxiemement, integrer un systeme "
    "de metriques (compteur de requetes, temps de reponse par endpoint, nombre d'erreurs, "
    "nombre d'utilisateurs actifs) expose au format Prometheus. Troisiemement, configurer "
    "la journalisation structuree vers un agrégateur de logs (ELK, Loki, ou CloudWatch).", body_style))

# ════════════════════════════════════════════════════
# 6. TESTS
# ════════════════════════════════════════════════════
story.extend(add_major_section('6. Tests et assurance qualite'))

story.append(add_heading('6.1 Etat actuel des tests', h2_style, level=1))

story.append(Paragraph(
    "L'application dispose d'une suite de tests E2E Playwright dans le repertoire e2e/ "
    "couvrant les scenarios suivants : authentification, API utilisateurs/roles/scores, "
    "API campagnes, API mesures, API alertes, API prestataires, API rapports, navigation UI, "
    "carte SIG, et scenarios de production. C'est une base solide qui couvre les principaux "
    "parcours utilisateurs et les endpoints API critiques.", body_style))

story.append(Paragraph(
    "Cependant, il n'existe aucun test unitaire pour les fonctions critiques des librairies "
    "partagees (rbac.ts, utils-api.ts, error-handler.ts). Les fonctions comme checkPermission(), "
    "getAccessibleOperators(), validateApiKeySecure(), et checkRateLimit() sont essentielles "
    "a la securite de l'application et devraient etre testees unitairement avec des cas "
    "limites et des scenarios d'erreur.", body_style))

test_data = [
    [Paragraph('<b>Type de test</b>', header_cell_style),
     Paragraph('<b>Existant</b>', header_cell_style),
     Paragraph('<b>Couverture</b>', header_cell_style),
     Paragraph('<b>Recommandation</b>', header_cell_style)],
    [Paragraph('E2E Playwright', cell_style),
     Paragraph('Oui', cell_center), Paragraph('Moyenne', cell_center),
     Paragraph('Etendre les cas limites', cell_style)],
    [Paragraph('Tests unitaires', cell_style),
     Paragraph('Non', cell_center), Paragraph('0%', cell_center),
     Paragraph('Priorite haute pour lib/', cell_style)],
    [Paragraph('Tests integration API', cell_style),
     Paragraph('Partiel', cell_center), Paragraph('Faible', cell_center),
     Paragraph('Ajouter tests sans UI', cell_style)],
    [Paragraph('Tests de charge', cell_style),
     Paragraph('Non', cell_center), Paragraph('0%', cell_center),
     Paragraph('k6 ou Artillery', cell_style)],
    [Paragraph('Tests de securite', cell_style),
     Paragraph('Non', cell_center), Paragraph('0%', cell_center),
     Paragraph('OWASP ZAP', cell_style)],
]
cw_test = [CONTENT_W*0.20, CONTENT_W*0.13, CONTENT_W*0.17, CONTENT_W*0.50]
story.append(Spacer(1, 12))
story.append(make_table(test_data, col_widths=cw_test))
story.append(Paragraph('Tableau 4 : Etat et recommandations des tests', caption_style))
story.append(Spacer(1, 12))

story.append(add_heading('6.2 Recommandations de tests', h2_style, level=1))

story.append(Paragraph(
    "<b>Priorite 1 - Tests unitaires des librairies critiques :</b> Creer des suites de tests "
    "Jest ou Vitest pour rbac.ts (tester chaque role avec ses permissions attendues, tester "
    "les acces refuses, tester les cas limites ou les policies n'existent pas), utils-api.ts "
    "(tester la validation des cles API, le rate limiting avec differents scenarios de charge, "
    "la sanitisation HTML avec des payloads XSS), et error-handler.ts (tester chaque type "
    "d'erreur et son format de reponse).", body_style))

story.append(Paragraph(
    "<b>Priorite 2 - Tests d'integration API :</b> Utiliser un setup de test avec une base "
    "de donnees SQLite en memoire pour tester les routes API de bout en bout sans dependre "
    "de l'interface utilisateur. Ces tests doivent verifier les codes de statut HTTP, les "
    "formats de reponse, le filtrage RLS, et les validations Zod avec des donnees invalides.", body_style))

story.append(Paragraph(
    "<b>Priorite 3 - Tests de charge :</b> Utiliser k6 ou Artillery pour simuler un trafic "
    "realiste (50 utilisateurs simultanes, 1000 mesures importees en masse, 10 requetes "
    "dashboard par seconde). Identifier les goulots d'etranglement et les temps de reponse "
    "maximaux avant degradation.", body_style))

# ════════════════════════════════════════════════════
# 7. FEUILLE DE ROUTE
# ════════════════════════════════════════════════════
story.extend(add_major_section('7. Feuille de route des recommandations'))

story.append(add_heading('7.1 Phase 1 - Pre-production (2 semaines)', h2_style, level=1))

p1_data = [
    [Paragraph('<b>ID</b>', header_cell_style),
     Paragraph('<b>Recommandation</b>', header_cell_style),
     Paragraph('<b>Priorite</b>', header_cell_style),
     Paragraph('<b>Effort</b>', header_cell_style)],
    [Paragraph('V-CRIT-01', cell_center), Paragraph('Rotation secrets NEXTAUTH_SECRET', cell_style),
     Paragraph('Critique', cell_center), Paragraph('1 jour', cell_center)],
    [Paragraph('V-CRIT-02', cell_center), Paragraph('Protection CSRF sur API', cell_style),
     Paragraph('Critique', cell_center), Paragraph('2 jours', cell_center)],
    [Paragraph('V-CRIT-03', cell_center), Paragraph('Verrouillage compte echecs', cell_style),
     Paragraph('Critique', cell_center), Paragraph('1 jour', cell_center)],
    [Paragraph('D-CRIT-01', cell_center), Paragraph('Supprimer secret par defaut Docker', cell_style),
     Paragraph('Critique', cell_center), Paragraph('0.5 jour', cell_center)],
    [Paragraph('V-IMP-03', cell_center), Paragraph('Headers securite HTTP', cell_style),
     Paragraph('Critique', cell_center), Paragraph('1 jour', cell_center)],
    [Paragraph('V-IMP-02', cell_center), Paragraph('Crypto.randomBytes pour API keys', cell_style),
     Paragraph('Importante', cell_center), Paragraph('0.5 jour', cell_center)],
    [Paragraph('D-IMP-01', cell_center), Paragraph('Script sauvegarde base', cell_style),
     Paragraph('Importante', cell_center), Paragraph('1 jour', cell_center)],
]
cw_p1 = [CONTENT_W*0.12, CONTENT_W*0.48, CONTENT_W*0.15, CONTENT_W*0.25]
story.append(Spacer(1, 12))
story.append(make_table(p1_data, col_widths=cw_p1))
story.append(Paragraph('Tableau 5 : Phase 1 - Actions critiques pre-production', caption_style))
story.append(Spacer(1, 12))

story.append(add_heading('7.2 Phase 2 - Stabilisation (4 semaines)', h2_style, level=1))

p2_data = [
    [Paragraph('<b>ID</b>', header_cell_style),
     Paragraph('<b>Recommandation</b>', header_cell_style),
     Paragraph('<b>Priorite</b>', header_cell_style),
     Paragraph('<b>Effort</b>', header_cell_style)],
    [Paragraph('DB-01', cell_center), Paragraph('Migration PostgreSQL', cell_style),
     Paragraph('Critique', cell_center), Paragraph('3 jours', cell_center)],
    [Paragraph('DB-02', cell_center), Paragraph('Ajout index performance', cell_style),
     Paragraph('Importante', cell_center), Paragraph('1 jour', cell_center)],
    [Paragraph('DB-03', cell_center), Paragraph('Prisma Migrate', cell_style),
     Paragraph('Importante', cell_center), Paragraph('1 jour', cell_center)],
    [Paragraph('V-IMP-01', cell_center), Paragraph('Rate limiting Redis', cell_style),
     Paragraph('Importante', cell_center), Paragraph('2 jours', cell_center)],
    [Paragraph('CS-01', cell_center), Paragraph('Helper session type', cell_style),
     Paragraph('Importante', cell_center), Paragraph('1 jour', cell_center)],
    [Paragraph('CS-02', cell_center), Paragraph('Dedup stripHtml', cell_style),
     Paragraph('Importante', cell_center), Paragraph('0.5 jour', cell_center)],
    [Paragraph('CS-03', cell_center), Paragraph('Typage Prisma createMany', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('1 jour', cell_center)],
    [Paragraph('TEST-01', cell_center), Paragraph('Tests unitaires lib/', cell_style),
     Paragraph('Importante', cell_center), Paragraph('3 jours', cell_center)],
    [Paragraph('DEP-01', cell_center), Paragraph('Endpoint /api/health', cell_style),
     Paragraph('Importante', cell_center), Paragraph('1 jour', cell_center)],
    [Paragraph('DEP-02', cell_center), Paragraph('TLS Caddy', cell_style),
     Paragraph('Importante', cell_center), Paragraph('1 jour', cell_center)],
]
cw_p2 = [CONTENT_W*0.12, CONTENT_W*0.48, CONTENT_W*0.15, CONTENT_W*0.25]
story.append(Spacer(1, 12))
story.append(make_table(p2_data, col_widths=cw_p2))
story.append(Paragraph('Tableau 6 : Phase 2 - Stabilisation', caption_style))
story.append(Spacer(1, 12))

story.append(add_heading('7.3 Phase 3 - Maturite (8 semaines)', h2_style, level=1))

p3_data = [
    [Paragraph('<b>ID</b>', header_cell_style),
     Paragraph('<b>Recommandation</b>', header_cell_style),
     Paragraph('<b>Priorite</b>', header_cell_style),
     Paragraph('<b>Effort</b>', header_cell_style)],
    [Paragraph('V-SOU-01', cell_center), Paragraph('Authentification 2FA (TOTP)', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('3 jours', cell_center)],
    [Paragraph('V-SOU-02', cell_center), Paragraph('Rotation cles API', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('2 jours', cell_center)],
    [Paragraph('OBS-01', cell_center), Paragraph('Metriques Prometheus', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('3 jours', cell_center)],
    [Paragraph('OBS-02', cell_center), Paragraph('Logs structures (ELK/Loki)', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('2 jours', cell_center)],
    [Paragraph('TEST-02', cell_center), Paragraph('Tests integration API', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('3 jours', cell_center)],
    [Paragraph('TEST-03', cell_center), Paragraph('Tests de charge (k6)', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('2 jours', cell_center)],
    [Paragraph('TEST-04', cell_center), Paragraph('Scan securite OWASP ZAP', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('2 jours', cell_center)],
    [Paragraph('FEAT-01', cell_center), Paragraph('Notifications temps reel', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('5 jours', cell_center)],
    [Paragraph('FEAT-02', cell_center), Paragraph('Export PDF/Excel rapports', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('3 jours', cell_center)],
    [Paragraph('FEAT-03', cell_center), Paragraph('Versioning API (/v1/)', cell_style),
     Paragraph('Souhaitable', cell_center), Paragraph('2 jours', cell_center)],
]
cw_p3 = [CONTENT_W*0.12, CONTENT_W*0.48, CONTENT_W*0.15, CONTENT_W*0.25]
story.append(Spacer(1, 12))
story.append(make_table(p3_data, col_widths=cw_p3))
story.append(Paragraph('Tableau 7 : Phase 3 - Maturite', caption_style))
story.append(Spacer(1, 12))

# ════════════════════════════════════════════════════
# 8. CONCLUSION
# ════════════════════════════════════════════════════
story.extend(add_major_section('8. Conclusion'))

story.append(Paragraph(
    "La plateforme ONIT-PNG dispose de fondations solides pour un systeme de supervision "
    "des telecommunications au niveau national. L'architecture RBAC/RLS est particulierement "
    "bien concue et constitue un atout majeur pour un systeme reglementaire ou la separation "
    "des acces est primordiale. La validation systematique des entrees, la sanitisation HTML, "
    "et la journalisation d'audit sont des pratiques exemplaires qui temoignent d'une reflexion "
    "approfondie sur la securite.", body_style))

story.append(Paragraph(
    "Les recommandations formulees dans ce rapport visent a elever la plateforme au niveau "
    "exige par un deploiement en production pour un organisme de regulation. Les actions "
    "critiques (Phase 1) concernent principalement la securisation des secrets, la protection "
    "CSRF et le verrouillage des comptes, qui sont des prerequis indispensables avant toute "
    "mise en production. La Phase 2 adresse les problemes de performance et de fiabilite "
    "avec la migration PostgreSQL et l'observabilite. La Phase 3 prepare l'avenir avec "
    "des fonctionnalites avancees comme la 2FA, les metriques, et les notifications temps reel.", body_style))

story.append(Paragraph(
    "L'estimation totale des efforts pour les trois phases est d'environ 50 jours-homme, "
    "repartis sur 14 semaines. Cette feuille de route est realiste et permet une mise en "
    "production progressive tout en ameliorant continuellement la qualite et la securite de "
    "la plateforme. Il est recommande de commencer immediatement les actions de Phase 1, "
    "car elles representent les risques les plus eleves et les corrections les plus rapides.", body_style))

effort_data = [
    [Paragraph('<b>Phase</b>', header_cell_style),
     Paragraph('<b>Duree estimee</b>', header_cell_style),
     Paragraph('<b>Effort (j/h)</b>', header_cell_style),
     Paragraph('<b>Jalon</b>', header_cell_style)],
    [Paragraph('Phase 1 - Pre-production', cell_style),
     Paragraph('2 semaines', cell_center),
     Paragraph('7 jours', cell_center),
     Paragraph('Go/No-Go production', cell_style)],
    [Paragraph('Phase 2 - Stabilisation', cell_style),
     Paragraph('4 semaines', cell_center),
     Paragraph('18 jours', cell_center),
     Paragraph('Production stable', cell_style)],
    [Paragraph('Phase 3 - Maturite', cell_style),
     Paragraph('8 semaines', cell_center),
     Paragraph('25 jours', cell_center),
     Paragraph('Plateforme mature', cell_style)],
]
cw_effort = [CONTENT_W*0.30, CONTENT_W*0.20, CONTENT_W*0.20, CONTENT_W*0.30]
story.append(Spacer(1, 12))
story.append(make_table(effort_data, col_widths=cw_effort))
story.append(Paragraph('Tableau 8 : Synthese des phases et efforts', caption_style))

# ── Build ──
doc.multiBuild(story)
print(f"Body PDF generated: {BODY_PDF}")
