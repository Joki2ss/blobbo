export type ProTemplateResult = {
  primaryCategory: string;
  enabledModules: string[];
  dashboardLayoutPreset: string;
  suggestedNextActions: string[];
};

export const PRO_TEMPLATES: Record<string, ProTemplateResult> = {
  "RESTAURANT / CAFÉ": {
    primaryCategory: "restaurant",
    enabledModules: ["FEED_POSTING", "MENU_MEDIA", "BOOKING_REQUESTS"],
    dashboardLayoutPreset: "restaurant",
    suggestedNextActions: ["Create your first promotion post"],
  },
  "LAWYER / LEGAL": {
    primaryCategory: "legal",
    enabledModules: ["SECURE_MESSAGING", "DOCUMENT_REQUESTS", "APPOINTMENTS"],
    dashboardLayoutPreset: "legal",
    suggestedNextActions: ["Create client intake form"],
  },
  "ACCOUNTANT / TAX": {
    primaryCategory: "accounting",
    enabledModules: ["SECURE_MESSAGING", "DOCUMENT_REQUESTS", "APPOINTMENTS"],
    dashboardLayoutPreset: "accounting",
    suggestedNextActions: ["Create document request checklist"],
  },
  "MEDICAL / HEALTH": {
    primaryCategory: "health",
    enabledModules: ["SECURE_MESSAGING", "APPOINTMENTS"],
    dashboardLayoutPreset: "health",
    suggestedNextActions: ["Enable appointment requests"],
  },
  "CONSULTANT / COACH": {
    primaryCategory: "consulting",
    enabledModules: ["SECURE_MESSAGING", "APPOINTMENTS", "FEED_POSTING"],
    dashboardLayoutPreset: "consulting",
    suggestedNextActions: ["Create your availability"],
  },
  "ARTISAN / LOCAL BUSINESS": {
    primaryCategory: "local_business",
    enabledModules: ["FEED_POSTING", "SECURE_MESSAGING"],
    dashboardLayoutPreset: "local_business",
    suggestedNextActions: ["Create your first update"],
  },
  "IT / DIGITAL SERVICES": {
    primaryCategory: "digital",
    enabledModules: ["SECURE_MESSAGING", "DOCUMENT_REQUESTS", "FEED_POSTING"],
    dashboardLayoutPreset: "digital",
    suggestedNextActions: ["Add a service overview post"],
  },
  OTHER: {
    primaryCategory: "other",
    enabledModules: ["FEED_POSTING", "SECURE_MESSAGING"],
    dashboardLayoutPreset: "default",
    suggestedNextActions: ["Create your first post"],
  },
};
