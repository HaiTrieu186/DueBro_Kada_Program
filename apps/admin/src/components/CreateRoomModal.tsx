'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Building2,
  Users,
  Sparkles,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { createRoomAction } from '@/app/actions/roomActions';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [mascotName, setMascotName] = useState('Bro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRoom, setSuccessRoom] = useState<{
    name: string;
    inviteCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên phòng');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createRoomAction({
      name: name.trim(),
      maxMembers,
      mascotName: mascotName.trim() || 'Bro',
    });

    setIsSubmitting(false);

    if (res.success && res.room) {
      setSuccessRoom({
        name: res.room.name,
        inviteCode: res.room.inviteCode,
      });
      router.refresh();
    } else {
      setError(res.error || 'Có lỗi xảy ra khi tạo phòng');
    }
  };

  const handleCopyCode = () => {
    if (successRoom?.inviteCode) {
      navigator.clipboard.writeText(successRoom.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setMaxMembers(4);
    setMascotName('Bro');
    setError(null);
    setSuccessRoom(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleResetAndClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl border border-[#EEEEF5] bg-white p-6 shadow-2xl transition-all sm:p-8">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8A8AA3] transition hover:bg-[#F2F2F8] hover:text-[#14142B]"
        >
          <X className="h-4 w-4" />
        </button>

        {successRoom ? (
          /* Success Screen */
          <div className="text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D1FADF] text-[#027A48]">
              <Check className="h-7 w-7 stroke-[3]" />
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-[#14142B]">
              Tạo phòng thành công!
            </h3>
            <p className="mt-1 text-sm text-[#8A8AA3]">
              Phòng <span className="font-bold text-[#14142B]">{successRoom.name}</span> đã sẵn sàng nhận thành viên.
            </p>

            {/* Invite Code Box */}
            <div className="mt-6 rounded-2xl border border-[#DDD9F8] bg-[#F8F8FD] p-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8AA3]">
                Mã mời gia nhập (Invite Code)
              </span>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-extrabold tracking-widest text-[#5B4BDB]">
                  {successRoom.inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#DDD9F8] text-[#5B4BDB] shadow-sm transition hover:bg-[#EEEDFB]"
                  title="Sao chép mã"
                >
                  {copied ? <Check className="h-4 w-4 text-[#10B981]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-[#6B6B80]">
                {copied ? 'Đã sao chép vào bộ nhớ tạm!' : 'Chia sẻ mã này cho sinh viên KTX để tham gia.'}
              </p>
            </div>

            <button
              onClick={handleResetAndClose}
              className="mt-6 w-full rounded-xl bg-[#5B4BDB] py-3 text-sm font-bold text-white shadow-md shadow-[#5B4BDB]/25 transition hover:bg-[#4C3BC7]"
            >
              Hoàn tất &amp; Đóng
            </button>
          </div>
        ) : (
          /* Form Screen */
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEEDFB] text-[#5B4BDB]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14142B]">
                  Khởi Tạo Phòng KTX Mới
                </h3>
                <p className="text-xs text-[#8A8AA3]">
                  Hệ thống Ops sẽ tự động sinh mã mời 6 ký tự
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Room Name */}
              <div>
                <label className="block text-xs font-bold text-[#14142B] mb-1.5">
                  Tên phòng / Căn hộ <span className="text-[#E5484D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng 404 KTX Khu B, Căn hộ 12A..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#EEEEF5] bg-[#F8F8FD] px-3.5 py-2.5 text-sm text-[#14142B] placeholder:text-[#8A8AA3] transition focus:border-[#5B4BDB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/15"
                />
              </div>

              {/* Max Members */}
              <div>
                <label className="block text-xs font-bold text-[#14142B] mb-1.5">
                  Số lượng thành viên tối đa
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxMembers(num)}
                      className={`flex items-center justify-center rounded-xl py-2 text-xs font-bold transition border ${
                        maxMembers === num
                          ? 'border-[#5B4BDB] bg-[#EEEDFB] text-[#5B4BDB]'
                          : 'border-[#EEEEF5] bg-white text-[#6B6B80] hover:bg-[#F8F8FD]'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {num} người
                    </button>
                  ))}
                </div>
              </div>

              {/* Mascot Name */}
              <div>
                <label className="block text-xs font-bold text-[#14142B] mb-1.5">
                  Tên Linh vật (Mascot)
                </label>
                <input
                  type="text"
                  placeholder="Mặc định: Bro"
                  value={mascotName}
                  onChange={(e) => setMascotName(e.target.value)}
                  className="w-full rounded-xl border border-[#EEEEF5] bg-[#F8F8FD] px-3.5 py-2.5 text-sm text-[#14142B] placeholder:text-[#8A8AA3] transition focus:border-[#5B4BDB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/15"
                />
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#EEEEF5]">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#8A8AA3] hover:bg-[#F2F2F8] hover:text-[#14142B] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#5B4BDB] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#5B4BDB]/25 transition hover:bg-[#4C3BC7] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Tạo phòng ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
