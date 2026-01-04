import { PLAN_TYPES, VISIBILITY_STATUS } from "./FeedPlans";
import { loadPosts, savePosts } from "./FeedStore";

export async function ensureSeedPosts() {
  const posts = await loadPosts();
  if (posts.length > 0) return;

  const now = Date.now();
  const seed = [
    {
      postId: "fp_seed_1",
      ownerUserId: "u_business_seed",
      ownerBusinessName: "Studio Rossi",
      ownerCategory: "lawyer",
      title: "Consulenza legale rapida",
      description: "<p>Prima call gratuita di 15 minuti. Contratti, recupero crediti, privacy.</p>",
      keywords: ["contratti", "privacy", "recupero crediti"],
      images: [],
      createdAt: now - 1000 * 60 * 60 * 5,
      expiresAt: null,
      isPermanent: true,
      planType: PLAN_TYPES.ENTRY,
      visibilityStatus: VISIBILITY_STATUS.ACTIVE,
      rankingScore: 120,
      location: { city: "Milano", region: "Lombardia" },
    },
    {
      postId: "fp_seed_2",
      ownerUserId: "u_business_seed2",
      ownerBusinessName: "Falegnameria Bianchi",
      ownerCategory: "artisan",
      title: "Mobili su misura",
      description: "<p>Preventivo veloce, sopralluogo su richiesta. Cucine, armadi, arredo ufficio.</p>",
      keywords: ["mobili", "cucine", "su misura"],
      images: [],
      createdAt: now - 1000 * 60 * 60 * 26,
      expiresAt: null,
      isPermanent: false,
      planType: PLAN_TYPES.BASIC,
      visibilityStatus: VISIBILITY_STATUS.ACTIVE,
      rankingScore: 210,
      location: { city: "Torino", region: "Piemonte" },
    },
  ];

  await savePosts(seed);
}
