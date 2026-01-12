import { Platform } from "react-native";

export const HUB_DOMAIN = "sm-css.com";
export const PRODUCT_NAME = "BusinessCafé";

export const BUSINESSCAFE_DESCRIPTION_KEY = "hub.businessCafe.description";

// Placeholder-only local image references.
// DO NOT require() or fetch; these filenames may not exist yet.
// "LASCIA VUOTO SPAZIO IO MODIFICO NEL COPILOT POI"
export const BUSINESSCAFE_PLACEHOLDER_IMAGES = {
  mobile: "src/assets/businesscafe/cafetteria1_mob.png",
  tablet: "src/assets/businesscafe/cafetteria1_tab.png",
  desktop: "src/assets/businesscafe/cafetteria1_pc.png",
};

export function selectBusinessCafePlaceholderImageKey({ width }) {
  const w = typeof width === "number" ? width : 0;

  // Simple responsive heuristic:
  // - web/desktop: >= 900
  // - tablet: >= 768
  // - mobile: else
  if (Platform.OS === "web" && w >= 900) return "desktop";
  if (w >= 768) return "tablet";
  return "mobile";
}
