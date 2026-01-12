import { pickLocale, t } from "../i18n/strings";

export function getUserFirstName(user) {
  if (!user) return "";
  if (user.firstName) return String(user.firstName).trim();

  const full = String(user.fullName || "").trim();
  if (!full) return "";
  return full.split(/\s+/)[0] || "";
}

export function getUserDisplayName(user) {
  if (!user) return "";
  const dn = String(user.displayName || "").trim();
  if (dn) return dn;
  const fn = getUserFirstName(user);
  if (fn) return fn;
  return String(user.fullName || "").trim();
}

export function formatGreeting({ user, locale }) {
  const loc = pickLocale(locale);
  const name = getUserDisplayName(user) || "";
  const title = String(user?.professionalTitle || "").trim();

  if (title && name) {
    return t("greeting.professional", { title, name }, loc);
  }
  if (name) {
    return t("greeting.casual", { name }, loc);
  }
  return "";
}
