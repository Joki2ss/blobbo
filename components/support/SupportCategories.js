export const SUPPORT_CATEGORIES = ["Security", "Technical", "Payment"];
export const SUPPORT_SEVERITIES = ["INFO", "WARN", "HIGH", "CRITICAL"];

export function scopeForCategory(category) {
  if (category === "Security") return "SECURITY_LOGS";
  if (category === "Payment") return "PAYMENT_LOGS";
  return "TECH_LOGS";
}
