import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type UserRole = "cliente" | "vendedor" | "fornecedor";

interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  activeRole: UserRole;
  reputation: number;
  avatarUrl?: string;
  isAdmin?: boolean;
  bio?: string;
  location?: string;
  phone?: string;
  status?: string;
  activationRequested?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: string | null }>;
  register: (
    name: string,
    email: string,
    password: string,
    roles: UserRole[]
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<User>) => Promise<{ error: string | null }>;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

function mapProfile(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roles: row.roles as UserRole[],
    activeRole: row.active_role as UserRole,
    reputation: parseFloat(row.reputation ?? "5"),
    avatarUrl: row.avatar_url,
    isAdmin: row.is_admin,
    bio: row.bio,
    location: row.location,
    phone: row.phone,
    status: row.status,
    activationRequested: row.activation_requested,
  };
}

async function fetchProfile(su: SupabaseUser): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", su.id)
      .maybeSingle();

    if (data) return mapProfile(data);

    // JIT create if missing
    if (!data) {
      const { data: created, error: err2 } = await supabase
        .from("profiles")
        .insert({
          id: su.id,
          name: su.user_metadata?.name || su.email?.split("@")[0] || "Gamer",
          email: su.email,
          roles: su.user_metadata?.roles || ["cliente"],
          active_role: su.user_metadata?.active_role || "cliente",
          reputation: 5.0,
          status: "active",
        })
        .select()
        .single();

      if (created) return mapProfile(created);
      console.error("JIT profile error:", err2);
    }
    if (error) console.error("Profile fetch error:", error);
  } catch (err) {
    console.error("fetchProfile exception:", err);
  }
  return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        setSession(s);
        // Fire-and-forget: load profile without blocking
        fetchProfile(s.user).then((p) => {
          if (p) setUser(p);
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    // 2) Listen for auth changes
    //    CRITICAL: This callback must NOT be async.
    //    Supabase awaits onAuthStateChange callbacks internally,
    //    so an async callback that awaits fetchProfile() will block
    //    signInWithPassword() from ever resolving — causing the
    //    infinite spinner on the login button.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        // Synchronously update session
        setSession(s);

        if (s?.user) {
          // Fire-and-forget: don't block the Supabase auth flow
          fetchProfile(s.user).then((p) => {
            setUser(p);
            setLoading(false);
          }).catch(() => setLoading(false));
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ---- login ----
  const login = async (
    email: string,
    password: string,
    _rememberMe?: boolean
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  // ---- register ----
  const register = async (
    name: string,
    email: string,
    password: string,
    roles: UserRole[]
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, roles, active_role: roles[0] || "cliente" } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  // ---- logout ----
  const logout = async () => {
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  // ---- switchRole ----
  const switchRole = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      setUser({ ...user, activeRole: role });
      supabase.from("profiles").update({ active_role: role }).eq("id", user.id);
    }
  };

  // ---- updateProfile ----
  const updateProfile = async (updates: Partial<User>): Promise<{ error: string | null }> => {
    if (!user) return { error: "Usuário não autenticado" };
    const m: any = {};
    if (updates.name) m.name = updates.name;
    if (updates.avatarUrl !== undefined) m.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) m.bio = updates.bio;
    if (updates.location !== undefined) m.location = updates.location;
    if (updates.phone !== undefined) m.phone = updates.phone;
    const { error } = await supabase.from("profiles").update(m).eq("id", user.id);
    if (error) return { error: error.message };
    setUser({ ...user, ...updates });
    return { error: null };
  };

  // ---- refreshProfile ----
  const refreshProfile = async () => {
    if (session?.user) {
      const p = await fetchProfile(session.user);
      if (p) setUser(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user, session, loading,
        login, register, logout, switchRole, updateProfile, refreshProfile,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
