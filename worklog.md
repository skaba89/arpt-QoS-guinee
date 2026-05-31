---
Task ID: 1
Agent: Main
Task: Connecter le composant DataImport dans la navigation sidebar + Créer les fichiers de données trimestrielles

Work Log:
- Découvert que le composant DataImport existait déjà (~750 lignes) mais n'était pas connecté à la navigation
- Ajouté l'onglet "Import Données" dans la section DONNÉES du sidebar
- Ajouté le type 'import' au TabId dans page.tsx et onit-layout.tsx
- Ajouté l'icône Upload dans le iconMap
- Ajouté DataImport dans dashboardComponents
- Corrigé le build : exclu scripts/ du tsconfig, ajouté NEXTAUTH_SECRET au .env
- Créé le générateur de données Python avec formules réalistes (saisons, régions, opérateurs)
- Généré les fichiers CSV/JSON par trimestre (Q1-Q4 2025) pour 4 opérateurs
- Corrigé les formules de scoring pour des valeurs réalistes (ORANGE ~85, INTERCEL ~46)
- Créé le script import-api.sh pour l'import via API
- Testé l'import CSV et JSON via API : les deux fonctionnent (172 mesures, 4 scores importés)
- Nettoyé les données de test de la base (base vide prête pour l'import de l'utilisateur)

Stage Summary:
- DataImport est maintenant accessible dans le sidebar sous "DONNÉES → Import Données"
- Base de données vide (seulement 4 opérateurs et 16 régions de référence)
- 42 fichiers de données générés dans /download/donnees-operateurs/
- Total: 3704 mesures + 16 scores + 50 alertes pour l'année 2025
