import { TradeDetail } from '@/components/careers/trade-detail';

export default function ParentTradePage({ params }: { params: { slug: string } }) {
  return <TradeDetail slug={params.slug} basePath="/parent/careers" />;
}
