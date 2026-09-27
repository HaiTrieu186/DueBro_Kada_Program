import Link from 'next/link';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#F8F8FD]">
      <div className="prodify-card w-full max-w-md p-8 sm:p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFD6D9] text-[#E5484D] shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-[#14142B]">
          Truy cập bị từ chối
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#6B6B80]">
          Tài khoản của bạn không có quyền vận hành (yêu cầu custom claim{' '}
          <code className="rounded-md bg-[#EEEDFB] px-1.5 py-0.5 text-xs font-bold text-[#5B4BDB]">
            role = &#39;ops&#39;
          </code>
          ).
        </p>

        <p className="mt-2 text-xs text-[#8A8AA3]">
          Vui lòng liên hệ Tech Lead để được phân quyền vận hành hệ thống Due Bro.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/login"
            className="btn-ask-ai flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold shadow-md transition"
          >
            <LogOut className="h-4 w-4" />
            Đăng nhập tài khoản khác
          </Link>
        </div>
      </div>
    </div>
  );
}
