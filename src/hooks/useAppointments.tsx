import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  hospital_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  token_number: number | null;
  queue_position: number | null;
  special_instructions: string | null;
  diagnosis?: string | null;
  prescription?: string | null;
  doctor_notes?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useAppointments = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  // Real-time subscription for appointment changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["appointments", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ["appointments", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("appointments")
        .select(
          "*, doctors:doctors(id,name,specialization,qualification,experience,consultation_fee,rating,total_reviews,hospital_id,photo,availability_status), hospitals(*)"
        )
        .eq("user_id", userId)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useAppointmentById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["appointment", id],
    queryFn: async () => {
      if (!id) throw new Error("Appointment ID is required");

      const { data, error } = await supabase
        .from("appointments")
        .select(
          "*, doctors:doctors(id,name,specialization,qualification,experience,consultation_fee,rating,total_reviews,hospital_id,photo,availability_status), hospitals(*)"
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: {
      doctor_id: string;
      hospital_id: string;
      appointment_date: string;
      appointment_time: string;
      appointment_type: string;
      special_instructions?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get next token number
      const { data: tokenData } = await supabase.rpc("get_next_token_number", {
        p_doctor_id: appointmentData.doctor_id,
        p_date: appointmentData.appointment_date,
      });

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          ...appointmentData,
          user_id: user.id,
          token_number: tokenData || 1,
          status: "scheduled",
        })
        .select(
          "*, doctors:doctors(id,name,specialization,qualification,experience,consultation_fee,rating,total_reviews,hospital_id,photo,availability_status), hospitals(*)"
        )
        .maybeSingle();

      if (error) throw error;

      // Get user profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Send confirmation notification
      await supabase.functions.invoke("send-notification", {
        body: {
          user_id: user.id,
          appointment_id: data.id,
          type: "appointment_confirmation",
          title: "Appointment Confirmed!",
          message: `Your appointment has been successfully booked for ${new Date(
            appointmentData.appointment_date
          ).toLocaleDateString()} at ${appointmentData.appointment_time}.`,
          email_data: {
            recipient_email: user.email,
            appointment_details: {
              doctor_name: data.doctors?.name,
              hospital_name: data.hospitals?.name,
              date: appointmentData.appointment_date,
              time: appointmentData.appointment_time,
              token_number: data.token_number,
            },
          },
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked successfully!");
    },
    onError: (error) => {
      toast.error("Failed to book appointment: " + error.message);
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get appointment details first
      const { data: appointment } = await supabase
        .from("appointments")
        .select(
          "*, doctors:doctors(id,name,specialization,qualification,experience,consultation_fee,rating,total_reviews,hospital_id,photo,availability_status), hospitals(*)"
        )
        .eq("id", appointmentId)
        .maybeSingle();

      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Send cancellation notification
      if (appointment) {
        await supabase.functions.invoke("send-notification", {
          body: {
            user_id: user.id,
            appointment_id: appointmentId,
            type: "appointment_cancelled",
            title: "Appointment Cancelled",
            message: `Your appointment with ${appointment.doctors?.name} has been cancelled.`,
            email_data: {
              recipient_email: user.email,
              appointment_details: {
                doctor_name: appointment.doctors?.name,
                hospital_name: appointment.hospitals?.name,
                date: appointment.appointment_date,
                time: appointment.appointment_time,
              },
            },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled successfully!");
    },
    onError: (error) => {
      toast.error("Failed to cancel appointment: " + error.message);
    },
  });
};
