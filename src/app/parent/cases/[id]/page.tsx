'use client';

import { CaseDetailView } from '@/components/cases/case-detail';
import { useParams } from 'next/navigation';

export default function ParentCaseDetailPage() {
  const params = useParams<{ id: string }>();
  return <CaseDetailView id={params?.id ?? ''} basePath="/parent" />;
}
