import { Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { getRoomHealthSummary } from '@/lib/roomQueries';
import { RoomListClient } from '@/components/RoomListClient';

export const dynamic = 'force-dynamic';

export default async function RoomsHealthPage() {
  const data = await getRoomHealthSummary();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EEEEF5] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEEDFB] px-3 py-0.5 text-xs font-bold text-[#5B4BDB] mb-2">
            <Sparkles className="h-3.5 w-3.5 fill-[#5B4BDB]" />
            <span>Giám Sát Vận Hành (Room Operations)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14142B]">
            Sức Khỏe Phòng KTX &amp; Nguy Cơ Rã Phòng (Churn Risk)
          </h1>
          <p className="mt-1 text-sm text-[#8A8AA3]">
            Theo dõi nhịp độ sinh hoạt, phân tích chênh lệch điểm Effort (Mục 5.3) và cảnh báo nguy cơ rã phòng.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-[#D1FADF] bg-[#ECFDF3] px-3.5 py-2 text-xs font-bold text-[#027A48] shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Ops Cross-Room View</span>
        </div>
      </div>

      {/* Interactive Room List with Filter Cards & Drawer */}
      <RoomListClient initialData={data} />
    </div>
  );
}
