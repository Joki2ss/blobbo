import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { Alert } from "react-native";

import { getJson, setJson, remove } from "../services/storage";
import { getBackend } from "../services/backend";
import { logEvent } from "../services/logger";

const SESSION_KEY = "sxr_session_v1";
const PREFS_KEY = "sxr_prefs_v1";

const initialState = {
  hydrated: false,
  session: null, // { user }
  workspace: null, // { id, name }
  backendMode: "MOCK",
  selectedClientId: null,
  currentScreen: "",
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
    case "SET_SELECTED_CLIENT":
      return { ...state, selectedClientId: action.clientId };
    case "SET_CURRENT_SCREEN":
      return { ...state, currentScreen: action.screen };
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

      if (!mounted) return;
      dispatch({
        type: "HYDRATE",
        payload: {
          session: session ? { user: session.user } : null,
          workspace: prefs?.workspace || null,
          backendMode: prefs?.backendMode || "MOCK",
          selectedClientId: prefs?.selectedClientId || null,
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
        workspace: state.workspace,
        selectedClientId: state.selectedClientId,
      });
    })();
  }, [state.hydrated, state.backendMode, state.workspace, state.selectedClientId]);

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
    return {
      backend,

      setCurrentScreen(screen) {
        dispatch({ type: "SET_CURRENT_SCREEN", screen });
      },

      selectClient(clientId) {
        dispatch({ type: "SET_SELECTED_CLIENT", clientId });
      },

      async login({ email, password }) {
        const user = await backend.auth.login({ email, password });
        const allowed = await backend.workspaces.listForUser({ userId: user.id });
        const ws = allowed[0] || (await backend.workspaces.getById({ workspaceId: user.workspaceId }));

        const session = { user };
        await setJson(SESSION_KEY, session);

        dispatch({ type: "SET_SESSION", session });
        dispatch({ type: "SET_WORKSPACE", workspace: ws });

        logEvent("auth_login", { userId: user.id, role: user.role, workspaceId: user.workspaceId });
        return session;
      },

      async register({ workspaceId, role, fullName, email, phone, password }) {
        const user = await backend.auth.register({ workspaceId, role, fullName, email, phone, password });
        const allowed = await backend.workspaces.listForUser({ userId: user.id });
        const ws = allowed[0] || (await backend.workspaces.getById({ workspaceId: user.workspaceId }));

        const session = { user };
        await setJson(SESSION_KEY, session);
        dispatch({ type: "SET_SESSION", session });
        dispatch({ type: "SET_WORKSPACE", workspace: ws });

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

      async forgotPassword({ email }) {
        return backend.auth.forgotPassword({ email });
      },

      async logout() {
        await remove(SESSION_KEY);
        dispatch({ type: "LOGOUT" });
        logEvent("auth_logout", {});
      },

      async setBackendMode(mode) {
        dispatch({ type: "SET_BACKEND_MODE", mode });
        logEvent("backend_mode_set", { mode });
      },

      async safeCall(fn, { title = "Error" } = {}) {
        try {
          return await fn();
        } catch (e) {
          const message = e?.message || "Something went wrong";
          logEvent("error", { message });
          Alert.alert(title, message);
          return null;
        }
      },
    };
  }, [backend, state.session?.user?.id, state.workspace?.id]);

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
