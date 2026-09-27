'use client';

import React, { useState, useTransition } from 'react';
import type { DisputeItem, DisputeSummary } from '@/lib/disputeQueries';
import {
  overruleDisputeAndApprove,
  upholdDisputeAndReopen,
  penalizeKarmaAndReopen,
} from '@/app/actions/disputeActions';
import EvidenceModal from './EvidenceModal';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Clock,
  Home,
  Check,
  RefreshCw,
  Search,
  Image as ImageIcon,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface DisputeQueueClientProps {
  initialData: DisputeSummary;
}

type DisputeFilter = 'all' | 'open' | 'resolved' | 'dismissed';

export function DisputeQueueClient({ initialData }: DisputeQueueClientProps) {
  const [filter, setFilter] = useState<DisputeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<DisputeItem | null>(null);

  const filteredDisputes = initialData.items.filter((item) => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.taskTitle.toLowerCase().includes(q);
      const matchRoom = item.roomName.toLowerCase().includes(q);
      const matchReporter = item.raisedBy.displayName.toLowerCase().includes(q);
      const matchAssignee = item.assignee?.displayName.toLowerCase().includes(q) || false;
      return matchTitle || matchRoom || matchReporter || matchAssignee;
    }
    return true;
  });

  const handleOverrule = (disputeId: string, taskId: string) => {
    if (!confirm('Bạn có chắc muốn bác bỏ khiếu nại và duyệt hoàn thành task (cộng điểm cho thành viên làm)?')) {
      return;
    }
    startTransition(async () => {
      try {
        await overruleDisputeAndApprove(disputeId, taskId);
        setActionMessage('Đã bác bỏ khiếu nại thành công! Task đã được duyệt và cộng điểm.');
      } catch (err: unknown) {
        const error = err as Error;
        setActionMessage(`Lỗi: ${error.message}`);
      }
    });
  };

  const handleUphold = (disputeId: string, taskId: string) => {
    if (!confirm('Bạn có chắc muốn chấp thuận khiếu nại (bắt buộc làm lại) và mở lại task lên Bounty Board?')) {
      return;
    }
    startTransition(async () => {
      try {
        await upholdDisputeAndReopen(disputeId, taskId);
        setActionMessage('Đã chấp thuận khiếu nại thành công! Task đã được mở lại.');
      } catch (err: unknown) {
        const error = err as Error;
        setActionMessage(`Lỗi: ${error.message}`);
      }
    });
  };

  const handlePenalize = (disputeId: string, taskId: string, roomId: string, assigneeId: string) => {
    if (!confirm('Xác nhận: Phát hiện gian lận bằng chứng ảnh, phạt -15 Karma thành viên và mở lại task?')) {
      return;
    }
    startTransition(async () => {
      try {
        await penalizeKarmaAndReopen(disputeId, taskId, roomId, assigneeId);
        setActionMessage('Đã phạt -15 Karma thành viên gian lận và mở lại task thành công!');
      } catch (err: unknown) {
        const error = err as Error;
        setActionMessage(`Lỗi: ${error.message}`);
      }
    });
  };

  const getStatusBadge = (status: DisputeItem['status']) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FED7D7] px-3 py-1 text-xs font-bold text-[#C53030]">
            <AlertTriangle className="h-3.5 w-3.5" />
            Đang chờ xử lý
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#16A34A]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã chấp thuận (Upheld)
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEEEF5] px-3 py-1 text-xs font-bold text-[#8A8AA3]">
            <XCircle className="h-3.5 w-3.5" />
            Đã bác bỏ (Overruled)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback banner */}
      {actionMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#D1FADF] bg-[#ECFDF3] p-4 text-xs font-bold text-[#027A48] shadow-sm animate-in fade-in">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-[#027A48] hover:text-[#054F31]"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Filter Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <button
          onClick={() => setFilter('all')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'all'
              ? 'ring-2 ring-[#5B4BDB] bg-[#F8F8FD]'
              : 'hover:border-[#DDD9F8]'
          }`}
        >
          <span className="text-xs font-semibold text-[#8A8AA3]">Tất cả khiếu nại</span>
          <p className="mt-1 text-2xl font-extrabold text-[#14142B]">{initialData.totalDisputes}</p>
        </button>

        <button
          onClick={() => setFilter('open')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'open'
              ? 'ring-2 ring-[#E5484D] bg-[#FFF5F6]'
              : 'hover:border-[#FFD6D9]'
          }`}
        >
          <span className="text-xs font-semibold text-[#E5484D]">Chờ duyệt (Open)</span>
          <p className="mt-1 text-2xl font-extrabold text-[#E5484D]">{initialData.openCount}</p>
        </button>

        <button
          onClick={() => setFilter('resolved')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'resolved'
              ? 'ring-2 ring-[#10B981] bg-[#F0FDF4]'
              : 'hover:border-[#DCFCE7]'
          }`}
        >
          <span className="text-xs font-semibold text-[#0F766E]">Chấp thuận (Làm lại)</span>
          <p className="mt-1 text-2xl font-extrabold text-[#0F766E]">{initialData.resolvedCount}</p>
        </button>

        <button
          onClick={() => setFilter('dismissed')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'dismissed'
              ? 'ring-2 ring-[#8A8AA3] bg-[#F8F8FD]'
              : 'hover:border-[#EEEEF5]'
          }`}
        >
          <span className="text-xs font-semibold text-[#8A8AA3]">Bác bỏ (Phạt/Spam)</span>
          <p className="mt-1 text-2xl font-extrabold text-[#8A8AA3]">{initialData.dismissedCount}</p>
        </button>
      </div>

      {/* 2. Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8AA3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo task, phòng, tên người báo hoặc người làm..."
            className="w-full rounded-2xl border border-[#EEEEF5] bg-white py-2.5 pl-10 pr-4 text-sm text-[#14142B] placeholder:text-[#8A8AA3] shadow-sm transition focus:border-[#5B4BDB] focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/15"
          />
        </div>

        <div className="text-xs font-medium text-[#8A8AA3]">
          Hiển thị: <strong className="text-[#14142B]">{filteredDisputes.length}</strong> / {initialData.totalDisputes} khiếu nại
        </div>
      </div>

      {/* 3. Dispute Items List */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <div className="prodify-card p-12 text-center text-sm text-[#8A8AA3]">
            Không có khiếu nại nào phù hợp trong hàng đợi hiện tại.
          </div>
        ) : (
          filteredDisputes.map((item) => (
            <div
              key={item.id}
              className="prodify-card p-6 transition hover:shadow-md"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                {/* Left: Task & Room Context */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {getStatusBadge(item.status)}
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#5B4BDB] bg-[#EEEDFB] px-2.5 py-0.5 rounded-full">
                      <Home className="h-3.5 w-3.5" />
                      {item.roomName}
                    </span>
                    <span className="text-xs text-[#8A8AA3]">•</span>
                    <span className="flex items-center gap-1.5 text-xs text-[#8A8AA3]">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#14142B]">
                    {item.taskTitle}
                  </h3>

                  {/* Reason Text */}
                  <div className="rounded-2xl border border-[#FED7D7] bg-[#FFF5F5] p-3.5 text-xs text-[#C53030]">
                    <span className="font-bold">Lý do khiếu nại: </span>
                    <span className="text-[#E53E3E]">{item.reason || 'Người báo không ghi chú lý do chi tiết.'}</span>
                  </div>
                </div>

                {/* Right: Unmasked Anonymity Shield Insight (Ops Exclusive) */}
                <div className="rounded-2xl border border-[#DDD9F8] bg-[#F8F8FD] p-4 text-xs lg:w-80 shrink-0">
                  <div className="flex items-center gap-1.5 text-[#5B4BDB] font-bold mb-3">
                    <Eye className="h-4 w-4" />
                    <span>Anonymity Shield (Ops Exclusive)</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8A8AA3]">Người khiếu nại:</span>
                      <span className="font-bold text-[#14142B] flex items-center gap-1">
                        <User className="h-3 w-3 text-[#F59E42]" />
                        {item.raisedBy.displayName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#8A8AA3]">Người phụ trách:</span>
                      <span className="font-bold text-[#14142B] flex items-center gap-1">
                        <User className="h-3 w-3 text-[#5B4BDB]" />
                        {item.assignee?.displayName || 'Chưa gán'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#8A8AA3]">Trạng thái task:</span>
                      <span className="font-mono text-xs uppercase font-bold text-[#5B4BDB]">
                        {item.taskStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F6] pt-4">
                <button
                  type="button"
                  onClick={() => setInspectingItem(item)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF5] bg-white px-3.5 py-2 text-xs font-bold text-[#5B4BDB] shadow-sm transition hover:bg-[#EEEDFB]"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Xem ảnh bằng chứng</span>
                </button>

                {item.status === 'open' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      disabled={isPending}
                      onClick={() => handleOverrule(item.id, item.taskId)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#DCFCE7] px-3.5 py-2 text-xs font-bold text-[#16A34A] transition hover:bg-[#BBF7D0] disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      Bác bỏ &amp; Duyệt hoàn thành
                    </button>

                    <button
                      disabled={isPending}
                      onClick={() => handleUphold(item.id, item.taskId)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#FEF3C7] px-3.5 py-2 text-xs font-bold text-[#D97706] transition hover:bg-[#FDE68A] disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Chấp thuận &amp; Mở lại việc
                    </button>

                    <button
                      disabled={isPending}
                      onClick={() =>
                        handlePenalize(
                          item.id,
                          item.taskId,
                          item.roomId,
                          item.assignee?.id || ''
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#FEE2E2] px-3.5 py-2 text-xs font-bold text-[#DC2626] transition hover:bg-[#FECACA] disabled:opacity-50"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      Phạt -15 Karma gian lận
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox Evidence Modal */}
      {inspectingItem && (
        <EvidenceModal
          isOpen={!!inspectingItem}
          onClose={() => setInspectingItem(null)}
          photoUrl={inspectingItem.photoUrl || null}
          taskTitle={inspectingItem.taskTitle}
          roomName={inspectingItem.roomName}
          assigneeName={inspectingItem.assignee?.displayName}
          submittedAt={inspectingItem.taskSubmittedAt}
          reason={inspectingItem.reason}
        />
      )}
    </div>
  );
}
