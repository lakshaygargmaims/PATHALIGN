import { ConsensusPanel } from '@/components/consensus/consensus-panel';

export const metadata = { title: 'Family Decisions' };

export default function ParentConsensusPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        List the careers you would be comfortable with. Your child does the same separately — then the platform shows
        the overlap, the gaps and the evidence behind each option.
      </p>
      <ConsensusPanel />
    </div>
  );
}
