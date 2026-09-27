import { AlertTriangle, ShieldCheck, ShieldAlert, Sparkles, Lock } from 'lucide-react';
import { getDisputesList } from '@/lib/disputeQueries';
import { DisputeQueueClient } from '@/components/DisputeQueueClient';

export const dynamic = 'force-dynamic';

export default async function DisputesPage() {
  const data = await getDisputesList();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EEEEF5] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FED7D7] px-3 py-0.5 text-xs font-bold text-[#C53030] mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Phân Xử Tranh Chấp (Dispute Moderation)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14142B]">
            Hàng Đợi Phân Xử Khiếu Nại &amp; Bằng Chứng Ảnh
          </h1>
          <p className="mt-1 text-sm text-[#8A8AA3]">
            Xử lý khiếu nại "Chưa sạch", nộp ảnh giả hoặc bỏ việc. Danh tính người báo được giải mã dành riêng cho Ops.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-[#DDD9F8] bg-[#EEEDFB] px-3.5 py-2 text-xs font-bold text-[#5B4BDB] shadow-sm">
          <Lock className="h-4 w-4" />
          <span>Anonymity Shield Unmasked (Ops)</span>
        </div>
      </div>

      {/* Anonymity Shield Banner Note */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#DDD9F8] bg-[#F8F8FD] p-4 text-xs text-[#6B6B80]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5B4BDB] text-white">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <span className="font-bold text-[#14142B]">
            Kiến trúc Bảo Vệ Danh Tính Khiếu Nại (ADR-4 &amp; ARCH Mục 6.6):
          </span>
          <p className="mt-0.5 leading-relaxed">
            Trên ứng dụng di động của sinh viên, người gửi khiếu nại hoàn toàn ẩn danh để bảo vệ hòa khí phòng KTX. Chỉ tài khoản vận hành (vai trò <code>ops</code>) trên trang Web Admin này mới được phép nhìn thấy tên thật của người tố cáo để phòng ngừa hành vi spam hoặc khiếu nại ác ý.
          </p>
        </div>
      </div>

      {/* Interactive Dispute Queue */}
      <DisputeQueueClient initialData={data} />
    </div>
  );
}
