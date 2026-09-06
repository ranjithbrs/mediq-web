import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface HospitalStaffInfo {
  id: string;
  user_id: string;
  hospital_id: string;
  staff_role: string;
  is_active: boolean;
  hospital: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    emergency_available?: boolean | null;
  } | null;
  profile: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export const useHospitalStaff = () => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<HospitalStaffInfo | null>({
    queryKey: ["hospital-staff", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 1. Fetch active hospital staff row
      const { data: staffRow, error: staffError } = await supabase
        .from("hospital_staff")
        .select(`
          id,
          user_id,
          hospital_id,
          staff_role,
          is_active,
          hospitals:hospital_id (
            id,
            name,
            email,
            phone,
            address,
            city,
            state,
            emergency_available
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (staffError) {
        throw staffError;
      }

      if (!staffRow) return null;

      // 2. Fetch user profile for display name
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("id", user.id)
        .maybeSingle();

      return {
        id: staffRow.id,
        user_id: staffRow.user_id,
        hospital_id: staffRow.hospital_id,
        staff_role: staffRow.staff_role,
        is_active: staffRow.is_active,
        hospital: (staffRow as any).hospitals || null,
        profile: profileRow || null,
      };
    },
    enabled: !!user && !authLoading,
  });

  return {
    staff: data,
    hospital: data?.hospital,
    profile: data?.profile,
    isActiveStaff: !!data && data.is_active,
    isLoading: authLoading || isLoading,
    error,
    refetch,
  };
};
