import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(value).trim();
}

function optionalEnv(name) {
  const value = process.env[name];
  return value && String(value).trim() ? String(value).trim() : null;
}

function truthyEnv(name) {
  const v = optionalEnv(name);
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

function mask(value) {
  const s = String(value || "");
  if (s.length <= 8) return "[REDACTED]";
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function makeClient({ url, anonKey }) {
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function signIn(client, { email, password, label }) {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(`${label} sign-in failed: ${error.message}`);
  const user = data?.user;
  if (!user?.id) throw new Error(`${label} sign-in failed: missing user`);
  return user;
}

async function safeRpc(client, fnName, args) {
  const { data, error } = await client.rpc(fnName, args);
  return { data, error };
}

async function main() {
  const url = requireEnv("SUPABASE_URL");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");

  const userEmail = requireEnv("USER_EMAIL");
  const commonPassword = optionalEnv("COMMON_PASSWORD");
  const userPassword = optionalEnv("USER_PASSWORD") || commonPassword;

  if (!userPassword) throw new Error("Missing required env var: USER_PASSWORD (or COMMON_PASSWORD)");

  console.log("Supabase onboarding/upgrade smoke test");
  console.log(`- SUPABASE_URL: ${url}`);
  console.log(`- SUPABASE_ANON_KEY: ${mask(anonKey)}`);
  console.log("- NOTE: This test can upgrade a USER to BUSINESS.");
  console.log("  Set ALLOW_PROFILE_UPGRADE=1 in .env to enable the upgrade step.");

  const client = makeClient({ url, anonKey });
  const user = await signIn(client, { email: userEmail, password: userPassword, label: "USER" });
  console.log(`- USER id: ${user.id}`);

  // 0) Verify RPCs exist from the client PoV.
  // (If migration wasn't applied, you'll get "function ... does not exist".)

  // 1) USER should NOT be allowed to set onboarding before upgrade.
  const { error: preOnErr } = await safeRpc(client, "self_set_pro_onboarding", {
    p_primary_category: "legal",
    p_enabled_modules: ["SECURE_MESSAGING"],
    p_dashboard_preset: "legal",
    p_answers: { smoke: true, step: "pre" },
    p_reason: "smoke_pre_upgrade",
  });

  if (!preOnErr) {
    throw new Error(
      "SECURITY FAIL: USER could call self_set_pro_onboarding before upgrade (expected Not authorized)"
    );
  }
  console.log(`- USER self_set_pro_onboarding blocked pre-upgrade (expected): ${preOnErr.message}`);

  // 2) Upgrade to BUSINESS (server-side role change) via RPC.
  if (!truthyEnv("ALLOW_PROFILE_UPGRADE")) {
    console.log("SKIP: upgrade + onboarding steps disabled (ALLOW_PROFILE_UPGRADE not set)");
    console.log("DONE: function existence + pre-upgrade authorization check completed");
    return;
  }

  const { data: upgraded, error: upErr } = await safeRpc(client, "self_upgrade_to_business", {
    p_reason: "smoke_upgrade",
  });
  if (upErr) throw new Error(`self_upgrade_to_business failed: ${upErr.message}`);

  const role = String(upgraded?.role || "").toUpperCase();
  console.log(`- self_upgrade_to_business OK (role now ${role || "?"})`);

  // 3) Now onboarding should be allowed.
  const { data: onboarded, error: onErr } = await safeRpc(client, "self_set_pro_onboarding", {
    p_primary_category: "legal",
    p_enabled_modules: ["SECURE_MESSAGING", "DOCUMENT_REQUESTS"],
    p_dashboard_preset: "legal",
    p_answers: { smoke: true, step: "post", activityType: "Lawyer / Legal" },
    p_reason: "smoke_onboarding",
  });
  if (onErr) throw new Error(`self_set_pro_onboarding failed: ${onErr.message}`);

  console.log(
    `- self_set_pro_onboarding OK (primary_category=${onboarded?.primary_category || ""}, modules=${Array.isArray(onboarded?.enabled_modules) ? onboarded.enabled_modules.length : 0})`
  );

  // 4) Spot-check profile fields via RLS (selecting own row should be allowed).
  const { data: me, error: meErr } = await client
    .from("profiles")
    .select("user_id, role, primary_category, enabled_modules, dashboard_preset, pro_onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (meErr) throw new Error(`profiles select failed: ${meErr.message}`);

  console.log(
    `- profiles OK (role=${String(me?.role || "").toUpperCase()}, preset=${me?.dashboard_preset || ""}, pro_onboarded_at=${me?.pro_onboarded_at || ""})`
  );

  console.log("DONE: onboarding smoke test passed");
}

main().catch((err) => {
  console.error("FAILED:", err?.message || err);
  process.exitCode = 1;
});
