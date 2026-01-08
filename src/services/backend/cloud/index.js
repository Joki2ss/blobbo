import { CLOUD_PROVIDER } from "../../../config/cloud";

import { cloudForgotPassword, cloudLogin, cloudRegister } from "../../cloudAuthService";
import { cloudUpdateMyProfile } from "../../cloudProfileService";

function notConfigured() {
  const provider = CLOUD_PROVIDER;
  const base = "Cloud backend is not configured";
  return new Error(provider ? `${base} for provider: ${provider}` : base);
}

export const cloudBackend = {
  mode: "CLOUD",
  auth: {
    async login({ email, password }) {
      return cloudLogin({ email, password });
    },
    async register({ email, password, phone, fullName, firstName, lastName }) {
      // Keep signature compatible with AppStore.register.
      // Accept extra identity fields (customer flow) while remaining backward-compatible.
      return cloudRegister({ email, password, phone, fullName, firstName, lastName });
    },
    async forgotPassword({ email }) {
      return cloudForgotPassword({ email });
    },
  },
  workspaces: {
    async listForUser() {
      // Minimal placeholder to keep the app navigable in CLOUD mode.
      return [{ id: "ws_cloud", name: "Cloud" }];
    },
    async getById({ workspaceId }) {
      return { id: workspaceId || "ws_cloud", name: "Cloud" };
    },
  },
  clients: {
    async list() {
      // Not implemented in CLOUD yet.
      return [];
    },
    async getById() {
      throw notConfigured();
    },
    async create() {
      throw notConfigured();
    },
  },
  chat: {
    async listThreads() {
      // Not implemented in CLOUD yet.
      return [];
    },
    async listMessages() {
      return [];
    },
    async sendMessage() {
      throw notConfigured();
    },
    async cancelScheduledMessage() {
      throw notConfigured();
    },
    async updateScheduledMessage() {
      throw notConfigured();
    },
    async markThreadRead() {
      return { ok: true };
    },
  },
  activity: {
    async list() {
      return [];
    },
  },
  documents: {
    async listForClient() {
      throw notConfigured();
    },
    async createRequest() {
      throw notConfigured();
    },
    async toggleItem() {
      throw notConfigured();
    },
    async addUploadMetadata() {
      throw notConfigured();
    },
  },
  support: {
    async create() {
      throw notConfigured();
    },
  },
  users: {
    async getById() {
      throw notConfigured();
    },
    async getByClientId() {
      throw notConfigured();
    },
    async updateProfile(params) {
      return cloudUpdateMyProfile(params);
    },
    async listPublicStorefronts() {
      throw notConfigured();
    },
    async getPublicStorefrontById() {
      throw notConfigured();
    },
    async searchPublicProfiles() {
      throw notConfigured();
    },
    async nearPublicProfiles() {
      throw notConfigured();
    },
    async getPublicProfileById() {
      throw notConfigured();
    },
  },
  audit: {
    async list() {
      throw notConfigured();
    },
  },
  ratings: {
    async getAggregate() {
      throw notConfigured();
    },
    async submitRating() {
      throw notConfigured();
    },
    async exportMyRatings() {
      throw notConfigured();
    },
    async deleteMyRatings() {
      throw notConfigured();
    },
    async listEventsForBusiness() {
      throw notConfigured();
    },
    async deleteEvent() {
      throw notConfigured();
    },
  },
};
