import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface ActiveRoom {
  id: string;
  name: string;
  invite_code: string;
  role: 'host' | 'member';
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  activeRoom: ActiveRoom | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setActiveRoom: (room: ActiveRoom | null) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  checkOnboardingStatus: (userId: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  activeRoom: null,
  isLoading: true,
  hasCompletedOnboarding: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    }),

  setProfile: (profile) => set({ profile }),

  setActiveRoom: (activeRoom) => set({ activeRoom }),

  setHasCompletedOnboarding: (hasCompletedOnboarding) =>
    set({ hasCompletedOnboarding }),

  checkOnboardingStatus: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('lifestyle_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      const completed = !error && !!data;
      set({ hasCompletedOnboarding: completed });
      return completed;
    } catch {
      return false;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      activeRoom: null,
      isLoading: false,
      hasCompletedOnboarding: false,
    });
  },
}));
