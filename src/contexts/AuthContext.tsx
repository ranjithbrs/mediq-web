import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface DemoProfile {
  id: string;
  email: string;
  fullName: string;
  role: "patient" | "doctor";
}

export const DEMO_USERS: Record<string, DemoProfile> = {
  patient: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "patient.demo@mediq.app",
    fullName: "Ranjith (Demo Patient)",
    role: "patient",
  },
  doctor: {
    id: "d748cb70-b9e8-492b-bae4-8a601c8893be",
    email: "santhoshmurugan980@gmail.com",
    fullName: "Dr. Santhosh",
    role: "doctor",
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check demo mode or current session on load
    const initializeAuth = async () => {
      try {
        const demoRole = localStorage.getItem("mediq_demo_role");
        if (demoRole && DEMO_USERS[demoRole]) {
          const demo = DEMO_USERS[demoRole];
          const mockUser = {
            id: demo.id,
            email: demo.email,
            user_metadata: { full_name: demo.fullName },
            app_metadata: { provider: "demo" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as unknown as User;

          setUser(mockUser);
          setSession({
            access_token: "demo-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "demo-refresh",
            user: mockUser,
          } as unknown as Session);
          setLoading(false);
          return;
        }

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Set up listener for auth state changes (login, logout, token refresh, password recovery, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        const demoRole = localStorage.getItem("mediq_demo_role");
        if (demoRole) return; // Keep demo session active

        console.log("Auth state change event:", event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_OUT") {
          navigate("/auth");
        } else if (event === "PASSWORD_RECOVERY") {
          // Redirect to auth page with recovery mode enabled
          navigate("/auth?recovery=true");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    localStorage.removeItem("mediq_demo_role");
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
