// Configurable ad plans (constants; do not hardcode values in logic).

export const PLAN_TYPES = {
  WELCOME: "WELCOME",
  ENTRY: "ENTRY",
  BASIC: "BASIC",
  PRO: "PRO",
};

export const VISIBILITY_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  DELETED: "DELETED",
  EXPIRED: "EXPIRED",
};

// Higher = higher priority.
export const PLAN_PRIORITY = {
  [PLAN_TYPES.WELCOME]: 4,
  [PLAN_TYPES.PRO]: 3,
  [PLAN_TYPES.BASIC]: 2,
  [PLAN_TYPES.ENTRY]: 1,
};

export const PLAN_PRICING_EUR = {
  [PLAN_TYPES.BASIC]: 5,
  [PLAN_TYPES.PRO]: 50,
};

export const PLAN_LIMITS = {
  // Developer-controlled global welcome pack.
  WELCOME_MAX_TOTAL_POSTS: 3,

  // Per owner.
  ENTRY_MAX_PERMANENT_POSTS: 1,

  // Per owner/time window.
  BASIC_MAX_POSTS_PER_MONTH: 2,
  PRO_MAX_POSTS_PER_WEEK: 2,

  // Media limits.
  MAX_IMAGES_PER_POST: 3,
};

export const PLAN_DEFAULTS = {
  // BASIC ads expire after 30 days.
  BASIC_EXPIRY_DAYS: 30,
};
