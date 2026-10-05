import { TradeExplorer } from '@/components/careers/trade-explorer';

export const metadata = { title: 'Career Explorer' };

export default function StudentCareersPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        Browse vocational trades with duration, fees, recorded earning ranges and verification status on every record.
      </p>
      <TradeExplorer basePath="/student/careers" />
    </div>
  );
}
