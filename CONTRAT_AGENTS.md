# CONTRAT AGENTS — Frontend / Backend (NutriTrack)

> Fichier de coordination entre les deux sessions Claude Code qui travaillent sur NutriTrack.
> But : zéro conflit de fichiers, zéro double calcul. À lire AVANT toute modification.
> Source : `AGENT_BACKEND_NUTRITRACK.md` §2 + `AGENT_FRONTEND_NUTRITRACK.md` §2.

---

## 0. Réalité technique (important)

Les deux scripts ont été écrits pour une stack **Next.js + API `/api/**` + Prisma/Redis**.
**Ce N'EST PAS la stack réelle.** L'app réelle, déployée et fonctionnelle, est :
**Vite + React (JSX, pas TS) + Supabase (DB/Auth/RLS) + OpenFoodFacts**, sans serveur API séparé.

→ On garde la stack réelle. On applique l'**esprit** des scripts (rigueur, honnêteté scientifique,
garde-fous), pas leur stack. Pas de migration Next.js.

La frontière `front/back` des scripts reste valable, simplement **remappée** sur les vrais fichiers.

---

## 1. Qui possède quoi (sur les VRAIS fichiers)

### 🟦 BACKEND (source de vérité — calculs, données, sécurité)
Propriétaire **exclusif** de :
- `src/lib/nutrition.js` — **TOUS** les calculs : BMR, TDEE, macros, cibles g/kg, incertitude, angles morts, garde-fous de sécurité, sources scientifiques.
- `src/lib/supabase.js` — client Supabase.
- `src/hooks/*` — `useProfile`, `useFoodLogs`, `useWeightLogs` (accès données + orchestration des calculs). C'est la couche « API » de cette app.
- `supabase/schema.sql` — schéma DB, RLS, triggers.
- Edge Functions Supabase (à venir) — validation de sécurité non contournable.
- Intégrations externes : OpenFoodFacts, CIQUAL (cache, fiabilité de source).

### 🟩 FRONTEND (rendu — lisible, actionnable, honnête)
Propriétaire **exclusif** de :
- `src/components/**` — tous les composants React.
- `src/pages/**` — toutes les pages.
- `src/App.jsx`, `src/main.jsx`, routing, layout, état UI.
- `src/index.css` + Tailwind + classes utilitaires (`.card`, `.btn-primary`, `.input`, `.label`).
- Graphiques (Recharts), animations, accessibilité.
- Formatage d'affichage (arrondis kcal/macros/g/kg), bandeaux (SafetyBanner), tooltips.
- Validation de formulaire **côté UX** (feedback immédiat), PAS la validation de sécurité.

---

## 2. Règle d'or (issue des deux scripts §2)

> **Le backend calcule, le frontend affiche.**
> Le front peut faire une *preview* live (ex. TDEE qui bouge pendant la saisie du profil),
> mais la valeur **officielle** et tout **flag de sécurité** viennent du backend (`nutrition.js` / hook / Edge Function).
> En cas de divergence, **le chiffre du backend fait foi**.

Conséquences concrètes :
- ❌ Le frontend n'écrit **jamais** dans `src/lib/nutrition.js` ni dans `src/hooks/*`.
- ❌ Le frontend ne **hardcode aucun seuil** de sécurité ni donnée nutritionnelle d'aliment.
- ✅ Le frontend **importe** les fonctions/constantes de `nutrition.js` (ex. `checkGoalSafety`, `BLIND_SPOT_LABELS`, `tdeeRange`) et se contente de les afficher.
- ✅ Si le frontend a besoin d'un nouveau calcul ou d'un nouveau champ → il le **demande au backend**, il ne le code pas lui-même.

---

## 3. Contrat partagé (à coordonner si ça change)

La forme des objets renvoyés par `nutrition.js` est le contrat entre nous.
Exemple — sortie du rapport TDEE (cf. backend) :
```js
{ bmr, tdee, range:{low,high}, method, marginPct, neatWarning,
  blindSpot, recalibrateSuggested, targetCalories, macros, safety:{ ok, violations } }
```
Si le backend modifie cette forme → il prévient le frontend (et ce fichier est mis à jour).
Si le frontend a besoin d'un champ en plus → il le demande au backend.

---

## 4. Aspect sportif — ARBITRAGE ACTÉ (Hugo, 2026-06-14)

- ✅ **Cadrage nutritionnel endurance autorisé** : protéines/glucides en g/kg, repères « zone endurance », toggle d'affichage des cibles. C'est de la nutrition.
- ❌ **Tracking d'entraînement INTERDIT dans NutriTrack** : pas de saisie de séances, pas de dépense calorique du sport. Ça reste sur l'app Coach Sportif.
- 🔗 Idée future : relier NutriTrack ↔ Coach (pont entre les deux apps).
- 📌 On adapte au fur et à mesure selon l'évolution réelle du site ; cet arbitrage reste la règle par défaut tant qu'Hugo ne le change pas.

---

## 5. Anti-conflit (procédure)

1. Une seule session édite un fichier donné à la fois.
2. Avant d'éditer un fichier « frontière », relire ce contrat.
3. Le backend ne touche pas aux composants/pages ; le frontend ne touche pas à `lib/`/`hooks/`/`schema.sql`.
4. Préférer les **Edit ciblés** aux réécritures complètes sur les fichiers partagés.
5. Commits préfixés : backend `feat(back): …`, frontend `feat(front): …`.
