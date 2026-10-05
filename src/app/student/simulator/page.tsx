import { Suspense } from 'react';
import { SimulatorPanel } from '@/components/simulator/simulator-panel';
import { CardSkeleton } from '@/components/ui/states';

export const metadata = { title: 'Career Simulator' };

export default function StudentSimulatorPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        Adjust location, education, budget and experience to build a career scenario. All forward-looking figures are
        labelled estimates with their assumptions.
      </p>
      <Suspense fallback={<CardSkeleton rows={5} />}>
        <SimulatorPanel mode="simulate" />
      </Suspense>
    </div>
  );
}
