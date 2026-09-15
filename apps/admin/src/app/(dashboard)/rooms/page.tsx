import { Building2, ShieldCheck } from 'lucide-react';
import { getRoomHealthSummary } from '@/lib/roomQueries';
import { RoomListClient } from '@/components/RoomListClient';

export const dynamic = 'force-dynamic';

export default async function RoomsHealthPage() {
  const data = await getRoomHealthSummary();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Room Health &amp; Churn Risk</h1>
          <p className="text-sm text-[#A8A8A8]">
            Theo dõi sức khỏe phòng trọ, phát hiện phòng ngưng tương tác hoặc có tỉ lệ bỏ việc cao.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          Cross-Room Admin View
        </div>
      </div>

      {/* Interactive Room List */}
      <RoomListClient initialData={data} />
    </div>
  );
}
