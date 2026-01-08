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
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`${label} sign-in failed: ${error.message}`);
  }
  const user = data?.user;
  if (!user?.id) throw new Error(`${label} sign-in failed: missing user`);
  return user;
}

async function main() {
  const url = requireEnv("SUPABASE_URL");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");

  const devEmail = requireEnv("DEV_EMAIL");
  const commonPassword = optionalEnv("COMMON_PASSWORD");
  const devPassword = optionalEnv("DEV_PASSWORD") || commonPassword;

  const userEmail = requireEnv("USER_EMAIL");
  const userPassword = optionalEnv("USER_PASSWORD") || commonPassword;

  if (!devPassword) throw new Error("Missing required env var: DEV_PASSWORD (or COMMON_PASSWORD)");
  if (!userPassword) throw new Error("Missing required env var: USER_PASSWORD (or COMMON_PASSWORD)");

  console.log("Supabase smoke test");
  console.log(`- SUPABASE_URL: ${url}`);
  console.log(`- SUPABASE_ANON_KEY: ${mask(anonKey)}`);

  // 1) Normal user creates a post
  const userClient = makeClient({ url, anonKey });
  const normalUser = await signIn(userClient, { email: userEmail, password: userPassword, label: "USER" });
  console.log(`- USER id: ${normalUser.id}`);

  const insertPayload = {
    owner_user_id: normalUser.id,
    plan_type: "BASIC",
    is_permanent: false,
    title: `Smoke test post ${new Date().toISOString()}`,
    description: "Test post created by scripts/supabase-smoke-test.mjs",
    keywords: ["smoke", "test"],
    images: [],
    ranking_score: 0,
    visibility_status: "ACTIVE",
    pinned_rank: null,
    moderation_tags: [],
    last_moderated_by_user_id: null,
    last_moderated_at: null,
    author_role: "USER",
  };

  const { data: createdPost, error: createErr } = await userClient
    .from("feed_posts")
    .insert(insertPayload)
    .select("post_id, owner_user_id, visibility_status, pinned_rank")
    .single();

  if (createErr) {
    throw new Error(
      `USER insert into feed_posts failed: ${createErr.message}\n` +
        "If this is a brand-new user, ensure the profiles trigger ran and the user has a row in public.profiles."
    );
  }

  const postId = createdPost?.post_id;
  if (!postId) throw new Error("Insert succeeded but missing post_id");
  console.log(`- Created post_id: ${postId}`);

  // 2) Normal user must NOT be able to call dev RPC
  const { error: userRpcErr } = await userClient.rpc("dev_update_post", {
    p_post_id: postId,
    p_pinned_rank: 10,
    p_moderation_tags: ["#test"],
    p_reason: "smoke",
  });

  if (!userRpcErr) {
    throw new Error("SECURITY FAIL: normal user could call dev_update_post without error");
  }
  console.log(`- USER dev_update_post blocked (expected): ${userRpcErr.message}`);

  const { error: userReorderErr } = await userClient.rpc("dev_bulk_reorder_pins", {
    p_items: [{ post_id: postId, pinned_rank: 1 }],
    p_reason: "smoke",
  });

  if (!userReorderErr) {
    throw new Error("SECURITY FAIL: normal user could call dev_bulk_reorder_pins without error");
  }
  console.log(`- USER dev_bulk_reorder_pins blocked (expected): ${userReorderErr.message}`);

  // delete attempt via dev RPC semantics (update visibility to DELETED)
  const { error: userDeleteErr } = await userClient.rpc("dev_update_post", {
    p_post_id: postId,
    p_visibility_status: "DELETED",
    p_reason: "smoke",
  });
  if (!userDeleteErr) {
    throw new Error("SECURITY FAIL: normal user could delete via dev_update_post without error");
  }
  console.log(`- USER delete via dev_update_post blocked (expected): ${userDeleteErr.message}`);

  // 3) Developer CAN call dev RPC
  const devClient = makeClient({ url, anonKey });
  const devUser = await signIn(devClient, { email: devEmail, password: devPassword, label: "DEV" });
  console.log(`- DEV id: ${devUser.id}`);

  const { data: devUpdatedPost, error: devRpcErr } = await devClient.rpc("dev_update_post", {
    p_post_id: postId,
    p_pinned_rank: 10,
    p_moderation_tags: ["#test"],
    p_reason: "smoke",
  });

  if (devRpcErr) {
    throw new Error(`DEV dev_update_post failed: ${devRpcErr.message}`);
  }
  console.log(`- DEV dev_update_post OK (pinned_rank now ${devUpdatedPost?.pinned_rank ?? "?"})`);

  const { data: devReorderCount, error: devReorderErr } = await devClient.rpc("dev_bulk_reorder_pins", {
    p_items: [{ post_id: postId, pinned_rank: 1 }],
    p_reason: "smoke",
  });
  if (devReorderErr) {
    throw new Error(`DEV dev_bulk_reorder_pins failed: ${devReorderErr.message}`);
  }
  console.log(`- DEV dev_bulk_reorder_pins OK (updated ${devReorderCount ?? "?"})`);

  const { data: devDeleted, error: devDeleteErr } = await devClient.rpc("dev_update_post", {
    p_post_id: postId,
    p_visibility_status: "DELETED",
    p_reason: "smoke",
  });
  if (devDeleteErr) {
    throw new Error(`DEV delete via dev_update_post failed: ${devDeleteErr.message}`);
  }
  console.log(`- DEV delete via dev_update_post OK (visibility ${devDeleted?.visibility_status ?? "?"})`);

  // 4) Audit log readable by DEV, not by normal user
  const { data: devAuditRows, error: devAuditErr } = await devClient
    .from("audit_log")
    .select("audit_id, created_at, action_type, target_type, target_id")
    .order("created_at", { ascending: false })
    .limit(5);

  if (devAuditErr) throw new Error(`DEV audit_log select failed: ${devAuditErr.message}`);
  console.log(`- DEV audit_log rows visible: ${Array.isArray(devAuditRows) ? devAuditRows.length : 0}`);

  const { data: userAuditRows, error: userAuditErr } = await userClient
    .from("audit_log")
    .select("audit_id")
    .limit(1);

  // With RLS, this should be empty (not an error).
  if (userAuditErr) {
    console.log(`- USER audit_log select error (ok): ${userAuditErr.message}`);
  } else {
    console.log(`- USER audit_log rows visible (expected 0): ${Array.isArray(userAuditRows) ? userAuditRows.length : 0}`);
  }

  console.log("DONE: smoke test passed");
}

main().catch((err) => {
  console.error("FAILED:", err?.message || err);
  process.exitCode = 1;
});
