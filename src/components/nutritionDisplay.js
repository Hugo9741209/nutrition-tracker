// Helpers d'AFFICHAGE frontend (domaine front, cf. CONTRAT_AGENTS.md §1).
// Aucun calcul "source de vérité" ici : seulement du formatage et des repères
// visuels. Les vraies cibles g/kg sont calculées par le backend (nutrition.js).

// Convertit une quantité de macro (g) en g/kg de poids corporel, pour affichage.
export function perKg(grams, weight_kg) {
  if (!grams || !weight_kg) return 0
  return Math.round((grams / weight_kg) * 100) / 100 // 2 décimales
}

// Teste si une valeur g/kg tombe dans une fourchette repère (affichage couleur).
export function inRange(value, { min, max }) {
  return value >= min && value <= max
}

// Repères visuels « zone endurance » (annotations d'affichage, pas des cibles).
// Sources : besoins protéiques endurance 1,5–1,7 g/kg ; glucides ACSM jour
// d'entraînement 6–10 g/kg. Ce sont des bandes de référence affichées à côté
// de la cible calculée par le backend.
export const PROTEIN_ENDURANCE_RANGE = { min: 1.5, max: 1.7 }
export const CARBS_TRAIN_RANGE = { min: 6, max: 10 }
export const CARBS_REST_RANGE = { min: 5, max: 7 }
