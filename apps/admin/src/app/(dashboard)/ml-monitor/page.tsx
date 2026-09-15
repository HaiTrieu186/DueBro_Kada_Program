import {
  BrainCircuit,
  ShieldCheck,
  Target,
  Sparkles,
  Layers,
  Database,
  CheckCircle2,
  Clock,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { getMlMonitoringSummary } from '@/lib/mlQueries';
import { MetricProgress } from '@/components/MetricProgress';

export const dynamic = 'force-dynamic';

export default async function MlMonitorPage() {
  const summary = await getMlMonitoringSummary();

  const isTier2 = summary.completedTasksCount >= summary.thresholdTarget;
  const remainingTasks = Math.max(0, summary.thresholdTarget - summary.completedTasksCount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ML &amp; Rule Engine Monitoring</h1>
          <p className="text-sm text-[#A8A8A8]">
            Giám sát thuật toán phân chia công bằng, ngưỡng Cold Start và tỉ lệ Fallback (Architecture Mục 5 &amp; 7).
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-semibold text-[#A78BFA]">
          <BrainCircuit className="h-4 w-4" />
          Fairness Engine V1
        </div>
      </div>

      {/* 500 Tasks Milestone Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#242424] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                  isTier2
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                {summary.currentTier}
              </span>
              <span className="text-xs text-[#737373]">• Mốc kích hoạt Tier 2: 500 Task</span>
            </div>

            <h2 className="text-lg font-bold text-white">
              {isTier2
                ? 'Đạt mốc kích hoạt Hybrid ML LightGBM Ranking!'
                : `Còn ${remainingTasks} task hoàn thành để chuyển sang Nấc 2 (LightGBM)`}
            </h2>

            <p className="max-w-2xl text-xs text-[#A8A8A8] leading-relaxed">
              Theo tài liệu kỹ thuật, hệ thống sử dụng thuật toán <strong>Weighted Fairness Score (Rule-based)</strong>{' '}
              trong giai đoạn Cold Start để đảm bảo chia việc tuyệt đối công bằng mà không cần huấn luyện sớm.
              Khi đạt đủ <strong>500 task hoàn thành</strong>, mô hình LightGBM sẽ tự động tham gia xếp hạng ứng viên dựa trên xác suất hoàn thành thực tế.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:w-72 text-right">
            <span className="text-xs text-[#A8A8A8]">Tiến độ dữ liệu</span>
            <div className="mt-1 flex items-baseline justify-end gap-1">
              <span className="text-2xl font-bold text-white">{summary.completedTasksCount}</span>
              <span className="text-xs text-[#737373]">/ {summary.thresholdTarget} tasks</span>
            </div>
            <p className="mt-1 text-xs text-[#A78BFA] font-medium">
              {summary.thresholdProgressPct.toFixed(1)}% hoàn thành
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <MetricProgress
            label="Tiến độ dữ liệu huấn luyện Cold Start"
            value={summary.thresholdProgressPct}
            color={isTier2 ? 'emerald' : 'purple'}
            displayValue={`${summary.completedTasksCount} / ${summary.thresholdTarget} tasks (${summary.thresholdProgressPct.toFixed(1)}%)`}
          />
        </div>
      </div>

      {/* Model Distribution & Feature Store Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Model Execution Ratio */}
        <div className="rounded-2xl border border-white/10 bg-[#242424] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Tỉ lệ Thực thi Model (ml_predictions)</h3>
              <p className="text-xs text-[#A8A8A8]">Theo dõi tỉ lệ fallback rule-based vs mô hình AI</p>
            </div>
            <Cpu className="h-5 w-5 text-[#A8A8A8]" />
          </div>

          <div className="mt-6 space-y-4">
            <MetricProgress
              label="Rule-Based Fairness (rule_v1)"
              value={summary.ruleBasedPct}
              color="amber"
              hint="Thuật toán luật cân bằng nợ công việc (Tier 1 & fallback)"
            />

            <MetricProgress
              label="LightGBM Ranking Model"
              value={summary.mlModelPct}
              color="emerald"
              hint="Mô hình AI dự đoán xác suất hoàn thành & xếp hạng ứng viên"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 text-center">
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-[#A8A8A8]">Lượt chạy Rule-Based</span>
              <span className="text-lg font-bold text-amber-400">{summary.ruleBasedCount}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-[#A8A8A8]">Lượt chạy ML Model</span>
              <span className="text-lg font-bold text-emerald-400">{summary.mlModelCount}</span>
            </div>
          </div>
        </div>

        {/* Feature Store Health (mv_member_features) */}
        <div className="rounded-2xl border border-white/10 bg-[#242424] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Feature Store Health</h3>
              <p className="text-xs text-[#A8A8A8]">Dữ liệu từ Materialized View mv_member_features (refresh mỗi giờ)</p>
            </div>
            <Database className="h-5 w-5 text-[#A8A8A8]" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-xs text-[#A8A8A8]">Thành viên có features</span>
              <p className="mt-1 text-xl font-bold text-white">
                {summary.featureStats.totalMembersWithFeatures}
              </p>
              <span className="text-[11px] text-[#737373]">Đã sẵn sàng tính điểm</span>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-xs text-[#A8A8A8]">Tỉ lệ hoàn thành TB</span>
              <p className="mt-1 text-xl font-bold text-emerald-400">
                {(summary.featureStats.avgCompletionRate * 100).toFixed(1)}%
              </p>
              <span className="text-[11px] text-[#737373]">Feature completion_rate</span>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-xs text-[#A8A8A8]">Thời gian trễ TB</span>
              <p className="mt-1 text-xl font-bold text-amber-400">
                {summary.featureStats.avgDelayHours.toFixed(1)} giờ
              </p>
              <span className="text-[11px] text-[#737373]">Feature avg_delay_hours</span>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <span className="text-xs text-[#A8A8A8]">Tiến độ chỉ tiêu TB</span>
              <p className="mt-1 text-xl font-bold text-[#A78BFA]">
                {(summary.featureStats.avgQuotaProgress * 100).toFixed(1)}%
              </p>
              <span className="text-[11px] text-[#737373]">Feature quota_progress_pct</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Prediction Audit Table */}
      <div className="rounded-2xl border border-white/10 bg-[#242424] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Lịch sử Xếp hạng Gần nhất (Audit Trail)</h3>
            <p className="text-xs text-[#A8A8A8]">
              Ghi nhận từ bảng ml_predictions khi auto-assign chạy tự động (mỗi 15 phút)
            </p>
          </div>
          <Clock className="h-5 w-5 text-[#A8A8A8]" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-[#A8A8A8]">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Ứng viên đề xuất</th>
                <th className="px-4 py-3">Hạng (Rank)</th>
                <th className="px-4 py-3">Điểm số (Score)</th>
                <th className="px-4 py-3">Phiên bản Model</th>
                <th className="px-4 py-3">Thời điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {summary.recentPredictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#737373]">
                    Chưa có dự đoán nào được ghi nhận. Khi cron auto-assign chạy, các lượt xếp hạng sẽ hiển thị tại đây.
                  </td>
                </tr>
              ) : (
                summary.recentPredictions.map((p) => (
                  <tr key={p.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{p.taskTitle}</td>
                    <td className="px-4 py-3 text-xs text-[#E5E5E5]">{p.candidateName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
                        #{p.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#A78BFA]">
                      {p.score.toFixed(3)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          p.modelVersion.includes('rule')
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {p.modelVersion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#737373]">
                      {new Date(p.createdAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
