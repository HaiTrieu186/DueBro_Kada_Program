'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronRight,
  Maximize2,
  MoreHorizontal,
  Check,
  AlertCircle,
  ExternalLink,
  Filter,
  Flame,
  Clock,
  Sparkles,
  Undo2,
} from 'lucide-react';

interface TaskItem {
  id: string;
  name: string;
  category: 'Dọn dẹp' | 'Rác thải' | 'Mua sắm' | 'Khiếu nại' | 'Bằng chứng' | 'Vệ sinh' | 'Hệ thống';
  priority: 'high' | 'medium' | 'low';
  dueText: string;
  isToday?: boolean;
  isUrgent?: boolean;
  completed?: boolean;
  link?: string;
  group: 'inProgress' | 'todo' | 'upcoming';
}

export function ProdifyTasksCard({
  inProgressCount = 3,
  openDisputesCount = 0,
}: {
  inProgressCount?: number;
  openDisputesCount?: number;
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'disputes' | 'routine'>('all');
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [todoOpen, setTodoOpen] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      name: 'Vệ sinh phòng khách & ban công tầng 4',
      category: 'Dọn dẹp',
      priority: 'high',
      dueText: 'Hôm nay',
      isToday: true,
      isUrgent: true,
      completed: false,
      group: 'inProgress',
    },
    {
      id: 'task-2',
      name: 'Thu gom & phân loại rác hành lang KTX',
      category: 'Rác thải',
      priority: 'low',
      dueText: 'Còn 2 ngày',
      completed: false,
      group: 'inProgress',
    },
    {
      id: 'task-3',
      name: 'Kiểm kê vật dụng dùng chung & quỹ phòng',
      category: 'Mua sắm',
      priority: 'low',
      dueText: 'Còn 3 ngày',
      completed: false,
      group: 'inProgress',
    },
    {
      id: 'todo-1',
      name: openDisputesCount > 0 
        ? `Xử lý ${openDisputesCount} khiếu nại (dispute) vi phạm nội quy` 
        : 'Rà soát danh sách phân chia việc nhà tuần mới',
      category: 'Khiếu nại',
      priority: 'high',
      dueText: openDisputesCount > 0 ? 'Khẩn cấp' : 'Hôm nay',
      isToday: true,
      isUrgent: true,
      completed: false,
      link: '/disputes',
      group: 'todo',
    },
    {
      id: 'todo-2',
      name: 'Kiểm duyệt ảnh bằng chứng hoàn thành việc nhà',
      category: 'Bằng chứng',
      priority: 'low',
      dueText: 'Trong 24h',
      completed: false,
      group: 'todo',
    },
    {
      id: 'up-1',
      name: 'Tổng vệ sinh định kỳ phòng tắm & bồn rửa KTX',
      category: 'Vệ sinh',
      priority: 'high',
      dueText: 'Chủ nhật',
      completed: false,
      group: 'upcoming',
    },
    {
      id: 'up-2',
      name: 'Reset hạn mức Quota Tuần & xếp hạng bảng Karma',
      category: 'Hệ thống',
      priority: 'low',
      dueText: '23:59 CN',
      completed: false,
      group: 'upcoming',
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = !t.completed;
          setToastMessage(nextState ? `Đã hoàn tất "${t.name}"` : `Đã hoàn tác "${t.name}"`);
          setTimeout(() => setToastMessage(null), 3000);
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (activeTab === 'urgent') return t.isUrgent || t.priority === 'high';
      if (activeTab === 'disputes') return t.category === 'Khiếu nại' || t.category === 'Bằng chứng';
      if (activeTab === 'routine') return t.group === 'upcoming' || t.category === 'Hệ thống';
      return true;
    });
  }, [tasks, activeTab]);

  const inProgressTasks = filteredTasks.filter((t) => t.group === 'inProgress');
  const todoTasks = filteredTasks.filter((t) => t.group === 'todo');
  const upcomingTasks = filteredTasks.filter((t) => t.group === 'upcoming');

  return (
    <div className="prodify-card p-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-10 flex items-center gap-2 rounded-xl bg-[#14142B] px-3.5 py-2 text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <Check className="h-3.5 w-3.5 text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F0F0F6] pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFB] text-[#5B4BDB]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#14142B]">
              Công Việc Vận Hành (Chore Lifecycle)
            </h3>
            <p className="text-xs text-[#8A8AA3]">
              Theo dõi việc nhà, khiếu nại và nhiệm vụ điều phối
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/disputes"
            className="flex items-center gap-1.5 rounded-lg bg-[#EEEDFB] px-2.5 py-1 text-xs font-semibold text-[#5B4BDB] hover:bg-[#DDD9F8] transition"
          >
            <span>Xử lý khiếu nại</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-b border-[#F0F0F6] pb-3">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'urgent', label: 'Việc khẩn cấp', icon: Flame },
          { id: 'disputes', label: 'Khiếu nại & Bằng chứng', icon: AlertCircle },
          { id: 'routine', label: 'Định kỳ & Cron', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-[#EEEDFB] text-[#5B4BDB] shadow-sm'
                  : 'text-[#6B6B80] hover:bg-[#F2F2F8] hover:text-[#14142B]'
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Group: ĐANG XỬ LÝ (IN PROGRESS) */}
      {inProgressTasks.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setInProgressOpen(!inProgressOpen)}
            className="flex w-full items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[#8A8AA3] transition-transform duration-200 ${
                  inProgressOpen ? 'rotate-0' : '-rotate-90'
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
              <span className="badge-in-progress">ĐANG XỬ LÝ</span>
              <span className="text-xs text-[#8A8AA3]">
                • {inProgressTasks.filter((t) => !t.completed).length} công việc
              </span>
            </div>
          </button>

          {inProgressOpen && (
            <div className="mt-3">
              {/* Table Header */}
              <div className="flex items-center px-8 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9B9BB4] border-b border-[#F0F0F6]">
                <span className="flex-1">Tên công việc / Hạng mục</span>
                <span className="w-24 text-center">Mức ưu tiên</span>
                <span className="w-24 text-right">Thời hạn</span>
              </div>

              {/* Task Rows */}
              <div className="divide-y divide-[#F0F0F6]">
                {inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center py-3 px-2 rounded-xl transition hover:bg-[#FAFAFD] group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          task.completed
                            ? 'border-[#34D399] bg-[#34D399] text-white'
                            : 'border-[#7AD8D2] bg-[#B8ECEA] hover:border-[#4FD1C5]'
                        }`}
                      >
                        {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>
                      <span
                        className={`text-[13.5px] font-medium truncate transition ${
                          task.completed
                            ? 'line-through text-[#B4B4C7]'
                            : 'text-[#14142B]'
                        }`}
                      >
                        {task.name}
                      </span>
                      <span className="hidden sm:inline-block rounded-md bg-[#F2F2F8] px-2 py-0.5 text-[10px] font-semibold text-[#8A8AA3]">
                        {task.category}
                      </span>
                    </div>

                    <div className="w-24 flex justify-center">
                      <span
                        className={
                          task.priority === 'high' ? 'badge-high' : 'badge-low'
                        }
                      >
                        {task.priority === 'high' ? 'Cao' : 'Thường'}
                      </span>
                    </div>

                    <div className="w-24 text-right">
                      <span
                        className={`text-xs font-medium ${
                          task.isToday ? 'text-[#E5484D] font-bold' : 'text-[#8A8AA3]'
                        }`}
                      >
                        {task.dueText}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Group: CẦN PHÂN XỬ & RÀ SOÁT (TO DO) */}
      {todoTasks.length > 0 && (
        <div className="mt-5 border-t border-[#F0F0F6] pt-4">
          <button
            onClick={() => setTodoOpen(!todoOpen)}
            className="flex w-full items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[#8A8AA3] transition-transform duration-200 ${
                  todoOpen ? 'rotate-0' : '-rotate-90'
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
              <span className="badge-todo">CẦN PHÂN XỬ</span>
              <span className="text-xs text-[#8A8AA3]">
                • {todoTasks.length} nhiệm vụ
              </span>
            </div>
          </button>

          {todoOpen && (
            <div className="mt-3 divide-y divide-[#F0F0F6]">
              {todoTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center py-3 px-2 rounded-xl transition hover:bg-[#FAFAFD] group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        task.completed
                          ? 'border-[#34D399] bg-[#34D399] text-white'
                          : 'border-[#FFD6D9] bg-[#FFD6D9] text-[#E5484D]'
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>
                    {task.link ? (
                      <Link
                        href={task.link}
                        className={`text-[13.5px] font-semibold truncate hover:text-[#5B4BDB] hover:underline flex items-center gap-1.5 ${
                          task.completed ? 'line-through text-[#B4B4C7]' : 'text-[#E5484D]'
                        }`}
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {task.name}
                      </Link>
                    ) : (
                      <span
                        className={`text-[13.5px] font-medium truncate ${
                          task.completed ? 'line-through text-[#B4B4C7]' : 'text-[#14142B]'
                        }`}
                      >
                        {task.name}
                      </span>
                    )}
                  </div>

                  <div className="w-24 flex justify-center">
                    <span className={task.priority === 'high' ? 'badge-high' : 'badge-low'}>
                      {task.priority === 'high' ? 'Cao' : 'Thường'}
                    </span>
                  </div>

                  <div className="w-24 text-right">
                    <span
                      className={`text-xs font-semibold ${
                        task.priority === 'high' ? 'text-[#E5484D]' : 'text-[#8A8AA3]'
                      }`}
                    >
                      {task.dueText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Group: SẮP TỚI & CUỐI TUẦN (UPCOMING) */}
      {upcomingTasks.length > 0 && (
        <div className="mt-4 border-t border-[#F0F0F6] pt-4">
          <button
            onClick={() => setUpcomingOpen(!upcomingOpen)}
            className="flex w-full items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[#8A8AA3] transition-transform duration-200 ${
                  upcomingOpen ? 'rotate-0' : '-rotate-90'
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
              <span className="badge-upcoming">SẮP TỚI</span>
              <span className="text-xs text-[#8A8AA3]">
                • {upcomingTasks.length} nhiệm vụ định kỳ
              </span>
            </div>
          </button>

          {upcomingOpen && (
            <div className="mt-3 divide-y divide-[#F0F0F6]">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center py-3 px-2 rounded-xl transition hover:bg-[#FAFAFD] group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        task.completed
                          ? 'border-[#34D399] bg-[#34D399] text-white'
                          : 'border-[#E4E4EE] bg-[#F2F2F8]'
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>
                    <span
                      className={`text-[13.5px] font-medium truncate ${
                        task.completed ? 'line-through text-[#B4B4C7]' : 'text-[#14142B]'
                      }`}
                    >
                      {task.name}
                    </span>
                  </div>

                  <div className="w-24 flex justify-center">
                    <span className="badge-low">Định kỳ</span>
                  </div>

                  <div className="w-24 text-right">
                    <span className="text-xs font-medium text-[#8A8AA3]">
                      {task.dueText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

