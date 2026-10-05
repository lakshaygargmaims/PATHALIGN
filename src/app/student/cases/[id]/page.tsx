'use client';

import { CaseDetailView } from '@/components/cases/case-detail';
import { useParams } from 'next/navigation';

export default function StudentCaseDetailPage() {
  const params = useParams<{ id: string }>();
  return <CaseDetailView id={params?.id ?? ''} basePath="/student" />;
}
