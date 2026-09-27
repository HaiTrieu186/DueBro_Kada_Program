'use client';

import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon,
  Calendar,
  User,
  Home,
  AlertCircle,
} from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  taskTitle: string;
  roomName: string;
  assigneeName?: string;
  submittedAt?: string | null;
  reason?: string | null;
}

export default function EvidenceModal({
  isOpen,
  onClose,
  photoUrl,
  taskTitle,
  roomName,
  assigneeName,
  submittedAt,
  reason,
}: EvidenceModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-50 flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEEEF5] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFB] text-[#5B4BDB]">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#14142B] truncate max-w-md">
                Bằng Chứng Hoàn Thành: {taskTitle}
              </h3>
              <p className="text-xs text-[#8A8AA3]">
                {roomName} • {assigneeName ? `Người nộp: ${assigneeName}` : 'Chưa xác định'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center rounded-xl border border-[#EEEEF5] bg-[#F8F8FD] p-1">
              <button
                onClick={handleZoomOut}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B6B80] hover:bg-white hover:text-[#14142B]"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 text-xs font-mono font-bold text-[#5B4BDB]"
                title="Khôi phục gốc"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B6B80] hover:bg-white hover:text-[#14142B]"
                title="Phóng to"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8A8AA3] hover:bg-[#F2F2F8] hover:text-[#14142B]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Canvas */}
        <div className="relative flex min-h-[360px] max-h-[500px] items-center justify-center overflow-auto bg-[#14142B] p-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Bằng chứng việc nhà"
              className="max-h-full max-w-full rounded-lg object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 text-white/70">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white/50 mb-3">
                <ImageIcon className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-white">Ảnh bằng chứng được lưu trên Supabase Storage</p>
              <p className="mt-1 text-xs text-white/60 max-w-sm">
                Đường dẫn storage bucket: <code>chore-proofs/{taskTitle.toLowerCase().replace(/\s+/g, '-')}-proof.jpg</code>
              </p>
              <span className="mt-4 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                Chưa có ảnh upload trực tiếp từ điện thoại
              </span>
            </div>
          )}
        </div>

        {/* Footer Info & Reason */}
        <div className="border-t border-[#EEEEF5] bg-[#FBFBFE] p-5">
          <div className="flex items-start gap-3 rounded-2xl border border-[#FED7D7] bg-[#FFF5F5] p-3 text-xs text-[#C53030]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Nội dung khiếu nại của bạn cùng phòng:</span>
              <p className="mt-0.5 text-[#E53E3E] leading-relaxed">
                {reason || 'Người báo cáo cho rằng việc nhà chưa được dọn dẹp đúng chuẩn cam kết hoặc ảnh bằng chứng không khớp.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
