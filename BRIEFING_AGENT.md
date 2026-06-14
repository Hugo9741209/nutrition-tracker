# BRIEFING PROJET — NutriTrack

> Document de contexte à fournir à tout nouvel agent code travaillant sur ce projet.
> Lis-le entièrement avant toute action. Il contient tout le nécessaire pour être opérationnel immédiatement.

---

## 1. RÉSUMÉ DU PROJET

**NutriTrack** est une application web de suivi nutritionnel pour sportif.
- **Utilisateur** : Hugo, 20 ans, sport ~5x/semaine, objectif perte/prise de poids contrôlée.
- **But** : tracker repas, calories, macros, poids ; visualiser l'évolution ; objectifs personnalisables.
- **Contraintes** : simple d'utilisation, saisie rapide, graphiques clairs, évolutif.
- **Statut** : ✅ EN PRODUCTION, déployé et fonctionnel.

---

## 2. STACK TECHNIQUE

| Élément        | Choix                                              |
|----------------|----------------------------------------------------|
| Frontend       | React 18 + Vite 5                                  |
| Styling        | Tailwind CSS 3                                     |
| Routing        | react-router-dom 6                                 |
| Graphiques     | Recharts 2                                         |
| Icônes         | lucide-react                                       |
| Backend / DB   | Supabase (PostgreSQL + Auth, hébergé cloud)        |
| API aliments   | OpenFoodFacts (gratuite, publique, 2M+ produits)   |
| Hébergement    | Vercel (gratuit, plan Hobby)                       |
| Versioning     | GitHub                                             |

**Langue de l'interface ET du code/commentaires : français.**

---

## 3. INFOS DE DÉPLOIEMENT (CRITIQUE)

- **URL prod** : https://nutritrack-pro-app.vercel.app
- **Repo GitHub** : https://github.com/Hugo9741209/nutrition-tracker (branche `main`)
- **Projet Supabase** : `nutrition-tracker` — URL : `https://ondyeclrvkopxvqblklv.supabase.co`
- **Compte GitHub** : Hugo9741209
- **Dossier local** : `C:\Users\hugos\nutrition-tracker`
- **OS** : Windows 11, terminal PowerShell, Node.js v24 LTS, npm.

### Workflow de déploiement (AUTO)
Tout `git push` sur `main` → Vercel redéploie automatiquement en ~1 min.
```
git add .
git commit -m "description"
git push
```

### Variables d'environnement
Définies à 2 endroits (NE JAMAIS COMMITTER `.env`) :
- **En local** : fichier `.env` à la racine
- **Sur Vercel** : Settings → Environment Variables

```
VITE_SUPABASE_URL=https://ondyeclrvkopxvqblklv.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon Supabase>
```
> La clé anon réelle est dans le `.env` local et sur Vercel. Ne pas la mettre dans ce doc ni dans le repo.

---

## 4. STRUCTURE DU CODE

```
nutrition-tracker/
├── .env                  # clés Supabase (gitignored, NE PAS committer)
├── .gitignore            # ignore node_modules, .env, dist
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── supabase/
│   └── schema.sql        # schéma complet de la BDD (déjà exécuté sur Supabase)
└── src/
    ├── main.jsx          # point d'entrée React
    ├── App.jsx           # routing + gestion session auth Supabase
    ├── index.css         # Tailwind + classes utilitaires (.card, .btn-primary, .input, .label...)
    ├── lib/
    │   ├── supabase.js   # client Supabase initialisé
    │   └── nutrition.js  # calculs BMR/TDEE/macros + helpers dates + labels FR
    ├── hooks/
    │   ├── useProfile.js     # CRUD profil utilisateur
    │   ├── useFoodLogs.js     # CRUD repas du jour + useFoodHistory (14j) pour graphes
    │   └── useWeightLogs.js   # CRUD poids + calcul diff
    ├── components/
    │   ├── Layout.jsx
    │   ├── Navbar.jsx          # sidebar desktop + barre du bas mobile
    │   ├── Dashboard/
    │   │   ├── CalorieBar.jsx  # barre de progression calories
    │   │   └── MacroRings.jsx  # anneaux protéines/glucides/lipides
    │   └── FoodLog/
    │       ├── FoodSearch.jsx  # modale recherche OpenFoodFacts + saisie manuelle
    │       └── MealSection.jsx # section par repas (petit-déj/déj/dîner/collation)
    └── pages/
        ├── Auth.jsx          # connexion / inscription
        ├── Dashboard.jsx     # vue d'ensemble + graphiques
        ├── FoodLog.jsx       # journal alimentaire par jour
        ├── WeightTracker.jsx # courbe de poids 14/30/90j
        └── Profile.jsx       # config profil + calcul auto objectifs
```

---

## 5. BASE DE DONNÉES (Supabase / PostgreSQL)

Schéma complet dans `supabase/schema.sql` (déjà appliqué en prod). 3 tables, toutes protégées par **Row Level Security** (chaque user ne voit que ses données).

### `profiles` (1 ligne par user, créée auto à l'inscription via trigger)
`id` (UUID, =auth.users.id), `name`, `age`, `gender`, `height_cm`, `current_weight_kg`, `target_weight_kg`, `activity_level`, `goal`, `target_calories`, `target_protein_g`, `target_carbs_g`, `target_fat_g`, timestamps.

### `food_logs`
`id`, `user_id`, `food_name`, `brand`, `quantity_g`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `meal_type` (breakfast/lunch/dinner/snack), `logged_date`, `created_at`.

### `weight_logs`
`id`, `user_id`, `weight_kg`, `logged_date` (UNIQUE par user+date), `note`, `created_at`.

> Pour modifier la BDD : éditer `schema.sql` PUIS exécuter le SQL dans Supabase → SQL Editor. Les migrations ne sont pas automatiques.

---

## 6. LOGIQUE MÉTIER NUTRITION (`src/lib/nutrition.js`)

- **BMR** : formule Mifflin-St Jeor.
- **TDEE** : BMR × multiplicateur d'activité (`very_active`=1.725 pour Hugo, 5-6 séances/sem).
- **Objectif calorique** : perte = TDEE×0.8 ; prise muscle = TDEE×1.1 ; maintien = TDEE.
- **Macros** : ratios selon objectif, avec garde-fou **protéines min = 1.8g/kg de poids** (sportif).
- Le bouton "Calculer auto" dans Profile.jsx remplit calories + macros à partir du profil.

---

## 7. CONVENTIONS À RESPECTER

1. **Tout en français** : UI, labels, commentaires, messages.
2. **Style Tailwind** via classes utilitaires définies dans `index.css` (`.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`). Réutiliser, ne pas réinventer.
3. **Thème sombre** : fond `slate-950/900`, accent vert (`green-500`). Macros : protéines=bleu, glucides=orange, lipides=violet.
4. **Architecture modulaire** : 1 fonctionnalité = 1 fichier (hook + composant + page). Ne pas tout entasser.
5. **Responsive** : sidebar desktop / barre du bas mobile (déjà géré dans Navbar.jsx).
6. **Accès données** : toujours via les hooks existants (`useProfile`, `useFoodLogs`, `useWeightLogs`), pas d'appel Supabase direct dans les composants UI.
7. **Sécurité** : ne jamais committer `.env` ni exposer la clé Supabase dans le repo. RLS doit rester actif sur toute nouvelle table.

---

## 8. ÉTAT ACTUEL — FONCTIONNALITÉS LIVRÉES

- ✅ Auth (inscription/connexion email + confirmation mail Supabase)
- ✅ Profil + calcul auto BMR/TDEE/macros
- ✅ Journal alimentaire par jour (4 types de repas)
- ✅ Recherche aliments OpenFoodFacts + saisie manuelle
- ✅ Suivi calories + macros (barre + anneaux)
- ✅ Dashboard avec graphique calories 14 jours
- ✅ Suivi du poids avec courbe 14/30/90j
- ✅ Objectifs personnalisables
- ✅ Déployé sur Vercel, accessible mobile/desktop

---

## 9. IDÉES D'ÉVOLUTION (backlog non commencé)

- 📷 Scan code-barres (OpenFoodFacts supporte la recherche par code-barres)
- 💧 Suivi hydratation
- 😴 Suivi sommeil
- 🍽️ Repas favoris / templates de repas récurrents
- 📊 Bilan hebdomadaire automatique
- 🏋️ Suivi des séances de sport / dépense calorique
- Export CSV des données
- Domaine personnalisé

---

## 10. COMMANDES UTILES

```powershell
# Lancer en local (dev)
cd C:\Users\hugos\nutrition-tracker
npm run dev            # → http://localhost:5173

# Déployer (push auto vers Vercel)
git add .
git commit -m "message"
git push

# Installer une nouvelle dépendance
npm install <package>
```

---

## 11. POUR L'AGENT : COMMENT TRAVAILLER

1. Lis ce briefing + le fichier concerné par la demande avant d'éditer.
2. Respecte les conventions section 7.
3. Pour une nouvelle fonctionnalité : crée hook + composant/page dédiés, ajoute le lien dans `Navbar.jsx` si c'est une page, ajoute la table/colonne SQL dans `schema.sql` si besoin de persistance (et rappelle à Hugo d'exécuter le SQL sur Supabase).
4. Teste mentalement le flux complet (saisie → BDD → affichage → graphe).
5. Pour livrer : `git add . && git commit -m "..." && git push` → Vercel déploie seul.
6. L'utilisateur (Hugo) est débutant en code : explique simplement, donne les étapes concrètes (où cliquer, quoi taper), et préviens si une action manuelle de sa part est requise (ex: exécuter du SQL sur Supabase, ajouter une variable d'env sur Vercel).
