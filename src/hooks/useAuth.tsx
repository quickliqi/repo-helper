import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/types/database';

const ACTIVE_ROLE_KEY = 'quickliqi_active_role';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  allRoles: AppRole[];
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRole: (newRole: AppRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch ALL roles for the user
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesData && rolesData.length > 0) {
        const roles = rolesData.map(r => r.role as AppRole);
        setAllRoles(roles);

        // Check if there's a saved active role in localStorage
        const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY) as AppRole | null;

        if (savedRole && roles.includes(savedRole)) {
          setRole(savedRole);
        } else {
          // Default to first role (or admin if available for priority)
          const defaultRole = roles.includes('admin') ? 'admin' : roles[0];
          setRole(defaultRole);
          localStorage.setItem(ACTIVE_ROLE_KEY, defaultRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setAllRoles([]);
          localStorage.removeItem(ACTIVE_ROLE_KEY);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      // Create profile - this triggers the create_initial_listing_credit function
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          full_name: fullName,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Create role - this triggers create_investor_trial for investors
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: selectedRole,
        });

      if (roleError) {
        console.error('Error creating role:', roleError);
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    // If the user was deleted server-side (e.g., database reset), global signout can fail.
    // Always clear local session + state so the app can recover.
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.warn('Global sign out failed, clearing local session:', error);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // ignore
      }
    }

    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setAllRoles([]);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const switchRole = (newRole: AppRole) => {
    if (allRoles.includes(newRole)) {
      setRole(newRole);
      localStorage.setItem(ACTIVE_ROLE_KEY, newRole);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      allRoles,
      isLoading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}