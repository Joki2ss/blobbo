// Utility for tenant isolation (stub, ready for backend integration)
export function getTenantId(user) {
  // Assumes user object has tenant_id property from backend
  return user?.tenant_id || null;
}
