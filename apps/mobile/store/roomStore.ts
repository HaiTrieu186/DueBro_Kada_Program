import { create } from 'zustand';
import {
  MOCK_ROOM, MOCK_TASKS, MOCK_MEMBERS, MOCK_WEEKLY_PROGRESS,
  TaskInstance, TaskStatus,
} from '@/lib/mockData';

interface RoomState {
  room: typeof MOCK_ROOM;
  tasks: TaskInstance[];
  members: typeof MOCK_MEMBERS;
  weeklyProgress: typeof MOCK_WEEKLY_PROGRESS;
  claimTask: (taskId: string, userId: string) => void;
  submitTask: (taskId: string) => void;
  disputeTask: (taskId: string) => void;
  nudgeTask: (taskId: string) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: MOCK_ROOM,
  tasks: MOCK_TASKS,
  members: MOCK_MEMBERS,
  weeklyProgress: MOCK_WEEKLY_PROGRESS,

  claimTask: (taskId, userId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId && t.status === 'open'
          ? { ...t, status: 'claimed' as TaskStatus, claimed_by: userId, assignment_method: 'volunteer', bonus_multiplier: 1.1 }
          : t
      ),
    })),

  submitTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'pending_approval' as TaskStatus } : t
      ),
    })),

  disputeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'disputed' as TaskStatus } : t
      ),
    })),

  nudgeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, nudge_count: t.nudge_count + 1 } : t
      ),
    })),
}));
