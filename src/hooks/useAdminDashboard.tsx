import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTodayLocalDateString } from "@/utils/dateUtils";

export const useRevenueSummary = (date?: string) => {
  return useQuery({
    queryKey: ["revenue-summary", date],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_revenue_summary", {
        p_date: date || getTodayLocalDateString(),
      });
      if (error) throw error;
      return data?.[0] || {
        total_patients: 0,
        normal_tokens: 0,
        priority_tokens: 0,
        total_consultation_income: 0,
        total_priority_income: 0,
        overall_revenue: 0,
      };
    },
  });
};

export const useUpcomingFollowups = (days: number = 7) => {
  return useQuery({
    queryKey: ["upcoming-followups", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_upcoming_followups", {
        p_days: days,
      });
      if (error) throw error;
      return data || [];
    },
  });
};
