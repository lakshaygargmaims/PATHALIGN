import type { CaseStatus, ConcernCategory, User } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ApiError } from '@/lib/api';
import type { CaseCreateInput, CaseUpdateInput } from './report-types';

// ------------------------------------------------------------
// Human counsellor escalation workflow
// ------------------------------------------------------------

export async function createCase(user: User, input: CaseCreateInput) {
  let familyId: string | undefined = input.familyId;
  if (!familyId) {
    const membership = await prisma.familyMember.findFirst({ where: { userId: user.id } });
    familyId = membership?.familyId ?? undefined;
  }

  if (input.conversationId) {
    const conv = await prisma.chatConversation.findUnique({ where: { id: input.conversationId } });
    if (!conv || conv.userId !== user.id) throw new ApiError(403, 'Conversation not accessible');
    if (input.shareConversation) {
      await prisma.consentRecord.create({
        data: {
          userId: user.id,
          familyId,
          kind: 'CONVERSATION_SHARING_TO_COUNSELLOR',
          granted: true,
          note: `Conversation ${input.conversationId} shared with counsellor`,
        },
      });
    }
  }

  const resolvedConversationId = input.conversationId && input.shareConversation ? input.conversationId : undefined;

  const counsellor = await pickCounsellor();

  const created = await prisma.counsellorCase.create({
    data: {
      ownerId: user.id,
      familyId,
      counsellorId: counsellor?.id,
      conversationId: resolvedConversationId,
      category: input.category,
      subject: input.subject,
      description: input.description,
      status: counsellor ? 'ASSIGNED' : 'PENDING',
      priority: input.priority,
      summaryShared: Boolean(resolvedConversationId),
      source: input.conversationId ? 'AI_ESCALATION' : 'USER_REQUEST',
      assignedAt: counsellor ? new Date() : null,
    },
  });

  if (counsellor) {
    await prisma.notification.create({
      data: {
        userId: counsellor.userId,
        type: 'CASE_UPDATE',
        title: 'New case assigned',
        body: `${created.subject} (${created.category})`,
        link: `/counsellor/cases/${created.id}`,
      },
    });
  }

  return { case: created, assigned: Boolean(counsellor) };
}

/** Assign to the active counsellor with the fewest open cases. */
async function pickCounsellor() {
  const counsellors = await prisma.counsellor.findMany({
    where: { isActive: true },
    include: { _count: { select: { cases: { where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } } } } },
  });
  if (counsellors.length === 0) return null;
  counsellors.sort((a, b) => {
    const loadA = a._count.cases / Math.max(1, a.maxActiveCases);
    const loadB = b._count.cases / Math.max(1, b.maxActiveCases);
    return loadA - loadB;
  });
  const chosen = counsellors[0]!;
  return chosen._count.cases >= chosen.maxActiveCases ? null : chosen;
}

export interface CaseListFilter {
  status?: CaseStatus;
  category?: ConcernCategory;
  mine?: boolean;
  ownerId?: string;
}

export async function listCases(filter: CaseListFilter, opts: { role: string; userId: string }) {
  const where = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.category ? { category: filter.category } : {}),
    ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
    ...(filter.mine && opts.role === 'COUNSELLOR'
      ? { counsellor: { userId: opts.userId } }
      : opts.role !== 'ADMIN' && opts.role !== 'COUNSELLOR'
        ? { ownerId: opts.userId }
        : {}),
  };
  return prisma.counsellorCase.findMany({
    where,
    include: {
      owner: { select: { id: true, fullName: true, role: true } },
      family: { select: { id: true, familyCode: true, district: true, state: true } },
      counsellor: { select: { id: true, user: { select: { fullName: true } } } },
      notes: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { notes: true, appointments: true } },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
}

export async function getCaseForUser(caseId: string, user: User) {
  const record = await prisma.counsellorCase.findUnique({
    where: { id: caseId },
    include: {
      owner: { select: { id: true, fullName: true, role: true, email: true, mobile: true } },
      family: true,
      counsellor: { include: { user: { select: { fullName: true } } } },
      notes: { include: { author: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } },
      conversation: { include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } } },
      appointments: { orderBy: { scheduledAt: 'asc' } },
      sessions: true,
    },
  });
  if (!record) throw new ApiError(404, 'Case not found');
  const isStaff = user.role === 'ADMIN' || user.role === 'COUNSELLOR';
  if (!isStaff && record.ownerId !== user.id) throw new ApiError(403, 'Not your case');
  return record;
}

export async function updateCase(
  caseId: string,
  input: CaseUpdateInput,
  user: User,
) {
  const record = await prisma.counsellorCase.findUnique({ where: { id: caseId }, include: { counsellor: true } });
  if (!record) throw new ApiError(404, 'Case not found');

  const isStaff = user.role === 'ADMIN' || user.role === 'COUNSELLOR';
  const isAssignedCounsellor = record.counsellor?.userId === user.id;
  if (!isStaff && record.ownerId !== user.id) throw new ApiError(403, 'Not permitted');
  if (!isStaff && !isAssignedCounsellor && input.status) {
    throw new ApiError(403, 'Only the assigned counsellor can change status');
  }

  const data: Record<string, unknown> = {};
  if (input.status) {
    data.status = input.status;
    if (input.status === 'RESOLVED' || input.status === 'CLOSED') data.resolvedAt = new Date();
    if (input.status === 'IN_PROGRESS' && !record.assignedAt) data.assignedAt = new Date();
  }
  if (input.assignToMe && user.role === 'COUNSELLOR') {
    const profile = await prisma.counsellor.findUnique({ where: { userId: user.id } });
    if (!profile) throw new ApiError(400, 'No counsellor profile');
    data.counsellorId = profile.id;
    data.status = record.status === 'PENDING' ? 'ASSIGNED' : record.status;
    data.assignedAt = record.assignedAt ?? new Date();
  }

  const updated = await prisma.counsellorCase.update({ where: { id: caseId }, data });

  if (input.note && input.note.trim().length > 0) {
    await prisma.caseNote.create({ data: { caseId, authorId: user.id, note: input.note.trim() } });
  }

  await prisma.adminAuditLog.create({
    data: {
      userId: user.id,
      action: 'CASE_UPDATE',
      entityType: 'CounsellorCase',
      entityId: caseId,
      details: { status: input.status ?? null, assignToMe: Boolean(input.assignToMe) },
    },
  });

  if (input.status && record.ownerId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: record.ownerId,
        type: 'CASE_UPDATE',
        title: `Your support case is now ${String(updated.status).replace('_', ' ').toLowerCase()}`,
        body: updated.subject,
        link: `/student/cases`,
      },
    });
  }

  return updated;
}
