# SYSTEM_ARCHITECTURE

Next.js 14 (App Router) + TypeScript + Prisma/PostgreSQL + pgvector.

---

## Layering

```
┌─────────────────────────────────────────────────────────────────┐
│  Presentation                                                    │
│  src/app/**/page.tsx        React Server/Client Components      │
│  src/components/**          Reusable UI (panels, shell, badges) │
├─────────────────────────────────────────────────────────────────┤
│  HTTP boundary                                                   │
│  src/app/api/**/route.ts    Route handlers — thin, no business  │
│                            logic; validate → call service → ok()│
├─────────────────────────────────────────────────────────────────┤
│  Domain services                                                 │
│  src/lib/services/**        Business logic, Prisma access        │
│  src/lib/ai/**              Classification, RAG, generation      │
├─────────────────────────────────────────────────────────────────┤
│  Platform                                                        │
│  src/lib/api.ts             Envelope, error mapping, logging    │
│  src/lib/auth/**            Password, sessions, RBAC guards      │
│  src/lib/validation/**      Zod schemas (single source of truth) │
│  src/lib/{db,logger,csv,utils,rate-limit,geo,india,speech}.ts   │
├─────────────────────────────────────────────────────────────────┤
│  Persistence                                                      │
│  prisma/schema.prisma · PostgreSQL 14+ · pgvector               │
└─────────────────────────────────────────────────────────────────┘
```

**The rule:** route handlers contain no business logic. They authenticate, parse, delegate, and
wrap the result. That keeps authorization decisions in one place (`requireUser`) and makes services
directly unit-testable without HTTP.

---

## Request flow — a counsellor escalation

This is the path that matters most, so it is worth tracing end to end.

```
Student types in the AI counsellor
  │
  ├─ POST /api/chat/conversations/[id]/messages
  │    ├─ requireUser()                       → session cookie → User
  │    ├─ rateLimit(clientKey(req,'chat'),20,60s)
  │    └─ sendAndReply()                      src/lib/ai/counsellor.ts
  │         ├─ analyzeMessage(text)           language / intent / concern / sentiment
  │         ├─ retrieve(text, {k:5})          BM25 (or pgvector) over KnowledgeDocument
  │         ├─ provider.chat(...)             LLM, or buildDemoReply() in demo mode
  │         │    └─ on LLM failure → demo fallback, meta.usedFallback = true
  │         └─ persist ChatMessage rows WITH their classification fields
  │
  └─ Family chooses "talk to a human"
       │
       └─ POST /api/cases
            ├─ requireUser(['STUDENT','PARENT','ADMIN'])
            ├─ createCase()                    src/lib/services/cases.ts
            │    ├─ resolve familyId from membership
            │    ├─ if shareConversation → ConsentRecord(granted: true)
            │    ├─ pickCounsellor()           min(openCases / maxActiveCases)
            │    │                             null if all at capacity
            │    ├─ create CounsellorCase      ASSIGNED, or PENDING if unassigned
            │    └─ Notification → counsellor
            └─ 201 with { assigned, message }

Counsellor workspace
  │
  ├─ GET /api/counsellor
  │    ├─ requireUser(['COUNSELLOR','ADMIN'])
  │    └─ Promise.all([ myCases, pendingCount, appointments,
  │                     openConcerns, escalatedCount, queue ])
  │
  ├─ GET /api/cases/[id]
  │    ├─ getCaseForUser()                    ownership or staff check
  │    └─ conversation attached ONLY if summaryShared || ADMIN || owner
  │         └─ otherwise null → counsellor UI shows the privacy notice
  │
  └─ PATCH /api/cases/[id]
       ├─ updateCase()                         status transition + optional note
       ├─ AdminAuditLog(CASE_UPDATE)
       └─ Notification → family owner
```

Note the ownership rule in `getCaseForUser`: **staff may read any case, but the transcript comes back
only when consent was given.** The counsellor UI renders an explicit notice in the null case rather
than hiding the section.

---

## Authentication & sessions

No third-party auth. Passwords are hashed with **scrypt** (`src/lib/auth/password.ts`) using a
per-password salt. Login generates 32 random bytes, stores **only the SHA-256 hash** in `Session`, and
sets the raw token in an `httpOnly`, `sameSite=lax` cookie named by `SESSION_COOKIE_NAME`. Session
expiry is `SESSION_TTL_HOURS` (default 72); `purgeExpiredSessions()` removes stale rows.

Guards (`src/lib/auth/guard.ts`):

```ts
requireUser(roles?)       // API routes → throws ApiError(401/403)
requireUserPage(roles?)   // pages     → redirect() to /login
```

Page guards run in the layout, so `/counsellor/**` and `/admin/**` are protected by construction —
adding a page under those trees cannot accidentally bypass the check.

---

## RBAC

| Capability | STUDENT | PARENT | COUNSELLOR | ADMIN |
|---|:--:|:--:|:--:|:--:|
| Own assessment / profile | ✅ | ✅ | — | ✅ |
| AI counsellor chat | ✅ | ✅ | — | ✅ |
| Family consensus (own side) | ✅ | ✅ | — | — |
| Raise support case | ✅ | ✅ | — | ✅ |
| Read any case transcript | own | own | **only if consented** | ✅ |
| Change case status | — | — | ✅ | ✅ |
| Counselling sessions | — | — | ✅ | ✅ |
| Analytics / catalogue / imports / exports | — | — | — | ✅ |

Every route calls `requireUser([...])` explicitly. There is no implicit role fallback — a route
without a guard is a bug, and the audit pass looks for exactly that.

---

## The AI pipeline

```
        user message
             │
    ┌────────▼─────────┐
    │ analyzeMessage   │  pure, synchronous, fully unit-tested
    │                  │  • detectLanguage   Devanagari/roman-Hindi → HI
    │                  │  • classifyIntent   10 intents
    │                  │  • classifyConcern  9 categories, weighted en/hi
    │                  │  • analyzeSentiment lexicon, normalised [-1,1]
    │                  │  • wantsHuman       explicit escalation regex
    └────────┬─────────┘
             │ AnalysisResult  (persisted on the message row)
             ▼
    ┌──────────────────┐
    │ retrieve()       │  RAG_MODE=lexical → BM25 over KnowledgeDocument
    │                  │  RAG_MODE=vector  → pgvector cosine (needs embeddings)
    └────────┬─────────┘  returns RetrievedChunk[] + sources
             ▼
    ┌──────────────────┐
    │ generation       │  AI_PROVIDER=demo   → buildDemoReply()  (no network)
    │                  │  AI_PROVIDER=openai → provider.chat()
    │                  │     └─ on throw → demo fallback + usedFallback=true
    └────────┬─────────┘
             ▼
     reply + sources + meta { provider, model, mode, usedFallback }
```

Classification is **pure and synchronous** so it can be tested exhaustively and runs identically in
demo and LLM mode. Retrieval and generation are the only I/O. See
[AI_IMPLEMENTATION.md](AI_IMPLEMENTATION.md).

---

## Scoring engines

Three deterministic, side-effect-free engines. All are pure functions with unit tests, which is why
they can be trusted in a domain where a wrong number does real damage to a family's decisions.

**Family Consensus** — `analyzeConsensus(studentPicks, parentPicks, studentConcerns, parentConcerns)`
normalises labels (case/punctuation-insensitive), computes overlap, and returns one of
`AGREED | PARTIALLY_AGREED | NEEDS_DISCUSSION`. It can and does return "needs discussion". Shared
concerns are detected across both sides. Score is `overlap / distinctUnion`, plus a small bonus when
concerns *don't* overlap — agreement on the problem matters too.

**Confidence** — `computeConfidenceScore(answers, phase)`: five dimensions × 0–4 answers → 0–20 each
→ sum 0–100. Inputs are clamped, and `{}` yields `0` rather than `NaN`. Explicitly an *awareness*
score, not psychological.

**Assessment** — `scoreStudentInterest` / `scoreParentExpectations` map questionnaire answers onto
named 0–100 dimensions. `clamp4()` treats missing or non-numeric answers as the neutral midpoint
instead of propagating `NaN`.

---

## Data provenance

The distinguishing design decision of this codebase.

Every catalogue record carries `verificationStatus` + `isSynthetic` + optional `sourceId`. Three
mechanisms enforce this:

1. **Pessimistic defaults.** `CareerTrade` defaults to `isSynthetic: true` and
   `verificationStatus: SYNTHETIC_DEMO`. A new record is unverified until an admin links a source.
2. **`isSynthetic` overrides status in the UI.** `VerificationBadge` renders `SYNTHETIC_DEMO`
   whenever `isSynthetic` is set, even if the status field says `VERIFIED`.
3. **Staging imports.** CSV uploads become `ImportBatch(status=PENDING_REVIEW)` and are never
   applied on upload — only on explicit approval, which writes an audit entry.

This is why an earnings figure can never be presented as a guarantee: the schema cannot represent
"verified official salary" without also representing where it came from.

---

## Frontend architecture

- **Server Components** by default; `'use client'` only where interactivity is needed.
- **`DashboardShell`** (`src/components/dashboard/shell.tsx`) wraps student, parent, counsellor and
  admin trees with the sidebar, header, notification badge and logout. Nav is role-keyed
  (`src/components/dashboard/nav.ts`).
- **`useApi<T>(path, deps)`** (`src/lib/hooks.ts`) is the single data-fetching hook: `{ data,
  loading, error, refetch, setData }`. Every dashboard screen uses it, which is why loading and error
  states look identical everywhere.
- **`apiFetch` / `apiJson`** unwrap the `{ ok, data, error }` envelope and throw `ApiClientError` with
  `status` and `details` on failure.
- Shared UI: `states.tsx` (`CardSkeleton`, `EmptyState`, `ErrorState`, `Progress`),
  `badges.tsx` (`VerificationBadge`, `RoleBadge`, `StatusBadge`).

---

## Observability

`src/lib/logger.ts` emits one JSON object per line:

```json
{"ts":"2026-01-15T09:30:12.004Z","level":"info","msg":"request ok","route":"/api/cases","method":"GET","status":200,"durationMs":18}
```

`withApi()` logs every request with route, method, status and duration, and maps errors to levels:
`ApiError ≥500` → `error`, `ApiError <500` → `warn`, `ZodError` → `warn` with issue count, anything
else → `error` with stack.

**Redaction is enforced in the logger, not at call sites.** `redact()` walks objects and arrays to
depth 6 and replaces `password`, `token`, `authorization`, `cookie`, `secret`, `apiKey`,
`DATABASE_URL` and friends with `[redacted]`. `Error` instances are converted to
`{name, message, stack}` rather than serialising to `{}`.

`LOG_LEVEL` (`debug|info|warn|error`, default `info`) gates emission; unknown values fall back to
`info` rather than silencing the app.

`GET /api/health` reports `{ ok, db, latencyMs, ai, trades, timestamp }`. A database outage yields
`200` with `ok:false, db:"down"` — the process stays up and observable instead of crash-looping.

---

## Security posture

- **Headers** (`next.config.mjs`): `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (camera/mic off, geolocation
  self-only), and a CSP with `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`,
  with images allowed only from self/data/OpenStreetMap tiles.
- **Rate limiting**: fixed-window in-memory limiter on chat (20/min) and auth paths.
  Single-instance only — see README limitations.
- **Passwords**: scrypt. **Sessions**: only token hashes stored.
- **SQL**: Prisma parameterises everything. Two `$queryRaw` uses (trend aggregations) use tagged
  templates with interpolated `Date` objects, never concatenated strings.
- **CSV import**: parsed by a hand-written RFC-4180 parser; rows are validated per record type and
  skipped rather than partially applied.

---

## Extension points

| To add | Do this |
|---|---|
| A new LLM provider | Implement `LLMProvider` in `src/lib/ai/provider.ts` and register it in the factory. |
| A new concern category | Add to the `ConcernCategory` enum, `CONCERN_PATTERNS` in `classifiers.ts`, `CONCERN_LABELS`, and the `concernSchema` / `caseCreateSchema` enums. |
| A role | Add to `Role`, the `NAV` record in `nav.ts`, the `ICONS` map in `shell.tsx`, and the guard lists on the relevant routes. |
| A new dashboard section | Add to `NAV[role]` (route auto-appears) and create `src/app/<role>/<section>/page.tsx` with `'use client'` + `useApi`. |
| A new import record type | Add to `applyImport()` in `src/app/api/admin/imports/route.ts` and a template in the `templates` map. |
| A different database | Not supported. Migrations rely on PostgreSQL `generate_series` and pgvector. |

---

## Deliberate non-goals

- **No microservices.** A single Next.js process with clear internal layers is easier to deploy for
  district-level deployments, which is the realistic operating context.
- **No vector database service.** pgvector in the existing PostgreSQL avoids a second datastore to
  keep consistent.
- **No third-party auth.** District deployments often cannot rely on an external identity provider.
- **No LLM-generated career advice.** The model may *phrase* an answer from retrieved records; the
  factual content always comes from the catalogue. This is enforced by the prompt contract in
  `buildSystemPrompt`.
