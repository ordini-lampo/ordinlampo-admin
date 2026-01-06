# SMP PARTE 3 — IMPLEMENTAZIONE GOVERNATA (v2.2)
**Progetto:** Ordini-Lampo  
**Stato:** CANONICO · VINCOLANTE · SENZA CODICE  
**Dipendenze:** SMP1 · SMP2 · SMP4 (documento principale **e satellite**) · SMP5  
**Funzione:** IMPLEMENTAZIONE GOVERNATA

---

## CLAUSOLA DI SUBORDINAZIONE GERARCHICA (VINCOLANTE)

Questo documento è subordinato gerarchicamente a:  
**SMP1 (Contratto), SMP2 (Architettura), SMP4 (Guardrail — documento principale E satellite applicativo), SMP5 (Tribunale).**

In caso di conflitto, **prevalgono SEMPRE i documenti sopra elencati**,  
**indipendentemente dalla numerazione SMP**.

Il termine **“SMP4” include SEMPRE sia il documento principale  
sia ogni satellite e appendice dichiarata canonica.**

L’autorità di dichiarare “canonico” un satellite o un’appendice di SMP4  
appartiene **ESCLUSIVAMENTE** al documento principale SMP4  
e ai suoi satelliti già dichiarati canonici.  
**SMP3 NON ha alcuna autorità** nel dichiarare, promuovere  
o riconoscere come canonico un satellite.

SMP3 definisce **ESCLUSIVAMENTE** come implementare quanto già consentito  
e vincolato dai documenti superiori.  
SMP3 **non introduce architettura**, **non modifica regole**,  
**non crea eccezioni** e **non interpreta i vincoli**.

Qualsiasi implementazione non conforme ai documenti superiori  
è **NON VALIDA (STOP-THE-LINE)**.

### NOTA DI NON-PROPEDEUTICITÀ (OBBLIGATORIA)
La numerazione “SMP3” **non implica precedenza logica né temporale**  
rispetto a SMP4 (Guardrail) e SMP5 (Tribunale).  
**SMP4 e SMP5 devono essere considerati SEMPRE antecedenti e vincolanti.**

Questa clausola deve essere considerata **sempre letta e applicata**  
**prima di qualsiasi altra sezione del documento**.

---

## §0 — Preambolo esecutivo

### Vincoli applicabili
- SMP1 — Principi e obblighi contrattuali
- SMP2 — Architettura vincolante
- SMP4 — Guardrail (principale + satellite)
- SMP5 — Tribunale (GO / NO-GO)

### Divieti specifici
- È VIETATO introdurre architettura, stack o runtime
- È VIETATO includere codice, SQL o pseudo-codice
- È VIETATO proporre alternative o “miglioramenti”

### Punti di verifica SMP5
- Presenza clausola completa
- Coerenza gerarchica esplicita
- Linguaggio normativo non ambiguo

---

## §1 — Stack operativo consentito (solo richiamo)

### Vincoli applicabili
- SMP2 — Stack-lock
- SMP4 — Blacklist assoluta

### Divieti specifici
- È VIETATO elencare stack alternativi
- È VIETATO giustificare o comparare scelte

### Punti di verifica SMP5
- Assenza riferimenti legacy
- Allineamento completo allo stack-lock

---

## §2 — Contratti di ingresso/uscita (criteri)

### Vincoli applicabili
- SMP4 — Sicurezza e validazione
- SMP5 — Verificabilità tramite test

### Divieti specifici
- È VIETATO definire payload completi di esempio
- È VIETATO introdurre endpoint non previsti

### Punti di verifica SMP5
- Evidenze validazione input
- Evidenze sanitizzazione output

### Regole
- Validazione input **deterministica e schema-based**,  
  con definizione esplicita degli schemi come richiesto  
  dal **satellite SMP4**
- Modello di errore coerente e non rivelatorio

---

## §3 — Sicurezza applicativa (P0)

### Vincoli applicabili
- SMP4 — Guardrail sicurezza
- SMP5 — Test security obbligatori

### Divieti specifici
- È VIETATO wildcard CORS o cookie
- È VIETATO logging di PII o segreti
- È VIETATO bypass “solo dev”

### Punti di verifica SMP5
- Curl test security
- Report conformità

---

## §4 — Accesso dati Postgres (policy)

### Vincoli applicabili
- SMP2 — Layer dati
- SMP4 — Anti-spaghetti
- SMP4 Satellite — Template consentiti

### Divieti specifici
- È VIETATO driver o ORM non autorizzati
- È VIETATO bypass del layer dati

### Punti di verifica SMP5
- Test transazioni
- Evidenze isolamento

---

## §4-bis — Struttura directory vincolante (richiamo SMP4 Satellite)

### Vincoli applicabili
- SMP4 Satellite — Sezione 2 (Struttura directory obbligatoria)
- SMP5 — Verifica strutturale repository

### Divieti specifici
- È VIETATO definire strutture directory arbitrarie
- È VIETATO accorpare config, middleware e logica applicativa
- È VIETATO introdurre directory non previste senza update SMP4

### Punti di verifica SMP5
- Confronto tree repository ↔ SMP4 Satellite §2
- Evidenza struttura nel Report Tribunale

### Regola
La struttura directory definita nel satellite SMP4  
è **OBBLIGATORIA e NON DEROGABILE**.  
Qualsiasi deviazione è **P0 (STOP-THE-LINE)**.

---

## §5 — Resilienza, circuit breaker, timeout

### Vincoli applicabili
- SMP4 — No fallback impliciti
- SMP5 — Affidabilità verificabile

### Divieti specifici
- È VIETATO retry infinito
- È VIETATO degrade silenzioso

### Punti di verifica SMP5
- Test failure
- Evidenze comportamento deterministico

---

## §6 — Observability e audit trail

### Vincoli applicabili
- SMP4 — Logging sicuro
- SMP5 — Compliance

### Divieti specifici
- È VIETATO esporre stack trace al client
- È VIETATO loggare segreti

### Punti di verifica SMP5
- Sentry scrub attivo
- Audit trail eventi sensibili

---

## §7 — Health, readiness, liveness

### Vincoli applicabili
- SMP4 — Health reale
- SMP5 — Test health obbligatori

### Divieti specifici
- È VIETATO always-200
- È VIETATO health fittizio

### Punti di verifica SMP5
- Curl health
- Degradazione corretta a 503

---

## §8 — Webhook Stripe (criteri)

### Vincoli applicabili
- SMP4 — Sicurezza esterna
- SMP5 — Idempotenza

### Divieti specifici
- È VIETATO processare webhook non verificati
- È VIETATO loggare payload sensibili

### Punti di verifica SMP5
- Evidenza verifica firma
- Test replay

---

## §9 — Vincoli integrazione Frontend (Netlify)

### Vincoli applicabili
- SMP2 — Separazione FE/BE
- SMP4 — Zero legacy
- SMP5 — Test CORS

### Divieti specifici
- È VIETATO introdurre auth legacy
- È VIETATO workaround esterni

### Punti di verifica SMP5
- Curl CORS
- Assenza riferimenti legacy FE

---

## §9-bis — Vincoli multi-tenant (se applicabile)

### Vincoli applicabili
- SMP4 — Isolamento tenant
- SMP5 — Test multi-tenant §7.2

### Divieti specifici
- È VIETATO accesso cross-tenant
- È VIETATO isolamento solo logico non verificabile
- È VIETATO multi-tenant implicito

### Punti di verifica SMP5
- Test isolamento tenant
- Report dedicato Tribunale

### Applicabilità (vincolante)
Questa sezione è **APPLICABILE se e solo se** esiste  
un concetto operativo di tenant / restaurant isolation  
come definito in SMP2, SMP4 o SMP5.

Se non esiste alcuna separazione tenant dichiarata  
nei documenti superiori,  
questa sezione è **NON APPLICABILE**.

In tal caso è **VIETATO** introdurre qualsiasi forma  
di multi-tenant implicito o dedotto (**STOP-THE-LINE**).

---

## §10 — Anti-spaghetti hardening (P0)

### Vincoli applicabili
- SMP4 — Anti-deriva
- SMP5 — Checklist anti-spaghetti

### Divieti specifici
- È VIETATO codice storico commentato
- È VIETATO stato nascosto
- È VIETATO doppio SSOT

### Regola chiave
Codice incompatibile = **RISCRITTO o ELIMINATO**.  
Nessuna eccezione.

---

## §11 — Artefatti, commit, evidence

### Vincoli applicabili
- SMP5 — Evidence Pack

### Divieti specifici
- È VIETATO approvare senza prove
- È VIETATO giudizio “a sensazione”

### Punti di verifica SMP5
- SHA commit
- Report Tribunale conforme

---

## §12 — Trigger STOP-THE-LINE

### Vincoli applicabili
- SMP4 — Blacklist
- SMP5 — Quick reference

### Trigger P0  
**(Esempi — lista completa e vincolante in SMP4 §13)**

L’assenza di un caso in questo elenco  
**NON implica** che esso non sia classificabile come P0.

---

## §13 — Dichiarazione finale di conformità

SMP3 v2.2 è **conforme a SMP4 v1.3 (documento principale + satellite)**  
ed è **giudicabile integralmente** da **SMP5 v2.2**.

Qualsiasi modifica a SMP1, SMP2, SMP4 o SMP5  
impone **riallineamento obbligatorio** di SMP3.

**Nessuna deroga è ammessa.**

---

# FINE FILE — SMP PARTE 3 (v2.2)

