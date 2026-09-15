import { create } from 'zustand';
import { Profile, MOCK_PROFILES, MemberRole } from '@/lib/mockData';

interface AuthState {
  user: Profile | null;
  role: MemberRole;
  roomId: string | null;
  isLoading: boolean;
  signIn: (userId: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: 'member',
  roomId: null,
  isLoading: false,

  signIn: (userId: string) => {
    const profile = MOCK_PROFILES[userId];
    if (!profile) return;
    const role: MemberRole = userId === 'user-hoang' ? 'host' : 'member';
    set({ user: profile, role, roomId: 'room-402' });
  },

  signOut: () => set({ user: null, role: 'member', roomId: null }),
}));
