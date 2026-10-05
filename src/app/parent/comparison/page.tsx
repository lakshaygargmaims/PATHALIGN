import { Suspense } from 'react';
import { SimulatorPanel } from '@/components/simulator/simulator-panel';
import { CardSkeleton } from '@/components/ui/states';

export const metadata = { title: 'Career Comparison' };

export default function ParentComparisonPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        Put two careers side by side — training duration, cost, qualification, earning ranges, employment pathways and
        progression — before you discuss it with your child.
      </p>
      <Suspense fallback={<CardSkeleton rows={5} />}>
        <SimulatorPanel mode="compare" />
      </Suspense>
    </div>
  );
}
