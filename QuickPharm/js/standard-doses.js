// Fixed-text dosing rules for calculationType === "standard".
// Ported directly from the original QuickPharm (Flutter) switch-case logic.
// Keyed by exact drug `name` as it appears in drugs-data.js.
// Each function receives { ageInYears, weightKg } and returns a result string,
// or null if this drug has no ported rule yet (falls back to the drug's note).

export const STANDARD_RULES = {
  "ACETAMINOPHEN / GUAIFENESIN / PHENYLEPHRINE": ({ ageInYears }) => {
    if (ageInYears > 5) return "5 ml هر 8 ساعت مصرف گردد";
    return "بهتر است مصرف نگردد";
  },

  "ACETAMINOPHEN / DIPHENHYDRAMINE / PHENYLEPHRINE": ({ ageInYears }) => {
    if (ageInYears > 5) return "5 ml هر 8 ساعت مصرف گردد";
    return "بهتر است مصرف نگردد";
  },

  "ACETAMINOPHEN / CHLORPHENIRAMINE / DEXTROMETHORPHAN / PHENYLEPHRINE": ({ ageInYears }) => {
    if (ageInYears < 6) return "بهتر است مصرف نگردد";
    return "5 ml هر 8 ساعت مصرف گردد";
  },

  "COLD PREPARATIONS": ({ ageInYears }) => {
    if (ageInYears >= 2 && ageInYears < 4) return "2.5 cc هر 8 یا 6 ساعت مصرف گردد";
    if (ageInYears >= 4 && ageInYears <= 12) return "5 cc هر 8 یا 6 ساعت مصرف گردد";
    return "بهتر است با پزشک مشورت گردد";
  },

  "LOPERAMIDE HYDROCHLORIDE": ({ ageInYears }) => {
    if (ageInYears >= 2 && ageInYears <= 5)
      return "در اولین دفع، 5 cc مصرف شود. حداکثر تا 15 cc در روز میتوان مصرف کرد. سپس بعد از هر دفعه، مجدد هم 5 cc مصرف کند.";
    if (ageInYears >= 6 && ageInYears <= 8)
      return "10 cc مصرف شود. حداکثر تا 20 cc در روز میتوان مصرف کرد. سپس بعد از هر دفعه، مجدد هم 5 cc مصرف کند.";
    if (ageInYears >= 9 && ageInYears <= 11)
      return "10 cc مصرف شود. حداکثر تا 30 cc در روز میتوان مصرف کرد. سپس بعد از هر دفعه، مجدد هم 5 cc مصرف کند.";
    if (ageInYears > 11)
      return "20 cc مصرف شود. حداکثر تا 40 cc در روز میتوان مصرف کرد. سپس بعد از هر دفعه، مجدد هم 5 cc مصرف کند.";
    return "باید با پزشک مشورت کند";
  },

  "LORATADINE": ({ ageInYears }) => {
    if (ageInYears >= 2 && ageInYears < 6) return "1 cc از شربت به صورت یک بار در روز مصرف گردد.";
    if (ageInYears >= 6) return "2 cc از شربت به صورت دو بار در روز مصرف گردد.";
    return "باید با پزشک مشورت کند";
  },

  "MAGNESIUM HYDROXIDE": ({ ageInYears }) => {
    if (ageInYears >= 12)
      return "5 الی 15 cc از شربت به صورت 4 بار در روز (هر 6 ساعت) مصرف شود. حداکثر 60 cc در طی روز مصرف گردد.";
    return "باید با پزشک مشورت کند";
  },

  "OMEPRAZOLE (kidizole)": ({ weightKg }) => {
    if (weightKg > 5 && weightKg < 10) return "2.5 cc به صورت یک بار در روز برای GERD و یا مشکلات اسید مصرف گردد";
    if (weightKg >= 10 && weightKg < 20) return "5 cc به صورت یک بار در روز برای GERD و یا مشکلات اسید مصرف گردد";
    if (weightKg >= 20) return "10 cc به صورت یک بار در روز برای GERD و یا مشکلات اسید مصرف گردد";
    return "باید با پزشک مشورت کند";
  },

  "ORS": ({ ageInYears }) => {
    if (ageInYears >= 5)
      return "50 تا 100 میلی‌لیتر از محلول او-آر-اس به ازای هر کیلوگرم وزن بدن کودک در طول 4 ساعت اول خورانده می‌شود.";
    return "باید با پزشک مشورت کند";
  },

  "CETIRIZINE HYDROCHLORIDE": ({ ageInYears }) => {
    if (ageInYears >= 0.5 && ageInYears < 2) return "5 تا 10 cc به صورت روزانه مصرف گردد";
    if (ageInYears >= 2 && ageInYears <= 5)
      return "2.5 cc به صورت یک بار در روز مصرف گردد. میتوان میزان را تا 2.5 cc هر 12 ساعت یا 5 cc یک بار در روز هم افزایش داد.";
    if (ageInYears >= 6) return "5 تا 10 cc به صورت روزانه مصرف گردد";
    return "باید با پزشک مشورت کند";
  },

  "PEDIATRIC GRIPPE": ({ ageInYears }) => {
    if (ageInYears > 2 && ageInYears <= 5) return "3 الی 5 cc هر 8 ساعت";
    if (ageInYears >= 6 && ageInYears < 12) return "هر 8 ساعت 5 الی 8 cc مصرف گردد.";
    return "از سایر دارو ها استفاده شود";
  },

  "VITAMIN D3": ({ ageInYears }) => {
    if (ageInYears >= 0 && ageInYears <= 2) return "روزی 1 الی 2 cc از قطره آ+د مصرف شود.";
    return "باید با پزشک مشورت کند و ترجیحا از سایر فرمولاسیون ها استفاده گردد.";
  },

  "Calcium": ({ ageInYears }) => {
    if (ageInYears >= 1 && ageInYears <= 3) return "700 میلی گرم به صورت روزانه مصرف گردد";
    if (ageInYears >= 4 && ageInYears <= 8) return "1000 میلی گرم به صورت روزانه مصرف گردد";
    if (ageInYears >= 9 && ageInYears < 18) return "1300 میلی گرم به صورت روزانه مصرف گردد";
    return "باید با پزشک مشورت کند";
  },

  "GUAIFENESIN": ({ ageInYears }) => {
    if (ageInYears >= 0.5 && ageInYears < 2)
      return "20 الی 25 میلی گرم به صورت هر 6 ساعت مصرف گردد. حداکثر مقدار مجاز 300 میلی گرم در روز.";
    if (ageInYears >= 2 && ageInYears <= 5)
      return "50 الی 100 میلی گرم به صورت هر 6 ساعت مصرف گردد. حداکثر مقدار مجاز 600 میلی گرم در روز.";
    if (ageInYears >= 6 && ageInYears <= 11)
      return "100 الی 200 میلی گرم به صورت هر 6 ساعت مصرف گردد. حداکثر مقدار مجاز 1200 میلی گرم در روز.";
    return "از سایر فرمولاسیون ها استفاده گردد.";
  },

  "CODEINE PHOSPHATE / GUAIFENESIN": ({ ageInYears }) => {
    if (ageInYears >= 6 && ageInYears <= 11)
      return "هر 4 ساعت 5 cc از شربت مصرف گردد. \nحداکثر 30 cc در طی یک روز میتوان مصرف کرد.";
    if (ageInYears > 11)
      return "هر 4 ساعت 10 cc از شربت مصرف گردد. \nحداکثر 60 cc در طی یک روز میتوان مصرف کرد.";
    return "زیر 6 سال منع مصرف دارد.";
  },

  "DESLORATADINE": ({ ageInYears }) => {
    if (ageInYears >= 0.5 && ageInYears < 1) return "روزانه 1 mg معادل 2 cc از شربت مصرف گردد";
    if (ageInYears >= 1 && ageInYears <= 5) return "روزانه 1.25 mg معادل 2.5 cc از شربت مصرف گردد";
    if (ageInYears >= 6 && ageInYears <= 11) return "روزانه 2.5 mg معادل 5 cc از شربت مصرف گردد";
    if (ageInYears >= 12) return "روزانه 5 mg معادل 10 cc از شربت مصرف گردد";
    return "باید با پزشک مشورت کند";
  },

  "DEXTROMETHORPHAN / GUAIFENESIN / PHENYLEPHRINE": ({ ageInYears }) => {
    if (ageInYears >= 4 && ageInYears < 6)
      return "5 cc از شربت هر 4 تا 6 ساعت مصرف گردد. \nحداکثر مقدار مجاز 30 cc در طی یک روز میباشد.";
    if (ageInYears >= 6 && ageInYears < 12)
      return "10 cc از شربت هر 4 تا 6 ساعت مصرف گردد. \nحداکثر مقدار مجاز 60 cc در طی یک روز میباشد.";
    return "بهتر است از قرص استفاده گردد با دوزینگ بزرگسال";
  },

  "DEXTROMETHORPHAN HYDROBROMIDE": ({ ageInYears }) => {
    if (ageInYears >= 0.2 && ageInYears < 0.4)
      return "هر 8 ساعت، 0.5 الی 1 میلی گرم معادل 0.25 cc (5 الی 10 قطره) مصرف گردد.";
    if (ageInYears >= 0.4 && ageInYears < 0.5)
      return "هر 8 ساعت، 1 الی 2 میلی گرم معادل 0.5 cc (10 الی 15 قطره) مصرف گردد.";
    if (ageInYears >= 0.5 && ageInYears <= 1)
      return "هر 8 ساعت، 2 الی 4 میلی گرم معادل 1 cc (15 الی 20 قطره) مصرف گردد.";
    if (ageInYears >= 2 && ageInYears <= 6)
      return "هر 8 ساعت، 2.5 الی 7.5 میلی گرم معادل 1.5 cc (25 الی 40 قطره) مصرف گردد.";
    if (ageInYears > 6) return "از سایر فرمولاسیون ها استفاده گردد";
    return "باید با پزشک مشورت کند";
  },

  "DIPHENHYDRAMINE ": ({ ageInYears }) => {
    if (ageInYears >= 2 && ageInYears < 6)
      return "هر 4 ساعت 6.25 mg معادل 2.5 cc از شربت استفاده گردد. \nحداکثر مقدار مجاز 37.5 mg در روز میباشد.";
    if (ageInYears >= 6 && ageInYears < 12)
      return "هر 4 ساعت 12.5 mg معادل 5 cc از شربت استفاده گردد. \nحداکثر مقدار مجاز 75 mg در روز میباشد.";
    if (ageInYears >= 12)
      return "هر 4 ساعت 25 mg معادل 10 cc از شربت استفاده گردد. \nحداکثر مقدار مجاز 150 mg در روز میباشد.";
    return "زیر 2 سال منع مصرف دارد.";
  },

  "DIPHENHYDRAMINE / AMMONIUM CHLORIDE": ({ ageInYears }) => {
    if (ageInYears >= 2 && ageInYears < 6)
      return "هر 4 ساعت 6.25 mg معادل 2.5 cc از شربت استفاده گردد. \nحداکثر مقدار مجاز 37.5 mg در روز میباشد.";
    if (ageInYears >= 6 && ageInYears < 12)
      return "هر 4 ساعت 12.5 mg معادل 5 cc از شربت استفاده گردد. \nحداکثر مقدار مجاز 75 mg در روز میباشد.";
    if (ageInYears >= 12)
      return "هر 4 ساعت 25 mg معادل 10 cc از شربت استفاده گردد. \nحداکثر مقدار مجاز 150 mg در روز میباشد.";
    return "زیر 2 سال منع مصرف دارد.";
  },

  "EXPECTORANT CODEINE": ({ ageInYears }) => {
    if (ageInYears < 12) return "منع مصرف در سن زیر 12 سال";
    return null;
  },

  "EXPECTORANT": ({ ageInYears }) => {
    if (ageInYears > 2) return "5 cc هر 8 الی 6 ساعت مصرف گردد.";
    return "زیر 2 سال منع مصرف دارد.";
  },

  "DEXTROMETHORPHAN / GUAIFENESIN": ({ ageInYears }) => {
    if (ageInYears >= 6 && ageInYears < 12) return "5 cc از شربت هر 4 ساعت در صورت نیاز مصرف گردد";
    return "بهتر است در این سن مصرف نگردد و با پزشک مشورت گردد";
  },

  "PSEUDOEPHEDRINE HYDROCHLORIDE": ({ ageInYears }) => {
    if (ageInYears > 3 && ageInYears <= 5)
      return "2.5cc هر 4 الی 6 ساعت مصرف گردد. حداکثر میتوان 10cc در طی یک روز مصرف گردد.";
    if (ageInYears >= 6 && ageInYears <= 12)
      return "5cc هر 4 الی 6 ساعت مصرف گردد. حداکثر میتوان 20 cc در طی یک روز مصرف گردد.";
    return "باید با پزشک مشورت کند";
  },

  "SIMETHICONE (DIMETHICONE ACTIVATED)": ({ ageInYears }) => {
    if (ageInYears <= 2) return "0.5cc هر 6 ساعت مصرف گردد برای درمان نفخ نوزاد";
    return "1cc هر 6 ساعت مصرف گردد برای نفخ کودک";
  },
};

export function getStandardDose(drugName, ctx) {
  const rule = STANDARD_RULES[drugName];
  if (!rule) return null;
  return rule(ctx);
}
