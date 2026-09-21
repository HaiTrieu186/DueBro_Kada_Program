/**
 * Time utility functions for Due Bro (ARCH Mục 5.9 & 15.2)
 * Múi giờ nghiệp vụ: Asia/Ho_Chi_Minh (UTC+7)
 */

export function vnWeekStart(d = new Date()): string {
  const vn = new Date(d.getTime() + 7 * 3600_000); // sang giờ VN (UTC+7)
  const day = (vn.getUTCDay() + 6) % 7;           // Thứ Hai = 0
  vn.setUTCDate(vn.getUTCDate() - day);
  return vn.toISOString().slice(0, 10);           // 'YYYY-MM-DD'
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5); // 'HH:MM'
}

export function getRemainingTime(dueAtStr: string): {
  label: string;
  isOverdue: boolean;
  hoursDiff: number;
} {
  const due = new Date(dueAtStr).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    if (overdueHours < 1) {
      return { label: 'Vừa trễ hạn', isOverdue: true, hoursDiff: diffHours };
    }
    if (overdueHours < 24) {
      return { label: `Trễ ${overdueHours}h`, isOverdue: true, hoursDiff: diffHours };
    }
    const days = Math.floor(overdueHours / 24);
    return { label: `Trễ ${days} ngày`, isOverdue: true, hoursDiff: diffHours };
  }

  if (diffHours < 1) {
    const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return { label: `Còn ${mins} phút`, isOverdue: false, hoursDiff: diffHours };
  }
  if (diffHours < 24) {
    return { label: `Còn ${diffHours}h`, isOverdue: false, hoursDiff: diffHours };
  }
  const days = Math.floor(diffHours / 24);
  return { label: `Còn ${days} ngày`, isOverdue: false, hoursDiff: diffHours };
}

export function formatVnDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
