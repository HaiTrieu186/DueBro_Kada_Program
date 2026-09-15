'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  Building2,
  AlertTriangle,
  BrainCircuit,
  LogOut,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'KPI Dashboard', icon: LayoutDashboard },
  { href: '/rooms', label: 'Room Health & Churn', icon: Building2 },
  { href: '/disputes', label: 'Dispute Queue', icon: AlertTriangle },
  { href: '/ml-monitor', label: 'ML Monitoring', icon: BrainCircuit },
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
    <div className="flex min-h-screen bg-[#181818] text-[#FAFAF9]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#1F1F1F]">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#7C3AED] ring-1 ring-[#7C3AED]/40">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white">Due Bro</span>{' '}
            <span className="rounded bg-[#7C3AED]/20 px-1.5 py-0.5 text-xs font-semibold text-[#7C3AED]">Ops</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                    : 'text-[#A8A8A8] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#737373]'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer / Sign out */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#A8A8A8] transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
