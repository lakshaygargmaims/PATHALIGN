import { AssessmentPanel } from '@/components/assessment/assessment-panel';

export const metadata = { title: 'Career Assessment — PATHALIGN AI' };

export default function StudentAssessmentPage() {
  return (
    <AssessmentPanel
      kind="STUDENT_INTEREST"
      title="Career interest assessment"
      subtitle="Eight quick questions on a 0–4 scale. There are no right answers — this is an indicative profile used to suggest vocational pathways, not a psychological test."
    />
  );
}
