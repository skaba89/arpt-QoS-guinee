#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║  ARPT-QoS-Guinée — Générateur de fichiers opérateurs           ║
║  1 an de données par trimestre (Q1-Q4) pour import manuel      ║
╚══════════════════════════════════════════════════════════════════╝

Génère pour chaque opérateur (ORANGE, MTN, CELCOM, INTERCEL) :
  - mesures-{OPERATEUR}-{ANNEE}-Q{N}.csv  → Mesures QoS brutes
  - scores-{OPERATEUR}-{ANNEE}-Q{N}.json   → Scores trimestriels
  - campagnes-{OPERATEUR}-{ANNEE}-Q{N}.json → Campagnes de mesure
"""

import csv
import json
import math
import os
import random
from datetime import datetime, timedelta
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════
# OUTPUT DIRECTORY
# ═══════════════════════════════════════════════════════════════════
OUTPUT_DIR = Path("/home/z/my-project/download/donnees-operateurs-2025")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ═══════════════════════════════════════════════════════════════════
# RÉGIONS DE GUINÉE (16 CNT)
# ═══════════════════════════════════════════════════════════════════
REGIONS = [
    {"code": "CON", "nom": "Conakry",       "lat": 9.5092,  "lng": -13.7122, "type": "urbain",       "pop": 2042000},
    {"code": "CYA", "nom": "Coyah",         "lat": 9.7200,  "lng": -13.3800, "type": "semi-urbain",  "pop": 325000},
    {"code": "KIN", "nom": "Kindia",        "lat": 10.0569, "lng": -12.8605, "type": "semi-urbain",  "pop": 680000},
    {"code": "BKE", "nom": "Boké",          "lat": 11.1852, "lng": -14.2941, "type": "semi-rural",   "pop": 550000},
    {"code": "KDR", "nom": "Koundara",      "lat": 12.3537, "lng": -13.1823, "type": "rural",        "pop": 290000},
    {"code": "LBE", "nom": "Labé",          "lat": 11.3170, "lng": -12.2832, "type": "semi-urbain",  "pop": 580000},
    {"code": "MLI", "nom": "Mali",          "lat": 12.0218, "lng": -12.1222, "type": "rural",        "pop": 310000},
    {"code": "DLB", "nom": "Dalaba",        "lat": 10.7000, "lng": -12.2500, "type": "rural",        "pop": 180000},
    {"code": "MMU", "nom": "Mamou",         "lat": 10.5167, "lng": -12.0833, "type": "semi-urbain",  "pop": 420000},
    {"code": "FRN", "nom": "Faranah",       "lat": 10.0333, "lng": -10.7333, "type": "semi-rural",   "pop": 340000},
    {"code": "KDG", "nom": "Kissidougou",   "lat": 9.2000,  "lng": -10.1000, "type": "rural",        "pop": 270000},
    {"code": "KKA", "nom": "Kankan",        "lat": 10.3833, "lng": -9.3000,  "type": "semi-urbain",  "pop": 650000},
    {"code": "SGR", "nom": "Siguiri",       "lat": 11.4000, "lng": -9.1700,  "type": "semi-rural",   "pop": 380000},
    {"code": "GKD", "nom": "Guéckédou",     "lat": 8.5600,  "lng": -10.1300, "type": "rural",        "pop": 220000},
    {"code": "BLA", "nom": "Beyla",         "lat": 8.8139,  "lng": -8.4073,  "type": "rural",        "pop": 190000},
    {"code": "ZKR", "nom": "N'Zérékoré",    "lat": 7.7500,  "lng": -8.8167,  "type": "semi-urbain",  "pop": 510000},
]

# ═══════════════════════════════════════════════════════════════════
# PROFILS OPÉRATEURS — Données réalistes Guinée
# ═══════════════════════════════════════════════════════════════════
OPERATORS = {
    "ORANGE": {
        "nom": "Orange Guinée",
        "couverture": 0.88,
        "rssiBase": -68,
        "rsrpBase": -88,
        "rsrqBase": -8,
        "sinrBase": 15,
        "debitDescBase": 28,
        "debitMontBase": 14,
        "debitDownBase": 42,
        "debitUpBase": 18,
        "latenceBase": 32,
        "gigueBase": 5,
        "tauxAppelBase": 97.5,
        "tauxDropBase": 3.5,
        "scoreQoEBase": 82,
        "pingBase": 28,
        "dnsBase": 35,
        "tcpBase": 60,
        "pageLoadBase": 2.5,
        "videoBufBase": 0.8,
        "degradationRurale": 0.65,
        "mesuresParRegion": {"urbain": 50, "semi-urbain": 35, "semi-rural": 25, "rural": 15},
        "scores": {
            "2025-Q1": {"global": 72, "couverture": 70, "qos": 74, "qoe": 73, "conformite": 71},
            "2025-Q2": {"global": 75, "couverture": 73, "qos": 78, "qoe": 77, "conformite": 74},
            "2025-Q3": {"global": 79, "couverture": 77, "qos": 82, "qoe": 81, "conformite": 79},
            "2025-Q4": {"global": 82, "couverture": 80, "qos": 85, "qoe": 84, "conformite": 82},
        },
        "recommandations": {
            "2025-Q1": "Poursuivre la politique tarifaire compétitive",
            "2025-Q2": "Déployer la 5G à Conakry en 2026",
            "2025-Q3": "Étendre la couverture en zone rurale (Faranah, Kissidougou, Beyla)",
            "2025-Q4": "Maintenir les investissements en infrastructure 4G+",
        },
    },
    "MTN": {
        "nom": "MTN Guinée",
        "couverture": 0.75,
        "rssiBase": -74,
        "rsrpBase": -95,
        "rsrqBase": -11,
        "sinrBase": 10,
        "debitDescBase": 20,
        "debitMontBase": 10,
        "debitDownBase": 30,
        "debitUpBase": 12,
        "latenceBase": 42,
        "gigueBase": 8,
        "tauxAppelBase": 95.0,
        "tauxDropBase": 6.0,
        "scoreQoEBase": 74,
        "pingBase": 38,
        "dnsBase": 50,
        "tcpBase": 90,
        "pageLoadBase": 4.0,
        "videoBufBase": 2.0,
        "degradationRurale": 0.55,
        "mesuresParRegion": {"urbain": 40, "semi-urbain": 28, "semi-rural": 18, "rural": 10},
        "scores": {
            "2025-Q1": {"global": 62, "couverture": 58, "qos": 65, "qoe": 63, "conformite": 61},
            "2025-Q2": {"global": 65, "couverture": 62, "qos": 69, "qoe": 67, "conformite": 65},
            "2025-Q3": {"global": 68, "couverture": 66, "qos": 73, "qoe": 71, "conformite": 68},
            "2025-Q4": {"global": 72, "couverture": 70, "qos": 76, "qoe": 74, "conformite": 71},
        },
        "recommandations": {
            "2025-Q1": "Renforcer la redondance du réseau à Conakry",
            "2025-Q2": "Accélérer le déploiement 4G en zone semi-urbaine",
            "2025-Q3": "Investir dans le backhaul fibre vers Labé et Kankan",
            "2025-Q4": "Améliorer la couverture en région forestière",
        },
    },
    "CELCOM": {
        "nom": "Celcom Guinée",
        "couverture": 0.55,
        "rssiBase": -82,
        "rsrpBase": -102,
        "rsrqBase": -14,
        "sinrBase": 5,
        "debitDescBase": 12,
        "debitMontBase": 5,
        "debitDownBase": 18,
        "debitUpBase": 6,
        "latenceBase": 65,
        "gigueBase": 15,
        "tauxAppelBase": 90.0,
        "tauxDropBase": 12.0,
        "scoreQoEBase": 58,
        "pingBase": 58,
        "dnsBase": 80,
        "tcpBase": 150,
        "pageLoadBase": 8.0,
        "videoBufBase": 6.0,
        "degradationRurale": 0.35,
        "mesuresParRegion": {"urbain": 30, "semi-urbain": 20, "semi-rural": 12, "rural": 6},
        "scores": {
            "2025-Q1": {"global": 42, "couverture": 38, "qos": 48, "qoe": 44, "conformite": 40},
            "2025-Q2": {"global": 45, "couverture": 42, "qos": 52, "qoe": 48, "conformite": 44},
            "2025-Q3": {"global": 48, "couverture": 45, "qos": 56, "qoe": 52, "conformite": 48},
            "2025-Q4": {"global": 55, "couverture": 50, "qos": 60, "qoe": 57, "conformite": 52},
        },
        "recommandations": {
            "2025-Q1": "Présenter un plan d'investissement crédible à l'ARPT sous 30 jours",
            "2025-Q2": "Résorber les zones blanches à Labé, Dalaba et Faranah",
            "2025-Q3": "Moderniser le réseau 3G vers 4G dans les 6 prochains mois",
            "2025-Q4": "Plan de déploiement URGENT en zone rurale",
        },
    },
    "INTERCEL": {
        "nom": "Intercel Guinée",
        "couverture": 0.32,
        "rssiBase": -90,
        "rsrpBase": -110,
        "rsrqBase": -16,
        "sinrBase": -2,
        "debitDescBase": 4,
        "debitMontBase": 1,
        "debitDownBase": 6,
        "debitUpBase": 2,
        "latenceBase": 110,
        "gigueBase": 30,
        "tauxAppelBase": 82.0,
        "tauxDropBase": 22.0,
        "scoreQoEBase": 42,
        "pingBase": 100,
        "dnsBase": 150,
        "tcpBase": 300,
        "pageLoadBase": 20.0,
        "videoBufBase": 15.0,
        "degradationRurale": 0.15,
        "mesuresParRegion": {"urbain": 20, "semi-urbain": 12, "semi-rural": 6, "rural": 3},
        "scores": {
            "2025-Q1": {"global": 28, "couverture": 22, "qos": 35, "qoe": 32, "conformite": 27},
            "2025-Q2": {"global": 30, "couverture": 25, "qos": 38, "qoe": 35, "conformite": 30},
            "2025-Q3": {"global": 33, "couverture": 28, "qos": 42, "qoe": 38, "conformite": 33},
            "2025-Q4": {"global": 38, "couverture": 32, "qos": 46, "qoe": 41, "conformite": 37},
        },
        "recommandations": {
            "2025-Q1": "Plan de redressement à soumettre à l'ARPT — délai 60 jours",
            "2025-Q2": "Remplacement des équipements obsolètes (2G vers minimum 3G)",
            "2025-Q3": "Extension géographique PRIORITAIRE — 85% du territoire non couvert",
            "2025-Q4": "MISE EN DEMEURE : Restructuration complète du réseau requise",
        },
    },
}

# ═══════════════════════════════════════════════════════════════════
# UTILITAIRES
# ═══════════════════════════════════════════════════════════════════

def rand(min_v, max_v):
    return random.uniform(min_v, max_v)

def rand_int(min_v, max_v):
    return random.randint(min_v, max_v)

def clamp(v, min_v, max_v):
    return max(min_v, min(max_v, v))

def round_to(v, decimals=1):
    factor = 10 ** decimals
    return round(v * factor) / factor

def random_point(center_lat, center_lng, radius_km):
    radius_deg = radius_km / 111.0
    angle = random.random() * 2 * math.pi
    distance = random.random() * radius_deg
    return {
        "lat": clamp(center_lat + math.cos(angle) * distance, 4, 15),
        "lng": clamp(center_lng + math.sin(angle) * distance, -17, -7),
    }

def quarter_dates(year, quarter):
    """Returns (start_date, end_date) for a given quarter."""
    start_month = (quarter - 1) * 3 + 1
    start = datetime(year, start_month, 1)
    end_month = start_month + 2  # last month of quarter
    if end_month == 12:
        end = datetime(year + 1, 1, 1) - timedelta(seconds=1)
    else:
        end = datetime(year, end_month + 1, 1) - timedelta(seconds=1)
    return start, end

def random_timestamp_in_quarter(year, quarter):
    """Generate a random timestamp within a quarter."""
    start, end = quarter_dates(year, quarter)
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    ts = start + timedelta(seconds=random_seconds)
    return ts

# ═══════════════════════════════════════════════════════════════════
# GÉNÉRATION MESURES QoS
# ═══════════════════════════════════════════════════════════════════

CSV_HEADERS = [
    "operateur", "region", "regionNom", "latitude", "longitude", "typeMesure", "timestamp",
    "rssi", "rsrp", "rsrq", "sinr",
    "debitDescendant", "debitMontant", "latence", "gigue",
    "tauxAppelReussi", "tauxDropCall",
    "debitDownload", "debitUpload", "ping",
    "dnsLookupTime", "tcpConnectTime",
    "scoreQoE", "pageLoadTime", "videoBuffering",
    "campagne"
]

def generate_mesure(op_code, op_profile, region, year, quarter):
    """Generate a single QoS measurement."""
    is_urbain = region["type"] == "urbain"
    is_semi_urbain = region["type"] == "semi-urbain"
    is_semi_rural = region["type"] == "semi-rural"
    
    zone_factor = 1.0 if is_urbain else (0.82 if is_semi_urbain else (0.65 if is_semi_rural else op_profile["degradationRurale"]))
    
    # Random GPS point near region center
    radius = 15 if is_urbain else (30 if is_semi_urbain else (45 if is_semi_rural else 60))
    point = random_point(region["lat"], region["lng"], radius)
    
    # Is this point covered?
    is_covered = random.random() < op_profile["couverture"] * zone_factor
    
    # Measurement type
    type_mesure = random.choice(["MOBILE", "MOBILE", "INTERNET"])  # 2/3 mobile, 1/3 internet
    
    # Timestamp within quarter
    ts = random_timestamp_in_quarter(year, quarter)
    
    # Campaign name
    periode = f"{year}-Q{quarter}"
    campagne = f"Drive Test {region['nom']} {periode}"
    
    if not is_covered:
        # Zone blanche — very poor signal
        return {
            "operateur": op_code,
            "region": region["code"],
            "regionNom": region["nom"],
            "latitude": round_to(point["lat"], 6),
            "longitude": round_to(point["lng"], 6),
            "typeMesure": type_mesure,
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "rssi": round_to(clamp(op_profile["rssiBase"] + rand(-25, -8), -150, -30), 1),
            "rsrp": round_to(clamp(op_profile["rsrpBase"] + rand(-25, -8), -140, -44), 1),
            "rsrq": round_to(clamp(-15 + rand(-5, -1), -20, -3), 1),
            "sinr": round_to(clamp(rand(-12, -2), -20, 30), 1),
            "debitDescendant": "",
            "debitMontant": "",
            "latence": round_to(clamp(op_profile["latenceBase"] * 3 + rand(50, 800), 0, 5000), 1),
            "gigue": round_to(clamp(rand(30, 150), 0, 500), 1),
            "tauxAppelReussi": round_to(clamp(rand(0, 35), 0, 100), 1),
            "tauxDropCall": round_to(clamp(rand(35, 80), 0, 100), 1),
            "debitDownload": round_to(clamp(rand(0, 0.5), 0, 1000), 2),
            "debitUpload": round_to(clamp(rand(0, 0.2), 0, 500), 2),
            "ping": round_to(clamp(rand(200, 2000), 0, 5000), 1),
            "dnsLookupTime": round_to(clamp(rand(100, 800), 0, 5000), 1),
            "tcpConnectTime": round_to(clamp(rand(300, 2000), 0, 5000), 1),
            "scoreQoE": round_to(clamp(rand(0, 15), 0, 100), 0),
            "pageLoadTime": round_to(clamp(rand(15, 60), 0, 60000), 2),
            "videoBuffering": round_to(clamp(rand(10, 45), 0, 60000), 2),
            "campagne": campagne,
        }
    
    # Covered zone — apply zone factor + slight randomness
    noise = lambda base, pct=0.15: base * zone_factor * (1 + rand(-pct, pct))
    
    rssi = round_to(clamp(op_profile["rssiBase"] * zone_factor + rand(-8, 8), -150, -30), 1)
    rsrp = round_to(clamp(op_profile["rsrpBase"] * zone_factor + rand(-10, 10), -140, -44), 1)
    rsrq = round_to(clamp(op_profile["rsrqBase"] * zone_factor + rand(-3, 3), -20, -3), 1)
    sinr = round_to(clamp(op_profile["sinrBase"] * zone_factor + rand(-5, 5), -20, 30), 1)
    
    latence = round_to(clamp(noise(op_profile["latenceBase"], 0.2), 1, 5000), 1)
    gigue = round_to(clamp(noise(op_profile["gigueBase"], 0.3), 0.5, 500), 1)
    taux_appel = round_to(clamp(noise(op_profile["tauxAppelBase"], 0.03), 0, 100), 1)
    taux_drop = round_to(clamp(noise(op_profile["tauxDropBase"], 0.3), 0, 100), 1)
    score_qoe = round_to(clamp(noise(op_profile["scoreQoEBase"], 0.1), 0, 100), 0)
    
    if type_mesure == "INTERNET":
        debit_desc = round_to(clamp(noise(op_profile["debitDescBase"], 0.2), 0, 300), 1)
        debit_mont = round_to(clamp(noise(op_profile["debitMontBase"], 0.25), 0, 150), 1)
        debit_dl = round_to(clamp(noise(op_profile["debitDownBase"], 0.2), 0, 1000), 2)
        debit_ul = round_to(clamp(noise(op_profile["debitUpBase"], 0.25), 0, 500), 2)
        ping = round_to(clamp(noise(op_profile["pingBase"], 0.2), 1, 5000), 1)
        dns = round_to(clamp(noise(op_profile["dnsBase"], 0.25), 5, 5000), 1)
        tcp = round_to(clamp(noise(op_profile["tcpBase"], 0.2), 10, 5000), 1)
        page_load = round_to(clamp(noise(op_profile["pageLoadBase"], 0.3), 0.1, 60000), 2)
        video_buf = round_to(clamp(noise(op_profile["videoBufBase"], 0.4), 0, 60000), 2)
    else:
        debit_desc = round_to(clamp(noise(op_profile["debitDescBase"] * 0.7, 0.2), 0, 300), 1)
        debit_mont = round_to(clamp(noise(op_profile["debitMontBase"] * 0.7, 0.25), 0, 150), 1)
        debit_dl = ""
        debit_ul = ""
        ping = ""
        dns = ""
        tcp = ""
        page_load = round_to(clamp(noise(op_profile["pageLoadBase"] * 1.2, 0.3), 0.1, 60000), 2)
        video_buf = ""
    
    return {
        "operateur": op_code,
        "region": region["code"],
        "regionNom": region["nom"],
        "latitude": round_to(point["lat"], 6),
        "longitude": round_to(point["lng"], 6),
        "typeMesure": type_mesure,
        "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "rssi": rssi,
        "rsrp": rsrp,
        "rsrq": rsrq,
        "sinr": sinr,
        "debitDescendant": debit_desc,
        "debitMontant": debit_mont,
        "latence": latence,
        "gigue": gigue,
        "tauxAppelReussi": taux_appel,
        "tauxDropCall": taux_drop,
        "debitDownload": debit_dl,
        "debitUpload": debit_ul,
        "ping": ping,
        "dnsLookupTime": dns,
        "tcpConnectTime": tcp,
        "scoreQoE": score_qoe,
        "pageLoadTime": page_load,
        "videoBuffering": video_buf,
        "campagne": campagne,
    }

# ═══════════════════════════════════════════════════════════════════
# MAIN GENERATION
# ═══════════════════════════════════════════════════════════════════

YEAR = 2025
QUARTERS = [1, 2, 3, 4]

total_mesures = 0
total_files = 0

print("=" * 70)
print("  ARPT-QoS-Guinée — Générateur de fichiers opérateurs")
print("  1 an de données par trimestre (2025 Q1–Q4)")
print("=" * 70)
print()

for op_code, op_profile in OPERATORS.items():
    print(f"\n📡 {op_profile['nom']} ({op_code})")
    print("-" * 50)
    
    for quarter in QUARTERS:
        periode = f"{YEAR}-Q{quarter}"
        start_date, end_date = quarter_dates(YEAR, quarter)
        
        # ─── MESURES CSV ───
        csv_path = OUTPUT_DIR / f"mesures-{op_code.lower()}-{YEAR}-Q{quarter}.csv"
        mesures_list = []
        
        for region in REGIONS:
            count = op_profile["mesuresParRegion"].get(region["type"], 5)
            for _ in range(count):
                m = generate_mesure(op_code, op_profile, region, YEAR, quarter)
                mesures_list.append(m)
        
        random.shuffle(mesures_list)  # Shuffle for realism
        
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
            writer.writeheader()
            writer.writerows(mesures_list)
        
        total_mesures += len(mesures_list)
        total_files += 1
        
        # ─── SCORES JSON ───
        scores_path = OUTPUT_DIR / f"scores-{op_code.lower()}-{YEAR}-Q{quarter}.json"
        scores_data = op_profile["scores"].get(periode, {})
        recom = op_profile["recommandations"].get(periode, "")
        
        score_json = {
            "operateur": op_code,
            "operateurNom": op_profile["nom"],
            "periode": periode,
            "dateDebut": start_date.strftime("%Y-%m-%d"),
            "dateFin": end_date.strftime("%Y-%m-%d"),
            "scoreGlobal": scores_data.get("global", 0),
            "scoreCouverture": scores_data.get("couverture", 0),
            "scoreQoS": scores_data.get("qos", 0),
            "scoreQoE": scores_data.get("qoe", 0),
            "scoreConformite": scores_data.get("conformite", 0),
            "recommandation": recom,
        }
        
        with open(scores_path, "w", encoding="utf-8") as f:
            json.dump(score_json, f, indent=2, ensure_ascii=False)
        
        total_files += 1
        
        # ─── CAMPAGNES JSON ───
        campagnes_path = OUTPUT_DIR / f"campagnes-{op_code.lower()}-{YEAR}-Q{quarter}.json"
        campagnes_list = []
        
        for region in REGIONS:
            campagne = {
                "nom": f"Drive Test {region['nom']} {periode}",
                "type": "DRIVE_TEST",
                "operateur": op_code,
                "region": region["code"],
                "dateDebut": start_date.strftime("%Y-%m-%d"),
                "dateFin": (start_date + timedelta(days=random.randint(14, 45))).strftime("%Y-%m-%d"),
                "statut": "TERMINEE",
                "responsable": f"Équipe {op_code} {region['nom']}",
            }
            campagnes_list.append(campagne)
        
        with open(campagnes_path, "w", encoding="utf-8") as f:
            json.dump(campagnes_list, f, indent=2, ensure_ascii=False)
        
        total_files += 1
        
        print(f"  ✅ {periode}: {len(mesures_list)} mesures | scores | {len(campagnes_list)} campagnes")

# ═══════════════════════════════════════════════════════════════════
# RÉSUMÉ GLOBAL
# ═══════════════════════════════════════════════════════════════════

print("\n" + "=" * 70)
print(f"  ✅ GÉNÉRATION TERMINÉE")
print(f"  📁 Répertoire: {OUTPUT_DIR}")
print(f"  📊 Total mesures: {total_mesures}")
print(f"  📄 Total fichiers: {total_files}")
print("=" * 70)

# ═══════════════════════════════════════════════════════════════════
# FICHIER README avec instructions d'import
# ═══════════════════════════════════════════════════════════════════

readme = f"""# ARPT-QoS-Guinée — Fichiers Opérateurs 2025

## Contenu

Ce répertoire contient les données de **1 an complet (4 trimestres)** pour les 4 opérateurs de Guinée.

### Structure des fichiers

Pour chaque opérateur et chaque trimestre, vous trouverez 3 fichiers :

| Fichier | Description |
|---------|-------------|
| `mesures-{{OP}}-2025-Q{{N}}.csv` | Mesures QoS brutes (drive test) |
| `scores-{{OP}}-2025-Q{{N}}.json` | Score trimestriel de l'opérateur |
| `campagnes-{{OP}}-2025-Q{{N}}.json` | Campagnes de mesure |

### Opérateurs

| Code | Opérateur | Couverture | Qualité réseau |
|------|-----------|------------|----------------|
| ORANGE | Orange Guinée | 88% | Leader — 4G/4G+ |
| MTN | MTN Guinée | 75% | Bonne couverture urbaine |
| CELCOM | Celcom Guinée | 55% | Couverture limitée |
| INTERCEL | Intercel Guinée | 32% | Réseau dégradé |

### Trimestres

| Période | Dates |
|---------|-------|
| 2025-Q1 | 1er janvier – 31 mars 2025 |
| 2025-Q2 | 1er avril – 30 juin 2025 |
| 2025-Q3 | 1er juillet – 30 septembre 2025 |
| 2025-Q4 | 1er octobre – 31 décembre 2025 |

## Import dans l'application

### Option 1 : Via l'API Prestataire (recommandé)

Chaque opérateur importe ses données via sa clé API :

```bash
# Importer les mesures QoS (max 5000 par appel)
curl -X POST http://localhost:3000/api/prestataires/mesures \\
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \\
  -H "Content-Type: application/json" \\
  -d @mesures-orange-2025-Q1.json

# Importer les scores trimestriels
curl -X POST http://localhost:3000/api/prestataires/scores \\
  -H "X-API-Key: onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ" \\
  -H "Content-Type: application/json" \\
  -d @scores-orange-2025-Q1.json
```

### Option 2 : Via le script d'import

```bash
# Convertir les CSV en JSON pour l'API, puis importer
npx tsx scripts/import-operateurs-api.ts --orange
```

### Clés API par opérateur

| Opérateur | Clé API |
|-----------|---------|
| Orange | `onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ` |
| MTN | `onit-MTN-f3Hb7nKcP5dAqW1xY8uE` |
| Celcom | `onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH` |
| Intercel | `onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ` |

## Format CSV des mesures

| Colonne | Type | Description |
|---------|------|-------------|
| operateur | string | Code opérateur (ORANGE, MTN, CELCOM, INTERCEL) |
| region | string | Code région (CON, CYA, KIN, etc.) |
| regionNom | string | Nom de la région |
| latitude | float | Latitude GPS |
| longitude | float | Longitude GPS |
| typeMesure | string | MOBILE ou INTERNET |
| timestamp | ISO8601 | Date et heure de la mesure |
| rssi | float | Puissance du signal reçu (dBm) |
| rsrp | float | Référence Signal Received Power (dBm) |
| rsrq | float | Référence Signal Received Quality (dB) |
| sinr | float | Signal to Interference plus Noise Ratio (dB) |
| debitDescendant | float | Débit descendant (Mbps) |
| debitMontant | float | Débit montant (Mbps) |
| latence | float | Latence (ms) |
| gigue | float | Gigue/Jitter (ms) |
| tauxAppelReussi | float | Taux d'appels réussis (%) |
| tauxDropCall | float | Taux d'appels coupés (%) |
| debitDownload | float | Débit download speedtest (Mbps) |
| debitUpload | float | Débit upload speedtest (Mbps) |
| ping | float | Ping (ms) |
| dnsLookupTime | float | Temps de résolution DNS (ms) |
| tcpConnectTime | float | Temps de connexion TCP (ms) |
| scoreQoE | float | Score Qualité d'Expérience (0-100) |
| pageLoadTime | float | Temps de chargement page (s) |
| videoBuffering | float | Temps de buffering vidéo (s) |
| campagne | string | Nom de la campagne de mesure |

---

*Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} — ARPT-QoS-Guinée*
"""

readme_path = OUTPUT_DIR / "README.md"
with open(readme_path, "w", encoding="utf-8") as f:
    f.write(readme)

print(f"\n📄 README créé : {readme_path}")
