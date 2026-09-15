'use client';

import React, { useState, useMemo } from 'react';
import type { RoomHealthItem, RoomHealthSummary } from '@/lib/roomQueries';
import {
  Search,
  Building2,
  Users,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Clock,
  Key,
} from 'lucide-react';

interface RoomListClientProps {
  initialData: RoomHealthSummary;
}

type FilterTab = 'all' | 'high' | 'medium' | 'healthy' | 'pro';

export function RoomListClient({ initialData }: RoomListClientProps) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = useMemo(() => {
    return initialData.rooms.filter((room) => {
      // Tab filter
      if (filter === 'high' && room.churnRisk !== 'high') return false;
      if (filter === 'medium' && room.churnRisk !== 'medium') return false;
      if (filter === 'healthy' && room.churnRisk !== 'healthy' && room.churnRisk !== 'new') return false;
      if (filter === 'pro' && !room.isPro) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = room.name.toLowerCase().includes(query);
        const matchesCode = room.inviteCode.toLowerCase().includes(query);
        return matchesName || matchesCode;
      }

      return true;
    });
  }, [initialData.rooms, filter, searchQuery]);

  const getRiskBadge = (room: RoomHealthItem) => {
    switch (room.churnRisk) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
            <AlertOctagon className="h-3.5 w-3.5" />
            Nguy cơ Churn cao
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Cần lưu ý
          </span>
        );
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            Mới khởi tạo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Khỏe mạnh
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'all'
              ? 'border-[#7C3AED] bg-[#7C3AED]/10'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-[#A8A8A8]">Tất cả phòng</span>
          <p className="mt-1 text-xl font-bold text-white">{initialData.totalRooms}</p>
        </button>

        <button
          onClick={() => setFilter('high')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'high'
              ? 'border-red-500 bg-red-500/10'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-red-400">Nguy cơ Churn</span>
          <p className="mt-1 text-xl font-bold text-red-400">{initialData.highRiskChurnRooms}</p>
        </button>

        <button
          onClick={() => setFilter('medium')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'medium'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-amber-400">Cần theo dõi</span>
          <p className="mt-1 text-xl font-bold text-amber-400">{initialData.mediumRiskRooms}</p>
        </button>

        <button
          onClick={() => setFilter('healthy')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'healthy'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-emerald-400">Hoạt động tốt</span>
          <p className="mt-1 text-xl font-bold text-emerald-400">{initialData.healthyRooms}</p>
        </button>

        <button
          onClick={() => setFilter('pro')}
          className={`rounded-xl border p-4 text-left transition ${
            filter === 'pro'
              ? 'border-[#7C3AED] bg-[#7C3AED]/20'
              : 'border-white/10 bg-[#242424] hover:border-white/20'
          }`}
        >
          <span className="text-xs text-[#A78BFA]">Gói Pro</span>
          <p className="mt-1 text-xl font-bold text-[#A78BFA]">{initialData.proRooms}</p>
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
            placeholder="Tìm theo tên phòng hoặc mã invite (vd: BRO123)..."
            className="w-full rounded-xl border border-white/10 bg-[#1F1F1F] py-2 pl-10 pr-4 text-sm text-white placeholder-[#737373] focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A8A8A8]">
          <span>Hiển thị: </span>
          <strong className="text-white">{filteredRooms.length}</strong> / {initialData.totalRooms} phòng
        </div>
      </div>

      {/* Room Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#242424] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-[#A8A8A8]">
              <tr>
                <th className="px-6 py-4">Phòng &amp; Gói</th>
                <th className="px-6 py-4">Sức khỏe &amp; Churn Risk</th>
                <th className="px-6 py-4">Thành viên</th>
                <th className="px-6 py-4">Tiến độ Task</th>
                <th className="px-6 py-4">Hoạt động gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#737373]">
                    Không tìm thấy phòng trọ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="transition hover:bg-white/[0.02]">
                    {/* Room Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/20 text-[#A78BFA]">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{room.name}</span>
                            {room.isPro ? (
                              <span className="rounded bg-[#7C3AED]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#A78BFA]">
                                PRO
                              </span>
                            ) : (
                              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-[#737373]">
                                FREE
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#737373]">
                            <Key className="h-3 w-3" />
                            <span className="font-mono">{room.inviteCode}</span>
                            <span>•</span>
                            <span>Tạo: {new Date(room.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Health Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {getRiskBadge(room)}
                        <ul className="text-xs text-[#737373]">
                          {room.churnRiskReasons.map((reason, idx) => (
                            <li key={idx} className="line-clamp-1">
                              • {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>

                    {/* Members */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                        <Users className="h-4 w-4 text-[#A8A8A8]" />
                        <span>
                          {room.activeMemberCount} / {room.maxMembers}
                        </span>
                      </div>
                      {room.leftMemberCount > 0 && (
                        <p className="mt-1 text-[11px] text-[#737373]">
                          ({room.leftMemberCount} người đã rời)
                        </p>
                      )}
                    </td>

                    {/* Task Progress */}
                    <td className="px-6 py-4">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A8A8A8]">Tỉ lệ:</span>
                          <span className="font-semibold text-white">
                            {room.completionRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${
                              room.completionRate >= 70
                                ? 'bg-emerald-500'
                                : room.completionRate >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, room.completionRate)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#737373]">
                          <span>{room.completedTasks} xong</span>
                          <span>{room.expiredTasks} trễ</span>
                        </div>
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-white">
                        <Clock className="h-3.5 w-3.5 text-[#737373]" />
                        <span>
                          {room.daysSinceLastActivity === 0
                            ? 'Hôm nay'
                            : `${room.daysSinceLastActivity} ngày trước`}
                        </span>
                      </div>
                      <span className="mt-0.5 block text-[11px] text-[#737373]">
                        {new Date(room.lastActivityAt).toLocaleDateString('vi-VN')}
                      </span>
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
