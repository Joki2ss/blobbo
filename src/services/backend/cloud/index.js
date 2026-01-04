import { CLOUD_PROVIDER } from "../../../config/cloud";

function notConfigured() {
  const provider = CLOUD_PROVIDER;
  const base = "Cloud backend is not configured";
  return new Error(provider ? `${base} for provider: ${provider}` : base);
}

export const cloudBackend = {
  mode: "CLOUD",
  auth: {
    async login() {
      throw notConfigured();
    },
    async register() {
      throw notConfigured();
    },
    async forgotPassword() {
      throw notConfigured();
    },
  },
  workspaces: {
    async listForUser() {
      throw notConfigured();
    },
    async getById() {
      throw notConfigured();
    },
  },
  clients: {
    async list() {
      throw notConfigured();
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
      throw notConfigured();
    },
    async listMessages() {
      throw notConfigured();
    },
    async sendMessage() {
      throw notConfigured();
    },
    async markThreadRead() {
      throw notConfigured();
    },
  },
  activity: {
    async list() {
      throw notConfigured();
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
};
