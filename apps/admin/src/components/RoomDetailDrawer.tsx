'use client';

import React, { useState } from 'react';
import type { RoomHealthItem } from '@/lib/roomQueries';
import {
  X,
  Building2,
  Users,
  Copy,
  Check,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  Sparkles,
  Clock,
  Calendar,
  Shield,
  ArrowUpRight,
  TrendingUp,
  Activity,
  UserCheck,
  UserX,
  BellRing,
} from 'lucide-react';

interface RoomDetailDrawerProps {
  room: RoomHealthItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RoomDetailDrawer({
  room,
  isOpen,
  onClose,
}: RoomDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [nudgeSent, setNudgeSent] = useState(false);

  if (!isOpen || !room) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendNudge = () => {
    setNudgeSent(true);
    setTimeout(() => setNudgeSent(false), 3000);
  };

  const isHealthy = room.churnRisk === 'healthy';
  const isHighRisk = room.churnRisk === 'high';
  const isMediumRisk = room.churnRisk === 'medium';
  const isNew = room.churnRisk === 'new';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEEEF5] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEEDFB] text-[#5B4BDB]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#14142B]">{room.name}</h2>
                {room.isPro ? (
                  <span className="rounded-full bg-[#5B4BDB] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                    PRO
                  </span>
                ) : (
                  <span className="rounded-full bg-[#EEEEF5] px-2 py-0.5 text-[10px] font-bold text-[#8A8AA3]">
                    FREE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8A8AA3]">
                Khởi tạo ngày: {new Date(room.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8A8AA3] transition hover:bg-[#F2F2F8] hover:text-[#14142B]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Invite Code Quick Box */}
          <div className="flex items-center justify-between rounded-2xl border border-[#DDD9F8] bg-[#F8F8FD] p-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8AA3]">
                Mã mời gia nhập KTX
              </span>
              <div className="mt-0.5 font-mono text-xl font-extrabold text-[#5B4BDB]">
                {room.inviteCode}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-xl bg-white border border-[#DDD9F8] px-3.5 py-2 text-xs font-bold text-[#5B4BDB] shadow-sm transition hover:bg-[#EEEDFB]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#10B981]" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>

          {/* Churn Risk Diagnosis Card */}
          <div className="prodify-card p-5 border">
            <div className="flex items-center justify-between border-b border-[#F0F0F6] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A8AA3]">
                Đánh giá Sức Khỏe &amp; Nguy cơ Churn (ADR-7)
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isHealthy
                    ? 'bg-[#DCFCE7] text-[#16A34A]'
                    : isMediumRisk
                    ? 'bg-[#FEF3C7] text-[#D97706]'
                    : isHighRisk
                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                    : 'bg-[#EEEDFB] text-[#5B4BDB]'
                }`}
              >
                {isHealthy && <CheckCircle className="h-3.5 w-3.5" />}
                {isMediumRisk && <AlertTriangle className="h-3.5 w-3.5" />}
                {isHighRisk && <AlertOctagon className="h-3.5 w-3.5" />}
                {isNew && <Sparkles className="h-3.5 w-3.5" />}
                {isHealthy
                  ? 'Hoạt động khỏe mạnh'
                  : isMediumRisk
                  ? 'Cần theo dõi'
                  : isHighRisk
                  ? 'Nguy cơ Churn cao'
                  : 'Phòng mới khởi tạo'}
              </span>
            </div>

            <div className="mt-3.5 space-y-2">
              <p className="text-xs font-medium text-[#14142B]">Các yếu tố phân tích:</p>
              <ul className="space-y-1.5 text-xs text-[#6B6B80]">
                {room.churnRiskReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5B4BDB] mt-1.5 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="rounded-2xl border border-[#EEEEF5] bg-[#FBFBFE] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8A8AA3]">
                <Activity className="h-4 w-4 text-[#5B4BDB]" />
                <span>Tỉ lệ hoàn thành việc</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#14142B]">
                  {room.completionRate.toFixed(0)}%
                </span>
                <span className="text-xs text-[#8A8AA3]">
                  ({room.completedTasks}/{room.completedTasks + room.expiredTasks} đã đóng)
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#ECECF2] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4FD1C5]"
                  style={{ width: `${Math.min(room.completionRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#EEEEF5] bg-[#FBFBFE] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8A8AA3]">
                <Clock className="h-4 w-4 text-[#F59E42]" />
                <span>Hoạt động gần nhất</span>
              </div>
              <div className="mt-2">
                <span className="text-xl font-extrabold text-[#14142B]">
                  {room.daysSinceLastActivity === 0
                    ? 'Hôm nay'
                    : `${room.daysSinceLastActivity} ngày trước`}
                </span>
                <p className="text-[11px] text-[#8A8AA3] mt-0.5 truncate">
                  {new Date(room.lastActivityAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          {/* Member Retention & Capacity */}
          <div className="prodify-card p-5 border">
            <div className="flex items-center justify-between border-b border-[#F0F0F6] pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#5B4BDB]" />
                <h3 className="text-sm font-bold text-[#14142B]">Thành Viên &amp; Sức Chứa</h3>
              </div>
              <span className="text-xs font-bold text-[#5B4BDB]">
                {room.activeMemberCount} / {room.maxMembers} thành viên
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-[#F0FDF4] p-3 text-[#16A34A] border border-[#DCFCE7]">
                <UserCheck className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-bold">{room.activeMemberCount} người</span>
                  <p className="text-[10px] text-[#15803D]">Đang hoạt động</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-[#FEF2F2] p-3 text-[#DC2626] border border-[#FEE2E2]">
                <UserX className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-bold">{room.leftMemberCount} người</span>
                  <p className="text-[10px] text-[#B91C1C]">Đã rời phòng</p>
                </div>
              </div>
            </div>

            {/* Quota Equity Simulation */}
            <div className="mt-4 rounded-xl bg-[#F8F8FD] p-3 border border-[#F0F0F6]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#14142B]">Cân bằng Effort Tuần (Quota Equity)</span>
                <span className="font-bold text-[#5B4BDB]">Mục tiêu 60 pts</span>
              </div>
              <p className="mt-1 text-[11px] text-[#8A8AA3] leading-relaxed">
                Hệ thống giám sát độ lệch điểm đóng góp. Nếu một thành viên làm hơn 40% so với người thấp nhất, Masoct Bro sẽ gợi ý tái cân bằng việc nhà để giảm xung đột.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#EEEEF5] bg-[#FBFBFE] p-4 flex items-center justify-between gap-3">
          <button
            onClick={handleSendNudge}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition ${
              nudgeSent
                ? 'bg-[#D1FADF] text-[#027A48]'
                : 'bg-white border border-[#DDD9F8] text-[#5B4BDB] hover:bg-[#EEEDFB]'
            }`}
          >
            {nudgeSent ? (
              <>
                <Check className="h-4 w-4" />
                <span>Đã gửi nhắc nhở!</span>
              </>
            ) : (
              <>
                <BellRing className="h-4 w-4" />
                <span>Gửi nhắc nhở phòng</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-[#5B4BDB] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#5B4BDB]/25 transition hover:bg-[#4C3BC7]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
