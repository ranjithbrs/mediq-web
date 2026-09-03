export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          consultation_fee: number | null
          consultation_notes: string | null
          created_at: string | null
          diagnosis: string | null
          doctor_id: string
          doctor_notes: string | null
          follow_up_date: string | null
          hospital_id: string
          id: string
          payment_status: string
          prescription: string | null
          priority_fee: number | null
          queue_position: number | null
          special_instructions: string | null
          status: string
          token_number: number | null
          token_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type?: string
          consultation_fee?: number | null
          consultation_notes?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_id: string
          doctor_notes?: string | null
          follow_up_date?: string | null
          hospital_id: string
          id?: string
          payment_status?: string
          prescription?: string | null
          priority_fee?: number | null
          queue_position?: number | null
          special_instructions?: string | null
          status?: string
          token_number?: number | null
          token_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          consultation_fee?: number | null
          consultation_notes?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string
          doctor_notes?: string | null
          follow_up_date?: string | null
          hospital_id?: string
          id?: string
          payment_status?: string
          prescription?: string | null
          priority_fee?: number | null
          queue_position?: number | null
          special_instructions?: string | null
          status?: string
          token_number?: number | null
          token_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "public_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "public_hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          about: string | null
          availability_status: string | null
          consultation_fee: number
          created_at: string
          education: string | null
          email: string | null
          experience: number
          hospital_id: string
          id: string
          is_public: boolean | null
          languages: string[] | null
          name: string
          photo: string | null
          qualification: string
          rating: number | null
          specialization: string
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          availability_status?: string | null
          consultation_fee: number
          created_at?: string
          education?: string | null
          email?: string | null
          experience: number
          hospital_id: string
          id?: string
          is_public?: boolean | null
          languages?: string[] | null
          name: string
          photo?: string | null
          qualification: string
          rating?: number | null
          specialization: string
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          availability_status?: string | null
          consultation_fee?: number
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: number
          hospital_id?: string
          id?: string
          is_public?: boolean | null
          languages?: string[] | null
          name?: string
          photo?: string | null
          qualification?: string
          rating?: number | null
          specialization?: string
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "public_hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_leaves: {
        Row: {
          id: string
          doctor_id: string
          leave_date: string
          reason: string | null
          leave_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          leave_date: string
          reason?: string | null
          leave_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          leave_date?: string
          reason?: string | null
          leave_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_leaves_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_alerts: {
        Row: {
          created_at: string
          hospital_id: string
          id: string
          latitude: number
          longitude: number
          message: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hospital_id: string
          id?: string
          latitude: number
          longitude: number
          message?: string | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hospital_id?: string
          id?: string
          latitude?: number
          longitude?: number
          message?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_alerts_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "public_hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string
          city: string
          created_at: string
          description: string | null
          email: string | null
          facilities: string[] | null
          id: string
          images: string[] | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string
          pincode: string
          rating: number | null
          specialties: string[] | null
          state: string
          status: string | null
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          description?: string | null
          email?: string | null
          facilities?: string[] | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone: string
          pincode: string
          rating?: number | null
          specialties?: string[] | null
          state: string
          status?: string | null
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          description?: string | null
          email?: string | null
          facilities?: string[] | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string
          pincode?: string
          rating?: number | null
          specialties?: string[] | null
          state?: string
          status?: string | null
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          appointment_reminders: boolean
          created_at: string
          email_enabled: boolean
          id: string
          push_enabled: boolean
          queue_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          queue_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          queue_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          appointment_id: string | null
          channel: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          sent_at: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          sent_at?: string | null
          status?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          currency: string
          id: string
          payment_method: string | null
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pharmacy: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          image_path: string | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          image_path?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          image_path?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string | null
          avatar_url: string | null
          blood_group: string | null
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          insurance_provider: string | null
          medical_history: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string | null
          id: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          insurance_provider?: string | null
          medical_history?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          insurance_provider?: string | null
          medical_history?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews_ratings: {
        Row: {
          created_at: string
          doctor_id: string | null
          hospital_id: string | null
          id: string
          is_public: boolean | null
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string
          is_public?: boolean | null
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string
          is_public?: boolean | null
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_ratings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ratings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "public_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ratings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ratings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "public_hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          created_at: string | null
          Date: string | null
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean | null
          max_appointments: number
          slot_duration: number
          slot_type: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          Date?: string | null
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          max_appointments?: number
          slot_duration?: number
          slot_type?: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          Date?: string | null
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          max_appointments?: number
          slot_duration?: number
          slot_type?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "public_doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_doctors: {
        Row: {
          about: string | null
          availability_status: string | null
          consultation_fee: number | null
          created_at: string | null
          education: string | null
          experience: number | null
          hospital_id: string | null
          id: string | null
          languages: string[] | null
          name: string | null
          photo: string | null
          qualification: string | null
          rating: number | null
          specialization: string | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          about?: string | null
          availability_status?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          education?: string | null
          experience?: number | null
          hospital_id?: string | null
          id?: string | null
          languages?: string[] | null
          name?: string | null
          photo?: string | null
          qualification?: string | null
          rating?: number | null
          specialization?: string | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          about?: string | null
          availability_status?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          education?: string | null
          experience?: number | null
          hospital_id?: string | null
          id?: string | null
          languages?: string[] | null
          name?: string | null
          photo?: string | null
          qualification?: string | null
          rating?: number | null
          specialization?: string | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "public_hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      public_hospitals: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          description: string | null
          facilities: string[] | null
          id: string | null
          images: string[] | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          pincode: string | null
          rating: number | null
          specialties: string[] | null
          state: string | null
          status: string | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          facilities?: string[] | null
          id?: string | null
          images?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          pincode?: string | null
          rating?: number | null
          specialties?: string[] | null
          state?: string | null
          status?: string | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          facilities?: string[] | null
          id?: string | null
          images?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          pincode?: string | null
          rating?: number | null
          specialties?: string[] | null
          state?: string | null
          status?: string | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_reviews: {
        Row: {
          created_at: string | null
          doctor_id: string | null
          hospital_id: string | null
          id: string | null
          rating: number | null
          review: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string | null
          rating?: number | null
          review?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string | null
          rating?: number | null
          review?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_ratings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ratings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "public_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ratings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ratings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "public_hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_update_appointment: {
        Args: { p_doctor_id: string; p_user_id: string }
        Returns: boolean
      }
      escape_like: { Args: { "": string }; Returns: string }
      get_auth_uid: { Args: never; Returns: string }
      get_available_slots: {
        Args: { p_date: string; p_doctor_id: string }
        Returns: {
          is_booked: boolean
          slot_time: string
        }[]
      }
      get_doctor_queue: {
        Args: { p_date: string; p_doctor_id: string }
        Returns: {
          appointment_id: string
          appointment_time: string
          patient_name: string
          queue_position: number
          status: string
          token_number: number
          token_type: string
        }[]
      }
      get_doctor_statistics: {
        Args: { p_doctor_id: string }
        Returns: {
          average_rating: number
          cancelled_appointments: number
          completed_appointments: number
          total_appointments: number
        }[]
      }
      get_next_token_number: {
        Args: { p_date: string; p_doctor_id: string }
        Returns: number
      }
      get_revenue_summary: {
        Args: { p_date?: string }
        Returns: {
          normal_tokens: number
          overall_revenue: number
          priority_tokens: number
          total_consultation_income: number
          total_patients: number
          total_priority_income: number
        }[]
      }
      get_upcoming_followups: {
        Args: { p_days?: number }
        Returns: {
          appointment_id: string
          consultation_notes: string
          doctor_name: string
          follow_up_date: string
          patient_name: string
        }[]
      }
      get_user_has_appointment: {
        Args: { p_doctor: string; p_user: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_doctor_for: {
        Args: { p_doctor_id: string }
        Returns: boolean
      }
      is_doctor_for_appointment: {
        Args: { doctor_id: string }
        Returns: boolean
      }
      search_doctors: {
        Args: {
          hospital_id_filter?: string
          limit_count?: number
          offset_count?: number
          search_text?: string
          specialization_filter?: string
        }
        Returns: {
          availability_status: string
          consultation_fee: number
          experience: number
          hospital_id: string
          id: string
          name: string
          photo: string
          qualification: string
          rating: number
          specialization: string
          total_reviews: number
        }[]
      }
      search_hospitals: {
        Args: {
          city_filter?: string
          limit_count?: number
          offset_count?: number
          search_text?: string
          specialty_filter?: string
        }
        Returns: {
          address: string
          city: string
          facilities: string[]
          id: string
          images: string[]
          latitude: number
          longitude: number
          name: string
          phone: string
          rating: number
          specialties: string[]
          state: string
          total_reviews: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "patient"],
    },
  },
} as const
