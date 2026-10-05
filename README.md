# PATHALIGN AI

**Aligning Dreams with Opportunities.**

PATHALIGN AI is a vocational career counselling platform for Indian secondary students and their
parents. It exists to solve a specific, measurable problem: Indian families routinely reject
vocational pathways — even good, well-paid ones — because of objections the student cannot answer
alone. Low salary, no job security, social status, safety, family pressure, and cost.

The platform answers those objections with **sourced, verification-status-carrying data**, lets the
student and parent each record their preferences independently, and never forces a single "right"
answer onto a family.

---

## What it does

| Capability | Where |
|---|---|
| AI counsellor that classifies the parent's real objection and answers it with sources | `/student/counsellor`, `/parent/counsellor` |
| Career Explorer — trades with fee, duration, NSQF level and **verification status** | `/student/careers` |
| Career assessment — 8 interest questions, scored transparently | `/student/assessment` |
| Career Simulator — earnings for a real state/district, plus side-by-side comparison | `/student/simulator` |
| Family Consensus — independent picks, overlap analysis, **never forces agreement** | `/student/consensus` |
| Confidence score — pre/post counselling, explicitly *not* psychological | `/student/confidence` |
| Career digital twin — four modelled pathways with costs and assumptions | `/student/twin` |
| Opportunity Radar — map of ITIs, polytechnics and vacancies near the family | `/student/radar` |
| Myth buster — sourced answers to common objections | `/student/myths` |
| Human escalation — support cases assigned to the least-loaded counsellor | `/student/cases` |
| Family Career Agreement Report — printable PDF for the whole family | `/student/reports` |
| Counsellor workspace — caseload, unassigned queue, appointments, sessions | `/counsellor` |
| Admin console — live resistance analytics, data imports, exports | `/admin` |

---

## Quick start

### 1. Prerequisites

- **Node.js 18.17+**
- **PostgreSQL with the `pgvector` extension**
- Docker (easiest way to get the database) or an existing PostgreSQL 14+ instance

### 2. Install and configure

```bash
npm install
cp .env.example .env      # then edit DATABASE_URL and AUTH_SECRET
```

`AUTH_SECRET` must be a long random string (32+ characters). Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start the database

```bash
docker run -d --name pathalign-pg \
  -e POSTGRES_USER=pathalign \
  -e POSTGRES_PASSWORD=pathalign \
  -e POSTGRES_DB=pathalign \
  -p 5433:5432 \
  pgvector/pgvector:pg16
```

### 4. Migrate and seed

```bash
npm run setup
```

This runs `prisma generate`, `prisma migrate deploy`, then the seed script. The seed loads the
career catalogue, training providers, knowledge base, and a set of **clearly-labelled synthetic
demo families** so every screen has something real to render.

### 5. Run

```bash
npm run dev        # http://localhost:3200
```

Sign in with any seeded demo account, or register a new family at `/register`.

---

## Verification

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run test        # vitest run  (114 tests, no database required)
npm run build       # next build
npm run verify      # all four, in order
```

`GET /api/health` reports database reachability, latency, AI provider status and catalogue size:

```json
{ "ok": true, "db": "up", "latencyMs": 4, "ai": { "provider": "demo", "mode": "demo" }, "trades": 18 }
```

When the database is unreachable it returns `"ok": false, "db": "down"` rather than crashing — the
app still serves public pages and login, so an operator can see the failure mode clearly.

---

## AI modes

The provider is selected by `AI_PROVIDER`:

| Mode | Behaviour | Requirements |
|---|---|---|
| `demo` (default) | Deterministic, template-based replies grounded in retrieved local knowledge. No network calls. | none |
| `openai` | Any OpenAI-compatible chat endpoint (OpenAI, OpenRouter, Groq, Ollama) | `OPENAI_API_KEY` |

If an LLM call fails at runtime the system falls back to the grounded demo generator and marks the
response `meta.usedFallback = true`, so a degraded answer is never mistaken for a model answer.

Retrieval is set by `RAG_MODE`: `lexical` uses the built-in BM25 implementation over
`KnowledgeDocument`; `vector` uses pgvector cosine similarity and requires embeddings.

---

## Design commitments

These are enforced in code and covered by tests, not just documented.

**1. Data provenance is never hidden.** Every trade, provider, salary record and knowledge chunk
carries a `verificationStatus` (`VERIFIED`, `PENDING_VERIFICATION`, `OUTDATED`, `UNAVAILABLE`,
`SYNTHETIC_DEMO`) and, where possible, a link to a `DataSource`. Synthetic demo records are rendered
with a distinct badge so they can never be mistaken for official government data. `isSynthetic`
records cannot display as `VERIFIED` even if their status field says so.

**2. The AI never forces agreement.** `analyzeConsensus` can return `NEEDS_DISCUSSION`, and the
summary text says so explicitly. Each participant records their own voluntary decision separately.
A counsellor pressing one side toward the other is an anti-pattern, not a feature.

**3. Chat is private by default.** Conversations are attached to a counsellor escalation only when
the family explicitly ticks "share conversation", which writes a `ConsentRecord`. The counsellor UI
shows an explicit notice when no conversation was shared, and says not to ask for it as a condition
of help.

**4. Scores are explained and bounded.** `computeConfidenceScore` and the assessment scorers are pure,
deterministic functions with clamped inputs — `computeConfidenceScore({})` returns `0`, not `NaN`.
Every score carries a plain-language interpretation and a disclaimer.

**5. Nothing is invented at request time.** Import batches are staged for review and only written to
the database on explicit approval. Admin analytics run as SQL aggregates, never as hardcoded
fixtures.

---

## Documentation

| Document | Contents |
|---|---|
| [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) | Layers, request flow, design decisions, extension points |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | All 38 models and 29 enums, relationships, indexing rationale |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Every route, auth requirement, request/response shape |
| [AI_IMPLEMENTATION.md](AI_IMPLEMENTATION.md) | Classifiers, retrieval, prompt construction, provider abstraction, fallbacks |
| [DATA_SOURCES.md](DATA_SOURCES.md) | Verification model, seed data, CSV import contract |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Production setup, env vars, migrations, backups, hardening |
| [TESTING_REPORT.md](TESTING_REPORT.md) | Test inventory and results |

---

## Known limitations

- **Rate limiting is per-process.** `src/lib/rate-limit.ts` is an in-memory fixed-window limiter. It
  works for a single Node instance; a multi-instance deployment needs Redis or an edge limiter.
- **SQLite is not supported.** Migrations use PostgreSQL-specific `generate_series` and pgvector.
- **No offline mobile app.** The UI is responsive and installable as a PWA-style shell, but there is
  no native build.
- **Seed data is synthetic.** Until real records are imported, dashboards show demo aggregates. The
  admin UI states this on the dashboard itself.

---

## Licence & attribution

Built for vocational counselling research and deployment. Career data derived from NCVT/NSQF-aligned
public sources; every imported record must cite its `DataSource`.
