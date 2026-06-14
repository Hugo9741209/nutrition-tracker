// Tests des calculs et garde-fous nutrition (source de vérité backend).
// Lancer : npm test
import { describe, it, expect } from 'vitest'
import {
  calcBMR,
  calcBMRKatch,
  computeBMR,
  calcTDEE,
  tdeeFromProfile,
  calcBMI,
  calcTargetCalories,
  calcMacros,
  detectBlindSpot,
  checkGoalSafety,
  tdeeRange,
  SAFETY,
} from './nutrition.js'

describe('calcBMR (Mifflin-St Jeor)', () => {
  it('homme : 10·P + 6,25·T − 5·âge + 5', () => {
    // 80 kg, 180 cm, 20 ans, H = 1830
    expect(calcBMR({ weight_kg: 80, height_cm: 180, age: 20, gender: 'male' })).toBe(1830)
  })
  it('femme : même base − 161', () => {
    expect(calcBMR({ weight_kg: 80, height_cm: 180, age: 20, gender: 'female' })).toBe(1664)
  })
})

describe('calcBMRKatch (masse maigre)', () => {
  it('370 + 21,6 · masse maigre', () => {
    // 80 kg à 15% MG → 68 kg maigre → 370 + 21,6·68 = 1838,8
    expect(calcBMRKatch({ weight_kg: 80, body_fat_pct: 15 })).toBeCloseTo(1838.8, 1)
  })
})

describe('computeBMR : choix de méthode + incertitude', () => {
  it('utilise Katch-McArdle si % masse grasse fourni (marginPct 12)', () => {
    const r = computeBMR({ weight_kg: 80, height_cm: 180, age: 20, gender: 'male', body_fat_pct: 15 })
    expect(r.method).toBe('katch_mcardle')
    expect(r.marginPct).toBe(12)
  })
  it('utilise Mifflin sinon (marginPct 10)', () => {
    const r = computeBMR({ weight_kg: 80, height_cm: 180, age: 20, gender: 'male' })
    expect(r.method).toBe('mifflin_st_jeor')
    expect(r.marginPct).toBe(10)
  })
})

describe('calcTDEE', () => {
  it('BMR × multiplicateur very_active (1,725)', () => {
    expect(calcTDEE({ weight_kg: 80, height_cm: 180, age: 20, gender: 'male', activity_level: 'very_active' })).toBe(3157)
  })
  it('multiplicateur par défaut 1,55 si niveau inconnu', () => {
    expect(calcTDEE({ weight_kg: 80, height_cm: 180, age: 20, gender: 'male', activity_level: 'inconnu' })).toBe(Math.round(1830 * 1.55))
  })
})

describe('tdeeFromProfile : method-aware', () => {
  const base = { weight_kg: 80, height_cm: 180, age: 20, gender: 'male', activity_level: 'very_active' }
  it('sans % masse grasse → Mifflin (= calcTDEE)', () => {
    expect(tdeeFromProfile(base)).toBe(calcTDEE(base))
  })
  it('avec % masse grasse → Katch-McArdle (BMR différent de Mifflin)', () => {
    // Katch BMR ≈ 1838,8 × 1,725 ≈ 3172, vs Mifflin 1830 × 1,725 = 3157
    expect(tdeeFromProfile({ ...base, body_fat_pct: 15 })).toBe(3172)
  })
})

describe('calcBMI', () => {
  it('P / T² (en m)', () => {
    expect(calcBMI({ weight_kg: 80, height_cm: 180 })).toBeCloseTo(24.69, 2)
  })
})

describe('calcTargetCalories', () => {
  it('perte = TDEE × 0,8', () => expect(calcTargetCalories(3000, 'lose_weight')).toBe(2400))
  it('prise = TDEE × 1,1', () => expect(calcTargetCalories(3000, 'gain_muscle')).toBe(3300))
  it('maintien = TDEE', () => expect(calcTargetCalories(3000, 'maintain')).toBe(3000))
})

describe('calcMacros : plancher protéines 1,8 g/kg', () => {
  it('respecte le plancher quand le ratio % donnerait moins', () => {
    // 80 kg → plancher 144 g. Maintien à 2000 kcal × 0,25 / 4 = 125 g < 144.
    const m = calcMacros(2000, 'maintain', 80)
    expect(m.protein_g).toBe(144)
  })
})

describe('detectBlindSpot (angles morts Mifflin)', () => {
  it('IMC > 35 → high_bmi', () => {
    expect(detectBlindSpot({ age: 30, weight_kg: 130, height_cm: 175 })).toBe('high_bmi')
  })
  it('> 65 ans → over_65', () => {
    expect(detectBlindSpot({ age: 70, weight_kg: 70, height_cm: 175 })).toBe('over_65')
  })
  it('% masse grasse < 10 → very_muscular', () => {
    expect(detectBlindSpot({ age: 25, weight_kg: 80, height_cm: 180, body_fat_pct: 8 })).toBe('very_muscular')
  })
  it('profil normal → null', () => {
    expect(detectBlindSpot({ age: 25, weight_kg: 75, height_cm: 180 })).toBeNull()
  })
})

describe('checkGoalSafety : garde-fous (non contournables)', () => {
  it('refuse sous le plancher ANSES homme', () => {
    const r = checkGoalSafety({ tdee: 2000, targetCalories: 1400, gender: 'male', weight_kg: 80, protein_g: 150 })
    expect(r.ok).toBe(false)
    expect(r.violations.map((v) => v.code)).toContain('BELOW_ANSES_FLOOR')
  })
  it('refuse un déficit > 500 kcal/j', () => {
    const r = checkGoalSafety({ tdee: 3000, targetCalories: 2200, gender: 'male', weight_kg: 80, protein_g: 150 })
    expect(r.violations.map((v) => v.code)).toContain('DEFICIT_TOO_STEEP')
  })
  it('refuse un surplus > 300 kcal/j', () => {
    const r = checkGoalSafety({ tdee: 2500, targetCalories: 2900, gender: 'male', weight_kg: 80, protein_g: 150 })
    expect(r.violations.map((v) => v.code)).toContain('SURPLUS_TOO_LARGE')
  })
  it('refuse protéines sous le plancher RDA (0,83 g/kg)', () => {
    // 80 kg → plancher 66 g
    const r = checkGoalSafety({ tdee: 2500, targetCalories: 2200, gender: 'male', weight_kg: 80, protein_g: 50 })
    expect(r.violations.map((v) => v.code)).toContain('PROTEIN_BELOW_RDA')
  })
  it('accepte un objectif sain', () => {
    const r = checkGoalSafety({ tdee: 2500, targetCalories: 2100, gender: 'male', weight_kg: 80, protein_g: 150 })
    expect(r.ok).toBe(true)
    expect(r.violations).toHaveLength(0)
  })
})

describe('tdeeRange : honnêteté ±10%', () => {
  it('encadre le TDEE', () => {
    expect(tdeeRange(2000)).toEqual({ low: 1800, high: 2200 })
  })
})

describe('SAFETY : seuils sourcés', () => {
  it('valeurs ANSES / RDA attendues', () => {
    expect(SAFETY.minKcalMale).toBe(1500)
    expect(SAFETY.minKcalFemale).toBe(1200)
    expect(SAFETY.minProteinGPerKg).toBe(0.83)
    expect(SAFETY.maxDeficitKcal).toBe(500)
  })
})
