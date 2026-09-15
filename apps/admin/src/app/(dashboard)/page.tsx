import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Home,
  Users,
  Sparkles,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { getKpiSummary } from '@/lib/kpiQueries';
import { KpiCard } from '@/components/KpiCard';
import { MetricProgress } from '@/components/MetricProgress';

export const dynamic = 'force-dynamic';

export default async function DashboardHomePage() {
  const kpi = await getKpiSummary();

  const formattedDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Operations Dashboard</h1>
          <p className="text-sm text-[#A8A8A8]">
            North Star Metrics &amp; giám sát vận hành thời gian thực • {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Ops Role Verified
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#A8A8A8]">
            <Calendar className="h-3.5 w-3.5" />
            7-day rolling
          </div>
        </div>
      </div>

      {/* Urgent Operational Alerts */}
      {kpi.openDisputesCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-white">
                Có <span className="font-bold text-amber-400">{kpi.openDisputesCount}</span> khiếu nại (dispute) đang chờ xử lý
              </p>
              <p className="text-xs text-[#A8A8A8]">
                Bảo vệ tính ẩn danh và công bằng trong phòng bằng việc phân xử kịp thời.
              </p>
            </div>
          </div>
          <Link
            href="/disputes"
            className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400"
          >
            Đến hàng đợi
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 6 Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Tỉ lệ hoàn thành Task"
          value={`${kpi.completionRate.toFixed(1)}%`}
          subtitle={`${kpi.completedTasks} hoàn thành / ${kpi.completedTasks + kpi.expiredTasks} đã đóng`}
          icon={CheckCircle2}
          badge={{
            text: kpi.completionRate >= 80 ? 'Khỏe mạnh' : 'Cần chú ý',
            variant: kpi.completionRate >= 80 ? 'success' : 'warning',
          }}
        />

        <KpiCard
          title="Tỉ lệ đúng hạn (On-Time)"
          value={`${kpi.onTimeCompletionRate.toFixed(1)}%`}
          subtitle="Hoàn thành trước hoặc đúng hạn deadline"
          icon={Clock}
          badge={{
            text: kpi.onTimeCompletionRate >= 75 ? 'Đạt chuẩn' : 'Chậm trễ',
            variant: kpi.onTimeCompletionRate >= 75 ? 'success' : 'warning',
          }}
        />

        <KpiCard
          title="Phòng hoạt động 7 ngày"
          value={`${kpi.activeRooms7d} / ${kpi.totalRooms}`}
          subtitle={`Tỉ lệ tương tác ${kpi.totalRooms > 0 ? ((kpi.activeRooms7d / kpi.totalRooms) * 100).toFixed(0) : 0}% tổng phòng`}
          icon={Home}
          badge={{
            text: `${kpi.activeRooms7d} active`,
            variant: 'purple',
          }}
        />

        <KpiCard
          title="Room 30-Day Retention"
          value={kpi.retentionRate30d !== null ? `${kpi.retentionRate30d.toFixed(1)}%` : 'Đang tích lũy'}
          subtitle="Tỉ lệ phòng vẫn hoạt động sau 30 ngày tạo"
          icon={Sparkles}
          badge={{
            text: kpi.retentionRate30d !== null ? 'North Star' : 'New Cohort',
            variant: 'info',
          }}
        />

        <KpiCard
          title="Gói Pro (RevenueCat)"
          value={kpi.proRooms}
          subtitle={`Tỉ lệ chuyển đổi: ${kpi.proConversionRate.toFixed(1)}%`}
          icon={Sparkles}
          badge={{
            text: 'Pro Rooms',
            variant: 'purple',
          }}
        />

        <KpiCard
          title="Tổng thành viên"
          value={kpi.totalMembers}
          subtitle={`Tổng số task phát sinh: ${kpi.totalTasks}`}
          icon={Users}
          badge={{
            text: 'Active Members',
            variant: 'neutral',
          }}
        />
      </div>

      {/* Grid: Task Health Breakdown & 7-Day Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Task Health Performance */}
        <div className="rounded-2xl border border-white/10 bg-[#242424] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Chỉ số Hiệu suất &amp; Mục tiêu</h2>
              <p className="text-xs text-[#A8A8A8]">Đánh giá chất lượng thực thi so với Benchmark</p>
            </div>
            <Layers className="h-5 w-5 text-[#A8A8A8]" />
          </div>

          <div className="mt-6 space-y-5">
            <MetricProgress
              label="Task Completion Rate"
              value={kpi.completionRate}
              color="emerald"
              hint="Benchmark mục tiêu: ≥ 80% task hoàn thành đúng cam kết"
            />

            <MetricProgress
              label="On-Time Completion Rate"
              value={kpi.onTimeCompletionRate}
              color="purple"
              hint="Benchmark mục tiêu: ≥ 75% hoàn thành trước thời hạn"
            />

            <MetricProgress
              label="Pro Conversion Rate"
              value={kpi.proConversionRate}
              color="amber"
              hint="Benchmark mục tiêu: ≥ 10% phòng nâng cấp Pro"
            />
          </div>

          {/* Quick Task Status Counter */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/5 pt-5 text-center">
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-[#A8A8A8]">Hoàn thành</span>
              <span className="text-lg font-bold text-emerald-400">{kpi.completedTasks}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-[#A8A8A8]">Đang xử lý</span>
              <span className="text-lg font-bold text-blue-400">{kpi.inProgressTasks}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-[#A8A8A8]">Hết hạn (Quá hạn)</span>
              <span className="text-lg font-bold text-red-400">{kpi.expiredTasks}</span>
            </div>
          </div>
        </div>

        {/* 7-Day Activity Stream */}
        <div className="rounded-2xl border border-white/10 bg-[#242424] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Diễn biến Task 7 ngày qua</h2>
              <p className="text-xs text-[#A8A8A8]">So sánh khối lượng việc tạo ra và việc hoàn thành</p>
            </div>
            <Calendar className="h-5 w-5 text-[#A8A8A8]" />
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {kpi.recentActivityTimeline.map((item) => (
              <div key={item.date} className="flex items-center justify-between py-2.5 text-xs">
                <span className="font-mono text-[#A8A8A8]">{item.date}</span>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-blue-300">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Tạo mới: <strong className="text-white">{item.created}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Hoàn thành: <strong className="text-white">{item.completed}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Categories distribution */}
          <div className="mt-5 border-t border-white/5 pt-4">
            <span className="text-xs font-medium uppercase tracking-wider text-[#A8A8A8]">
              Phân loại việc nhà phổ biến
            </span>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {kpi.tasksByCategory.length > 0 ? (
                kpi.tasksByCategory.slice(0, 6).map((c) => (
                  <span
                    key={c.category}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[#FAFAF9]"
                  >
                    <span>{c.category}</span>
                    <span className="rounded-md bg-white/10 px-1.5 py-0.2 text-[10px] font-semibold text-[#A78BFA]">
                      {c.count}
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#737373]">Chưa có dữ liệu phân loại</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
