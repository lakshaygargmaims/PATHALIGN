import { AssessmentPanel } from '@/components/assessment/assessment-panel';

export const metadata = { title: 'Your Expectations — PATHALIGN AI' };

export default function ParentAssessmentPage() {
  return (
    <AssessmentPanel
      kind="PARENT_EXPECTATIONS"
      title="Your expectations as a parent"
      subtitle="Six questions about security, cost and social pressure. This shows where a joint conversation is most useful — it is not a judgement of your parenting."
    />
  );
}
