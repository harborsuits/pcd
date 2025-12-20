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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          project_id: string
          project_token: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          project_id: string
          project_token: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          project_id?: string
          project_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      demos: {
        Row: {
          content: Json
          created_at: string
          id: string
          project_id: string
          project_token: string
          template_type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          project_id: string
          project_token: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          project_id?: string
          project_token?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_type: string
          id: string
          project_id: string
          project_token: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_type: string
          id?: string
          project_id: string
          project_token: string
          storage_path: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string
          id?: string
          project_id?: string
          project_token?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_outreach_events: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          id: string
          lead_id: string
          message: string | null
          provider_message_id: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id: string
          message?: string | null
          provider_message_id?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string
          message?: string | null
          provider_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_outreach_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_search_runs: {
        Row: {
          created_at: string
          id: string
          location_text: string
          provider: string | null
          query_term: string
          radius_m: number
          raw_meta: Json | null
          results_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_text: string
          provider?: string | null
          query_term: string
          radius_m: number
          raw_meta?: Json | null
          results_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          location_text?: string
          provider?: string | null
          query_term?: string
          radius_m?: number
          raw_meta?: Json | null
          results_count?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          business_name: string
          category: string | null
          created_at: string
          demo_project_id: string | null
          demo_status: string | null
          demo_token: string | null
          demo_url: string | null
          id: string
          lat: number | null
          lead_reasons: Json | null
          lead_score: number | null
          lng: number | null
          location_text: string | null
          outreach_status: string | null
          phone: string | null
          place_id: string
          query_term: string | null
          radius_m: number | null
          source: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          category?: string | null
          created_at?: string
          demo_project_id?: string | null
          demo_status?: string | null
          demo_token?: string | null
          demo_url?: string | null
          id?: string
          lat?: number | null
          lead_reasons?: Json | null
          lead_score?: number | null
          lng?: number | null
          location_text?: string | null
          outreach_status?: string | null
          phone?: string | null
          place_id: string
          query_term?: string | null
          radius_m?: number | null
          source?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          category?: string | null
          created_at?: string
          demo_project_id?: string | null
          demo_status?: string | null
          demo_token?: string | null
          demo_url?: string | null
          id?: string
          lat?: number | null
          lead_reasons?: Json | null
          lead_score?: number | null
          lng?: number | null
          location_text?: string | null
          outreach_status?: string | null
          phone?: string | null
          place_id?: string
          query_term?: string | null
          radius_m?: number | null
          source?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          project_token: string
          read_at: string | null
          sender_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          project_token: string
          read_at?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          project_token?: string
          read_at?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_events: {
        Row: {
          channel: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          project_id: string
          project_token: string
          recipient: string
          template_used: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          project_id: string
          project_token: string
          recipient: string
          template_used?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          project_token?: string
          recipient?: string
          template_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_suppressions: {
        Row: {
          created_at: string
          id: string
          phone: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
          reason?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          payment_type: string
          project_id: string
          project_token: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_event_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          payment_type: string
          project_id: string
          project_token: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_event_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          payment_type?: string
          project_id?: string
          project_token?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_event_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          business_name: string
          business_slug: string
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          project_token: string
          source: string
          state: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_slug: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          project_token: string
          source?: string
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_slug?: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          project_token?: string
          source?: string
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_inbox_v1: {
        Args: never
        Returns: {
          business_name: string
          last_message_content: string
          last_message_created_at: string
          last_message_sender_type: string
          project_id: string
          project_token: string
          status: string
          unread_count: number
        }[]
      }
    }
    Enums: {
      project_status:
        | "lead"
        | "contacted"
        | "interested"
        | "client"
        | "completed"
        | "archived"
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
      project_status: [
        "lead",
        "contacted",
        "interested",
        "client",
        "completed",
        "archived",
      ],
    },
  },
} as const
