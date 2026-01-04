// Developer-only configuration.
// NOTE: In a JS bundle this is not a true security boundary.

export const DEV_EMAIL_ALLOWLIST = ["contact-smi@proton.me"]; // temporary, removable later

// SHA-256("dev-2468")
export const DEV_CODE_HASH_SHA256 = "7c3ad6e287016e1d60d134380820d6a81504c08061f6c1d8766f8fd9a0fb277c";

export const DEV_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
