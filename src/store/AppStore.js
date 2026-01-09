import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { Alert } from "react-native";

import { getJson, setJson, remove } from "../services/storage";
import { getBackend } from "../services/backend";
import { logEvent } from "../services/logger";
import { getSupportRuntimeConfig } from "../config/supportFlags";
import {
  clearDeveloperSession,
  isDeveloperSessionActive,
  isDeveloperUser,
  setDeveloperSessionVerified,
  verifyDeveloperCode,
} from "../support/SupportPermissions";
import { logSupportEvent } from "../support/SupportLogger";

const SESSION_KEY = "sxr_session_v1";
const PREFS_KEY = "sxr_prefs_v1";

const initialState = {
  hydrated: false,
  session: null, // { user }
  workspace: null, // { id, name }
  backendMode: "MOCK",
  themeMode: "dark", // 'light' | 'dark' | 'system'
  selectedClientId: null,
  currentScreen: "",
  developerUnlocked: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, hydrated: true };
    case "SET_SESSION":
      return { ...state, session: action.session };
    case "SET_WORKSPACE":
      return { ...state, workspace: action.workspace, selectedClientId: null };
    case "SET_BACKEND_MODE":
      return { ...state, backendMode: action.mode };
    case "SET_THEME_MODE":
      return { ...state, themeMode: action.mode };
    case "SET_SELECTED_CLIENT":
      return { ...state, selectedClientId: action.clientId };
    case "SET_CURRENT_SCREEN":
      return { ...state, currentScreen: action.screen };
    case "SET_DEVELOPER_UNLOCKED":
      return { ...state, developerUnlocked: action.value };
    case "LOGOUT":
      return { ...state, session: null, workspace: null, selectedClientId: null };
    default:
      return state;
  }
}

const AppStateContext = createContext(null);
const AppActionsContext = createContext(null);

export function AppProviders({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await getJson(SESSION_KEY, null);
      const prefs = await getJson(PREFS_KEY, null);

      const sessionUser = session ? session.user : null;
      const devActive = await isDeveloperSessionActive(sessionUser);

      if (!mounted) return;
      dispatch({
        type: "HYDRATE",
        payload: {
          session: session ? { user: sessionUser } : null,
          workspace: prefs?.workspace || null,
          backendMode: prefs?.backendMode || "MOCK",
          themeMode: prefs?.themeMode || "dark",
          selectedClientId: prefs?.selectedClientId || null,
          developerUnlocked: !!devActive,
        },
      });

      logEvent("app_hydrate", { hasSession: !!session, backendMode: prefs?.backendMode || "MOCK" });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    (async () => {
      await setJson(PREFS_KEY, {
        backendMode: state.backendMode,
        themeMode: state.themeMode,
        workspace: state.workspace,
        selectedClientId: state.selectedClientId,
      });
    })();
  }, [state.hydrated, state.backendMode, state.themeMode, state.workspace, state.selectedClientId]);

  const backend = useMemo(() => getBackend(state.backendMode), [state.backendMode]);

  useEffect(() => {
    if (!state.hydrated) return;
    (async () => {
      // If we have a session but no workspace (or stale workspace), resolve it.
      if (!state.session?.user) return;

      try {
        const allowed = await backend.workspaces.listForUser({ userId: state.session.user.id });
        const preferred = state.workspace && allowed.some((w) => w.id === state.workspace.id) ? state.workspace : null;
        const next = preferred || allowed[0] || null;
        if (next && (!state.workspace || state.workspace.id !== next.id)) {
          dispatch({ type: "SET_WORKSPACE", workspace: next });
        }
      } catch {
        // Keep app resilient; errors are handled on demand elsewhere.
      }
    })();
  }, [state.hydrated, state.session?.user?.id, state.backendMode]);

  const actions = useMemo(() => {
    const supportCfg = getSupportRuntimeConfig({ backendMode: state.backendMode });

    async function maybeLog(entry) {
      if (!supportCfg.SUPPORT_ENABLED || !supportCfg.DEVELOPER_MODE) return;
      await logSupportEvent(entry);
    }

    return {
      backend,

      async patchSessionUser(patch) {
        const current = state.session?.user;
        if (!current) throw new Error("Not signed in");
        const next = { ...current, ...(patch && typeof patch === "object" ? patch : {}) };
        const session = { user: next };
        await setJson(SESSION_KEY, session);
        dispatch({ type: "SET_SESSION", session });

        // Workspace might depend on role; keep best-effort selection.
        try {
          const allowed = await backend.workspaces.listForUser({ userId: next.id });
          const ws = allowed?.[0] || (await backend.workspaces.getById({ workspaceId: next.workspaceId }));
          if (ws) dispatch({ type: "SET_WORKSPACE", workspace: ws });
        } catch {
          // ignore
        }

        dispatch({ type: "SET_DEVELOPER_UNLOCKED", value: await isDeveloperSessionActive(next) });
        return next;
      },

      setCurrentScreen(screen) {
        dispatch({ type: "SET_CURRENT_SCREEN", screen });
      },

      selectClient(clientId) {
        dispatch({ type: "SET_SELECTED_CLIENT", clientId });
      },

      async login({ email, password }) {
        let user;
        try {
          user = await backend.auth.login({ email, password });
        } catch (e) {
          await maybeLog({
            category: "Security",
            subCategory: "AUTH_LOGIN_FAIL",
            severity: "WARN",
            message: "Login failed",
            payload: { email },
          });
          throw e;
        }

        const allowed = await backend.workspaces.listForUser({ userId: user.id });
        const ws = allowed[0] || (await backend.workspaces.getById({ workspaceId: user.workspaceId }));

        const session = { user };
        await setJson(SESSION_KEY, session);

        dispatch({ type: "SET_SESSION", session });
        dispatch({ type: "SET_WORKSPACE", workspace: ws });

        dispatch({ type: "SET_DEVELOPER_UNLOCKED", value: await isDeveloperSessionActive(user) });

        await maybeLog({
          category: "Security",
          subCategory: "AUTH_LOGIN_SUCCESS",
          severity: "INFO",
          message: "Login success",
          actorUserId: user.id,
          actorRole: user.role,
        });

        logEvent("auth_login", { userId: user.id, role: user.role, workspaceId: user.workspaceId });
        return session;
      },

      async register({ workspaceId, role, fullName, email, phone, password, firstName, displayName, professionalTitle }) {
        const user = await backend.auth.register({
          workspaceId,
          role,
          fullName,
          email,
          phone,
          password,
          firstName,
          displayName,
          professionalTitle,
        });
        const allowed = await backend.workspaces.listForUser({ userId: user.id });
        const ws = allowed[0] || (await backend.workspaces.getById({ workspaceId: user.workspaceId }));

        const session = { user };
        await setJson(SESSION_KEY, session);
        dispatch({ type: "SET_SESSION", session });
        dispatch({ type: "SET_WORKSPACE", workspace: ws });

        dispatch({ type: "SET_DEVELOPER_UNLOCKED", value: await isDeveloperSessionActive(user) });

        await maybeLog({
          category: "Security",
          subCategory: "AUTH_REGISTER",
          severity: "INFO",
          message: "Register success",
          actorUserId: user.id,
          actorRole: user.role,
        });

        logEvent("auth_register", { userId: user.id, role: user.role, workspaceId: user.workspaceId });
        return session;
      },

      async switchWorkspace(workspaceId) {
        const userId = state.session?.user?.id;
        if (!userId) throw new Error("Not signed in");
        const allowed = await backend.workspaces.listForUser({ userId });
        const next = allowed.find((w) => w.id === workspaceId);
        if (!next) throw new Error("Workspace not allowed for this user");
        dispatch({ type: "SET_WORKSPACE", workspace: next });
        logEvent("workspace_switch", { workspaceId: next.id });
        return next;
      },

      setThemeMode(mode) {
        dispatch({ type: "SET_THEME_MODE", mode });
      },

      async updateMyProfile(updates) {
        const workspaceId = state.workspace?.id;
        const actorId = state.session?.user?.id;
        if (!workspaceId || !actorId) throw new Error("Not signed in");

        const user = await backend.users.updateProfile({
          workspaceId,
          actorId,
          targetUserId: actorId,
          updates,
        });

        const session = { user };
        await setJson(SESSION_KEY, session);
        dispatch({ type: "SET_SESSION", session });
        logEvent("user_profile_updated", { userId: actorId });
        return user;
      },

      async requestEmailChange({ requestedEmail }) {
        const workspaceId = state.workspace?.id;
        const user = state.session?.user;
        if (!workspaceId || !user?.id) throw new Error("Not signed in");
        const next = String(requestedEmail || "").trim().toLowerCase();
        if (!next) throw new Error("Email is required");

        const description = [
          "Email change request",
          "",
          `Current email: ${user.email}`,
          `Requested email: ${next}`,
          "",
          "Note: Email changes require admin approval.",
        ].join("\n");

        const res = await backend.support.create({
          workspaceId,
          userId: user.id,
          subject: "Email change request",
          description,
          priority: "Normal",
        });

        logEvent("user_email_change_requested", { userId: user.id });
        return res;
      },

      async adminChangeCustomerEmail({ clientId, email }) {
        const workspaceId = state.workspace?.id;
        const actorId = state.session?.user?.id;
        if (!workspaceId || !actorId) throw new Error("Not signed in");
        const next = String(email || "").trim().toLowerCase();
        if (!next) throw new Error("Email is required");

        const linked = await backend.users.getByClientId({ workspaceId, clientId });
        if (!linked?.id) throw new Error("No linked customer user");

        const updated = await backend.users.updateProfile({
          workspaceId,
          actorId,
          targetUserId: linked.id,
          updates: { email: next },
        });

        logEvent("admin_customer_email_changed", { actorId, targetUserId: linked.id });
        return updated;
      },

      async forgotPassword({ email }) {
        return backend.auth.forgotPassword({ email });
      },

      async logout() {
        await remove(SESSION_KEY);
        await clearDeveloperSession();
        dispatch({ type: "LOGOUT" });
        dispatch({ type: "SET_DEVELOPER_UNLOCKED", value: false });
        logEvent("auth_logout", {});

        await maybeLog({
          category: "Security",
          subCategory: "AUTH_LOGOUT",
          severity: "INFO",
          message: "Logout",
        });
      },

      async setBackendMode(mode) {
        dispatch({ type: "SET_BACKEND_MODE", mode });
        logEvent("backend_mode_set", { mode });

        // Long-press/dev entry is controlled by backendMode.
        // Re-evaluate dev session state.
        dispatch({ type: "SET_DEVELOPER_UNLOCKED", value: await isDeveloperSessionActive(state.session?.user) });
      },

      async unlockDeveloperTools(code) {
        const user = state.session?.user;
        if (!isDeveloperUser(user)) throw new Error("403 Forbidden");

        // Deprecated: no client-side unlock codes.
        void code;
        dispatch({ type: "SET_DEVELOPER_UNLOCKED", value: true });
        logEvent("developer_tools_unlocked", { userId: user.id });

        await maybeLog({
          category: "Security",
          subCategory: "DEV_SESSION_VERIFIED",
          severity: "INFO",
          message: "Developer session verified",
          actorUserId: user.id,
          actorRole: user.role,
        });

        return true;
      },

      async lockDeveloperTools() {
        dispatch({ type: "SET_DEVELOPER_UNLOCKED", value: false });
        logEvent("developer_tools_locked", { userId: state.session?.user?.id || "" });
        return true;
      },

      async safeCall(fn, { title = "Error" } = {}) {
        try {
          return await fn();
        } catch (e) {
          const message = e?.message || "Something went wrong";
          logEvent("error", { message });

          await maybeLog({
            category: "Technical",
            subCategory: "API_REQUEST_FAIL",
            severity: "WARN",
            message,
            actorUserId: state.session?.user?.id,
            actorRole: state.session?.user?.role,
            payload: {
              title,
              currentScreen: state.currentScreen,
              backendMode: state.backendMode,
            },
          });

          Alert.alert(title, message);
          return null;
        }
      },
    };
  }, [backend, state.session, state.workspace]);

  return (
    <AppStateContext.Provider value={state}>
      <AppActionsContext.Provider value={actions}>{children}</AppActionsContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppProviders");
  return ctx;
}

export function useAppActions() {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error("useAppActions must be used within AppProviders");
  return ctx;
}
