'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateRoomModal from './CreateRoomModal';

interface CreateRoomTriggerProps {
  variant?: 'card' | 'button';
  className?: string;
}

export default function CreateRoomTrigger({
  variant = 'card',
  className = '',
}: CreateRoomTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'button') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 rounded-xl bg-[#5B4BDB] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#5B4BDB]/25 transition hover:bg-[#4C3BC7] ${className}`}
        >
          <Plus className="h-4 w-4" />
          <span>Tạo phòng mới</span>
        </button>
        <CreateRoomModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#DDDDEB] p-3.5 text-left transition hover:border-[#5B4BDB] hover:bg-[#FBFBFE] group w-full ${className}`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E4E4EE] text-[#8A8AA3] group-hover:text-[#5B4BDB] group-hover:border-[#5B4BDB]">
          <Plus className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="block text-xs font-bold text-[#14142B] group-hover:text-[#5B4BDB]">
            Tạo phòng mới
          </span>
          <span className="block text-[11px] text-[#8A8AA3]">
            Cấp mã mời KTX
          </span>
        </div>
      </button>
      <CreateRoomModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
