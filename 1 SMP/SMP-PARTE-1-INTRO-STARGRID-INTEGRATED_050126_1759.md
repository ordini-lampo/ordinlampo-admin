# ============================================================
# STARGRID MASTER PROJECT (SMP) - PARTE 1/5
# ============================================================
# SEZIONE A: INTRO + SYSTEM CONTRACT
# ============================================================
# Codice: SMP-V7.0-INTEGRATED
# Data: 24 Dicembre 2025
# Revisione: 05 Jan 2026 17:59 CET — Stack-lock Railway/Netlify/Stripe/Sentry + Guardrail AI-EXEC
# Encoding: UTF-8 (senza caratteri legacy)
# Autori: Claude Opus 4.5 + ChatGPT 5.2 BULLDOZER + Claude Integration
# Committente: Paolo Pizzo - Founder Ordini-Lampo
# Target righe questa sezione: ~650
# ============================================================


CLAUSOLA DI SUBORDINAZIONE GERARCHICA (VINCOLANTE)

Questo documento costituisce il LIVELLO GERARCHICO MASSIMO del sistema SMP.
SMP1 definisce i principi, i vincoli e gli obblighi fondamentali del progetto.

Nessun altro documento SMP, nessuna appendice, nessuna implementazione,
nessun codice, test, decisione o giudizio può derogare, reinterpretare
o limitare quanto stabilito in SMP1.

Qualsiasi documento o artefatto non conforme a SMP1
è da considerarsi NON VALIDO (STOP-THE-LINE).

La numerazione SMP non ha valore gerarchico:
l’autorità di SMP1 è assoluta e non subordinata.

Questa clausola deve essere considerata sempre letta e applicata
prima di qualsiasi altra sezione del documento.


---

# INDICE PARTE 1 - INTRO + SYSTEM CONTRACT

```
+==============================================================+
|              SMP PARTE 1/5 - SEZIONE A: INTRO                |
+==============================================================+
|                                                              |
|  A.1   Executive Summary                                     |
|  A.2   Vision e Mission                                      |
|  A.3   Value Proposition                                     |
|  A.4   Stakeholder Map                                       |
|  A.5   Glossario Tecnico                                     |
|  A.6   I 21 Moduli - Overview                                |
|  A.7   Grafo Dipendenze                                      |
|  A.8   Vendor Inventory + SLA                                |
|  A.9   Cost Projection                                       |
|  A.10  Success Metrics (KPI)                                 |
|  A.11  System Contract (NON negoziabile)                     |
|  A.12  SLO/SLI + Alerting Routing                            |
|  A.13  Ownership (DRI/RACI)                                  |
|  A.14  Dev Workflow                                          |
|  A.15  DR Targets (RTO/RPO)                                  |
|                                                              |
+==============================================================+
```


---

## SCOPO DOCUMENTO

Single Source of Truth per:
- Due diligence tecnica (investitori)
- Audit SOC2 (controlli + evidenze)
- Onboarding dev senior in 7 giorni
- Incident Response + Disaster Recovery (DR)

## SCOPO ESECUTIVO PER AI (VINCOLANTE)

Questo file è **SSOT** anche per implementazioni effettuate da AI.

Regole operative (non negoziabili):
- Ogni requisito deve essere **esplicito** in un documento SMP/Libretto.
- Se un requisito manca o è ambiguo → **STOP-THE-LINE** (non inventare).
- Ogni decisione implementativa deve citare la sezione sorgente (SMP/Libretto).
- Se il codice o uno schema contraddice questo file → il codice/schema è da **riscrivere**.

## STACK-LOCK CANONICO (VINCOLO)

Stack unico consentito (core):
- **Railway**: backend + database PostgreSQL
- **Netlify**: frontend hosting
- **Stripe**: billing / pagamenti
- **Sentry**: osservabilità (marginale)

Qualsiasi riferimento operativo a stack alternativi è classificato come **BUG P0** e va rimosso o riscritto.

## CONTRATTO ANTI-SPAGHETTI (VINCOLANTE PER QUALSIASI AI CHE SCRIVE CODICE)

Obiettivo: impedire che un’AI “riempia i vuoti” con design arbitrari.

Regole:
1. **Default-Deny**: ogni feature/comportamento NON esplicitamente richiesto è vietato.
2. **Traceability**: ogni endpoint, tabella, campo, job, regola di business deve citare:
   - (a) SMP parte X se è regola di sistema, oppure
   - (b) Libretto N°Y se è requisito di modulo.
3. **Nessuna Invenzione**:
   - Se manca un dettaglio (es. stato ordine, nome colonna, evento webhook) → STOP.
4. **Comparti Stagni**:
   - Un modulo non può leggere/scrivere dati di un altro modulo senza interfaccia dichiarata.
5. **Idempotenza obbligatoria**:
   - Ogni azione “write” deve essere idempotente o protetta da chiave idempotency.
6. **Error Budget**:
   - Qualsiasi scelta che riduce affidabilità (retry non controllati, side effects duplicati) è vietata.
7. **Security-First**:
   - Nessuna route state-changing senza session + CSRF + permesso.
8. **Migrations come verità**:
   - Se schema DB cambia → migrazione versionata (MIG) obbligatoria.
9. **Test Gate**:
   - Ogni comportamento critico deve avere test (TST) prima del deploy.
10. **Log/Audit**:
   - Ogni azione sensibile deve generare audit log (AUD) e/o event log.

Se una di queste regole è violata → STOP-THE-LINE.

## RELAZIONE SMP ↔ LIBRETTI (BIBBIA OPERATIVA)

- SMP definisce **la cornice** (vincoli, governance, stack-lock, metodi).
- I Libretti definiscono **il contenuto implementativo** (API, schema, flussi, edge-case).
- Nessun Libretto può contraddire SMP.
- Nessun codice può contraddire SMP o il Libretto di competenza.

Regola pratica per AI:
- Per implementare un modulo: leggere **SMP1** + **SMP4** + **SMP5** + il **Libretto del modulo**.
- Se manca un libretto o una sezione → STOP.

## STOP-THE-LINE — CASI TIPICI (RIPETIZIONE DIFENSIVA)

STOP immediato se:
- compare un vendor non nel core stack (salvo se marcato “non-core” nel modulo specifico)
- compare auth provider legacy (es. provider esterni) al posto di session-cookie
- compare DB esterno al Postgres Railway
- compare hosting frontend diverso da Netlify
- compare billing diverso da Stripe
- compare “TODO: decide later” su elementi implementativi senza bloccare


## REGOLA D'ORO

```
+----------------------------------------------------------+
|                                                          |
|  "SE NON E' ENFORCEABLE + VERIFICABILE, NON ESISTE"      |
|                                                          |
|  Enforceable: gate CI / policy DB / guardrail runtime    |
|  Verificabile: query SQL / metriche / runbook comandi    |
|                                                          |
+----------------------------------------------------------+
```


---

## A.1 EXECUTIVE SUMMARY

### Il Problema

```
+==============================================================+
|  I ristoranti italiani perdono 25-35% dei ricavi             |
|  in commissioni a Deliveroo, Glovo, JustEat.                 |
|                                                              |
|  Un ristorante con EUR 100.000/anno di delivery paga:        |
|  - EUR 25.000-35.000 in commissioni                          |
|  - Spesso il margine NETTO del ristorante                    |
|                                                              |
|  Risultato: Lavorano gratis per le piattaforme.              |
+==============================================================+
```

### La Soluzione

```
+==============================================================+
|                      ORDINI-LAMPO                            |
+==============================================================+
|                                                              |
|  Cliente scansiona QR --> Ordina via WhatsApp/Telegram       |
|  Ristorante riceve ordine DIRETTO                            |
|  Fee fissa: EUR 0.78-1.20 per ordine (vs 25-35%)             |
|                                                              |
|  RISPARMIO: EUR 20.000+/anno per ristorante medio            |
|                                                              |
+==============================================================+
```

### Numeri Chiave

| Metrica | Valore | Note |
|---------|--------|------|
| Target market | 5.000+ ristoranti | Solo Liguria iniziale |
| Fee media | EUR 0.98/ordine | Mix piani |
| Ordini medi/ristorante | 15/giorno | Conservativo |
| Revenue/ristorante/mese | EUR 441 | 15 x 30 x EUR 0.98 |
| Target 100 ristoranti | EUR 44.100/mese | Anno 1 |
| Target 500 ristoranti | EUR 220.500/mese | Anno 2 |
| Margine lordo | ~85% | Costi infra minimi |

### Stato Attuale

| Componente | Stato | Score |
|------------|-------|-------|
| Architettura | Definita | 78/100 |
| Stack tecnologico | Migrato | 82/100 |
| Documentazione | In corso | 72/100 |
| MVP funzionante | Parziale | 65/100 |
| Clienti pilota | 0 | 0/100 |
| **GLOBALE** | **NON PRONTO** | **72/100** |

### Target Lancio

| Milestone | Data | Score richiesto |
|-----------|------|-----------------|
| MVP Completo | 31 Dic 2025 | 81/100 |
| Primo pilota | 6 Gen 2026 | 85/100 |
| 10 ristoranti | 28 Feb 2026 | 90/100 |
| 50 ristoranti | 30 Apr 2026 | 93/100 |


---

## A.2 VISION E MISSION

### Vision (Dove vogliamo arrivare)

```
Diventare l'infrastruttura standard per gli ordini diretti
dei ristoranti italiani, eliminando l'intermediazione
parassitaria delle piattaforme delivery.

In 5 anni: 10.000 ristoranti, EUR 50M ARR, exit o IPO.
```

### Mission (Come ci arriviamo)

```
Costruire la piattaforma piu' semplice e affidabile
per ricevere ordini via WhatsApp/Telegram,
con pricing trasparente e supporto dedicato
ai ristoratori che non parlano italiano.
```

### Valori Fondativi

| Valore | Significato | Applicazione |
|--------|-------------|--------------|
| **MEGLIO O NIENTE** | Qualita' prima di velocita' | Score 96+ o non si lancia |
| **TRASPARENZA** | Pricing chiaro, no sorprese | Fee fissa, no percentuali |
| **SEMPLICITA'** | Usabile senza formazione | QR -> WhatsApp -> Ordine |
| **AFFIDABILITA'** | Zero ordini persi | Outbox + retry + fallback |
| **RISPETTO** | Per ristoratori e clienti | Supporto multilingue |


---

## A.3 VALUE PROPOSITION

### Per il Ristoratore

| Pain Point | Soluzione Ordini-Lampo | Beneficio |
|------------|------------------------|-----------|
| Commissioni 25-35% | Fee fissa EUR 0.78-1.20 | Risparmio EUR 20K+/anno |
| Ordini telefonici confusi | Ordine scritto preciso | Zero errori |
| Barriera linguistica | Cliente scrive, non parla | Comprensione 100% |
| Dipendenza piattaforme | Canale proprietario | Indipendenza |
| Nessun dato cliente | Database clienti proprio | Marketing diretto |

### Per il Cliente Finale

| Pain Point | Soluzione Ordini-Lampo | Beneficio |
|------------|------------------------|-----------|
| App da scaricare | QR -> WhatsApp (gia' installato) | Zero friction |
| Attesa telefonica | Ordine immediato | Tempo risparmiato |
| Errori comunicazione | Ordine scritto confermato | Precisione |
| Prezzi gonfiati delivery | Prezzi menu reali | Risparmio |

### Unique Selling Proposition

```
+==============================================================+
|                                                              |
|  "L'UNICO SISTEMA CHE USA WHATSAPP/TELEGRAM                  |
|   SENZA COMMISSIONI PERCENTUALI"                             |
|                                                              |
|  Deliveroo: 25-35% + app cliente                             |
|  Glovo: 25-35% + app cliente                                 |
|  Ordini-Lampo: EUR 0.78-1.20 fisso + WhatsApp/Telegram       |
|                                                              |
+==============================================================+
```

### Scelta Canale Cliente

```
+----------------------------------------------------------+
|                                                          |
|      [LOGO RISTORANTE]                                   |
|                                                          |
|   Dove vuoi ricevere la conferma del tuo ordine?         |
|                                                          |
|  +-------------+          +-------------+                |
|  |  WhatsApp   |          |  Telegram   |                |
|  |     [W]     |          |     [T]     |                |
|  +-------------+          +-------------+                |
|                                                          |
|  WhatsApp: 95%+ italiani ce l'hanno                      |
|  Telegram: Gratuito, API stabile, fallback               |
|                                                          |
+----------------------------------------------------------+
```


---

## A.4 STAKEHOLDER MAP

### Stakeholder Primari

| Stakeholder | Ruolo | Interesse | Potere |
|-------------|-------|-----------|--------|
| **Paolo Pizzo** | Founder/CEO | Successo progetto | ALTO |
| **Ristoratori** | Clienti paganti | Risparmiare, semplificare | ALTO |
| **Clienti finali** | Utenti ordinanti | Comodità, velocità | MEDIO |
| **Investitori** | (Futuri) finanziatori | ROI, exit | ALTO |

### Stakeholder Secondari

| Stakeholder | Ruolo | Interesse | Potere |
|-------------|-------|-----------|--------|
| **Railway** | Infra provider (core) | Revenue | MEDIO |
| **Netlify** | Frontend hosting (core) | Traffic | BASSO |
| **Stripe** | Payment processor (core) | Volume transazioni | MEDIO |
| **Sentry** | Observability (core) | Usage | BASSO |
| **WhatsApp gateway** | Provider integrazione MSG (non-core) | Volume messaggi | MEDIO |

### Matrice Potere/Interesse (senza legacy)

```
          +---------------+----------------------------+
          |   ALTO POTERE |                            |
          |               |   Paolo / Investitori      |
          |               |   Ristoratori (key)        |
          +---------------+----------------------------+
   BASSO  |               |                            |
INTERESSE |   Netlify     |   Railway / Stripe (core)  |
          |   Sentry      |   WhatsApp gateway (non-core) |
          +---------------+----------------------------+
```

## A.5 GLOSSARIO TECNICO (STACK-LOCK)

### Termini Business

| Termine | Definizione operativa |
|---------|------------------------|
| Tenant | Singolo ristorante cliente (unità di isolamento dati) |
| Ordine | Entità business con stato e idempotency key |
| Fee | Costo per ordine secondo piano tariffario |
| Credit | Unità contabile usata per scalare le fee |
| Churn | Abbandono del tenant (disdetta) |
| ARR/MRR | Ricavi ricorrenti annuali/mensili |

### Termini Tecnici (CORE)

| Termine | Definizione operativa |
|---------|------------------------|
| Railway | PaaS core per esecuzione backend + Postgres |
| PostgreSQL | Database relazionale su Railway (single source dati) |
| Netlify | Hosting frontend (build/deploy da Git) |
| Stripe | Billing, piani, pagamenti, fatturazione |
| Sentry | Error tracking / tracing / alerting (osservabilità) |
| Session-cookie | Auth basata su cookie di sessione (HTTPOnly, Secure, SameSite) |
| CSRF | Protezione richieste state-changing (token/headers) |
| RBAC | Ruoli/permessi (superadmin/admin/staff/…) |
| Multi-tenant | Isolamento dati per tenant (policy + query scoping) |
| Idempotency | Protezione da doppie esecuzioni (chiavi idempotenti) |
| Audit log | Traccia immutabile di azioni sensibili |

## A.6 I 21 MODULI - OVERVIEW (CANONICO)

### Moduli Core (15)

| N | Codice | Nome (esteso) | Responsabilità (1 riga) | Priorità |
|---|--------|---------------|--------------------------|----------|
| 1 | GOV | GOVERNANCE | Auth session, sicurezza, tenant base, config | P0 |
| 2 | COR | CORE | Domini base (ordini, ristoranti, clienti) | P0 |
| 3 | PAS | PASSPORT | Profili utenti, ruoli, permessi (RBAC) | P0 |
| 4 | ENG | ENGINE | State machine ordini, processing | P0 |
| 5 | MNU | MENU | Menu, categorie, prodotti, varianti | P0 |
| 6 | MSG | MESSAGING | Integrazioni messaggi (WhatsApp gateway) | P1 |
| 7 | VAU | VAULT | Billing Stripe, crediti, fatture | P1 |
| 8 | SHW | SHOWROOM | Landing pubblica, vetrina, QR, onboarding | P2 |
| 9 | RAD | RADAR | Analytics, dashboard metriche | P2 |
| 10 | NTF | NOTIFICATIONS | Notifiche (email/push) + alert di sistema | P2 |
| 11 | TRF | TARIFFE | Piani pricing, fee, regole commissioni | P1 |
| 12 | REF | REFERRAL | Programma segnalazioni/crediti | P2 |
| 13 | OPS | OPERATIONS | Runbook operativo, incident management | P1 |
| 14 | GRD | GUARD | Rate limiting, anti-abuse, protezioni | P0 |
| 15 | LEG | LEGAL | GDPR, termini, policy dati, compliance | P1 |

### Moduli Collaterali (6)

| N | Codice | Nome (esteso) | Responsabilità (1 riga) | Priorità |
|---|--------|---------------|--------------------------|----------|
| 16 | AUD | AUDIT | Logging strutturato, audit trail | P1 |
| 17 | BAK | BACKUP | Backup, retention, restore drills | P1 |
| 18 | MIG | MIGRATION | Migrazioni DB, versioning schema | P0 |
| 19 | TST | TESTING | Test framework, fixtures, CI gates | P2 |
| 20 | DOC | DOCUMENTATION | Docs tecnici + API specs | P2 |
| 21 | MON | MONITORING | Health checks, alert routing, Sentry rules | P1 |

### Legenda Priorità (vincolante)

| Priorità | Significato | Conseguenza |
|----------|-------------|-------------|
| P0 | Bloccante MVP | Non si procede oltre |
| P1 | Necessario lancio | Completo prima di scale |
| P2 | Post-lancio | Ammesso dopo MVP stabile |

## A.7 GRAFO DIPENDENZE MODULI (CANONICO)

### Principio
- **GOV** è fondazione (nessuna dipendenza).
- Ogni modulo deve dichiarare dipendenze **minime**.
- Dipendenze circolari → **FAIL**.

### Dipendenze Core (alto livello)

```
                    +-------+
                    |  GOV  |
                    +---+---+
                        |
          +-------------+-------------------+
          |             |                   |
      +---v---+     +---v---+           +---v---+
      |  PAS  |     |  GRD  |           |  AUD  |
      +---+---+     +-------+           +-------+
          |
      +---v---+
      |  COR  |
      +---+---+
          |
   +------+------+------+------+
   |      |      |      |      |
 + v +  + v +  + v +  + v +  + v +
 ENG    MNU    TRF    MSG    VAU
  |                    |       |
  +---------+----------+       |
            |                  |
           NTF                REF
            |
           RAD

(OPS/LEG/BAK/MIG/TST/DOC/MON agganciati come moduli trasversali)
```

### Matrice Dipendenze (minima)

| Modulo | Dipende da |
|--------|------------|
| GOV | Nessuno |
| PAS | GOV |
| GRD | GOV |
| AUD | GOV |
| COR | GOV, PAS |
| ENG | GOV, COR, PAS |
| MNU | GOV, COR |
| TRF | GOV, COR |
| VAU | GOV, COR, TRF |
| MSG | GOV, COR |
| NTF | GOV, MSG |
| RAD | GOV, ENG, VAU |
| REF | GOV, COR, VAU |
| OPS | GOV, AUD, MON |
| LEG | GOV, PAS |
| BAK | GOV, MON |
| MIG | GOV |
| TST | GOV, COR |
| DOC | GOV |
| MON | GOV |

### Ordine Implementazione (Wave)

```
Wave 0: GOV
Wave 1: PAS, GRD, AUD, MIG
Wave 2: COR, LEG, BAK, MON
Wave 3: ENG, MNU, TRF
Wave 4: MSG, VAU, OPS
Wave 5: REF, SHW, RAD, NTF
Wave 6: TST, DOC
```

## A.8 VENDOR INVENTORY + SLA (STACK-LOCK)

### Vendor CORE (non negoziabili)

| Componente | Vendor | Criticità | Nota |
|------------|--------|----------|------|
| Backend runtime | Railway | ALTA | Core execution |
| Database | Railway PostgreSQL | ALTA | Core data store |
| Frontend hosting | Netlify | ALTA | UI delivery |
| Billing | Stripe | ALTA | Revenue critical |
| Observability | Sentry | MEDIA | Error visibility |

### Dipendenze ESTERNE (non-core, ma operative)

| Componente | Vendor/Tool | Criticità | Nota |
|------------|-------------|----------|------|
| WhatsApp gateway | (da definire) | ALTA | Non è “stack core”; va documentato in MSG |
| Email provider | (da definire) | MEDIA | Usato da NTF |
| DNS/Dominio | (da definire) | MEDIA | Infra di contorno |

### SLA (valori indicativi da verificare sui vendor)

| Vendor | SLA uptime | Fallback |
|--------|------------|----------|
| Railway | 99.9% | Restore/scale/region plan |
| Netlify | 99.99% | CDN redundancy |
| Stripe | 99.99% | N/A (critical) |
| Sentry | 99.9% | Logging locale + DB audit |

Nota: se uno SLA ufficiale diverge → aggiornare qui e propagare in OPS/MON.

## A.9 COST PROJECTION

### Scenario 100 Ristoranti (Anno 1)

| Voce | Calcolo | Mensile | Annuale |
|------|---------|---------|---------|
| **REVENUE** | | | |
| Ordini | 100 x 15/day x 30 x EUR 0.98 | EUR 44.100 | EUR 529.200 |
| **COSTI** | | | |
| Infrastruttura | Vedi vendor | EUR 150 | EUR 1.800 |
| WATI messages | 45K msg x EUR 0.02 | EUR 900 | EUR 10.800 |
| Stripe fees | 2.9% su EUR 44K | EUR 1.279 | EUR 15.348 |
| Sentry | Free | EUR 0 | EUR 0 |
| **TOTALE COSTI** | | EUR 2.329 | EUR 27.948 |
| **MARGINE LORDO** | | EUR 41.771 | EUR 501.252 |
| **MARGINE %** | | **94.7%** | |

### Scenario 500 Ristoranti (Anno 2)

| Voce | Calcolo | Mensile | Annuale |
|------|---------|---------|---------|
| **REVENUE** | | | |
| Ordini | 500 x 15/day x 30 x EUR 0.98 | EUR 220.500 | EUR 2.646.000 |
| **COSTI** | | | |
| Infrastruttura | Scale up | EUR 500 | EUR 6.000 |
| WATI messages | 225K msg x EUR 0.02 | EUR 4.500 | EUR 54.000 |
| Stripe fees | 2.9% | EUR 6.395 | EUR 76.740 |
| Support FTE | 1 persona | EUR 2.500 | EUR 30.000 |
| **TOTALE COSTI** | | EUR 13.895 | EUR 166.740 |
| **MARGINE LORDO** | | EUR 206.605 | EUR 2.479.260 |
| **MARGINE %** | | **93.7%** | |

### Break-even Analysis

| Metrica | Valore |
|---------|--------|
| Costi fissi mensili | EUR 150 |
| Costo variabile/ordine | EUR 0.04 (WATI + Stripe) |
| Revenue/ordine | EUR 0.98 |
| Margine/ordine | EUR 0.94 |
| Break-even ordini/mese | 160 (~5 ristoranti) |

### Ottimizzazione Costi con Telegram

| Scenario | WATI only | WATI + Telegram 50/50 | Risparmio |
|----------|-----------|----------------------|-----------|
| 100 ristoranti | EUR 900/mese | EUR 450/mese | EUR 450/mese |
| 500 ristoranti | EUR 4.500/mese | EUR 2.250/mese | EUR 2.250/mese |


---

## A.10 SUCCESS METRICS (KPI)

### KPI Primari (Business)

| KPI | Target MVP | Target Anno 1 | Target Anno 2 |
|-----|------------|---------------|---------------|
| Ristoranti attivi | 5 | 100 | 500 |
| Ordini/giorno | 75 | 1.500 | 7.500 |
| MRR | EUR 2.200 | EUR 44.100 | EUR 220.500 |
| Churn mensile | <10% | <5% | <3% |
| NPS | >30 | >50 | >70 |

### KPI Tecnici

| KPI | Target | Allarme |
|-----|--------|---------|
| Uptime | 99.9% | <99.5% |
| Latency p95 | <500ms | >1000ms |
| Error rate | <0.1% | >1% |
| Message delivery (WATI) | 99.5% | <98% |
| Message delivery (Telegram) | 99.9% | <99% |
| Cold start | <1s | >2s |

### KPI Operativi

| KPI | Target | Allarme |
|-----|--------|---------|
| Tempo onboarding | <1 ora | >4 ore |
| Ticket response | <4 ore | >24 ore |
| Bug fix critico | <4 ore | >24 ore |
| Deploy frequency | 2/settimana | <1/mese |


---

## A.11 SYSTEM CONTRACT (NON negoziabile)

### A.11.1 In-Scope

| Area | Descrizione |
|------|-------------|
| **Core Journey** | QR --> Web App --> Create Order |
| **Messaging** | WhatsApp via WATI (primario), Telegram (secondario) |
| **Billing** | Stripe + ledger/credit con reconciliation |
| **Multi-tenant** | Isolamento dati e accessi per restaurant |
| **Retry/DLQ** | Outbox pattern con replay controllato |

### A.11.2 Out-of-Scope

| Area | Motivo |
|------|--------|
| Real-time delivery guarantee | Gestito con SLO + fallback + DLQ |
| Memorizzazione carte | PCI scope - solo Stripe hosted |
| Marketplace/logistica | Non e' il nostro business |
| POS fisico | Fase 3+ |
| Chat customer care | Solo messaggi transazionali ordine |

### A.11.3 Invarianti HARD

```
+==============================================================+
|  INVARIANTI - SE LI ROMPI, PERDI FIDUCIA/SOLDI               |
+==============================================================+
|                                                              |
|  1. NO SILENT FAILURE                                        |
|     Ogni fallimento mission-critical = log + metrica + DLQ   |
|                                                              |
|  2. IDEMPOTENZA OVUNQUE                                      |
|     Ogni operazione write e' ripetibile senza duplicare      |
|                                                              |
|  3. OUTBOX OBBLIGATORIA                                      |
|     Side-effects MAI inline, SEMPRE via queue                |
|                                                              |
|  4. TENANT ISOLATION                                         |
|     Niente query senza filtro restaurant_id                  |
|                                                              |
|  5. AUDITABILITY                                             |
|     Ogni transizione e side-effect e' tracciato              |
|                                                              |
+==============================================================+
```

### A.11.4 Definizione DOWN

Sistema DOWN se UNO QUALSIASI e' vero:

| Condizione | Soglia |
|------------|--------|
| Create Order success | < 98.5% su 30m |
| Outbox lag | > 180s persistente |
| DLQ growth | Non drenata |
| Stripe webhook backlog | > 50 eventi per > 10m |
| DB connection errors | > 0.5% su 15m |


---

## A.12 SLO/SLI + ALERTING ROUTING

### A.12.1 SLO (Pilot)

| Area | SLI | Target | Finestra | Severity | Azione |
|------|-----|--------|----------|----------|--------|
| Create Order | success rate | >= 99.5% | 30m | P1 | page Backend+SRE |
| Create Order | p95 latency | <= 800ms | 30m | P2 | ticket |
| Outbox | p95 lag | <= 60s | 15m | P1 | page SRE |
| Outbox | dead-letter rate | <= 0.5% | 60m | P1 | page Backend |
| WATI send | success rate | >= 99.0% | 60m | P1 | page Backend |
| Telegram send | success rate | >= 99.5% | 60m | P1 | page Backend |
| Stripe webhook | processed < 2m | >= 99.9% | 24h | P0 | page Backend+CTO |
| DB | connect error | <= 0.1% | 15m | P0 | page SRE+CTO |

### A.12.2 Routing Alert

| Severity | Chi | Come | Tempo risposta |
|----------|-----|------|----------------|
| **P0** | SRE + CTO + Backend DRI | Telefono | < 15 min |
| **P1** | SRE + Backend DRI | Telefono/Slack | < 30 min |
| **P2** | DRI | Ticket | < 4 ore |
| **P3** | Backlog | Async | Best effort |

> **NOTA**: In assenza di on-call, P0/P1 devono chiamare telefono (non solo chat).


---

## A.13 OWNERSHIP (DRI/RACI)

### A.13.1 DRI per Dominio

| Dominio | DRI | Backup | Note |
|---------|-----|--------|------|
| Orders (COR/ENG) | Paolo Pizzo | - | Core revenue |
| Messaging (MSG) | Paolo Pizzo | - | Provider risk (non-core) |
| Billing (VAU/Stripe) | Paolo Pizzo | - | Revenue critical |
| DB/DR (Railway Postgres) | Paolo Pizzo | - | RTO/RPO |
| Observability (Sentry) | Paolo Pizzo | - | Alerts must work |
| Security | Paolo Pizzo | - | Access + secrets |

> **NOTA**: Founder unico = DRI unico. Team futuro diversificherà.

### A.13.2 CODEOWNERS (minimo, senza legacy)

Regola: ogni path critico deve avere un owner. Se owner mancante → PR non mergeabile.

Esempio (da adattare ai repo reali):

```
# Backend (ordini-lampo-api)
/src/**                @paolo-pizzo
/migrations/**         @paolo-pizzo
/docs/**               @paolo-pizzo

# Frontend Admin (ordinilampo-admin)
/src/**                @paolo-pizzo
/netlify/**            @paolo-pizzo
```

## A.14 DEV WORKFLOW

### A.14.1 Ambienti

```
dev --> staging --> prod

REGOLA: Mai "dev = prod"
```

### A.14.2 Branching

| Branch | Scopo |
|--------|-------|
| `main` | Sempre deployable |
| `develop` | Integrazione |
| `feat/*` | Feature |
| `fix/*` | Bugfix |
| `release/YYYYMMDD` | Release |
| `hotfix/*` | Solo per P0/P1 |

### A.14.3 Gates PR (non bypassabili)

- [ ] Test idempotenza (create_order + stripe_webhook)
- [ ] Migration + rollback note (se schema cambia)
- [ ] Secret scanning
- [ ] Dependency audit
- [ ] "No PII in logs" lint

### A.14.4 Definition of Done (DoD)

Modulo NON e' "done" se manca:
- [ ] Doc aggiornata (SMP + libretto modulo)
- [ ] Metriche + alert definiti
- [ ] Runbook aggiornato
- [ ] Test staging passati (smoke + DLQ replay)


---

## A.15 DR TARGETS (RTO/RPO)

### A.15.1 Target

| Metrica | Target Pilot | Target Post-Pilot |
|---------|--------------|-------------------|
| **RPO** | <= 15 minuti | <= 5 minuti |
| **RTO** | <= 60 minuti | <= 30 minuti |

### A.15.2 Backup Strategy (stack-lock)

| Tipo | Frequenza | Retention | Tool/Note |
|------|-----------|-----------|----------|
| PITR | Continuo | (da definire) | Railway Postgres (verificare piano/feature) |
| Daily Snapshot | 1x/giorno | 30 giorni | pg_dump + storage (da definire) |
| Weekly Full | 1x/settimana | 90 giorni | pg_dump + storage (da definire) |

> **REGOLA**: se il piano Railway non consente PITR/retention coerenti con RPO, devi dichiararlo e adeguare i target o il piano.

### A.15.3 Scenari DR (minimo)

| Scenario | RTO Target | Procedura (alto livello) |
|----------|------------|--------------------------|
| API crash | 5–10 min | Railway auto-restart + health checks |
| DB corruption | 30–60 min | Restore da snapshot/PITR (se disponibile) |
| Region outage | 2 ore | Piano di migrazione manuale (documentare in OPS/BAK) |

