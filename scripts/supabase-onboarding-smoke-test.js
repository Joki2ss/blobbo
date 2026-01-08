// CommonJS wrapper for the ESM onboarding smoke test.
// Allows running: node scripts/supabase-onboarding-smoke-test.js
(async () => {
  await import("./supabase-onboarding-smoke-test.mjs");
})();
