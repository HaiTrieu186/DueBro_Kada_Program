import { supabase } from './supabase';

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Type-safe RPC caller wrapper (ARCH Mục 9.1 & 15.2)
 * Client KHÔNG BAO GIỜ ghi trực tiếp bảng nghiệp vụ, luôn gọi qua callRpc.
 * Tự động bóc tách thông báo lỗi tiếng Việt từ PostgreSQL RAISE EXCEPTION thành AppError.
 */
export async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase.rpc as any)(fn, args ?? {});
  if (error) {
    // Chuẩn hóa message: bỏ prefix ERROR: và đoạn CONTEXT...
    const cleanMsg = error.message
      .replace(/^.*ERROR:\s*/, '')
      .replace(/CONTEXT:.*$/s, '')
      .trim();
    throw new AppError(cleanMsg || 'Đã có lỗi xảy ra, bro thử lại nhé!');
  }
  return data as T;
}
