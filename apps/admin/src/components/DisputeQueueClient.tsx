'use client';

import React, { useState, useTransition } from 'react';
import type { DisputeItem, DisputeSummary } from '@/lib/disputeQueries';
import {
  overruleDisputeAndApprove,
  upholdDisputeAndReopen,
} from '@/app/actions/disputeActions';
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
        setActionMessage('Đã chấp thuận khiếu nại thành công! Task đã được mở lại (status=open).');
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
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Đang chờ xử lý
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã giải quyết (Upheld)
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-[#A8A8A8]">
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
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats summary pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'all'
              ? 'border-[#7C3AED] bg-[#7C3AED]/10'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-[#A8A8A8]">Tất cả khiếu nại</span>
          <p className="mt-1 text-xl font-bold text-white">{initialData.totalDisputes}</p>
        </button>

        <button
          onClick={() => setFilter('open')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'open'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-amber-400">Chờ duyệt (Open)</span>
          <p className="mt-1 text-xl font-bold text-amber-400">{initialData.openCount}</p>
        </button>

        <button
          onClick={() => setFilter('resolved')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'resolved'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-emerald-400">Chấp thuận (Yêu cầu làm lại)</span>
          <p className="mt-1 text-xl font-bold text-emerald-400">{initialData.resolvedCount}</p>
        </button>

        <button
          onClick={() => setFilter('dismissed')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'dismissed'
              ? 'border-white/20 bg-white/10'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-[#A8A8A8]">Bác bỏ (Phạt/Spam)</span>
          <p className="mt-1 text-xl font-bold text-white">{initialData.dismissedCount}</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo task, phòng, tên người báo hoặc người làm..."
            className="w-full rounded-xl border border-white/10 bg-[#1F1F1F] py-2 pl-10 pr-4 text-sm text-white placeholder-[#737373] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

        <div className="text-xs text-[#A8A8A8]">
          Hiển thị <strong className="text-white">{filteredDisputes.length}</strong> / {initialData.totalDisputes} khiếu nại
        </div>
      </div>

      {/* Dispute Items List */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#242424] p-12 text-center text-sm text-[#737373]">
            Không có khiếu nại nào phù hợp trong hàng đợi.
          </div>
        ) : (
          filteredDisputes.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-[#242424] p-5 shadow-sm transition hover:border-white/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Left: Task & Room Context */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.status)}
                    <span className="flex items-center gap-1.5 text-xs text-[#737373]">
                      <Home className="h-3.5 w-3.5" />
                      {item.roomName}
                    </span>
                    <span className="text-xs text-[#737373]">•</span>
                    <span className="flex items-center gap-1.5 text-xs text-[#737373]">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {item.taskTitle}
                  </h3>

                  {/* Reason Text */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-[#E5E5E5]">
                    <span className="font-semibold text-amber-400">Lý do khiếu nại: </span>
                    <span>{item.reason || 'Người báo không ghi chú lý do chi tiết.'}</span>
                  </div>
                </div>

                {/* Right: Unmasked Anonymity Shield Insight (Ops Exclusive) */}
                <div className="rounded-xl border border-purple-500/20 bg-[#7C3AED]/5 p-3.5 text-xs lg:w-80">
                  <div className="flex items-center gap-1.5 text-[#A78BFA] font-medium mb-2">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Anonymity Shield Unmasked (Ops)</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#A8A8A8]">Người báo cáo:</span>
                      <span className="font-semibold text-white flex items-center gap-1">
                        <User className="h-3 w-3 text-amber-400" />
                        {item.raisedBy.displayName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#A8A8A8]">Người phụ trách:</span>
                      <span className="font-medium text-white flex items-center gap-1">
                        <User className="h-3 w-3 text-blue-400" />
                        {item.assignee?.displayName || 'Chưa gán'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#A8A8A8]">Trạng thái task:</span>
                      <span className="font-mono text-xs uppercase text-[#A8A8A8]">
                        {item.taskStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Open Disputes */}
              {item.status === 'open' && (
                <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-white/5 pt-4">
                  <button
                    disabled={isPending}
                    onClick={() => handleOverrule(item.id, item.taskId)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Bác bỏ khiếu nại &amp; Duyệt hoàn thành (Cộng điểm)
                  </button>

                  <button
                    disabled={isPending}
                    onClick={() => handleUphold(item.id, item.taskId)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Chấp thuận khiếu nại &amp; Mở lại việc (Bắt buộc làm lại)
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
