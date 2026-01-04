export const support = {
  async create({ workspaceId, userId, subject, description, priority }) {
    // Support is delivered via email (client-side). This is a placeholder.
    return { ok: true, workspaceId, userId, subject, description, priority };
  },
};
