# DATABASE_SCHEMA

PostgreSQL + pgvector, managed through Prisma. **38 models, 29 enums.**
Source of truth: [`prisma/schema.prisma`](prisma/schema.prisma) · migrations in `prisma/migrations/`.

---

## Entity map

```
                    ┌──────────┐
                    │   User   │  role: STUDENT|PARENT|COUNSELLOR|ADMIN
                    └────┬─────┘
                         │ 1:1
        ┌────────────────┼────────────────┬─────────────────┐
        ▼                ▼                ▼                 ▼
 StudentProfile   ParentProfile      Counsellor         Session
        │                │                │
        └────────┬───────┘                │
                 ▼                        ▼
             Family ◄────────────  CounsellorCase
           (familyCode)                 │
                 │                      ├── CaseNote
                 │                      ├── Appointment
                 │                      └── CounsellingSession
                 │
    ┌────────────┼─────────────┬──────────────┐
    ▼            ▼             ▼              ▼
FamilyMember  ConsentRecord  ParentConcern  FamilyConsensus
                                     │              │
                                     │              ▼
                                     │      ConfidenceAssessment
                                     ▼
                            ChatConversation → ChatMessage
                                                     │
                                                     ▼
                                              CareerReport
```

Career catalogue (admin-managed, fully source-linked):

```
DataSource ──┬── CareerTrade ──┬── SalaryStatistic
             │                 ├── PlacementStatistic
             │                 ├── CareerPathway → CareerPathwayStage
             │                 ├── EmploymentOpportunity
             │                 └── KnowledgeDocument (pgvector embedding)
             ├── TrainingProvider → ProviderCourse
             ├── Qualification
             └── DataVerification

CareerTrade ── CareerRecommendation
User/Family ── CareerInterest, CareerAssessment, Feedback, Notification,
                ImportBatch, AdminAuditLog, SystemSetting
```

---

## Identity & access

### `User`
| Column | Type | Notes |
|---|---|---|
| `id` | `cuid()` | Primary key |
| `email` | `String` | `@unique`, lowercased on write |
| `passwordHash` | `String` | scrypt; never returned by any API |
| `role` | `Role` | Drives RBAC on every route |
| `state`, `district` | `String?` | Used for district-level analytics |
| `preferredLanguage` | `AppLanguage` | `EN` default |
| `isActive` | `Boolean` | Deactivation cascades session deletion |

Indexed on `role` and `[state, district]` — both are admin filter paths.

### `Session`
Stores `tokenHash` (SHA-256 of a random token), **not** the token itself, so a database leak does
not yield usable sessions. `expiresAt` drives expiry; `purgeExpiredSessions()` cleans up.

---

## Family & consent

### `Family`
`familyCode` (`FA-XXXXXX`, from an unambiguous 32-char alphabet) is the human-facing join code.
Carries `state`, `district`, `areaType` (`URBAN|SEMI_URBAN|RURAL`).

### `FamilyMember`
Junction with `relation` (`STUDENT|PARENT|GUARDIAN`) and **`consentGranted`**. Consent is per
member and revocable — it is the gate for cross-member data visibility.

### `ConsentRecord`
Append-only consent ledger: `kind` (`ConsentKind`), `granted`, `grantedAt`, `revokedAt`. Used for
the conversation-sharing consent that gates counsellor access to chat history.

---

## Profiles & assessment

### `StudentProfile` / `ParentProfile`
1:1 with `User`, keyed to a `Family`. PostgreSQL `String[]` arrays for `interests`, `skills`,
`preferredCareerAreas` — deliberately unstructured, since the free-text values drive recommendations
and are displayed verbatim to families.

### `CareerAssessment`
`kind` (`STUDENT_INTEREST|PARENT_EXPECTATIONS|FAMILY_CONTEXT`), `answers` JSON, `scores` JSON
holding `{ dimensions, overall }`, plus a plain-language `summary`. Scored by the pure functions in
`src/lib/services/assessments.ts`.

### `CareerInterest`
Ranked student interest, optionally linked to a `CareerTrade`. `source` distinguishes profile-derived
from assessment-derived interests.

### `ParentConcern`
The platform's core unit of analysis: `category` (`ConcernCategory`), `detail`, `status`
(`OPEN|ADDRESSED`), `source` (`AI_ESCALATION|FORM|CHAT`), plus `state`/`district` for the resistance
analytics. **This table drives the entire admin dashboard.**

---

## Counselling & escalation

### `Counsellor`
`maxActiveCases` (default 20) and `specialities`/`states`/`districts` arrays. Load-balancing in
`src/lib/services/cases.ts` picks the counsellor minimising
`openCases / maxActiveCases`, and returns `null` (→ case queued as `PENDING`) when the best one is at
capacity.

### `CounsellorCase`
The escalation record. Notable fields:
- `summaryShared Boolean` — whether the family consented to attaching the chat transcript.
- `source String` — `AI_ESCALATION` vs `USER_REQUEST`; used to measure AI escalation rate.
- Composite index `[status, priority]` serves the counsellor queue's ordered listing;
  `[counsellorId, status]` serves the caseload view.

`familyId` and `conversationId` use `onDelete: SetNull` so deleting a conversation never destroys the
human-support record.

### `CaseNote` / `CounsellingSession` / `Appointment`
Notes and sessions are the audit trail of what a human actually did. `Appointment` is indexed on
`[counsellorId, scheduledAt]` for the calendar view, and the API rejects double-booking a
counsellor in the same slot with a `409`.

---

## AI conversation

### `ChatConversation` → `ChatMessage`
Every message stores the **classification result at write time**: `intent`, `concernCategory`,
`sentiment`, `language`. This is deliberate — re-running classifiers over historical data after a
model change would silently rewrite history, and admin analytics must reflect what the system
actually knew at the time.

`ChatMessage.sources` is JSON capturing the sources attached to each AI reply.

---

## Family decision & scoring

### `FamilyConsensus`
Two-phase: participants save picks independently (`status = OPEN`), then `analyzeStoredConsensus`
runs and writes `status`, `common`, `disagreements`, `recommendations`, `evidence`, `aiSummary`.

**`studentDecision` and `parentDecision` are separate nullable columns.** Each participant records
their own voluntary decision; neither is derived from the other and neither can be written on
someone's behalf. This is the schema-level expression of "the AI never forces agreement".

### `ConfidenceAssessment`
`phase` (`PRE|POST`) plus per-dimension breakdown. `getConfidenceComparison` computes `change` as
`post - pre`. Explicitly a self-reported *awareness* measure — every consumer attaches a disclaimer
that it is not a psychological assessment.

---

## Career catalogue & provenance

### `VerificationStatus` — the integrity backbone

```
VERIFIED             → confirmed against a cited, current source
PENDING_VERIFICATION → in the catalogue, not yet checked
OUTDATED             → source exists but is stale
UNAVAILABLE          → record exists but the underlying figure is not obtainable
SYNTHETIC_DEMO       → fabricated for demonstration only
```

Every catalogue model carries `verificationStatus` **and** `isSynthetic`. The UI's `VerificationBadge`
renders a `SYNTHETIC_DEMO` badge whenever `isSynthetic` is true, even if `verificationStatus` claims
`VERIFIED` — a synthetic record must never be able to present itself as official.

### `DataSource`
A citable source: `name`, `url`, `publisher`, `category`
(`GOVERNMENT|OFFICIAL_BODY|PSU|NGO|ACADEMIC|COMMERCIAL|INTERNAL_DEMO`), `geographicScope`,
`publishedAt`, `lastVerifiedAt`, `isSynthetic`.

### `DataVerification`
Who checked what, when, and with what result. Indexed on `verifiedById`.

### `CareerTrade`
`slug` (`@unique`, derived via `slugify`), `category`, `ncoCode`, `durationMonths`, `nsqfLevel`,
`feeMin`/`feeMax`, `eligibility`. **Defaults are deliberately pessimistic:**
`isSynthetic = true`, `verificationStatus = SYNTHETIC_DEMO` — a new trade is unverified until an
admin links a source.

### `SalaryStatistic`
`experienceLevel` (`ENTRY|EXPERIENCED|EXPERT`), `monthlyMin`/`monthlyMax`, `isEstimate`,
`verificationStatus`. Estimates are flagged individually and rendered as "estimate" everywhere they
appear, including the PDF.

### `CareerPathway` → `CareerPathwayStage`
Progression steps with `order`, `title`, `qualification`, `description`. Advancement is
record-dependent, so the report disclaimer states progression is not automatic.

### `KnowledgeDocument`
Chunk for retrieval, typed (`TRADE_INFO|MYTH_FACT|SCHEME|PATHWAY|FAQ|PROGRESSION`), EN/HI, with an
optional `embedding Unsupported("vector(1536)")` column used when `RAG_MODE=vector`.

### `TrainingProvider` → `ProviderCourse`
Provider `type` (`ITI|PRIVATE_ITI|POLYTECHNIC|COMMUNITY_SKILL_CENTRE|NSDC_PARTNER|
APPRENTICESHIP_TRAINING_PROVIDER|ONLINE`), with `lat`/`lng` for the Opportunity Radar map. Providers
without coordinates are explicitly flagged in the admin UI rather than silently dropped.

### `EmploymentOpportunity`
`isVacancy` separates a real, current vacancy from a general opportunity description — a
distinction that matters enormously in this domain and is frequently blurred by aggregators.

---

## Reports, imports, audit

### `CareerReport`
Stores the assembled `payload` JSON (the `ReportPayload` contract) so a PDF can be re-rendered
deterministically later without re-querying every related table. `payload` is the source of truth for
`GET /api/reports/[id]/pdf`.

### `ImportBatch`
CSV uploads land here as `PENDING_REVIEW` with the parsed rows in `payload` — **never applied on
upload**. Only an explicit `{ action: "review", decision: "APPROVED" }` writes to the catalogue, and
that writes an `AdminAuditLog` entry.

### `AdminAuditLog`
`action`, `entityType`, `entityId`, `details` JSON, `ipAddress`. Written for user updates, case
transitions, import approval, session creation and settings changes.

### `SystemSetting`
Key/value JSON store with `updatedById`. `GET /api/admin/settings` merges stored values over the
`DEFAULTS` map in the route and flags which are still defaults.

---

## Enums (29)

| Enum | Values |
|---|---|
| `Role` | STUDENT, PARENT, COUNSELLOR, ADMIN |
| `AppLanguage` | EN, HI |
| `FamilyRelation` | STUDENT, PARENT, GUARDIAN |
| `AreaType` | URBAN, SEMI_URBAN, RURAL |
| `VerificationStatus` | VERIFIED, PENDING_VERIFICATION, OUTDATED, UNAVAILABLE, SYNTHETIC_DEMO |
| `EmploymentType` | GOVERNMENT, PRIVATE, SELF_EMPLOYMENT, APPRENTICESHIP, FREELANCE, FAMILY_BUSINESS |
| `ConcernCategory` | LOW_SALARY, JOB_SECURITY, SOCIAL_STATUS, SAFETY, TRADITIONAL_DEGREE, FURTHER_EDUCATION, FINANCIAL_LIMITATION, LACK_OF_AWARENESS, FAMILY_PRESSURE, OTHER |
| `ConcernStatus` | OPEN, ADDRESSED |
| `ConcernSource` | AI_ESCALATION, FORM, CHAT |
| `CaseStatus` | PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED |
| `CasePriority` | LOW, NORMAL, HIGH, URGENT |
| `AppointmentStatus` | SCHEDULED, COMPLETED, CANCELLED, NO_SHOW |
| `AppointmentMode` | VIDEO, PHONE, IN_PERSON |
| `ConsensusStatus` | OPEN, AGREED, PARTIALLY_AGREED, NEEDS_DISCUSSION |
| `ConfidencePhase` | PRE, POST |
| `AssessmentKind` | STUDENT_INTEREST, PARENT_EXPECTATIONS, FAMILY_CONTEXT |
| `MessageRole` | USER, ASSISTANT |
| `ConversationKind` | OBJECTION_ANALYZER, GENERAL_COUNSELLING, DIGITAL_TWIN, MYTH_FOLLOWUP |
| `ConversationStatus` | ACTIVE, ARCHIVED |
| `RecommendationPathway` | PREFERRED, ALTERNATIVE, GROWTH, SAFE |
| `RecommendationStatus` | PROPOSED, SHORTLISTED, REJECTED |
| `ReportType` | FAMILY_AGREEMENT, COUNSELLING_SUMMARY, CAREER_ANALYSIS |
| `ReportStatus` | PENDING, READY, FAILED |
| `ProviderType` | ITI, PRIVATE_ITI, POLYTECHNIC, COMMUNITY_SKILL_CENTRE, NSDC_PARTNER, APPRENTICESHIP_TRAINING_PROVIDER, ONLINE |
| `EmploymentSector` | GOVERNMENT, PRIVATE_SERVICES, AGRICULTURE, MANUFACTURING, HEALTHCARE, CONSTRUCTION, LOGISTICS, INFORMATION_TECHNOLOGY, TOURISM, OTHERS |
| `DataSourceCategory` | GOVERNMENT, OFFICIAL_BODY, PSU, NGO, ACADEMIC, COMMERCIAL, INTERNAL_DEMO |
| `ImportStatus` | PENDING_REVIEW, APPROVED, REJECTED |
| `NotificationType` | SYSTEM, CASE_UPDATE, APPOINTMENT, CONSENSUS, REPORT |
| `ConsentKind` | FAMILY_DATA_SHARING, CONVERSATION_SHARING_TO_COUNSELLOR, PROFILE_VISIBILITY |

---

## Referential-integrity policy

| Relationship | `onDelete` | Reason |
|---|---|---|
| User → sessions, profiles, conversations, interests | `Cascade` | Personal data disappears with the account |
| CounsellorCase → family, conversation, counsellor | `SetNull` | A human-support record must survive if related data is removed |
| CareerTrade → source | `SetNull` | Catalogue entry outlives a corrected source record |
| Session | `Cascade` from User | Deactivating an account revokes all sessions |

---

## Indexing rationale

Indexes exist only for query paths that actually run:

- `[state, district]` on `User` and district aggregations — powers the resistance index.
- `[status, priority]` and `[counsellorId, status]` on `CounsellorCase` — the counsellor queue and caseload.
- `[category, language]` on `KnowledgeDocument` — retrieval pre-filtering before BM25/pgvector scoring.
- `[familyId, status]` on `FamilyConsensus` — the latest-consensus lookup.
- `[userId, isRead]` on `Notification` — the unread badge count on every dashboard load.
- `[userId, createdAt]` on `AdminAuditLog` — audit review by actor, most recent first.
