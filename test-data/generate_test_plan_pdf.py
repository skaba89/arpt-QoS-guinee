#!/usr/bin/env python3
"""
ONIT-PNG — Génération du Plan de Test E2E (PDF)
"""
import os
sys_path = os.path.dirname(__file__)

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors

# ─── Output ───
OUTPUT_PDF = "/home/z/my-project/download/ONIT-PNG_Plan_de_Test_E2E.pdf"
os.makedirs(os.path.dirname(OUTPUT_PDF), exist_ok=True)

doc = SimpleDocTemplate(
    OUTPUT_PDF,
    pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm
)

# ─── Styles ───
styles = getSampleStyleSheet()

title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=24, spaceAfter=6, textColor=HexColor('#0f172a'))
subtitle_style = ParagraphStyle('CustomSubtitle', parent=styles['Normal'], fontSize=12, spaceAfter=20, textColor=HexColor('#64748b'))
h1_style = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=16, spaceBefore=20, spaceAfter=10, textColor=HexColor('#1e40af'))
h2_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=13, spaceBefore=14, spaceAfter=8, textColor=HexColor('#1e3a5f'))
h3_style = ParagraphStyle('H3', parent=styles['Heading3'], fontSize=11, spaceBefore=10, spaceAfter=6, textColor=HexColor('#334155'))
body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=6, alignment=TA_JUSTIFY)
code_style = ParagraphStyle('Code', parent=styles['Code'], fontSize=8, leading=10, fontName='Courier', backColor=HexColor('#f1f5f9'), spaceAfter=6, leftIndent=10)
bullet_style = ParagraphStyle('Bullet', parent=styles['Normal'], fontSize=10, leading=14, leftIndent=20, spaceAfter=3)
note_style = ParagraphStyle('Note', parent=styles['Normal'], fontSize=9, leading=12, textColor=HexColor('#64748b'), leftIndent=15, spaceAfter=6, fontName='Helvetica-Oblique')

# ─── Helper ───
def h1(text): return Paragraph(text, h1_style)
def h2(text): return Paragraph(text, h2_style)
def h3(text): return Paragraph(text, h3_style)
def p(text): return Paragraph(text, body_style)
def bullet(text): return Paragraph(f"• {text}", bullet_style)
def code(text): return Paragraph(text, code_style)
def note(text): return Paragraph(text, note_style)
def sp(n=6): return Spacer(1, n*mm)

def make_table(data, col_widths=None):
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t

# ─── Build Document ───
story = []

# Cover
story.append(sp(40))
story.append(Paragraph("ONIT-PNG", title_style))
story.append(Paragraph("Observatoire National de l'Infrastructure des Telecommunications", subtitle_style))
story.append(sp(10))
story.append(Paragraph("Plan de Test End-to-End", ParagraphStyle('BigTitle', parent=styles['Title'], fontSize=20, textColor=HexColor('#1e40af'))))
story.append(sp(5))
story.append(Paragraph("Version 1.0 — Tests de cas reel en production", subtitle_style))
story.append(sp(20))
story.append(Paragraph("4 operateurs × 4 periodes × 8 regions = 1280 mesures QoS", ParagraphStyle('Stats', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, textColor=HexColor('#475569'))))
story.append(PageBreak())

# ─── Table of Contents ───
story.append(h1("Table des matieres"))
toc = [
    "1. Introduction et objectifs",
    "2. Environnement de test Docker",
    "3. Comptes de connexion et cles API",
    "4. Phase 1 — Authentification et acces",
    "5. Phase 2 — Injection des donnees via API Prestataire",
    "6. Phase 3 — Verification du dashboard DG",
    "7. Phase 4 — Test du module QoS",
    "8. Phase 5 — Test du module SIG (carte interactive)",
    "9. Phase 6 — Test du module Scoring",
    "10. Phase 7 — Test du module Alertes",
    "11. Phase 8 — Test du module Rapports",
    "12. Phase 9 — Test du module Administration",
    "13. Phase 10 — Test RBAC (controle d'acces)",
    "14. Phase 11 — Tests de charge et comportement",
    "15. Phase 12 — API Prestataire — remontee des donnees",
    "16. Fichiers de test disponibles",
    "17. Commandes curl de reference",
]
for item in toc:
    story.append(Paragraph(item, body_style))
story.append(PageBreak())

# ─── Section 1 ───
story.append(h1("1. Introduction et objectifs"))
story.append(p("Ce document decrit le plan de test end-to-end (E2E) pour la plateforme ONIT-PNG (Observatoire National de l'Infrastructure des Telecommunications — Plateforme Nationale de Supervision de la Guinee). L'objectif est de valider le comportement de la solution dans des conditions similaires a la production, en injectant des donnees realistes pour 4 operateurs de telecommunications sur 4 periodes trimestrielles (2025-Q2 a 2026-Q1) reparties sur 8 regions administratives."))
story.append(p("Les tests couvrent l'ensemble des fonctionnalites de la plateforme : authentification, tableau de bord, mesures QoS, carte SIG interactive, scoring des operateurs, systeme d'alertes, gestion des rapports, administration des utilisateurs, et controle d'acces base sur les roles (RBAC). Chaque phase de test est detaillee avec les etapes precisess a suivre, les resultats attendus et les points de verification."))
story.append(p("Les donnees de test sont injectees via l'API Prestataire dediee aux operateurs, ce qui permet de simuler le flux reel de remontee de donnees depuis les equipements terrain des operateurs vers la plateforme centrale de l'ARPT. Cette approche garantit que les tests reproduisent fidelement les conditions de production."))

story.append(h2("1.1 Operateurs testes"))
story.append(make_table([
    ["Operateur", "Code", "Type", "Licence", "Qualite attendue"],
    ["Orange Guinee", "ORANGE", "MOBILE", "LIC-ORANGE-2016", "Meilleure qualite (score 70-78)"],
    ["MTN Guinee", "MTN", "MOBILE", "LIC-MTN-2016", "Bonne qualite (score 68-74)"],
    ["Celcom Guinee", "CELCOM", "MOBILE", "LIC-CELCOM-2018", "Qualite moyenne (score 55-65)"],
    ["Guinee Telecom", "GUINETEL", "MOBILE", "LIC-GUINETEL-2020", "Qualite faible (score 42-52)"],
], col_widths=[90, 55, 50, 95, 170]))
story.append(sp(6))

story.append(h2("1.2 Periodes testees"))
story.append(make_table([
    ["Periode", "Trimestre", "Nombre de mesures / operateur"],
    ["2025-Q2", "Avril-Juin 2025", "80 mesures × 8 regions"],
    ["2025-Q3", "Juillet-Sept 2025", "80 mesures × 8 regions"],
    ["2025-Q4", "Oct-Dec 2025", "80 mesures × 8 regions"],
    ["2026-Q1", "Jan-Mars 2026", "80 mesures × 8 regions"],
], col_widths=[80, 120, 260]))
story.append(sp(6))

# ─── Section 2 ───
story.append(h1("2. Environnement de test Docker"))
story.append(p("L'environnement de test est entierement conteneurise via Docker. Le fichier docker-compose.yml orchestre le deploiement de l'application avec une base de donnees SQLite persistante. Cette approche garantit la reproductibilite des tests et l'isolation de l'environnement."))

story.append(h3("2.1 Demarrage de l'environnement"))
story.append(code("docker-compose up --build"))
story.append(p("Le Dockerfile effectue un build multi-stage : installation des dependances (Stage 1), compilation Next.js en mode standalone (Stage 2), et deploiement en production avec Node.js 20 Alpine (Stage 3). L'entrypoint script initialise automatiquement la base de donnees au premier demarrage avec le seed minimal (roles, utilisateurs, regions, operateurs)."))

story.append(h3("2.2 Reinitialisation de la base"))
story.append(code("docker-compose down -v    # Supprime le volume de donnees"))
story.append(code("docker-compose up --build  # Reconstruit et reinitialise"))
story.append(note("Le flag -v supprime le volume Docker contenant la base SQLite. Au redemarrage, le seed minimal s'execute automatiquement."))

# ─── Section 3 ───
story.append(h1("3. Comptes de connexion et cles API"))
story.append(h2("3.1 Comptes utilisateurs"))
story.append(make_table([
    ["Email", "Role", "Organisation", "Mot de passe"],
    ["admin@arpt.gn", "SUPER_ADMIN", "ARPT", "Admin@2026!"],
    ["dg@arpt.gn", "DG", "ARPT", "Admin@2026!"],
    ["dga@arpt.gn", "DGA", "ARPT", "Admin@2026!"],
    ["dir.tech@arpt.gn", "DIRECTEUR_TECHNIQUE", "ARPT", "Admin@2026!"],
    ["ing.rf@arpt.gn", "INGENIEUR_RF", "ARPT", "Admin@2026!"],
    ["analyste@arpt.gn", "ANALYSTE_QOS", "ARPT", "Admin@2026!"],
    ["auditeur@arpt.gn", "AUDITEUR", "ARPT", "Admin@2026!"],
    ["tech@orange.gn", "OPERATEUR_READONLY", "Orange Guinee", "Admin@2026!"],
    ["tech@mtn.gn", "OPERATEUR_READONLY", "MTN Guinee", "Admin@2026!"],
    ["tech@celcom.gn", "OPERATEUR_READONLY", "Celcom Guinee", "Admin@2026!"],
    ["tech@guinetel.gn", "OPERATEUR_READONLY", "Guinee Telecom", "Admin@2026!"],
], col_widths=[105, 100, 90, 80]))
story.append(sp(6))

story.append(h2("3.2 Cles API Prestataire"))
story.append(make_table([
    ["Operateur", "Cle API"],
    ["Orange Guinee", "prest-orange-2026-ak1a2b3c4d"],
    ["MTN Guinee", "prest-mtn-2026-x9y8z7w6v5"],
    ["Celcom Guinee", "prest-celcom-2026-p1q2r3s4t5"],
    ["Guinee Telecom", "prest-guinetel-2026-m6n7o8p9q0"],
], col_widths=[120, 340]))
story.append(sp(6))
story.append(note("Les cles API sont transmises via le header HTTP X-API-Key. En production, ces cles doivent etre stockees de maniere securisee et chiffrees."))

# ─── Section 4 ───
story.append(h1("4. Phase 1 — Authentification et acces"))
story.append(p("Cette phase valide le systeme d'authentification NextAuth avec credentials, la gestion des sessions JWT (8 heures), et les redirections selon les roles. Testez chaque compte un par un pour verifier les droits d'acces."))
story.append(h3("Etapes de test"))
story.append(bullet("Ouvrir http://localhost:3000 dans le navigateur"))
story.append(bullet("Verifier que la page publique s'affiche (tab Public) sans authentification"))
story.append(bullet("Cliquer sur un onglet protege (Dashboard, QoS, SIG, etc.) — la modale de connexion doit apparaitre"))
story.append(bullet("Se connecter avec admin@arpt.gn / Admin@2026! — le dashboard DG doit s'afficher"))
story.append(bullet("Se deconnecter, puis se reconnecter avec tech@orange.gn — seule la vue operateur doit etre accessible"))
story.append(bullet("Tester un mot de passe incorrect — message d'erreur attendu"))
story.append(bullet("Tester un email inexistant — message d'erreur attendu"))
story.append(bullet("Verifier la persistance de la session (recharger la page)"))
story.append(h3("Resultats attendus"))
story.append(bullet("Authentification reussie pour tous les 11 comptes"))
story.append(bullet("Session persiste pendant 8 heures"))
story.append(bullet("Les operateurs ne voient que leurs propres donnees"))
story.append(bullet("Le dashboard s'adapte au role de l'utilisateur"))

# ─── Section 5 ───
story.append(h1("5. Phase 2 — Injection des donnees via API Prestataire"))
story.append(p("Cette phase injecte toutes les donnees de test via l'API Prestataire. Le script Python inject_data.py automatise l'injection en lots de 20 mesures avec des pauses entre les requetes pour assurer la stabilite du serveur."))
story.append(h3("Commande d'injection"))
story.append(code("python3 test-data/inject_data.py"))
story.append(p("Le script injecte successivement : les scores (16 au total, 4 par operateur sur 4 periodes), les mesures QoS (1280 au total, 80 par operateur par periode), et les alertes (8 au total). A la fin, il affiche un resume et verifie l'etat du serveur."))
story.append(h3("Verification manuelle"))
story.append(bullet("Appeler GET /api — verifier que stats contient measures=1280, operators=4, campaigns=4, alerts=8"))
story.append(bullet("Appeler GET /api/prestataire avec chaque cle API — verifier les compteurs par operateur"))
story.append(bullet("Verifier que les campagnes auto-crees sont en statut EN_COURS"))

# ─── Section 6 ───
story.append(h1("6. Phase 3 — Verification du dashboard DG"))
story.append(p("Le dashboard du Directeur General est la vue strategique principale. Il doit afficher les KPIs cles, les classements des operateurs, les alertes actives, et les tendances. Verifiez que toutes les donnees injectees sont correctement aggregees et presentees."))
story.append(h3("Points de verification"))
story.append(bullet("KPI principal : nombre total de mesures (1280 attendues)"))
story.append(bullet("Classement des operateurs : Orange (1er) > MTN (2e) > Celcom (3e) > Guinee Telecom (4e)"))
story.append(bullet("Score moyen national : calculer a partir des scores injectes"))
story.append(bullet("Nombre d'alertes actives : 8 alertes non resolues"))
story.append(bullet("Tendances trimestrielles : progression visible de Q2 2025 a Q1 2026"))
story.append(bullet("Graphiques et visualisations : verifier que les donnees s'affichent correctement"))

# ─── Section 7 ───
story.append(h1("7. Phase 4 — Test du module QoS"))
story.append(p("Le module QoS affiche les metriques detaillees de qualite de service : metriques RF (RSSI, RSRP, RSRQ, SINR), metriques reseau (latence, debit, jitter), metriques Internet (download, upload, ping, DNS), et metriques QoE (score experience, temps de chargement, buffering video)."))
story.append(h3("Points de verification"))
story.append(bullet("Filtrage par operateur : verifier que chaque operateur n'affiche que ses propres mesures"))
story.append(bullet("Filtrage par region : les 8 regions doivent apparaître avec des donnees"))
story.append(bullet("Filtrage par periode : 4 periodes disponibles (2025-Q2 a 2026-Q1)"))
story.append(bullet("Zones blanches : les mesures avec RSSI < -100 dBm doivent etre identifiees"))
story.append(bullet("Benchmark : comparaison entre operateurs sur une meme region"))
story.append(bullet("Export : tester l'export CSV des mesures"))

# ─── Section 8 ───
story.append(h1("8. Phase 5 — Test du module SIG (carte interactive)"))
story.append(p("Le module SIG affiche une carte interactive Leaflet de la Guinee avec les prefectures, les points de mesure, et les zones de couverture. Le decoupage CNT (16 regions) et le decoupage classique (8 regions) sont disponibles via un toggle."))
story.append(h3("Points de verification"))
story.append(bullet("La carte s'affiche correctement avec les frontieres des 34 prefectures"))
story.append(bullet("Toggle CNT / Ancien decoupage : verifiez que les deux vues fonctionnent"))
story.append(bullet("Points de mesure : 1280 points doivent etre visibles sur la carte"))
story.append(bullet("Popups : cliquer sur un point doit afficher les metriques detaillees"))
story.append(bullet("Couleurs par operateur : Orange (#FF7900), MTN (#FFCC00), Celcom (#00B4D8), Guinee Telecom (#2DD4BF)"))
story.append(bullet("Filtrage par operateur et par region sur la carte"))
story.append(bullet("Zoom et navigation fluide"))

# ─── Section 9 ───
story.append(h1("9. Phase 6 — Test du module Scoring"))
story.append(p("Le module Scoring affiche les scores composites des operateurs avec un radar chart et les tendances par periode. Chaque score est decompose en 5 sous-scores : Couverture, QoS, QoE, Conformite, et Score Global."))
story.append(h3("Points de verification"))
story.append(bullet("Radar chart : 4 operateurs avec 5 axes (Couverture, QoS, QoE, Conformite, Global)"))
story.append(bullet("Tendances : evolution de Q2 2025 a Q1 2026 — tous les operateurs progressent"))
story.append(bullet("Orange : score global de 70 a 78 (leader)"))
story.append(bullet("MTN : score global de 68 a 74 (challenger)"))
story.append(bullet("Celcom : score global de 55 a 65 (moyen)"))
story.append(bullet("Guinee Telecom : score global de 42 a 52 (faible, en progression)"))
story.append(bullet("Recommandations : affichees pour la derniere periode"))

# ─── Section 10 ───
story.append(h1("10. Phase 7 — Test du module Alertes"))
story.append(p("Le module Alertes affiche les alertes actives et resolues. Huit alertes ont ete injectees couvrant differents types et niveaux de severite."))
story.append(make_table([
    ["Type", "Severite", "Operateur", "Region", "Message"],
    ["DEGRADATION", "CRITIQUE", "Celcom", "Faranah", "Latence > 100ms"],
    ["SEUIL_DEPASSE", "HAUTE", "MTN", "Boké", "Chute debit -35%"],
    ["NON_CONFORMITE", "CRITIQUE", "Celcom", "N'Zerekore", "Taux appel < 85%"],
    ["DEGRADATION", "MOYENNE", "Orange", "Labe", "Couverture 4G en baisse"],
    ["ZONE_BLANCHE", "HAUTE", "Guinee Tel.", "Faranah", "23 zones blanches"],
    ["DEGRADATION", "BASSE", "MTN", "Conakry", "Maintenance planifiee"],
    ["SEUIL_DEPASSE", "HAUTE", "Guinee Tel.", "Kankan", "Jitter > 20ms"],
    ["ZONE_BLANCHE", "CRITIQUE", "Guinee Tel.", "N'Zerekore", "Couverture inexistante"],
], col_widths=[75, 60, 60, 60, 205]))
story.append(sp(6))
story.append(h3("Etapes de test"))
story.append(bullet("Verifier que les 8 alertes s'affichent"))
story.append(bullet("Filtrer par severite : CRITIQUE (3), HAUTE (3), MOYENNE (1), BASSE (1)"))
story.append(bullet("Filtrer par operateur : Guinee Telecom a 3 alertes"))
story.append(bullet("Resoudre une alerte via PATCH /api/alerts — verifier le changement de statut"))
story.append(bullet("Creer une nouvelle alerte SIGNALEMENT_PUBLIC via POST /api/alerts (sans auth)"))

# ─── Section 11 ───
story.append(h1("11. Phase 8 — Test du module Rapports"))
story.append(p("Le module Rapports permet de consulter, creer et gerer les rapports. Au depart, aucun rapport n'existe (seed minimal). Vous devez creer des rapports manuellement pour tester cette fonctionnalite."))
story.append(h3("Etapes de test"))
story.append(bullet("Verifier que la liste des rapports est vide"))
story.append(bullet("Creer un rapport via POST /api/reports avec titre, type, format"))
story.append(bullet("Creer un rapport public (isPublic=true) et verifier qu'il est visible sans auth"))
story.append(bullet("Creer un rapport interne et verifier qu'il n'est pas visible publiquement"))
story.append(bullet("Tester les types : REGLEMENTAIRE, OPERATEUR, INTERNE, PUBLIC, BENCHMARK"))
story.append(bullet("Tester les formats : PDF, EXCEL, PPT"))

# ─── Section 12 ───
story.append(h1("12. Phase 9 — Test du module Administration"))
story.append(p("Le module Administration (accessible uniquement aux roles SUPER_ADMIN et DG) permet de gerer les utilisateurs, les roles et les permissions."))
story.append(h3("Etapes de test"))
story.append(bullet("Se connecter en tant que SUPER_ADMIN (admin@arpt.gn)"))
story.append(bullet("Lister les utilisateurs via GET /api/users — 11 utilisateurs attendus"))
story.append(bullet("Lister les roles via GET /api/roles — 9 roles attendus"))
story.append(bullet("Creer un nouvel utilisateur avec le role ANALYSTE_QOS"))
story.append(bullet("Modifier le role d'un utilisateur via PATCH /api/users"))
story.append(bullet("Desactiver un utilisateur (isActive=false) et verifier que la connexion echoue"))
story.append(bullet("Consulter les logs d'audit via GET /api/audit-logs"))

# ─── Section 13 ───
story.append(h1("13. Phase 10 — Test RBAC (controle d'acces)"))
story.append(p("Le controle d'acces base sur les roles (RBAC) est fondamental pour la securite de la plateforme. Chaque role a des permissions specifiques et des politiques d'acces aux donnees (RLS). Testez chaque role pour verifier que les restrictions sont correctement appliquees."))
story.append(make_table([
    ["Role", "Dashboard", "Mesures", "Scores", "Alertes", "Admin"],
    ["SUPER_ADMIN", "Complet", "Tout", "Tout", "Tout", "Oui"],
    ["DG", "Lecture+Export", "Tout", "Lecture+Export", "Lecture", "Non"],
    ["DGA", "Lecture+Export", "Tout", "Lecture+Export", "Lecture", "Non"],
    ["DIR_TECH", "Lecture", "Tout", "Lecture", "Lecture+Ecriture", "Non"],
    ["INGENIEUR_RF", "Lecture", "3 regions*", "Lecture", "Lecture", "Non"],
    ["ANALYSTE_QOS", "Lecture", "Tout", "Lecture+Export", "Lecture", "Non"],
    ["AUDITEUR", "Lecture", "Tout", "Lecture", "Lecture", "Non"],
    ["OPERATEUR", "Lecture", "Propres", "Propres", "Propres", "Non"],
    ["PUBLIC", "Public", "Aucun", "Public", "Aucun", "Non"],
], col_widths=[75, 70, 60, 75, 80, 40]))
story.append(note("* INGENIEUR_RF est limite aux regions CON, KIN, BOK"))

# ─── Section 14 ───
story.append(h1("14. Phase 11 — Tests de charge et comportement"))
story.append(p("Ces tests evaluent le comportement de la plateforme sous charge et avec des donnees atypiques. Ils sont essentiels pour valider la robustesse de la solution avant la mise en production."))
story.append(h3("14.1 Injection de volume eleve"))
story.append(bullet("Injecter 500 mesures en une seule requete batch (limite a 1000)"))
story.append(bullet("Verifier le temps de reponse — doit rester sous 30 secondes"))
story.append(bullet("Verifier l'integrite des donnees apres injection massive"))
story.append(h3("14.2 Donnees atypiques"))
story.append(bullet("Envoyer une mesure avec des valeurs hors limites (RSSI = 0, latence = 99999)"))
story.append(bullet("Verifier que la validation refuse les valeurs hors plage"))
story.append(bullet("Envoyer une mesure avec un regionCode inexistant"))
story.append(bullet("Verifier que l'API retourne une erreur 400 descriptive"))
story.append(h3("14.3 CSV import"))
story.append(bullet("Utiliser les fichiers CSV dans test-data/ pour tester l'import via Content-Type: text/csv"))
story.append(bullet("Verifier que le parsing CSV gere les accents et les virgules dans les valeurs"))
story.append(bullet("Tester un CSV avec des lignes mal formatees — les lignes invalides doivent etre ignorees"))

# ─── Section 15 ───
story.append(h1("15. Phase 12 — API Prestataire — remontee des donnees"))
story.append(p("L'API Prestataire est l'interface dediee aux operateurs et prestataires pour remonter automatiquement leurs donnees QoS dans la plateforme. Elle utilise une authentification par cle API et supporte les formats JSON et CSV."))
story.append(h3("15.1 Endpoints disponibles"))
story.append(make_table([
    ["Methode", "Endpoint", "Description"],
    ["GET", "/api/prestataire", "Verifier le statut de la connexion et les stats"],
    ["POST", "/api/prestataire", "Injecter des donnees (action: mesures|scores|alertes)"],
], col_widths=[60, 120, 280]))
story.append(sp(6))

story.append(h3("15.2 Authentification"))
story.append(code("curl -H \"X-API-Key: prest-orange-2026-ak1a2b3c4d\" http://localhost:3000/api/prestataire"))
story.append(p("Sans cle API valide, l'API retourne une erreur 401. La cle est associee a un operateur specifique — les donnees injectees sont automatiquement liees a cet operateur."))

story.append(h3("15.3 Injection de mesures (unitaire)"))
story.append(code("""curl -X POST -H "X-API-Key: prest-mtn-2026-x9y8z7w6v5" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"mesures","mesure":{...}}' \\
  http://localhost:3000/api/prestataire"""))
story.append(p("Les champs requis sont : latitude, longitude, timestamp, typeMesure. Le regionCode ou regionId est egalement requis. Si aucune campagne n'est specifiee, une campagne auto est creee."))

story.append(h3("15.4 Injection de mesures (batch)"))
story.append(code("""curl -X POST -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"mesures","campagneNom":"Campagne Q1","mesures":[...]}' \\
  http://localhost:3000/api/prestataire"""))
story.append(p("Maximum 1000 mesures par requete batch. Chaque mesure doit contenir les champs requis. Les mesures invalides sont ignorees et compteurs dans le champ 'errors' de la reponse."))

story.append(h3("15.5 Injection de scores"))
story.append(code("""curl -X POST -H "X-API-Key: prest-celcom-2026-p1q2r3s4t5" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"scores","periode":"2026-Q1","scoreGlobal":65,...}' \\
  http://localhost:3000/api/prestataire"""))
story.append(p("Les scores sont upsert : si un score existe deja pour le meme operateur et la meme periode, il est mis a jour. Les valeurs doivent etre entre 0 et 100."))

story.append(h3("15.6 Injection d'alertes"))
story.append(code("""curl -X POST -H "X-API-Key: prest-guinetel-2026-m6n7o8p9q0" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"alertes","type":"DEGRADATION","severity":"CRITIQUE","regionCode":"FAR","message":"..."}' \\
  http://localhost:3000/api/prestataire"""))

story.append(h3("15.7 Import CSV"))
story.append(code("""curl -X POST -H "X-API-Key: prest-orange-2026-ak1a2b3c4d" \\
  -H "Content-Type: text/csv" \\
  --data-binary @test-data/mesures_orange_csv_2026_Q1.csv \\
  http://localhost:3000/api/prestataire"""))
story.append(p("Le CSV doit contenir les colonnes : latitude, longitude, timestamp, typeMesure, regionCode, et les metriques optionnelles. Les colonnes sont insensibles a la casse."))

# ─── Section 16 ───
story.append(h1("16. Fichiers de test disponibles"))
story.append(p("Les fichiers de test sont generes par le script test-data/generate-test-data.ts et situes dans le repertoire test-data/. Chaque fichier contient des donnees realistes avec des zones de couverture et des zones blanches."))
story.append(make_table([
    ["Fichier", "Description", "Taille"],
    ["mesures_{op}_{periode}.json", "16 fichiers (4 ops × 4 periodes)", "80 mesures/fichier"],
    ["scores_{op}.json", "4 fichiers (1 par operateur)", "4 scores/fichier"],
    ["mesures_{op}_csv_2026_Q1.csv", "4 fichiers CSV", "64 lignes/fichier"],
    ["alertes_test.json", "8 alertes variees", "2 Ko"],
    ["inject_data.py", "Script d'injection complet", "3 Ko"],
    ["test_api_curl.sh", "Commandes curl de reference", "4 Ko"],
    ["inject_all_test_data.sh", "Script bash d'injection", "4 Ko"],
], col_widths=[140, 180, 140]))
story.append(sp(6))

# ─── Section 17 ───
story.append(h1("17. Commandes curl de reference"))
story.append(p("Voici les commandes curl essentielles pour tester l'API manuellement. Remplacez localhost:3000 par l'URL de votre instance Docker si necessaire."))

story.append(h3("17.1 Authentification"))
story.append(code("curl -X POST http://localhost:3000/api/auth/callback/credentials -d 'email=admin@arpt.gn&password=Admin@2026!'"))

story.append(h3("17.2 Verification de l'API"))
story.append(code("curl http://localhost:3000/api"))

story.append(h3("17.3 API Prestataire"))
story.append(code("# Statut\ncurl -H \"X-API-Key: prest-orange-2026-ak1a2b3c4d\" http://localhost:3000/api/prestataire\n\n# Injection score\ncurl -X POST -H \"X-API-Key: prest-orange-2026-ak1a2b3c4d\" -H \"Content-Type: application/json\" -d '{\"action\":\"scores\",\"periode\":\"2026-Q1\",\"scoreGlobal\":78}' http://localhost:3000/api/prestataire"))

story.append(h3("17.4 API internes (authentification requise)"))
story.append(code("# Campagnes\ncurl -b cookie.txt http://localhost:3000/api/campaigns\n\n# Mesures\ncurl -b cookie.txt http://localhost:3000/api/mesures?limit=50\n\n# Scores\ncurl -b cookie.txt http://localhost:3000/api/scores\n\n# Alertes\ncurl -b cookie.txt http://localhost:3000/api/alerts\n\n# Dashboard\ncurl -b cookie.txt http://localhost:3000/api/dashboard\n\n# Carte SIG\ncurl -b cookie.txt http://localhost:3000/api/map"))

# Build PDF
doc.build(story)
print(f"PDF genere: {OUTPUT_PDF}")
