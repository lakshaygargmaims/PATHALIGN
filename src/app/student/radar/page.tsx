import { RadarPanel } from '@/components/radar/radar-panel';

export const metadata = { title: 'Local Opportunity Radar' };

export default function StudentRadarPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        Discover training centres, courses and employment records near your district. Training centres and actual job
        openings are clearly separated — nothing here is invented.
      </p>
      <RadarPanel />
    </div>
  );
}
