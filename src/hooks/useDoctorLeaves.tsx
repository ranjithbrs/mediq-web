import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTodayLocalDateString } from "@/utils/dateUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  leave_date: string;
  reason: string | null;
  leave_type: string;
  created_at: string;
  updated_at: string;
}

// ─── Check if doctor is on leave for a specific date ──────────────────────────

export const useDoctorLeave = (
  doctorId: string | undefined,
  date: string | undefined
) => {
  return useQuery({
    queryKey: ["doctor-leave", doctorId, date],
    queryFn: async () => {
      if (!doctorId || !date) throw new Error("Doctor ID and date are required");
      const { data, error } = await supabase
        .from("doctor_leaves")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("leave_date", date)
        .maybeSingle();
      if (error) throw error;
      return data as DoctorLeave | null;
    },
    enabled: !!doctorId && !!date,
  });
};

// ─── Fetch all upcoming leaves for a doctor (today and future) ────────────────

export const useDoctorLeaves = (doctorId: string | undefined) => {
  const today = getTodayLocalDateString();
  return useQuery({
    queryKey: ["doctor-leaves", doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error("Doctor ID is required");
      const { data, error } = await supabase
        .from("doctor_leaves")
        .select("*")
        .eq("doctor_id", doctorId)
        .gte("leave_date", today)
        .order("leave_date", { ascending: true });
      if (error) throw error;
      return data as DoctorLeave[];
    },
    enabled: !!doctorId,
  });
};

// ─── Add a leave date ─────────────────────────────────────────────────────────

export const useAddDoctorLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      doctorId,
      leaveDate,
      reason,
    }: {
      doctorId: string;
      leaveDate: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("doctor_leaves")
        .insert({
          doctor_id: doctorId,
          leave_date: leaveDate,
          reason: reason || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-leave"] });
      toast.success("Leave marked successfully");
    },
    onError: (error: any) => {
      if (error?.code === "23505") {
        toast.error("Leave already exists for this date");
      } else {
        toast.error("Failed to mark leave: " + error.message);
      }
    },
  });
};

// ─── Remove a leave date ──────────────────────────────────────────────────────

export const useDeleteDoctorLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leaveId: string) => {
      const { error } = await supabase
        .from("doctor_leaves")
        .delete()
        .eq("id", leaveId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-leave"] });
      toast.success("Leave removed successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to remove leave: " + error.message);
    },
  });
};
