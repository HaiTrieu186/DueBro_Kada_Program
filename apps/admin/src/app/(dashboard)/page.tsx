import Link from 'next/link';
import {
  Sparkles,
  Building2,
  AlertTriangle,
  BrainCircuit,
  Target,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Plus,
  Home,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { getKpiSummary } from '@/lib/kpiQueries';
import { getRoomHealthSummary } from '@/lib/roomQueries';
import { ProdifyTasksCard } from '@/components/ProdifyTasksCard';
import CreateRoomTrigger from '@/components/CreateRoomTrigger';

export const dynamic = 'force-dynamic';

export default async function DashboardHomePage() {
  const [kpi, roomHealth] = await Promise.all([
    getKpiSummary(),
    getRoomHealthSummary(),
  ]);

  const formattedDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalFinishedTasks = kpi.completedTasks + kpi.expiredTasks;
  const disputeRate = totalFinishedTasks > 0 ? (kpi.openDisputesCount / totalFinishedTasks) * 100 : 0;
  const healthyRoomPct = roomHealth.totalRooms > 0 
    ? Math.round((roomHealth.healthyRooms / roomHealth.totalRooms) * 100) 
    : 100;

  return (
    <div className="space-y-8">
      {/* 1. Header Banner Area */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between border-b border-[#EEEEF5] pb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EEEDFB] px-3.5 py-1 text-xs font-bold text-[#5B4BDB] mb-3">
            <Calendar className="h-3.5 w-3.5" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14142B] sm:text-4xl">
            Xin chào, Courtney (Ops Admin)
          </h1>
          <h2 className="mt-1 text-xl sm:text-2xl font-semibold bg-gradient-to-r from-[#4FD1C5] via-[#5B4BDB] to-[#8B7CE8] bg-clip-text text-transparent">
            Hệ thống vận hành Due Bro sẵn sàng • North Star Metrics
          </h2>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-pill btn-ask-ai inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-xs font-bold text-white shadow-md shadow-[#5B4BDB]/25 transition hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles className="h-4 w-4 fill-white text-white shrink-0" />
            <span className="whitespace-nowrap">Hỏi Bro AI</span>
          </button>
          
          <Link
            href="/disputes"
            className="btn-pill btn-outline-gradient inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-[#E4E4EE] bg-white text-xs font-semibold text-[#14142B] shadow-sm transition hover:border-[#5B4BDB] hover:text-[#5B4BDB] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span>Hàng đợi khiếu nại</span>
              {kpi.openDisputesCount > 0 && (
                <span className="rounded-full bg-[#E5484D] px-2 py-0.5 text-[10px] font-extrabold text-white">
                  {kpi.openDisputesCount}
                </span>
              )}
            </span>
          </Link>

          <Link
            href="/rooms"
            className="btn-pill btn-outline-gradient inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-[#E4E4EE] bg-white text-xs font-semibold text-[#14142B] shadow-sm transition hover:border-[#5B4BDB] hover:text-[#5B4BDB] hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <span>Giám sát {roomHealth.totalRooms} phòng KTX</span>
          </Link>

          <Link
            href="/ml-monitor"
            className="btn-pill btn-outline-gradient inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-[#E4E4EE] bg-white text-xs font-semibold text-[#14142B] shadow-sm transition hover:border-[#5B4BDB] hover:text-[#5B4BDB] hover:scale-[1.02] active:scale-[0.98]"
          >
            <BrainCircuit className="h-4 w-4 text-[#5B4BDB] shrink-0" />
            <span className="whitespace-nowrap">AI Matching &amp; ML</span>
          </Link>
        </div>
      </section>

      {/* 2. Urgent Operations Alert (if any dispute is active) */}
      {kpi.openDisputesCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#FFD6D9] bg-[#FFF5F6] p-4 text-[#E5484D] shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFD6D9] text-[#E5484D]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#14142B]">
                Có <span className="text-[#E5484D]">{kpi.openDisputesCount}</span> khiếu nại việc nhà đang chờ xử lý
              </p>
              <p className="text-xs text-[#8A8AA3]">
                Bảo vệ tính ẩn danh và công bằng trong phòng bằng việc phân xử kịp thời.
              </p>
            </div>
          </div>
          <Link
            href="/disputes"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#E5484D] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#D53B40] shrink-0"
          >
            Đến hàng đợi phân xử
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Main Dashboard 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Tasks + North Star Goals (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Card 1: Prodify My Tasks / Lifecycle */}
          <ProdifyTasksCard
            inProgressCount={kpi.inProgressTasks}
            openDisputesCount={kpi.openDisputesCount}
          />

          {/* Card 2: My Goals / North Star Metrics */}
          <div className="prodify-card p-6">
            <div className="flex items-center justify-between border-b border-[#F0F0F6] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A7F0E0] text-[#0F766E]">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14142B]">
                    Mục Tiêu Vận Hành (North Star Goals)
                  </h3>
                  <p className="text-xs text-[#8A8AA3]">
                    Đo lường tính công bằng, tỷ lệ hoàn thành việc nhà &amp; giữ chân KTX
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#5B4BDB] bg-[#EEEDFB] px-2.5 py-1 rounded-full">
                7-day rolling
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {/* Goal 1: Completion Rate */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#14142B]">
                      Tỉ lệ Hoàn Thành Task
                    </span>
                    <span className="rounded bg-[#A7F0E0] px-1.5 py-0.5 text-[10px] font-bold text-[#0F766E]">
                      Mục tiêu 80%
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8AA3] truncate mt-0.5">
                    {kpi.completedTasks} hoàn thành / {totalFinishedTasks || 0} đã đóng • {kpi.inProgressTasks} đang thực hiện
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 rounded-full bg-[#ECECF2] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4FD1C5] shadow-[0_0_8px_rgba(79,209,197,0.5)] transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(kpi.completionRate, 5), 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-extrabold text-[#14142B]">
                    {kpi.completionRate.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Goal 2: On-Time Rate */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#14142B]">
                      Tỉ lệ Đúng Hạn (On-Time)
                    </span>
                    <span className="rounded bg-[#FFD9A8] px-1.5 py-0.5 text-[10px] font-bold text-[#B45309]">
                      Mục tiêu 75%
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8AA3] truncate mt-0.5">
                    Nộp bằng chứng ảnh trước hoặc đúng hạn deadline việc nhà
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 rounded-full bg-[#ECECF2] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F59E42] shadow-[0_0_8px_rgba(245,158,66,0.5)] transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(kpi.onTimeCompletionRate, 5), 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-extrabold text-[#14142B]">
                    {kpi.onTimeCompletionRate.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Goal 3: Healthy Rooms */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#14142B]">
                      Tỉ lệ Phòng Khỏe Mạnh
                    </span>
                    <span className="rounded bg-[#EEEDFB] px-1.5 py-0.5 text-[10px] font-bold text-[#5B4BDB]">
                      Mục tiêu 90%
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8AA3] truncate mt-0.5">
                    {roomHealth.healthyRooms} phòng duy trì hoạt động tốt / {roomHealth.totalRooms} tổng số phòng
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 rounded-full bg-[#ECECF2] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5B4BDB] shadow-[0_0_8px_rgba(91,75,219,0.5)] transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(healthyRoomPct, 5), 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-extrabold text-[#14142B]">
                    {healthyRoomPct}%
                  </span>
                </div>
              </div>

              {/* Goal 4: Low Dispute Rate */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#14142B]">
                      Kiểm Soát Tranh Chấp (Dispute Control)
                    </span>
                    <span className="rounded bg-[#A7F0E0] px-1.5 py-0.5 text-[10px] font-bold text-[#0F766E]">
                      Chuẩn &lt; 5%
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8AA3] truncate mt-0.5">
                    {kpi.openDisputesCount} khiếu nại mở • Duy trì hòa khí KTX
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 rounded-full bg-[#ECECF2] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(100 - disputeRate, 10), 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-extrabold text-[#14142B]">
                    {disputeRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quota Rules Notice Footnote */}
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6] text-xs text-[#6B6B80]">
              <Info className="h-4 w-4 text-[#5B4BDB] shrink-0 mt-0.5" />
              <span>
                <strong>Luật Quota Tuần (ARCH Mục 5.3):</strong> Mỗi thành viên đạt tối thiểu 60 điểm Effort/tuần. Độ lệch điểm giữa thành viên cao nhất và thấp nhất không được vượt quá 40% để tránh nguy cơ rã phòng (Churn Risk).
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Rooms 2x2 + Schedule + Reminders (5 Cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Card 3: Active Households & Rooms 2x2 */}
          <div className="prodify-card p-6">
            <div className="flex items-center justify-between border-b border-[#F0F0F6] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFB] text-[#5B4BDB]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14142B]">
                    Phòng KTX Hoạt Động
                  </h3>
                  <p className="text-xs text-[#8A8AA3]">
                    {roomHealth.totalRooms} phòng đã tham gia hệ thống
                  </p>
                </div>
              </div>

              <Link
                href="/rooms"
                className="flex items-center gap-1 text-xs font-semibold text-[#5B4BDB] hover:underline"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* 2x2 Grid */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Box 1: Create New Room Trigger */}
              <CreateRoomTrigger />

              {/* Box 2..4: Top Rooms */}
              {roomHealth.rooms.slice(0, 3).map((room, idx) => {
                const iconColors = [
                  'bg-[#F0EFFB] text-[#5B4BDB]',
                  'bg-[#FEF3C7] text-[#D97706]',
                  'bg-[#DCFCE7] text-[#16A34A]',
                ];
                const colorClass = iconColors[idx % iconColors.length];
                
                return (
                  <Link
                    key={room.id}
                    href="/rooms"
                    className="flex items-center gap-3 rounded-2xl border border-[#F0F0F6] bg-white p-3.5 shadow-sm transition hover:border-[#DDD9F8] hover:shadow-md"
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                      <Home className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-[#14142B] truncate">
                        {room.name}
                      </span>
                      <span className="block text-[11px] text-[#8A8AA3] truncate">
                        {room.totalTasks} việc • {room.activeMemberCount} thành viên
                      </span>
                      <span className={`inline-block mt-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                        room.churnRisk === 'healthy' 
                          ? 'bg-[#DCFCE7] text-[#16A34A]'
                          : room.churnRisk === 'medium'
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}>
                        {room.churnRisk === 'healthy' ? 'Khỏe mạnh' : room.churnRisk === 'medium' ? 'Chú ý' : 'Nguy cơ'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Card 4: Automation Schedule (pg_cron) */}
          <div className="prodify-card p-6">
            <div className="flex items-center justify-between border-b border-[#F0F0F6] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFD9A8] text-[#B45309]">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14142B]">
                    Lịch Vận Hành Tự Động (pg_cron)
                  </h3>
                  <p className="text-xs text-[#8A8AA3]">
                    Lịch trình background jobs phân việc &amp; đối soát
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                Active
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              <div className="flex items-start gap-3 rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#A7F0E0] text-[#0F766E] mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14142B]">
                      06:00 — Phân bổ việc nhà định kỳ
                    </span>
                    <span className="text-[10px] font-bold text-[#0F766E] bg-[#A7F0E0] px-2 py-0.5 rounded-full">
                      Đã chạy
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8AA3] mt-0.5">
                    Tự động tạo task instances theo lịch phòng &amp; dispatch thông báo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFD9A8] text-[#B45309] mt-0.5">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14142B]">
                      23:59 — Chốt sổ &amp; Phạt Karma
                    </span>
                    <span className="text-[10px] font-bold text-[#B45309] bg-[#FFD9A8] px-2 py-0.5 rounded-full">
                      Hàng đêm
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8AA3] mt-0.5">
                    Kiểm tra task hết hạn, phạt -15 Karma &amp; chuyển sang Bounty Board.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEEDFB] text-[#5B4BDB] mt-0.5">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14142B]">
                      CN 23:59 — Tổng kết Quota Tuần
                    </span>
                    <span className="text-[10px] font-bold text-[#5B4BDB] bg-[#EEEDFB] px-2 py-0.5 rounded-full">
                      Cuối tuần
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8AA3] mt-0.5">
                    Tính tổng Effort points và cập nhật xếp hạng tín nhiệm phòng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
