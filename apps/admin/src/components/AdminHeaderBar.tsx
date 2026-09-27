'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Shield, ChevronRight, Sparkles, Terminal } from 'lucide-react';

const ROUTE_TITLES: Record<string, { title: string; category: string }> = {
  '/': { title: 'Tổng Quan KPI & Sức Khỏe Hệ Thống', category: 'Executive Dashboard' },
  '/rooms': { title: 'Giám Sát Phòng & Nguy Cơ Churn', category: 'Room Operations' },
  '/disputes': { title: 'Hàng Đợi Phân Xử Khiếu Nại Ẩn Danh', category: 'Conflict Resolution' },
  '/ml-monitor': { title: 'Giám Sát Mô Hình AI / ML & Cold Start', category: 'Intelligence & Seeds' },
};

export default function AdminHeaderBar() {
  const pathname = usePathname();
  const currentRoute = ROUTE_TITLES[pathname] || {
    title: 'Hệ Thống Quản Trị Due Bro',
    category: 'Ops Center',
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[#EEEEF5] bg-white/80 px-8 backdrop-blur-md transition-all">
      {/* Left: Dynamic Breadcrumb & Title */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A8AA3]">
          <span>Due Bro Admin</span>
          <ChevronRight className="h-3 w-3 text-[#B4B4C7]" />
          <span className="text-[#5B4BDB]">{currentRoute.category}</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#14142B]">
          {currentRoute.title}
        </h1>
      </div>

      {/* Center / Right: Search Teaser, Status Dot, Profile Pill */}
      <div className="flex items-center gap-4">
        {/* Search Bar Teaser */}
        <div className="relative hidden md:block">
          <div className="flex h-10 w-64 items-center gap-2.5 rounded-full border border-[#EEEEF5] bg-[#F8F8FD] px-3.5 text-xs text-[#8A8AA3] shadow-inner transition hover:border-[#DDD9F8] focus-within:border-[#5B4BDB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5B4BDB]/15">
            <Search className="h-3.5 w-3.5 text-[#8A8AA3]" />
            <input
              type="text"
              placeholder="Tìm kiếm phòng, task, sinh viên..."
              className="w-full bg-transparent text-xs text-[#14142B] placeholder:text-[#8A8AA3] focus:outline-none"
              readOnly
            />
            <kbd className="flex h-5 items-center rounded border border-[#DDD9F8] bg-white px-1.5 font-mono text-[10px] font-semibold text-[#6C5CE7] shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Live System Status Indicator */}
        <div className="flex items-center gap-2 rounded-full border border-[#D1FADF] bg-[#ECFDF3] px-3 py-1.5 text-xs font-semibold text-[#027A48] shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold tracking-wide">Systems Nominal</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Thông báo hệ thống"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#EEEEF5] bg-white text-[#6B6B80] shadow-sm transition hover:bg-[#F8F8FD] hover:text-[#14142B]"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E53E3E] ring-2 ring-white" />
        </button>

        {/* Ops Profile Pill */}
        <div className="flex items-center gap-3 rounded-full border border-[#EEEEF5] bg-white py-1.5 pl-1.5 pr-3 shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#5B4BDB] to-[#8C7CF0] text-xs font-bold text-white shadow-sm">
            AD
          </div>
          <div className="hidden flex-col text-left sm:flex">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#14142B]">admin@duebro.vn</span>
              <span className="rounded bg-[#EEEDFB] px-1 py-0.2 text-[9px] font-extrabold uppercase tracking-wide text-[#5B4BDB]">
                Ops
              </span>
            </div>
            <span className="text-[10px] font-medium text-[#8A8AA3]">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
