import { ConfidencePanel } from '@/components/confidence/confidence-panel';

export const metadata = { title: 'Family Career Confidence Score' };

export default function StudentConfidencePage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        A transparent 0–100 awareness score taken before and after counselling, broken down into five dimensions. It is
        a conversation aid — not a psychological assessment.
      </p>
      <ConfidencePanel />
    </div>
  );
}
