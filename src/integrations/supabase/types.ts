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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      claims: {
        Row: {
          approved_at: string | null
          baseline_earnings: number | null
          created_at: string
          disruption_id: string | null
          explainer_text: string | null
          fraud_flag: boolean | null
          id: string
          payout_amount: number | null
          protection_percentage: number | null
          status: string | null
          worker_id: string
        }
        Insert: {
          approved_at?: string | null
          baseline_earnings?: number | null
          created_at?: string
          disruption_id?: string | null
          explainer_text?: string | null
          fraud_flag?: boolean | null
          id?: string
          payout_amount?: number | null
          protection_percentage?: number | null
          status?: string | null
          worker_id: string
        }
        Update: {
          approved_at?: string | null
          baseline_earnings?: number | null
          created_at?: string
          disruption_id?: string | null
          explainer_text?: string | null
          fraud_flag?: boolean | null
          id?: string
          payout_amount?: number | null
          protection_percentage?: number | null
          status?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_disruption_id_fkey"
            columns: ["disruption_id"]
            isOneToOne: false
            referencedRelation: "disruptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      disruptions: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          pincode: string | null
          reading: string | null
          severity: string | null
          status: string | null
          threshold: string | null
          triggered_at: string | null
          type: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          pincode?: string | null
          reading?: string | null
          severity?: string | null
          status?: string | null
          threshold?: string | null
          triggered_at?: string | null
          type: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          pincode?: string | null
          reading?: string | null
          severity?: string | null
          status?: string | null
          threshold?: string | null
          triggered_at?: string | null
          type?: string
          zone?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          claim_id: string
          created_at: string
          id: string
          status: string | null
          upi_id: string | null
          worker_id: string
        }
        Insert: {
          amount: number
          claim_id: string
          created_at?: string
          id?: string
          status?: string | null
          upi_id?: string | null
          worker_id: string
        }
        Update: {
          amount?: number
          claim_id?: string
          created_at?: string
          id?: string
          status?: string | null
          upi_id?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          max_payout: number
          renewal_date: string | null
          start_date: string
          status: string
          tier: string
          weekly_premium: number
          worker_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          max_payout: number
          renewal_date?: string | null
          start_date?: string
          status?: string
          tier?: string
          weekly_premium: number
          worker_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          max_payout?: number
          renewal_date?: string | null
          start_date?: string
          status?: string
          tier?: string
          weekly_premium?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          city: string | null
          created_at: string
          earnings_baseline: number | null
          id: string
          name: string
          phone: string
          pincode: string | null
          swiggy_id: string | null
          trust_score: number | null
          upi_id: string | null
          zone: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          earnings_baseline?: number | null
          id?: string
          name: string
          phone: string
          pincode?: string | null
          swiggy_id?: string | null
          trust_score?: number | null
          upi_id?: string | null
          zone?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          earnings_baseline?: number | null
          id?: string
          name?: string
          phone?: string
          pincode?: string | null
          swiggy_id?: string | null
          trust_score?: number | null
          upi_id?: string | null
          zone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
