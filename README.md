# ONIT-PNG — Observatoire National Intelligent des Télécommunications

Plateforme nationale de supervision de la qualité de service des télécommunications en République de Guinée, développée pour l'ARPT (Autorité de Régulation des Postes et Télécommunications).

## Fonctionnalités

- **Tableau de Bord Directeur** — Vue stratégique avec KPIs en temps réel
- **Monitoring QoS** — Métriques détaillées (latence, débit, gigue, taux d'appel)
- **Cartographie SIG** — Carte interactive Leaflet des 8 régions administratives
- **Scoring Opérateurs** — Radar comparatif et historique des scores
- **Audit Terrain** — Gestion des campagnes de mesure
- **Rapports** — Génération et export de rapports réglementaires
- **Portail Public** — Transparence et signalement citoyen
- **Cybersécurité** — Audit logs et surveillance
- **Administration** — Gestion des utilisateurs et rôles (RBAC)

## Tech Stack

| Composant | Technologie |
|-----------|------------|
| Frontend | Next.js 16 + TypeScript |
| UI | TailwindCSS 4 + shadcn/ui |
| Base de données | SQLite via Prisma 6 |
| Authentification | NextAuth v4 (JWT) |
| Cartographie | Leaflet + GeoJSON |
| Déploiement | Docker |

## Démarrage Rapide

### Installation locale

```bash
# Cloner le dépôt
git clone https://github.com/skaba89/arpt-QoS-guinee.git
cd arpt-QoS-guinee

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env

# Initialiser la base de données
npx prisma db push
npx prisma db seed

# Lancer en développement
npm run dev
```

### Docker

```bash
docker-compose up -d
```

### Premier accès

- URL : http://localhost:3000
- Email : admin@arpt.gn
- Mot de passe : Admin@2026!

## Structure du Projet

```
├── prisma/           # Schéma DB + seed
├── public/           # Assets statiques + templates
│   └── templates/    # Modèles d'import de données
├── src/
│   ├── app/          # Pages Next.js + API routes
│   │   ├── api/      # Endpoints REST
│   │   └── data-import/  # Page d'import
│   ├── components/   # Composants React
│   └── lib/          # Utilitaires (db, rbac, geojson)
├── tests/            # Fichiers de test et données d'exemple
│   ├── drive-test/   # Exemples Drive/Walk Tests
│   ├── qos/          # Exemples QoS Internet
│   ├── signalement/  # Exemples signalements citoyens
│   ├── scoring/      # Exemples scores opérateurs
│   ├── rapport/      # Modèle rapport réglementaire XML
│   └── api/          # Script de test API
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Comptes de Test

| Email | Rôle | Mot de passe |
|-------|------|-------------|
| admin@arpt.gn | SUPER_ADMIN | Admin@2026! |
| dg@arpt.gn | DG | Admin@2026! |
| dga@arpt.gn | DGA | Admin@2026! |
| dir.tech@arpt.gn | DIRECTEUR_TECHNIQUE | Admin@2026! |
| ing.rf@arpt.gn | INGENIEUR_RF | Admin@2026! |
| analyste@arpt.gn | ANALYSTE_QOS | Admin@2026! |
| auditeur@arpt.gn | AUDITEUR | Admin@2026! |
| tech@orange.gn | OPERATEUR_READONLY | Admin@2026! |
| tech@mtn.gn | OPERATEUR_READONLY | Admin@2026! |
| tech@celcom.gn | OPERATEUR_READONLY | Admin@2026! |

## Documentation

- `tests/README_TESTS.md` — Guide des fichiers de test
- `download/ONIT-PNG_Formation_Presentation.pdf` — Document de formation complet

## Licence

Projet développé pour l'ARPT — République de Guinée
