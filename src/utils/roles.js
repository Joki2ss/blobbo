// Role helpers.
// This app historically used ADMIN/CLIENT.
// The support/document specs refer to: admin|business|staff|customer.

export function isAdminOrBusiness(role) {
  const r = String(role || "").toUpperCase();
  return r === "ADMIN" || r === "BUSINESS";
}

export function isCustomerOrStaff(role) {
  const r = String(role || "").toUpperCase();
  // In CLOUD/Supabase the default role is USER; treat it as Customer for the public app experience.
  return r === "USER" || r === "CLIENT" || r === "CUSTOMER" || r === "STAFF";
}

export function toSupportRole(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN") return "admin";
  if (r === "BUSINESS") return "business";
  if (r === "STAFF") return "staff";
  if (r === "CUSTOMER" || r === "CLIENT") return "customer";
  return r ? r.toLowerCase() : "customer";
}
