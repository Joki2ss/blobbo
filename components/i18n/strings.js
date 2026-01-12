const STRINGS = {
  en: {
    "hub.businessCafe.description": "Professional feed without registration.",

    "cta.becomeBusiness": "Become Business",
    "cta.login": "Login",
    "cta.register": "Register",
    "cta.publish": "Publish",
    "cta.managePosts": "Manage posts",

    "signup.sxr.title": "SXR Managements",
    "signup.sxr.subtitle": "Business signup (in-app)",
    "signup.field.firstName": "First name",
    "signup.field.displayName": "Display name (optional)",
    "signup.field.professionalTitle": "Professional title (optional)",
    "signup.field.email": "Email",
    "signup.field.password": "Password",
    "signup.action.create": "Create business account",
    "signup.action.back": "Back",

    "greeting.casual": "Hello {name}!",
    "greeting.professional": "Welcome {title} {name}!",

    "dashboard.subtitle": "Client management",
  },
  it: {
    "hub.businessCafe.description": "Feed professionale senza registrazione.",

    "cta.becomeBusiness": "Diventa Business",
    "cta.login": "Accedi",
    "cta.register": "Registrati",
    "cta.publish": "Pubblica",
    "cta.managePosts": "Gestisci post",

    "signup.sxr.title": "SXR Managements",
    "signup.sxr.subtitle": "Registrazione Business (in-app)",
    "signup.field.firstName": "Nome",
    "signup.field.displayName": "Nome visualizzato (opzionale)",
    "signup.field.professionalTitle": "Titolo professionale (opzionale)",
    "signup.field.email": "Email",
    "signup.field.password": "Password",
    "signup.action.create": "Crea account Business",
    "signup.action.back": "Indietro",

    "greeting.casual": "Ciao {name}!",
    "greeting.professional": "Ciao {title} {name}!",

    "dashboard.subtitle": "Gestione clienti",
  },
};

function interpolate(template, params) {
  const p = params || {};
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => (p[key] != null ? String(p[key]) : ""));
}

export function pickLocale(preferred) {
  const raw = String(preferred || "").toLowerCase();
  if (raw.startsWith("it")) return "it";
  if (raw.startsWith("en")) return "en";

  try {
    const sys = Intl?.DateTimeFormat?.().resolvedOptions?.().locale;
    const sysL = String(sys || "").toLowerCase();
    if (sysL.startsWith("it")) return "it";
  } catch {
    // ignore
  }

  return "en";
}

export function t(key, params, locale) {
  const loc = pickLocale(locale);
  const dict = STRINGS[loc] || STRINGS.en;
  const template = dict[key] || STRINGS.en[key] || key;
  return interpolate(template, params);
}
