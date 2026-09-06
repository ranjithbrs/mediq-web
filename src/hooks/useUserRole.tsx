import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "doctor" | "patient" | "hospital";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const isTransitioning = user && lastUserId !== user.id;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      setLastUserId(null);
      return;
    }

    const fetchRoles = async () => {
      setLoading(true);
      setLastUserId(user.id);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!error && data) {
        setRoles(data.map((r: any) => r.role as AppRole));
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user, authLoading]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isDoctor = hasRole("doctor");
  const isPatient = hasRole("patient");
  const isHospital = hasRole("hospital");

  return { roles, loading: loading || authLoading || isTransitioning, hasRole, isAdmin, isDoctor, isPatient, isHospital, user };
};

