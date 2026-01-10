import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { Alert } from "react-native";

import { getJson, setJson, remove } from "../services/storage";
import { logEvent } from "../services/logger";
import { getSupportRuntimeConfig } from "../config/supportFlags";
import { isDeveloperUser } from "../support/SupportPermissions";

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
      if (!mounted) return;
      dispatch({
        type: "HYDRATE",
        payload: {
          session: session ? { user: session.user } : null,
          workspace: prefs?.workspace || null,
          backendMode: prefs?.backendMode || "MOCK",
          themeMode: prefs?.themeMode || "dark",
          selectedClientId: prefs?.selectedClientId || null,
          developerUnlocked: false,
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

  // Backend removed for Expo Snack compatibility

  const actions = useMemo(() => ({
    setCurrentScreen(screen) {
      dispatch({ type: "SET_CURRENT_SCREEN", screen });
    },
    selectClient(clientId) {
      dispatch({ type: "SET_SELECTED_CLIENT", clientId });
    },
    setThemeMode(mode) {
      dispatch({ type: "SET_THEME_MODE", mode });
    },
    // Stubs for Expo Snack: no backend
    async login() {
      Alert.alert("Not available in demo");
    },
    async register() {
      Alert.alert("Not available in demo");
    },
    async switchWorkspace() {
      Alert.alert("Not available in demo");
    },
    async updateMyProfile() {
      Alert.alert("Not available in demo");
    },
    async requestEmailChange() {
      Alert.alert("Not available in demo");
    },
    async adminChangeCustomerEmail() {
      Alert.alert("Not available in demo");
    },
    async forgotPassword() {
      Alert.alert("Not available in demo");
    },
    async logout() {
      await remove(SESSION_KEY);
      dispatch({ type: "LOGOUT" });
      logEvent("auth_logout", {});
    },
    async setBackendMode() {
      Alert.alert("Not available in demo");
    },
    async unlockDeveloperTools() {
      Alert.alert("Not available in demo");
    },
    async lockDeveloperTools() {
      Alert.alert("Not available in demo");
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
  }), [state.session, state.workspace]);

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
