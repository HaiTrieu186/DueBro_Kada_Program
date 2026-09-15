import Link from 'next/link';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#242424] p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#FAFAF9]">
          Truy cập bị từ chối
        </h1>

        <p className="mt-3 text-sm text-[#A8A8A8]">
          Tài khoản của bạn không có quyền vận hành (yêu cầu custom claim <code className="rounded bg-[#181818] px-1.5 py-0.5 text-xs text-[#7C3AED]">app_metadata.role = &#39;ops&#39;</code>).
        </p>

        <p className="mt-2 text-xs text-[#737373]">
          Vui lòng liên hệ Tech Lead để được cấp quyền vận hành hệ thống Due Bro.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
          >
            <LogOut className="h-4 w-4" />
            Đăng nhập tài khoản khác
          </Link>
        </div>
      </div>
    </div>
  );
}
