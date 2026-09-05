// Line-art illustrations keyed by preparation form, matching the app's
// existing icon language. Used as a stand-in wherever a formulation has no
// `image` path set (see compounds-data.js).

const JAR = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 14 h20 v4 h-20 z"/><path d="M15 18 h18 l1.5 22 a3 3 0 0 1 -3 3.2 h-15 a3 3 0 0 1 -3 -3.2 z"/><line x1="12" y1="12" x2="36" y2="12"/></svg>`;

const PASTE_JAR = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 15 h26 v5 h-26 z"/><path d="M12.5 20 h23 l-1.7 19 a3 3 0 0 1 -3 2.7 h-13.6 a3 3 0 0 1 -3 -2.7 z"/><line x1="16" y1="27" x2="32" y2="27" class="tick"/><line x1="16" y1="33" x2="32" y2="33" class="tick"/></svg>`;

const LOTION_BOTTLE = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="19" y="5" width="10" height="6" rx="1.5"/><path d="M17 11 h14 l2 8 v22 a3 3 0 0 1 -3 3 h-12 a3 3 0 0 1 -3 -3 v-22 z"/><path d="M15 26 q9 -4 18 0 v4 q-9 -4 -18 0 z" class="wave"/></svg>`;

const DROPPER_BOTTLE = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M20 4 h8 v10 l-2 3 h-4 l-2 -3 z"/><path d="M18 17 h12 l1.5 5 v18 a3 3 0 0 1 -3 3 h-9 a3 3 0 0 1 -3 -3 v-18 z"/><line x1="17" y1="30" x2="31" y2="30" class="tick"/></svg>`;

export function getFormIcon(form) {
  if (!form) return LOTION_BOTTLE;
  if (form.startsWith("خمیر")) return PASTE_JAR;
  if (form.startsWith("پماد") || form.startsWith("کرم")) return JAR;
  if (form.includes("محلول") || form.includes("کلودیون")) return DROPPER_BOTTLE;
  return LOTION_BOTTLE;
}
