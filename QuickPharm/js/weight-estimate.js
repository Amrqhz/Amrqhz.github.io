// Estimates a "typical healthy child" weight from age when the actual
// weight isn't known. Based on the updated APLS (Luscombe & Owens, 2007)
// formulas derived from UK-WHO growth charts — the standard taught
// bedside estimate, not a substitute for a measured weight.
//
//   < 12 months:  kg = (age in months × 0.5) + 4
//   1–5 years:    kg = (age in years × 2) + 8
//   6–12 years:   kg = (age in years × 3) + 7
//   > 12 years:   not reliable — return null (ask for actual weight)

export function estimateWeightKg(ageInYears) {
  if (ageInYears == null || !Number.isFinite(ageInYears) || ageInYears < 0) return null;

  const months = ageInYears * 12;
  let kg;
  if (months < 12) {
    kg = 0.5 * months + 4;
  } else if (ageInYears <= 5) {
    kg = 2 * ageInYears + 8;
  } else if (ageInYears <= 12) {
    kg = 3 * ageInYears + 7;
  } else {
    return null;
  }
  return Math.round(kg * 10) / 10;
}
