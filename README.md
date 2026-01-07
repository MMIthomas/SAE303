# SAE303 - Visualisation de données CSP

Dashboard de visualisation des résultats de la compétition de solveurs CSP (Constraint Satisfaction Problem) 2022.
Pour la SAE303 de MMI2

## 👥 Équipe

- Thomas Seyroles

## 🚀 Installation

### Prérequis

- Node.js (version 16 ou supérieure)
- npm (gestionnaire de paquets)

### Installation des dépendances

```bash
npm install
```

## 💻 Lancement du projet

### Mode développement

Pour lancer le serveur de développement avec rechargement automatique :

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:5173/` (ou un autre port si 5173 est occupé).

### Build de production

Pour créer une version optimisée pour la production :

```bash
npm run build
```

### Prévisualiser le build

Pour tester la version de production localement :

```bash
npm run start
```

ou

```bash
npm run preview
```

## 📊 Visualisations proposées

Le dashboard propose **6 visualisations** réparties en 3 onglets :

### Vue d'ensemble

- **Répartition des résultats** : Graphique en donut montrant la distribution SAT/UNSAT/UNKNOWN
- **Taux de résolution par solveur** : Barres horizontales empilées comparant les performances

### Performance

- **Temps moyen de résolution** : Graphique en barres verticales comparant les solveurs
- **Performance par famille** : Radar chart montrant les performances sur différents types de problèmes

### Analyse avancée

- **Complexité vs Temps** : Scatter plot interactif avec échelles logarithmiques
- **Heatmap Solveur × Famille** : Heatmap croisant solveurs et familles de problèmes

Toutes les visualisations sont **animées** et **interactives** avec des tooltips détaillés au survol.

## 🛠️ Technologies utilisées

- **Vite** : Build tool rapide
- **Chart.js** : Graphiques classiques (barres, donut, radar)
- **D3.js** : Visualisations avancées (scatter plot, heatmap)
- **Material Dashboard** : Framework UI pour le design

## 🎨 Design

Le dashboard utilise une palette de couleurs personnalisée définie dans `src/css/variables.css` :

- Primaire : `#452829` (marron foncé)
- Secondaire : `#57595B` (gris)
- Accent : `#E8D1C5` (beige rosé)
- Background : `#F3E8DF` (beige clair)

Police : **Outfit** (Google Fonts)

## 🐛 Problèmes rencontrés et solutions

### 1. Structure des données JSON

**Problème** : Les données exportées depuis phpMyAdmin avaient une structure imbriquée avec des métadonnées.

**Solution** : Création d'une fonction `getValidResults()` qui extrait les données du bon objet (`type: "table"`).

### 2. Animations Chart.js

**Problème** : Les animations par défaut ne correspondaient pas à l'orientation des graphiques.

**Solution** : Configuration personnalisée avec `animation.y.from` et délais échelonnés pour un effet fluide.

### 3. Conflits de polices

**Problème** : La police Outfit écrasait les icônes Material Icons.

**Solution** : Ajout d'une exception CSS spécifique pour la classe `.material-icons` avec `!important`.

### 4. Tooltips D3.js

**Problème** : Les tooltips n'apparaissaient pas ou étaient cachés derrière d'autres éléments.

**Solution** : Ajout de `z-index: 9999`, `pointer-events: none` et styles inline complets.

### 5. Taille des graphiques

**Problème** : Certains graphiques étaient trop petits pour afficher toutes les données lisiblement.

**Solution** : Utilisation de `maintainAspectRatio: false` et hauteurs fixes en CSS.

## 📸 Captures d'écran

![Aperçu du Dashboard](/public/readme-content.png)

### Vue d'ensemble

### Onglet Performance

### Analyse avancée

## 📁 Structure du projet

```
SAE303-code/
├── src/
│   ├── css/
│   │   ├── variables.css    # Variables de couleurs
│   │   ├── reset.css         # Reset CSS
│   │   └── style.css         # Styles principaux
│   ├── data/
│   │   └── results.json      # Données de la compétition
│   └── main.js               # Code principal (graphiques)
├── index.html
├── package.json
└── README.md
```

## 📝 Notes

- Les données contiennent **10 solveurs** différents testés sur plusieurs familles de problèmes
- Le scatter plot affiche jusqu'à **500 points** pour des raisons de performance
- La heatmap se limite aux **8 premières familles** pour la lisibilité
