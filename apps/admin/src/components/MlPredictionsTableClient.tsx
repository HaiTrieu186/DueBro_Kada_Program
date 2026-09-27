'use client';

import React, { useState, useMemo } from 'react';
import type { MlPredictionItem } from '@/lib/mlQueries';
import { Search, Filter, Clock, Check, Sparkles, Cpu } from 'lucide-react';

interface MlPredictionsTableClientProps {
  initialPredictions: MlPredictionItem[];
}

export default function MlPredictionsTableClient({
  initialPredictions,
}: MlPredictionsTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<'all' | 'rule' | 'ml'>('all');

  const filtered = useMemo(() => {
    return initialPredictions.filter((item) => {
      if (modelFilter === 'rule' && !item.modelVersion.includes('rule')) return false;
      if (modelFilter === 'ml' && item.modelVersion.includes('rule')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.taskTitle.toLowerCase().includes(q);
        const matchName = item.candidateName.toLowerCase().includes(q);
        const matchModel = item.modelVersion.toLowerCase().includes(q);
        return matchTitle || matchName || matchModel;
      }
      return true;
    });
  }, [initialPredictions, modelFilter, searchQuery]);

  return (
    <div className="prodify-card p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F0F0F6] pb-4">
        <div>
          <h3 className="text-base font-bold text-[#14142B]">
            Lịch Sử Xếp Hạng Ứng Viên (Candidate Ranking Audit)
          </h3>
          <p className="text-xs text-[#8A8AA3]">
            Ghi nhận từ bảng ml_predictions khi auto-assign chạy tự động (mỗi 15 phút)
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8AA3]" />
            <input
              type="text"
              placeholder="Tìm theo task, ứng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 rounded-xl border border-[#EEEEF5] bg-[#F8F8FD] pl-8 pr-3 text-xs text-[#14142B] placeholder:text-[#8A8AA3] focus:border-[#5B4BDB] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Model Filter Pills */}
          <div className="flex items-center rounded-xl border border-[#EEEEF5] bg-[#F8F8FD] p-0.5 text-xs">
            <button
              onClick={() => setModelFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                modelFilter === 'all'
                  ? 'bg-white text-[#5B4BDB] shadow-sm'
                  : 'text-[#8A8AA3] hover:text-[#14142B]'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setModelFilter('rule')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                modelFilter === 'rule'
                  ? 'bg-white text-[#F59E42] shadow-sm'
                  : 'text-[#8A8AA3] hover:text-[#14142B]'
              }`}
            >
              Rule-Based
            </button>
            <button
              onClick={() => setModelFilter('ml')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                modelFilter === 'ml'
                  ? 'bg-white text-[#10B981] shadow-sm'
                  : 'text-[#8A8AA3] hover:text-[#14142B]'
              }`}
            >
              ML LightGBM
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#F0F0F6] bg-[#FBFBFE] text-xs font-semibold uppercase tracking-wider text-[#8A8AA3]">
            <tr>
              <th className="px-4 py-3">Task Cần Gán</th>
              <th className="px-4 py-3">Ứng viên đề xuất</th>
              <th className="px-4 py-3 text-center">Hạng (Rank)</th>
              <th className="px-4 py-3 text-center">Điểm (Score)</th>
              <th className="px-4 py-3">Phiên bản Model</th>
              <th className="px-4 py-3 text-right">Thời điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F6]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs text-[#8A8AA3]">
                  {initialPredictions.length === 0
                    ? 'Chưa có lượt xếp hạng nào được ghi nhận. Khi cron auto-assign chạy, các dự đoán sẽ hiển thị tại đây.'
                    : 'Không tìm thấy kết quả nào phù hợp với bộ lọc.'}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-[#F8F8FD]">
                  <td className="px-4 py-3 font-semibold text-[#14142B]">
                    {p.taskTitle}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-[#14142B]">
                    {p.candidateName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEEDFB] text-xs font-extrabold text-[#5B4BDB]">
                      #{p.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-center text-[#5B4BDB]">
                    {p.score.toFixed(3)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        p.modelVersion.includes('rule')
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#DCFCE7] text-[#16A34A]'
                      }`}
                    >
                      {p.modelVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-[#8A8AA3]">
                    {new Date(p.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}{' '}
                    • {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
