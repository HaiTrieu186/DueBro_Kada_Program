'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabaseClient';
import AdminHeaderBar from '@/components/AdminHeaderBar';
import {
  LayoutDashboard,
  Building2,
  AlertTriangle,
  BrainCircuit,
  LogOut,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Tổng quan KPI', icon: LayoutDashboard, badge: 'Live' },
  { href: '/rooms', label: 'Giám sát Phòng & Churn', icon: Building2, badge: 'Active' },
  { href: '/disputes', label: 'Hàng đợi Khiếu nại', icon: AlertTriangle, badge: 'Triage', badgeColor: 'bg-[#FED7D7] text-[#C53030]' },
  { href: '/ml-monitor', label: 'Mô hình AI / ML', icon: BrainCircuit, badge: 'v1.2' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-[#F8F8FD] text-[#14142B]">
      {/* Prodify Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#EEEEF5] bg-[#FBFBFE]">
        {/* Workspace Switcher / Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-[#EEEEF5] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#5B4BDB] text-white shadow-md shadow-[#5B4BDB]/25">
              <Sparkles className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-[#14142B]">Due Bro</span>
                <span className="rounded-md bg-[#EEEDFB] px-1.5 py-0.5 text-[10px] font-bold text-[#5B4BDB]">
                  OPS
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#8A8AA3]">Prodify System</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[#B4B4C7]">
            Menu Điều Hành
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#EEEDFB] text-[#5B4BDB] shadow-sm'
                      : 'text-[#6B6B80] hover:bg-[#F2F2F8] hover:text-[#14142B]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-[#5B4BDB]' : 'text-[#8A8AA3] group-hover:text-[#14142B]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.badgeColor || (isActive ? 'bg-[#DDD9F8] text-[#5B4BDB]' : 'bg-[#EEEEF5] text-[#8A8AA3]')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="my-6 h-px bg-[#EEEEF5]" />

          {/* Quick Indicators */}
          <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[#B4B4C7]">
            Khu Vực Phân Tích
          </div>
          <div className="space-y-2 px-2 text-xs text-[#6B6B80]">
            <div className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-[#F2F2F8]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#5B4BDB]" />
                Phân tích Quota Tuần
              </span>
              <span className="text-[10px] font-bold text-[#8A8AA3]">Live</span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-[#F2F2F8]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#4FD1C5]" />
                Điểm Effort & Karma
              </span>
              <span className="text-[10px] font-bold text-[#8A8AA3]">100%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-[#F2F2F8]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#F59E42]" />
                Bảo vệ Ẩn danh Khiếu nại
              </span>
              <span className="text-[10px] font-bold text-[#8A8AA3]">Active</span>
            </div>
          </div>

          {/* Promo / Ops Card */}
          <div className="mt-8 rounded-2xl border border-[#DDD9F8] bg-[#F3F2FC] p-4 text-[#14142B]">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5B4BDB] text-white">
                <Shield className="h-3.5 w-3.5 fill-white" />
              </div>
              <span className="text-xs font-bold text-[#5B4BDB]">Due Bro Ops Shield</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#6B6B80]">
              Toàn bộ khiếu nại và đánh giá được mã hóa ẩn danh để bảo vệ quan hệ bạn cùng phòng.
            </p>
            <Link
              href="/disputes"
              className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#5B4BDB] py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C3BC7]"
            >
              Xem hàng đợi khiếu nại
            </Link>
          </div>
        </div>

        {/* User Footer / Sign out */}
        <div className="border-t border-[#EEEEF5] p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-[#8A8AA3] transition hover:bg-red-50 hover:text-red-600"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area with Header */}
      <div className="ml-64 flex flex-1 flex-col min-h-screen">
        <AdminHeaderBar />
        <main className="flex-1 p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
