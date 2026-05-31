#!/usr/bin/env python3
"""
Import rapide des données opérateurs via l'API prestataire.
Utilise des requêtes séquentielles avec un délai minimum.
"""
import csv
import json
import time
import sys
import urllib.request
import urllib.error

BASE_URL = "http://localhost:3000"
SCRIPT_DIR = "/home/z/my-project/download/donnees-operateurs-2025"

API_KEYS = {
    "ORANGE": "onit-ORANGE-k8Xp2mQvR9wLjN4sT7yZ",
    "MTN": "onit-MTN-f3Hb7nKcP5dAqW1xY8uE",
    "CELCOM": "onit-CELCOM-j6Rs4tGvB2mXeN9wK5pH",
    "INTERCEL": "onit-INTERCEL-q7Ld3oFwC8nYaP6xM2kJ",
}

OPERATORS = ["ORANGE", "MTN", "CELCOM", "INTERCEL"]
QUARTERS = ["Q1", "Q2", "Q3", "Q4"]

def api_post(endpoint, api_key, data):
    """POST to API and return response."""
    url = f"{BASE_URL}{endpoint}"
    payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-API-Key", api_key)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return json.loads(body)
        except:
            return {"error": f"HTTP {e.code}: {body[:200]}"}
    except Exception as e:
        return {"error": str(e)}

def csv_to_mesures(csv_path):
    """Convert CSV to API-format mesures."""
    rows = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            mesure = {
                "regionCode": row.get("region", ""),
                "campagneNom": row.get("campagne", ""),
                "latitude": float(row.get("latitude", 0)),
                "longitude": float(row.get("longitude", 0)),
                "timestamp": row.get("timestamp", ""),
                "typeMesure": row.get("typeMesure", "MOBILE"),
            }
            for field in ["rssi", "rsrp", "rsrq", "sinr", "debitDescendant", "debitMontant",
                         "latence", "gigue", "tauxAppelReussi", "tauxDropCall",
                         "debitDownload", "debitUpload", "ping", "dnsLookupTime",
                         "tcpConnectTime", "scoreQoE", "pageLoadTime", "videoBuffering"]:
                val = row.get(field, "")
                if val and val.strip():
                    try:
                        mesure[field] = float(val)
                    except:
                        pass
            rows.append(mesure)
    return rows

def main():
    # Parse filters
    filter_op = None
    filter_q = None
    for arg in sys.argv[1:]:
        if arg.startswith("--"):
            val = arg[2:].upper()
            if val in ["ORANGE", "MTN", "CELCOM", "INTERCEL"]:
                filter_op = val
            elif val in ["Q1", "Q2", "Q3", "Q4"]:
                filter_q = val

    print("=" * 65)
    print("  ARPT-QoS-Guinée — Import rapide des données opérateurs")
    print("=" * 65)
    print()

    total_ok = 0
    total_err = 0
    total_inserted = 0

    for op_code in OPERATORS:
        if filter_op and filter_op != op_code:
            continue
        
        op_lower = op_code.lower()
        api_key = API_KEYS[op_code]
        
        print(f"📡 {op_code}")
        
        for quarter in QUARTERS:
            if filter_q and filter_q != quarter:
                continue
            
            periode = f"2025-{quarter}"
            
            # ─── Import Mesures ───
            csv_path = f"{SCRIPT_DIR}/mesures-{op_lower}-2025-{quarter}.csv"
            try:
                mesures = csv_to_mesures(csv_path)
                
                # Batch de 500
                batch_size = 500
                for i in range(0, len(mesures), batch_size):
                    batch = mesures[i:i+batch_size]
                    result = api_post("/api/prestataires/mesures", api_key, {"mesures": batch})
                    
                    inserted = result.get("inserted", 0)
                    if inserted > 0 or "succès" in str(result.get("message", "")):
                        print(f"  ✅ Mesures {periode}: {inserted} importées")
                        total_ok += 1
                        total_inserted += inserted
                    else:
                        err = result.get("error", "") or result.get("message", "") or str(result)[:100]
                        print(f"  ❌ Mesures {periode}: {err}")
                        total_err += 1
                    
                    time.sleep(2.5)  # Rate limit: 30 req/min
            
            except FileNotFoundError:
                print(f"  ⚠️ Fichier non trouvé: {csv_path}")
            except Exception as e:
                print(f"  ❌ Erreur mesures {periode}: {e}")
                total_err += 1
            
            # ─── Import Scores ───
            scores_path = f"{SCRIPT_DIR}/scores-{op_lower}-2025-{quarter}.json"
            try:
                with open(scores_path, "r", encoding="utf-8") as f:
                    score_data = json.load(f)
                
                api_payload = {"scores": [{
                    "periode": score_data["periode"],
                    "scoreGlobal": score_data["scoreGlobal"],
                    "scoreCouverture": score_data["scoreCouverture"],
                    "scoreQoS": score_data["scoreQoS"],
                    "scoreQoE": score_data["scoreQoE"],
                    "scoreConformite": score_data["scoreConformite"],
                    "recommandation": score_data.get("recommandation", ""),
                }]}
                
                result = api_post("/api/prestataires/scores", api_key, api_payload)
                if "succès" in str(result.get("message", "")) or result.get("inserted", 0) > 0 or result.get("created", 0) > 0:
                    print(f"  ✅ Scores {periode}: importé")
                    total_ok += 1
                else:
                    err = result.get("error", "") or result.get("message", "") or str(result)[:100]
                    print(f"  ❌ Scores {periode}: {err}")
                    total_err += 1
                
                time.sleep(1)
            except FileNotFoundError:
                pass
            except Exception as e:
                print(f"  ❌ Erreur scores {periode}: {e}")
                total_err += 1
        
        print()

    print("=" * 65)
    print(f"  ✅ Succès: {total_ok}  ❌ Erreurs: {total_err}")
    print(f"  📊 Total mesures importées: {total_inserted}")
    print("=" * 65)

if __name__ == "__main__":
    main()
