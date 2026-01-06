import { getFeatureFlags } from "../config/featureFlags";

function assertEnabled({ backendMode }) {
  const flags = getFeatureFlags({ backendMode });
  if (!flags.ENABLE_RATINGS) throw new Error("Ratings are disabled");
}

export async function getRatingAggregate({ backendMode, backendRatings, businessId }) {
  assertEnabled({ backendMode });
  return backendRatings.getAggregate({ businessId });
}

export async function submitRating({ backendMode, backendRatings, actorId, businessId, ratingValue, answers }) {
  assertEnabled({ backendMode });
  return backendRatings.submitRating({ actorId, businessId, ratingValue, answers });
}

export async function exportMyRatings({ backendMode, backendRatings, actorId }) {
  assertEnabled({ backendMode });
  return backendRatings.exportMyRatings({ actorId });
}

export async function deleteMyRatings({ backendMode, backendRatings, actorId }) {
  assertEnabled({ backendMode });
  return backendRatings.deleteMyRatings({ actorId });
}

export async function devListRatingEventsForBusiness({ backendMode, backendRatings, businessId, limit }) {
  assertEnabled({ backendMode });
  return backendRatings.listEventsForBusiness({ businessId, limit });
}

export async function devDeleteRatingEvent({ backendMode, backendRatings, eventId }) {
  assertEnabled({ backendMode });
  return backendRatings.deleteEvent({ eventId });
}
