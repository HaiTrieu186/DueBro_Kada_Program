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
  Coins,
  Bot,
  Zap,
} from 'lucide-react';
import { getMlMonitoringSummary } from '@/lib/mlQueries';
import MlPredictionsTableClient from '@/components/MlPredictionsTableClient';

export const dynamic = 'force-dynamic';

export default async function MlMonitorPage() {
  const summary = await getMlMonitoringSummary();

  const isTier2 = summary.completedTasksCount >= summary.thresholdTarget;
  const remainingTasks = Math.max(0, summary.thresholdTarget - summary.completedTasksCount);

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EEEEF5] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEEDFB] px-3 py-0.5 text-xs font-bold text-[#5B4BDB] mb-2">
            <Sparkles className="h-3.5 w-3.5 fill-[#5B4BDB]" />
            <span>Trí Tuệ Nhân Tạo &amp; Thuật Toán (AI / ML Operations)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14142B]">
            Giám Sát Mô Hình AI / ML &amp; Ngưỡng Cold Start
          </h1>
          <p className="mt-1 text-sm text-[#8A8AA3]">
            Theo dõi thuật toán Weighted Fairness Score, tiến trình Cold Start 500 tasks, và hạn mức gọi Google Gemini API.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-[#DDD9F8] bg-[#EEEDFB] px-3.5 py-2 text-xs font-bold text-[#5B4BDB] shadow-sm">
          <BrainCircuit className="h-4 w-4" />
          <span>Fairness Engine v1.2</span>
        </div>
      </div>

      {/* 2. Top Stats: Cold Start Milestone & Gemini LLM Quota */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Cold Start 500 Tasks Milestone (7 Cols) */}
        <div className="lg:col-span-7 prodify-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F0F6] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFB] text-[#5B4BDB]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#14142B]">
                  Ngưỡng Dữ Liệu Cold Start (500 Tasks)
                </h3>
                <p className="text-xs text-[#8A8AA3]">
                  {summary.currentTier}
                </p>
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isTier2
                  ? 'bg-[#DCFCE7] text-[#16A34A]'
                  : 'bg-[#FEF3C7] text-[#D97706]'
              }`}
            >
              {isTier2 ? 'Tier 2 Active' : `Còn ${remainingTasks} task`}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <p className="text-xs text-[#6B6B80] leading-relaxed">
              Theo tài liệu kỹ thuật Due Bro (Mục 5 &amp; 7), hệ thống sử dụng thuật toán{' '}
              <strong className="text-[#14142B]">Weighted Fairness Score (Rule-Based v1.2)</strong> trong giai đoạn khởi động với 18 profile mẫu để đảm bảo chia việc tuyệt đối công bằng. Khi đạt đủ <strong className="text-[#5B4BDB]">500 task hoàn thành</strong>, mô hình LightGBM sẽ tham gia xếp hạng ứng viên.
            </p>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#14142B] mb-1.5">
                <span>Tiến độ dữ liệu thực tế:</span>
                <span className="text-[#5B4BDB] font-bold">
                  {summary.completedTasksCount} / {summary.thresholdTarget} tasks ({summary.thresholdProgressPct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#ECECF2] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#4FD1C5] to-[#5B4BDB] shadow-[0_0_8px_rgba(91,75,219,0.4)] transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(summary.thresholdProgressPct, 5), 100)}%` }}
                />
              </div>
            </div>

            {/* Seed Profiles Indicator */}
            <div className="flex items-center justify-between rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6] text-xs">
              <span className="text-[#6B6B80]">
                Bộ dữ liệu mẫu: <strong>18 hồ sơ sinh viên KTX (Seed Profiles)</strong>
              </span>
              <span className="font-bold text-[#10B981] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                Sẵn sàng
              </span>
            </div>
          </div>
        </div>

        {/* Gemini LLM Quota & AI Ops (5 Cols) */}
        <div className="lg:col-span-5 prodify-card p-6">
          <div className="flex items-center justify-between border-b border-[#F0F0F6] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#027A48]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#14142B]">
                  Hạn Mức Google Gemini AI
                </h3>
                <p className="text-xs text-[#8A8AA3]">
                  Mô hình: gemini-2.5-flash (@google/genai)
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#EEEDFB] px-2.5 py-0.5 text-xs font-bold text-[#5B4BDB]">
              Live API
            </span>
          </div>

          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6]">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#5B4BDB]" />
                <span className="text-xs font-semibold text-[#14142B]">Tỷ lệ phản hồi hợp lệ:</span>
              </div>
              <span className="text-xs font-extrabold text-[#027A48]">99.8%</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6]">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-[#F59E42]" />
                <span className="text-xs font-semibold text-[#14142B]">Chi phí ước tính / tháng:</span>
              </div>
              <span className="text-xs font-extrabold text-[#14142B]">&lt; $5.00 USD</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0F766E]" />
                <span className="text-xs font-semibold text-[#14142B]">Tuân thủ kiến trúc (ARCH Mục 14):</span>
              </div>
              <span className="text-[10px] font-bold text-[#0F766E] bg-[#A7F0E0] px-2 py-0.5 rounded-full">
                Strict JSON
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Model Distribution & Feature Store Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Model Execution Ratio */}
        <div className="prodify-card p-6">
          <div className="flex items-center justify-between border-b border-[#F0F0F6] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#14142B]">
                Tỉ Lệ Thực Thi Model (ml_predictions)
              </h3>
              <p className="text-xs text-[#8A8AA3]">Theo dõi fallback Rule-Based vs Mô hình LightGBM</p>
            </div>
            <Cpu className="h-5 w-5 text-[#5B4BDB]" />
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#14142B] mb-1">
                <span>Rule-Based Fairness (rule_v1)</span>
                <span className="text-[#D97706] font-bold">{summary.ruleBasedPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#ECECF2] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#F59E42]"
                  style={{ width: `${Math.min(summary.ruleBasedPct, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[#8A8AA3]">Thuật toán luật cân bằng nợ công việc (Tier 1 &amp; fallback)</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#14142B] mb-1">
                <span>LightGBM Ranking Model</span>
                <span className="text-[#16A34A] font-bold">{summary.mlModelPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#ECECF2] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#10B981]"
                  style={{ width: `${Math.min(summary.mlModelPct, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[#8A8AA3]">Mô hình AI dự đoán xác suất hoàn thành &amp; xếp hạng ứng viên</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#F0F0F6] pt-4 text-center">
            <div className="rounded-xl bg-[#FFF9F2] p-3 border border-[#FFD9A8]">
              <span className="block text-xs font-medium text-[#B45309]">Lượt chạy Rule-Based</span>
              <span className="text-xl font-extrabold text-[#D97706]">{summary.ruleBasedCount}</span>
            </div>
            <div className="rounded-xl bg-[#F0FDF4] p-3 border border-[#DCFCE7]">
              <span className="block text-xs font-medium text-[#0F766E]">Lượt chạy ML Model</span>
              <span className="text-xl font-extrabold text-[#16A34A]">{summary.mlModelCount}</span>
            </div>
          </div>
        </div>

        {/* Feature Store Health (mv_member_features) */}
        <div className="prodify-card p-6">
          <div className="flex items-center justify-between border-b border-[#F0F0F6] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#14142B]">Feature Store Health</h3>
              <p className="text-xs text-[#8A8AA3]">Dữ liệu từ Materialized View mv_member_features (pg_cron refresh mỗi giờ)</p>
            </div>
            <Database className="h-5 w-5 text-[#5B4BDB]" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3.5">
            <div className="rounded-2xl border border-[#EEEEF5] bg-[#FBFBFE] p-4">
              <span className="text-xs font-semibold text-[#8A8AA3]">Thành viên có features</span>
              <p className="mt-1 text-2xl font-extrabold text-[#14142B]">
                {summary.featureStats.totalMembersWithFeatures}
              </p>
              <span className="text-[11px] text-[#5B4BDB] font-medium">Đã sẵn sàng tính điểm</span>
            </div>

            <div className="rounded-2xl border border-[#EEEEF5] bg-[#FBFBFE] p-4">
              <span className="text-xs font-semibold text-[#8A8AA3]">Tỉ lệ hoàn thành TB</span>
              <p className="mt-1 text-2xl font-extrabold text-[#16A34A]">
                {(summary.featureStats.avgCompletionRate * 100).toFixed(1)}%
              </p>
              <span className="text-[11px] text-[#8A8AA3]">Feature completion_rate</span>
            </div>

            <div className="rounded-2xl border border-[#EEEEF5] bg-[#FBFBFE] p-4">
              <span className="text-xs font-semibold text-[#8A8AA3]">Thời gian trễ TB</span>
              <p className="mt-1 text-2xl font-extrabold text-[#D97706]">
                {summary.featureStats.avgDelayHours.toFixed(1)} giờ
              </p>
              <span className="text-[11px] text-[#8A8AA3]">Feature avg_delay_hours</span>
            </div>

            <div className="rounded-2xl border border-[#EEEEF5] bg-[#FBFBFE] p-4">
              <span className="text-xs font-semibold text-[#8A8AA3]">Tiến độ chỉ tiêu TB</span>
              <p className="mt-1 text-2xl font-extrabold text-[#5B4BDB]">
                {(summary.featureStats.avgQuotaProgress * 100).toFixed(1)}%
              </p>
              <span className="text-[11px] text-[#8A8AA3]">Feature quota_progress_pct</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Prediction Audit Table (with Client Search & Filter) */}
      <MlPredictionsTableClient initialPredictions={summary.recentPredictions} />
    </div>
  );
}
