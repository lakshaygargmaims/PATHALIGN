import { RadarPanel } from '@/components/radar/radar-panel';

export const metadata = { title: 'Local Opportunity Radar' };

export default function ParentRadarPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        Check what actually exists near your town — institutes, course fees, durations and employment records — before
        you commit to anything.
      </p>
      <RadarPanel />
    </div>
  );
}
