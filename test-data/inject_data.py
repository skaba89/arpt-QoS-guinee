#!/usr/bin/env python3
"""
ONIT-PNG — Script d'injection des données de test
Injecte les données pour les 4 opérateurs sur 4 périodes
Utilise des petits lots avec pauses pour éviter les crashes serveur
"""
import json, urllib.request, time, sys

BASE = "http://localhost:3000/api/prestataire"
API_KEYS = {
    "ORANGE": "prest-orange-2026-ak1a2b3c4d",
    "MTN": "prest-mtn-2026-x9y8z7w6v5",
    "CELCOM": "prest-celcom-2026-p1q2r3s4t5",
    "GUINETEL": "prest-guinetel-2026-m6n7o8p9q0",
}
OP_LOWER = {"ORANGE": "orange", "MTN": "mtn", "CELCOM": "celcom", "GUINETEL": "guinetel"}
DATA_DIR = "/home/z/my-project/test-data"

def post(data, api_key):
    req = urllib.request.Request(
        BASE,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json", "X-API-Key": api_key},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {"error": f"HTTP {e.code}: {body[:200]}"}
    except Exception as e:
        return {"error": str(e)}

def health_check():
    try:
        req = urllib.request.Request("http://localhost:3000/api")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read())["stats"]
    except:
        return None

print("🚀 ONIT-PNG — Injection des données de test")
print("=" * 50)

# Verify server is up
stats = health_check()
if not stats:
    print("❌ Serveur non accessible sur http://localhost:3000")
    sys.exit(1)
print(f"✅ Serveur OK: {json.dumps(stats)}")

# ─── Phase 1: Scores ───
print("\n📊 Phase 1: Injection des scores opérateurs...")
total_scores = 0
for op_code, api_key in API_KEYS.items():
    op_l = OP_LOWER[op_code]
    try:
        with open(f"{DATA_DIR}/scores_{op_l}.json") as f:
            scores = json.load(f)
        for s in scores:
            s.pop("operateurCode", None)
            result = post(s, api_key)
            if result.get("success"):
                total_scores += 1
                print(f"  ✅ {op_code} {s['periode']}: score={s['scoreGlobal']}")
            else:
                print(f"  ❌ {op_code} {s['periode']}: {result.get('error', '?')}")
            time.sleep(0.2)
    except Exception as e:
        print(f"  ⚠️ {op_code}: {e}")
    time.sleep(0.5)

print(f"\n  Total scores injectés: {total_scores}")

# ─── Phase 2: Mesures (par petits lots de 20) ───
print("\n📡 Phase 2: Injection des mesures QoS...")
total_mesures = 0
CHUNK_SIZE = 20

for op_code, api_key in API_KEYS.items():
    op_l = OP_LOWER[op_code]
    for periode in ["2025_Q2", "2025_Q3", "2025_Q4", "2026_Q1"]:
        filepath = f"{DATA_DIR}/mesures_{op_l}_{periode}.json"
        try:
            with open(filepath) as f:
                data = json.load(f)
            all_mesures = data.get("mesures", [])
            camp_nom = data.get("campagne", {}).get("nom", f"Auto-{op_code}-{periode}")
            
            op_inserted = 0
            # Process in chunks
            for i in range(0, len(all_mesures), CHUNK_SIZE):
                chunk = all_mesures[i:i+CHUNK_SIZE]
                payload = {
                    "action": "mesures",
                    "campagneNom": camp_nom,
                    "mesures": chunk
                }
                result = post(payload, api_key)
                inserted = result.get("inserted", 0)
                op_inserted += inserted
                time.sleep(0.5)  # Pause between chunks
            
            total_mesures += op_inserted
            print(f"  ✅ {op_code} {periode}: {op_inserted} mesures")
        except Exception as e:
            print(f"  ⚠️ {op_code} {periode}: {e}")
        time.sleep(1)

print(f"\n  Total mesures injectées: {total_mesures}")

# ─── Phase 3: Alertes ───
print("\n🚨 Phase 3: Injection des alertes...")
total_alertes = 0
try:
    with open(f"{DATA_DIR}/alertes_test.json") as f:
        alertes = json.load(f)
    for a in alertes:
        op_code = a.pop("operateurCode", "ORANGE")
        api_key = API_KEYS.get(op_code, API_KEYS["ORANGE"])
        a["action"] = "alertes"
        result = post(a, api_key)
        if result.get("success"):
            total_alertes += 1
            print(f"  ✅ {op_code}: {a.get('type', '?')} - {a.get('severity', '?')}")
        else:
            print(f"  ❌ {op_code}: {result.get('error', '?')}")
        time.sleep(0.3)
except Exception as e:
    print(f"  ⚠️ Error: {e}")

print(f"\n  Total alertes injectées: {total_alertes}")

# ─── Vérification finale ───
print("\n" + "=" * 50)
print("✅ Vérification finale...")
time.sleep(2)
stats = health_check()
if stats:
    print(json.dumps(stats, indent=2))
else:
    print("⚠️ Serveur injoignable après injection")

print(f"\n📊 Résumé:")
print(f"  Scores:   {total_scores}")
print(f"  Mesures:  {total_mesures}")
print(f"  Alertes:  {total_alertes}")
print("\n🎉 Injection terminée !")
