import { create } from 'zustand';
import {
  MOCK_ROOM,
  MOCK_TASKS,
  MOCK_MEMBERS,
  MOCK_WEEKLY_PROGRESS,
  MOCK_BILL_STATUS,
  TaskInstance,
  TaskStatus,
} from '@/lib/mockData';

interface RoomState {
  room: typeof MOCK_ROOM;
  tasks: TaskInstance[];
  members: typeof MOCK_MEMBERS;
  weeklyProgress: typeof MOCK_WEEKLY_PROGRESS;
  billStatus: Record<string, string[]>;
  addTask: (task: Omit<TaskInstance, 'id' | 'status' | 'nudge_count'>) => void;
  claimTask: (taskId: string, userId: string) => void;
  submitTask: (taskId: string) => void;
  approveTask: (taskId: string) => void;
  disputeTask: (taskId: string) => void;
  nudgeTask: (taskId: string) => void;
  requestSwap: (taskId: string) => void;
  toggleAwayMode: (userId: string, isAway: boolean) => void;
  redeemKarma: (userId: string, cost: number) => void;
  toggleBillPayment: (taskId: string, userId: string) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: MOCK_ROOM,
  tasks: MOCK_TASKS,
  members: MOCK_MEMBERS,
  weeklyProgress: MOCK_WEEKLY_PROGRESS,
  billStatus: { ...MOCK_BILL_STATUS },

  addTask: (newTaskData) =>
    set((state) => {
      const newTask: TaskInstance = {
        ...newTaskData,
        id: `task-${Date.now().toString().slice(-4)}`,
        status: 'open',
        nudge_count: 0,
      };
      return { tasks: [newTask, ...state.tasks] };
    }),

  claimTask: (taskId, userId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId && t.status === 'open'
          ? {
              ...t,
              status: 'claimed' as TaskStatus,
              claimed_by: userId,
              assignment_method: 'volunteer',
              bonus_multiplier: t.bonus_multiplier > 1.1 ? t.bonus_multiplier : 1.1,
            }
          : t
      ),
    })),

  submitTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'pending_approval' as TaskStatus } : t
      ),
    })),

  approveTask: (taskId) =>
    set((state) => {
      const target = state.tasks.find((t) => t.id === taskId);
      if (!target) return state;

      const pointsEarned = Math.round(target.effort_points * target.bonus_multiplier);
      const karmaEarned = Math.max(1, Math.round(target.effort_points * 0.2));
      const assigneeId = target.claimed_by;

      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'completed' as TaskStatus } : t
        ),
        weeklyProgress: state.weeklyProgress.map((w) =>
          w.member_id === assigneeId
            ? { ...w, achieved_points: w.achieved_points + pointsEarned }
            : w
        ),
        members: state.members.map((m) =>
          m.member_id === assigneeId
            ? { ...m, karma_score: m.karma_score + karmaEarned }
            : m
        ),
      };
    }),

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

  requestSwap: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'open' as TaskStatus,
              claimed_by: undefined,
              bonus_multiplier: 1.5, // SOS bonus reward
            }
          : t
      ),
    })),

  toggleAwayMode: (userId, isAway) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.member_id === userId
          ? { ...m, away_status: isAway ? 'away' : 'active' }
          : m
      ),
    })),

  redeemKarma: (userId, cost) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.member_id === userId
          ? { ...m, karma_score: Math.max(0, m.karma_score - cost) }
          : m
      ),
    })),

  toggleBillPayment: (taskId, userId) =>
    set((state) => {
      const currentPaid = state.billStatus[taskId] || [];
      const hasPaid = currentPaid.includes(userId);
      const updatedPaid = hasPaid
        ? currentPaid.filter((id) => id !== userId)
        : [...currentPaid, userId];

      return {
        billStatus: {
          ...state.billStatus,
          [taskId]: updatedPaid,
        },
      };
    }),
}));
