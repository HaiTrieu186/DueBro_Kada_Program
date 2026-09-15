import { ShieldCheck } from 'lucide-react';

export default function DashboardHomePage() {
  return (
    <div>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Operations Dashboard</h1>
          <p className="text-sm text-[#A8A8A8]">Hệ thống giám sát vận hành &amp; phân quyền nội bộ (role=ops)</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          Ops Role Verified
        </div>
      </div>

      {/* Welcome Card */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#242424] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white">Chào mừng đến với Due Bro Admin</h2>
        <p className="mt-2 text-sm text-[#A8A8A8]">
          Hệ thống quản trị cung cấp góc nhìn tổng hợp toàn hệ thống (cross-room aggregate) thông qua service_role bảo mật ở server-side. Sử dụng thanh menu bên trái để điều hướng các tính năng:
        </p>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-[#A8A8A8]">
          <li><strong className="text-white">KPI Dashboard:</strong> Giám sát North Star Metrics (Task Completion, On-time Rate, Retention).</li>
          <li><strong className="text-white">Room Health:</strong> Theo dõi sức khỏe các phòng trọ, cảnh báo phòng nguy cơ churn.</li>
          <li><strong className="text-white">Dispute Queue:</strong> Xử lý các khiếu nại chưa sạch nhạy cảm.</li>
          <li><strong className="text-white">ML Monitoring:</strong> Giám sát phân bổ rule-based vs mô hình AI LightGBM.</li>
        </ul>
      </div>
    </div>
  );
}
