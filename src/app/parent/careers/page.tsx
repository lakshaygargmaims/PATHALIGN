import { TradeExplorer } from '@/components/careers/trade-explorer';

export const metadata = { title: 'Explore Careers' };

export default function ParentCareersPage() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-500">
        See exactly what each course costs, how long it takes, what people actually earn — and how trustworthy each
        record is before you decide.
      </p>
      <TradeExplorer basePath="/parent/careers" />
    </div>
  );
}
