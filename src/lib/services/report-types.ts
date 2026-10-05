import type { CaseStatus, ConcernCategory } from '@prisma/client';

export interface CaseCreateInput {
  subject: string;
  description: string;
  category: ConcernCategory;
  conversationId?: string;
  shareConversation: boolean;
  familyId?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface CaseUpdateInput {
  status?: CaseStatus;
  note?: string;
  assignToMe?: boolean;
}
