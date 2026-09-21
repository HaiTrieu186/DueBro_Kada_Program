import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email?: string;
  display_name: string;
  avatar_url?: string | null;
  trust_score: number;
  karma_balance: number;
  current_room_id?: string | null;
}

export interface ActiveRoom {
  id: string;
  name: string;
  role: 'host' | 'member';
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  room: ActiveRoom | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setRoom: (room: ActiveRoom | null) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  room: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    }),
  setProfile: (profile) =>
    set({
      profile,
      hasCompletedOnboarding: !!profile?.display_name,
    }),
  setRoom: (room) => set({ room }),
  setHasCompletedOnboarding: (hasCompletedOnboarding) =>
    set({ hasCompletedOnboarding }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      room: null,
      isLoading: false,
      hasCompletedOnboarding: false,
    });
  },
}));
