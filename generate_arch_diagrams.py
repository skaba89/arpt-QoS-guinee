#!/usr/bin/env python3
"""Generate premium architecture diagrams for ONIT-PNG using Playwright + CSS/HTML."""

import os
from playwright.sync_api import sync_playwright

OUTPUT_DIR = "/home/z/my-project/download"
WIDTH = 2400
HEIGHT = 1600
SCALE = 2

# ─── Color palette ───
NAVY   = "#0F172A"
GOLD   = "#D4A843"
STEEL  = "#3B82F6"
SLATE  = "#64748B"
WHITE  = "#F8FAFC"
DARK2  = "#1E293B"
DARK3  = "#334155"

COMMON_STYLE = """
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #0F172A;
    color: #F8FAFC;
    width: 2400px; height: 1600px;
    overflow: hidden;
    padding: 60px;
  }
  .header { text-align:center; margin-bottom:36px; }
  .header h1 {
    font-size: 36px; font-weight: 700; color: #D4A843;
    letter-spacing: 2px; margin-bottom: 8px;
  }
  .header p { font-size: 16px; color: #64748B; letter-spacing: 1px; }
  .card {
    background: rgba(30,41,59,0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.3);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  }
  .layer-title {
    font-size: 14px; font-weight: 600; color: #D4A843;
    text-transform: uppercase; letter-spacing: 2px;
    margin-bottom: 14px; padding-bottom: 8px;
    border-bottom: 1px solid rgba(212,168,67,0.3);
  }
  .tech-badge {
    display: inline-block;
    background: rgba(59,130,246,0.15);
    border: 1px solid rgba(59,130,246,0.3);
    border-radius: 6px;
    padding: 6px 14px;
    margin: 4px;
    font-size: 13px;
    color: #93C5FD;
    white-space: nowrap;
  }
  .tech-badge.gold {
    background: rgba(212,168,67,0.15);
    border-color: rgba(212,168,67,0.3);
    color: #D4A843;
  }
  .arrow-down {
    display: flex; justify-content: center; align-items: center;
    padding: 8px 0;
  }
  .arrow-down svg { filter: drop-shadow(0 0 6px rgba(212,168,67,0.4)); }
"""


# ═══════════════════════════════════════════════════════════════════════════════
# 1. SYSTEM ARCHITECTURE OVERVIEW
# ═══════════════════════════════════════════════════════════════════════════════
HTML_SYSTEM = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
""" + COMMON_STYLE + """
  .main-grid {
    display: flex; flex-direction: column; gap: 0;
    position: relative;
    height: 1340px;
  }
  .security-wrap {
    border: 2px dashed rgba(212,168,67,0.5);
    border-radius: 16px;
    padding: 24px 28px;
    position: relative;
    height: 100%;
  }
  .security-label {
    position: absolute; top: -14px; left: 40px;
    background: #0F172A; padding: 0 16px;
    font-size: 13px; font-weight: 600; color: #D4A843;
    letter-spacing: 3px; text-transform: uppercase;
  }
  .security-badges {
    position: absolute; bottom: 12px; right: 24px;
    display: flex; gap: 10px;
  }
  .sec-badge {
    background: rgba(212,168,67,0.08);
    border: 1px solid rgba(212,168,67,0.25);
    border-radius: 20px; padding: 5px 14px;
    font-size: 11px; color: #D4A843; letter-spacing: 1px;
  }
  .layer {
    display: flex; align-items: center; gap: 20px;
    margin-bottom: 0;
  }
  .layer-label {
    width: 160px; flex-shrink: 0;
    text-align: right; padding-right: 16px;
  }
  .layer-label span {
    font-size: 13px; font-weight: 600; color: #D4A843;
    letter-spacing: 2px; text-transform: uppercase;
    writing-mode: vertical-lr;
    transform: rotate(180deg);
    display: inline-block;
  }
  .layer-content {
    flex: 1; display: flex; gap: 14px; flex-wrap: wrap;
  }
  .layer-card {
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.25);
    border-radius: 10px;
    padding: 18px 20px;
    flex: 1; min-width: 160px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
  }
  .layer-card .card-title {
    font-size: 13px; font-weight: 600; color: #D4A843;
    margin-bottom: 10px; letter-spacing: 1px;
  }
  .layer-card .card-techs {
    display: flex; flex-wrap: wrap; gap: 4px;
  }
  .flow-arrow {
    display: flex; justify-content: center; padding: 6px 0 6px 180px;
  }
  .flow-arrow svg { filter: drop-shadow(0 0 4px rgba(212,168,67,0.5)); }
</style></head><body>
  <div class="header">
    <h1>ARCHITECTURE SYSTÈME — ONIT-PNG</h1>
    <p>Observatoire National Intelligent des Télécommunications et de la Performance Numérique de la Guinée</p>
  </div>
  <div class="main-grid">
    <div class="security-wrap">
      <div class="security-label">🔒 Couche Sécurité Transversale</div>
      <div class="security-badges">
        <span class="sec-badge">RBAC</span>
        <span class="sec-badge">Chiffrement AES-256</span>
        <span class="sec-badge">Audit Logs</span>
        <span class="sec-badge">OAuth 2.0 / JWT</span>
        <span class="sec-badge">WAF</span>
        <span class="sec-badge">TLS 1.3</span>
      </div>

      <!-- Layer 5: Presentation -->
      <div class="layer">
        <div class="layer-label"><span>Présentation</span></div>
        <div class="layer-content">
          <div class="layer-card">
            <div class="card-title">🖥️ Interface Web</div>
            <div class="card-techs">
              <span class="tech-badge">Next.js 14</span>
              <span class="tech-badge">React 18</span>
              <span class="tech-badge">TypeScript</span>
              <span class="tech-badge">Tailwind CSS</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">📊 Tableaux de Bord</div>
            <div class="card-techs">
              <span class="tech-badge">Apache Superset</span>
              <span class="tech-badge">Grafana</span>
              <span class="tech-badge">D3.js</span>
              <span class="tech-badge">Plotly</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">🌐 Portail Public</div>
            <div class="card-techs">
              <span class="tech-badge">Cartes Interactives</span>
              <span class="tech-badge">Rapports Publics</span>
              <span class="tech-badge">API Ouverte</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flow-arrow">
        <svg width="40" height="28"><polygon points="20,0 40,14 20,28" fill="#D4A843" opacity="0.7"/><rect x="16" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/></svg>
      </div>

      <!-- Layer 4: Intelligence -->
      <div class="layer">
        <div class="layer-label"><span>Intelligence IA</span></div>
        <div class="layer-content">
          <div class="layer-card">
            <div class="card-title">🧠 Scoring Opérateurs</div>
            <div class="card-techs">
              <span class="tech-badge">Scikit-learn</span>
              <span class="tech-badge">MLflow</span>
              <span class="tech-badge gold">Indicateurs KPI</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">📈 Prédiction Couverture</div>
            <div class="card-techs">
              <span class="tech-badge">XGBoost</span>
              <span class="tech-badge">TensorFlow</span>
              <span class="tech-badge gold">Modèles Spatiaux</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">⚠️ Détection Anomalies</div>
            <div class="card-techs">
              <span class="tech-badge">Isolation Forest</span>
              <span class="tech-badge">Auto-Encoder</span>
              <span class="tech-badge gold">Alertes Temps Réel</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">💡 Recommandations</div>
            <div class="card-techs">
              <span class="tech-badge">NLP</span>
              <span class="tech-badge">Collaborative Filter</span>
              <span class="tech-badge gold">Rapports Auto</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flow-arrow">
        <svg width="40" height="28"><polygon points="20,0 40,14 20,28" fill="#D4A843" opacity="0.7"/><rect x="16" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/></svg>
      </div>

      <!-- Layer 3: Services -->
      <div class="layer">
        <div class="layer-label"><span>Services API</span></div>
        <div class="layer-content">
          <div class="layer-card">
            <div class="card-title">⚡ API REST</div>
            <div class="card-techs">
              <span class="tech-badge">FastAPI</span>
              <span class="tech-badge">Pydantic</span>
              <span class="tech-badge">OpenAPI 3.0</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">🔗 API GraphQL</div>
            <div class="card-techs">
              <span class="tech-badge">Ariadne</span>
              <span class="tech-badge">Strawberry</span>
              <span class="tech-badge">Subscriptions</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">🔄 Orchestration</div>
            <div class="card-techs">
              <span class="tech-badge">Celery</span>
              <span class="tech-badge">Redis</span>
              <span class="tech-badge">WebSockets</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flow-arrow">
        <svg width="40" height="28"><polygon points="20,0 40,14 20,28" fill="#D4A843" opacity="0.7"/><rect x="16" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/></svg>
      </div>

      <!-- Layer 2: Data Platform -->
      <div class="layer">
        <div class="layer-label"><span>Données</span></div>
        <div class="layer-content">
          <div class="layer-card">
            <div class="card-title">🗄️ Stockage</div>
            <div class="card-techs">
              <span class="tech-badge">PostgreSQL 16</span>
              <span class="tech-badge">PostGIS</span>
              <span class="tech-badge">MinIO (S3)</span>
              <span class="tech-badge">Redis Cache</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title"> streamed Streaming</div>
            <div class="card-techs">
              <span class="tech-badge">Apache Kafka</span>
              <span class="tech-badge">Schema Registry</span>
              <span class="tech-badge">Connect</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">⚙️ ETL / Pipeline</div>
            <div class="card-techs">
              <span class="tech-badge">Apache Airflow</span>
              <span class="tech-badge">dbt</span>
              <span class="tech-badge">Spark</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flow-arrow">
        <svg width="40" height="28"><polygon points="20,0 40,14 20,28" fill="#D4A843" opacity="0.7"/><rect x="16" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/></svg>
      </div>

      <!-- Layer 1: Infrastructure -->
      <div class="layer">
        <div class="layer-label"><span>Infrastructure</span></div>
        <div class="layer-content">
          <div class="layer-card">
            <div class="card-title">🐳 Conteneurisation</div>
            <div class="card-techs">
              <span class="tech-badge">Docker</span>
              <span class="tech-badge">Kubernetes</span>
              <span class="tech-badge">Helm Charts</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">☁️ Cloud Hybride</div>
            <div class="card-techs">
              <span class="tech-badge">AWS</span>
              <span class="tech-badge">Azure</span>
              <span class="tech-badge">On-Premise</span>
            </div>
          </div>
          <div class="layer-card">
            <div class="card-title">📡 CI/CD & IaC</div>
            <div class="card-techs">
              <span class="tech-badge">Terraform</span>
              <span class="tech-badge">GitLab CI</span>
              <span class="tech-badge">Ansible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body></html>"""


# ═══════════════════════════════════════════════════════════════════════════════
# 2. SIG/GIS ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════════════
HTML_SIG = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
""" + COMMON_STYLE + """
  .pipeline {
    display: flex; flex-direction: column; gap: 0;
    position: relative;
  }
  .stage {
    display: flex; align-items: stretch; gap: 0;
    position: relative;
  }
  .stage-label {
    width: 200px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    writing-mode: vertical-lr; transform: rotate(180deg);
    font-size: 14px; font-weight: 600; color: #D4A843;
    letter-spacing: 3px; text-transform: uppercase;
  }
  .stage-content {
    flex: 1; display: flex; gap: 16px; padding: 8px 0;
  }
  .source-card {
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.25);
    border-radius: 10px;
    padding: 16px 20px;
    flex: 1;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
    text-align: center;
  }
  .source-card .icon { font-size: 28px; margin-bottom: 8px; }
  .source-card .name { font-size: 14px; font-weight: 600; color: #D4A843; margin-bottom: 6px; }
  .source-card .desc { font-size: 11px; color: #94A3B8; }
  .connector-row {
    display: flex; justify-content: center; padding: 6px 0 6px 200px;
  }
  .connector-row svg { filter: drop-shadow(0 0 4px rgba(212,168,67,0.5)); }
  .guinea-watermark {
    position: absolute; bottom: 40px; right: 60px;
    opacity: 0.04; font-size: 700px; color: #D4A843;
    font-weight: 900; line-height: 1;
    pointer-events: none;
  }
  .etl-box {
    background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05));
    border: 1px solid rgba(59,130,246,0.3);
    border-radius: 10px; padding: 16px 24px;
    flex: 1; text-align: center;
  }
  .etl-box .name { font-size: 14px; font-weight: 600; color: #93C5FD; margin-bottom: 4px; }
  .etl-box .desc { font-size: 11px; color: #64748B; }
  .postgis-box {
    background: linear-gradient(135deg, rgba(212,168,67,0.15), rgba(212,168,67,0.05));
    border: 2px solid rgba(212,168,67,0.4);
    border-radius: 12px; padding: 20px 32px;
    text-align: center;
  }
  .postgis-box .name { font-size: 16px; font-weight: 700; color: #D4A843; margin-bottom: 6px; }
  .postgis-box .desc { font-size: 12px; color: #94A3B8; }
  .viz-card {
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.25);
    border-radius: 10px;
    padding: 16px 20px;
    flex: 1;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
    text-align: center;
  }
  .viz-card .icon { font-size: 28px; margin-bottom: 8px; }
  .viz-card .name { font-size: 14px; font-weight: 600; color: #3B82F6; margin-bottom: 6px; }
  .viz-card .desc { font-size: 11px; color: #94A3B8; }
</style></head><body>
  <div class="guinea-watermark">GN</div>
  <div class="header">
    <h1>ARCHITECTURE SIG — ONIT-PNG</h1>
    <p>Système d'Information Géographique pour la Supervision Territoriale</p>
  </div>
  <div class="pipeline">
    <!-- Data Sources -->
    <div class="stage">
      <div class="stage-label">Sources</div>
      <div class="stage-content">
        <div class="source-card">
          <div class="icon">📡</div>
          <div class="name">Drive Tests</div>
          <div class="desc">Mesures terrain couverture mobile / signal</div>
        </div>
        <div class="source-card">
          <div class="icon">🛰️</div>
          <div class="name">Imagerie Satellite</div>
          <div class="desc">Sentinel-2, Landsat — Analyse occupation sol</div>
        </div>
        <div class="source-card">
          <div class="icon">🗺️</div>
          <div class="name">OpenStreetMap</div>
          <div class="desc">Données géographiques ouvertes — Réseau routier</div>
        </div>
        <div class="source-card">
          <div class="icon">📱</div>
          <div class="name">Données Opérateurs</div>
          <div class="desc">KPI réseau, trafic, incidents — Orange, MTN, Celcom</div>
        </div>
        <div class="source-card">
          <div class="icon">📊</div>
          <div class="name">Recensements</div>
          <div class="desc">Données démographiques INS — Densité population</div>
        </div>
      </div>
    </div>

    <!-- Connector -->
    <div class="connector-row">
      <svg width="50" height="32"><rect x="21" y="0" width="8" height="16" fill="#D4A843" opacity="0.7"/><polygon points="25,32 10,16 40,16" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- ETL Layer -->
    <div class="stage">
      <div class="stage-label">ETL</div>
      <div class="stage-content">
        <div class="etl-box">
          <div class="name">GDAL / OGR</div>
          <div class="desc">Transformation formats géospatiaux</div>
        </div>
        <div class="etl-box">
          <div class="name">GeoSpark</div>
          <div class="desc">Traitement spatial distribué</div>
        </div>
        <div class="etl-box">
          <div class="name">Airflow ETL</div>
          <div class="desc">Orchestration pipelines géographiques</div>
        </div>
        <div class="etl-box">
          <div class="name">FME Server</div>
          <div class="desc">Intégration données hétérogènes</div>
        </div>
      </div>
    </div>

    <!-- Connector -->
    <div class="connector-row">
      <svg width="50" height="32"><rect x="21" y="0" width="8" height="16" fill="#D4A843" opacity="0.7"/><polygon points="25,32 10,16 40,16" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- PostGIS Core -->
    <div class="stage">
      <div class="stage-label">Stockage</div>
      <div class="stage-content">
        <div class="postgis-box" style="flex:1; display:flex; gap:20px; align-items:center; justify-content:center;">
          <div>
            <div class="name">🗄️ PostGIS — Base Géographique Centrale</div>
            <div class="desc">PostgreSQL 16 + PostGIS 3.4 | Index spatiaux GIST | Types géométriques | 3855 préfectures & communes</div>
          </div>
          <div style="display:flex; gap:8px;">
            <span class="tech-badge gold">Geobuf</span>
            <span class="tech-badge gold">MVT</span>
            <span class="tech-badge gold">GeoJSON</span>
            <span class="tech-badge gold">WMS/WFS</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Connector -->
    <div class="connector-row">
      <svg width="50" height="32"><rect x="21" y="0" width="8" height="16" fill="#D4A843" opacity="0.7"/><polygon points="25,32 10,16 40,16" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- Visualization Services -->
    <div class="stage">
      <div class="stage-label">Services</div>
      <div class="stage-content">
        <div class="viz-card">
          <div class="icon">🌐</div>
          <div class="name">QGIS Server</div>
          <div class="desc">WMS / WFS / WMTS — Rendu serveur cartographique</div>
        </div>
        <div class="viz-card">
          <div class="icon">🗺️</div>
          <div class="name">Mapbox GL</div>
          <div class="desc">Cartes vectorielles interactives — Style personnalisé</div>
        </div>
        <div class="viz-card">
          <div class="icon">📍</div>
          <div class="name">Leaflet.js</div>
          <div class="desc">Cartes légères — Intégration portail public</div>
        </div>
        <div class="viz-card">
          <div class="icon">📐</div>
          <div class="name">Deck.gl</div>
          <div class="desc">Visualisation 3D — Couches massives</div>
        </div>
      </div>
    </div>

    <!-- Connector -->
    <div class="connector-row">
      <svg width="50" height="32"><rect x="21" y="0" width="8" height="16" fill="#D4A843" opacity="0.7"/><polygon points="25,32 10,16 40,16" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- Outputs -->
    <div class="stage">
      <div class="stage-label">Sorties</div>
      <div class="stage-content">
        <div class="source-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">🗺️</div>
          <div class="name">Cartes Interactives</div>
          <div class="desc">Navigation couverture nationale — Zoom par préfecture</div>
        </div>
        <div class="source-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">🔥</div>
          <div class="name">Cartes de Chaleur</div>
          <div class="desc">Densité réseau, qualité signal, zones blanches</div>
        </div>
        <div class="source-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">📶</div>
          <div class="name">Cartes Couverture</div>
          <div class="desc">2G / 3G / 4G / 5G par opérateur et région</div>
        </div>
        <div class="source-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">📊</div>
          <div class="name">Rapports Spatiaux</div>
          <div class="desc">Analyses géostatistiques — PDF auto-générés</div>
        </div>
      </div>
    </div>
  </div>
</body></html>"""


# ═══════════════════════════════════════════════════════════════════════════════
# 3. BIG DATA ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════════════
HTML_BIGDATA = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
""" + COMMON_STYLE + """
  .pipeline-flow {
    display: flex; flex-direction: column; gap: 0;
  }
  .pipe-stage {
    display: flex; align-items: center; gap: 0;
  }
  .pipe-label {
    width: 180px; flex-shrink: 0; text-align: right;
    padding-right: 20px;
  }
  .pipe-label span {
    font-size: 12px; font-weight: 600; color: #D4A843;
    letter-spacing: 2px; text-transform: uppercase;
  }
  .pipe-content {
    flex: 1; display: flex; gap: 14px; padding: 6px 0;
  }
  .data-node {
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.25);
    border-radius: 10px;
    padding: 16px 20px;
    flex: 1;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
    text-align: center;
  }
  .data-node .icon { font-size: 24px; margin-bottom: 6px; }
  .data-node .name { font-size: 13px; font-weight: 600; color: #D4A843; margin-bottom: 4px; }
  .data-node .tech { font-size: 11px; color: #94A3B8; }
  .data-node.kafka {
    background: linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04));
    border-color: rgba(212,168,67,0.35);
  }
  .data-node.lake {
    background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04));
    border-color: rgba(59,130,246,0.3);
  }
  .data-node.warehouse {
    background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04));
    border-color: rgba(16,185,129,0.3);
  }
  .data-node.warehouse .name { color: #34D399; }
  .data-node.lake .name { color: #60A5FA; }
  .pipe-connector {
    display: flex; justify-content: center; padding: 4px 0 4px 180px;
  }
  .pipe-connector svg { filter: drop-shadow(0 0 4px rgba(212,168,67,0.5)); }
  .dual-output {
    display: flex; gap: 20px; flex: 1;
  }
  .output-col {
    flex: 1; display: flex; flex-direction: column; gap: 12px;
  }
  .output-card {
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.25);
    border-radius: 10px;
    padding: 14px 18px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
    display: flex; gap: 12px; align-items: center;
  }
  .output-card .oc-icon { font-size: 22px; }
  .output-card .oc-text .name { font-size: 13px; font-weight: 600; color: #D4A843; }
  .output-card .oc-text .desc { font-size: 11px; color: #94A3B8; }
  .split-connector {
    display: flex; justify-content: center; padding: 4px 0 4px 180px;
  }
</style></head><body>
  <div class="header">
    <h1>ARCHITECTURE BIG DATA — ONIT-PNG</h1>
    <p>Pipeline de Données Massives pour l'Observatoire National</p>
  </div>
  <div class="pipeline-flow">
    <!-- Sources -->
    <div class="pipe-stage">
      <div class="pipe-label"><span>Sources</span></div>
      <div class="pipe-content">
        <div class="data-node">
          <div class="icon">📡</div>
          <div class="name">Drive Tests</div>
          <div class="tech">CSV / Parquet — 10M+ mesures/mois</div>
        </div>
        <div class="data-node">
          <div class="icon">📱</div>
          <div class="name">KPI Opérateurs</div>
          <div class="tech">API REST — Temps réel</div>
        </div>
        <div class="data-node">
          <div class="icon">🛰️</div>
          <div class="name">Satellite</div>
          <div class="tech">GeoTIFF — Multi-résolution</div>
        </div>
        <div class="data-node">
          <div class="icon">📋</div>
          <div class="name">Réglementaire</div>
          <div class="tech">PDF / XML — Licences ARPT</div>
        </div>
        <div class="data-node">
          <div class="icon">👥</div>
          <div class="name">Réclamations</div>
          <div class="tech">Web / SMS / USSD</div>
        </div>
      </div>
    </div>

    <div class="pipe-connector">
      <svg width="50" height="30"><rect x="21" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/><polygon points="25,30 10,14 40,14" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- Kafka -->
    <div class="pipe-stage">
      <div class="pipe-label"><span>Ingestion</span></div>
      <div class="pipe-content">
        <div class="data-node kafka" style="flex:1;">
          <div class="icon">⚡</div>
          <div class="name">Apache Kafka — Bus de Données</div>
          <div class="tech">Topics: drive-tests | kpi-operateurs | alertes | reclamations | satellite-raw</div>
          <div style="margin-top:8px; display:flex; gap:6px; justify-content:center;">
            <span class="tech-badge gold">Schema Registry</span>
            <span class="tech-badge gold">Kafka Connect</span>
            <span class="tech-badge gold">ksqlDB</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pipe-connector">
      <svg width="50" height="30"><rect x="21" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/><polygon points="25,30 10,14 40,14" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- Data Lake -->
    <div class="pipe-stage">
      <div class="pipe-label"><span>Data Lake</span></div>
      <div class="pipe-content">
        <div class="data-node lake" style="flex:1;">
          <div class="icon">🗄️</div>
          <div class="name">MinIO — Stockage Objet (S3-Compatible)</div>
          <div class="tech">Bronze: Données brutes | Silver: Nettoyées | Gold: Agrégées</div>
          <div style="margin-top:8px; display:flex; gap:6px; justify-content:center;">
            <span class="tech-badge">Parquet</span>
            <span class="tech-badge">Delta Lake</span>
            <span class="tech-badge">GeoTIFF</span>
            <span class="tech-badge">JSON</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pipe-connector">
      <svg width="50" height="30"><rect x="21" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/><polygon points="25,30 10,14 40,14" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- ETL + Warehouse -->
    <div class="pipe-stage">
      <div class="pipe-label"><span>Transformation</span></div>
      <div class="pipe-content">
        <div class="data-node" style="flex:1;">
          <div class="icon">⚙️</div>
          <div class="name">Airflow + dbt — Pipeline ETL</div>
          <div class="tech">DAGs orchestrés | Tests qualité | Documentation auto | Lineage</div>
          <div style="margin-top:8px; display:flex; gap:6px; justify-content:center;">
            <span class="tech-badge">Airflow DAGs</span>
            <span class="tech-badge">dbt Models</span>
            <span class="tech-badge">Spark Jobs</span>
            <span class="tech-badge">Great Expectations</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; padding:0 8px;">
          <svg width="40" height="28"><polygon points="20,0 40,14 20,28" fill="#D4A843" opacity="0.7"/><rect x="16" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/></svg>
        </div>
        <div class="data-node warehouse" style="flex:1;">
          <div class="icon">🏗️</div>
          <div class="name">PostgreSQL — Data Warehouse</div>
          <div class="tech">Star Schema | Fait: mesures, KPI | Dimension: temps, géo, opérateur</div>
          <div style="margin-top:8px; display:flex; gap:6px; justify-content:center;">
            <span class="tech-badge">PostGIS</span>
            <span class="tech-badge">TimescaleDB</span>
            <span class="tech-badge">Citus</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pipe-connector">
      <svg width="50" height="30"><rect x="21" y="0" width="8" height="14" fill="#D4A843" opacity="0.7"/><polygon points="25,30 10,14 40,14" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- Analytics + IA -->
    <div class="pipe-stage">
      <div class="pipe-label"><span>Exploitation</span></div>
      <div class="pipe-content" style="flex-direction:column; gap:12px;">
        <div style="display:flex; gap:14px;">
          <div class="data-node" style="flex:1; border-color:rgba(59,130,246,0.3);">
            <div class="icon">📊</div>
            <div class="name" style="color:#60A5FA;">Apache Superset — Analytics</div>
            <div class="tech">Dashboards interactifs | Requêtes SQL | Alertes | Rapports</div>
          </div>
          <div class="data-node" style="flex:1; border-color:rgba(168,85,247,0.3);">
            <div class="icon">🧠</div>
            <div class="name" style="color:#C084FC;">Modèles IA / ML</div>
            <div class="tech">Scoring | Prédiction | Anomalies | Recommandations</div>
          </div>
          <div class="data-node" style="flex:1; border-color:rgba(16,185,129,0.3);">
            <div class="icon">📱</div>
            <div class="name" style="color:#34D399;">API & Portail</div>
            <div class="tech">FastAPI | GraphQL | Next.js | Cartes</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body></html>"""


# ═══════════════════════════════════════════════════════════════════════════════
# 4. IA/ML ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════════════
HTML_IA = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
""" + COMMON_STYLE + """
  .ml-pipeline {
    display: flex; flex-direction: column; gap: 0;
  }
  .ml-stage {
    display: flex; align-items: stretch; gap: 0;
  }
  .ml-label {
    width: 180px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    writing-mode: vertical-lr; transform: rotate(180deg);
    font-size: 13px; font-weight: 600; color: #D4A843;
    letter-spacing: 2px; text-transform: uppercase;
  }
  .ml-content {
    flex: 1; display: flex; gap: 14px; padding: 6px 0;
  }
  .ml-card {
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.25);
    border-radius: 10px;
    padding: 16px 18px;
    flex: 1;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
    text-align: center;
  }
  .ml-card .icon { font-size: 24px; margin-bottom: 6px; }
  .ml-card .name { font-size: 13px; font-weight: 600; color: #D4A843; margin-bottom: 4px; }
  .ml-card .tech { font-size: 11px; color: #94A3B8; margin-bottom: 6px; }
  .ml-card .badges { display:flex; gap:4px; justify-content:center; flex-wrap:wrap; }
  .ml-card.model-card {
    border-color: rgba(168,85,247,0.3);
    background: linear-gradient(135deg, rgba(168,85,247,0.08), rgba(30,41,59,0.6));
  }
  .ml-card.model-card .name { color: #C084FC; }
  .ml-connector {
    display: flex; justify-content: center; padding: 4px 0 4px 180px;
  }
  .ml-connector svg { filter: drop-shadow(0 0 4px rgba(212,168,67,0.5)); }
  .feedback-loop {
    position: absolute;
    right: 40px; top: 260px; bottom: 480px;
    width: 50px;
    border: 2px dashed rgba(168,85,247,0.5);
    border-left: none;
    border-radius: 0 20px 20px 0;
    display: flex; align-items: center; justify-content: center;
  }
  .feedback-loop span {
    writing-mode: vertical-lr;
    font-size: 11px; color: #C084FC;
    letter-spacing: 2px; font-weight: 600;
  }
  .mlflow-box {
    background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04));
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 10px;
    padding: 14px 20px;
    text-align: center;
  }
  .mlflow-box .name { font-size: 13px; font-weight: 600; color: #34D399; margin-bottom: 4px; }
  .mlflow-box .tech { font-size: 11px; color: #64748B; }
</style></head><body>
  <div class="header">
    <h1>ARCHITECTURE IA / ML — ONIT-PNG</h1>
    <p>Plateforme d'Intelligence Artificielle et Machine Learning</p>
  </div>
  <div class="ml-pipeline" style="position:relative;">
    <!-- Data Input -->
    <div class="ml-stage">
      <div class="ml-label">Données Entrée</div>
      <div class="ml-content">
        <div class="ml-card">
          <div class="icon">📊</div>
          <div class="name">Données Structurelles</div>
          <div class="tech">KPI, métriques, indicateurs</div>
          <div class="badges">
            <span class="tech-badge">PostgreSQL</span>
            <span class="tech-badge">Parquet</span>
          </div>
        </div>
        <div class="ml-card">
          <div class="icon">📍</div>
          <div class="name">Données Spatiales</div>
          <div class="tech">Couverture, géolocalisation, frontières</div>
          <div class="badges">
            <span class="tech-badge">PostGIS</span>
            <span class="tech-badge">GeoJSON</span>
          </div>
        </div>
        <div class="ml-card">
          <div class="icon">⏱️</div>
          <div class="name">Séries Temporelles</div>
          <div class="tech">Trafic, performance, tendances</div>
          <div class="badges">
            <span class="tech-badge">TimescaleDB</span>
            <span class="tech-badge">Kafka</span>
          </div>
        </div>
        <div class="ml-card">
          <div class="icon">📝</div>
          <div class="name">Données Textuelles</div>
          <div class="tech">Réclamations, rapports, réglementation</div>
          <div class="badges">
            <span class="tech-badge">NLP</span>
            <span class="tech-badge">BERT</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ml-connector">
      <svg width="50" height="28"><rect x="21" y="0" width="8" height="12" fill="#D4A843" opacity="0.7"/><polygon points="25,28 10,12 40,12" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- Feature Engineering -->
    <div class="ml-stage">
      <div class="ml-label">Feature Engineering</div>
      <div class="ml-content">
        <div class="ml-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">🔧</div>
          <div class="name">Extraction Features</div>
          <div class="tech">Transformation, normalisation, encodage</div>
          <div class="badges">
            <span class="tech-badge">Pandas</span>
            <span class="tech-badge">NumPy</span>
            <span class="tech-badge">Featuretools</span>
          </div>
        </div>
        <div class="ml-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">📐</div>
          <div class="name">Features Spatiales</div>
          <div class="tech">Buffer zones, densité, distance, clustering</div>
          <div class="badges">
            <span class="tech-badge">GeoPandas</span>
            <span class="tech-badge">Shapely</span>
          </div>
        </div>
        <div class="ml-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">📈</div>
          <div class="name">Features Temporelles</div>
          <div class="tech">Lags, rolling stats, saisonnalité</div>
          <div class="badges">
            <span class="tech-badge">tsfresh</span>
            <span class="tech-badge">statsmodels</span>
          </div>
        </div>
        <div class="ml-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">🏷️</div>
          <div class="name">Feature Store</div>
          <div class="tech">Catalogue centralisé, versioning</div>
          <div class="badges">
            <span class="tech-badge">Feast</span>
            <span class="tech-badge">MLflow</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ml-connector">
      <svg width="50" height="28"><rect x="21" y="0" width="8" height="12" fill="#D4A843" opacity="0.7"/><polygon points="25,28 10,12 40,12" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- Model Training -->
    <div class="ml-stage">
      <div class="ml-label">Entraînement</div>
      <div class="ml-content">
        <div class="ml-card" style="flex:2; border-color:rgba(16,185,129,0.3);">
          <div class="icon">🧪</div>
          <div class="name" style="color:#34D399;">Pipeline d'Entraînement</div>
          <div class="tech">Train / Validation / Test — Cross-validation — Hyperparameter Tuning</div>
          <div class="badges">
            <span class="tech-badge">Scikit-learn</span>
            <span class="tech-badge">XGBoost</span>
            <span class="tech-badge">TensorFlow</span>
            <span class="tech-badge">Optuna</span>
          </div>
        </div>
        <div class="mlflow-box" style="flex:1; display:flex; flex-direction:column; justify-content:center;">
          <div class="name">📦 MLflow</div>
          <div class="tech">Tracking | Registry | Serving | Experiments</div>
        </div>
      </div>
    </div>

    <div class="ml-connector">
      <svg width="50" height="28"><rect x="21" y="0" width="8" height="12" fill="#D4A843" opacity="0.7"/><polygon points="25,28 10,12 40,12" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- Models -->
    <div class="ml-stage">
      <div class="ml-label">Modèles</div>
      <div class="ml-content">
        <div class="ml-card model-card">
          <div class="icon">🏆</div>
          <div class="name">Scoring Opérateurs</div>
          <div class="tech">Évaluation performance multi-critères</div>
          <div class="badges">
            <span class="tech-badge">Random Forest</span>
            <span class="tech-badge">Gradient Boost</span>
          </div>
        </div>
        <div class="ml-card model-card">
          <div class="icon">🔮</div>
          <div class="name">Prédiction Couverture</div>
          <div class="tech">Projection évolution réseau 2G→5G</div>
          <div class="badges">
            <span class="tech-badge">LSTM</span>
            <span class="tech-badge">Prophet</span>
          </div>
        </div>
        <div class="ml-card model-card">
          <div class="icon">🚨</div>
          <div class="name">Détection Anomalies</div>
          <div class="tech">Identification pannes, fraude, pics</div>
          <div class="badges">
            <span class="tech-badge">Isolation Forest</span>
            <span class="tech-badge">AutoEncoder</span>
          </div>
        </div>
        <div class="ml-card model-card">
          <div class="icon">💡</div>
          <div class="name">Recommandations</div>
          <div class="tech">Actions correctives, investissements</div>
          <div class="badges">
            <span class="tech-badge">NLP</span>
            <span class="tech-badge">Collab. Filter</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ml-connector">
      <svg width="50" height="28"><rect x="21" y="0" width="8" height="12" fill="#D4A843" opacity="0.7"/><polygon points="25,28 10,12 40,12" fill="#D4A843" opacity="0.7"/></svg>
    </div>

    <!-- API & Dashboards -->
    <div class="ml-stage">
      <div class="ml-label">Exploitation</div>
      <div class="ml-content">
        <div class="ml-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">⚡</div>
          <div class="name">API Scoring</div>
          <div class="tech">FastAPI — Temps réel & Batch</div>
          <div class="badges">
            <span class="tech-badge">REST</span>
            <span class="tech-badge">GraphQL</span>
          </div>
        </div>
        <div class="ml-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">📊</div>
          <div class="name">Dashboards ML</div>
          <div class="tech">Suivi modèles, drift, performance</div>
          <div class="badges">
            <span class="tech-badge">Grafana</span>
            <span class="tech-badge">Superset</span>
          </div>
        </div>
        <div class="ml-card" style="border-color:rgba(59,130,246,0.3);">
          <div class="icon">🔔</div>
          <div class="name">Alertes Intelligentes</div>
          <div class="tech">Notifications, escalades, rapports auto</div>
          <div class="badges">
            <span class="tech-badge">Email</span>
            <span class="tech-badge">SMS</span>
            <span class="tech-badge">Webhook</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Loop -->
    <div class="feedback-loop">
      <span>🔄 BOUCLE RÉTROACTION</span>
    </div>
  </div>
</body></html>"""


# ═══════════════════════════════════════════════════════════════════════════════
# 5. CYBERSECURITY ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════════════
HTML_CYBER = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
""" + COMMON_STYLE + """
  .defense-layers {
    display: flex; flex-direction: column; gap: 0;
    position: relative;
  }
  .shield-watermark {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 500px; color: rgba(212,168,67,0.03);
    pointer-events: none;
  }
  .d-layer {
    display: flex; align-items: center; gap: 0;
    position: relative;
  }
  .d-icon {
    width: 80px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
  }
  .d-label {
    width: 180px; flex-shrink: 0;
    font-size: 13px; font-weight: 600; color: #D4A843;
    letter-spacing: 2px; text-transform: uppercase;
    text-align: right; padding-right: 20px;
  }
  .d-content {
    flex: 1; display: flex; gap: 14px; padding: 8px 0;
  }
  .d-card {
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.25);
    border-radius: 10px;
    padding: 16px 18px;
    flex: 1;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
  }
  .d-card .name { font-size: 13px; font-weight: 600; color: #D4A843; margin-bottom: 6px; }
  .d-card .desc { font-size: 11px; color: #94A3B8; margin-bottom: 6px; }
  .d-card .badges { display:flex; gap:4px; flex-wrap:wrap; }
  .d-card.outer { border-color: rgba(239,68,68,0.3); }
  .d-card.outer .name { color: #F87171; }
  .d-card.mid { border-color: rgba(245,158,11,0.3); }
  .d-card.mid .name { color: #FBBF24; }
  .d-card.inner { border-color: rgba(16,185,129,0.3); }
  .d-card.inner .name { color: #34D399; }
  .d-card.core { border-color: rgba(59,130,246,0.3); }
  .d-card.core .name { color: #60A5FA; }
  .zone-indicator {
    position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    border-radius: 4px;
  }
  .zone-outer { background: #EF4444; }
  .zone-mid { background: #F59E0B; }
  .zone-inner { background: #10B981; }
  .zone-core { background: #3B82F6; }
  .d-connector {
    display: flex; justify-content: center; padding: 2px 0 2px 260px;
  }
  .d-connector svg { filter: drop-shadow(0 0 4px rgba(212,168,67,0.3)); }
  .compliance-bar {
    margin-top: 10px;
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100,116,139,0.25);
    border-radius: 10px;
    padding: 14px 24px;
    display: flex; gap: 20px; align-items: center; justify-content: center;
  }
  .compliance-bar .cb-title {
    font-size: 12px; font-weight: 600; color: #D4A843;
    letter-spacing: 2px; text-transform: uppercase;
  }
  .compliance-bar .cb-item {
    font-size: 12px; color: #94A3B8;
    padding: 4px 12px;
    border: 1px solid rgba(100,116,139,0.2);
    border-radius: 6px;
  }
</style></head><body>
  <div class="shield-watermark">🛡️</div>
  <div class="header">
    <h1>ARCHITECTURE CYBERSÉCURITÉ — ONIT-PNG</h1>
    <p>Défense en Profondeur — Sécurité de l'Observatoire National</p>
  </div>
  <div class="defense-layers">
    <!-- Perimeter: Firewall/WAF -->
    <div class="d-layer">
      <div class="d-icon">🛡️</div>
      <div class="d-label">Périmètre</div>
      <div class="d-content">
        <div class="d-card outer" style="position:relative;">
          <div class="zone-indicator zone-outer"></div>
          <div class="name">🔥 Firewall / WAF</div>
          <div class="desc">Filtrage trafic entrant/sortant — Protection attaques web</div>
          <div class="badges">
            <span class="tech-badge">pfSense</span>
            <span class="tech-badge">ModSecurity</span>
            <span class="tech-badge">OWASP CRS</span>
            <span class="tech-badge">DDoS Protection</span>
          </div>
        </div>
        <div class="d-card outer" style="position:relative;">
          <div class="zone-indicator zone-outer"></div>
          <div class="name">🌐 CDN / Edge</div>
          <div class="desc">Mise en cache, rate limiting, géo-bloquage</div>
          <div class="badges">
            <span class="tech-badge">CloudFlare</span>
            <span class="tech-badge">Rate Limiting</span>
            <span class="tech-badge">Geo-Block</span>
          </div>
        </div>
      </div>
    </div>

    <div class="d-connector">
      <svg width="40" height="22"><rect x="17" y="0" width="6" height="10" fill="#D4A843" opacity="0.5"/><polygon points="20,22 8,10 32,10" fill="#D4A843" opacity="0.5"/></svg>
    </div>

    <!-- DMZ -->
    <div class="d-layer">
      <div class="d-icon">🏗️</div>
      <div class="d-label">DMZ</div>
      <div class="d-content">
        <div class="d-card mid" style="position:relative;">
          <div class="zone-indicator zone-mid"></div>
          <div class="name">🔄 Reverse Proxy</div>
          <div class="desc">Terminaison TLS, routage, load balancing</div>
          <div class="badges">
            <span class="tech-badge">Nginx</span>
            <span class="tech-badge">HAProxy</span>
            <span class="tech-badge">Let's Encrypt</span>
          </div>
        </div>
        <div class="d-card mid" style="position:relative;">
          <div class="zone-indicator zone-mid"></div>
          <div class="name">🔑 OAuth Gateway</div>
          <div class="desc">Authentification, SSO, MFA</div>
          <div class="badges">
            <span class="tech-badge">Keycloak</span>
            <span class="tech-badge">OIDC</span>
            <span class="tech-badge">TOTP</span>
          </div>
        </div>
        <div class="d-card mid" style="position:relative;">
          <div class="zone-indicator zone-mid"></div>
          <div class="name">📋 API Gateway</div>
          <div class="desc">Rate limiting, validation, throttling</div>
          <div class="badges">
            <span class="tech-badge">Kong</span>
            <span class="tech-badge">JWT Validation</span>
          </div>
        </div>
      </div>
    </div>

    <div class="d-connector">
      <svg width="40" height="22"><rect x="17" y="0" width="6" height="10" fill="#D4A843" opacity="0.5"/><polygon points="20,22 8,10 32,10" fill="#D4A843" opacity="0.5"/></svg>
    </div>

    <!-- RBAC / IAM -->
    <div class="d-layer">
      <div class="d-icon">👤</div>
      <div class="d-label">Identité</div>
      <div class="d-content">
        <div class="d-card inner" style="position:relative;">
          <div class="zone-indicator zone-inner"></div>
          <div class="name">🔐 RBAC / IAM</div>
          <div class="desc">Contrôle d'accès basé sur les rôles — ARPT, Opérateurs, Public</div>
          <div class="badges">
            <span class="tech-badge">Keycloak</span>
            <span class="tech-badge">RBAC Policies</span>
            <span class="tech-badge">LDAP</span>
            <span class="tech-badge">MFA</span>
          </div>
        </div>
        <div class="d-card inner" style="position:relative;">
          <div class="zone-indicator zone-inner"></div>
          <div class="name">🔒 Chiffrement</div>
          <div class="desc">Au repos (AES-256) et en transit (TLS 1.3)</div>
          <div class="badges">
            <span class="tech-badge">AES-256-GCM</span>
            <span class="tech-badge">TLS 1.3</span>
            <span class="tech-badge">Vault</span>
            <span class="tech-badge">KMS</span>
          </div>
        </div>
      </div>
    </div>

    <div class="d-connector">
      <svg width="40" height="22"><rect x="17" y="0" width="6" height="10" fill="#D4A843" opacity="0.5"/><polygon points="20,22 8,10 32,10" fill="#D4A843" opacity="0.5"/></svg>
    </div>

    <!-- Audit & Monitoring -->
    <div class="d-layer">
      <div class="d-icon">📋</div>
      <div class="d-label">Surveillance</div>
      <div class="d-content">
        <div class="d-card core" style="position:relative;">
          <div class="zone-indicator zone-core"></div>
          <div class="name">📝 Audit Logs</div>
          <div class="desc">Traçabilité complète — Qui, Quand, Quoi, Où</div>
          <div class="badges">
            <span class="tech-badge">ELK Stack</span>
            <span class="tech-badge">Fluentd</span>
            <span class="tech-badge">Immutable Logs</span>
          </div>
        </div>
        <div class="d-card core" style="position:relative;">
          <div class="zone-indicator zone-core"></div>
          <div class="name">🖥️ SOC Monitoring</div>
          <div class="desc">Centre opérationnel de sécurité — SIEM</div>
          <div class="badges">
            <span class="tech-badge">Wazuh</span>
            <span class="tech-badge">Prometheus</span>
            <span class="tech-badge">Grafana</span>
            <span class="tech-badge">AlertManager</span>
          </div>
        </div>
        <div class="d-card core" style="position:relative;">
          <div class="zone-indicator zone-core"></div>
          <div class="name">⚖️ Conformité</div>
          <div class="desc">Moteur de vérification réglementaire</div>
          <div class="badges">
            <span class="tech-badge">ISO 27001</span>
            <span class="tech-badge">RGPD</span>
            <span class="tech-badge">ITIL</span>
            <span class="tech-badge">SOC 2</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Compliance bar -->
    <div class="compliance-bar">
      <span class="cb-title">Conformité:</span>
      <span class="cb-item">🇬🇳 Loi Guinéenne</span>
      <span class="cb-item">ISO 27001</span>
      <span class="cb-item">RGPD / Données Personnelles</span>
      <span class="cb-item">ITU-T X.805</span>
      <span class="cb-item">NIST Cybersecurity</span>
      <span class="cb-item">OWASP Top 10</span>
      <span class="cb-item">SOC 2 Type II</span>
    </div>
  </div>
</body></html>"""


# ═══════════════════════════════════════════════════════════════════════════════
# RENDER ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

DIAGRAMS = [
    ("arch_system.png",  HTML_SYSTEM),
    ("arch_sig.png",     HTML_SIG),
    ("arch_bigdata.png", HTML_BIGDATA),
    ("arch_ia.png",      HTML_IA),
    ("arch_cyber.png",   HTML_CYBER),
]


def render_all():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        context = browser.new_context(
            viewport={"width": WIDTH, "height": HEIGHT},
            device_scale_factor=SCALE,
        )
        page = context.new_page()

        for filename, html in DIAGRAMS:
            outpath = os.path.join(OUTPUT_DIR, filename)
            print(f"  Rendering {filename} ...")

            page.set_content(html, wait_until="networkidle")
            # Small wait for fonts/CSS
            page.wait_for_timeout(500)

            page.screenshot(path=outpath, full_page=False)
            size_mb = os.path.getsize(outpath) / (1024 * 1024)
            print(f"    ✓ {outpath}  ({size_mb:.1f} MB)")

        context.close()
        browser.close()

    print("\n✅ All diagrams rendered successfully.")


if __name__ == "__main__":
    render_all()
