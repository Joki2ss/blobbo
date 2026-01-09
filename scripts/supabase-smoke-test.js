// CommonJS wrapper for the ESM smoke test.
// Allows running: node scripts/supabase-smoke-test.js
(async () => {
  await import("./supabase-smoke-test.mjs");
})();
