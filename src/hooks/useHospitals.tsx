import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  rating: number | null;
  total_reviews: number | null;
  specialties: string[] | null;
  facilities: string[] | null;
  images: string[] | null;
  latitude: number | null;
  longitude: number | null;
  pincode?: string | null;
  description?: string | null;
  status?: string | null;
}

interface UseHospitalsOptions {
  searchText?: string;
  city?: string;
  specialty?: string;
}

export const useHospitals = (options: UseHospitalsOptions = {}) => {
  return useQuery({
    queryKey: ["hospitals", options],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_hospitals", {
        search_text: options.searchText || null,
        city_filter: options.city || null,
        specialty_filter: options.specialty || null,
        limit_count: 20,
        offset_count: 0,
      });

      if (error) throw error;
      return data as Hospital[];
    },
  });
};

export const useHospitalById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["hospital", id],
    queryFn: async () => {
      if (!id) throw new Error("Hospital ID is required");

      // Use public_hospitals view which excludes email for security
      const { data, error } = await supabase
        .from("public_hospitals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};
