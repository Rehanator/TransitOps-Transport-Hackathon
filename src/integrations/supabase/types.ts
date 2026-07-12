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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      fuel_logs: {
        Row: {
          created_at: string
          driver_email: string | null
          driver_id: string
          id: string
          liters: number
          media_url: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: Database["public"]["Enums"]["fuel_log_status"]
          total_cost: number
          updated_at: string
          vehicle_id: string | null
          vehicle_registration: string | null
        }
        Insert: {
          created_at?: string
          driver_email?: string | null
          driver_id: string
          id?: string
          liters: number
          media_url?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["fuel_log_status"]
          total_cost: number
          updated_at?: string
          vehicle_id?: string | null
          vehicle_registration?: string | null
        }
        Update: {
          created_at?: string
          driver_email?: string | null
          driver_id?: string
          id?: string
          liters?: number
          media_url?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: Database["public"]["Enums"]["fuel_log_status"]
          total_cost?: number
          updated_at?: string
          vehicle_id?: string | null
          vehicle_registration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clerk_user_id: string
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          email?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          lifetime_odometer: number
          max_capacity: number
          model: string
          registration_number: string
          status: Database["public"]["Enums"]["vehicle_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_odometer?: number
          max_capacity?: number
          model: string
          registration_number: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_odometer?: number
          max_capacity?: number
          model?: string
          registration_number?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_fuel_log: {
        Args: {
          _driver_email: string
          _driver_id: string
          _liters: number
          _media_url: string
          _notes: string
          _total_cost: number
          _vehicle_id: string
          _vehicle_registration: string
        }
        Returns: {
          created_at: string
          driver_email: string | null
          driver_id: string
          id: string
          liters: number
          media_url: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: Database["public"]["Enums"]["fuel_log_status"]
          total_cost: number
          updated_at: string
          vehicle_id: string | null
          vehicle_registration: string | null
        }
        SetofOptions: {
          from: "*"
          to: "fuel_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_roles: {
        Args: { _clerk_user_id: string; _email?: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      list_fuel_logs: {
        Args: { _driver_id?: string; _status?: string }
        Returns: {
          created_at: string
          driver_email: string | null
          driver_id: string
          id: string
          liters: number
          media_url: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: Database["public"]["Enums"]["fuel_log_status"]
          total_cost: number
          updated_at: string
          vehicle_id: string | null
          vehicle_registration: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "fuel_logs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      review_fuel_log: {
        Args: {
          _approve: boolean
          _id: string
          _note?: string
          _reviewer_id: string
        }
        Returns: {
          created_at: string
          driver_email: string | null
          driver_id: string
          id: string
          liters: number
          media_url: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: Database["public"]["Enums"]["fuel_log_status"]
          total_cost: number
          updated_at: string
          vehicle_id: string | null
          vehicle_registration: string | null
        }
        SetofOptions: {
          from: "*"
          to: "fuel_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sum_approved_fuel_cost: { Args: { _vehicle_id: string }; Returns: number }
    }
    Enums: {
      app_role: "Fleet Manager" | "Driver"
      fuel_log_status: "Pending" | "Approved" | "Rejected"
      vehicle_status: "Available" | "On Trip" | "In Shop"
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
      app_role: ["Fleet Manager", "Driver"],
      fuel_log_status: ["Pending", "Approved", "Rejected"],
      vehicle_status: ["Available", "On Trip", "In Shop"],
    },
  },
} as const
