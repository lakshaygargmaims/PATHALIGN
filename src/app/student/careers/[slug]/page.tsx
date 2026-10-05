import { TradeDetail } from '@/components/careers/trade-detail';

export default function StudentTradePage({ params }: { params: { slug: string } }) {
  return <TradeDetail slug={params.slug} basePath="/student/careers" />;
}
