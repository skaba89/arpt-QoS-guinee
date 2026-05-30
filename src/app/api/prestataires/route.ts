import { NextResponse } from "next/server";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/prestataires — List available prestataire endpoints & documentation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/prestataires/mesures",
      description: "Submit QoS measurements from an external provider",
      auth: "X-API-Key header required (format: onit-{OPERATOR_CODE}-{anystring})",
      body: {
        campagneNom: "string (optional — auto-created if missing)",
        mesures: [
          {
            regionCode: "string (e.g. CON, KIN, BOK)",
            latitude: "number",
            longitude: "number",
            timestamp: "ISO 8601 string",
            typeMesure: "MOBILE | INTERNET",
            rssi: "number? (-150 to -30)",
            rsrp: "number? (-140 to -44)",
            rsrq: "number? (-20 to -3)",
            sinr: "number? (-20 to 30)",
            latence: "number? (ms, 0-5000)",
            debitDescendant: "number? (Mbps, 0-100000)",
            debitMontant: "number? (Mbps, 0-100000)",
            gigue: "number? (ms, 0-5000)",
            tauxAppelReussi: "number? (%, 0-100)",
            tauxDropCall: "number? (%, 0-100)",
            debitDownload: "number? (Mbps, 0-100000)",
            debitUpload: "number? (Mbps, 0-100000)",
            ping: "number? (ms, 0-5000)",
            scoreQoE: "number? (0-100)",
          },
        ],
      },
      note: "The operatorCode is extracted from the API key and automatically applied to all measurements.",
    },
    {
      method: "POST",
      path: "/api/prestataires/scores",
      description: "Submit operator scores from an external provider",
      auth: "X-API-Key header required (format: onit-{OPERATOR_CODE}-{anystring})",
      body: {
        scores: [
          {
            periode: "string (e.g. 2026-Q1)",
            scoreGlobal: "number? (0-100)",
            scoreCouverture: "number? (0-100)",
            scoreQoS: "number? (0-100)",
            scoreQoE: "number? (0-100)",
            scoreConformite: "number? (0-100)",
            recommandation: "string? (max 2000 chars)",
          },
        ],
      },
      note: "The operatorCode is extracted from the API key. Scores are upserted (created or updated) per operator+period.",
    },
  ];

  const apiKeyFormat = {
    pattern: "onit-{OPERATOR_CODE}-{anystring}",
    examples: [
      "onit-ORANGE-abc123",
      "onit-MTN-prod-key",
      "onit-CELCOM-2026",
      "onit-INTERCEL-provider-01",
    ],
    operatorCodes: ["ORANGE", "MTN", "CELCOM", "INTERCEL"],
    note: "The operator code in the key must match a known operator in the system. All submitted data is scoped to that operator.",
  };

  return NextResponse.json({
    service: "ARPT-QoS-Guinée Prestataire API",
    version: "1.0",
    description:
      "External provider API for submitting QoS measurements and operator scores. Authentication is via API key (not session-based).",
    authentication: apiKeyFormat,
    endpoints,
  });
}
