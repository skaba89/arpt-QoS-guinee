#!/usr/bin/env python3
"""
Générateur de données réalistes pour ARPT-QoS-Guinée
Crée les fichiers CSV/JSON par trimestre (Q1-Q4 2025) pour les 4 opérateurs
Données importables via l'interface web (Import Données) ou l'API REST
"""

import csv
import json
import os
import random
from datetime import datetime, timedelta

random.seed(42)

# ─── Configuration des opérateurs ───────────────────────────────────
OPERATORS = {
    "ORANGE": {
        "name": "Orange Guinée",
        "base_rsrp": -82, "base_rsrq": -9, "base_sinr": 14,
        "base_download": 28, "base_upload": 10, "base_latence": 32,
        "base_call_success": 98.5, "base_drop_call": 1.2,
        "coverage_factor": 1.0,  # Leader du marché
        "qoe_factor": 1.0,
    },
    "MTN": {
        "name": "MTN Guinée",
        "base_rsrp": -87, "base_rsrq": -11, "base_sinr": 11,
        "base_download": 22, "base_upload": 8, "base_latence": 42,
        "base_call_success": 97.0, "base_drop_call": 2.0,
        "coverage_factor": 0.9,
        "qoe_factor": 0.92,
    },
    "CELCOM": {
        "name": "Celcom Guinée",
        "base_rsrp": -92, "base_rsrq": -14, "base_sinr": 8,
        "base_download": 14, "base_upload": 5, "base_latence": 58,
        "base_call_success": 94.0, "base_drop_call": 3.5,
        "coverage_factor": 0.7,
        "qoe_factor": 0.75,
    },
    "INTERCEL": {
        "name": "Intercel Guinée",
        "base_rsrp": -96, "base_rsrq": -16, "base_sinr": 5,
        "base_download": 8, "base_upload": 3, "base_latence": 78,
        "base_call_success": 90.0, "base_drop_call": 5.0,
        "coverage_factor": 0.55,
        "qoe_factor": 0.6,
    },
}

# ─── Régions de Guinée avec coordonnées GPS réelles ─────────────────
REGIONS = {
    "CON": {"nom": "Conakry", "lat": 10.0666, "lng": -12.8569, "urban": True, "pop_factor": 1.0},
    "KIN": {"nom": "Kindia", "lat": 10.0500, "lng": -12.3000, "urban": True, "pop_factor": 0.7},
    "BOK": {"nom": "Boké", "lat": 11.0500, "lng": -14.2000, "urban": False, "pop_factor": 0.4},
    "LAB": {"nom": "Labé", "lat": 11.3500, "lng": -12.5000, "urban": False, "pop_factor": 0.5},
    "KAN": {"nom": "Kankan", "lat": 10.3800, "lng": -9.3100, "urban": True, "pop_factor": 0.6},
    "NZE": {"nom": "Nzérékoré", "lat": 7.7500, "lng": -8.8200, "urban": False, "pop_factor": 0.45},
    "FAR": {"nom": "Faranah", "lat": 10.0300, "lng": -10.7500, "urban": False, "pop_factor": 0.3},
    "MAM": {"nom": "Mamou", "lat": 10.5000, "lng": -12.0800, "urban": False, "pop_factor": 0.35},
}

# ─── Trimestres 2025 ────────────────────────────────────────────────
QUARTERS = {
    "Q1-2025": {
        "label": "T1 2025 (Janvier - Mars)",
        "start": "2025-01-15", "end": "2025-03-20",
        "months": ["2025-01", "2025-02", "2025-03"],
        "periode": "2025-Q1",
        "season": "dry",  # Saison sèche
    },
    "Q2-2025": {
        "label": "T2 2025 (Avril - Juin)",
        "start": "2025-04-10", "end": "2025-06-18",
        "months": ["2025-04", "2025-05", "2025-06"],
        "periode": "2025-Q2",
        "season": "transition",  # Transition vers pluies
    },
    "Q3-2025": {
        "label": "T3 2025 (Juillet - Septembre)",
        "start": "2025-07-08", "end": "2025-09-15",
        "months": ["2025-07", "2025-08", "2025-09"],
        "periode": "2025-Q3",
        "season": "rainy",  # Saison des pluies - dégradations
    },
    "Q4-2025": {
        "label": "T4 2025 (Octobre - Décembre)",
        "start": "2025-10-10", "end": "2025-12-12",
        "months": ["2025-10", "2025-11", "2025-12"],
        "periode": "2025-Q4",
        "season": "dry",  # Retour saison sèche
    },
}

OUTPUT_DIR = "/home/z/my-project/download/donnees-operateurs"


def jitter(value, percent=10):
    """Add realistic variation to a value."""
    return round(value * (1 + random.uniform(-percent/100, percent/100)), 1)


def get_regional_degradation(region_code, season):
    """
    Compute degradation factor for a region and season.
    Rainy season degrades signals, especially in non-urban regions.
    Conakry always performs best; rural regions degrade more.
    """
    region = REGIONS[region_code]
    base = region["pop_factor"]  # Urban gets 1.0, rural gets less

    if season == "rainy":
        # Rainy season: rural areas get worse
        if region["urban"]:
            base *= 0.92  # Slight degradation in cities
        else:
            base *= 0.75  # Significant degradation in rural
    elif season == "transition":
        if region["urban"]:
            base *= 0.95
        else:
            base *= 0.85
    # Dry season: no additional penalty

    return base


def generate_drive_test_csv(op_code, quarter_key, num_points=40):
    """Generate Drive Test CSV for one operator and one quarter."""
    op = OPERATORS[op_code]
    q = QUARTERS[quarter_key]
    season = q["season"]

    rows = []
    for region_code in REGIONS:
        region = REGIONS[region_code]
        reg_factor = get_regional_degradation(region_code, season)
        campaign_name = f"Drive Test {region['nom']} {q['label'].split('(')[0].strip()}"

        # Number of measurements proportional to region importance
        points = max(3, int(num_points * region["pop_factor"] * op["coverage_factor"]))

        start_date = datetime.strptime(q["start"], "%Y-%m-%d")

        for i in range(points):
            # Generate timestamp within the quarter
            day_offset = random.randint(0, 85)
            hour = random.choice([8, 9, 10, 11, 14, 15, 16, 17])
            minute = random.randint(0, 59)
            ts = start_date + timedelta(days=day_offset, hours=hour, minutes=minute)

            # Small GPS variation around regional center
            lat = jitter(region["lat"], 0.3)
            lng = jitter(region["lng"], 0.3)

            # Signal quality based on operator + region + season
            rsrp = jitter(op["base_rsrp"] / reg_factor, 15)
            rssi = jitter(rsrp + 22, 8)
            rsrq = jitter(op["base_rsrq"] / reg_factor, 12)
            sinr = jitter(op["base_sinr"] * reg_factor, 15)

            # QoS metrics
            debit_desc = max(0.3, jitter(op["base_download"] * reg_factor, 18))
            debit_mont = max(0.1, jitter(op["base_upload"] * reg_factor, 18))
            latence = max(15, jitter(op["base_latence"] / reg_factor, 20))
            gigue = max(1, jitter(latence * 0.12, 25))

            # Call metrics (only for MOBILE type)
            taux_appel = min(100, max(50, jitter(op["base_call_success"] * reg_factor, 5)))
            taux_drop = max(0, jitter(op["base_drop_call"] / reg_factor, 20))

            rows.append({
                "operateur": op_code,
                "region": region_code,
                "latitude": lat,
                "longitude": lng,
                "typeMesure": "MOBILE",
                "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "rssi": round(rssi, 1),
                "rsrp": round(rsrp, 1),
                "rsrq": round(rsrq, 1),
                "sinr": round(sinr, 1),
                "debitDescendant": round(debit_desc, 2),
                "debitMontant": round(debit_mont, 2),
                "latence": round(latence, 1),
                "gigue": round(gigue, 1),
                "tauxAppelReussi": round(taux_appel, 2),
                "tauxDropCall": round(taux_drop, 2),
                "campagne": campaign_name,
            })

    return rows


def generate_qos_internet_csv(op_code, quarter_key, num_points=30):
    """Generate QoS Internet CSV for one operator and one quarter."""
    op = OPERATORS[op_code]
    q = QUARTERS[quarter_key]
    season = q["season"]

    rows = []
    for region_code in REGIONS:
        region = REGIONS[region_code]
        reg_factor = get_regional_degradation(region_code, season)
        campaign_name = f"QoS Internet {region['nom']} {q['label'].split('(')[0].strip()}"

        points = max(3, int(num_points * region["pop_factor"] * op["coverage_factor"]))
        start_date = datetime.strptime(q["start"], "%Y-%m-%d")

        for i in range(points):
            day_offset = random.randint(0, 85)
            hour = random.choice([9, 10, 11, 14, 15, 16, 20, 21])
            minute = random.randint(0, 59)
            ts = start_date + timedelta(days=day_offset, hours=hour, minutes=minute)

            lat = jitter(region["lat"], 0.3)
            lng = jitter(region["lng"], 0.3)

            # Internet metrics
            debit_dl = max(0.3, jitter(op["base_download"] * reg_factor, 20))
            debit_ul = max(0.1, jitter(op["base_upload"] * reg_factor, 20))
            ping = max(12, jitter(op["base_latence"] / reg_factor, 22))
            dns_time = max(3, jitter(ping * 0.35, 25))
            tcp_time = max(8, jitter(ping * 1.1, 20))
            score_qoe = min(100, max(0, round(80 * reg_factor * op["qoe_factor"] + random.uniform(-8, 8))))
            page_load = max(0.8, jitter(3.5 / reg_factor, 25))
            video_buf = max(0, jitter(1.5 / reg_factor, 30))

            rows.append({
                "operateur": op_code,
                "region": region_code,
                "latitude": lat,
                "longitude": lng,
                "typeMesure": "INTERNET",
                "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "debitDownload": round(debit_dl, 2),
                "debitUpload": round(debit_ul, 2),
                "ping": round(ping, 1),
                "dnsLookupTime": round(dns_time, 1),
                "tcpConnectTime": round(tcp_time, 1),
                "scoreQoE": score_qoe,
                "pageLoadTime": round(page_load, 2),
                "videoBuffering": round(video_buf, 2),
                "campagne": campaign_name,
            })

    return rows


def generate_scores_json(quarter_key):
    """Generate scoring JSON for all operators for one quarter."""
    q = QUARTERS[quarter_key]
    season = q["season"]

    # Base scores per operator (on a 0-100 scale)
    # These represent typical performance in dry season (best conditions)
    BASE_SCORES = {
        "ORANGE":   {"couverture": 85, "qos": 82, "qoe": 80, "conformite": 88},
        "MTN":      {"couverture": 78, "qos": 74, "qoe": 72, "conformite": 82},
        "CELCOM":   {"couverture": 62, "qos": 65, "qoe": 55, "conformite": 73},
        "INTERCEL": {"couverture": 48, "qos": 50, "qoe": 40, "conformite": 60},
    }

    # Season modifiers (applied to base scores)
    SEASON_MOD = {
        "dry":        {"couverture": 0, "qos": 0, "qoe": 0, "conformite": 0},
        "transition": {"couverture": -3, "qos": -4, "qoe": -5, "conformite": -2},
        "rainy":      {"couverture": -6, "qos": -8, "qoe": -10, "conformite": -4},
    }

    # Operator-specific seasonal resilience
    RESILIENCE = {
        "ORANGE": 2,    # More resilient to weather
        "MTN": 1,
        "CELCOM": -1,
        "INTERCEL": -3,  # Most vulnerable to weather
    }

    scores = []
    for op_code, op in OPERATORS.items():
        base = BASE_SCORES[op_code]
        season_mod = SEASON_MOD[season]
        resilience = RESILIENCE[op_code]

        # Compute each score with base + season modifier + resilience + random variation
        score_couverture = min(100, max(10, round(
            base["couverture"] + season_mod["couverture"] + resilience + random.uniform(-3, 3)
        )))
        score_qos = min(100, max(10, round(
            base["qos"] + season_mod["qos"] + resilience + random.uniform(-3, 3)
        )))
        score_qoe = min(100, max(10, round(
            base["qoe"] + season_mod["qoe"] + resilience + random.uniform(-4, 4)
        )))
        score_conformite = min(100, max(10, round(
            base["conformite"] + season_mod["conformite"] + resilience + random.uniform(-2, 2)
        )))

        # Weighted global score
        score_global = round(
            score_qos * 0.40 + score_couverture * 0.25 + score_qoe * 0.20 + score_conformite * 0.15,
            1
        )

        # Recommendations based on scores
        if score_global >= 80:
            reco = f"Bonne performance globale. Maintenir les investissements en infrastructure, en particulier en zone rurale."
        elif score_global >= 70:
            reco = f"Performance acceptable mais des améliorations sont nécessaires. Priorité: renforcer la couverture en zone rurale et améliorer la QoE."
        elif score_global >= 55:
            reco = f"Performance insuffisante. Mise en demeure requise pour amélioration de la couverture et de la qualité de service dans les régions déficitaires."
        else:
            reco = f"Performance critique. Sanctions réglementaires recommandées. Plan de redressement exigé sous 90 jours."

        scores.append({
            "operateur": op_code,
            "periode": q["periode"],
            "scoreGlobal": score_global,
            "scoreCouverture": score_couverture,
            "scoreQoS": score_qos,
            "scoreQoE": score_qoe,
            "scoreConformite": score_conformite,
            "recommandation": reco,
        })

    return {
        "description": f"Scores opérateurs {q['label']}",
        "type": "scoring_operateur",
        "scores": scores,
    }


def generate_alerts_json(quarter_key):
    """Generate realistic alerts for one quarter."""
    q = QUARTERS[quarter_key]
    season = q["season"]

    alerts = []
    alert_id = 1

    for op_code, op in OPERATORS.items():
        for region_code in REGIONS:
            reg_factor = get_regional_degradation(region_code, season)

            # More alerts during rainy season and for weaker operators
            alert_probability = (1 - reg_factor) * 0.5 + (0.3 if season == "rainy" else 0.1)

            if random.random() < alert_probability:
                # Determine alert type and severity
                if reg_factor < 0.6:
                    severity = "CRITIQUE"
                    alert_type = random.choice(["ZONE_BLANCHE", "DEGRADATION"])
                elif reg_factor < 0.75:
                    severity = random.choice(["HAUTE", "MOYENNE"])
                    alert_type = random.choice(["DEGRADATION", "SEUIL_DEPASSE"])
                else:
                    severity = "BASSE"
                    alert_type = "SEUIL_DEPASSE"

                region = REGIONS[region_code]

                messages = {
                    "ZONE_BLANCHE": f"Zone blanche détectée: absence de signal {op_code} dans la région de {region['nom']}. Aucune couverture mobile ni data sur plusieurs localités.",
                    "DEGRADATION": f"Dégradation significative du réseau {op_code} à {region['nom']}: RSRP moyen inférieur au seuil réglementaire. Plusieurs quartiers affectés.",
                    "SEUIL_DEPASSE": f"Seuil réglementaire dépassé pour {op_code} à {region['nom']}: débit descendant moyen en dessous de la valeur minimale requise.",
                    "NON_CONFORMITE": f"Non-conformité détectée: {op_code} ne respecte pas les obligations de couverture dans la région de {region['nom']}.",
                }

                details = {
                    "ZONE_BLANCHE": f"RSRP mesuré: -115 à -125 dBm. Taux de couverture: {round(reg_factor * 40)}%. Localités affectées détectées par drive test.",
                    "DEGRADATION": f"RSRP moyen: {round(-80 / reg_factor, 1)} dBm (seuil: -100 dBm). Débit moyen: {round(op['base_download'] * reg_factor, 1)} Mbps. Impact estimé: {round((1 - reg_factor) * 100)}% des abonnés de la zone.",
                    "SEUIL_DEPASSE": f"Débit moyen: {round(op['base_download'] * reg_factor, 1)} Mbps (seuil réglementaire: 5 Mbps). Latence: {round(op['base_latence'] / reg_factor)} ms. Score QoE: {round(80 * reg_factor * op['qoe_factor'])}/100.",
                    "NON_CONFORMITE": f"Taux de conformité: {round(reg_factor * op['coverage_factor'] * 100)}%. Obligations licence: couverture minimum 80% par région. Écart: {round(80 - reg_factor * op['coverage_factor'] * 100, 1)} points.",
                }

                # Random date within the quarter
                start_date = datetime.strptime(q["start"], "%Y-%m-%d")
                ts = start_date + timedelta(days=random.randint(0, 85), hours=random.randint(8, 18))

                alerts.append({
                    "type": alert_type,
                    "severity": severity,
                    "operateur": op_code,
                    "region": region_code,
                    "message": messages.get(alert_type, messages["DEGRADATION"]),
                    "details": details.get(alert_type, details["DEGRADATION"]),
                    "createdAt": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
                })
                alert_id += 1

    return alerts


def write_csv(rows, filepath):
    """Write rows to CSV file."""
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_json(data, filepath):
    """Write data to JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("=" * 70)
    print("  GÉNÉRATEUR DE DONNÉES ARPT-QoS-Guinée — Trimestres 2025")
    print("=" * 70)

    for q_key in QUARTERS:
        q = QUARTERS[q_key]
        print(f"\n📊 Génération {q['label']} (saison: {q['season']})...")

        # Generate per-operator measurement files
        for op_code in OPERATORS:
            op_dir = f"{OUTPUT_DIR}/{q_key}/{op_code}"
            os.makedirs(op_dir, exist_ok=True)

            # Drive Test CSV (MOBILE measurements)
            drive_test_rows = generate_drive_test_csv(op_code, q_key)
            drive_test_path = f"{op_dir}/drive-test-{q_key}.csv"
            write_csv(drive_test_rows, drive_test_path)
            print(f"   ✅ {op_code}: drive-test-{q_key}.csv ({len(drive_test_rows)} mesures)")

            # QoS Internet CSV
            qos_rows = generate_qos_internet_csv(op_code, q_key)
            qos_path = f"{op_dir}/qos-internet-{q_key}.csv"
            write_csv(qos_rows, qos_path)
            print(f"   ✅ {op_code}: qos-internet-{q_key}.csv ({len(qos_rows)} mesures)")

        # Generate combined scoring JSON for all operators
        scores_data = generate_scores_json(q_key)
        scores_path = f"{OUTPUT_DIR}/{q_key}/scores-operateurs-{q_key}.json"
        write_json(scores_data, scores_path)
        print(f"   ✅ scores-operateurs-{q_key}.json ({len(scores_data['scores'])} scores)")

        # Generate alerts JSON for the quarter
        alerts_data = generate_alerts_json(q_key)
        alerts_path = f"{OUTPUT_DIR}/{q_key}/alertes-{q_key}.json"
        write_json(alerts_data, alerts_path)
        print(f"   ✅ alertes-{q_key}.json ({len(alerts_data)} alertes)")

    # ─── Generate combined all-quarters files ──────────────────────
    print(f"\n📊 Génération des fichiers combinés...")

    all_scores = []
    all_alerts = []
    all_measurements_drive = []
    all_measurements_qos = []

    for q_key in QUARTERS:
        for op_code in OPERATORS:
            # Read and combine drive test CSVs
            drive_path = f"{OUTPUT_DIR}/{q_key}/{op_code}/drive-test-{q_key}.csv"
            if os.path.exists(drive_path):
                with open(drive_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    all_measurements_drive.extend(list(reader))

            # Read and combine QoS internet CSVs
            qos_path = f"{OUTPUT_DIR}/{q_key}/{op_code}/qos-internet-{q_key}.csv"
            if os.path.exists(qos_path):
                with open(qos_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    all_measurements_qos.extend(list(reader))

        # Combine scores
        scores_path = f"{OUTPUT_DIR}/{q_key}/scores-operateurs-{q_key}.json"
        if os.path.exists(scores_path):
            with open(scores_path, 'r', encoding='utf-8') as f:
                all_scores.extend(json.load(f)["scores"])

        # Combine alerts
        alerts_path = f"{OUTPUT_DIR}/{q_key}/alertes-{q_key}.json"
        if os.path.exists(alerts_path):
            with open(alerts_path, 'r', encoding='utf-8') as f:
                all_alerts.extend(json.load(f))

    # Write combined files
    write_csv(all_measurements_drive, f"{OUTPUT_DIR}/TOUS-drive-test-2025.csv")
    print(f"   ✅ TOUS-drive-test-2025.csv ({len(all_measurements_drive)} mesures)")

    write_csv(all_measurements_qos, f"{OUTPUT_DIR}/TOUS-qos-internet-2025.csv")
    print(f"   ✅ TOUS-qos-internet-2025.csv ({len(all_measurements_qos)} mesures)")

    write_json({"description": "Scores opérateurs année 2025 complète", "type": "scoring_operateur", "scores": all_scores}, f"{OUTPUT_DIR}/TOUS-scores-operateurs-2025.json")
    print(f"   ✅ TOUS-scores-operateurs-2025.json ({len(all_scores)} scores)")

    write_json(all_alerts, f"{OUTPUT_DIR}/TOUS-alertes-2025.json")
    print(f"   ✅ TOUS-alertes-2025.json ({len(all_alerts)} alertes)")

    # ─── Summary ──────────────────────────────────────────────────
    total_measurements = len(all_measurements_drive) + len(all_measurements_qos)
    print(f"\n{'=' * 70}")
    print(f"  ✅ GÉNÉRATION TERMINÉE")
    print(f"  📁 Répertoire: {OUTPUT_DIR}/")
    print(f"  📊 Total mesures: {total_measurements} (Drive Test: {len(all_measurements_drive)}, QoS Internet: {len(all_measurements_qos)})")
    print(f"  🏆 Total scores: {len(all_scores)}")
    print(f"  🚨 Total alertes: {len(all_alerts)}")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()
