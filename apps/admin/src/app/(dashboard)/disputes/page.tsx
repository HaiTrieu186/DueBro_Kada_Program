import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { getDisputesList } from '@/lib/disputeQueries';
import { DisputeQueueClient } from '@/components/DisputeQueueClient';

export const dynamic = 'force-dynamic';

export default async function DisputesPage() {
  const data = await getDisputesList();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dispute Moderation Queue</h1>
          <p className="text-sm text-[#A8A8A8]">
            Hàng đợi xử lý khiếu nại "Chưa sạch" &amp; mâu thuẫn phòng trọ (Ops unmasked identity access).
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          Anonymity Shield Unmasked
        </div>
      </div>

      {/* Interactive Dispute Queue */}
      <DisputeQueueClient initialData={data} />
    </div>
  );
}
