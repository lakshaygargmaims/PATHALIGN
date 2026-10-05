import { ConsensusPanel } from '@/components/consensus/consensus-panel';

export const metadata = { title: 'Family Consensus' };

export default function StudentConsensusPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        You and your parent shortlist careers independently. The engine then shows what you agree on, where you differ,
        and alternatives worth discussing — nobody is forced into agreement.
      </p>
      <ConsensusPanel />
    </div>
  );
}
