function redactString(s) {
  const str = String(s || "");
  // Very conservative redaction: hide anything that looks like a token.
  return str
    .replace(/(eyJ[a-zA-Z0-9_\-]+=*\.[a-zA-Z0-9_\-]+=*\.[a-zA-Z0-9_\-]+=*)/g, "[REDACTED_JWT]")
    .replace(/(sbp_[a-zA-Z0-9_\-]{10,})/g, "[REDACTED_SUPABASE]")
    .replace(/(sk_[a-zA-Z0-9]{10,})/g, "[REDACTED_KEY]");
}

export function safeLog(...args) {
  try {
    // eslint-disable-next-line no-console
    console.log(
      ...args.map((a) => {
        if (typeof a === "string") return redactString(a);
        if (a && typeof a === "object") return a;
        return a;
      })
    );
  } catch (_) {
    // no-op
  }
}

export function safeError(...args) {
  try {
    // eslint-disable-next-line no-console
    console.error(...args.map((a) => (typeof a === "string" ? redactString(a) : a)));
  } catch (_) {
    // no-op
  }
}
