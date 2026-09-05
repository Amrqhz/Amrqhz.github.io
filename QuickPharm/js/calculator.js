import { getStandardDose } from "./standard-doses.js";

/**
 * Weight-based formula, applied consistently across every "weightBased" drug:
 *
 *   perDoseMg = min(weightKg × dosePerKg, maxDose)     // dosePerKg is read as mg/kg PER DOSE
 *   volumeMl  = perDoseMg / ds                          // ds = mg per mL of the formulation
 *   timesPerDay = 24 / frequency                        // frequency = hours between doses
 *
 * This mirrors the concentration/ds convention already in the database, but the
 * original Flutter app's exact weight-based formula wasn't available to port —
 * only the "standard" (fixed-text) switch-case was. If a different convention
 * was actually used (e.g. dosePerKg as a per-day figure divided across doses),
 * this is the one function to adjust — search for `computeWeightBased`.
 */
function computeWeightBased(params, weightKg) {
  const { dosePerKg, maxDose, frequency, ds } = params;
  const rawMg = weightKg * dosePerKg;
  const cappedAtMax = typeof maxDose === "number" && maxDose > 0 ? Math.min(rawMg, maxDose) : rawMg;
  const perDoseMg = cappedAtMax;
  const wasCapped = typeof maxDose === "number" && maxDose > 0 && rawMg > maxDose;
  const volumeMl = ds > 0 ? perDoseMg / ds : null;
  const timesPerDay = frequency > 0 ? 24 / frequency : null;
  const dailyMg = timesPerDay ? perDoseMg * timesPerDay : null;
  return { perDoseMg, volumeMl, frequency, timesPerDay, dailyMg, wasCapped, rawMg };
}

function mergeParams(base, override) {
  return { ...base, ...(override || {}) };
}

/**
 * Calculate a dosing result for a drug given the ageInYears (fractional, e.g.
 * 0.5 = 6 months), weightKg, and an optional selected indication.
 *
 * Returns a normalized result object the UI can render, or an object with
 * `blocked: true` + `reason` when the patient falls outside the drug's
 * defined age range.
 */
export function calculateDose(drug, { ageInYears, weightKg, indication }) {
  if (drug.calculationType === "standard") {
    const text = getStandardDose(drug.name, { ageInYears, weightKg });
    return {
      kind: "standard",
      text: text || drug.note || "برای این دارو دستور دوز ثبت‌شده‌ای وجود ندارد؛ با پزشک مشورت شود.",
      note: drug.note || "",
    };
  }

  if (drug.calculationType === "weightBased") {
    const base = drug.parameters || {};
    const specific =
      indication && drug.indicationSpecificParams ? drug.indicationSpecificParams[indication] : null;
    const params = mergeParams(base, specific);

    const minAge = params.minAge ?? base.minAge ?? 0;
    const maxAge = params.maxAge ?? base.maxAge ?? 120;
    if (ageInYears < minAge || ageInYears > maxAge) {
      return {
        kind: "blocked",
        reason: `این فرآورده برای بازه سنی ${formatAge(minAge)} تا ${formatAge(maxAge)} تعریف شده است.`,
      };
    }

    if (!params.dosePerKg || !params.ds) {
      return { kind: "blocked", reason: "پارامترهای محاسبه برای این دارو کامل نیست." };
    }

    const computed = computeWeightBased(params, weightKg);
    return {
      kind: "weightBased",
      ...computed,
      indicationNote: specific?.note || "",
      note: drug.note || "",
      params,
    };
  }

  return {
    kind: "unavailable",
    reason: drug.note
      ? "برای این فرآورده محاسبه‌گر وزنی تعریف نشده است."
      : "اطلاعات دوزینگ برای این فرآورده هنوز ثبت نشده است.",
    note: drug.note || "",
  };
}

export function formatAge(years) {
  if (years < 1) {
    const months = Math.round(years * 12);
    return `${months} ماهگی`;
  }
  return `${Number.isInteger(years) ? years : years.toFixed(1)} سالگی`;
}
