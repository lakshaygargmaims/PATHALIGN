import type { Family, FamilyMember, User } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ApiError } from '@/lib/api';
import { generateFamilyCode } from '@/lib/utils';

/** Create a new family for the current user. */
export async function createFamily(
  user: User,
  input: { name?: string; areaType?: 'URBAN' | 'SEMI_URBAN' | 'RURAL'; incomeBracket?: string },
): Promise<Family> {
  const existing = await prisma.familyMember.findFirst({ where: { userId: user.id } });
  if (existing) throw new ApiError(409, 'You already belong to a family group');

  const familyCode = await uniqueFamilyCode();
  const family = await prisma.family.create({
    data: {
      familyCode,
      name: input.name,
      state: user.state ?? undefined,
      district: user.district ?? undefined,
      areaType: input.areaType,
      incomeBracket: input.incomeBracket,
      preferredLanguage: user.preferredLanguage,
      createdByUserId: user.id,
    },
  });
  const relation = user.role === 'PARENT' ? 'PARENT' : user.role === 'COUNSELLOR' ? 'GUARDIAN' : 'STUDENT';
  await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: user.id,
      relation,
      consentGranted: true,
      consentAt: new Date(),
    },
  });
  await prisma.consentRecord.create({
    data: {
      userId: user.id,
      familyId: family.id,
      kind: 'FAMILY_PROFILE_SHARING',
      granted: true,
      note: 'Granted at family creation',
    },
  });
  return family;
}

async function uniqueFamilyCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateFamilyCode();
    const found = await prisma.family.findUnique({ where: { familyCode: code } });
    if (!found) return code;
  }
  throw new ApiError(500, 'Could not generate a unique family code');
}

/** Join an existing family with a shared code + explicit consent. */
export async function joinFamily(
  user: User,
  input: { familyCode: string; relation: 'STUDENT' | 'PARENT' | 'GUARDIAN'; consent: boolean },
): Promise<Family> {
  const family = await prisma.family.findUnique({ where: { familyCode: input.familyCode } });
  if (!family) throw new ApiError(404, 'No family found with that code');
  const already = await prisma.familyMember.findFirst({ where: { familyId: family.id, userId: user.id } });
  if (already) return family;
  const roleRelation = user.role === 'PARENT' ? 'PARENT' : user.role === 'STUDENT' ? 'STUDENT' : 'GUARDIAN';
  await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: user.id,
      relation: input.relation ?? roleRelation,
      consentGranted: input.consent,
      consentAt: input.consent ? new Date() : null,
    },
  });
  if (input.consent) {
    await prisma.consentRecord.create({
      data: {
        userId: user.id,
        familyId: family.id,
        kind: 'FAMILY_PROFILE_SHARING',
        granted: true,
        note: 'Granted when joining family',
      },
    });
  }
  return family;
}

export interface FamilyOverview {
  family: Family;
  members: Array<{ id: string; relation: string; name: string; role: string; userId: string; consentGranted: boolean }>;
  studentProfile: unknown;
  parentProfile: unknown;
  joinCode: string;
}

export async function getFamilyOverview(familyId: string): Promise<FamilyOverview> {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      members: { include: { user: { select: { id: true, fullName: true, role: true } } } },
      studentProfile: true,
      parentProfile: true,
    },
  });
  if (!family) throw new ApiError(404, 'Family not found');
  return {
    family,
    members: family.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      relation: m.relation,
      name: m.user.fullName,
      role: m.user.role,
      consentGranted: m.consentGranted,
    })),
    studentProfile: family.studentProfile,
    parentProfile: family.parentProfile,
    joinCode: family.familyCode,
  };
}

/** The family the user belongs to, if any. */
export async function getUserFamily(userId: string): Promise<Family | null> {
  const membership = await prisma.familyMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    include: { family: true },
  });
  return membership?.family ?? null;
}

export async function requireUserFamily(user: User): Promise<Family> {
  const family = await getUserFamily(user.id);
  if (!family) throw new ApiError(400, 'Join or create a family group first');
  return family;
}

export async function upsertStudentProfile(
  userId: string,
  data: {
    age?: number | null;
    qualification?: string | null;
    academicBackground?: string | null;
    interests?: string[];
    skills?: string[];
    preferredCareerAreas?: string[];
    location?: string | null;
    aspirations?: string | null;
  },
) {
  const membership = await prisma.familyMember.findFirst({ where: { userId } });
  return prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      familyId: membership?.familyId,
      age: data.age ?? null,
      qualification: data.qualification ?? null,
      academicBackground: data.academicBackground ?? null,
      interests: data.interests ?? [],
      skills: data.skills ?? [],
      preferredCareerAreas: data.preferredCareerAreas ?? [],
      location: data.location ?? null,
      aspirations: data.aspirations ?? null,
    },
    update: {
      age: data.age ?? undefined,
      qualification: data.qualification ?? undefined,
      academicBackground: data.academicBackground ?? undefined,
      interests: data.interests ?? undefined,
      skills: data.skills ?? undefined,
      preferredCareerAreas: data.preferredCareerAreas ?? undefined,
      location: data.location ?? undefined,
      aspirations: data.aspirations ?? undefined,
    },
  });
}

export async function upsertParentProfile(
  userId: string,
  data: {
    educationBackground?: string | null;
    careerExpectations?: string | null;
    financialConcerns?: string | null;
    preferredEmploymentType?: 'GOVERNMENT' | 'PRIVATE' | 'SELF_EMPLOYMENT' | 'APPRENTICESHIP' | 'FREELANCE' | 'FAMILY_BUSINESS' | null;
    careerConcerns?: string[];
  },
) {
  const membership = await prisma.familyMember.findFirst({ where: { userId } });
  return prisma.parentProfile.upsert({
    where: { userId },
    create: {
      userId,
      familyId: membership?.familyId,
      educationBackground: data.educationBackground ?? null,
      careerExpectations: data.careerExpectations ?? null,
      financialConcerns: data.financialConcerns ?? null,
      preferredEmploymentType: data.preferredEmploymentType ?? null,
      careerConcerns: data.careerConcerns ?? [],
    },
    update: {
      educationBackground: data.educationBackground ?? undefined,
      careerExpectations: data.careerExpectations ?? undefined,
      financialConcerns: data.financialConcerns ?? undefined,
      preferredEmploymentType: data.preferredEmploymentType ?? undefined,
      careerConcerns: data.careerConcerns ?? undefined,
    },
  });
}

/** Consent: a member can revoke in-family sharing at any time. */
export async function setFamilyConsent(userId: string, familyId: string, granted: boolean) {
  await prisma.familyMember.updateMany({
    where: { userId, familyId },
    data: { consentGranted: granted, consentAt: granted ? new Date() : null },
  });
  await prisma.consentRecord.create({
    data: { userId, familyId, kind: 'FAMILY_PROFILE_SHARING', granted, note: granted ? 'Re-granted' : 'Revoked by user' },
  });
  if (!granted) {
    await prisma.consentRecord.updateMany({
      where: { userId, familyId, kind: 'FAMILY_PROFILE_SHARING', granted: true, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
