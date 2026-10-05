import { ConfidencePanel } from '@/components/confidence/confidence-panel';

export const metadata = { title: 'Family Career Confidence Score' };

export default function ParentConfidencePage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        See how your family’s understanding of vocational careers changes after counselling — across awareness, trust
        in information, salary understanding, progression awareness and willingness to consider options.
      </p>
      <ConfidencePanel />
    </div>
  );
}
