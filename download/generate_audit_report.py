#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ONIT-PNG — Rapport d'Audit Complet
Observatoire National Intelligent des Telecommunications — Republique de Guinee (ARPT)
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, Image, CondPageBreak
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ============================================================
# FONT REGISTRATION
# ============================================================
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans', '/usr/share/fonts/truetype/chinese/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerif', '/usr/share/fonts/truetype/chinese/LiberationSerif-Regular.ttf'))

registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSCBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')
registerFontFamily('LiberationSans', normal='LiberationSans', bold='LiberationSans')
registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerif')

# ============================================================
# PALETTE (auto-generated)
# ============================================================
ACCENT       = colors.HexColor('#5c34d2')
TEXT_PRIMARY  = colors.HexColor('#21201e')
TEXT_MUTED    = colors.HexColor('#837f76')
BG_SURFACE   = colors.HexColor('#e7e4df')
BG_PAGE      = colors.HexColor('#f4f2f0')
SURFACE_RGBA = 'rgba(0,0,0,0.02)'

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# Semantic colors
CRITICAL_RED   = colors.HexColor('#dc2626')
HIGH_ORANGE    = colors.HexColor('#ea580c')
MEDIUM_YELLOW  = colors.HexColor('#d97706')
LOW_GREEN      = colors.HexColor('#16a34a')
SCORE_RED      = colors.HexColor('#ef4444')
SCORE_ORANGE   = colors.HexColor('#f97316')
SCORE_YELLOW   = colors.HexColor('#eab308')
SCORE_GREEN    = colors.HexColor('#22c55e')

# ============================================================
# STYLES
# ============================================================
page_w, page_h = A4
left_margin = 1.0 * inch
right_margin = 1.0 * inch
available_width = page_w - left_margin - right_margin

styles = getSampleStyleSheet()

# Title styles
style_h1 = ParagraphStyle(
    name='H1', fontName='DejaVuSans', fontSize=20, leading=28,
    spaceBefore=18, spaceAfter=12, textColor=ACCENT, alignment=TA_LEFT
)
style_h2 = ParagraphStyle(
    name='H2', fontName='DejaVuSans', fontSize=15, leading=22,
    spaceBefore=14, spaceAfter=8, textColor=TEXT_PRIMARY, alignment=TA_LEFT
)
style_h3 = ParagraphStyle(
    name='H3', fontName='DejaVuSans', fontSize=12, leading=18,
    spaceBefore=10, spaceAfter=6, textColor=TEXT_PRIMARY, alignment=TA_LEFT
)

# Body styles
style_body = ParagraphStyle(
    name='Body', fontName='DejaVuSans', fontSize=10.5, leading=17,
    spaceBefore=0, spaceAfter=6, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY,
    wordWrap='CJK'
)
style_body_fr = ParagraphStyle(
    name='BodyFR', fontName='DejaVuSans', fontSize=10.5, leading=17,
    spaceBefore=0, spaceAfter=6, textColor=TEXT_PRIMARY, alignment=TA_LEFT,
    wordWrap='CJK'
)

# Table styles
style_th = ParagraphStyle(
    name='TH', fontName='DejaVuSans', fontSize=9.5, leading=14,
    textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK'
)
style_td = ParagraphStyle(
    name='TD', fontName='DejaVuSans', fontSize=9, leading=13,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK'
)
style_td_center = ParagraphStyle(
    name='TDCenter', fontName='DejaVuSans', fontSize=9, leading=13,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK'
)

# Caption
style_caption = ParagraphStyle(
    name='Caption', fontName='DejaVuSans', fontSize=9, leading=13,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6
)

# TOC styles
style_toc_h1 = ParagraphStyle(
    name='TOCH1', fontName='DejaVuSans', fontSize=13, leading=20,
    leftIndent=20, spaceBefore=4, spaceAfter=2
)
style_toc_h2 = ParagraphStyle(
    name='TOCH2', fontName='DejaVuSans', fontSize=11, leading=16,
    leftIndent=40, spaceBefore=2, spaceAfter=1
)

# ============================================================
# HELPER FUNCTIONS
# ============================================================
import hashlib

class TocDocTemplate:
    pass

from reportlab.platypus import SimpleDocTemplate

class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def make_table(headers, rows, col_ratios=None):
    """Create a styled table with header and data rows."""
    data = [[Paragraph('<b>%s</b>' % h, style_th) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), style_td) if not isinstance(c, Paragraph) else c for c in row])

    if col_ratios:
        col_widths = [r * available_width for r in col_ratios]
    else:
        col_widths = [available_width / len(headers)] * len(headers)

    table = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    table.setStyle(TableStyle(style_cmds))
    return table

def severity_badge(sev):
    """Return a colored Paragraph for severity badges."""
    color_map = {
        'CRITIQUE': CRITICAL_RED,
        'CRITICAL': CRITICAL_RED,
        'HAUTE': HIGH_ORANGE,
        'HIGH': HIGH_ORANGE,
        'MOYENNE': MEDIUM_YELLOW,
        'MEDIUM': MEDIUM_YELLOW,
        'BASSE': LOW_GREEN,
        'LOW': LOW_GREEN,
    }
    c = color_map.get(sev, TEXT_MUTED)
    return Paragraph('<b><font color="%s">%s</font></b>' % (c.hexval(), sev), style_td_center)

def score_bar(score, max_score=100):
    """Return a colored score indicator."""
    if score >= 80:
        c = SCORE_GREEN
    elif score >= 60:
        c = SCORE_YELLOW
    elif score >= 40:
        c = SCORE_ORANGE
    else:
        c = SCORE_RED
    return Paragraph('<font color="%s"><b>%d/%d</b></font>' % (c.hexval(), score, max_score), style_td_center)


# ============================================================
# BUILD DOCUMENT
# ============================================================
output_path = '/home/z/my-project/download/ONIT-PNG_Audit_Complet.pdf'

doc = TocDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=left_margin,
    rightMargin=right_margin,
    topMargin=0.8*inch,
    bottomMargin=0.8*inch,
)

story = []

# ───────────────────────────────────────────────────────────
# TABLE OF CONTENTS
# ───────────────────────────────────────────────────────────
story.append(Paragraph('<b>ONIT-PNG : Rapport d\'Audit Complet</b>', style_h1))
story.append(Spacer(1, 6))
story.append(Paragraph('Observatoire National Intelligent des Telecommunications - Republique de Guinee (ARPT)', style_body_fr))
story.append(Spacer(1, 18))

toc = TableOfContents()
toc.levelStyles = [style_toc_h1, style_toc_h2]
story.append(toc)
story.append(PageBreak())

# ════════════════════════════════════════════════════════════
# SECTION 1 : RESUME EXECUTIF
# ════════════════════════════════════════════════════════════
story.append(add_heading('1. Resume Executif', style_h1, level=0))
story.append(Spacer(1, 8))

story.append(Paragraph(
    'Ce rapport presente les resultats de l\'audit complet de la plateforme ONIT-PNG (Observatoire National '
    'Intelligent des Telecommunications de la Republique de Guinee), developpee pour le compte de l\'ARPT '
    '(Autorite de Regulation des Postes et Telecommunications). L\'audit couvre l\'ensemble des composantes '
    'backend (API, base de donnees, authentification, RBAC), frontend (composants React, UX, accessibilite) '
    'et la preparation au deploiement en production (Docker, securite, performance, monitoring).',
    style_body_fr
))
story.append(Spacer(1, 8))

story.append(Paragraph(
    'L\'audit a ete realise par analyse statique du code source, tests fonctionnels des endpoints API avec '
    'authentification reelle, verification de la base de donnees SQLite via Prisma, et evaluation de '
    'l\'infrastructure Docker. Chaque route API a ete testee individuellement, les mecanismes RBAC ont ete '
    'verifies avec differents roles utilisateur, et les vulnerabilites de securite ont ete confirmees par '
    'des tests d\'intrusion reussis (creation d\'alertes sans authentification, injection XSS stockee).',
    style_body_fr
))
story.append(Spacer(1, 12))

# Score summary table
story.append(add_heading('1.1 Synthese des Scores', style_h2, level=1))
story.append(Spacer(1, 6))

scores_table = make_table(
    ['Domaine', 'Score', 'Statut'],
    [
        [Paragraph('Backend (API + Auth + DB)', style_td), score_bar(38), Paragraph('<font color="#ef4444"><b>Non operationnel</b></font>', style_td_center)],
        [Paragraph('Frontend (UI + UX + Accessibilite)', style_td), score_bar(62), Paragraph('<font color="#f97316"><b>Partiel</b></font>', style_td_center)],
        [Paragraph('Production (Docker + Securite + Perf)', style_td), score_bar(28), Paragraph('<font color="#ef4444"><b>Non pret</b></font>', style_td_center)],
        [Paragraph('<b>SCORE GLOBAL</b>', style_td), score_bar(43), Paragraph('<font color="#ef4444"><b>Prototype</b></font>', style_td_center)],
    ],
    col_ratios=[0.50, 0.25, 0.25]
)
story.append(scores_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 1 : Synthese des scores d\'audit par domaine', style_caption))
story.append(Spacer(1, 12))

story.append(Paragraph(
    '<b>Conclusion principale :</b> La plateforme ONIT-PNG est un prototype fonctionnel qui demontre '
    'les fonctionnalites attendues, mais elle presente des lacunes critiques en matiere de securite '
    '(secrets en clair, pas de HTTPS, creation d\'alertes sans authentification), des bugs dans le '
    'controle d\'acces regionnal (RLS), et des donnees fictives en dur dans les tableaux de bord. '
    'Le systeme ne peut pas etre deploye en production dans son etat actuel sans corrections majeures.',
    style_body_fr
))
story.append(Spacer(1, 12))

# Critical findings count
story.append(add_heading('1.2 Decompte des Problemes', style_h2, level=1))
story.append(Spacer(1, 6))

count_table = make_table(
    ['Severite', 'Backend', 'Frontend', 'Production', 'Total'],
    [
        [severity_badge('CRITIQUE'), Paragraph('8', style_td_center), Paragraph('5', style_td_center), Paragraph('9', style_td_center), Paragraph('<b>22</b>', style_td_center)],
        [severity_badge('HAUTE'), Paragraph('7', style_td_center), Paragraph('7', style_td_center), Paragraph('9', style_td_center), Paragraph('<b>23</b>', style_td_center)],
        [severity_badge('MOYENNE'), Paragraph('6', style_td_center), Paragraph('8', style_td_center), Paragraph('6', style_td_center), Paragraph('<b>20</b>', style_td_center)],
        [severity_badge('BASSE'), Paragraph('5', style_td_center), Paragraph('10', style_td_center), Paragraph('4', style_td_center), Paragraph('<b>19</b>', style_td_center)],
    ],
    col_ratios=[0.20, 0.20, 0.20, 0.20, 0.20]
)
story.append(count_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 2 : Decompte des problemes par severite et domaine', style_caption))


# ════════════════════════════════════════════════════════════
# SECTION 2 : AUDIT BACKEND
# ════════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('2. Audit Backend', style_h1, level=0))
story.append(Spacer(1, 8))

story.append(Paragraph(
    'L\'audit backend couvre les 14 routes API, le systeme d\'authentification NextAuth v4, le modele '
    'de donnees Prisma avec SQLite, le systeme RBAC (Role-Based Access Control), et les politiques '
    'de restriction d\'acces aux donnees (Data Access Policies). Chaque route a ete testee avec et '
    'sans authentification pour verifier les controles d\'acces.',
    style_body_fr
))
story.append(Spacer(1, 12))

# 2.1 API Routes
story.append(add_heading('2.1 Routes API - Statut par Route', style_h2, level=1))
story.append(Spacer(1, 6))

api_routes_table = make_table(
    ['Route', 'Methode(s)', 'Auth', 'Validation', 'RLS', 'Statut'],
    [
        [Paragraph('/api/auth/[...nextauth]', style_td), Paragraph('GET/POST', style_td_center), Paragraph('N/A', style_td_center), Paragraph('Basique', style_td_center), Paragraph('N/A', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/dashboard', style_td), Paragraph('GET', style_td_center), Paragraph('<font color="#ef4444">Aucune</font>', style_td_center), Paragraph('Aucune', style_td_center), Paragraph('<font color="#ef4444">Bug</font>', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/qos', style_td), Paragraph('GET', style_td_center), Paragraph('OK', style_td_center), Paragraph('Aucune', style_td_center), Paragraph('<font color="#ef4444">Bug</font>', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/scoring', style_td), Paragraph('GET', style_td_center), Paragraph('<font color="#f97316">Public</font>', style_td_center), Paragraph('Aucune', style_td_center), Paragraph('OK', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/alerts', style_td), Paragraph('GET/POST/PATCH', style_td_center), Paragraph('<font color="#ef4444">Mixte</font>', style_td_center), Paragraph('<font color="#ef4444">Aucune</font>', style_td_center), Paragraph('<font color="#ef4444">Bug</font>', style_td_center), Paragraph('<font color="#ef4444">Bug</font>', style_td_center)],
        [Paragraph('/api/users', style_td), Paragraph('GET/POST/PATCH', style_td_center), Paragraph('OK', style_td_center), Paragraph('Minimale', style_td_center), Paragraph('N/A', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/campaigns', style_td), Paragraph('GET/POST', style_td_center), Paragraph('OK', style_td_center), Paragraph('<font color="#ef4444">Aucune</font>', style_td_center), Paragraph('<font color="#ef4444">Bug</font>', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/mesures', style_td), Paragraph('GET/POST/PUT', style_td_center), Paragraph('OK', style_td_center), Paragraph('<font color="#22c55e">Bonne</font>', style_td_center), Paragraph('<font color="#ef4444">Bug</font>', style_td_center), Paragraph('<font color="#22c55e">OK</font>', style_td_center)],
        [Paragraph('/api/roles', style_td), Paragraph('GET', style_td_center), Paragraph('OK', style_td_center), Paragraph('N/A', style_td_center), Paragraph('N/A', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/audit-logs', style_td), Paragraph('GET', style_td_center), Paragraph('OK', style_td_center), Paragraph('Aucune', style_td_center), Paragraph('N/A', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/map', style_td), Paragraph('GET', style_td_center), Paragraph('<font color="#f97316">Public</font>', style_td_center), Paragraph('Aucune', style_td_center), Paragraph('<font color="#ef4444">Bug</font>', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/scores', style_td), Paragraph('GET/POST', style_td_center), Paragraph('Mixte', style_td_center), Paragraph('POST OK', style_td_center), Paragraph('OK', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api/reports', style_td), Paragraph('GET/POST', style_td_center), Paragraph('Mixte', style_td_center), Paragraph('<font color="#ef4444">Aucune</font>', style_td_center), Paragraph('OK', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('/api (root)', style_td), Paragraph('GET', style_td_center), Paragraph('N/A', style_td_center), Paragraph('N/A', style_td_center), Paragraph('N/A', style_td_center), Paragraph('<font color="#22c55e">OK</font>', style_td_center)],
    ],
    col_ratios=[0.22, 0.13, 0.12, 0.14, 0.12, 0.12]
)
story.append(api_routes_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 3 : Statut detaille de chaque route API', style_caption))
story.append(Spacer(1, 12))

# 2.2 Critical Bug - RLS
story.append(add_heading('2.2 Bug Critique : RLS Regionnal Cass', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'Le bug le plus impactant du backend est la rupture complete du systeme de restriction d\'acces '
    'aux donnees par region (Row-Level Security). La fonction <b>getAccessibleRegions()</b> dans '
    '<b>rbac.ts</b> retourne les <b>codes</b> de regions (par exemple ["CON", "KIN", "BOK"]) au lieu '
    'de leurs identifiants CUID (par exemple "cmp7hylqn003xpy04xco2sapj"). Or, toutes les requetes '
    'Prisma utilisent ces valeurs dans des filtres <b>regionId: { in: accessibleRegIds }</b> ou '
    'regionId attend un CUID, pas un code.',
    style_body_fr
))
story.append(Spacer(1, 8))

story.append(Paragraph(
    '<b>Impact :</b> Les utilisateurs avec un scope "own_region" (INGENIEUR_RF) ne voient '
    '<b>aucune donnee</b> car la comparaison regionId IN ["CON"] ne correspond a aucun '
    'enregistrement en base. Ce bug affecte 7 routes sur 14 (dashboard, qos, alerts, campaigns, '
    'mesures, map, scoring). Le correctif est simple : remplacer <b>code: true</b> par '
    '<b>id: true</b> dans la requete de getAccessibleRegions().',
    style_body_fr
))
story.append(Spacer(1, 8))

# Evidence table
evidence_table = make_table(
    ['Champ', 'Valeur retournee (BUG)', 'Valeur attendue'],
    [
        [Paragraph('regionId en base', style_td), Paragraph('cmp7hylqn003xpy04xco2sapj', style_td), Paragraph('CUID genere par Prisma', style_td)],
        [Paragraph('getAccessibleRegions()', style_td), Paragraph('["CON", "KIN", "BOK", ...]', style_td), Paragraph('["cmp7hylqn003x...", "cmp7hylqo003y...", ...]', style_td)],
        [Paragraph('Correspondance', style_td), Paragraph('<font color="#ef4444"><b>0 resultat</b></font>', style_td_center), Paragraph('<font color="#22c55e">Donnees filtrees</font>', style_td_center)],
    ],
    col_ratios=[0.25, 0.38, 0.37]
)
story.append(evidence_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 4 : Preuve du bug RLS - codes vs identifiants', style_caption))

# 2.3 Auth System
story.append(Spacer(1, 14))
story.append(add_heading('2.3 Systeme d\'Authentification', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'Le systeme d\'authentification repose sur NextAuth v4 avec le provider Credentials et une strategie '
    'JWT (duree de vie 8 heures). Les mots de passe sont compares via bcryptjs, ce qui est correct. '
    'Cependant, le systeme presente des vulnerabilites critiques qui le rendent impropre a un deploiement '
    'en production. L\'audit fonctionnel a confirme que la connexion fonctionne correctement avec les '
    'identifiants admin@arpt.gn / Admin@2026!, que le JWT contient bien le role et les permissions, '
    'et que la session est correctement creee avec le cookie next-auth.session-token.',
    style_body_fr
))
story.append(Spacer(1, 8))

auth_table = make_table(
    ['Vulnerabilite', 'Severite', 'Detail'],
    [
        [Paragraph('NEXTAUTH_SECRET code en dur', style_td), severity_badge('CRITIQUE'), Paragraph('Valeur "onit-png-secret-key-2026-guinee" dans le source - permet de forger des JWT', style_td)],
        [Paragraph('Pas de limitation de debit (rate limiting)', style_td), severity_badge('CRITIQUE'), Paragraph('Le endpoint de login n\'a aucune protection contre les attaques par force brute', style_td)],
        [Paragraph('Pas de verrouillage de compte', style_td), severity_badge('CRITIQUE'), Paragraph('Aucun blocage apres N tentatives echouees', style_td)],
        [Paragraph('Cookies non securises (HTTP)', style_td), severity_badge('HAUTE'), Paragraph('useSecureCookies=false, secure=false - jeton transmissible en clair', style_td)],
        [Paragraph('Pas de politique de mot de passe', style_td), severity_badge('HAUTE'), Paragraph('Aucune exigence de longueur, complexite ou rotation', style_td)],
        [Paragraph('Mots de passe dans les logs', style_td), severity_badge('MOYENNE'), Paragraph('console.log des emails a chaque connexion', style_td)],
        [Paragraph('Pas d\'invalidation de session', style_td), severity_badge('MOYENNE'), Paragraph('JWT sans mecanisme de revocation cote serveur', style_td)],
        [Paragraph('Pas de 2FA/MFA', style_td), severity_badge('MOYENNE'), Paragraph('Authentification a un seul facteur uniquement', style_td)],
    ],
    col_ratios=[0.35, 0.15, 0.50]
)
story.append(auth_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 5 : Vulnerabilites du systeme d\'authentification', style_caption))

# 2.4 Security test results
story.append(Spacer(1, 14))
story.append(add_heading('2.4 Tests de Securite - Resultats', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'Des tests d\'intrusion ont ete executes contre l\'application en cours d\'execution pour confirmer '
    'les vulnerabilites identifiees par l\'analyse statique. Voici les resultats des tests reussis '
    '(c\'est-a-dire les attaques qui ont fonctionNE, confirmant la vulnerabilite) :',
    style_body_fr
))
story.append(Spacer(1, 8))

pentest_table = make_table(
    ['Test', 'Resultat', 'Preuve'],
    [
        [Paragraph('Creation d\'alerte sans authentification', style_td), Paragraph('<font color="#ef4444"><b>VULNERABLE</b></font>', style_td_center), Paragraph('POST /api/alerts retourne HTTP 200 avec ID de l\'alerte creee', style_td)],
        [Paragraph('Injection XSS dans les alertes', style_td), Paragraph('<font color="#ef4444"><b>VULNERABLE</b></font>', style_td_center), Paragraph('Le script &lt;script&gt;alert(1)&lt;/script&gt; est stocke tel quel dans le champ message', style_td)],
        [Paragraph('Acces non authentifie au dashboard', style_td), Paragraph('<font color="#ef4444"><b>VULNERABLE</b></font>', style_td_center), Paragraph('GET /api/dashboard retourne toutes les KPIs sans session', style_td)],
        [Paragraph('Acces operateur aux users/roles', style_td), Paragraph('<font color="#22c55e"><b>PROTEGE</b></font>', style_td_center), Paragraph('Retourne 401 "Non autorise" pour les roles non-admin', style_td)],
        [Paragraph('Connexion avec identifiants valides', style_td), Paragraph('<font color="#22c55e"><b>FONCTIONNE</b></font>', style_td_center), Paragraph('Session JWT creee avec role et permissions corrects', style_td)],
        [Paragraph('Acces map/scoring sans auth', style_td), Paragraph('<font color="#f97316"><b>PUBLIC</b></font>', style_td_center), Paragraph('Donnees geographiques et scores accessibles sans session', style_td)],
    ],
    col_ratios=[0.30, 0.20, 0.50]
)
story.append(pentest_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 6 : Resultats des tests d\'intrusion', style_caption))

# 2.5 Database
story.append(Spacer(1, 14))
story.append(add_heading('2.5 Base de Donnees', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'La base de donnees utilise SQLite via Prisma ORM. Le schema est bien structure avec 12 modeles '
    'couvrant les utilisateurs, roles, permissions, mesures QoS, alertes, campagnes, scores operateurs, '
    'rapports, et journaux d\'audit. Le seed contient 10 utilisateurs, 9 roles, 94 permissions, 78 '
    'mesures QoS, 8 campagnes et 8 regions administratives de Guinee. Cependant, SQLite presente des '
    'limites majeures pour un usage en production : verrouillage en ecriture unique, pas de concurrence, '
    'pas d\'index definis dans le schema Prisma, et chemins de base de donnees incoherents entre les '
    'differents fichiers de configuration (4 chemins differents repertories).',
    style_body_fr
))
story.append(Spacer(1, 8))

db_table = make_table(
    ['Probleme', 'Severite', 'Impact'],
    [
        [Paragraph('SQLite en production', style_td), severity_badge('CRITIQUE'), Paragraph('Pas de concurrence en ecriture, un seul thread d\'ecriture a la fois', style_td)],
        [Paragraph('Pas d\'index en base', style_td), severity_badge('HAUTE'), Paragraph('Full table scan sur chaque requete filtree (operateurId, regionId, timestamp)', style_td)],
        [Paragraph('Pas de migrations Prisma', style_td), severity_badge('CRITIQUE'), Paragraph('Utilisation de db push au lieu de migrate deploy - pas d\'historique versionne', style_td)],
        [Paragraph('Chemins DB incoherents', style_td), severity_badge('HAUTE'), Paragraph('4 chemins differents entre .env, docker-compose, start.sh, et .env.example', style_td)],
        [Paragraph('Enums stockes en strings', style_td), severity_badge('MOYENNE'), Paragraph('statut, type, severity, format sans validation - valeurs arbitraires possibles', style_td)],
        [Paragraph('Rapport.generePar est String', style_td), severity_badge('MOYENNE'), Paragraph('Pas de relation vers User - integrite referentielle brisee', style_td)],
    ],
    col_ratios=[0.30, 0.15, 0.55]
)
story.append(db_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 7 : Problemes de la base de donnees', style_caption))

# 2.6 RBAC
story.append(Spacer(1, 14))
story.append(add_heading('2.6 Controle d\'Acces Base sur les Roles (RBAC)', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'Le systeme RBAC definit 9 roles avec 94 permissions reparties sur 4 ressources principales '
    '(campaigns, reports, scores, alerts). Le modele de donnees inclut des DataAccessPolicies qui '
    'definissent le scope d\'acces (all, own_org, own_region, public_only) par role et ressource. '
    'L\'audit a revele que le RBAC fonctionne correctement pour les controles de permission '
    '(checkPermission), mais que le filtrage par region est completement casse par le bug RLS '
    'decrit precedemment. De plus, certaines routes (dashboard, scoring, map) ne verifient pas '
    'du tout les permissions et exposent les donnees a tous les utilisateurs authentifies.',
    style_body_fr
))
story.append(Spacer(1, 8))

# Role matrix
role_table = make_table(
    ['Role', 'Scope Campagnes', 'Scope Scores', 'Regions', 'Test'],
    [
        [Paragraph('SUPER_ADMIN', style_td), Paragraph('all', style_td_center), Paragraph('all', style_td_center), Paragraph('Toutes', style_td_center), Paragraph('<font color="#22c55e">OK</font>', style_td_center)],
        [Paragraph('DG', style_td), Paragraph('all', style_td_center), Paragraph('N/A', style_td_center), Paragraph('Toutes', style_td_center), Paragraph('<font color="#22c55e">OK</font>', style_td_center)],
        [Paragraph('DGA', style_td), Paragraph('all', style_td_center), Paragraph('N/A', style_td_center), Paragraph('Toutes', style_td_center), Paragraph('<font color="#22c55e">OK</font>', style_td_center)],
        [Paragraph('DIRECTEUR_TECH', style_td), Paragraph('all', style_td_center), Paragraph('N/A', style_td_center), Paragraph('Toutes', style_td_center), Paragraph('<font color="#22c55e">OK</font>', style_td_center)],
        [Paragraph('INGENIEUR_RF', style_td), Paragraph('own_region', style_td_center), Paragraph('N/A', style_td_center), Paragraph('<font color="#ef4444">Bug</font>', style_td_center), Paragraph('<font color="#ef4444">0 donnee</font>', style_td_center)],
        [Paragraph('ANALYSTE_QOS', style_td), Paragraph('all', style_td_center), Paragraph('N/A', style_td_center), Paragraph('Toutes', style_td_center), Paragraph('<font color="#22c55e">OK</font>', style_td_center)],
        [Paragraph('AUDITEUR', style_td), Paragraph('all', style_td_center), Paragraph('N/A', style_td_center), Paragraph('Toutes', style_td_center), Paragraph('<font color="#22c55e">OK</font>', style_td_center)],
        [Paragraph('OPERATEUR', style_td), Paragraph('own_org', style_td_center), Paragraph('own_org', style_td_center), Paragraph('Organisation', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
        [Paragraph('PUBLIC', style_td), Paragraph('public_only', style_td_center), Paragraph('public_only', style_td_center), Paragraph('Publique', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center)],
    ],
    col_ratios=[0.22, 0.20, 0.18, 0.18, 0.15]
)
story.append(role_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 8 : Matrice RBAC et resultats des tests par role', style_caption))

# 2.7 Hardcoded Data
story.append(Spacer(1, 14))
story.append(add_heading('2.7 Donnees Fictives en Dur', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'L\'audit a identifie de nombreuses valeurs fictives codees en dur dans les routes API, ce qui '
    'signifie que les tableaux de bord affichent des donnees qui ne proviennent pas de la base de '
    'donnees mais de calculs arbitraires ou de constantes. Cela mine la credibilite du systeme et '
    'peut induire en erreur les decideurs. Les valeurs suivantes ont ete trouvees dans le code source '
    'de /api/dashboard/route.ts et confirmees par les tests fonctionnels :',
    style_body_fr
))
story.append(Spacer(1, 8))

hardcoded_table = make_table(
    ['Valeur', 'Source', 'Fichier:Ligne', 'Impact'],
    [
        [Paragraph('couvertureNationale = 67', style_td), Paragraph('Constante par defaut', style_td), Paragraph('dashboard.ts:31', style_td_center), Paragraph('Affiche 100% si donnee presente, 67% sinon', style_td)],
        [Paragraph('scoreQosGlobal = 72', style_td), Paragraph('Constante par defaut', style_td), Paragraph('dashboard.ts:37', style_td_center), Paragraph('Score fictif si pas de donnee', style_td)],
        [Paragraph('trend = 2.3 / -1.2 / -12 / 340', style_td), Paragraph('Valeurs en dur', style_td), Paragraph('dashboard.ts:130-133', style_td_center), Paragraph('Tendances non calculees depuis les donnees reelles', style_td)],
        [Paragraph('zonesBlanches + 200', style_td), Paragraph('Offset arbitraire', style_td), Paragraph('dashboard.ts:132', style_td_center), Paragraph('Ajoute 200 zones blanches au compte reel', style_td)],
        [Paragraph('slaCompliance.global = 84', style_td), Paragraph('En dur', style_td), Paragraph('dashboard.ts:139', style_td_center), Paragraph('SLA jamais calcule depuis les donnees', style_td)],
        [Paragraph('innovation = QoS * 0.9', style_td), Paragraph('Calcul fictif', style_td), Paragraph('dashboard.ts:78', style_td_center), Paragraph('Sous-score non base sur des metriques reelles', style_td)],
        [Paragraph('Math.random() pour taille rapport', style_td), Paragraph('Aleatoire', style_td), Paragraph('reports.ts:25', style_td_center), Paragraph('Taille differente a chaque requete', style_td)],
    ],
    col_ratios=[0.22, 0.18, 0.18, 0.42]
)
story.append(hardcoded_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 9 : Donnees fictives identifiees dans les routes API', style_caption))


# ════════════════════════════════════════════════════════════
# SECTION 3 : AUDIT FRONTEND
# ════════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('3. Audit Frontend', style_h1, level=0))
story.append(Spacer(1, 8))

story.append(Paragraph(
    'L\'audit frontend couvre 24 composants React, le systeme de navigation par onglets, les flux '
    'utilisateur (connexion, deconnexion, navigation), l\'accessibilite WCAG, la responsivite, et '
    'la qualite des visualisations de donnees. L\'application est une SPA (Single Page Application) '
    'avec un systeme d\'onglets geres par l\'etat client, sans routage URL.',
    style_body_fr
))
story.append(Spacer(1, 12))

# 3.1 Component Status
story.append(add_heading('3.1 Statut des Composants', style_h2, level=1))
story.append(Spacer(1, 6))

comp_table = make_table(
    ['Composant', 'Lignes', 'Statut', 'Donnees Reelles', 'Problemes'],
    [
        [Paragraph('page.tsx', style_td), Paragraph('72', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Oui', style_td_center), Paragraph('Pas d\'error boundary', style_td)],
        [Paragraph('onit-layout.tsx', style_td), Paragraph('339', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Partiel', style_td_center), Paragraph('N PATCH paralleles pour mark-all-read', style_td)],
        [Paragraph('login-modal.tsx', style_td), Paragraph('216', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('N/A', style_td_center), Paragraph('Mot de passe en clair dans le code', style_td)],
        [Paragraph('dashboard-dg.tsx', style_td), Paragraph('248', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Partiel', style_td_center), Paragraph('Donnees de fallback sans indication', style_td)],
        [Paragraph('dashboard-qos.tsx', style_td), Paragraph('204', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Partiel', style_td_center), Paragraph('Pas de debounce sur les filtres', style_td)],
        [Paragraph('dashboard-sig.tsx', style_td), Paragraph('169', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Partiel', style_td_center), Paragraph('Drive tests non implementes', style_td)],
        [Paragraph('dashboard-scoring.tsx', style_td), Paragraph('167', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Partiel', style_td_center), Paragraph('Recommandations en dur', style_td)],
        [Paragraph('dashboard-audit.tsx', style_td), Paragraph('135', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center), Paragraph('<font color="#ef4444">Non</font>', style_td_center), Paragraph('Resultats + Drive Test fictifs', style_td)],
        [Paragraph('dashboard-cyber.tsx', style_td), Paragraph('151', style_td_center), Paragraph('<font color="#f97316">Partiel</font>', style_td_center), Paragraph('<font color="#ef4444">Non</font>', style_td_center), Paragraph('100% de donnees fictives', style_td)],
        [Paragraph('dashboard-public.tsx', style_td), Paragraph('240', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Partiel', style_td_center), Paragraph('4 appels API paralleles sans loader', style_td)],
        [Paragraph('dashboard-admin.tsx', style_td), Paragraph('673', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Partiel', style_td_center), Paragraph('Pas d\'edition utilisateur', style_td)],
        [Paragraph('dashboard-reports.tsx', style_td), Paragraph('226', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Partiel', style_td_center), Paragraph('Telechargement factice', style_td)],
        [Paragraph('guinea-map-leaflet.tsx', style_td), Paragraph('100', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Oui', style_td_center), Paragraph('Key prop force le remontage', style_td)],
        [Paragraph('mini-chart.tsx', style_td), Paragraph('362', style_td_center), Paragraph('<font color="#22c55e">Complet</font>', style_td_center), Paragraph('Oui', style_td_center), Paragraph('Pas de tooltips, pas de memo', style_td)],
    ],
    col_ratios=[0.22, 0.08, 0.12, 0.14, 0.40]
)
story.append(comp_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 10 : Statut detaille des composants frontend', style_caption))

# 3.2 Accessibility
story.append(Spacer(1, 14))
story.append(add_heading('3.2 Accessibilite (Score : 2/10)', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'L\'accessibilite est le domaine le plus defaillant du frontend. L\'application ne respecte '
    'pratiquement aucune directive WCAG 2.1 AA. Les problemes les plus critiques incluent l\'absence '
    'de role dialog et aria-modal sur la modale de connexion, l\'absence de piege de focus (focus trap) '
    'permettant de naviguer hors de la modale avec Tab, l\'absence d\'attributs aria-label sur les '
    'boutons iconiques, et des problemes de contraste de couleurs (text-slate-500 sur fond sombre '
    'donne un ratio de contraste d\'environ 3.2:1, bien en dessous du minimum requis de 4.5:1).',
    style_body_fr
))
story.append(Spacer(1, 8))

a11y_table = make_table(
    ['Critere WCAG', 'Statut', 'Impact'],
    [
        [Paragraph('Focus trap dans les modales', style_td), Paragraph('<font color="#ef4444">Absent</font>', style_td_center), Paragraph('Navigation clavier hors modale possible', style_td)],
        [Paragraph('aria-label sur boutons icones', style_td), Paragraph('<font color="#ef4444">Absent</font>', style_td_center), Paragraph('Lecteurs d\'ecran ne peuvent pas identifier les actions', style_td)],
        [Paragraph('Contraste texte/bg (AA)', style_td), Paragraph('<font color="#ef4444">Non conforme</font>', style_td_center), Paragraph('Texte illisible pour les utilisateurs malvoyants', style_td)],
        [Paragraph('Skip navigation link', style_td), Paragraph('<font color="#ef4444">Absent</font>', style_td_center), Paragraph('Navigation clavier obligatoire a travers toute la sidebar', style_td)],
        [Paragraph('aria-live pour contenu dynamique', style_td), Paragraph('<font color="#ef4444">Absent</font>', style_td_center), Paragraph('Alertes et notifications non annoncees', style_td)],
        [Paragraph('Keyboard navigation (Escape)', style_td), Paragraph('<font color="#ef4444">Absent</font>', style_td_center), Paragraph('Impossible de fermer modales/dropdowns au clavier', style_td)],
        [Paragraph('SVG charts accessibles', style_td), Paragraph('<font color="#ef4444">Absent</font>', style_td_center), Paragraph('Graphiques invisibles pour les lecteurs d\'ecran', style_td)],
    ],
    col_ratios=[0.35, 0.20, 0.45]
)
story.append(a11y_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 11 : Problemes d\'accessibilite critiques', style_caption))

# 3.3 UX Flow
story.append(Spacer(1, 14))
story.append(add_heading('3.3 Flux Utilisateur et Navigation', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'L\'application utilise un systeme de navigation par onglets geres uniquement par l\'etat client '
    '(useState), sans routage URL. Cela signifie qu\'il est impossible de creer un lien profond vers '
    'un tableau de bord specifique, le bouton retour du navigateur ne navigue pas entre les onglets, '
    'et l\'etat de l\'onglet est perdu au rechargement de la page. La barre de recherche dans l\'en-tete '
    'est purement decorative sans fonctionnalite de recherche. Apres la connexion, l\'application '
    'effectue un rechargement complet de la page (window.location.href = \'/\') au lieu d\'une '
    'navigation cote client, ce qui detruit tout l\'etat React. Le menu utilisateur propose des '
    'boutons "Changer le mot de passe" et "Journal d\'audit" qui n\'ont aucun gestionnaire de clic.',
    style_body_fr
))

# ════════════════════════════════════════════════════════════
# SECTION 4 : AUDIT PRODUCTION
# ════════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('4. Audit Production', style_h1, level=0))
story.append(Spacer(1, 8))

story.append(Paragraph(
    'L\'audit de preparation a la production evalue l\'infrastructure Docker, la configuration de '
    'securite, les performances, la scalabilite, le monitoring, les sauvegardes, et les pipelines '
    'CI/CD. Le score global de 28/100 reflete l\'etat actuel de prototype qui necessite des '
    'investissements significatifs avant de pouvoir etre expose sur Internet.',
    style_body_fr
))
story.append(Spacer(1, 12))

# 4.1 Docker
story.append(add_heading('4.1 Configuration Docker', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'Le Dockerfile utilise un build multi-stage (deps, builder, runner) avec une image de base '
    'node:20-alpine, un utilisateur non-root (nextjs:nodejs), et un health check. Le docker-compose.yml '
    'definit un volume persistant pour la base de donnees et un reseau bridge. Cependant, le build '
    'Docker echouera en production car l\'etape deps utilise npm ci --only=production mais l\'etape '
    'builder a besoin des dependances de developpement pour prisma generate et next build. De plus, '
    'le script CMD execute prisma db push a chaque demarrage, ce qui est dangereux en production.',
    style_body_fr
))
story.append(Spacer(1, 8))

docker_table = make_table(
    ['Aspect', 'Statut', 'Detail'],
    [
        [Paragraph('Multi-stage build', style_td), Paragraph('<font color="#22c55e">OK</font>', style_td_center), Paragraph('3 etapes: deps, builder, runner', style_td)],
        [Paragraph('Utilisateur non-root', style_td), Paragraph('<font color="#22c55e">OK</font>', style_td_center), Paragraph('nextjs:nodejs (uid/gid 1001)', style_td)],
        [Paragraph('Health check', style_td), Paragraph('<font color="#22c55e">OK</font>', style_td_center), Paragraph('HTTP check sur /api/auth/session', style_td)],
        [Paragraph('Volume persistant', style_td), Paragraph('<font color="#22c55e">OK</font>', style_td_center), Paragraph('onit-db:/app/db', style_td)],
        [Paragraph('Build deps stage', style_td), Paragraph('<font color="#ef4444">Bug</font>', style_td_center), Paragraph('--only=production mais builder a besoin des devDeps', style_td)],
        [Paragraph('prisma db push au demarrage', style_td), Paragraph('<font color="#ef4444">Dangereux</font>', style_td_center), Paragraph('Migration de schema a chaque demarrage de conteneur', style_td)],
        [Paragraph('Secrets en dur', style_td), Paragraph('<font color="#ef4444">Critique</font>', style_td_center), Paragraph('NEXTAUTH_SECRET en clair dans docker-compose.yml', style_td)],
        [Paragraph('Pas de limites ressources', style_td), Paragraph('<font color="#f97316">Manquant</font>', style_td_center), Paragraph('Pas de mem_limit ou cpus definis', style_td)],
    ],
    col_ratios=[0.25, 0.15, 0.60]
)
story.append(docker_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 12 : Evaluation de la configuration Docker', style_caption))

# 4.2 Security
story.append(Spacer(1, 14))
story.append(add_heading('4.2 Vulnerabilites de Securite', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'L\'audit de securite a identifie 21 vulnerabilites reparties en 7 critiques, 8 hautes et 6 moyennes. '
    'La vulnerabilite la plus grave est la presence du NEXTAUTH_SECRET dans le code source, ce qui '
    'permet a quiconque ayant acces au depot de forger des jetons JWT valides et d\'acceder a n\'importe '
    'quel compte, y compris SUPER_ADMIN. La seconde vulnerabilite critique est l\'absence totale de '
    'HTTPS, avec les cookies de session transmis en clair sur le reseau. Le Caddyfile contient egalement '
    'une vulnerabilite SSRF via le parametre XTransformPort qui permet de proxyer des requetes vers '
    'n\'importe quel port interne.',
    style_body_fr
))
story.append(Spacer(1, 8))

sec_table = make_table(
    ['ID', 'Vulnerabilite', 'Severite'],
    [
        [Paragraph('S1', style_td_center), Paragraph('NEXTAUTH_SECRET code en dur dans 4 fichiers (.env, docker-compose, start.sh, start-standalone.sh)', style_td), severity_badge('CRITIQUE')],
        [Paragraph('S2', style_td_center), Paragraph('SSRF via XTransformPort dans Caddyfile - proxy vers n\'importe quel port interne', style_td), severity_badge('CRITIQUE')],
        [Paragraph('S3', style_td_center), Paragraph('Pas de HTTPS/TLS - tous les cookies de session transmis en clair', style_td), severity_badge('CRITIQUE')],
        [Paragraph('S4', style_td_center), Paragraph('Cookies non securises (secure: false) - vol de session possible', style_td), severity_badge('CRITIQUE')],
        [Paragraph('S5', style_td_center), Paragraph('ignoreBuildErrors:true - erreurs TypeScript ignorees en production', style_td), severity_badge('CRITIQUE')],
        [Paragraph('S6', style_td_center), Paragraph('Secret fallback dans le code source - si NEXTAUTH_SECRET absent, valeur connue utilisee', style_td), severity_badge('CRITIQUE')],
        [Paragraph('S7', style_td_center), Paragraph('Identifiants par defaut dans le README (admin@arpt.gn / Admin@2026!)', style_td), severity_badge('CRITIQUE')],
        [Paragraph('S8', style_td_center), Paragraph('Pas de rate limiting sur le login - force brute possible', style_td), severity_badge('HAUTE')],
        [Paragraph('S9', style_td_center), Paragraph('Pas de verrouillage de compte apres tentatives echouees', style_td), severity_badge('HAUTE')],
        [Paragraph('S10', style_td_center), Paragraph('Pas de validation des entrees (Zod) sur les routes POST/PATCH', style_td), severity_badge('HAUTE')],
        [Paragraph('S11', style_td_center), Paragraph('Pas de middleware Next.js - pas de CSRF, CORS ou filtrage centralise', style_td), severity_badge('HAUTE')],
    ],
    col_ratios=[0.06, 0.72, 0.15]
)
story.append(sec_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 13 : Vulnerabilites de securite (extrait des 21 identifiees)', style_caption))

# 4.3 Performance
story.append(Spacer(1, 14))
story.append(add_heading('4.3 Performance et Scalabilite', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'Les performances de l\'application sont limitees par plusieurs facteurs structurels. La base '
    'de donnees SQLite ne supporte qu\'un seul processus d\'ecriture a la fois, ce qui signifie que '
    'sous charge, toutes les ecritures seront mises en file d\'attente. L\'API dashboard charge '
    'l\'ensemble des mesures en memoire avant de les filtrer (pattern N+1), ce qui provoquera des '
    'crashes par manque de memoire lorsque le volume de donnees augmentera. Il n\'y a aucune couche '
    'de cache (ni Redis, ni cache en memoire, ni ISR Next.js), donc chaque chargement de tableau '
    'de bord atteint la base de donnees directement. L\'application ne peut pas etre horizontalement '
    'scalable car SQLite ne peut pas etre partage entre plusieurs instances.',
    style_body_fr
))
story.append(Spacer(1, 8))

perf_table = make_table(
    ['Goulot d\'etranglement', 'Severite', 'Plafond actuel'],
    [
        [Paragraph('SQLite ecriture unique', style_td), severity_badge('CRITIQUE'), Paragraph('1-5 ecritures concurrentes max', style_td)],
        [Paragraph('Pas de cache', style_td), severity_badge('HAUTE'), Paragraph('Chaque requete atteint la DB', style_td)],
        [Paragraph('Chargement de toutes les mesures en memoire', style_td), severity_badge('HAUTE'), Paragraph('Crash OOM au-dela de ~10000 mesures', style_td)],
        [Paragraph('Pas de pagination (dashboard, map)', style_td), severity_badge('HAUTE'), Paragraph('Toutes les donnees envoyees en une fois', style_td)],
        [Paragraph('Pas d\'index en base', style_td), severity_badge('HAUTE'), Paragraph('Full table scan sur chaque requete filtree', style_td)],
        [Paragraph('Pas de scalabilite horizontale', style_td), severity_badge('HAUTE'), Paragraph('1 conteneur maximum (SQLite non partageable)', style_td)],
    ],
    col_ratios=[0.38, 0.15, 0.47]
)
story.append(perf_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 14 : Goulots d\'etranglement de performance', style_caption))

# 4.4 Monitoring
story.append(Spacer(1, 14))
story.append(add_heading('4.4 Monitoring et Observabilite', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'L\'observabilite de l\'application est quasiment inexistante. Les seuls logs sont des console.log '
    'et console.error sans structure, niveaux ni contexte. Il n\'y a pas de service de suivi des '
    'erreurs (Sentry), pas de metriques applicatives (Prometheus), pas de tracing distribue, et pas '
    'de systeme d\'alerting. Le health check Docker verifie uniquement que le serveur HTTP repond, '
    'sans verifier la connectivite a la base de donnees. Il n\'y a pas de strategie de sauvegarde '
    'automatisee pour la base SQLite, et copier un fichier SQLite en cours d\'utilisation peut '
    'corrompre la sauvegarde. Aucun pipeline CI/CD n\'est configure.',
    style_body_fr
))

# ════════════════════════════════════════════════════════════
# SECTION 5 : PLAN DE CORRECTION
# ════════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('5. Plan de Correction Priorise', style_h1, level=0))
story.append(Spacer(1, 8))

story.append(Paragraph(
    'Le plan de correction est organise en 5 phases prioritaires, estimees pour un developpeur '
    'travaillant a temps plein. Les deux premieres phases sont indispensables avant tout deploiement, '
    'meme interne. Les phases suivantes peuvent etre realisees de maniere progressive.',
    style_body_fr
))
story.append(Spacer(1, 12))

# Phase 1
story.append(add_heading('5.1 Phase 1 : Securite Critique (2 semaines)', style_h2, level=1))
story.append(Spacer(1, 6))

p1_table = make_table(
    ['Action', 'Effort', 'Impact'],
    [
        [Paragraph('Corriger getAccessibleRegions() : retourner les IDs au lieu des codes', style_td), Paragraph('1 heure', style_td_center), Paragraph('Corrige le RLS sur 7 routes', style_td)],
        [Paragraph('Supprimer les secrets du code source, utiliser des variables d\'environnement ou Docker secrets', style_td), Paragraph('4 heures', style_td_center), Paragraph('Empeche le forgeage de JWT', style_td)],
        [Paragraph('Activer HTTPS avec Caddy + domaine', style_td), Paragraph('4 heures', style_td_center), Paragraph('Protege les cookies de session', style_td)],
        [Paragraph('Ajouter un rate limiting sur le login', style_td), Paragraph('4 heures', style_td_center), Paragraph('Empeche les attaques par force brute', style_td)],
        [Paragraph('Ajouter la validation Zod sur toutes les routes POST/PATCH', style_td), Paragraph('2 jours', style_td_center), Paragraph('Empeche les injections XSS et les donnees corrompues', style_td)],
        [Paragraph('Exiger l\'authentification pour POST /api/alerts', style_td), Paragraph('2 heures', style_td_center), Paragraph('Arrete la creation d\'alertes non autorisees', style_td)],
        [Paragraph('Supprimer ignoreBuildErrors: true dans next.config.ts', style_td), Paragraph('1 jour', style_td_center), Paragraph('Empeche le deploiement de code casse', style_td)],
        [Paragraph('Supprimer le SSRF du Caddyfile (XTransformPort)', style_td), Paragraph('30 min', style_td_center), Paragraph('Empeche l\'acces aux services internes', style_td)],
    ],
    col_ratios=[0.50, 0.15, 0.35]
)
story.append(p1_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 15 : Phase 1 - Corrections de securite critiques', style_caption))

# Phase 2
story.append(Spacer(1, 14))
story.append(add_heading('5.2 Phase 2 : Migration Base de Donnees (2 semaines)', style_h2, level=1))
story.append(Spacer(1, 6))

p2_table = make_table(
    ['Action', 'Effort', 'Impact'],
    [
        [Paragraph('Migrer de SQLite vers PostgreSQL (Supabase, Neon, ou RDS)', style_td), Paragraph('3 jours', style_td_center), Paragraph('Supporte la concurrence et la scalabilite', style_td)],
        [Paragraph('Configurer prisma migrate deploy pour les migrations', style_td), Paragraph('1 jour', style_td_center), Paragraph('Migrations versionnees et sures', style_td)],
        [Paragraph('Ajouter des index sur operateurId, regionId, campagneId, timestamp', style_td), Paragraph('2 heures', style_td_center), Paragraph('Requetes 10-100x plus rapides', style_td)],
        [Paragraph('Corriger les chemins DATABASE_URL incoherents', style_td), Paragraph('1 heure', style_td_center), Paragraph('Consistance entre environnements', style_td)],
        [Paragraph('Remplacer les enums en string par de vrais enums Prisma', style_td), Paragraph('2 jours', style_td_center), Paragraph('Validation des valeurs au niveau DB', style_td)],
        [Paragraph('Ajouter une strategie de sauvegarde automatisee (pg_dump)', style_td), Paragraph('1 jour', style_td_center), Paragraph('Recovery en cas de perte de donnees', style_td)],
    ],
    col_ratios=[0.50, 0.15, 0.35]
)
story.append(p2_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 16 : Phase 2 - Migration base de donnees', style_caption))

# Phase 3
story.append(Spacer(1, 14))
story.append(add_heading('5.3 Phase 3 : Fiabilite et Monitoring (1 semaine)', style_h2, level=1))
story.append(Spacer(1, 6))

p3_table = make_table(
    ['Action', 'Effort', 'Impact'],
    [
        [Paragraph('Ajouter un logging structure (Pino ou Winston)', style_td), Paragraph('2 jours', style_td_center), Paragraph('Debugging et audit en production', style_td)],
        [Paragraph('Integrer Sentry pour le suivi des erreurs', style_td), Paragraph('1 jour', style_td_center), Paragraph('Detection proactive des bugs', style_td)],
        [Paragraph('Ajouter un health check qui verifie la DB', style_td), Paragraph('2 heures', style_td_center), Paragraph('Detection des pannes de base', style_td)],
        [Paragraph('Ajouter des limites de ressources Docker (mem_limit, cpus)', style_td), Paragraph('1 heure', style_td_center), Paragraph('Empeche les crashes OOM', style_td)],
        [Paragraph('Ajouter une Error Boundary React', style_td), Paragraph('2 heures', style_td_center), Paragraph('Empeche les ecrans blancs', style_td)],
        [Paragraph('Remplacer les donnees fictives par des calculs reels', style_td), Paragraph('3 jours', style_td_center), Paragraph('Donnees credibles dans les dashboards', style_td)],
    ],
    col_ratios=[0.50, 0.15, 0.35]
)
story.append(p3_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 17 : Phase 3 - Fiabilite et monitoring', style_caption))

# Phase 4-5 summary
story.append(Spacer(1, 14))
story.append(add_heading('5.4 Phases 4-5 : CI/CD et Scalabilite (4-6 semaines)', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    '<b>Phase 4 - CI/CD et Tests (2 semaines) :</b> Configurer GitHub Actions pour le lint, le '
    'type-check, les tests unitaires et le build automatique. Ecrire des tests unitaires pour le '
    'RBAC, des tests d\'integration pour les routes API, et des tests E2E pour les flux critiques '
    '(connexion, import de donnees, generation de rapports). Reactiver progressivement les regles '
    'ESLint desactivees et activer noImplicitAny dans tsconfig.json.',
    style_body_fr
))
story.append(Spacer(1, 8))

story.append(Paragraph(
    '<b>Phase 5 - Scalabilite (2-3 semaines) :</b> Ajouter Redis pour le cache des tableaux de '
    'bord et le rate limiting. Implementer la pagination curseur sur tous les endpoints liste. '
    'Configurer Docker Swarm ou Kubernetes pour la scalabilite horizontale. Ajouter un CDN '
    '(Cloudflare) pour les assets statiques et la protection DDoS. Implementer les Server-Sent '
    'Events ou WebSocket pour les mises a jour en temps reel des tableaux de bord.',
    style_body_fr
))
story.append(Spacer(1, 12))

# Effort summary
effort_table = make_table(
    ['Phase', 'Duree Estimee', 'Prerequis', 'Priorite'],
    [
        [Paragraph('Phase 1 : Securite', style_td), Paragraph('2 semaines', style_td_center), Paragraph('Nom de domaine, certificat SSL', style_td_center), Paragraph('<font color="#ef4444"><b>CRITIQUE</b></font>', style_td_center)],
        [Paragraph('Phase 2 : BDD', style_td), Paragraph('2 semaines', style_td_center), Paragraph('Hebergement PostgreSQL', style_td_center), Paragraph('<font color="#ef4444"><b>CRITIQUE</b></font>', style_td_center)],
        [Paragraph('Phase 3 : Fiabilite', style_td), Paragraph('1 semaine', style_td_center), Paragraph('Compte Sentry', style_td_center), Paragraph('<font color="#ea580c"><b>HAUTE</b></font>', style_td_center)],
        [Paragraph('Phase 4 : CI/CD + Tests', style_td), Paragraph('2 semaines', style_td_center), Paragraph('GitHub Actions', style_td_center), Paragraph('<font color="#d97706"><b>MOYENNE</b></font>', style_td_center)],
        [Paragraph('Phase 5 : Scalabilite', style_td), Paragraph('2-3 semaines', style_td_center), Paragraph('Redis, orchestration', style_td_center), Paragraph('<font color="#16a34a"><b>BASSE</b></font>', style_td_center)],
        [Paragraph('<b>TOTAL</b>', style_td), Paragraph('<b>9-12 semaines</b>', style_td_center), Paragraph('', style_td_center), Paragraph('', style_td_center)],
    ],
    col_ratios=[0.25, 0.18, 0.30, 0.18]
)
story.append(effort_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 18 : Resume de l\'effort par phase', style_caption))


# ════════════════════════════════════════════════════════════
# SECTION 6 : DONNEES FONCTIONNELLES
# ════════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('6. Donnees Fonctionnelles Verifiees', style_h1, level=0))
story.append(Spacer(1, 8))

story.append(Paragraph(
    'Cette section presente les resultats des tests fonctionnels realises contre l\'application '
    'en cours d\'execution. Le serveur a ete lance en mode production (NODE_ENV=production) avec '
    'le build standalone Next.js, et les endpoints API ont ete testes avec curl.',
    style_body_fr
))
story.append(Spacer(1, 8))

# DB content
story.append(add_heading('6.1 Contenu de la Base de Donnees', style_h2, level=1))
story.append(Spacer(1, 6))

db_content_table = make_table(
    ['Table', 'Enregistrements', 'Commentaire'],
    [
        [Paragraph('User', style_td), Paragraph('10', style_td_center), Paragraph('9 roles couverts, tous actifs, meme mot de passe', style_td)],
        [Paragraph('Role', style_td), Paragraph('9', style_td_center), Paragraph('SUPER_ADMIN, DG, DGA, DIRECTEUR_TECH, INGENIEUR_RF, ANALYSTE_QOS, AUDITEUR, OPERATEUR_READONLY, PUBLIC', style_td)],
        [Paragraph('Permission', style_td), Paragraph('94', style_td_center), Paragraph('Reparties sur 4 ressources principales', style_td)],
        [Paragraph('MesureQoS', style_td), Paragraph('78', style_td_center), Paragraph('3 operateurs x 8 regions,donnees de test', style_td)],
        [Paragraph('Alerte', style_td), Paragraph('14', style_td_center), Paragraph('Inclut les alertes de test d\'intrusion', style_td)],
        [Paragraph('Campagne', style_td), Paragraph('8', style_td_center), Paragraph('Campagnes de test drive/walk', style_td)],
        [Paragraph('ScoreOperateur', style_td), Paragraph('12', style_td_center), Paragraph('4 scores par operateur (3 operateurs)', style_td)],
        [Paragraph('Rapport', style_td), Paragraph('8', style_td_center), Paragraph('Rapports de test multi-formats', style_td)],
        [Paragraph('AuditLog', style_td), Paragraph('19', style_td_center), Paragraph('Trace des actions effectuees', style_td)],
        [Paragraph('Region', style_td), Paragraph('8', style_td_center), Paragraph('Conakry, Kindia, Bok\u00e9, Lab\u00e9, Mamou, Faranah, Kankan, N\'Z\u00e9r\u00e9kor\u00e9', style_td)],
        [Paragraph('Operateur', style_td), Paragraph('3', style_td_center), Paragraph('Orange Guin\u00e9e, MTN Guin\u00e9e, Celcom Guin\u00e9e', style_td)],
        [Paragraph('DataAccessPolicy', style_td), Paragraph('18', style_td_center), Paragraph('Policies RLS par role et ressource', style_td)],
    ],
    col_ratios=[0.20, 0.15, 0.65]
)
story.append(db_content_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 19 : Contenu verifie de la base de donnees', style_caption))
story.append(Spacer(1, 12))

# API test results
story.append(add_heading('6.2 Resultats des Tests API', style_h2, level=1))
story.append(Spacer(1, 6))

api_test_table = make_table(
    ['Endpoint', 'Auth', 'HTTP', 'Resultat'],
    [
        [Paragraph('GET /api', style_td), Paragraph('Non', style_td_center), Paragraph('200', style_td_center), Paragraph('Health check OK', style_td)],
        [Paragraph('POST /api/auth/callback/credentials', style_td), Paragraph('Non', style_td_center), Paragraph('302', style_td_center), Paragraph('Connexion reussie, JWT cree', style_td)],
        [Paragraph('GET /api/auth/session', style_td), Paragraph('Cookie', style_td_center), Paragraph('200', style_td_center), Paragraph('Session avec email + role', style_td)],
        [Paragraph('GET /api/dashboard', style_td), Paragraph('Non', style_td_center), Paragraph('200', style_td_center), Paragraph('KPIs, operateurs, alertes, SLA', style_td)],
        [Paragraph('GET /api/qos', style_td), Paragraph('Oui', style_td_center), Paragraph('200/401', style_td_center), Paragraph('Metriques + benchmark + heatmap', style_td)],
        [Paragraph('GET /api/alerts', style_td), Paragraph('Oui', style_td_center), Paragraph('200/401', style_td_center), Paragraph('Liste des alertes', style_td)],
        [Paragraph('POST /api/alerts', style_td), Paragraph('Non', style_td_center), Paragraph('200', style_td_center), Paragraph('Alerte creee sans auth - VULNERABLE', style_td)],
        [Paragraph('GET /api/users', style_td), Paragraph('Admin', style_td_center), Paragraph('200/401', style_td_center), Paragraph('Liste utilisateurs (admin seulement)', style_td)],
        [Paragraph('GET /api/roles', style_td), Paragraph('Admin', style_td_center), Paragraph('200/401', style_td_center), Paragraph('9 roles avec permissions', style_td)],
        [Paragraph('GET /api/campaigns', style_td), Paragraph('Oui', style_td_center), Paragraph('200/401', style_td_center), Paragraph('8 campagnes', style_td)],
        [Paragraph('GET /api/map', style_td), Paragraph('Non', style_td_center), Paragraph('200', style_td_center), Paragraph('8 regions, 78 points, 3 operateurs', style_td)],
        [Paragraph('GET /api/scoring', style_td), Paragraph('Non', style_td_center), Paragraph('200', style_td_center), Paragraph('3 operateurs, radar data', style_td)],
        [Paragraph('GET /api/reports', style_td), Paragraph('Cookie', style_td_center), Paragraph('200', style_td_center), Paragraph('8 rapports', style_td)],
    ],
    col_ratios=[0.28, 0.12, 0.10, 0.50]
)
story.append(api_test_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Tableau 20 : Resultats des tests API fonctionnels', style_caption))


# ════════════════════════════════════════════════════════════
# SECTION 7 : RECOMMANDATIONS FINALES
# ════════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(add_heading('7. Recommandations Finales', style_h1, level=0))
story.append(Spacer(1, 8))

story.append(Paragraph(
    'Base sur l\'ensemble de l\'audit, voici les recommandations finales classees par urgence. '
    'Il est imperatif de ne pas deployer cette application sur un serveur accessible publiquement '
    'avant que les correctifs de la Phase 1 ne soient appliques. Un deploiement interne (intranet ARPT) '
    'est possible apres les Phases 1 et 2, tandis qu\'un deploiement Internet requiert les Phases 1 a 3.',
    style_body_fr
))
story.append(Spacer(1, 12))

story.append(add_heading('7.1 Actions Immédiates (cette semaine)', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    '<b>1. Corriger le bug RLS</b> dans rbac.ts : remplacer <b>code: true</b> par <b>id: true</b> '
    'dans getAccessibleRegions(). C\'est un correctif d\'une ligne qui corrige 7 routes simultanement '
    'et permet aux ingenieurs RF de voir leurs donnees regionnales. C\'est le bug le plus impactant '
    'et le plus simple a corriger.',
    style_body_fr
))
story.append(Spacer(1, 6))

story.append(Paragraph(
    '<b>2. Supprimer les secrets du code source.</b> Generer un NEXTAUTH_SECRET cryptographiquement '
    'aleatoire (minimum 32 octets), le stocker dans .env.local (pas dans .env), et l\'injecter via '
    'Docker secrets ou des variables d\'environnement en production. Supprimer la valeur de fallback '
    'dans auth route.ts.',
    style_body_fr
))
story.append(Spacer(1, 6))

story.append(Paragraph(
    '<b>3. Exiger l\'authentification pour POST /api/alerts.</b> Ce point d\'acces permet actuellement '
    'a n\'importe qui de creer des alertes dans le systeme sans authentification, y compris avec du '
    'contenu XSS. Ajouter une verification de session et un CAPTCHA pour les signalements publics.',
    style_body_fr
))
story.append(Spacer(1, 6))

story.append(Paragraph(
    '<b>4. Supprimer le SSRF du Caddyfile.</b> Supprimer entierement le bloc XTransformPort qui '
    'permet de proxyer des requetes vers des ports internes arbitraires. C\'est une vulnerabilite '
    'critique qui peut etre exploitee pour acceder a des services internes.',
    style_body_fr
))
story.append(Spacer(1, 12))

story.append(add_heading('7.2 Architecture Cible pour la Production', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'L\'architecture cible recommandee pour un deploiement en production comprend les composants '
    'suivants : Cloudflare en frontal pour le CDN et la protection DDoS, Caddy comme reverse proxy '
    'avec HTTPS automatique via Let\'s Encrypt, 2 a 3 instances Next.js sans etat derriere un '
    'load balancer, PostgreSQL comme base de donnees (service manage tel que Supabase ou Neon recommande), '
    'Redis pour le cache des tableaux de bord et le rate limiting, et un systeme de monitoring '
    'avec Sentry pour les erreurs, Prometheus pour les metriques, et des logs structures avec Pino. '
    'L\'estimation totale pour atteindre ce niveau de maturite est de 9 a 12 semaines pour un '
    'developpeur, ou 5 a 7 semaines pour une equipe de 2 developpeurs.',
    style_body_fr
))
story.append(Spacer(1, 12))

story.append(add_heading('7.3 Points Positifs', style_h2, level=1))
story.append(Spacer(1, 6))

story.append(Paragraph(
    'Malgre les problemes identifies, la plateforme ONIT-PNG presente plusieurs qualites notables. '
    'Le design visuel est professionnel et coherent (mode sombre bleu nuit + or), les 9 tableaux de '
    'bord couvrent efficacement les differents besoins metier (DG, QoS, SIG, Scoring, Audit, '
    'Cybersecurite, Administration, Rapports, Portail Public), la carte Leaflet avec les 8 regions '
    'de Guinee est fonctionnelle et precise, le modele de donnees Prisma est bien structure avec '
    'un bon support RBAC, le seed de donnees est complet et realiste, et l\'interface utilisateur '
    'avec shadcn/ui est moderne et repond aux standards actuels du developpement web. Ces fondations '
    'solides permettent d\'envisager une mise en production reussie apres les corrections necessaires.',
    style_body_fr
))

# ───────────────────────────────────────────────────────────
# BUILD
# ───────────────────────────────────────────────────────────
doc.multiBuild(story)
print(f"PDF generated: {output_path}")

# Add metadata
from pypdf import PdfReader, PdfWriter

reader = PdfReader(output_path)
writer = PdfWriter()
for page in reader.pages:
    writer.add_page(page)
writer.add_metadata({
    '/Title': 'ONIT-PNG - Rapport d\'Audit Complet',
    '/Author': 'Z.ai',
    '/Creator': 'Z.ai',
    '/Subject': 'Audit de securite, performance et preparation production de la plateforme ONIT-PNG',
})
with open(output_path, 'wb') as f:
    writer.write(f)
print(f"Metadata added: {output_path}")
