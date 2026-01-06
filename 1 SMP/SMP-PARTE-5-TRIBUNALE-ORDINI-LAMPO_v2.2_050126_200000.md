# ============================================================
# ORDINI-LAMPO — SMP PARTE 5 (TRIBUNALE / GO-NO-GO)
# ============================================================
# Codice: SMP-P5-TRIBUNALE
# Versione: 2.2.0
# Data: 050126_200000 (Europe/Rome)
# Stato: CANONICO · ESEGUIBILE · DERIVATO DA SMP4
# Relazione: SMP4 = LEGGE · SMP5 = TRIBUNALE
# ============================================================

---

CLAUSOLA DI SUBORDINAZIONE GERARCHICA (VINCOLANTE)

Questo documento è subordinato gerarchicamente a:
SMP1 (Contratto),
SMP2 (Architettura),
SMP4 (Guardrail).

SMP5 esercita esclusivamente la funzione di GIUDIZIO e VERIFICA.
SMP5 non può rendere valido alcun artefatto, implementazione o decisione
che violi uno dei documenti gerarchicamente superiori.

In caso di conflitto, prevalgono sempre i documenti superiori.
Qualsiasi esito, giudizio o approvazione non conforme
è NON VALIDO (STOP-THE-LINE).

La numerazione SMP non implica gerarchia.

Questa clausola deve essere considerata sempre letta e applicata
prima di qualsiasi altra sezione del documento.

---

> **DICHIARAZIONE DI AVVIO**
> SMP5 applica, verifica e giudica la conformità a SMP1, SMP2 e SMP4.
> SMP5 NON introduce architettura nuova: valuta solo artefatti esistenti.
> SMP5 PUÒ contenere checklist operative, test, comandi e GO/NO-GO (è il tribunale).
> Qualsiasi deroga a SMP4 è impossibile: l’unica risposta è NO-GO.

---

## 0) PRINCIPIO DI AUTORITÀ (NON NEGABILE)

0.1 **Fonti vincolanti (ordine non invertibile)**
1) SMP1 (contratto)
2) SMP2 (architettura vincolante)
3) SMP4 (guardrail + satellite operativi referenziati)

SMP5 è subordinato a tutte.

0.2 **Regola “Default-Deny”**
Qualsiasi cosa non esplicitamente permessa da SMP1/SMP2/SMP4 è **VIETATA**.
In SMP5 questo si traduce in: se non è verificabile → NO-GO.

0.3 **STOP-THE-LINE**
SMP5 applica STOP-THE-LINE in modo deterministico.
“Temporaneo”, “workaround”, “poi” = NO-GO immediato.

---

## 1) INPUT OBBLIGATORI DEL TRIBUNALE (SE MANCANO = NO-GO)

SMP5 non giudica su “sensazioni”. Giudica su **artefatti**.

1.1 **Artefatti minimi richiesti**
- Repo backend (ordini-lampo-api) + commit SHA
- Repo frontend Admin + commit SHA
- Repo frontend Client (se coinvolto) + commit SHA
- Config Netlify (build settings + env) esportabili (screenshot o dump)
- Config Railway (service + env + logs) esportabili (screenshot o dump)

1.2 **Documento satellite obbligatorio**
- Deve essere presente e referenziato da SMP4:
  - “SMP4-APPENDICE-C-ESTESA-TEMPLATE-CODICE-…”
- Se il satellite non è reperibile/identificabile in modo univoco → **P0**.

1.3 **Evidence Pack (obbligatorio)**
Ogni giudizio SMP5 deve includere evidenze minime:
- output build (Netlify) o log CI
- output deploy (Railway)
- output test endpoint (curl o equivalente) con header principali
- prova assenza legacy (grep/dipendenze)

Se manca anche una sola evidenza richiesta → **P0**.

---

## 2) CLASSIFICAZIONE VIOLAZIONI (OBBLIGATORIA)

### 2.1 Livelli
- **P0 — BLOCCANTE ASSOLUTO**
  - Violazione SMP4 (stack-lock, default-deny, riscrittura forzata, no-scorciatoie)
  - Introduzione/anche solo residuo legacy (Clerk/Neon/Cloudflare/Supabase)
  - Sicurezza minima assente (CORS/cookie/CSRF/rate limit/sanitizzazione/segreti)
  - Mancanza Evidence Pack
  - Deroga implicita (“temporaneo”)
  → **STOP-THE-LINE immediato**

- **P1 — BLOCCANTE DI RILASCIO**
  - Requisito di affidabilità non soddisfatto (timeouts, circuit breaker, health reale)
  - Incoerenza di configurazione tra ambienti (staging/prod) senza giustificazione canonica
  → blocco rilascio fino a correzione

- **P2 — CORREZIONE OBBLIGATORIA (NON BLOCCA DEV, BLOCCA RELEASE)**
  - Debito tecnico documentale verificabile
  - Incompletezza non strutturale con workaround vietati assenti
  → deve essere sanata prima di “Release Candidate”

### 2.2 Obbligo di etichettatura
Ogni violazione deve dichiarare:
- livello (P0/P1/P2)
- artefatto e commit SHA
- sezione SMP violata (SMP1/SMP2/SMP4)
- requisito violato
- azione imposta (RISCRIVI / ELIMINA / BLOCCA / RIPETI TEST)

Violazione non etichettata = **P0**.

---

## 3) CHECKLIST TRIBUNALE — STACK / LEGACY (P0)

### 3.1 Stack-lock (must pass)
- [ ] Backend: **Railway** (nessun runtime edge)
- [ ] DB: **Postgres su Railway**
- [ ] Frontend: **Netlify**
- [ ] Billing: **Stripe**
- [ ] Monitoring: **Sentry** (solo osservabilità)

### 3.2 Legacy “zero residui” (P0)
**Comandi di prova (obbligatori)**
```bash
# Repo root (ripetere su ogni repo coinvolto)
grep -RInE "(clerk|@clerk|neon|neondatabase|supabase|cloudflare|workers|wrangler|d1|kv|r2)" . || true
```
- [ ] Nessuna occorrenza in codice, config, docs, env example.
- [ ] Nessuna dipendenza installata/lockfile legata a legacy.

**P0** se anche una sola occorrenza è presente.

---

## 4) CHECKLIST TRIBUNALE — SECURITY MINIMA (P0)

> Se manca un solo item → P0.

### 4.1 Validazione input
- [ ] Validazione server-side per body/params/query (schema-based)
- [ ] Rifiuto deterministico 400 per input non valido

### 4.2 Sanitizzazione errori
- [ ] Risposte al client senza stack trace
- [ ] Nessun leak di query/path/segreti/header sensibili

### 4.3 CORS deterministico
- [ ] `origin` espliciti (Netlify admin/client)
- [ ] `credentials` coerenti
- [ ] Nessun wildcard

### 4.4 Cookie / Session
- [ ] Cookie sessione: HttpOnly + Secure (in prod) + SameSite definito
- [ ] Session fixation mitigata (rotazione/rigenerazione dove previsto)

### 4.5 CSRF
- [ ] Strategia CSRF compatibile con cookie-based auth
- [ ] Endpoint sensibili protetti (mutazioni)

### 4.6 Rate limiting
- [ ] Rate limiting globale
- [ ] Rate limiting aggressivo su login e endpoint critici

### 4.7 Segreti e logging
- [ ] Nessun segreto in log
- [ ] Variabili env sensibili non stampate
- [ ] Sentry: PII minimizzata, scrub attivo dove previsto

---

## 5) CHECKLIST TRIBUNALE — AFFIDABILITÀ (P1)

### 5.1 Health “reale”
- [ ] Health endpoint risponde 200 solo se dipendenze critiche sono sane
- [ ] Se DB down → health degrada a 503

### 5.2 Timeout espliciti
- [ ] Timeouts per chiamate esterne (Stripe)
- [ ] Timeouts DB/connection

### 5.3 Circuit breaker (servizi esterni)
- [ ] Circuit breaker attivo per Stripe (o equivalente ammesso dal satellite)
- [ ] Stato OPEN produce 503 deterministico (no loop/retry infinito)

### 5.4 Degrado controllato
- [ ] Failure di dipendenza esterna non provoca crash cascata
- [ ] Messaggio client neutro e coerente

---

## 6) CHECKLIST TRIBUNALE — ANTI-SPAGHETTI / ANTI-DERIVA (P0)

- [ ] Nessun codice incompatibile commentato “per memoria”
- [ ] Nessun “TODO: migrare” su parti core (auth/DB/tenant/billing)
- [ ] Nessun bypass/flag SKIP/BYPASS
- [ ] Nessuna “scorciatoia per deploy”
- [ ] Una sola fonte di verità per vincolo (SSOT)
- [ ] Nessuna duplicazione divergente tra doc e codice

Violazione = **P0**.

---

## 7) MATRICE TEST MINIMA (SMP5 È OPERATIVO)

> SMP5 può imporre test. Se non si eseguono → NO-GO (P0 per assenza evidenze).

### 7.1 Test endpoint (minimi)
- [ ] `/api/v1/health` (o path canonico) — status coerente
- [ ] Login (se presente) — 200/401 deterministici
- [ ] Endpoint protetto — 401/403 quando non autenticato
- [ ] CORS: header coerenti con origin Netlify
- [ ] Cookie: Set-Cookie presente quando previsto, attributi corretti

### 7.2 Test multi-tenant (se applicabile)
- [ ] Accesso tenant A non vede dati tenant B (test negativo)
- [ ] Token/sessione non consente cross-tenant

### 7.3 Test Stripe (se applicabile)
- [ ] Webhook: verifica firma (reject se invalida)
- [ ] Circuit breaker: simulazione down Stripe → 503 deterministico

---

## 8) GO / NO-GO (REGOLA DI VERDETTO)

### 8.1 GO
GO solo se:
- **P0 = 0**
- **P1 = 0**
- P2 documentati con piano e scadenza (e non riguardano security/stack)

### 8.2 NO-GO
NO-GO se:
- anche un solo P0
- anche un solo P1
- assenza Evidence Pack
- qualsiasi deroga/ambiguità

### 8.3 Effetto
- NO-GO blocca release, blocca SMP successivi, blocca Libretti operativi correlati.

---

## 9) FORMATO OUTPUT OBBLIGATORIO DEL TRIBUNALE (REPORT)

Ogni esecuzione SMP5 deve produrre un report con questo formato:

- **Artefatto**: repo / path / commit SHA
- **Ambiente**: staging / production
- **Esito**: GO / NO-GO
- **Violazioni**:
  - ID violazione
  - Livello P0/P1/P2
  - SMP violato (1/2/4)
  - Evidenza (log / grep / output test)
  - Azione imposta
- **Firma**: data + versione SMP5

Se il report non include evidenze → **P0**.

---

## 10) CLAUSOLA FINALE

SMP5 è l’ultimo cancello.  
Non esistono eccezioni.  
Il tribunale non negozia: **giudica**.

---

# FINE SMP PARTE 5 — TRIBUNALE
---

## 11) TEMPLATE REPORT TRIBUNALE (OBBLIGATORIO, ESEMPIO COMPLETO)

> **Scopo:** eliminare ambiguità di reporting e rendere SMP5 eseguibile “a colpo sicuro”.  
> **Regola:** qualunque audit SMP5 che non produca un report in questo formato è **P0 (NO-GO)**.

### 11.1 Formato report (schema obbligatorio)
Copia/incolla e compila *senza modificare le intestazioni*:

```markdown
# REPORT TRIBUNALE — SMP5
Versione SMP5: 2.2.0
Data: YYYY-MM-DD (Europe/Rome)
Ambiente: staging | production

## 1) ARTEFATTI GIUDICATI (OBBLIGATORIO)
- Backend: ordini-lampo-api — commit SHA: <...>
- Admin: ordinlampo-admin — commit SHA: <...>
- Client (se coinvolto): ordinilampo — commit SHA: <...>

## 2) EVIDENCE PACK (OBBLIGATORIO)
- Netlify build log: <riferimento / estratto>
- Railway deploy log: <riferimento / estratto>
- Prova endpoint health: <curl + output>
- Prova CORS: <curl + header>
- Prova cookie/session: <curl + Set-Cookie>
- Prova “zero legacy”: <grep command + output>

## 3) CHECKLIST ESITI (OBBLIGATORIO)
### 3.1 Stack-lock
- Esito: PASS | FAIL
- Note:

### 3.2 Security minima (P0)
- Esito: PASS | FAIL
- Note:

### 3.3 Affidabilità (P1)
- Esito: PASS | FAIL
- Note:

### 3.4 Anti-spaghetti (P0)
- Esito: PASS | FAIL
- Note:

### 3.5 Matrice test minima
- Esito: PASS | FAIL
- Note:

## 4) VIOLAZIONI (OBBLIGATORIO)
> Se nessuna: scrivere “Nessuna violazione”.
Per ogni violazione:
- ID: V-###
- Livello: P0 | P1 | P2
- SMP violato: SMP1 | SMP2 | SMP4
- Sezione SMP violata: §...
- Artefatto: <repo + path + commit>
- Evidenza: <log/grep/curl>
- Azione imposta: RISCRIVI | ELIMINA | BLOCCA | RIPETI TEST
- Stato: APERTA | RISOLTA

## 5) VERDETTO (OBBLIGATORIO)
- Esito finale: GO | NO-GO
- Motivazione (1 riga):
- Blocco attivo: SI | NO
- Prossimo step consentito: <...> | NESSUNO (se NO-GO)

## 6) FIRMA (OBBLIGATORIO)
- Firmato da: <AI/HUMAN>
- Timestamp: <...>
```

### 11.2 Esempio completo (NO-GO) — modello vincolante
> **Nota:** è un esempio di report, non introduce architettura. Serve come “golden format”.

```markdown
# REPORT TRIBUNALE — SMP5
Versione SMP5: 2.2.0
Data: 2026-01-06 (Europe/Rome)
Ambiente: production

## 1) ARTEFATTI GIUDICATI (OBBLIGATORIO)
- Backend: ordini-lampo-api — commit SHA: abcdef123456
- Admin: ordinlampo-admin — commit SHA: 112233aabbcc

## 2) EVIDENCE PACK (OBBLIGATORIO)
- Netlify build log: OK (job #421)
- Railway deploy log: OK (deploy #98)
- Prova endpoint health: curl /api/v1/health → 200
- Prova CORS: Access-Control-Allow-Origin = https://ordinlampo-admin.netlify.app
- Prova cookie/session: Set-Cookie presente con HttpOnly+Secure
- Prova “zero legacy”: grep → TROVATO "supabase" in README

## 3) CHECKLIST ESITI (OBBLIGATORIO)
### 3.1 Stack-lock
- Esito: FAIL
- Note: riferimento legacy in doc (supabase)

### 3.2 Security minima (P0)
- Esito: PASS
- Note: ok

### 3.3 Affidabilità (P1)
- Esito: PASS
- Note: ok

### 3.4 Anti-spaghetti (P0)
- Esito: FAIL
- Note: residuo legacy

### 3.5 Matrice test minima
- Esito: PASS
- Note: ok

## 4) VIOLAZIONI (OBBLIGATORIO)
- ID: V-001
- Livello: P0
- SMP violato: SMP4
- Sezione SMP violata: §4 / §7
- Artefatto: ordinlampo-admin / README.md / commit 112233aabbcc
- Evidenza: grep output (supabase)
- Azione imposta: ELIMINA (riferimento legacy) + RIPETI TEST
- Stato: APERTA

## 5) VERDETTO (OBBLIGATORIO)
- Esito finale: NO-GO
- Motivazione (1 riga): P0 presente (residuo legacy)
- Blocco attivo: SI
- Prossimo step consentito: NESSUNO

## 6) FIRMA (OBBLIGATORIO)
- Firmato da: AI (SMP5)
- Timestamp: 2026-01-06T19:10:00+01:00
```

---

## 12) COMANDI CURL DI VERIFICA (OBBLIGATORI, SE MANCANO = P0)

> **Regola:** i test vanno eseguiti e riportati nel report (§11) come evidenza.  
> **Divieto:** non “interpretare” i test; eseguire e incollare output rilevante.

### 12.1 Health (obbligatorio)
```bash
curl -i "$API_BASE/api/v1/health" --max-time 20
```

### 12.2 CORS (obbligatorio)
```bash
curl -i "$API_BASE/api/v1/health" \
  -H "Origin: $ADMIN_URL" \
  --max-time 20
```
**Verifica:** `access-control-allow-origin` = `$ADMIN_URL` e `access-control-allow-credentials: true` quando previsto.

### 12.3 Login (se presente) (obbligatorio)
```bash
curl -i "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: $ADMIN_URL" \
  -d '{"email":"test@example.com","password":"test"}' \
  --max-time 20
```
**Verifica:** risposta deterministica 200/401. Mai 500.

### 12.4 Endpoint protetto (obbligatorio)
```bash
curl -i "$API_BASE/api/v1/me" \
  -H "Origin: $ADMIN_URL" \
  --max-time 20
```
**Verifica:** 401/403 quando non autenticato.

### 12.5 Cookie flags (se presente Set-Cookie) (obbligatorio)
Eseguire un endpoint che setta cookie e verificare negli header:
- `HttpOnly`
- `Secure` (in prod)
- `SameSite` definito

---

## 13) QUICK REFERENCE (LOOKUP VELOCE, ANTI-AMBIGUITÀ)

> **Scopo:** ridurre tempo di lookup e impedire “reinterpretazioni” durante audit.

### 13.1 Trigger → Severità → Esito

| Trigger (evento) | Severità | Esito | Azione imposta |
|---|---:|---|---|
| Qualsiasi residuo legacy (Clerk/Neon/Cloudflare/Supabase) | P0 | NO-GO | ELIMINA + RIPETI TEST |
| Stack-lock violato / stack alternativo | P0 | NO-GO | RISCRIVI/ELIMINA |
| Mancanza Evidence Pack | P0 | NO-GO | FORNISCI EVIDENZE |
| CORS wildcard / origin non deterministici | P0 | NO-GO | CORREGGI CORS |
| Errori esposti (stack trace/leak) | P0 | NO-GO | SANITIZZA + RETEST |
| Rate limit mancante su endpoint critici | P0 | NO-GO | IMPLEMENTA + RETEST |
| Circuit breaker mancante su esterni (Stripe) | P1 | NO-GO | IMPLEMENTA + RETEST |
| Health non “reale” (sempre 200) | P1 | NO-GO | CORREGGI + RETEST |
| TODO/refactor su parti core (auth/tenant/billing) | P0 | NO-GO | RISOLVI o RIMUOVI |
| P2 documentale non critico | P2 | GO (solo se P0=0,P1=0) | PIANIFICA prima di RC |

### 13.2 Sezioni chiave (mappa rapida)

| Tema | Sezione |
|---|---|
| Input obbligatori + evidence pack | §1 |
| Classificazione P0/P1/P2 | §2 |
| Stack-lock + zero legacy | §3 |
| Security minima (P0) | §4 |
| Affidabilità (P1) | §5 |
| Anti-spaghetti (P0) | §6 |
| Matrice test minima | §7 |
| GO/NO-GO | §8 |
| Report tribunale (template) | §11 |
| Curl commands | §12 |
| Quick reference | §13 |

---

# FINE SMP PARTE 5 — TRIBUNALE v2.2.0
