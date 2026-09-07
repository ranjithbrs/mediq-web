import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type EmergencyAlertStatus = "pending" | "acknowledged" | "dispatched" | "resolved";

export interface EmergencyAlertItem {
  id: string;
  user_id: string;
  hospital_id: string;
  latitude: number | null;
  longitude: number | null;
  message: string | null;
  status: string;
  email_status: string;
  email_sent_at: string | null;
  email_error: string | null;
  created_at: string;
  resolved_at: string | null;
  patient_name?: string | null;
  patient_phone?: string | null;
}

export const useHospitalEmergencyAlerts = (hospitalId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Real-time subscription for emergency alert events (INSERT & UPDATE) scoped to this hospital
  useEffect(() => {
    if (!user || !hospitalId) return;

    const channelName = `hospital-alerts-${hospitalId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emergency_alerts",
          filter: `hospital_id=eq.${hospitalId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["hospital-emergency-alerts", hospitalId],
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "emergency_alerts",
          filter: `hospital_id=eq.${hospitalId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["hospital-emergency-alerts", hospitalId],
          });
        }
      )
      .subscribe((status, err) => {
        if (err || status === "CHANNEL_ERROR") {
          console.warn(
            `[useHospitalEmergencyAlerts] Realtime subscription issue for ${channelName} (${status}):`,
            err
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId, user?.id, queryClient]);

  return useQuery<EmergencyAlertItem[]>({
    queryKey: ["hospital-emergency-alerts", hospitalId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 1. Query emergency_alerts scoped by RLS to this hospital staff user
      const { data: alertsData, error: alertsError } = await supabase
        .from("emergency_alerts")
        .select(`
          id,
          user_id,
          hospital_id,
          latitude,
          longitude,
          message,
          status,
          email_status,
          email_sent_at,
          email_error,
          created_at,
          resolved_at
        `)
        .order("created_at", { ascending: false });

      if (alertsError) {
        console.error("[useHospitalEmergencyAlerts] Error fetching alerts:", alertsError);
        throw alertsError;
      }

      if (!alertsData || alertsData.length === 0) {
        return [];
      }

      // 2. Optionally attempt to fetch profile info for associated patient user_ids
      const userIds = Array.from(new Set(alertsData.map((a) => a.user_id).filter(Boolean)));
      let profilesMap = new Map<string, { full_name: string | null; phone: string | null }>();

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", userIds);

        if (profilesData) {
          profilesData.forEach((p) => {
            profilesMap.set(p.id, { full_name: p.full_name, phone: p.phone });
          });
        }
      }

      return alertsData.map((alert) => {
        const prof = profilesMap.get(alert.user_id);
        return {
          ...alert,
          patient_name: prof?.full_name || null,
          patient_phone: prof?.phone || null,
        };
      });
    },
    enabled: !!user && !!hospitalId,
    refetchInterval: 10000, // 10s automatic polling fallback
  });
};

export const ALLOWED_STATUS_TRANSITIONS: Record<string, EmergencyAlertStatus[]> = {
  pending: ["acknowledged", "dispatched"],
  sent: ["acknowledged", "dispatched"],
  acknowledged: ["dispatched", "resolved"],
  dispatched: ["resolved"],
  resolved: [],
};

export const isValidStatusTransition = (
  currentStatus: string,
  newStatus: EmergencyAlertStatus
): boolean => {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
};

export const useUpdateEmergencyAlertStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alertId,
      status,
      currentStatus,
    }: {
      alertId: string;
      status: EmergencyAlertStatus;
      currentStatus?: string;
    }) => {
      // 1. Strict guard: Never allow transitioning to "pending" or reopening
      if (status === ("pending" as any)) {
        throw new Error("Cannot transition alert back to pending. Alerts cannot be reopened.");
      }

      // 2. Strict guard against backward transitions or modifying resolved alerts
      if (currentStatus) {
        if (currentStatus === "resolved") {
          throw new Error("Alert is already resolved and cannot be modified or reopened.");
        }
        if (!isValidStatusTransition(currentStatus, status)) {
          throw new Error(
            `Invalid status transition from "${currentStatus}" to "${status}". Backward transitions are not permitted.`
          );
        }
      }

      const updatePayload: Record<string, any> = { status };
      if (status === "resolved") {
        updatePayload.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("emergency_alerts")
        .update(updatePayload)
        .eq("id", alertId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-emergency-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["emergency-alerts"] });
    },
  });
};
