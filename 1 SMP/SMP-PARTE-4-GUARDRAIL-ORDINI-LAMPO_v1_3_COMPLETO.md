# ============================================================
# ORDINI-LAMPO — SMP PARTE 4 (GUARDRAIL)
# ============================================================
# Codice documento: SMP-P4-GUARDRAIL
# Versione: 1.3
# Stato: CANONICO · NON DEROGABILE · ANTI-DERIVA
# Ambito: VINCOLA ogni AI, ogni SMP successivo, ogni Libretto STARGRID
# Relazione: SMP1 = contratto · SMP2 = gabbia architetturale · SMP4 = legge marziale anti-deriva
# Nota: SMP4 governa. SMP5 giudica. Nessuna implementazione, nessuna checklist.
# ============================================================

---
CLAUSOLA DI SUBORDINAZIONE GERARCHICA (VINCOLANTE)

Questo documento è subordinato gerarchicamente a SMP1 (Contratto) e SMP2 (Architettura).
In caso di conflitto, SMP1 e SMP2 prevalgono sempre.

SMP4 definisce DIVIETI, VINCOLI e LIMITI ASSOLUTI NON DEROGABILI.
Nessun altro SMP, appendice, implementazione o giudizio
può attenuare, reinterpretare o aggirare le regole qui stabilite.

Qualsiasi violazione dei guardrail di SMP4
è da considerarsi BLOCCANTE (STOP-THE-LINE).

La numerazione SMP non ha valore gerarchico.

Questa clausola deve essere considerata sempre letta e applicata
prima di qualsiasi altra sezione del documento.

---


> **Avviamo SMP PARTE 4 — GUARDRAIL sotto BULLDOZER-AI-EXEC attivo.  
> Obiettivo: produrre un documento normativo NON DEROGABILE che impedisca qualsiasi deriva dell'AI nei SMP successivi e nei 21 Libretti.  
> SMP4 governa, SMP5 giudica. Nessuna implementazione, nessuna checklist.**

---

## 0) DICHIARAZIONE DI NATURA (NON INTERPRETABILE)

0.1 **Natura del documento.**  
Questo documento è **legge operativa**. Ogni riga è **vincolo eseguibile**.  
Se una riga richiede "interpretazione umana", la riga è **ERRATA** e l'intero documento è **NON CONFORME**.

0.2 **Divieto di reinterpretazione.**  
È **VIETATO**:
- "migliorare" le regole,
- "semplificare" le regole,
- "reinterpretare" le regole,
- "adattare al caso".

L'unica azione ammessa è: **rafforzare la non-eludibilità** (chiusura scappatoie), senza cambiare significato.

0.3 **Gerarchia di vincolo.**  
SMP4 NON può contraddire SMP1 o SMP2.  
Se una riga di SMP4 entra in conflitto con SMP1/SMP2 → **SMP4 = NON VALIDO** (STOP-THE-LINE).

0.4 **Campo di applicazione.**  
SMP4 vincola:
- ogni AI (presente e futura),
- SMP3 e ogni SMP successivo,
- tutti i 21 Libretti (ogni sezione),
- ogni template, guida, prompt, patch, handoff, check-list, spec.

0.5 **Regola di enforcement.**  
Qualsiasi violazione di SMP4 produce:
- **INVALIDAZIONE AUTOMATICA** del documento violante,
- **STOP-THE-LINE** immediato,
- divieto di procedere a step successivi finché non è corretto.

---

## 1) PRINCIPIO FONDANTE (RIPETIZIONE DIFENSIVA)

1.1 **Principio #1 — Documento = Artefatto Eseguibile da AI.**  
> **OGNI DOCUMENTO È UN ARTEFATTO ESEGUIBILE DA AI.**

1.2 **Conseguenza obbligatoria.**  
Ogni documento deve essere scritto assumendo che:
- verrà copiato/incollato senza contesto,
- verrà applicato "alla lettera",
- verrà usato da AI "cieca" e non da umano esperto.

Se una sola riga può portare a:
- stack errato,
- codice non compilabile,
- schema incoerente,
- decisione ambigua,
→ il documento è **NON CONFORME**.

1.3 **STOP-THE-LINE (principio fondante).**  
Se un documento richiede "buon senso" per evitare un errore → **STOP-THE-LINE** (documento non idoneo).

1.4 **Ripetizione difensiva (anti-interpretazione).**  
Questo principio deve essere richiamato:
- nell'apertura di ogni SMP,
- nell'apertura di ogni Libretto,
- prima di ogni sezione generativa (guide/template),
- in ogni "patch" o "handoff".

Se manca il richiamo → documento **NON CONFORME**.

---

## 2) PRINCIPIO "DOCUMENTO = CODICE" (VINCOLO OPERATIVO)

2.1 **Documento = Codice.**  
Ogni riga è trattata come istruzione operativa.  
"Testo descrittivo" senza capacità di generare decisione operativa è **rumore**.

2.2 **Divieto di narrativa.**  
È **VIETATO** inserire:
- commenti storici,
- "contesto umano" non necessario,
- "come andrebbe fatto",
- "best practice",
- "idealmente / preferibile / consigliato".

2.3 **Linguaggio ammesso.**  
Sono ammessi solo verbi normativi:
- **OBBLIGATORIO**
- **VIETATO**
- **BLOCCANTE**
- **STOP-THE-LINE**
- **INVALIDAZIONE**

2.4 **STOP-THE-LINE (linguaggio).**  
Se compare anche una sola volta una parola ambigua (es. "consigliato", "preferibile", "best practice", "idealmente") → **STOP-THE-LINE** e sostituzione obbligatoria con forma normativa.

---

## 3) GERARCHIA DI VERITÀ (NON INVERTIBILE)

3.1 **Ordine di autorità (non invertibile).**
1) **CODICE / SQL / SCRIPT / TEMPLATE**  
2) **GUARDRAIL OPERATIVI**  
3) **CHECKLIST ESEGUIBILI** *(SMP5, non qui)*  
4) **TESTO DESCRITTIVO**  
5) **COMMENTI NARRATIVI**

3.2 **Regola: Testo ≠ Codice.**  
Se testo e codice divergono:
- il testo è **FALSO**,
- il codice va **verificato**,
- se il codice viola lo stack → codice **RISCRITTO** o **ELIMINATO** (vedi §5).

3.3 **Divieti assoluti legati alla gerarchia.**  
È **VIETATO**:
- spiegare codice incompatibile,
- commentare codice legacy "per memoria",
- lasciare esempi non eseguibili,
- mantenere "placeholder" che sembrano implementazione.

3.4 **STOP-THE-LINE (gerarchia).**  
Se un documento tenta di "salvare" un blocco incompatibile tramite spiegazione ("si potrebbe…", "in futuro…") → **STOP-THE-LINE**.

3.5 **Ripetizione difensiva (gerarchia).**  
La gerarchia di verità deve essere richiamata:
- all'inizio di SMP3,
- all'inizio di ogni Libretto che contiene codice o schema,
- in ogni guida/template che genera altri artefatti.

Se manca → documento **NON CONFORME**.

---

## 4) STACK-LOCK ASSOLUTO (RICHIAMO SMP2)

4.1 **Stack canonico operativo (unico consentito).**
- Backend / Runtime: **Railway**
- Database: **Postgres su Railway**
- Frontend: **Netlify**
- Billing: **Stripe**
- Monitoring: **Sentry** *(solo osservabilità)*

4.2 **Regola: Stack-lock = assoluto.**  
È **VIETATO** introdurre (anche solo come riferimento) stack alternativi in:
- codice,
- schema,
- script,
- template,
- comandi,
- config,
- env.

4.3 **Blacklist legacy (P0).**  
Qualsiasi riferimento a uno di questi elementi in codice/schema/script/template è **P0**:
- **Clerk**
- **Neon**
- **Cloudflare** *(Workers, Wrangler, Pages, KV, D1, R2, ecc.)*
- **Supabase**

4.4 **Regola: nessun "legacy residuo".**  
È **VIETATO** lasciare "residui" legacy:
- import,
- commenti,
- variabili env,
- nomi file,
- path,
- snippet.

4.5 **STOP-THE-LINE (stack-lock).**
- Se compare un elemento in blacklist → **STOP-THE-LINE**.
- Se viene proposto "bridge temporaneo" verso legacy → **STOP-THE-LINE**.
- Se viene introdotto un quarto attore oltre a Netlify/Railway/Stripe (Sentry solo osservabilità) → **STOP-THE-LINE**.

4.6 **Ripetizione difensiva (stack-lock).**  
Il paragrafo "Stack canonico operativo" deve essere ripetuto:
- in apertura di ogni SMP,
- in apertura di ogni Libretto,
- in ogni guida/template.

Se manca → documento **NON CONFORME**.

---

### 4.7 Anti-scappatoie (stack-lock)

4.7.1 **Divieto di "citazione neutra".**  
È **VIETATO** citare stack vietati "solo come esempio", "solo come alternativa", "solo per confronto".  
Il solo atto di nominarli fuori dalla blacklist è **violazione**.

4.7.2 **Divieto di astrazione che nasconde legacy.**  
È **VIETATO** introdurre "abstraction layer" che permettono di sostituire lo stack canonico senza modificare il documento.

4.7.3 **Divieto di "futuro".**  
È **VIETATO** scrivere "in futuro potremo usare X".  
Lo stack è fisso; se cambia, SMP2 viene aggiornato formalmente.

4.7.4 **Divieto di parametrizzazione.**  
È **VIETATO** usare variabili/placeholder per rendere lo stack intercambiabile.

---

## 5) REGOLA DI RISCRITTURA FORZATA (ANTI-SPAGHETTI)

5.1 **Principio.**  
Se un blocco di codice/schema/template:
- **viola lo stack**, oppure
- **è incompatibile con i vincoli SMP4**,

→ **DEVE ESSERE RISCRITTO** (non commentato, non "adattato", non "tenuto per riferimento").

5.2 **Nessun "salvataggio".**  
È **VIETATO** salvare blocchi incompatibili tramite:
- commenti,
- note,
- "versioni precedenti",
- "alternativa deprecata".

5.3 **Eliminazione vs. Riscrittura.**
- Se il blocco è **legacy** → **ELIMINARE**.
- Se il blocco è **parzialmente corretto** → **RISCRIVERE** per intero (no patch parziali).

5.4 **STOP-THE-LINE (riscrittura).**
- Se un blocco legacy viene "tenuto per comodità" → **STOP-THE-LINE**.
- Se un blocco viene "patchato parzialmente" senza riscrittura → **STOP-THE-LINE**.

5.5 **Ripetizione difensiva (riscrittura).**  
La regola di riscrittura forzata deve essere richiamata:
- prima di ogni sezione di implementazione in SMP3,
- prima di ogni sezione C (implementazione) nei Libretti,
- in ogni guida/template che genera codice.

Se manca → documento **NON CONFORME**.

---

## 6) REGOLE ANTI-SPAGHETTI (DEFAULT-DENY, ZERO STATO NASCOSTO, ZERO SCORCIATOIE)

6.1 **Default-deny.**  
Qualsiasi elemento (import, dipendenza, pattern, provider) **NON esplicitamente autorizzato** in SMP2 è **VIETATO** di default.

6.2 **Zero stato nascosto.**  
È **VIETATO** introdurre:
- stato implicito,
- side-effect non documentati,
- "magia" non tracciabile.

Ogni stato deve essere esplicitamente dichiarato e tracciabile.

6.3 **Zero scorciatoie.**  
È **VIETATO** introdurre "scorciatoie operative" che aggirano i vincoli.  
Qualsiasi "hack temporaneo" è **P0** e produce **STOP-THE-LINE**.

6.4 **Divieto di innovazione architetturale.**  
SMP4 **NON** può introdurre nuove architetture, nuovi pattern, nuove dipendenze.  
L'architettura è definita esclusivamente in **SMP2**.  
SMP4 può solo **bloccare**, mai **creare**.

6.5 **Unicità della fonte di verità (SSOT).**  
Ogni vincolo deve avere **una sola fonte**.  
Se due documenti definiscono lo stesso vincolo con contenuti divergenti → **STOP-THE-LINE**.

---

## 7) DIVIETI ASSOLUTI (BLACKLIST NORMATIVA)

7.1 **Divieto di introduzione stack legacy.**  
È **VIETATO** introdurre o referenziare Clerk/Neon/Cloudflare/Supabase in qualsiasi forma.

7.2 **Divieto di codice commentato legacy.**  
È **VIETATO** tenere codice legacy commentato "per riferimento".

7.3 **Divieto di "bridge temporanei".**  
È **VIETATO** creare adattatori/bridge verso stack non canonici.

7.4 **Divieto di implementazione in SMP4.**  
SMP4 **NON** contiene implementazione, checklist, SQL, codice eseguibile.  
Il documento satellite SMP4-APPENDICE-C-ESTESA-TEMPLATE-CODICE contiene i template operativi.

7.5 **Divieto di terminologia ambigua.**  
È **VIETATO** usare: "consigliato", "preferibile", "best practice", "idealmente", "potrebbe", "eventualmente".

7.6 **Divieto di placeholder censurati.**  
È **VIETATO** usare placeholder tipo "xxx", "...", "TBD", "TODO" in documenti canonici.

7.7 **Divieto di deroga.**  
È **VIETATO** derogare a SMP4 per qualsiasi motivo.

---

## 8) REGOLE PER FILE GENERATIVI (GUIDE / TEMPLATE / LIBRETTI)

8.1 **Regola generale.**  
Ogni file generativo (guida, template, libretto) deve:
- richiamare il principio fondante (§1),
- richiamare la gerarchia di verità (§3),
- richiamare lo stack-lock (§4),
- richiamare la riscrittura forzata (§5).

8.2 **Formato obbligatorio.**  
Ogni file generativo deve contenere in apertura:
```
> **CONFORMITÀ A SMP4**
> Questo documento è conforme a SMP-PARTE-4-GUARDRAIL.
> Stack canonico: Railway (backend), Postgres/Railway (DB), Netlify (frontend), Stripe (billing), Sentry (monitoring).
> Qualsiasi deroga produce INVALIDAZIONE.
```

8.3 **STOP-THE-LINE (file generativi).**  
Se un file generativo non contiene la dichiarazione di conformità → **STOP-THE-LINE**.

---

## 9) CLAUSOLE STOP-THE-LINE (CASI ESPLICITI DI BLOCCO IMMEDIATO)

**STOP-THE-LINE** scatta immediatamente se:

9.1 Compare un elemento della blacklist legacy (§4.3).

9.2 Compare terminologia ambigua (§2.4, §7.5).

9.3 Un blocco incompatibile viene tenuto "per riferimento" invece che eliminato (§5).

9.4 Si introduce un bridge/adapter verso stack legacy (§7.3).

9.5 Si introduce stato nascosto o side-effect non documentato (§6.2).

9.6 Si propone una "scorciatoia temporanea" (§6.3).

9.7 Si introduce architettura non definita in SMP2 (§6.4).

9.8 Due documenti definiscono lo stesso vincolo con contenuti divergenti (§6.5).

9.9 Un file generativo non contiene dichiarazione di conformità (§8.3).

9.10 SMP4 contiene implementazione/checklist operative (§7.4).

---

## 10) RELAZIONE GERARCHICA (SMP4 > SMP3 > LIBRETTI)

10.1 **Gerarchia di vincolo.**
- **SMP1** = contratto (immutabile)
- **SMP2** = architettura (modificabile solo formalmente)
- **SMP4** = guardrail (vincola tutto ciò che segue)
- **SMP3** = implementazione (vincolato da SMP4)
- **SMP5** = tribunale (verifica conformità a SMP4)
- **Libretti** = esecuzione (vincolati da SMP3+SMP4)

10.2 **Regola di precedenza.**  
In caso di conflitto:
- SMP4 prevale su SMP3, SMP5, Libretti.
- SMP2 prevale su SMP4.
- SMP1 prevale su tutto.

10.3 **STOP-THE-LINE (gerarchia).**  
Se un documento di livello inferiore contraddice SMP4 → **STOP-THE-LINE** + invalidazione documento inferiore.

---

## 11) RELAZIONE CON SMP PARTE 5 (ESPRESSA)

11.1 **Split funzionale.**
- **SMP4 = LEGGE** (definisce vincoli, divieti, blocchi).
- **SMP5 = TRIBUNALE** (verifica, valida, certifica).

11.2 **Divieto di contaminazione.**  
È **VIETATO**:
- inserire checklist operative in SMP4 (vanno in SMP5),
- inserire vincoli normativi in SMP5 (vanno in SMP4).

11.3 **Relazione procedurale.**
- Ogni output (documento, codice, schema) deve essere **conforme a SMP4**.
- La conformità viene **verificata da SMP5**.
- Se SMP5 rileva non conformità → **STOP-THE-LINE** + correzione obbligatoria.

11.4 **STOP-THE-LINE (split).**  
Se SMP4 contiene procedure di verifica → **STOP-THE-LINE** (va spostato in SMP5).

---

## 12) VINCOLI TECNICI OBBLIGATORI (METRICHE NON DEROGABILI)

### 12.1 Rate Limiting (OBBLIGATORIO)

12.1.1 **Limiti per categoria:**
- Endpoint non autenticati: **60 req/min** per IP
- Endpoint autenticati: **300 req/min** per utente
- Endpoint critici (ordini, pagamenti): **10 req/min** per utente

12.1.2 **STOP-THE-LINE:** endpoint esposto senza rate limiting.

### 12.2 Circuit Breaker (OBBLIGATORIO per dipendenze esterne)

12.2.1 **Soglie:**
- Errori: apertura a **50%** su finestra 30s
- Latenza: apertura se p99 > **5000ms**

12.2.2 **Reset:** half-open dopo **60s**, chiusura su 3 successi consecutivi.

12.2.3 **STOP-THE-LINE:** chiamata a Stripe (o altro servizio esterno) senza circuit breaker.

### 12.3 Input Validation (OBBLIGATORIO)

12.3.1 **Regole:**
- Validazione schema (Zod o equivalente) **PRIMA** di qualsiasi logica.
- Body limit: **1MB**.
- Normalizzazione telefono: formato **E.164**.

12.3.2 **STOP-THE-LINE:** endpoint che processa input senza validazione preventiva.

### 12.4 Output Sanitization (OBBLIGATORIO)

12.4.1 **Regole:**
- **MAI** esporre stack trace in response.
- **MAI** esporre query SQL in response.
- **MAI** esporre path filesystem in response.
- Errori 5xx: messaggio generico + codice errore.

12.4.2 **Headers obbligatori:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)

12.4.3 **STOP-THE-LINE:** response che espone internals.

### 12.5 Sessioni / Cookie / CSRF (OBBLIGATORIO)

12.5.1 **Cookie di sessione:**
- `HttpOnly`: **OBBLIGATORIO**
- `Secure`: **OBBLIGATORIO** in produzione
- `SameSite`: **Lax** o **Strict**

12.5.2 **CSRF:** strategia compatibile con cookie-based session.

12.5.3 **CORS:**
- Origin **espliciti** (mai wildcard in produzione).
- Se `credentials: true` → origin **NON** può essere `*`.

12.5.4 **STOP-THE-LINE:** cookie senza HttpOnly, CORS wildcard in produzione.

### 12.6 SLO / Error Budget (OBBLIGATORIO)

12.6.1 **SLO target:** **99.5%** uptime mensile.

12.6.2 **Error budget:** ~3.6 ore/mese di downtime ammesso.

12.6.3 **Regola:** se error budget consumato all'80% → **freeze deploy** fino a fine mese.

### 12.7 Health Check (OBBLIGATORIO)

12.7.1 **Endpoint:** `/health`

12.7.2 **Semantica:**
- **200** se tutte le dipendenze critiche sono raggiungibili.
- **503** se almeno una dipendenza critica è down.

12.7.3 **Timeout:** risposta entro **5 secondi**.

12.7.4 **STOP-THE-LINE:** deploy senza health check funzionante.

### 12.8 Audit Trail (OBBLIGATORIO per azioni sensibili)

12.8.1 **Eventi da loggare:**
- Login/logout
- Creazione/modifica ordine
- Operazioni di pagamento
- Modifiche configurazione ristorante

12.8.2 **Formato log:** strutturato (JSON), con timestamp, user_id, action, resource_id.

12.8.3 **Divieto:** **MAI** loggare password, token, numeri carta, segreti.

### 12.9 STOP-THE-LINE (vincoli tecnici)

Qualsiasi violazione dei vincoli §12.1–§12.8 produce **STOP-THE-LINE** immediato.

---

## 13) TABELLA RIEPILOGATIVA DIVIETI (QUICK REFERENCE — SSOT)

| ID | Divieto | Sezione | Conseguenza |
|----|---------|---------|-------------|
| P0-01 | Riferimento stack legacy (Clerk/Neon/Cloudflare/Supabase) fuori blacklist | §4 / §7 | STOP-THE-LINE + invalidazione documento violante |
| P0-02 | Bridge/adapter verso stack legacy | §7.3 | STOP-THE-LINE |
| P0-03 | Codice legacy non riscritto | §5 | STOP-THE-LINE |
| P0-04 | Codice legacy commentato "per riferimento" | §5.2 / §7.2 | STOP-THE-LINE |
| P0-05 | Terminologia ambigua (consigliato, preferibile, ecc.) | §2.4 / §7.5 | STOP-THE-LINE + riscrittura |
| P0-06 | Placeholder censurati (xxx, TBD, TODO) | §7.6 | STOP-THE-LINE |
| P0-07 | File generativo senza dichiarazione conformità | §8.3 | STOP-THE-LINE |
| P0-08 | Stato nascosto / side-effect non documentato | §6.2 | STOP-THE-LINE |
| P0-09 | Scorciatoia temporanea / hack | §6.3 | STOP-THE-LINE |
| P0-10 | Output che espone internals (stack trace, query, path) | §12.4 | STOP-THE-LINE |
| P0-11 | Endpoint senza rate limiting | §12.1 | STOP-THE-LINE |
| P0-12 | Chiamata esterna senza circuit breaker | §12.2 | STOP-THE-LINE |
| P0-13 | Input non validato | §12.3 | STOP-THE-LINE |
| P0-14 | Cookie senza HttpOnly | §12.5 | STOP-THE-LINE |
| P0-15 | CORS wildcard in produzione | §12.5.3 | STOP-THE-LINE |
| P0-16 | Deploy senza health check | §12.7 | STOP-THE-LINE |
| P1-01 | Innovazione architetturale non in SMP2 | §6.4 | Blocco + rimozione |
| P1-02 | Duplicazione fonte di verità | §6.5 | Blocco + consolidamento SSOT |
| P1-03 | Deroga a SMP4 | §7.7 | Blocco + ripristino |
| P1-04 | SMP4 contiene implementazione/checklist | §7.4 / §11.2 | Blocco + spostamento in SMP5 o satellite |

---

## 14) DICHIARAZIONE FINALE DI VINCOLO

14.1 **Dichiarazione.**  
Questo documento (SMP PARTE 4 — GUARDRAIL) è **LEGGE OPERATIVA** per il progetto Ordini-Lampo.

14.2 **Immutabilità semantica.**  
Il significato di ogni regola è fisso. È possibile solo:
- aggiungere chiarimenti che **rafforzano** la non-eludibilità,
- chiudere scappatoie scoperte.

È **VIETATO** modificare il significato di una regola esistente.

14.3 **Obbligo di conformità.**  
Ogni AI, ogni documento, ogni output prodotto nell'ambito del progetto Ordini-Lampo **DEVE** essere conforme a SMP4.

14.4 **Verifica.**  
La conformità viene verificata da **SMP5** (tribunale).

14.5 **Enforcement.**  
Violazione = **STOP-THE-LINE** + invalidazione + correzione obbligatoria.

---

## APPENDICE A — ESEMPI DI VIOLAZIONE (PATTERN-MATCHING, SENZA IMPLEMENTAZIONE)

**Scopo vincolante:** fornire pattern riconoscibili a colpo d'occhio per impedire violazioni "mascherate".  
**Natura:** questi esempi sono **normativi** (non didattici) e servono solo a classificare violazioni e imporre STOP-THE-LINE.  
**Divieto:** l'appendice **NON** implementa; **NON** contiene codice, SQL, comandi, checklist operative.

> **Formato obbligatorio per ogni esempio:**  
> **Violazione (pattern):** …  
> **Diagnosi:** …  
> **Tipo:** P0/P1/P2  
> **Sezione SMP4 violata:** §…  
> **Conseguenza:** STOP-THE-LINE / INVALIDAZIONE / NON CONFORME  
> **Correzione OBBLIGATORIA (solo in termini normativi):** …

### A.1 — Provider legacy introdotto come "dipendenza"
**Violazione (pattern):** comparsa di provider in blacklist (Clerk/Neon/Cloudflare/Supabase) in import, config, docs o env.  
**Diagnosi:** stack-lock violato; riattiva il legacy (anche "solo citato").  
**Tipo:** P0  
**Sezione:** §4, §7  
**Conseguenza:** STOP-THE-LINE + invalidazione output.  
**Correzione OBBLIGATORIA:** rimozione totale del riferimento e riscrittura/adeguamento su stack canonico.

### A.2 — "Bridge temporaneo" verso legacy
**Violazione (pattern):** frasi o scelte tipo "per ora usiamo X, poi migriamo", "temporaneo", "workaround".  
**Diagnosi:** scorciatoia/deroga che crea debito tecnico e drift.  
**Tipo:** P0  
**Sezione:** §4.5, §6.3  
**Conseguenza:** STOP-THE-LINE.  
**Correzione OBBLIGATORIA:** eliminare il bridge; soluzione solo sullo stack canonico.

### A.3 — Codice incompatibile lasciato "commentato" o "per memoria"
**Violazione (pattern):** presenza di blocchi "disattivati", "TODO migrare", "vecchio codice", "tenuto come riferimento".  
**Diagnosi:** viola riscrittura forzata e genera spaghetti.  
**Tipo:** P0  
**Sezione:** §5.3–§5.5, §7.2  
**Conseguenza:** STOP-THE-LINE.  
**Correzione OBBLIGATORIA:** eliminare o riscrivere. Mai commentare.

### A.4 — Terminologia ambigua che apre scappatoie
**Violazione (pattern):** uso di "best practice", "consigliato", "preferibile", "idealmente", "potrebbe", "eventualmente".  
**Diagnosi:** introduce interpretazione; l'AI può deviare.  
**Tipo:** P0  
**Sezione:** §2.4, §7.5  
**Conseguenza:** STOP-THE-LINE + sostituzione obbligatoria.  
**Correzione OBBLIGATORIA:** riscrivere con OBBLIGATORIO/VIETATO/BLOCCANTE.

### A.5 — CORS permissivo o non deterministico
**Violazione (pattern):** origin wildcard, origin non enumerati, policy "aperta", "qualsiasi".  
**Diagnosi:** rompe sicurezza e governance; consente accessi non previsti.  
**Tipo:** P0  
**Sezione:** §12 (Vincoli Tecnici), §6 (no scorciatoie)  
**Conseguenza:** STOP-THE-LINE.  
**Correzione OBBLIGATORIA:** origin espliciti e deterministici per Netlify frontend/admin (+ localhost solo dev).

### A.6 — Esposizione di internals (stack trace, path, query, segreti)
**Violazione (pattern):** output verso client contiene stack trace, dettagli query, path filesystem, token/secret, headers sensibili.  
**Diagnosi:** data leak e superficie attacco.  
**Tipo:** P0  
**Sezione:** §12 (Vincoli Tecnici)  
**Conseguenza:** STOP-THE-LINE + hotfix obbligatorio.  
**Correzione OBBLIGATORIA:** sanitizzazione totale; logging solo interno; segreti mai loggati.

### A.7 — Assenza di rate limiting su endpoint esposti
**Violazione (pattern):** endpoint pubblici/critici senza limitazione o con limitazioni "a parole".  
**Diagnosi:** DoS, abuso e drift di sicurezza.  
**Tipo:** P0  
**Sezione:** §12 (Vincoli Tecnici)  
**Conseguenza:** STOP-THE-LINE.  
**Correzione OBBLIGATORIA:** rate limiting obbligatorio per categorie (globale / login / critici).

### A.8 — Assenza di circuit breaker su dipendenze esterne (Stripe o simili)
**Violazione (pattern):** chiamate a servizi esterni senza meccanismo di protezione/isolamento.  
**Diagnosi:** failure cascade; downtime amplificato.  
**Tipo:** P0  
**Sezione:** §12 (Vincoli Tecnici), §6.1 (default-deny)  
**Conseguenza:** STOP-THE-LINE.  
**Correzione OBBLIGATORIA:** circuit breaker obbligatorio e comportamento deterministico in "open".

### A.9 — "Stato nascosto" (magic user/session/context)
**Violazione (pattern):** dipendenza da campi/oggetti popolati "da qualche parte" senza dichiarazione vincolante.  
**Diagnosi:** rompe tracciabilità e replicabilità; drift.  
**Tipo:** P1  
**Sezione:** §6.2, §10  
**Conseguenza:** STOP-THE-LINE se impatta sicurezza/auth; altrimenti correzione P1 bloccante.  
**Correzione OBBLIGATORIA:** esplicitare sempre l'origine dello stato (middleware/contratto) e vietare magia.

### A.10 — Bypass di sicurezza o validazione (flag SKIP/BYPASS)
**Violazione (pattern):** qualsiasi bypass "solo per test", "solo staging", "temporaneo".  
**Diagnosi:** scappatoia permanente e rischio produzione.  
**Tipo:** P1 (→ P0 se presente in prod o raggiungibile)  
**Sezione:** §6.3, §9  
**Conseguenza:** STOP-THE-LINE se raggiungibile; altrimenti rimozione obbligatoria.  
**Correzione OBBLIGATORIA:** rimuovere bypass; testing via ambienti/dati, non via scorciatoie.

### A.11 — Duplicazione di fonti di verità
**Violazione (pattern):** due documenti definiscono lo stesso vincolo con contenuti divergenti.  
**Diagnosi:** crea conflitti e drift tra AI.  
**Tipo:** P1  
**Sezione:** §6.5, §3  
**Conseguenza:** STOP-THE-LINE se produce divergenza operativa.  
**Correzione OBBLIGATORIA:** stabilire SSOT unica e sostituire le copie con richiami.

### A.12 — SMP4 contaminato da "tribunale"
**Violazione (pattern):** checklist operative, simulazioni, PASS/FAIL, GO/NO-GO, procedure.  
**Diagnosi:** viola lo split SMP4/SMP5 e genera scappatoie (SMP4 diventa operativo).  
**Tipo:** P0  
**Sezione:** §11  
**Conseguenza:** STOP-THE-LINE + ripristino split.  
**Correzione OBBLIGATORIA:** spostare tutto ciò che verifica/operativizza in SMP5.

### A.13 — Introduzione di architettura o schema non in SMP2
**Violazione (pattern):** nuove componenti, nuovi moduli, nuovi schemi "proposti", strutture inventate.  
**Diagnosi:** SMP4 non crea architettura; la blocca.  
**Tipo:** P0  
**Sezione:** §0.3, §6.4  
**Conseguenza:** STOP-THE-LINE.  
**Correzione OBBLIGATORIA:** rimuovere; attenersi a SMP2.

---

## APPENDICE B — MAPPING ERRORI → AZIONI (POST STOP-THE-LINE, SENZA CHECKLIST OPERATIVE)

**Scopo vincolante:** quando scatta STOP-THE-LINE, imporre una reazione deterministica **senza** trasformare SMP4 in SMP5.  
**Divieto:** questa appendice non contiene checklist operative, comandi, o test; definisce **solo** obblighi e priorità.

### B.1 — Regola di gestione violazioni
- **P0:** blocco immediato + rollback/annullamento output + correzione obbligatoria prima di qualunque passo successivo.
- **P1:** blocco del flusso relativo (non si procede su quell'area) finché non corretto; il resto può proseguire solo se isolato e non contaminato.
- **P2:** correzione pianificata ma non può diventare "permanente"; se riappare → riclassificazione a P1.

### B.2 — Obbligo di classificazione
Ogni violazione deve essere classificata come **P0/P1/P2** e deve indicare:
- sezione SMP4 violata,
- conseguenza,
- requisito di correzione (riscrivi/elimina/normalizza),
- punto di controllo in SMP5 (dove verrà verificata l'uscita).

**STOP-THE-LINE:** se manca la classificazione → STOP.

### B.3 — Reazione deterministica (normativa)
- Se la violazione è **stack-lock/legacy** → **OBBLIGATORIO** rimuovere ogni riferimento e confermare "0 residui".
- Se la violazione è **riscrittura forzata** → **OBBLIGATORIO** riscrivere o eliminare; vietato sospendere.
- Se la violazione è **sicurezza** (CORS/cookie/CSRF/segreti) → **OBBLIGATORIO** hotfix prima di qualsiasi rilascio.
- Se la violazione è **terminologia ambigua** → **OBBLIGATORIO** riscrivere in linguaggio normativo.

### B.4 — Rinvio vincolante a SMP5 per la verifica
Ogni correzione deve essere validata tramite SMP5 (tribunale).  
**STOP-THE-LINE:** se una correzione non ha un punto di verifica in SMP5 → STOP.

---

## APPENDICE C — REGOLE CONCRETE PER AI CHE PRODUCE CODICE (NORMATIVE, SENZA CODICE)

**Scopo vincolante:** ridurre a zero l'area grigia per l'AI che genera implementazioni, senza introdurre implementazione dentro SMP4.

### C.1 — Stack-lock operativo (whitelist/blacklist semantica)
**OBBLIGATORIO:** generare codice solo per:
- runtime/backend su Railway,
- database Postgres su Railway,
- frontend su Netlify,
- billing Stripe,
- monitoring Sentry (osservabilità).

**VIETATO (P0):** qualunque riferimento operativo (non meramente "in blacklist") a:
- Clerk,
- Neon,
- Cloudflare (Workers/Pages/D1/KV/R2/Wrangler),
- Supabase.

### C.2 — Dipendenze ammissibili (livello concettuale)
**OBBLIGATORIO:** se un requisito implica:
- HTTP server → usare paradigma "server Node/Express-like" (non edge runtime).
- DB → usare driver Postgres nativo ("pg-like") con prepared statements.
- Validazione → schema validation (Zod-like) prima della logica.
- Rate limiting → limiter per endpoint.
- Resilienza → circuit breaker per dipendenze esterne.
- Error reporting → Sentry capture (senza leak verso client).

**VIETATO:** introdurre ORM/edge runtimes/framework non previsti senza autorizzazione esplicita in SMP2 (default-deny).

### C.3 — Requisiti minimi di sicurezza (sempre, senza eccezioni)
**OBBLIGATORIO:**
- input validation lato server per body/params/query,
- error response sanitizzata (mai stack trace),
- CORS con origin espliciti,
- cookie di sessione HttpOnly + Secure + SameSite coerente,
- CSRF strategy compatibile con cookie-based session,
- rate limiting su endpoint pubblici e critici,
- audit trail per azioni sensibili,
- segregazione tenant (no cross-tenant).

**STOP-THE-LINE:** se manca anche uno solo dei requisiti di sicurezza minimi.

### C.4 — Requisiti minimi di affidabilità (sempre)
**OBBLIGATORIO:**
- health endpoints con semantica reale (503 se dipendenze critiche down),
- timeouts espliciti per dipendenze esterne,
- circuit breaker per Stripe e servizi esterni,
- comportamento deterministico in "service unavailable" (503, messaggio neutro).

**STOP-THE-LINE:** se dipendenze esterne sono chiamate senza protezioni.

### C.5 — Regola anti-scappatoia per AI
**VIETATO:** bypass, flag SKIP/BYPASS, hack "temporanei", scorciatoie "per deploy".  
**OBBLIGATORIO:** soluzione definitiva sullo stack canonico o STOP.

### C.6 — Requisiti di tracciabilità
**OBBLIGATORIO:** ogni decisione "sensibile" deve essere tracciabile in:
- log interno (senza segreti),
- audit trail applicativo (quando richiesto),
- Sentry per errori.

**VIETATO:** logging di segreti o PII non necessari.

### C.7 — Rifiuto obbligatorio (anti-pattern)
Se richiesto di:
- introdurre legacy,
- usare scorciatoie,
- aprire CORS,
- esporre stack trace,
- saltare validazione,
l'AI deve rispondere con **RIFIUTO BLOCCANTE** e indicare il vincolo SMP4 violato.

### C.8 — Documento satellite OBBLIGATORIO

Per template codice completi e operativi, è **OBBLIGATORIO** consultare:

> **SMP4-APPENDICE-C-ESTESA-TEMPLATE-CODICE.md**

Quel documento contiene:
- whitelist/blacklist operative con snippet completi,
- struttura progetto con tutti i path,
- template entry point, database, middleware,
- circuit breaker per Stripe,
- checklist pre-commit (40+ items),
- anti-pattern con risposte di rifiuto.

**STOP-THE-LINE:** se l'AI genera codice senza consultare il documento satellite.

---

# FINE SMP PARTE 4 (GUARDRAIL) v1.3
