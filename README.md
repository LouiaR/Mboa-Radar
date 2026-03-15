# Mboa-Radar

Mboa-Radar est une application web moderne de type radar communautaire et de signalement d'incidents, conçue pour aider les conducteurs à naviguer en toute sécurité. Elle permet aux utilisateurs de signaler et de visualiser en temps réel divers éléments sur la route (radars fixes/mobiles, contrôles de police, embouteillages, accidents, etc.).

## 🚀 Fonctionnalités Principales

- **Carte Interactive** : Visualisation en temps réel des signalements grâce à l'intégration de Leaflet.
- **Signalements Communautaires** : Ajout d'alertes (caméras, trafic, police) directement sur la carte.
- **Planification d'Itinéraires** : Fonctionnalité pour rechercher et planifier des trajets en toute sécurité.
- **Internationalisation (i18n)** : Support multilingue natif (Français et Anglais).
- **Mode Hors-ligne & Synchronisation** : Sauvegarde locale des signalements via **IndexedDB** (`idb`) pour une synchronisation réseau ultérieure.
- **Profil Utilisateur & Gamification** : Système de score et de niveaux basé sur l'interaction et les signalements.
- **Responsive Design** : Interface utilisateur parfaitement optimisée pour mobile et desktop avec **Tailwind CSS**.

## 🛠️ Stack Technique

- **Framework** : [Next.js](https://nextjs.org/) (App Router, Rendering hybride SSR/CSR)
- **Langage** : TypeScript
- **Style** : [Tailwind CSS v4](https://tailwindcss.com/) & Lucide React (Icônes)
- **Cartographie** : [React-Leaflet](https://react-leaflet.js.org/) (Chargé dynamiquement côté client)
- **Base de données Locale** : [idb](https://www.npmjs.com/package/idb) (IndexedDB wrapper)
- **Tests** : [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)

## 📂 Structure du Projet

L'application suit la structure Next.js App Router :

```
Mboa-Radar/
├── src/
│   ├── app/                # Routes et Pages Next.js
│   │   ├── (main)/         # Groupe principal (Map, Profil, Stats)
│   │   ├── alerts/         # Page de gestion des alertes
│   │   ├── auth/           # Page d'authentification
│   │   ├── plan/           # Page de planification de trajet
│   │   ├── report/         # Page de soumission de signalement
│   │   └── layout.tsx      # Layout global de l'application
│   ├── components/         # Composants React réutilisables (ex: Layout global)
│   ├── contexts/           # Contextes React (ex: LanguageContext)
│   ├── i18n/               # Fichiers de traductions (EN/FR)
│   ├── lib/                # Fonctions utilitaires et base de données (ex: db.ts)
│   └── __tests__/          # Fichiers de tests unitaires Jest
├── public/                 # Assets statiques protégés
├── jest.config.ts          # Configuration de Jest
├── next.config.ts          # Configuration Next.js
├── tailwind.config.ts      # Configuration Tailwind (intégrée au CSS global)
└── package.json            # Dépendances du projet (Yarn)
```

## 💻 Installation et Démarrage

Ce projet utilise **Yarn** comme gestionnaire de paquets. 

### 1. Prérequis

- Node.js (version 18+ recommandée)
- Yarn installé globalement (`npm install -g yarn`)

### 2. Installation des dépendances

```bash
yarn install
```

### 3. Démarrage en environnement de développement

```bash
yarn dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

### 4. Construction pour la production

Pour optimiser et construire le projet pour un environnement de production :

```bash
yarn build
yarn start
```

## 🧪 Tests Unitaires

Le projet inclut une configuration robuste pour les tests unitaires des composants React et du routing.

```bash
# Lancer les tests une fois
yarn test

# Lancer les tests en mode veille (watch)
yarn test:watch
```

## 🤝 Contribution

Si vous souhaitez contribuer à l'application :
1. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-super-feature`).
2. Assurez-vous que le code passe la compilation TypeScript et le linter (`yarn build` / `yarn lint`).
3. Vérifiez que tous les tests passent (`yarn test`).
4. Faire un _commit_ de vos changements et soumettre une Pull Request.

---
_Mboa-Radar - Roulez informé(e)._
