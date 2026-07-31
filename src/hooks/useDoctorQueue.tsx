import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTodayLocalDateString } from "@/utils/dateUtils";

// ─── Existing: Doctor Queue via RPC ──────────────────────────────────────────

export const useDoctorQueue = (doctorId: string | undefined, date?: string) => {
  return useQuery({
    queryKey: ["doctor-queue", doctorId, date],
    queryFn: async () => {
      if (!doctorId) throw new Error("Doctor ID required");
      const { data, error } = await supabase.rpc("get_doctor_queue", {
        p_doctor_id: doctorId,
        p_date: date || getTodayLocalDateString(),
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!doctorId,
    refetchInterval: 10000, // Live refresh every 10s
  });
};

// ─── Existing: Update Consultation Status ─────────────────────────────────────

export const useUpdateConsultationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      status,
      followUpDate,
      consultationNotes,
      diagnosis,
      prescription,
      doctorNotes,
    }: {
      appointmentId: string;
      status: string;
      followUpDate?: string;
      consultationNotes?: string;
      diagnosis?: string;
      prescription?: string;
      doctorNotes?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (followUpDate) updateData.follow_up_date = followUpDate;
      if (consultationNotes) updateData.consultation_notes = consultationNotes;
      if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
      if (prescription !== undefined) updateData.prescription = prescription;
      if (doctorNotes !== undefined) updateData.doctor_notes = doctorNotes;

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-queue"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments-extra"] });
      toast.success("Status updated");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });
};

// ─── Existing: Doctor by Email ────────────────────────────────────────────────

export const useDoctorByEmail = (email: string | undefined) => {
  return useQuery({
    queryKey: ["doctor-by-email", email],
    queryFn: async () => {
      if (!email) throw new Error("Email required");
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!email,
  });
};

// ─── New: Doctor Statistics via RPC ───────────────────────────────────────────

export const useDoctorStatistics = (doctorId: string | undefined) => {
  return useQuery({
    queryKey: ["doctor-statistics", doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error("Doctor ID required");
      const { data, error } = await supabase.rpc("get_doctor_statistics", {
        p_doctor_id: doctorId,
      });
      if (error) throw error;
      // RPC returns an array with one row
      return (data && data[0]) || null;
    },
    enabled: !!doctorId,
  });
};

// ─── New: Extra appointment details (payment_status, special_instructions,
//         patient profile fields) fetched from appointments + profiles ──────────

export interface AppointmentExtra {
  appointment_id: string;
  payment_status: string;
  special_instructions: string | null;
  consultation_notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  doctor_notes: string | null;
  patient_phone: string | null;
  patient_email: string | null;
  patient_blood_group: string | null;
  patient_allergies: string | null;
  patient_current_medications: string | null;
}

export const useDoctorAppointmentsExtra = (
  doctorId: string | undefined,
  date?: string
) => {
  const targetDate = date || getTodayLocalDateString();

  return useQuery({
    queryKey: ["doctor-appointments-extra", doctorId, targetDate],
    queryFn: async () => {
      if (!doctorId) throw new Error("Doctor ID required");

      // Fetch appointments for the doctor on the given date
      const { data: appts, error: apptError } = await supabase
        .from("appointments")
        .select(
          "id, user_id, payment_status, special_instructions, consultation_notes, diagnosis, prescription, doctor_notes"
        )
        .eq("doctor_id", doctorId)
        .eq("appointment_date", targetDate);

      if (apptError) throw apptError;
      if (!appts || appts.length === 0) return {} as Record<string, AppointmentExtra>;

      // Collect unique user_ids
      const userIds = [...new Set(appts.map((a) => a.user_id))];

      // Fetch profiles for those users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, phone, email, blood_group, allergies, current_medications")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Build a map of user_id → profile
      const profileMap: Record<string, typeof profiles[0]> = {};
      (profiles || []).forEach((p) => {
        profileMap[p.id] = p;
      });

      // Build a map of appointment_id → enriched data
      const result: Record<string, AppointmentExtra> = {};
      appts.forEach((appt) => {
        const profile = profileMap[appt.user_id];
        result[appt.id] = {
          appointment_id: appt.id,
          payment_status: appt.payment_status ?? "pending",
          special_instructions: appt.special_instructions ?? null,
          consultation_notes: appt.consultation_notes ?? null,
          diagnosis: appt.diagnosis ?? null,
          prescription: appt.prescription ?? null,
          doctor_notes: appt.doctor_notes ?? null,
          patient_phone: profile?.phone ?? null,
          patient_email: profile?.email ?? null,
          patient_blood_group: profile?.blood_group ?? null,
          patient_allergies: profile?.allergies ?? null,
          patient_current_medications: profile?.current_medications ?? null,
        };
      });

      return result;
    },
    enabled: !!doctorId,
    refetchInterval: 10000,
  });
};

// ─── New: Cancel Appointment (doctor-side) ────────────────────────────────────

export const useCancelAppointmentByDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-queue"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments-extra"] });
      toast.success("Appointment cancelled");
    },
    onError: (error) => {
      toast.error("Failed to cancel: " + error.message);
    },
  });
};
