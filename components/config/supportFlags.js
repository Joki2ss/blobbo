// Central feature flags for Developer-Only Support & Observability.
// Safe defaults:
// - In LIVE (backendMode !== "MOCK"), support features are disabled unless explicitly enabled.
// - In MOCK, enabled for testing.

export const CONTACTS_SYNC_ENABLED = false;
export const PAYMENT_LOGGING_ENABLED = false;
// Feature defaults:
// - MOCK: enabled (for immediate testing)
// - LIVE: disabled by default, but can be enabled by flipping these constants.
export const SUPPORT_TICKETS_ENABLED = false;
export const DOCUMENT_EDITOR_ENABLED = false;
export const PUBLIC_FEED_ENABLED = false;
export const ADVANCED_MESSAGING_ENABLED = false;

export function getSupportRuntimeConfig({ backendMode }) {
  const isMock = backendMode === "MOCK";

  return {
    BACKEND_MODE: isMock ? "MOCK" : "LIVE",

    // Support system master switch.
    // Default: true in MOCK, false in LIVE.
    SUPPORT_ENABLED: isMock,

    // Developer-only dashboards/logging pipeline toggle.
    // Still requires allowlisted email + dev code session.
    DEVELOPER_MODE: isMock,

    // Entry points
    LONG_PRESS_ENABLED: isMock,

    CONTACTS_SYNC_ENABLED,
    PAYMENT_LOGGING_ENABLED,
    SUPPORT_TICKETS_ENABLED: isMock ? true : SUPPORT_TICKETS_ENABLED,
    DOCUMENT_EDITOR_ENABLED: isMock ? true : DOCUMENT_EDITOR_ENABLED,
    PUBLIC_FEED_ENABLED: isMock ? true : PUBLIC_FEED_ENABLED,
    ADVANCED_MESSAGING_ENABLED: isMock ? true : ADVANCED_MESSAGING_ENABLED,
  };
}
