-- Enable pgvector extension (required by KnowledgeDocument.embedding)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AppLanguage" AS ENUM ('EN', 'HI');

-- CreateEnum
CREATE TYPE "FamilyRelation" AS ENUM ('STUDENT', 'PARENT', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('URBAN', 'SEMI_URBAN', 'RURAL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PENDING_VERIFICATION', 'OUTDATED', 'UNAVAILABLE', 'SYNTHETIC_DEMO');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('GOVERNMENT', 'PRIVATE', 'SELF_EMPLOYMENT', 'APPRENTICESHIP', 'FREELANCE', 'FAMILY_BUSINESS');

-- CreateEnum
CREATE TYPE "ConcernCategory" AS ENUM ('LOW_SALARY', 'JOB_SECURITY', 'SOCIAL_STATUS', 'SAFETY', 'TRADITIONAL_DEGREE', 'FURTHER_EDUCATION', 'FINANCIAL_LIMITATION', 'LACK_OF_AWARENESS', 'FAMILY_PRESSURE', 'OTHER');

-- CreateEnum
CREATE TYPE "ConcernStatus" AS ENUM ('OPEN', 'ADDRESSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConcernSource" AS ENUM ('CHAT', 'FORM', 'ASSESSMENT', 'CONSENSUS');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('VIDEO', 'PHONE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "ConsensusStatus" AS ENUM ('OPEN', 'AGREED', 'PARTIALLY_AGREED', 'NEEDS_DISCUSSION', 'COUNSELLOR_REQUESTED');

-- CreateEnum
CREATE TYPE "ConfidencePhase" AS ENUM ('PRE', 'POST');

-- CreateEnum
CREATE TYPE "AssessmentKind" AS ENUM ('STUDENT_INTEREST', 'PARENT_EXPECTATIONS', 'FAMILY_CONTEXT', 'CONFIDENCE_PRE', 'CONFIDENCE_POST');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConversationKind" AS ENUM ('OBJECTION_ANALYZER', 'GENERAL_COUNSELLING', 'DIGITAL_TWIN', 'MYTH_FOLLOWUP');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ESCALATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecommendationPathway" AS ENUM ('PREFERRED', 'ALTERNATIVE', 'LONG_TERM_GROWTH');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PROPOSED', 'REVIEWED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('FAMILY_AGREEMENT', 'COUNSELLING_SUMMARY', 'CAREER_ANALYSIS');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('ITI', 'PRIVATE_ITI', 'POLYTECHNIC', 'COMMUNITY_SKILL_CENTRE', 'NSDC_PARTNER', 'APPRENTICESHIP_TRAINING_PROVIDER', 'ONLINE');

-- CreateEnum
CREATE TYPE "EmploymentSector" AS ENUM ('GOVERNMENT', 'PRIVATE_MANUFACTURING', 'PRIVATE_SERVICES', 'IT_SOFTWARE', 'HEALTHCARE', 'CONSTRUCTION', 'RETAIL', 'ENTREPRENEURSHIP', 'FREELANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DataSourceCategory" AS ENUM ('GOVERNMENT', 'OFFICIAL_BODY', 'PSU', 'NGO', 'ACADEMIC', 'COMMERCIAL', 'INTERNAL_DEMO');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CASE_UPDATE', 'APPOINTMENT', 'CONSENSUS', 'REPORT_READY', 'SYSTEM', 'CONCERN_RESPONSE');

-- CreateEnum
CREATE TYPE "ConsentKind" AS ENUM ('FAMILY_PROFILE_SHARING', 'CONVERSATION_SHARING_TO_COUNSELLOR', 'GUARDIAN_CONSENT_MINOR', 'DATA_ANALYTICS_AGGREGATE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "state" TEXT,
    "district" TEXT,
    "preferredLanguage" "AppLanguage" NOT NULL DEFAULT 'EN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "familyCode" TEXT NOT NULL,
    "name" TEXT,
    "state" TEXT,
    "district" TEXT,
    "areaType" "AreaType",
    "incomeBracket" TEXT,
    "preferredLanguage" "AppLanguage" NOT NULL DEFAULT 'EN',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relation" "FamilyRelation" NOT NULL,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "consentGranted" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "kind" "ConsentKind" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "note" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "age" INTEGER,
    "qualification" TEXT,
    "academicBackground" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredCareerAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "aspirations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "educationBackground" TEXT,
    "careerExpectations" TEXT,
    "financialConcerns" TEXT,
    "preferredEmploymentType" "EmploymentType",
    "careerConcerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "kind" "AssessmentKind" NOT NULL,
    "answers" JSONB NOT NULL,
    "scores" JSONB,
    "summary" TEXT,
    "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeId" TEXT,
    "label" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'SELF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentConcern" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "familyId" TEXT,
    "category" "ConcernCategory" NOT NULL,
    "detail" TEXT NOT NULL,
    "language" "AppLanguage" NOT NULL DEFAULT 'EN',
    "sentimentScore" DOUBLE PRECISION,
    "status" "ConcernStatus" NOT NULL DEFAULT 'OPEN',
    "source" "ConcernSource" NOT NULL DEFAULT 'FORM',
    "state" TEXT,
    "district" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentConcern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingSession" (
    "id" TEXT NOT NULL,
    "familyId" TEXT,
    "caseId" TEXT,
    "counsellorId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'AI',
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "durationMin" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "summary" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounsellingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "kind" "ConversationKind" NOT NULL DEFAULT 'OBJECTION_ANALYZER',
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "language" "AppLanguage" NOT NULL DEFAULT 'EN',
    "summary" TEXT,
    "sentimentLabel" TEXT,
    "concernCategory" "ConcernCategory",
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "language" "AppLanguage",
    "intent" TEXT,
    "concernCategory" "ConcernCategory",
    "sentiment" TEXT,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counsellor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT,
    "specialities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "districts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxActiveCases" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Counsellor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellorCase" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "familyId" TEXT,
    "counsellorId" TEXT,
    "conversationId" TEXT,
    "category" "ConcernCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "CasePriority" NOT NULL DEFAULT 'NORMAL',
    "summaryShared" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'AI_ESCALATION',
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounsellorCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "familyId" TEXT,
    "counsellorId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "mode" "AppointmentMode" NOT NULL DEFAULT 'PHONE',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "caseId" TEXT,
    "rating" INTEGER NOT NULL,
    "category" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "publisher" TEXT,
    "category" "DataSourceCategory" NOT NULL,
    "description" TEXT,
    "geographicScope" TEXT,
    "publishedAt" TIMESTAMP(3),
    "isSynthetic" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "lastVerifiedAt" TIMESTAMP(3),
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataVerification" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "recordType" TEXT NOT NULL,
    "recordId" TEXT,
    "status" "VerificationStatus" NOT NULL,
    "notes" TEXT,
    "verifiedById" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "nsqfLevel" INTEGER,
    "description" TEXT,
    "equivalence" TEXT,
    "progressionNote" TEXT,
    "sourceId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerTrade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ncoCode" TEXT,
    "description" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "nsqfLevel" INTEGER,
    "eligibility" TEXT,
    "qualificationId" TEXT,
    "feeMin" INTEGER,
    "feeMax" INTEGER,
    "isSynthetic" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sourceId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'SYNTHETIC_DEMO',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerPathway" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerPathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerPathwayStage" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qualification" TEXT,
    "nsqfLevel" INTEGER,
    "experienceYears" INTEGER,
    "salaryRange" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employmentSectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "furtherEducation" TEXT,

    CONSTRAINT "CareerPathwayStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStatistic" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "monthlyMin" INTEGER NOT NULL,
    "monthlyMax" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "geography" TEXT,
    "periodYear" INTEGER,
    "isEstimate" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "sourceId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'SYNTHETIC_DEMO',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementStatistic" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "providerId" TEXT,
    "periodYear" INTEGER NOT NULL,
    "placedCount" INTEGER NOT NULL,
    "totalGraduates" INTEGER NOT NULL,
    "placementRate" DOUBLE PRECISION,
    "notes" TEXT,
    "sourceId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'SYNTHETIC_DEMO',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT,
    "pinCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "website" TEXT,
    "affiliation" TEXT,
    "isSynthetic" BOOLEAN NOT NULL DEFAULT true,
    "sourceId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'SYNTHETIC_DEMO',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCourse" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "feeMin" INTEGER,
    "feeMax" INTEGER,
    "eligibility" TEXT,
    "seats" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentOpportunity" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT,
    "title" TEXT NOT NULL,
    "sector" "EmploymentSector" NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "state" TEXT,
    "district" TEXT,
    "employerName" TEXT,
    "isVacancy" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "openPositions" INTEGER,
    "sourceUrl" TEXT,
    "postedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isSynthetic" BOOLEAN NOT NULL DEFAULT true,
    "sourceId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'SYNTHETIC_DEMO',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chunk" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "language" "AppLanguage" NOT NULL DEFAULT 'EN',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tradeId" TEXT,
    "sourceId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "lastVerifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "tradeId" TEXT,
    "pathway" "RecommendationPathway" NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "matchScore" INTEGER,
    "evidence" JSONB,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyConsensus" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "status" "ConsensusStatus" NOT NULL DEFAULT 'OPEN',
    "studentPicks" JSONB NOT NULL,
    "parentPicks" JSONB NOT NULL,
    "common" JSONB NOT NULL,
    "disagreements" JSONB NOT NULL,
    "concerns" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "studentDecision" TEXT,
    "parentDecision" TEXT,
    "aiSummary" TEXT,
    "reportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyConsensus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfidenceAssessment" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "phase" "ConfidencePhase" NOT NULL,
    "userId" TEXT,
    "answers" JSONB NOT NULL,
    "dimensions" JSONB NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfidenceAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "type" "ReportType" NOT NULL,
    "language" "AppLanguage" NOT NULL DEFAULT 'EN',
    "status" "ReportStatus" NOT NULL DEFAULT 'READY',
    "filePath" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedRows" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "notes" TEXT,
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_state_district_idx" ON "User"("state", "district");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Family_familyCode_key" ON "Family"("familyCode");

-- CreateIndex
CREATE INDEX "Family_state_district_idx" ON "Family"("state", "district");

-- CreateIndex
CREATE INDEX "FamilyMember_userId_idx" ON "FamilyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_familyId_userId_key" ON "FamilyMember"("familyId", "userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_kind_idx" ON "ConsentRecord"("userId", "kind");

-- CreateIndex
CREATE INDEX "ConsentRecord_familyId_idx" ON "ConsentRecord"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_familyId_key" ON "StudentProfile"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_familyId_key" ON "ParentProfile"("familyId");

-- CreateIndex
CREATE INDEX "CareerAssessment_userId_kind_idx" ON "CareerAssessment"("userId", "kind");

-- CreateIndex
CREATE INDEX "CareerAssessment_familyId_idx" ON "CareerAssessment"("familyId");

-- CreateIndex
CREATE INDEX "CareerInterest_userId_idx" ON "CareerInterest"("userId");

-- CreateIndex
CREATE INDEX "ParentConcern_category_status_idx" ON "ParentConcern"("category", "status");

-- CreateIndex
CREATE INDEX "ParentConcern_familyId_idx" ON "ParentConcern"("familyId");

-- CreateIndex
CREATE INDEX "ParentConcern_state_district_idx" ON "ParentConcern"("state", "district");

-- CreateIndex
CREATE INDEX "CounsellingSession_familyId_idx" ON "CounsellingSession"("familyId");

-- CreateIndex
CREATE INDEX "CounsellingSession_counsellorId_idx" ON "CounsellingSession"("counsellorId");

-- CreateIndex
CREATE INDEX "ChatConversation_userId_updatedAt_idx" ON "ChatConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatConversation_familyId_idx" ON "ChatConversation"("familyId");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Counsellor_userId_key" ON "Counsellor"("userId");

-- CreateIndex
CREATE INDEX "Counsellor_isActive_idx" ON "Counsellor"("isActive");

-- CreateIndex
CREATE INDEX "CounsellorCase_status_priority_idx" ON "CounsellorCase"("status", "priority");

-- CreateIndex
CREATE INDEX "CounsellorCase_counsellorId_status_idx" ON "CounsellorCase"("counsellorId", "status");

-- CreateIndex
CREATE INDEX "CounsellorCase_familyId_idx" ON "CounsellorCase"("familyId");

-- CreateIndex
CREATE INDEX "CaseNote_caseId_idx" ON "CaseNote"("caseId");

-- CreateIndex
CREATE INDEX "Appointment_counsellorId_scheduledAt_idx" ON "Appointment"("counsellorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_familyId_idx" ON "Appointment"("familyId");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "DataSource_verificationStatus_idx" ON "DataSource"("verificationStatus");

-- CreateIndex
CREATE INDEX "DataSource_category_idx" ON "DataSource"("category");

-- CreateIndex
CREATE INDEX "DataVerification_recordType_recordId_idx" ON "DataVerification"("recordType", "recordId");

-- CreateIndex
CREATE INDEX "DataVerification_status_idx" ON "DataVerification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Qualification_code_key" ON "Qualification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CareerTrade_slug_key" ON "CareerTrade"("slug");

-- CreateIndex
CREATE INDEX "CareerTrade_category_idx" ON "CareerTrade"("category");

-- CreateIndex
CREATE INDEX "CareerTrade_verificationStatus_idx" ON "CareerTrade"("verificationStatus");

-- CreateIndex
CREATE INDEX "CareerPathway_tradeId_idx" ON "CareerPathway"("tradeId");

-- CreateIndex
CREATE INDEX "CareerPathwayStage_pathwayId_order_idx" ON "CareerPathwayStage"("pathwayId", "order");

-- CreateIndex
CREATE INDEX "SalaryStatistic_tradeId_experienceLevel_idx" ON "SalaryStatistic"("tradeId", "experienceLevel");

-- CreateIndex
CREATE INDEX "PlacementStatistic_tradeId_periodYear_idx" ON "PlacementStatistic"("tradeId", "periodYear");

-- CreateIndex
CREATE INDEX "TrainingProvider_state_district_idx" ON "TrainingProvider"("state", "district");

-- CreateIndex
CREATE INDEX "TrainingProvider_type_idx" ON "TrainingProvider"("type");

-- CreateIndex
CREATE INDEX "ProviderCourse_tradeId_idx" ON "ProviderCourse"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCourse_providerId_tradeId_key" ON "ProviderCourse"("providerId", "tradeId");

-- CreateIndex
CREATE INDEX "EmploymentOpportunity_state_district_idx" ON "EmploymentOpportunity"("state", "district");

-- CreateIndex
CREATE INDEX "EmploymentOpportunity_isVacancy_idx" ON "EmploymentOpportunity"("isVacancy");

-- CreateIndex
CREATE INDEX "EmploymentOpportunity_tradeId_idx" ON "EmploymentOpportunity"("tradeId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_docType_language_idx" ON "KnowledgeDocument"("docType", "language");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_tradeId_idx" ON "KnowledgeDocument"("tradeId");

-- CreateIndex
CREATE INDEX "CareerRecommendation_familyId_pathway_idx" ON "CareerRecommendation"("familyId", "pathway");

-- CreateIndex
CREATE INDEX "CareerRecommendation_userId_idx" ON "CareerRecommendation"("userId");

-- CreateIndex
CREATE INDEX "FamilyConsensus_familyId_status_idx" ON "FamilyConsensus"("familyId", "status");

-- CreateIndex
CREATE INDEX "ConfidenceAssessment_familyId_phase_idx" ON "ConfidenceAssessment"("familyId", "phase");

-- CreateIndex
CREATE INDEX "CareerReport_userId_createdAt_idx" ON "CareerReport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CareerReport_familyId_idx" ON "CareerReport"("familyId");

-- CreateIndex
CREATE INDEX "ImportBatch_status_idx" ON "ImportBatch"("status");

-- CreateIndex
CREATE INDEX "AdminAuditLog_userId_createdAt_idx" ON "AdminAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerAssessment" ADD CONSTRAINT "CareerAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerAssessment" ADD CONSTRAINT "CareerAssessment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerInterest" ADD CONSTRAINT "CareerInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerInterest" ADD CONSTRAINT "CareerInterest_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "CareerTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentConcern" ADD CONSTRAINT "ParentConcern_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentConcern" ADD CONSTRAINT "ParentConcern_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CounsellorCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingSession" ADD CONSTRAINT "CounsellingSession_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "Counsellor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counsellor" ADD CONSTRAINT "Counsellor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellorCase" ADD CONSTRAINT "CounsellorCase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellorCase" ADD CONSTRAINT "CounsellorCase_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellorCase" ADD CONSTRAINT "CounsellorCase_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "Counsellor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellorCase" ADD CONSTRAINT "CounsellorCase_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CounsellorCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CounsellorCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "Counsellor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataVerification" ADD CONSTRAINT "DataVerification_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataVerification" ADD CONSTRAINT "DataVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerTrade" ADD CONSTRAINT "CareerTrade_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerTrade" ADD CONSTRAINT "CareerTrade_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerPathway" ADD CONSTRAINT "CareerPathway_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "CareerTrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerPathwayStage" ADD CONSTRAINT "CareerPathwayStage_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "CareerPathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStatistic" ADD CONSTRAINT "SalaryStatistic_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "CareerTrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStatistic" ADD CONSTRAINT "SalaryStatistic_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementStatistic" ADD CONSTRAINT "PlacementStatistic_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "CareerTrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementStatistic" ADD CONSTRAINT "PlacementStatistic_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TrainingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementStatistic" ADD CONSTRAINT "PlacementStatistic_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProvider" ADD CONSTRAINT "TrainingProvider_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCourse" ADD CONSTRAINT "ProviderCourse_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TrainingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCourse" ADD CONSTRAINT "ProviderCourse_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "CareerTrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentOpportunity" ADD CONSTRAINT "EmploymentOpportunity_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "CareerTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentOpportunity" ADD CONSTRAINT "EmploymentOpportunity_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "CareerTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerRecommendation" ADD CONSTRAINT "CareerRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerRecommendation" ADD CONSTRAINT "CareerRecommendation_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerRecommendation" ADD CONSTRAINT "CareerRecommendation_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "CareerTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyConsensus" ADD CONSTRAINT "FamilyConsensus_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfidenceAssessment" ADD CONSTRAINT "ConfidenceAssessment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerReport" ADD CONSTRAINT "CareerReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerReport" ADD CONSTRAINT "CareerReport_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
