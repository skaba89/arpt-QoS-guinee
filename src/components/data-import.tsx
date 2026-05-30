'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload, FileSpreadsheet, FileJson, FileText, Plus, Download,
  CheckCircle, XCircle, AlertTriangle, Database, Wifi, Globe,
  Smartphone, MapPin, BarChart3, ChevronDown, ChevronRight,
  FileUp, Loader2, Eye, Trash2, Play, Copy, Info, ArrowRight,
  FileCode, Shield, Zap, Lock
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';

// ─── Types ──────────────────────────────────────────────────────────
type ImportTab = 'overview' | 'csv' | 'json' | 'scoring' | 'manual' | 'campaign' | 'alert' | 'xml';

interface Operator { id: string; nom: string; code: string; }
interface Region { id: string; nom: string; code: string; }
interface Campaign { id: string; nom: string; type: string; operator: string; region: string; statut: string; }
interface ImportResult {
  success: boolean; format: string; total: number; imported: number; errors: number;
  errorDetails: { row: number; message: string }[];
}

// ─── Detailed Example Data for Each Source ───────────────────────────

const driveTestExample = `# Fichier Drive Test exporté depuis TEMS Investigation
# Date: 15 Mai 2026 | Opérateur: Orange Guinée | Région: Conakry
# Ingénieur: Mamadou Diallo | Véhicule: ONIT-VT-03
operateur,region,latitude,longitude,typeMesure,timestamp,rssi,rsrp,rsrq,sinr,debitDescendant,debitMontant,latence,gigue,tauxAppelReussi,tauxDropCall,campagne
ORANGE,CON,10.0666,-12.8569,MOBILE,2026-05-15T08:00:00Z,-60,-85,-10,12,35.2,12.5,30,3,99.2,0.5,Drive Test Conakry Mai 2026
ORANGE,CON,10.0680,-12.8580,MOBILE,2026-05-15T08:05:00Z,-63,-87,-11,10,32.1,11.8,35,4,98.8,0.8,Drive Test Conakry Mai 2026
ORANGE,CON,10.0695,-12.8595,MOBILE,2026-05-15T08:10:00Z,-58,-82,-9,14,38.5,14.2,28,3,99.5,0.3,Drive Test Conakry Mai 2026
ORANGE,CON,10.0710,-12.8610,MOBILE,2026-05-15T08:15:00Z,-72,-95,-15,5,18.7,8.3,62,8,95.2,3.1,Drive Test Conakry Mai 2026
ORANGE,CON,10.0725,-12.8625,MOBILE,2026-05-15T08:20:00Z,-80,-102,-18,2,5.1,2.0,120,15,85.3,8.2,Drive Test Conakry Mai 2026
MTN,CON,10.0666,-12.8569,MOBILE,2026-05-15T09:00:00Z,-65,-88,-12,9,28.5,10.2,38,4,98.5,1.0,Drive Test Conakry Mai 2026
MTN,KIN,10.0500,-12.3000,MOBILE,2026-05-15T10:00:00Z,-75,-98,-16,4,12.8,5.2,72,10,92.1,4.5,Drive Test Kindia Mai 2026
CELCOM,BOK,11.0500,-14.2000,MOBILE,2026-05-15T12:00:00Z,-80,-102,-18,3,8.2,3.1,95,15,88.5,5.2,Drive Test Boké Mai 2026`;

const qosInternetExample = `# Fichier QoS Internet - Sondes Speedtest/Ookla
# Période: 15 Mai 2026 | Régions: Toutes
operateur,region,latitude,longitude,typeMesure,timestamp,debitDownload,debitUpload,ping,dnsLookupTime,tcpConnectTime,scoreQoE,pageLoadTime,videoBuffering,campagne
ORANGE,CON,10.0666,-12.8569,INTERNET,2026-05-15T14:00:00Z,22.5,8.3,42,15,48,75,2.8,0.6,QoS Internet Conakry Q2 2026
ORANGE,CON,10.0700,-12.8600,INTERNET,2026-05-15T14:05:00Z,18.2,6.5,48,18,55,70,3.2,0.9,QoS Internet Conakry Q2 2026
ORANGE,CON,10.0500,-12.8400,INTERNET,2026-05-15T14:10:00Z,28.3,10.1,35,12,40,82,2.2,0.4,QoS Internet Conakry Q2 2026
MTN,CON,10.0666,-12.8569,INTERNET,2026-05-15T14:15:00Z,18.2,6.1,55,20,62,68,3.5,1.1,QoS Internet Conakry Q2 2026
CELCOM,CON,10.0666,-12.8569,INTERNET,2026-05-15T14:25:00Z,10.5,3.8,78,28,85,52,5.2,2.8,QoS Internet Conakry Q2 2026
ORANGE,KIN,10.0500,-12.3000,INTERNET,2026-05-15T14:35:00Z,8.2,3.1,85,32,92,45,6.8,3.5,QoS Internet Kindia Q2 2026
CELCOM,BOK,11.0500,-14.2000,INTERNET,2026-05-15T14:50:00Z,2.5,0.8,180,65,185,15,15.2,9.5,QoS Internet Boké Q2 2026
ORANGE,LAB,11.3500,-12.5000,INTERNET,2026-05-15T14:55:00Z,6.3,2.5,95,38,108,38,8.5,4.5,QoS Internet Labé Q2 2026`;

const signalementCitoyenExample = `{
  "description": "Signalements citoyens - 15 Mai 2026",
  "type": "signalement_citoyen",
  "measurements": [
    {
      "operateur": "ORANGE",
      "region": "CON",
      "latitude": 10.0666,
      "longitude": -12.8569,
      "typeMesure": "INTERNET",
      "timestamp": "2026-05-15T16:30:00Z",
      "debitDownload": 5.2,
      "debitUpload": 1.8,
      "ping": 95,
      "scoreQoE": 25,
      "pageLoadTime": 8.5,
      "videoBuffering": 5.2,
      "campagne": "Signalement Citoyen Conakry Mai 2026"
    },
    {
      "operateur": "MTN",
      "region": "CON",
      "latitude": 10.0420,
      "longitude": -12.8450,
      "typeMesure": "MOBILE",
      "timestamp": "2026-05-15T17:15:00Z",
      "rssi": -85,
      "rsrp": -110,
      "rsrq": -20,
      "sinr": 1,
      "tauxAppelReussi": 75.0,
      "tauxDropCall": 12.5,
      "campagne": "Signalement Citoyen Conakry Mai 2026"
    },
    {
      "operateur": "CELCOM",
      "region": "KAN",
      "latitude": 10.3800,
      "longitude": -9.3100,
      "typeMesure": "INTERNET",
      "timestamp": "2026-05-15T18:00:00Z",
      "debitDownload": 0.8,
      "debitUpload": 0.2,
      "ping": 250,
      "scoreQoE": 8,
      "pageLoadTime": 25.0,
      "videoBuffering": 15.0,
      "campagne": "Signalement Citoyen Kankan Mai 2026"
    }
  ]
}`;

const scoringExample = `{
  "description": "Scores opérateurs Q2 2026",
  "type": "scoring_operateur",
  "scores": [
    {
      "operateur": "ORANGE",
      "periode": "2026-Q2",
      "scoreGlobal": 82.5,
      "scoreCouverture": 85.0,
      "scoreQoS": 80.0,
      "scoreQoE": 78.0,
      "scoreConformite": 87.0,
      "recommandation": "Maintenir les investissements en infrastructure 4G en zone rurale."
    },
    {
      "operateur": "MTN",
      "periode": "2026-Q2",
      "scoreGlobal": 75.3,
      "scoreCouverture": 78.0,
      "scoreQoS": 72.0,
      "scoreQoE": 70.5,
      "scoreConformite": 82.0,
      "recommandation": "Amélioration urgente du débit internet en zone rurale."
    },
    {
      "operateur": "CELCOM",
      "periode": "2026-Q2",
      "scoreGlobal": 62.8,
      "scoreCouverture": 58.0,
      "scoreQoS": 65.0,
      "scoreQoE": 55.0,
      "scoreConformite": 73.0,
      "recommandation": "Mise en demeure: couverture 4G insuffisante dans 3 régions."
    }
  ]
}`;

const alerteAutoExample = `Via l'API REST:
POST /api/alerts
Content-Type: application/json

{
  "type": "DEGRADATION",
  "severity": "CRITIQUE",
  "operateurId": "id-orange",
  "regionId": "id-conakry",
  "message": "RSRP inférieur à -110 dBm sur 40% des mesures à Conakry",
  "details": "Seuil critique dépassé: RSRP moyen = -115 dBm (seuil = -110 dBm). 12 mesures sur 30 en dessous du seuil. Zone affectée: Kaloum, Dixinn."
}

Ou via le formulaire ci-dessous 👇`;

const rapportReglementaireExample = `<?xml version="1.0" encoding="UTF-8"?>
<rapportReglementaire>
  <entete>
    <typeRapport>REGLEMENTAIRE</typeRapport>
    <periode>2026-Q2</periode>
    <dateSoumission>2026-05-15</dateSoumission>
    <operateur>
      <code>ORANGE</code>
      <nom>Orange Guinée</nom>
      <licence>LIC-2020-001</licence>
    </operateur>
    <region>
      <code>CON</code>
      <nom>Conakry</nom>
    </region>
    <responsable>Mamadou Diallo</responsable>
  </entete>
  <donnees>
    <indicateur>
      <code>COUVERTURE_4G</code>
      <nom>Taux de couverture 4G</nom>
      <valeur>85.2</valeur>
      <unite>%</unite>
      <seuilReglementaire>80</seuilReglementaire>
      <statut>CONFORME</statut>
    </indicateur>
    <indicateur>
      <code>DEBIT_MOYEN</code>
      <nom>Débit moyen descendant</nom>
      <valeur>15.8</valeur>
      <unite>Mbps</unite>
      <seuilReglementaire>10</seuilReglementaire>
      <statut>CONFORME</statut>
    </indicateur>
    <indicateur>
      <code>TAUX_DROP_CALL</code>
      <nom>Taux d'appels tombés</nom>
      <valeur>3.2</valeur>
      <unite>%</unite>
      <seuilReglementaire>5</seuilReglementaire>
      <statut>CONFORME</statut>
    </indicateur>
  </donnees>
  <mesures>
    <mesure timestamp="2026-05-15T08:00:00Z" latitude="10.0666" longitude="-12.8569">
      <rssi>-60</rssi>
      <rsrp>-85</rsrp>
      <rsrq>-10</rsrq>
      <sinr>12</sinr>
      <debitDescendant>35.2</debitDescendant>
      <latence>30</latence>
    </mesure>
  </mesures>
</rapportReglementaire>`;

// ─── Data Source Cards ──────────────────────────────────────────────
const dataSources = [
  {
    id: 'drive-test',
    title: 'Drive Test / Walk Test',
    subtitle: 'TEMS, Nemo, SwissQual',
    description: 'Données de mesures terrain collectées par les ingénieurs RF avec des outils professionnels de test réseau mobile. Inclut les métriques RF (RSSI, RSRP, RSRQ, SINR) et QoS mobile (débit, latence, taux d\'appel).',
    format: 'CSV' as const,
    icon: Smartphone,
    color: '#3B82F6',
    template: '/templates/exemple_drive_test_complet.csv',
    simpleTemplate: '/templates/modele_drive_test_tems.csv',
    fields: ['rssi', 'rsrp', 'rsrq', 'sinr', 'debitDescendant', 'debitMontant', 'latence', 'gigue', 'tauxAppelReussi', 'tauxDropCall'],
    example: driveTestExample,
    tabTarget: 'csv' as ImportTab,
    fieldDescriptions: [
      { name: 'rssi', label: 'RSSI', unit: 'dBm', range: '-50 (excellent) à -100 (faible)', desc: 'Puissance totale du signal reçu' },
      { name: 'rsrp', label: 'RSRP', unit: 'dBm', range: '-80 (bon) à -120 (très faible)', desc: 'Puissance de référence du signal 4G' },
      { name: 'rsrq', label: 'RSRQ', unit: 'dB', range: '-3 (excellent) à -20 (mauvais)', desc: 'Qualité du signal de référence' },
      { name: 'sinr', label: 'SINR', unit: 'dB', range: '20+ (excellent) à 0 (aucun)', desc: 'Rapport signal sur interférence' },
      { name: 'debitDescendant', label: 'Débit descendant', unit: 'Mbps', range: '0.5 à 50+', desc: 'Vitesse de téléchargement' },
      { name: 'latence', label: 'Latence', unit: 'ms', range: '20 à 200+', desc: 'Temps de réponse du réseau' },
      { name: 'tauxAppelReussi', label: 'Taux appel réussi', unit: '%', range: '90 à 100', desc: 'Pourcentage d\'appels aboutis' },
      { name: 'tauxDropCall', label: 'Taux drop call', unit: '%', range: '0 à 10', desc: 'Pourcentage d\'appels tombés' },
    ],
    collectSteps: [
      { step: 1, title: 'Sur le terrain', desc: 'Les ingénieurs RF utilisent des logiciels professionnels (TEMS Investigation, Nemo Handy, SwissQual DivOS) installés sur des smartphones ou tablettes dédiés, montés dans un véhicule équipé.' },
      { step: 2, title: 'Pendant le parcours', desc: 'L\'outil enregistre en continu les métriques RF et QoS avec les coordonnées GPS à intervalles réguliers (toutes les 1-5 secondes). Un parcours typique couvre 50-100 points de mesure.' },
      { step: 3, title: 'Après la campagne', desc: 'Les données sont exportées au format CSV depuis l\'outil TEMS/Nemo/SwissQual, puis le fichier est importé dans ARPT-QoS-Guinée via ce module d\'import.' },
      { step: 4, title: 'Fréquence', desc: 'Campagnes trimestrielles par région, ou sur demande lors de plaintes citoyennes ou d\'audits réglementaires. Chaque campagne dure 3-5 jours par région.' },
    ],
  },
  {
    id: 'qos-internet',
    title: 'QoS Internet',
    subtitle: 'Speedtest, Ookla, NetMetric',
    description: 'Mesures de qualité de service internet collectées via des outils de test de débit automatiques ou manuels. Comprend les débits descendant/montant, ping, temps DNS, temps TCP, et métriques QoE.',
    format: 'CSV' as const,
    icon: Wifi,
    color: '#10B981',
    template: '/templates/exemple_qos_internet_complet.csv',
    simpleTemplate: '/templates/modele_qos_internet.csv',
    fields: ['debitDownload', 'debitUpload', 'ping', 'dnsLookupTime', 'tcpConnectTime', 'scoreQoE', 'pageLoadTime', 'videoBuffering'],
    example: qosInternetExample,
    tabTarget: 'csv' as ImportTab,
    fieldDescriptions: [
      { name: 'debitDownload', label: 'Débit download', unit: 'Mbps', range: '2 à 50+', desc: 'Vitesse de téléchargement internet' },
      { name: 'debitUpload', label: 'Débit upload', unit: 'Mbps', range: '1 à 25+', desc: 'Vitesse d\'envoi internet' },
      { name: 'ping', label: 'Ping', unit: 'ms', range: '15 à 200+', desc: 'Temps d\'aller-retour réseau' },
      { name: 'dnsLookupTime', label: 'Temps DNS', unit: 'ms', range: '5 à 100+', desc: 'Durée de résolution DNS' },
      { name: 'tcpConnectTime', label: 'Temps TCP', unit: 'ms', range: '20 à 200+', desc: 'Durée d\'établissement connexion TCP' },
      { name: 'scoreQoE', label: 'Score QoE', unit: '/100', range: '0 à 100', desc: 'Qualité d\'expérience utilisateur' },
      { name: 'pageLoadTime', label: 'Chargement page', unit: 's', range: '1 à 15+', desc: 'Temps de chargement page web' },
      { name: 'videoBuffering', label: 'Buffering vidéo', unit: 's', range: '0 à 10+', desc: 'Temps de mise en mémoire vidéo' },
    ],
    collectSteps: [
      { step: 1, title: 'Automatiquement', desc: 'Des sondes déployées dans les 8 régions exécutent des tests Speedtest/Ookla à intervalles réguliers (toutes les 15-30 min). Les résultats sont collectés automatiquement.' },
      { step: 2, title: 'Manuellement', desc: 'Les analystes QoS peuvent lancer des tests ponctuels via l\'application NetMetric ou l\'interface web Ookla sur le terrain ou au bureau.' },
      { step: 3, title: 'Par les citoyens', desc: 'L\'application mobile ONIT Citizen permet aux usagers de lancer un test de débit et de soumettre le résultat comme signalement citoyen.' },
      { step: 4, title: 'Export & Import', desc: 'Les résultats sont exportés en CSV avec les métadonnées de localisation et d\'opérateur, puis importés dans ARPT-QoS-Guinée via ce module.' },
    ],
  },
  {
    id: 'signalement-citoyen',
    title: 'Signalement Citoyen',
    subtitle: 'Application mobile, Portail web',
    description: 'Signalements de problèmes réseau envoyés par les citoyens via l\'application mobile ONIT Citizen ou le portail web public. Inclut la géolocalisation, l\'opérateur concerné, et les métriques mesurées.',
    format: 'JSON' as const,
    icon: Globe,
    color: '#F59E0B',
    template: '/templates/exemple_signalement_citoyen_complet.json',
    simpleTemplate: '/templates/modele_signalement_citoyen.json',
    fields: ['debitDownload', 'ping', 'scoreQoE', 'pageLoadTime', 'videoBuffering', 'rssi', 'rsrp'],
    example: signalementCitoyenExample,
    tabTarget: 'json' as ImportTab,
    fieldDescriptions: [
      { name: 'operateur', label: 'Opérateur', unit: '', range: 'ORANGE, MTN, CELCOM', desc: 'Opérateur réseau du citoyen' },
      { name: 'region', label: 'Région', unit: '', range: 'CON, KIN, BOK...', desc: 'Région administrative' },
      { name: 'latitude/longitude', label: 'Coordonnées GPS', unit: '°', range: 'Guinée: lat 7-12, lng -15 à -8', desc: 'Position GPS du signalement' },
      { name: 'debitDownload', label: 'Débit', unit: 'Mbps', range: '0.5 à 50+', desc: 'Débit mesuré par l\'appli' },
      { name: 'scoreQoE', label: 'Score QoE', unit: '/100', range: '0 à 100', desc: 'Expérience ressentie' },
    ],
    collectSteps: [
      { step: 1, title: 'Via l\'application mobile', desc: 'Les citoyens téléchargent l\'appli ONIT Citizen sur Android/iOS, sélectionnent leur opérateur, décrivent le problème rencontré, et soumettent le signalement.' },
      { step: 2, title: 'Via le portail web', desc: 'Le formulaire public sur le portail ARPT-QoS-Guinée (onglet "Portail Public") permet de signaler un problème sans créer de compte.' },
      { step: 3, title: 'Géolocalisation', desc: 'Le GPS du téléphone ou la saisie manuelle permet de localiser précisément le problème. Les coordonnées sont incluses automatiquement.' },
      { step: 4, title: 'Intégration API', desc: 'Les signalements sont envoyés en JSON via l\'API REST et créent automatiquement des alertes si les seuils sont dépassés (ex: débit < 2 Mbps).' },
    ],
  },
  {
    id: 'scoring',
    title: 'Scores Opérateurs',
    subtitle: 'Calcul automatique / Manuel',
    description: 'Scores composites calculés à partir des mesures QoS agrégées par période. Peuvent aussi être importés manuellement via JSON pour les périodes historiques ou benchmarks internationaux.',
    format: 'JSON' as const,
    icon: BarChart3,
    color: '#8B5CF6',
    template: '/templates/exemple_scoring_operateur_complet.json',
    simpleTemplate: '/templates/modele_scoring_operateur.json',
    fields: ['scoreGlobal', 'scoreCouverture', 'scoreQoS', 'scoreQoE', 'scoreConformite', 'recommandation'],
    example: scoringExample,
    tabTarget: 'scoring' as ImportTab,
    fieldDescriptions: [
      { name: 'operateur', label: 'Opérateur', unit: '', range: 'ORANGE, MTN, CELCOM', desc: 'Code de l\'opérateur noté' },
      { name: 'periode', label: 'Période', unit: '', range: '2026-Q1, 2026-Q2...', desc: 'Trimestre de référence' },
      { name: 'scoreGlobal', label: 'Score global', unit: '/100', range: '0 à 100', desc: 'Moyenne pondérée des sous-scores' },
      { name: 'scoreCouverture', label: 'Couverture', unit: '/100', range: '0 à 100', desc: 'Pondération: 25% du global' },
      { name: 'scoreQoS', label: 'Qualité de service', unit: '/100', range: '0 à 100', desc: 'Pondération: 40% du global' },
      { name: 'scoreQoE', label: 'Qualité d\'expérience', unit: '/100', range: '0 à 100', desc: 'Pondération: 20% du global' },
      { name: 'scoreConformite', label: 'Conformité', unit: '/100', range: '0 à 100', desc: 'Pondération: 15% du global' },
      { name: 'recommandation', label: 'Recommandation', unit: '', range: 'Texte libre', desc: 'Action recommandée par l\'ARPT' },
    ],
    collectSteps: [
      { step: 1, title: 'Calcul automatique', desc: 'Chaque trimestre, le moteur de scoring agrège les mesures QoS pour calculer les 5 sous-scores (couverture, QoS, QoE, conformité, global) selon l\'algorithme ARPT.' },
      { step: 2, title: 'Algorithme de pondération', desc: 'Les scores sont pondérés : 40% QoS + 25% Couverture + 20% QoE + 15% Conformité = Score Global. Les seuils sont définis par les spécifications de l\'ARPT.' },
      { step: 3, title: 'Validation', desc: 'Le Directeur Technique valide les scores avant publication. Des recommandations sont générées automatiquement selon le niveau de performance.' },
      { step: 4, title: 'Import manuel', desc: 'Les scores peuvent aussi être importés via un fichier JSON (ci-dessous) pour les périodes historiques ou les benchmarks internationaux.' },
    ],
  },
  {
    id: 'alerte-auto',
    title: 'Alertes Automatiques',
    subtitle: 'Seuils & déclencheurs système',
    description: 'Alertes générées automatiquement quand un seuil est dépassé (RSRP, débit, drop call), ou créées manuellement par les analystes via le formulaire ou l\'API REST.',
    format: 'Formulaire' as const,
    icon: AlertTriangle,
    color: '#EF4444',
    template: null,
    simpleTemplate: null,
    fields: ['type', 'severity', 'operateur', 'region', 'message', 'details'],
    example: alerteAutoExample,
    tabTarget: 'alert' as ImportTab,
    fieldDescriptions: [
      { name: 'type', label: 'Type d\'alerte', unit: '', range: 'DEGRADATION, SEUIL_DEPASSE, NON_CONFORMITE, ZONE_BLANCHE', desc: 'Catégorie de l\'alerte' },
      { name: 'severity', label: 'Sévérité', unit: '', range: 'CRITIQUE, HAUTE, MOYENNE, BASSE', desc: 'Niveau de gravité' },
      { name: 'operateurId', label: 'Opérateur', unit: '', range: 'ID ou code', desc: 'Opérateur concerné par l\'alerte' },
      { name: 'regionId', label: 'Région', unit: '', range: 'ID ou code', desc: 'Région affectée' },
      { name: 'message', label: 'Message', unit: '', range: 'Texte', desc: 'Description de l\'alerte' },
      { name: 'details', label: 'Détails', unit: '', range: 'JSON ou texte', desc: 'Informations complémentaires' },
    ],
    collectSteps: [
      { step: 1, title: 'Seuils automatiques', desc: 'Le système surveille en continu les mesures entrantes et déclenche des alertes quand les seuils sont dépassés. Exemples: RSRP < -110 dBm, débit < 2 Mbps, tauxDropCall > 5%.' },
      { step: 2, title: 'Niveaux de sévérité', desc: 'CRITIQUE: zone blanche ou RSRP < -115 dBm. HAUTE: débit < 2 Mbps ou drop call > 5%. MOYENNE: dégradations modérées. BASSE: informations de suivi.' },
      { step: 3, title: 'Signalement manuel', desc: 'Les analystes et ingénieurs peuvent créer des alertes via le formulaire ci-dessous ou directement via l\'API REST POST /api/alerts.' },
      { step: 4, title: 'Résolution', desc: 'Les alertes sont résolues quand la cause est corrigée ou après investigation. La résolution se fait via PATCH /api/alerts avec l\'ID de l\'alerte.' },
    ],
  },
  {
    id: 'rapport-reglementaire',
    title: 'Rapport Réglementaire',
    subtitle: 'Soumission opérateurs, XML',
    description: 'Rapports soumis par les opérateurs à l\'ARPT conformément aux spécifications réglementaires. Contient les indicateurs de conformité, les mesures détaillées et les observations.',
    format: 'XML' as const,
    icon: FileCode,
    color: '#06B6D4',
    template: '/templates/modele_rapport_reglementaire.xml',
    simpleTemplate: '/templates/modele_rapport_reglementaire.xml',
    fields: ['typeRapport', 'periode', 'operateur', 'indicateurs', 'mesures', 'conformite'],
    example: rapportReglementaireExample,
    tabTarget: 'xml' as ImportTab,
    fieldDescriptions: [
      { name: 'typeRapport', label: 'Type', unit: '', range: 'REGLEMENTAIRE, OPERATEUR, PUBLIC', desc: 'Type de rapport soumis' },
      { name: 'periode', label: 'Période', unit: '', range: '2026-Q1, 2026-Q2...', desc: 'Trimestre de référence' },
      { name: 'operateur/code', label: 'Opérateur', unit: '', range: 'ORANGE, MTN, CELCOM', desc: 'Code opérateur' },
      { name: 'indicateur', label: 'Indicateurs', unit: '', range: 'Multiple', desc: 'Indicateurs de conformité avec seuils' },
      { name: 'mesure', label: 'Mesures', unit: '', range: 'Multiple', desc: 'Mesures détaillées au format XML' },
      { name: 'conformite', label: 'Conformité', unit: '', range: '0-100%', desc: 'Taux de conformité global' },
    ],
    collectSteps: [
      { step: 1, title: 'Soumission par l\'opérateur', desc: 'Chaque trimestre, les opérateurs doivent soumettre un rapport réglementaire à l\'ARPT conformément aux spécifications de leur licence. Le format XML est requis.' },
      { step: 2, title: 'Contenu du rapport', desc: 'Le rapport doit inclure: les indicateurs de QoS avec comparaison aux seuils réglementaires, les mesures terrain détaillées, et le taux de conformité global.' },
      { step: 3, title: 'Validation ARPT', desc: 'L\'ARPT vérifie la conformité des données soumises avec les mesures indépendantes (drive tests, sondes). En cas de divergence, un audit est déclenché.' },
      { step: 4, title: 'Intégration ARPT-QoS-Guinée', desc: 'Le fichier XML est importé dans ARPT-QoS-Guinée. Les mesures qu\'il contient sont extraites et stockées. Les indicateurs alimentent le scoring de conformité.' },
    ],
  },
];

// ─── Main Component ─────────────────────────────────────────────────
export function DataImport() {
  const { isAuthorized, isLoading: authLoading } = useAuthGuard('ANALYSTE_QOS');
  const [activeTab, setActiveTab] = useState<ImportTab>('overview');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>('drive-test');
  const [showFullExample, setShowFullExample] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    operateurId: '', regionId: '', campagneId: '',
    latitude: '', longitude: '', typeMesure: 'MOBILE',
    rssi: '', rsrp: '', rsrq: '', sinr: '',
    debitDescendant: '', debitMontant: '', latence: '', gigue: '',
    tauxAppelReussi: '', tauxDropCall: '',
    debitDownload: '', debitUpload: '', ping: '',
    dnsLookupTime: '', tcpConnectTime: '',
    scoreQoE: '', pageLoadTime: '', videoBuffering: '',
  });

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    nom: '', type: 'QOS_INTERNET', operateurId: '', regionId: '',
    dateDebut: new Date().toISOString().split('T')[0], dateFin: '', responsable: '',
  });

  // Alert form state
  const [alertForm, setAlertForm] = useState({
    type: 'DEGRADATION', severity: 'HAUTE', operateurId: '', regionId: '',
    message: '', details: '',
  });

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    try {
      const [opsRes, regsRes, campsRes] = await Promise.all([
        fetch('/api/dashboard'), fetch('/api/map'), fetch('/api/campaigns'),
      ]);
      if (opsRes.ok) {
        const data = await opsRes.json();
        if (data.operators) setOperators(data.operators.map((o: { id: string; nom: string; code: string }) => ({ id: o.id, nom: o.nom, code: o.code })));
      }
      if (regsRes.ok) {
        const data = await regsRes.json();
        if (data.regions) setRegions(data.regions.map((r: { id: string; nom: string; code: string }) => ({ id: r.id, nom: r.nom, code: r.code })));
      }
      if (campsRes.ok) {
        const data = await campsRes.json();
        if (data.data) setCampaigns(data.data);
      }
    } catch (err) { console.error('Error fetching reference data:', err); }
  }, []);

  useEffect(() => { fetchReferenceData(); }, [fetchReferenceData]);

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // Load example data as a file and import it
  const loadExampleAndImport = async (sourceId: string) => {
    const source = dataSources.find(s => s.id === sourceId);
    if (!source) return;

    let blob: Blob;
    let fileName: string;

    if (source.format === 'CSV') {
      blob = new Blob([source.example], { type: 'text/csv' });
      fileName = `exemple_${sourceId}.csv`;
    } else if (source.format === 'JSON') {
      blob = new Blob([source.example], { type: 'application/json' });
      fileName = `exemple_${sourceId}.json`;
    } else if (source.format === 'XML') {
      blob = new Blob([source.example], { type: 'application/xml' });
      fileName = `exemple_${sourceId}.xml`;
    } else {
      return; // Formulaire - navigate to form
    }

    const file = new File([blob], fileName, { type: blob.type });
    await handleFileImport(file);
  };

  // Handle CSV/JSON file import
  const handleFileImport = async (file: File) => {
    setLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      setImportResult(data);
    } catch {
      setImportResult({ success: false, format: 'unknown', total: 0, imported: 0, errors: 1, errorDetails: [{ row: 0, message: 'Erreur réseau lors de l\'import' }] });
    }
    setLoading(false);
  };

  // Handle scoring import
  const handleScoringImport = async (file: File) => {
    setLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import-scoring', { method: 'POST', body: formData });
      const data = await res.json();
      setImportResult(data);
    } catch {
      setImportResult({ success: false, format: 'scoring', total: 0, imported: 0, errors: 1, errorDetails: [{ row: 0, message: 'Erreur réseau lors de l\'import' }] });
    }
    setLoading(false);
  };

  // Handle manual measurement creation
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/measurements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manualForm) });
      const data = await res.json();
      if (data.success) {
        setImportResult({ success: true, format: 'manual', total: 1, imported: 1, errors: 0, errorDetails: [] });
        setManualForm(prev => ({ ...prev, rssi: '', rsrp: '', rsrq: '', sinr: '', debitDescendant: '', debitMontant: '', latence: '', gigue: '', tauxAppelReussi: '', tauxDropCall: '', debitDownload: '', debitUpload: '', ping: '', dnsLookupTime: '', tcpConnectTime: '', scoreQoE: '', pageLoadTime: '', videoBuffering: '' }));
      } else {
        setImportResult({ success: false, format: 'manual', total: 1, imported: 0, errors: 1, errorDetails: [{ row: 1, message: data.error || 'Erreur inconnue' }] });
      }
    } catch {
      setImportResult({ success: false, format: 'manual', total: 1, imported: 0, errors: 1, errorDetails: [{ row: 1, message: 'Erreur réseau' }] });
    }
    setLoading(false);
  };

  // Handle campaign creation
  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(campaignForm) });
      const data = await res.json();
      if (data.campaign) {
        setImportResult({ success: true, format: 'campaign', total: 1, imported: 1, errors: 0, errorDetails: [] });
        setCampaignForm({ nom: '', type: 'QOS_INTERNET', operateurId: '', regionId: '', dateDebut: new Date().toISOString().split('T')[0], dateFin: '', responsable: '' });
        fetchReferenceData();
      } else {
        setImportResult({ success: false, format: 'campaign', total: 1, imported: 0, errors: 1, errorDetails: [{ row: 1, message: data.error || 'Erreur' }] });
      }
    } catch {
      setImportResult({ success: false, format: 'campaign', total: 1, imported: 0, errors: 1, errorDetails: [{ row: 1, message: 'Erreur réseau' }] });
    }
    setLoading(false);
  };

  // Handle alert creation
  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(alertForm) });
      const data = await res.json();
      if (data.alert) {
        setImportResult({ success: true, format: 'alert', total: 1, imported: 1, errors: 0, errorDetails: [] });
        setAlertForm({ type: 'DEGRADATION', severity: 'HAUTE', operateurId: '', regionId: '', message: '', details: '' });
      } else {
        setImportResult({ success: false, format: 'alert', total: 1, imported: 0, errors: 1, errorDetails: [{ row: 1, message: data.error || 'Erreur' }] });
      }
    } catch {
      setImportResult({ success: false, format: 'alert', total: 1, imported: 0, errors: 1, errorDetails: [{ row: 1, message: 'Erreur réseau' }] });
    }
    setLoading(false);
  };

  // Drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (activeTab === 'scoring') handleScoringImport(file);
      else handleFileImport(file);
    }
  };

  // ─── Render Import Result ──────────────────────────────────────
  const renderImportResult = () => {
    if (!importResult) return null;
    return (
      <div className={`mt-4 p-4 rounded-xl border ${importResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center gap-2 mb-2">
          {importResult.success ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
          <span className={`font-semibold text-sm ${importResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
            {importResult.success ? 'Import réussi !' : 'Import avec erreurs'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-muted rounded-lg p-2 text-center">
            <div className="text-muted-foreground">Total</div>
            <div className="text-foreground font-bold text-lg">{importResult.total}</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
            <div className="text-emerald-400">Importés</div>
            <div className="text-emerald-400 font-bold text-lg">{importResult.imported}</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2 text-center">
            <div className="text-red-400">Erreurs</div>
            <div className="text-red-400 font-bold text-lg">{importResult.errors}</div>
          </div>
        </div>
        {importResult.errorDetails.length > 0 && (
          <div className="mt-3 space-y-1">
            {importResult.errorDetails.slice(0, 5).map((err, idx) => (
              <div key={idx} className="text-xs text-red-300 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Ligne {err.row}: {err.message}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Auth Guard ──────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Lock className="h-12 w-12 text-red-400" />
        <h3 className="text-lg font-semibold text-foreground">Accès non autorisé</h3>
        <p className="text-muted-foreground text-sm">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
      </div>
    );
  }

  // ─── Common Styles ────────────────────────────────────────────
  const inputClass = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs text-foreground placeholder-slate-600 focus:outline-none focus:border-[#D4A843]/50 focus:ring-1 focus:ring-[#D4A843]/20";
  const labelClass = "text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1";
  const selectClass = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-[#D4A843]/50 appearance-none";

  // ─── OVERVIEW TAB ──────────────────────────────────────────────
  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Sources de Données & Exemples</h2>
            <p className="text-xs text-muted-foreground mt-1">Cliquez sur chaque source pour voir le format détaillé, les exemples concrets, et tester l&apos;import</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-primary/10 text-primary border border-[#D4A843]/20">
              <Database className="h-3 w-3" /> {dataSources.length} sources
            </span>
          </div>
        </div>

        {renderImportResult()}

        {/* Data Sources Cards */}
        <div className="space-y-3">
          {dataSources.map((source) => {
            const Icon = source.icon;
            const isExpanded = expandedSource === source.id;
            const isFullExample = showFullExample === source.id;
            return (
              <div key={source.id} className="rounded-xl border border-border overflow-hidden bg-white/[0.02]">
                <button
                  onClick={() => { setExpandedSource(isExpanded ? null : source.id); setShowFullExample(null); }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${source.color}20` }}>
                    <Icon className="h-5 w-5" style={{ color: source.color }} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{source.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent text-muted-foreground">{source.subtitle}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium border" style={{ borderColor: `${source.color}40`, color: source.color, backgroundColor: `${source.color}10` }}>{source.format}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{source.description}</p>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    {/* Field descriptions table */}
                    <div>
                      <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Description des champs</h4>
                      <div className="bg-background rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Champ</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Unité</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Plage typique</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {source.fieldDescriptions?.map((fd) => (
                              <tr key={fd.name} className="border-b border-border">
                                <td className="py-1.5 px-2 font-mono text-primary">{fd.label}</td>
                                <td className="py-1.5 px-2 text-muted-foreground">{fd.unit}</td>
                                <td className="py-1.5 px-2 text-foreground">{fd.range}</td>
                                <td className="py-1.5 px-2 text-muted-foreground">{fd.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Example data with copy & load buttons */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Exemple de données {source.format}</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(source.example, source.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            {copied === source.id ? 'Copié !' : 'Copier'}
                          </button>
                          {source.format !== 'Formulaire' && source.format !== 'XML' && (
                            <button
                              onClick={() => loadExampleAndImport(source.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                              Charger l&apos;exemple
                            </button>
                          )}
                          <button
                            onClick={() => setShowFullExample(isFullExample ? null : source.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            {isFullExample ? 'Réduire' : 'Voir tout'}
                          </button>
                        </div>
                      </div>
                      <pre className={`bg-background border border-border rounded-lg p-3 text-[10px] text-emerald-300 overflow-x-auto font-mono leading-relaxed ${!isFullExample ? 'max-h-40' : ''}`}>
                        {source.example}
                      </pre>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {source.template && (
                        <a href={source.template} download className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-[#D4A843]/20 text-xs font-medium hover:bg-primary/20 transition-colors">
                          <Download className="h-3.5 w-3.5" /> Télécharger modèle {source.format}
                        </a>
                      )}
                      {source.simpleTemplate && source.simpleTemplate !== source.template && (
                        <a href={source.simpleTemplate} download className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs font-medium hover:bg-accent transition-colors">
                          <FileSpreadsheet className="h-3.5 w-3.5" /> Modèle simple
                        </a>
                      )}
                      {source.format !== 'Formulaire' && source.format !== 'XML' && (
                        <button
                          onClick={() => setActiveTab(source.tabTarget)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs font-medium hover:bg-accent transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" /> Importer un fichier {source.format}
                        </button>
                      )}
                      {source.format === 'Formulaire' && (
                        <button onClick={() => setActiveTab('alert')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs font-medium hover:bg-accent transition-colors">
                          <Plus className="h-3.5 w-3.5" /> Créer une alerte
                        </button>
                      )}
                      {source.format === 'XML' && (
                        <a href={source.template} download className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground border border-border text-xs font-medium hover:bg-accent transition-colors">
                          <FileCode className="h-3.5 w-3.5" /> Télécharger modèle XML
                        </a>
                      )}
                    </div>

                    {/* How data is collected */}
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <h4 className="text-[10px] font-medium text-primary uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Info className="h-3 w-3" /> Comment ces données sont-elles collectées et renseignées ?
                      </h4>
                      <div className="space-y-3">
                        {source.collectSteps.map((cs) => (
                          <div key={cs.step} className="flex gap-3">
                            <div className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${source.color}20`, color: source.color }}>
                              {cs.step}
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold text-foreground">{cs.title}</div>
                              <div className="text-[10px] text-muted-foreground leading-relaxed">{cs.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Reference */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-primary mb-3 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" /> Référence rapide - Codes utilisables
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px]">
            <div>
              <div className="text-foreground font-semibold mb-1">Opérateurs</div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded font-mono">ORANGE</span><span className="text-muted-foreground">Orange Guinée</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded font-mono">MTN</span><span className="text-muted-foreground">MTN Guinée</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-mono">CELCOM</span><span className="text-muted-foreground">Celcom Guinée</span></div>
              </div>
            </div>
            <div>
              <div className="text-foreground font-semibold mb-1">Régions</div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono">CON</span><span className="text-muted-foreground">Conakry</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono">KIN</span><span className="text-muted-foreground">Kindia</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono">BOK</span><span className="text-muted-foreground">Boké</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono">LAB</span><span className="text-muted-foreground">Labé</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono">MAM</span><span className="text-muted-foreground">Mamou</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono">FAR</span><span className="text-muted-foreground">Faranah</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono">KAN</span><span className="text-muted-foreground">Kankan</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-mono">NZE</span><span className="text-muted-foreground">N&apos;Zérékoré</span></div>
              </div>
            </div>
            <div>
              <div className="text-foreground font-semibold mb-1">Types de mesure</div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded font-mono">MOBILE</span><span className="text-muted-foreground">RF + Appels vocaux</span></div>
                <div className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded font-mono">INTERNET</span><span className="text-muted-foreground">Débit + QoE web</span></div>
              </div>
              <div className="text-foreground font-semibold mb-1 mt-3">Types d&apos;alerte</div>
              <div className="space-y-0.5">
                <div><span className="font-mono text-red-400">DEGRADATION</span></div>
                <div><span className="font-mono text-orange-400">SEUIL_DEPASSE</span></div>
                <div><span className="font-mono text-yellow-400">NON_CONFORMITE</span></div>
                <div><span className="font-mono text-rose-400">ZONE_BLANCHE</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CSV IMPORT TAB ───────────────────────────────────────────
  if (activeTab === 'csv') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('overview')} className="text-muted-foreground hover:text-foreground text-xs">&larr; Retour</button>
          <h2 className="text-xl font-bold text-foreground">Import CSV</h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Drive Test / QoS Internet</span>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? 'border-[#D4A843] bg-[#D4A843]/5' : 'border-border bg-white/[0.02]'}`}
        >
          <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-foreground mb-2">Glissez-déposez votre fichier CSV ici</p>
          <p className="text-[10px] text-muted-foreground mb-4">ou cliquez pour sélectionner un fichier (max 1000 lignes)</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-[#D4A843]/20 text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">
            <Upload className="h-4 w-4" /> Sélectionner un fichier CSV
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileImport(file); }} />
          </label>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Import en cours...</span>
          </div>
        )}

        {renderImportResult()}

        {/* Quick test with example */}
        <div className="bg-blue-500/5 rounded-xl border border-blue-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-2"><Play className="h-3.5 w-3.5" /> Tester avec un exemple</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Chargez directement les données d&apos;exemple Drive Test dans la base pour voir comment ça fonctionne</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadExampleAndImport('drive-test')} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Drive Test
              </button>
              <button onClick={() => loadExampleAndImport('qos-internet')} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} QoS Internet
              </button>
            </div>
          </div>
        </div>

        {/* CSV Format Reference */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Format CSV attendu</h3>
          <pre className="text-[10px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
{`# Les lignes commençant par # sont des commentaires (ignorées)
# Colonnes requises: operateur, region, latitude, longitude, typeMesure
# Les colonnes de métriques vides sont acceptées
operateur,region,latitude,longitude,typeMesure,timestamp,rssi,rsrp,rsrq,sinr,...
ORANGE,CON,10.0666,-12.8569,MOBILE,2026-05-15T10:30:00Z,-65,-90,-12,8,...
MTN,KIN,10.0500,-12.3000,INTERNET,2026-05-15T11:00:00Z,,,,,,...`}
          </pre>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="text-muted-foreground"><strong className="text-foreground">Requis :</strong> operateur, region, latitude, longitude, typeMesure</div>
            <div className="text-muted-foreground"><strong className="text-foreground">Opérateurs :</strong> ORANGE, MTN, CELCOM</div>
            <div className="text-muted-foreground"><strong className="text-foreground">Régions :</strong> CON, KIN, BOK, LAB, MAM, FAR, KAN, NZE</div>
            <div className="text-muted-foreground"><strong className="text-foreground">Types :</strong> MOBILE, INTERNET</div>
          </div>
          <div className="mt-3 flex gap-3">
            <a href="/templates/exemple_drive_test_complet.csv" download className="flex items-center gap-1.5 text-[10px] text-primary hover:underline"><Download className="h-3 w-3" /> Modèle Drive Test complet</a>
            <a href="/templates/exemple_qos_internet_complet.csv" download className="flex items-center gap-1.5 text-[10px] text-primary hover:underline"><Download className="h-3 w-3" /> Modèle QoS Internet complet</a>
          </div>
        </div>
      </div>
    );
  }

  // ─── JSON IMPORT TAB (Signalement Citoyen) ──────────────────────
  if (activeTab === 'json') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('overview')} className="text-muted-foreground hover:text-foreground text-xs">&larr; Retour</button>
          <h2 className="text-xl font-bold text-foreground">Import JSON</h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">Signalement Citoyen</span>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? 'border-[#D4A843] bg-[#D4A843]/5' : 'border-border bg-white/[0.02]'}`}
        >
          <FileJson className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-foreground mb-2">Glissez-déposez votre fichier JSON ici</p>
          <p className="text-[10px] text-muted-foreground mb-4">Formats acceptés: tableau, objet avec clé "measurements" ou "data"</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-[#D4A843]/20 text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">
            <Upload className="h-4 w-4" /> Sélectionner un fichier JSON
            <input type="file" accept=".json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileImport(file); }} />
          </label>
        </div>

        {loading && (<div className="flex items-center justify-center gap-2 py-4"><Loader2 className="h-5 w-5 text-primary animate-spin" /><span className="text-xs text-muted-foreground">Import en cours...</span></div>)}
        {renderImportResult()}

        {/* Quick test */}
        <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-2"><Play className="h-3.5 w-3.5" /> Tester avec un exemple</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Chargez les données d&apos;exemple de signalement citoyen</p>
            </div>
            <button onClick={() => loadExampleAndImport('signalement-citoyen')} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Charger Signalement Citoyen
            </button>
          </div>
        </div>

        {/* JSON Format Reference */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Format JSON attendu</h3>
          <pre className="text-[10px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
{`{
  "measurements": [
    {
      "operateur": "ORANGE",
      "region": "CON",
      "latitude": 10.0666,
      "longitude": -12.8569,
      "typeMesure": "INTERNET",
      "debitDownload": 5.2,
      "ping": 95,
      "scoreQoE": 25,
      "campagne": "Signalement Mai 2026"
    }
  ]
}`}
          </pre>
          <div className="mt-3 flex gap-3">
            <a href="/templates/exemple_signalement_citoyen_complet.json" download className="flex items-center gap-1.5 text-[10px] text-primary hover:underline"><Download className="h-3 w-3" /> Modèle signalement complet</a>
            <a href="/templates/modele_signalement_citoyen.json" download className="flex items-center gap-1.5 text-[10px] text-primary hover:underline"><Download className="h-3 w-3" /> Modèle simple</a>
          </div>
        </div>

        {/* API Integration */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Intégration par API</h3>
          <pre className="text-[10px] text-blue-300 font-mono overflow-x-auto leading-relaxed">
{`# Signalement citoyen via API REST
curl -X POST https://onit.arpt.gn/api/import \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "measurements": [{
      "operateur":"ORANGE",
      "region":"CON",
      "latitude":10.0666,
      "longitude":-12.8569,
      "typeMesure":"INTERNET",
      "debitDownload":5.2,
      "ping":95,
      "campagne":"Signalement Citoyen"
    }]
  }'`}
          </pre>
        </div>
      </div>
    );
  }

  // ─── SCORING IMPORT TAB ───────────────────────────────────────
  if (activeTab === 'scoring') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('overview')} className="text-muted-foreground hover:text-foreground text-xs">&larr; Retour</button>
          <h2 className="text-xl font-bold text-foreground">Import Scores Opérateurs</h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20">Scoring</span>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? 'border-[#D4A843] bg-[#D4A843]/5' : 'border-border bg-white/[0.02]'}`}
        >
          <BarChart3 className="h-10 w-10 mx-auto text-violet-500 mb-3" />
          <p className="text-sm text-foreground mb-2">Glissez-déposez votre fichier JSON de scores</p>
          <p className="text-[10px] text-muted-foreground mb-4">Format: {`{ "scores": [...] }`} avec les 5 sous-scores par opérateur/période</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-[#D4A843]/20 text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">
            <Upload className="h-4 w-4" /> Sélectionner un fichier JSON
            <input type="file" accept=".json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleScoringImport(file); }} />
          </label>
        </div>

        {loading && (<div className="flex items-center justify-center gap-2 py-4"><Loader2 className="h-5 w-5 text-primary animate-spin" /><span className="text-xs text-muted-foreground">Import en cours...</span></div>)}
        {renderImportResult()}

        {/* Quick test */}
        <div className="bg-violet-500/5 rounded-xl border border-violet-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-violet-400 flex items-center gap-2"><Play className="h-3.5 w-3.5" /> Tester avec un exemple</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Chargez les scores d&apos;exemple pour les 3 opérateurs (Q2 2026)</p>
            </div>
            <button onClick={() => { const blob = new Blob([scoringExample], { type: 'application/json' }); handleScoringImport(new File([blob], 'exemple_scoring.json', { type: 'application/json' })); }} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-medium hover:bg-violet-500/20 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Charger les scores d&apos;exemple
            </button>
          </div>
        </div>

        {/* Scoring Format Reference */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Format JSON Scoring</h3>
          <pre className="text-[10px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
{`{
  "scores": [
    {
      "operateur": "ORANGE",
      "periode": "2026-Q2",
      "scoreGlobal": 82.5,
      "scoreCouverture": 85.0,   // Pondération: 25%
      "scoreQoS": 80.0,          // Pondération: 40%
      "scoreQoE": 78.0,          // Pondération: 20%
      "scoreConformite": 87.0,   // Pondération: 15%
      "recommandation": "Maintenir les investissements..."
    }
  ]
}`}
          </pre>
          <div className="mt-3 flex gap-3">
            <a href="/templates/exemple_scoring_operateur_complet.json" download className="flex items-center gap-1.5 text-[10px] text-primary hover:underline"><Download className="h-3 w-3" /> Modèle scoring complet</a>
            <a href="/templates/modele_scoring_operateur.json" download className="flex items-center gap-1.5 text-[10px] text-primary hover:underline"><Download className="h-3 w-3" /> Modèle simple</a>
          </div>
        </div>
      </div>
    );
  }

  // ─── XML IMPORT TAB (Rapport Réglementaire) ─────────────────────
  if (activeTab === 'xml') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('overview')} className="text-muted-foreground hover:text-foreground text-xs">&larr; Retour</button>
          <h2 className="text-xl font-bold text-foreground">Rapports Réglementaires</h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">XML</span>
        </div>

        <div className="bg-cyan-500/5 rounded-xl border border-cyan-500/20 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-cyan-400">Format réglementaire</h3>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Les rapports réglementaires sont soumis par les opérateurs en format XML conforme aux spécifications de l&apos;ARPT.
                Ce format contient les indicateurs de conformité avec comparaison aux seuils réglementaires, les mesures détaillées, et le taux de conformité global.
                L&apos;import XML extrait automatiquement les mesures et les stocke dans ARPT-QoS-Guinée.
              </p>
            </div>
          </div>
        </div>

        {/* XML Example */}
        <div className="bg-background rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-foreground">Exemple de rapport réglementaire XML</h3>
            <div className="flex gap-2">
              <button onClick={() => copyToClipboard(rapportReglementaireExample, 'xml')} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Copy className="h-3 w-3" /> {copied === 'xml' ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>
          <pre className="text-[10px] text-cyan-300 font-mono overflow-x-auto leading-relaxed max-h-80">
            {rapportReglementaireExample}
          </pre>
        </div>

        {/* Structure explanation */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-foreground mb-3">Structure du fichier XML</h3>
          <div className="space-y-2 text-[10px]">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
              <div><span className="text-cyan-300 font-mono">&lt;entete&gt;</span> <span className="text-muted-foreground">— Métadonnées du rapport (type, période, opérateur, région, responsable)</span></div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
              <div><span className="text-cyan-300 font-mono">&lt;donnees&gt;</span> <span className="text-muted-foreground">— Indicateurs de conformité avec seuils réglementaires et statut</span></div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
              <div><span className="text-cyan-300 font-mono">&lt;mesures&gt;</span> <span className="text-muted-foreground">— Mesures terrain détaillées avec coordonnées GPS et timestamps</span></div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
              <div><span className="text-cyan-300 font-mono">&lt;conformite&gt;</span> <span className="text-muted-foreground">— Bilan de conformité (taux, nombre d&apos;indicateurs conformes, observations)</span></div>
            </div>
          </div>
          <div className="mt-3">
            <a href="/templates/modele_rapport_reglementaire.xml" download className="flex items-center gap-1.5 text-[10px] text-primary hover:underline"><Download className="h-3 w-3" /> Télécharger le modèle XML</a>
          </div>
        </div>
      </div>
    );
  }

  // ─── MANUAL MEASUREMENT TAB ───────────────────────────────────
  if (activeTab === 'manual') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('overview')} className="text-muted-foreground hover:text-foreground text-xs">&larr; Retour</button>
          <h2 className="text-xl font-bold text-foreground">Saisie Manuelle</h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20">Mesure QoS</span>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          {/* Required Fields */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold text-primary mb-3">Informations requises</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Opérateur *</label>
                <select value={manualForm.operateurId} onChange={(e) => setManualForm(p => ({ ...p, operateurId: e.target.value }))} className={selectClass} required>
                  <option value="">Sélectionner...</option>
                  {operators.map(op => <option key={op.id} value={op.id}>{op.nom}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Région *</label>
                <select value={manualForm.regionId} onChange={(e) => setManualForm(p => ({ ...p, regionId: e.target.value }))} className={selectClass} required>
                  <option value="">Sélectionner...</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Campagne</label>
                <select value={manualForm.campagneId} onChange={(e) => setManualForm(p => ({ ...p, campagneId: e.target.value }))} className={selectClass}>
                  <option value="">Auto-création</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Latitude *</label>
                <input type="number" step="any" value={manualForm.latitude} onChange={(e) => setManualForm(p => ({ ...p, latitude: e.target.value }))} className={inputClass} placeholder="10.0666" required />
              </div>
              <div>
                <label className={labelClass}>Longitude *</label>
                <input type="number" step="any" value={manualForm.longitude} onChange={(e) => setManualForm(p => ({ ...p, longitude: e.target.value }))} className={inputClass} placeholder="-12.8569" required />
              </div>
              <div>
                <label className={labelClass}>Type Mesure *</label>
                <select value={manualForm.typeMesure} onChange={(e) => setManualForm(p => ({ ...p, typeMesure: e.target.value }))} className={selectClass} required>
                  <option value="MOBILE">Mobile (RF + Appels)</option>
                  <option value="INTERNET">Internet (Débit + QoE)</option>
                </select>
              </div>
            </div>
          </div>

          {/* RF Signal Metrics */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-2"><Smartphone className="h-3.5 w-3.5" /> Métriques Signal RF (Mobile)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><label className={labelClass}>RSSI (dBm)</label><input type="number" step="any" value={manualForm.rssi} onChange={(e) => setManualForm(p => ({ ...p, rssi: e.target.value }))} className={inputClass} placeholder="-50 à -100" /></div>
              <div><label className={labelClass}>RSRP (dBm)</label><input type="number" step="any" value={manualForm.rsrp} onChange={(e) => setManualForm(p => ({ ...p, rsrp: e.target.value }))} className={inputClass} placeholder="-80 à -120" /></div>
              <div><label className={labelClass}>RSRQ (dB)</label><input type="number" step="any" value={manualForm.rsrq} onChange={(e) => setManualForm(p => ({ ...p, rsrq: e.target.value }))} className={inputClass} placeholder="-3 à -20" /></div>
              <div><label className={labelClass}>SINR (dB)</label><input type="number" step="any" value={manualForm.sinr} onChange={(e) => setManualForm(p => ({ ...p, sinr: e.target.value }))} className={inputClass} placeholder="0 à 20+" /></div>
              <div><label className={labelClass}>Débit descendant (Mbps)</label><input type="number" step="any" value={manualForm.debitDescendant} onChange={(e) => setManualForm(p => ({ ...p, debitDescendant: e.target.value }))} className={inputClass} placeholder="0.5 à 50+" /></div>
              <div><label className={labelClass}>Débit montant (Mbps)</label><input type="number" step="any" value={manualForm.debitMontant} onChange={(e) => setManualForm(p => ({ ...p, debitMontant: e.target.value }))} className={inputClass} placeholder="0.5 à 25+" /></div>
              <div><label className={labelClass}>Latence (ms)</label><input type="number" step="any" value={manualForm.latence} onChange={(e) => setManualForm(p => ({ ...p, latence: e.target.value }))} className={inputClass} placeholder="20 à 200+" /></div>
              <div><label className={labelClass}>Gigue (ms)</label><input type="number" step="any" value={manualForm.gigue} onChange={(e) => setManualForm(p => ({ ...p, gigue: e.target.value }))} className={inputClass} placeholder="1 à 30+" /></div>
              <div><label className={labelClass}>Taux appel réussi (%)</label><input type="number" step="any" value={manualForm.tauxAppelReussi} onChange={(e) => setManualForm(p => ({ ...p, tauxAppelReussi: e.target.value }))} className={inputClass} placeholder="90 à 100" /></div>
              <div><label className={labelClass}>Taux drop call (%)</label><input type="number" step="any" value={manualForm.tauxDropCall} onChange={(e) => setManualForm(p => ({ ...p, tauxDropCall: e.target.value }))} className={inputClass} placeholder="0 à 10" /></div>
            </div>
          </div>

          {/* Internet QoS Metrics */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h3 className="text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-2"><Wifi className="h-3.5 w-3.5" /> Métriques QoS Internet</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><label className={labelClass}>Débit download (Mbps)</label><input type="number" step="any" value={manualForm.debitDownload} onChange={(e) => setManualForm(p => ({ ...p, debitDownload: e.target.value }))} className={inputClass} placeholder="2 à 50+" /></div>
              <div><label className={labelClass}>Débit upload (Mbps)</label><input type="number" step="any" value={manualForm.debitUpload} onChange={(e) => setManualForm(p => ({ ...p, debitUpload: e.target.value }))} className={inputClass} placeholder="1 à 25+" /></div>
              <div><label className={labelClass}>Ping (ms)</label><input type="number" step="any" value={manualForm.ping} onChange={(e) => setManualForm(p => ({ ...p, ping: e.target.value }))} className={inputClass} placeholder="15 à 200+" /></div>
              <div><label className={labelClass}>Temps DNS (ms)</label><input type="number" step="any" value={manualForm.dnsLookupTime} onChange={(e) => setManualForm(p => ({ ...p, dnsLookupTime: e.target.value }))} className={inputClass} placeholder="5 à 100+" /></div>
              <div><label className={labelClass}>Temps TCP (ms)</label><input type="number" step="any" value={manualForm.tcpConnectTime} onChange={(e) => setManualForm(p => ({ ...p, tcpConnectTime: e.target.value }))} className={inputClass} placeholder="20 à 200+" /></div>
              <div><label className={labelClass}>Score QoE (/100)</label><input type="number" step="any" value={manualForm.scoreQoE} onChange={(e) => setManualForm(p => ({ ...p, scoreQoE: e.target.value }))} className={inputClass} placeholder="0 à 100" /></div>
              <div><label className={labelClass}>Chargement page (s)</label><input type="number" step="any" value={manualForm.pageLoadTime} onChange={(e) => setManualForm(p => ({ ...p, pageLoadTime: e.target.value }))} className={inputClass} placeholder="1 à 15+" /></div>
              <div><label className={labelClass}>Buffering vidéo (s)</label><input type="number" step="any" value={manualForm.videoBuffering} onChange={(e) => setManualForm(p => ({ ...p, videoBuffering: e.target.value }))} className={inputClass} placeholder="0 à 10+" /></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A843] text-[#0A0F1E] text-xs font-semibold hover:bg-[#D4A843]/90 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Enregistrer la mesure
            </button>
          </div>
        </form>
        {renderImportResult()}
      </div>
    );
  }

  // ─── CAMPAIGN CREATION TAB ────────────────────────────────────
  if (activeTab === 'campaign') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('overview')} className="text-muted-foreground hover:text-foreground text-xs">&larr; Retour</button>
          <h2 className="text-xl font-bold text-foreground">Créer une Campagne</h2>
        </div>

        <form onSubmit={handleCampaignSubmit} className="space-y-4">
          <div className="bg-background rounded-xl border border-border p-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Nom *</label><input type="text" value={campaignForm.nom} onChange={(e) => setCampaignForm(p => ({ ...p, nom: e.target.value }))} className={inputClass} placeholder="Drive Test Conakry Q2 2026" required /></div>
              <div><label className={labelClass}>Type *</label>
                <select value={campaignForm.type} onChange={(e) => setCampaignForm(p => ({ ...p, type: e.target.value }))} className={selectClass} required>
                  <option value="DRIVE_TEST">Drive Test (véhicule)</option>
                  <option value="WALK_TEST">Walk Test (piéton)</option>
                  <option value="QOS_INTERNET">QoS Internet (sonde)</option>
                  <option value="QOS_MOBILE">QoS Mobile (appels)</option>
                </select>
              </div>
              <div><label className={labelClass}>Opérateur *</label>
                <select value={campaignForm.operateurId} onChange={(e) => setCampaignForm(p => ({ ...p, operateurId: e.target.value }))} className={selectClass} required>
                  <option value="">Sélectionner...</option>
                  {operators.map(op => <option key={op.id} value={op.id}>{op.nom}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Région *</label>
                <select value={campaignForm.regionId} onChange={(e) => setCampaignForm(p => ({ ...p, regionId: e.target.value }))} className={selectClass} required>
                  <option value="">Sélectionner...</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Date début *</label><input type="date" value={campaignForm.dateDebut} onChange={(e) => setCampaignForm(p => ({ ...p, dateDebut: e.target.value }))} className={inputClass} required /></div>
              <div><label className={labelClass}>Date fin</label><input type="date" value={campaignForm.dateFin} onChange={(e) => setCampaignForm(p => ({ ...p, dateFin: e.target.value }))} className={inputClass} /></div>
              <div className="col-span-2"><label className={labelClass}>Responsable</label><input type="text" value={campaignForm.responsable} onChange={(e) => setCampaignForm(p => ({ ...p, responsable: e.target.value }))} className={inputClass} placeholder="Nom de l'ingénieur responsable" /></div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A843] text-[#0A0F1E] text-xs font-semibold hover:bg-[#D4A843]/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Créer la campagne
          </button>
        </form>
        {renderImportResult()}
      </div>
    );
  }

  // ─── ALERT CREATION TAB ──────────────────────────────────────
  if (activeTab === 'alert') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('overview')} className="text-muted-foreground hover:text-foreground text-xs">&larr; Retour</button>
          <h2 className="text-xl font-bold text-foreground">Créer une Alerte</h2>
          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">Alerte</span>
        </div>

        <form onSubmit={handleAlertSubmit} className="space-y-4">
          <div className="bg-background rounded-xl border border-border p-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Type *</label>
                <select value={alertForm.type} onChange={(e) => setAlertForm(p => ({ ...p, type: e.target.value }))} className={selectClass} required>
                  <option value="DEGRADATION">Dégradation signal</option>
                  <option value="SEUIL_DEPASSE">Seuil dépassé</option>
                  <option value="NON_CONFORMITE">Non-conformité</option>
                  <option value="ZONE_BLANCHE">Zone blanche</option>
                </select>
              </div>
              <div><label className={labelClass}>Sévérité *</label>
                <select value={alertForm.severity} onChange={(e) => setAlertForm(p => ({ ...p, severity: e.target.value }))} className={selectClass} required>
                  <option value="CRITIQUE">CRITIQUE</option>
                  <option value="HAUTE">HAUTE</option>
                  <option value="MOYENNE">MOYENNE</option>
                  <option value="BASSE">BASSE</option>
                </select>
              </div>
              <div><label className={labelClass}>Opérateur</label>
                <select value={alertForm.operateurId} onChange={(e) => setAlertForm(p => ({ ...p, operateurId: e.target.value }))} className={selectClass}>
                  <option value="">Tous les opérateurs</option>
                  {operators.map(op => <option key={op.id} value={op.id}>{op.nom}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Région</label>
                <select value={alertForm.regionId} onChange={(e) => setAlertForm(p => ({ ...p, regionId: e.target.value }))} className={selectClass}>
                  <option value="">Toutes les régions</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className={labelClass}>Message *</label><textarea value={alertForm.message} onChange={(e) => setAlertForm(p => ({ ...p, message: e.target.value }))} className={inputClass + " h-20 resize-none"} placeholder="RSRP inférieur à -110 dBm sur 40% des mesures à Conakry..." required /></div>
              <div className="col-span-2"><label className={labelClass}>Détails (optionnel)</label><textarea value={alertForm.details} onChange={(e) => setAlertForm(p => ({ ...p, details: e.target.value }))} className={inputClass + " h-16 resize-none"} placeholder='{"seuil": -110, "valeur": -115, "pourcentage": 40, "zone": "Kaloum, Dixinn"}' /></div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/80 text-white text-xs font-semibold hover:bg-red-500 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />} Créer l&apos;alerte
          </button>
        </form>
        {renderImportResult()}
      </div>
    );
  }

  return null;
}
