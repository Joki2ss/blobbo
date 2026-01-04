# miscuglio.md

Guida tecnica locale (solo in questo workspace) per:

- Debug da dev/admin/staff/customer
- Uso del sistema Support & Logs (developer-only) e Support Tickets + Chat
- Come collaborare con AI (prompt e metodo) senza rompere invarianti di sicurezza
- Note su Document Editor + export
- Idee future: sync con Shopify (clienti/ordini) e “admin log ordini”

> Importante: questa guida descrive **ciò che c’è in repo** e come usarlo. Alcune parti sono **idee/future work** e sono esplicitamente marcate come tali.

---

## 1) Cos’è questo progetto (in breve)

App Expo React Native con:

- Backend astratto (`MOCK` e `CLOUD/LIVE`) per funzionare anche senza server reale.
- Multi-tenant/workspace isolation (concetto: dati e azioni per “workspace” separati).
- Identità basata su email (email = identificatore). Regole: il customer non cambia email da solo; admin può cambiare email customer con audit.
- Sistema **Developer-only** “Support & Logs” con:
  - allowlist email developer
  - codice sblocco (hash SHA-256) + TTL sessione
  - consenso (scopes) per visualizzare log
  - sanitizzazione log (evita leak segreti)
  - ErrorBoundary che logga crash **solo** se support mode è attivo
- Sistema **Support Tickets + Chat** (feature-flag) con:
  - ticket list, dettaglio, chat, allegati
  - regole di visibilità
  - consenso per correlare log al ticket (per troubleshooting)
- **Rich Document Editor** (feature-flag) per admin/business:
  - editor HTML in WebView (contentEditable)
  - immagini inline (base64)
  - export PDF/TXT (DOCX e altro: stub)
  - tracking export e delete export locale

---

## 2) Modalità backend: MOCK vs LIVE (CLOUD)

Il runtime decide la “modalità backend” (semplificando):

- `MOCK`: dati locali (AsyncStorage, ecc.), feature support attive per test
- `LIVE`: feature support disattive per default (safe-by-default) e backend cloud può essere “not implemented” in alcune route

**Dove guardare**

- `src/config/supportFlags.js`: calcola `getSupportRuntimeConfig({ backendMode })` e decide cosa è abilitato in MOCK vs LIVE.
- `src/services/backend/index.js` + `src/services/backend/mock/*` + `src/services/backend/cloud/*`: astrazione servizi.

**Regola di sicurezza**

- In LIVE le feature Support/Tickets/Editor sono disattive per default salvo override esplicito.

---

## 3) Ruoli: admin/business/customer/staff (e compat)

Nel progetto ci sono ruoli “storici” (es. `ADMIN`, `CLIENT`). Per allinearli al vocabolario richiesto (admin/business/customer/staff) esiste un mapper.

**Dove guardare**

- `src/utils/roles.js`

**Concetto pratico**

- Alcune schermate e servizi usano helper tipo `isAdminOrBusiness(...)` / `isCustomerOrStaff(...)`.
- Per “support tickets” i ruoli vengono normalizzati (utile per filtri e regole coerenti).

---

## 4) Support & Logs (Developer-only): come funziona

Questo è un blocco critico: **non va rotto né refactorato “creativamente”**.

### 4.1 Invarianti principali (da rispettare sempre)

- Accesso developer SOLO per email allowlisted.
- Sblocco richiede codice dev (verificato via hash SHA-256, mai in chiaro nel codice).
- Sessione sblocco ha TTL (scade).
- Alcuni entry point sono MOCK-only (es. long-press in Settings).
- Visualizzazione log richiede consenso con scopes.

### 4.2 Dove configurare developer allowlist/codice

- `src/config/dev.js`
  - `DEV_EMAIL_ALLOWLIST`: lista email autorizzate.
  - `DEV_CODE_HASH_SHA256`: hash SHA-256 del codice.
  - `DEV_SESSION_TTL_MS`: durata sessione sblocco.

Nota: essendo JS bundle, non è “sicurezza assoluta”, ma è sufficiente come **barriera di prodotto** + prevenzione accessi casuali.

### 4.3 Scopes/consensi

Il sistema non è “log access = sempre”. Serve consenso, e i log sono sanitizzati.

- `src/support/SupportConsent.js`: registra consenso e scopes.
- `src/support/SupportService.js`: enforce del consenso.
- `src/support/SupportSanitize.js`: rimuove/maschera stringhe sensibili.

### 4.4 ErrorBoundary

- `src/support/SupportUI/SupportErrorBoundary.js` + wrapper
- `LAB/App.js`: RootNavigator è wrappato per loggare crash quando support mode è abilitato.

### 4.5 Flusso operativo (dev)

1. Metti app in `MOCK` (se previsto dal tuo setup).
2. Vai in Settings.
3. Long-press sul footer (MOCK-only) per entrare nel flusso dev.
4. Inserisci email allowlisted.
5. Inserisci codice (verifica hash) → sessione valida finché TTL non scade.
6. Una volta sbloccato, puoi:
   - vedere dashboard/audit sviluppatore
   - vedere log solo se c’è consenso

---

## 5) Support Tickets + Chat (feature-flag): cosa sono e come usarli

Sistema interno di ticket con chat e allegati.

### 5.1 Feature flag

- In `src/config/supportFlags.js`:
  - `SUPPORT_TICKETS_ENABLED` (di default: true in MOCK, false in LIVE)

### 5.2 Concetti (minimi)

- Ticket: contenitore con stato, titolo, categoria, creatore, ecc.
- Messaggi: chat tra customer/staff/admin/dev.
- Allegati: file collegati al ticket.
- Consenso ticket-specific: abilita correlazione log ↔ ticket (importante per debug).

### 5.3 Regole di visibilità (alto livello)

- Customer: vede i suoi ticket (e la chat nel suo perimetro).
- Staff/Admin/Business: vede ticket per workspace/tenant secondo permessi.
- Developer: visibilità globale (MA sempre dietro il gating developer + eventuale consenso per log correlation).

### 5.4 Cosa può fare ciascun ruolo (pratico)

**Customer**

- Crea ticket (se la feature è abilitata).
- Invia messaggi e allegati.
- Concede o revoca consenso per usare log per quel ticket (se UI presente).

**Staff**

- Legge e risponde ai ticket del workspace.
- Può allegare file e aggiornare stato (se UI/permessi previsti).

**Admin/Business**

- Tutto ciò che fa staff.
- Più permessi di gestione (in base ai gate usati nelle screen).

**Developer (allowlisted + unlocked)**

- Dashboard ticket (filtri: date/ruolo/… se previsti).
- Strumenti di audit.
- Correlazione log solo se consenso (globale + ticket-specific quando richiesto).

### 5.5 Dove sta il codice

- Store + costruttori:
  - `src/support/SupportTicketsStore.js`
- Service (CRUD + regole + mock “realtime”):
  - `src/support/SupportTicketsService.js`
- UI screens:
  - `src/screens/app/SupportTicketsListScreen.js`
  - `src/screens/app/SupportTicketDetailScreen.js`
  - `src/screens/app/DeveloperTicketsScreen.js` (dev view)

### 5.6 Debug tipico di un ticket

1. Riproduci bug (customer/staff).
2. Apri ticket e descrivi:
   - passo-passo
   - expected vs actual
   - device/OS
   - screenshot se possibile
3. (Opzionale) abilita consenso log per quel ticket.
4. Dev: apre dashboard + ticket detail + log correlati (se consentiti).

---

## 6) Document Editor (feature-flag) + Export lifecycle

Editor ricco per admin/business (non per customer).

### 6.1 Feature flag

- `DOCUMENT_EDITOR_ENABLED` in `src/config/supportFlags.js` (true in MOCK, false in LIVE di default).

### 6.2 Cosa fa

- Editor in WebView con contenuto HTML editabile.
- Toolbar: formattazioni base.
- Immagini inline (base64), possibile ridimensionamento.
- Export:
  - PDF e TXT implementati.
  - DOCX/tabelle/grafici: stub (placeholder).

### 6.3 Lifecycle export

Export non è “fire and forget”: viene tracciato e puoi cancellare i file exportati.

- Tracking store:
  - `src/documents/DocumentExportsStore.js`
- Export logic:
  - `src/documents/DocumentExport.js`
- UI:
  - `src/screens/app/DocumentEditorScreen.js`

### 6.4 Debug tipico (editor/export)

- Se WebView non carica:
  - verifica `react-native-webview` installato
  - avvia con `npx expo start --clear`
- Se export PDF fallisce:
  - verifica `expo-print` e `expo-sharing`
  - controlla permessi OS
- Se i file export non si cancellano:
  - controlla path nel record export e `expo-file-system`.

---

## 7) Identità email (regole importanti)

Regola: email è l’identificatore.

- Customer non può cambiare email da solo.
- Admin può cambiare email customer.
- Ogni cambio email admin → audit entry.

Schermate e logica correlate:

- `src/screens/app/ProfileScreen.js`
- `src/screens/app/AdminChangeCustomerEmailScreen.js`
- mock audit/user services in `src/services/backend/mock/*`

---

## 8) Debug operativo: checklist rapida

### 8.1 Avvio progetto

- Installa: `npm install`
- Avvia: `npx expo start --localhost`
- Se errori package mancanti: usa `npx expo install <pkg>`

### 8.2 Se una feature “non appare”

- Sei in `MOCK` o `LIVE`?
- Il flag runtime è attivo? (`src/config/supportFlags.js`)
- Il ruolo utente passa i gate? (`src/utils/roles.js`)

### 8.3 Se dev dashboard/log non accessibili

- Email allowlisted? (`src/config/dev.js`)
- Sessione dev sbloccata e non scaduta?
- Sei in MOCK (entry point MOCK-only)?
- C’è consenso con scopes richiesti?

---

## 9) Come usare AI per debug (prompting “da pro”) — minimidettagli

Obiettivo: usare AI per accelerare debug senza leak di segreti e senza far rompere invarianti.

### 9.1 Regole d’oro

- Non incollare mai token/chiavi reali nei prompt.
- Se devi mostrare log, passali già sanitizzati (o rimuovi manualmente email/ID se necessario).
- Dai sempre: contesto minimo + file path + comportamento atteso.
- Chiedi modifiche **surgical** (non refactor grandi) quando c’è vincolo “DO NOT break”.

### 9.2 Template prompt: bug runtime

Copia/incolla e compila:

**Prompt**
"""
Sei un senior engineer su Expo RN.

Contesto:

- Modalità: MOCK/LIVE = <...>
- Ruolo: <admin/business/staff/customer/dev>
- Feature flags: SUPPORT_TICKETS_ENABLED=<...>, DOCUMENT_EDITOR_ENABLED=<...>
- Steps to reproduce:
  1. ...
  2. ...
- Expected:
- Actual:
- Error/log (sanitized):

Chiedo:

1. root cause probabile
2. 1-2 patch minime con file precisi
3. regression risks
   """

### 9.3 Template prompt: “non rompere invarianti”

"""
Vincoli non negoziabili:

- Non refactorare né cambiare il flusso developer Support & Logs.
- Mantieni gating: allowlist + dev code hash + TTL + consenso scopes.

Ho bisogno di aggiungere <X>.
Suggerisci la modifica più piccola possibile (max 1-2 file) e dove inserirla.
"""

### 9.4 Template prompt: analisi architettura

"""
Analizza questi file e dimmi:

- punti di coupling
- punti di rischio security/privacy
- dove mettere telemetry/log senza leak

File:

- src/support/SupportPermissions.js
- src/support/SupportConsent.js
- src/support/SupportService.js
  """

### 9.5 Prompt per migliorare UX senza aggiungere feature nuove

"""
Senza aggiungere nuove schermate o feature, solo micro-copy e guardrails UI:

- migliora i messaggi di errore
- evita stati ambigui
  Indica stringhe e posizioni.
  """

---

## 10) Idee future (NON implementate): sync con Shopify stores

Questa sezione è una proposta di estensione, non codice attuale.

### 10.1 Obiettivo

- Sync clienti: import aggiornamenti anagrafiche.
- Sync ordini: import storico ordini, stato pagamenti/spedizioni.
- Possibile “admin log ordini”: schermata admin (o sezione) con timeline ordini/eventi.

### 10.2 Architettura suggerita (minima)

- Aggiungere una cartella `src/integrations/shopify/` con:
  - `ShopifyClient.js` (wrapper REST/GraphQL)
  - `ShopifySyncService.js` (job/polling)
  - `ShopifyMapping.js` (mappa dati Shopify → modelli app)
- Gestire credenziali in modo sicuro:
  - in LIVE mai hardcodare token
  - usare backend cloud come proxy per tenere segreti server-side
- Strategie sync:
  - Full import iniziale (clienti/ordini)
  - Incrementale (since lastSync)
  - Conflitti (precedenza Shopify vs app)

### 10.3 UX proposta (minima, senza inventare UI extra qui)

- Una sezione admin (es. nel pannello admin esistente) per:
  - collegare store
  - lanciare sync
  - vedere log sync e ordini importati

### 10.4 Prompt AI per progettare Shopify sync senza over-engineering

"""
Progetta un MVP Shopify sync per Expo RN con backend cloud proxy.
Vincoli:

- nessun segreto nel client
- modelli minimi: Customer, Order
- sync incrementale
  Output:
- file tree proposto
- API contracts backend<->client
- failure modes e retry
  """

---

## 11) Dove sono i dati (utile per debug)

- AsyncStorage: stato app, ticket, documenti, log store (dipende dai moduli).
- SecureStore: TTL session dev unlock.
- FileSystem: file export (PDF/TXT) e eventuali allegati.

Se devi “resettare” per debug:

- cancella storage app dall’emulatore/device oppure implementa/usa il reset presente (se esiste in Settings).

---

## 12) Troubleshooting comune

- **Errore `expo-asset` mancante**: risolto con `npx expo install expo-asset`.
- **Warning versioni Expo**: non sempre bloccanti, ma per compatibilità Expo Go conviene allineare con `npx expo install ...`.
- **Feature non visibile in LIVE**: per design. Attiva solo con override esplicito (e valuta security).

---

## 13) Glossario mini

- **Consent scopes**: permessi granulari per vedere/associare log.
- **Correlation**: collegare log/eventi a un ticket specifico.
- **TTL**: scadenza sessione dev.
- **MOCK**: modalità test locale senza backend reale.
