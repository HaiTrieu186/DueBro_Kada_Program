'use client';

import React, { useState, useMemo } from 'react';
import type { RoomHealthItem, RoomHealthSummary } from '@/lib/roomQueries';
import RoomDetailDrawer from './RoomDetailDrawer';
import CreateRoomTrigger from './CreateRoomTrigger';
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
  ChevronRight,
  Filter,
  Plus,
  ArrowUpDown,
} from 'lucide-react';

interface RoomListClientProps {
  initialData: RoomHealthSummary;
}

type FilterTab = 'all' | 'high' | 'medium' | 'healthy' | 'pro';

export function RoomListClient({ initialData }: RoomListClientProps) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<RoomHealthItem | null>(null);

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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-xs font-bold text-[#DC2626]">
            <AlertOctagon className="h-3.5 w-3.5" />
            Nguy cơ Churn cao
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-bold text-[#D97706]">
            <AlertTriangle className="h-3.5 w-3.5" />
            Cần lưu ý
          </span>
        );
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEEDFB] px-2.5 py-1 text-xs font-bold text-[#5B4BDB]">
            <Sparkles className="h-3.5 w-3.5" />
            Mới khởi tạo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-bold text-[#16A34A]">
            <CheckCircle className="h-3.5 w-3.5" />
            Khỏe mạnh
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Filter Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <button
          onClick={() => setFilter('all')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'all'
              ? 'ring-2 ring-[#5B4BDB] bg-[#F8F8FD]'
              : 'hover:border-[#DDD9F8]'
          }`}
        >
          <span className="text-xs font-semibold text-[#8A8AA3]">Tất cả phòng</span>
          <p className="mt-1 text-2xl font-extrabold text-[#14142B]">{initialData.totalRooms}</p>
        </button>

        <button
          onClick={() => setFilter('high')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'high'
              ? 'ring-2 ring-[#E5484D] bg-[#FFF5F6]'
              : 'hover:border-[#FFD6D9]'
          }`}
        >
          <span className="text-xs font-semibold text-[#E5484D]">Nguy cơ Churn cao</span>
          <p className="mt-1 text-2xl font-extrabold text-[#E5484D]">{initialData.highRiskChurnRooms}</p>
        </button>

        <button
          onClick={() => setFilter('medium')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'medium'
              ? 'ring-2 ring-[#F59E42] bg-[#FFF9F2]'
              : 'hover:border-[#FFD9A8]'
          }`}
        >
          <span className="text-xs font-semibold text-[#B45309]">Cần theo dõi</span>
          <p className="mt-1 text-2xl font-extrabold text-[#B45309]">{initialData.mediumRiskRooms}</p>
        </button>

        <button
          onClick={() => setFilter('healthy')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'healthy'
              ? 'ring-2 ring-[#10B981] bg-[#F0FDF4]'
              : 'hover:border-[#DCFCE7]'
          }`}
        >
          <span className="text-xs font-semibold text-[#0F766E]">Hoạt động tốt</span>
          <p className="mt-1 text-2xl font-extrabold text-[#0F766E]">{initialData.healthyRooms}</p>
        </button>

        <button
          onClick={() => setFilter('pro')}
          className={`prodify-card p-4 text-left transition ${
            filter === 'pro'
              ? 'ring-2 ring-[#5B4BDB] bg-[#EEEDFB]'
              : 'hover:border-[#DDD9F8]'
          }`}
        >
          <span className="text-xs font-semibold text-[#5B4BDB]">Gói Pro</span>
          <p className="mt-1 text-2xl font-extrabold text-[#5B4BDB]">{initialData.proRooms}</p>
        </button>
      </div>

      {/* 2. Search & Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8AA3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên phòng hoặc mã invite (vd: BRO123)..."
            className="w-full rounded-2xl border border-[#EEEEF5] bg-white py-2.5 pl-10 pr-4 text-sm text-[#14142B] placeholder:text-[#8A8AA3] shadow-sm transition focus:border-[#5B4BDB] focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/15"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-[#8A8AA3]">
            Hiển thị: <strong className="text-[#14142B]">{filteredRooms.length}</strong> / {initialData.totalRooms} phòng
          </div>
          <CreateRoomTrigger variant="button" />
        </div>
      </div>

      {/* 3. Room Table Card */}
      <div className="prodify-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#F0F0F6] bg-[#FBFBFE] text-xs font-semibold uppercase tracking-wider text-[#8A8AA3]">
              <tr>
                <th className="px-6 py-4">Phòng &amp; Gói</th>
                <th className="px-6 py-4">Sức khỏe &amp; Churn Risk</th>
                <th className="px-6 py-4">Thành viên</th>
                <th className="px-6 py-4">Tiến độ Task</th>
                <th className="px-6 py-4">Hoạt động gần nhất</th>
                <th className="px-6 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F6]">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#8A8AA3]">
                    Không tìm thấy phòng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className="cursor-pointer transition hover:bg-[#F8F8FD] group"
                  >
                    {/* Room Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEEDFB] text-[#5B4BDB]">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#14142B] group-hover:text-[#5B4BDB] transition">
                              {room.name}
                            </span>
                            {room.isPro ? (
                              <span className="rounded bg-[#5B4BDB] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
                                PRO
                              </span>
                            ) : (
                              <span className="rounded bg-[#EEEEF5] px-1.5 py-0.5 text-[9px] font-bold text-[#8A8AA3]">
                                FREE
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8A8AA3]">
                            <Key className="h-3 w-3 text-[#5B4BDB]" />
                            <span className="font-mono font-bold text-[#5B4BDB]">{room.inviteCode}</span>
                            <span>•</span>
                            <span>Tạo: {new Date(room.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Health Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getRiskBadge(room)}
                        <p className="text-xs text-[#8A8AA3] line-clamp-1">
                          {room.churnRiskReasons[0] || 'Hoạt động bình thường'}
                        </p>
                      </div>
                    </td>

                    {/* Members */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#14142B]">
                        <Users className="h-4 w-4 text-[#8A8AA3]" />
                        <span>
                          {room.activeMemberCount} / {room.maxMembers}
                        </span>
                      </div>
                      {room.leftMemberCount > 0 && (
                        <p className="mt-0.5 text-[11px] text-[#E5484D]">
                          ({room.leftMemberCount} đã rời)
                        </p>
                      )}
                    </td>

                    {/* Task Progress */}
                    <td className="px-6 py-4">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8A8AA3]">Hoàn thành:</span>
                          <span className="font-bold text-[#14142B]">
                            {room.completionRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ECECF2]">
                          <div
                            className={`h-full rounded-full ${
                              room.completionRate >= 70
                                ? 'bg-[#34D399]'
                                : room.completionRate >= 40
                                ? 'bg-[#F59E42]'
                                : 'bg-[#E5484D]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(room.completionRate, 5))}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#8A8AA3]">
                          <span>{room.completedTasks} xong</span>
                          <span>{room.expiredTasks} trễ</span>
                        </div>
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14142B]">
                        <Clock className="h-3.5 w-3.5 text-[#8A8AA3]" />
                        <span>
                          {room.daysSinceLastActivity === 0
                            ? 'Hôm nay'
                            : `${room.daysSinceLastActivity} ngày trước`}
                        </span>
                      </div>
                      <span className="mt-0.5 block text-[11px] text-[#8A8AA3]">
                        {new Date(room.lastActivityAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>

                    {/* Action Arrow */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8A8AA3] group-hover:bg-[#EEEDFB] group-hover:text-[#5B4BDB] transition">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      <RoomDetailDrawer
        room={selectedRoom}
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
}
