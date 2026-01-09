import { getJson, setJson } from "../../storage";
import { createId } from "../../../utils/id";
import { ensureSeedDevUser, ensureSeedDemoPasswords } from "../../../mock/seedDevUser";

const DB_KEY = "sxr_mock_db_v1";

export async function loadDb() {
  const existing = await getJson(DB_KEY, null);
  if (existing) return existing;

  const now = Date.now();

  const ws1 = { id: "ws_acme", name: "Acme Ops" };
  const ws2 = { id: "ws_beta", name: "Beta Holdings" };

  const users = [
    {
      id: "u_admin_acme",
      workspaceId: ws1.id,
      role: "ADMIN",
      fullName: "Jordan Admin",
      email: "admin@acme.com",
      phone: "+1 555 0100",
      photoUri: "",
      password: "",
    },
    {
      // Demo multi-tenant admin (member of multiple workspaces)
      id: "u_admin_multi",
      workspaceId: ws1.id,
      role: "ADMIN",
      fullName: "Casey Multi-Workspace",
      email: "admin@demo.com",
      phone: "+1 555 0999",
      photoUri: "",
      password: "",
    },
    {
      id: "u_client_acme",
      workspaceId: ws1.id,
      role: "CLIENT",
      fullName: "Taylor Client",
      email: "client@acme.com",
      phone: "+1 555 0101",
      photoUri: "",
      password: "",
      clientId: "c_acme_1",
    },
    {
      id: "u_admin_beta",
      workspaceId: ws2.id,
      role: "ADMIN",
      fullName: "Avery Admin",
      email: "admin@beta.com",
      phone: "+1 555 0200",
      photoUri: "",
      password: "",
    },
    {
      id: "u_dev",
      workspaceId: ws1.id,
      role: "DEVELOPER",
      fullName: "Dev User",
      email: "",
      phone: "+1 555 0300",
      photoUri: "",
      password: "",
      isHiddenFromPublic: true,
    },
    {
      id: "u_business_roma",
      workspaceId: ws1.id,
      role: "BUSINESS",
      fullName: "Studio Nova",
      email: "pro@studionova.demo",
      phone: "+39 06 0000",
      photoUri: "",
      password: "",
      storefrontBusinessName: "Studio Nova",
      storefrontCategory: "Hair & Beauty",
      storefrontTags: ["color", "cut", "styling"],
      storefrontServices: ["Cut", "Color", "Blow-dry"],
      storefrontVatNumber: "",
      storefrontStreetAddress: "Via del Corso",
      storefrontStreetNumber: "10",
      storefrontCity: "Rome",
      storefrontRegion: "RM",
      storefrontCountry: "IT",
      storefrontLat: 41.902782,
      storefrontLng: 12.496366,
      storefrontPublicEnabled: true,
    },
    {
      id: "u_business_milano",
      workspaceId: ws2.id,
      role: "BUSINESS",
      fullName: "Northside Repairs",
      email: "pro@northside.demo",
      phone: "+39 02 0000",
      photoUri: "",
      password: "",
      storefrontBusinessName: "Northside Repairs",
      storefrontCategory: "Home Services",
      storefrontTags: ["plumbing", "electric", "repairs"],
      storefrontServices: ["Plumbing", "Electrical", "Maintenance"],
      storefrontVatNumber: "",
      storefrontStreetAddress: "Via Torino",
      storefrontStreetNumber: "22",
      storefrontCity: "Milan",
      storefrontRegion: "MI",
      storefrontCountry: "IT",
      storefrontLat: 45.464204,
      storefrontLng: 9.189982,
      storefrontPublicEnabled: true,
    },
  ];

  // Simple membership model: which workspaces a user can access.
  // This enables an admin-only workspace switcher without mixing tenant data.
  const memberships = [
    { userId: "u_admin_acme", workspaceId: ws1.id },
    { userId: "u_client_acme", workspaceId: ws1.id },
    { userId: "u_admin_beta", workspaceId: ws2.id },
    { userId: "u_admin_multi", workspaceId: ws1.id },
    { userId: "u_admin_multi", workspaceId: ws2.id },
  ];

  const clients = [
    {
      id: "c_acme_1",
      workspaceId: ws1.id,
      name: "Taylor Client",
      email: "client@acme.com",
      phone: "+1 555 0101",
      status: "active",
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "c_acme_2",
      workspaceId: ws1.id,
      name: "Morgan Retail",
      email: "morgan@retail.com",
      phone: "+1 555 0133",
      status: "active",
      createdAt: now - 1000 * 60 * 60 * 24 * 14,
    },
    {
      id: "c_beta_1",
      workspaceId: ws2.id,
      name: "Beta Client One",
      email: "one@beta.com",
      phone: "+1 555 0211",
      status: "active",
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
    },
  ];

  const messages = [
    {
      id: createId("m"),
      workspaceId: ws1.id,
      clientId: "c_acme_1",
      senderType: "CLIENT",
      senderId: "u_client_acme",
      text: "Hi — quick question about my onboarding checklist.",
      createdAt: now - 1000 * 60 * 55,
      read: false,
    },
    {
      id: createId("m"),
      workspaceId: ws1.id,
      clientId: "c_acme_1",
      senderType: "ADMIN",
      senderId: "u_admin_acme",
      text: "Sure. I can help — what’s missing?",
      createdAt: now - 1000 * 60 * 50,
      read: true,
    },
  ];

  const documents = [
    {
      id: "dr_acme_1",
      workspaceId: ws1.id,
      clientId: "c_acme_1",
      templateId: "onboarding",
      title: "Onboarding",
      items: [
        { id: "i1", label: "ID / Passport", done: false },
        { id: "i2", label: "Proof of Address", done: false },
        { id: "i3", label: "Company Registration", done: false },
      ],
      status: "pending",
      createdAt: now - 1000 * 60 * 60 * 12,
      uploads: [],
    },
  ];

  const activity = [
    {
      id: createId("a"),
      workspaceId: ws1.id,
      clientId: "c_acme_1",
      type: "document_request",
      title: "Document request created",
      detail: "Onboarding",
      createdAt: now - 1000 * 60 * 60 * 12,
    },
    {
      id: createId("a"),
      workspaceId: ws1.id,
      clientId: "c_acme_1",
      type: "message",
      title: "Client message",
      detail: "Hi — quick question about my onboarding checklist.",
      createdAt: now - 1000 * 60 * 55,
    },
  ];

  const db = {
    workspaces: [ws1, ws2],
    users,
    memberships,
    clients,
    messages,
    documents,
    activity,
    ratingEvents: [],
    ratingAggregates: [],
    supportRequests: [],
    audit: [],
  };

  // Security: ensure DEVELOPER seed is hidden from public and password is generated at runtime (not in git).
  await ensureSeedDevUser(db);
  await ensureSeedDemoPasswords(db);

  await setJson(DB_KEY, db);
  return db;
}

export async function saveDb(db) {
  await setJson(DB_KEY, db);
}
