'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabaseClient';
import { Lock, Mail, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      const role = data.user?.app_metadata?.role;
      if (role !== 'ops') {
        router.push('/unauthorized');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#F8F8FD]">
      <div className="prodify-card w-full max-w-md p-8 sm:p-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#5B4BDB] text-white shadow-lg shadow-[#5B4BDB]/30">
            <Sparkles className="h-7 w-7 fill-white text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#14142B]">
            Due Bro <span className="text-[#5B4BDB]">Ops</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-[#8A8AA3]">
            Hệ thống quản trị &amp; vận hành nội bộ (role=ops) • Prodify Style
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 rounded-xl border border-[#FFD6D9] bg-[#FFF5F6] p-3.5 text-xs font-semibold text-[#E5484D]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#14142B] mb-1.5">
              Email Quản Trị Viên
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9BB4]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ops@duebro.com"
                className="w-full rounded-xl border border-[#EEEEF5] bg-[#FBFBFE] py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#14142B] placeholder:text-[#B4B4C7] focus:border-[#5B4BDB] focus:outline-none focus:ring-4 focus:ring-[#EEEDFB] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14142B] mb-1.5">
              Mật Khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9BB4]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#EEEEF5] bg-[#FBFBFE] py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#14142B] placeholder:text-[#B4B4C7] focus:border-[#5B4BDB] focus:outline-none focus:ring-4 focus:ring-[#EEEDFB] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-ask-ai mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-md transition disabled:opacity-50"
          >
            {loading ? (
              'Đang xác thực...'
            ) : (
              <>
                Đăng Nhập Ops Console
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 border-t border-[#F0F0F6] pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#8A8AA3]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
            Bảo mật cấp độ Ops với Supabase RBAC &amp; JWT claims
          </p>
        </div>
      </div>
    </div>
  );
}
