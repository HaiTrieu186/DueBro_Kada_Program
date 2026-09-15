// Bro Voice message templates (Architecture Section 6.4 & packages/shared-types)
import type { Database } from './supabaseClient.ts';

export type EscalationLevel = 'friendly' | 'due' | 'sarcastic' | 'sos';

export interface MessageTemplateContext {
  task_title: string;
  points: number;
  due_time: string;
  mascot_name?: string;
}

export const BRO_VOICE_TEMPLATES: Record<EscalationLevel, string[]> = {
  friendly: [
    "{mascot} ơi, lát nhớ {task_title} trước {due_time} nhé. Easy {points} points!",
    "Nhắc nhẹ nè: {task_title} hạn chót lúc {due_time}. Làm sớm nghỉ sớm nha {mascot}!",
    "Bro phòng bên nhắc: {task_title} đang đợi bạn kìa, nhận ngay {points} điểm uy tín!",
  ],
  due: [
    "{mascot}, it's due! Đến giờ {task_title} rồi kìa!",
    "Deadline tới đít rồi {mascot} ơi: {task_title} ngay và luôn nào!",
    "Đúng boong giờ G: mau hoàn thành {task_title} thôi bạn ơi!",
  ],
  sarcastic: [
    "{mascot}... mày tính để {task_title} mọc nấm men mới làm hả {mascot}?",
    "Nghe đồn có người quên {task_title} mấy tiếng rồi, ai ta? 😏",
    "Trễ deadline rồi kìa Bro... Karma đang tụt dốc không phanh đó nha!",
  ],
  sos: [
    "🚨 SOS: Task {task_title} đang 'đóng băng' trễ quá 12h! Ai giải cứu được x1.5 điểm!",
    "🚨 CỨU BỒ: {task_title} quá hạn nghiêm trọng. Cần người giải cứu gấp nhận bonus x1.5 điểm!",
  ],
};

/**
 * Render a Bro message by picking a template and interpolating context variables
 */
export function renderBroMessage(level: EscalationLevel, context: MessageTemplateContext): string {
  const templates = BRO_VOICE_TEMPLATES[level];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const mascot = context.mascot_name || 'Bro';

  return template
    .replaceAll('{mascot}', mascot)
    .replaceAll('{task_title}', context.task_title)
    .replaceAll('{points}', String(context.points))
    .replaceAll('{due_time}', context.due_time);
}
