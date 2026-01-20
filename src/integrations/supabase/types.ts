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
      admin_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      alacarte_requests: {
        Row: {
          contact_method: string
          contact_value: string
          created_at: string
          handled_at: string | null
          handled_by: string | null
          has_website: boolean | null
          id: string
          is_existing_client: boolean | null
          note: string | null
          service_key: string
          service_label: string
          status: string
          website_url: string | null
        }
        Insert: {
          contact_method: string
          contact_value: string
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          has_website?: boolean | null
          id?: string
          is_existing_client?: boolean | null
          note?: string | null
          service_key: string
          service_label: string
          status?: string
          website_url?: string | null
        }
        Update: {
          contact_method?: string
          contact_value?: string
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          has_website?: boolean | null
          id?: string
          is_existing_client?: boolean | null
          note?: string | null
          service_key?: string
          service_label?: string
          status?: string
          website_url?: string | null
        }
        Relationships: []
      }
      client_accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      client_leads: {
        Row: {
          business_name: string
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string
          email: string
          email_normalized: string | null
          id: string
          name: string | null
          phone: string | null
          source: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          business_name: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          email: string
          email_normalized?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          business_name?: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          email?: string
          email_normalized?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      comment_versions: {
        Row: {
          author_type: string
          body: string
          change_type: string
          comment_id: string
          created_at: string
          crop_h: number | null
          crop_w: number | null
          crop_x: number | null
          crop_y: number | null
          id: string
          project_token: string
          screenshot_full_path: string | null
          screenshot_h: number | null
          screenshot_path: string | null
          screenshot_w: number | null
          version_number: number
        }
        Insert: {
          author_type: string
          body: string
          change_type?: string
          comment_id: string
          created_at?: string
          crop_h?: number | null
          crop_w?: number | null
          crop_x?: number | null
          crop_y?: number | null
          id?: string
          project_token: string
          screenshot_full_path?: string | null
          screenshot_h?: number | null
          screenshot_path?: string | null
          screenshot_w?: number | null
          version_number?: number
        }
        Update: {
          author_type?: string
          body?: string
          change_type?: string
          comment_id?: string
          created_at?: string
          crop_h?: number | null
          crop_w?: number | null
          crop_x?: number | null
          crop_y?: number | null
          id?: string
          project_token?: string
          screenshot_full_path?: string | null
          screenshot_h?: number | null
          screenshot_path?: string | null
          screenshot_w?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_comment_versions_comment"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "prototype_comments"
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
      email_verifications: {
        Row: {
          attempt_count: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          project_token: string | null
          requester_ip: string | null
          verified_at: string | null
        }
        Insert: {
          attempt_count?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          project_token?: string | null
          requester_ip?: string | null
          verified_at?: string | null
        }
        Update: {
          attempt_count?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          project_token?: string | null
          requester_ip?: string | null
          verified_at?: string | null
        }
        Relationships: []
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
          delivery_error_code: string | null
          delivery_status: string | null
          delivery_status_at: string | null
          direction: string | null
          error: string | null
          id: string
          lead_id: string | null
          message: string | null
          provider_message_id: string | null
          seen_at: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivery_error_code?: string | null
          delivery_status?: string | null
          delivery_status_at?: string | null
          direction?: string | null
          error?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          provider_message_id?: string | null
          seen_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivery_error_code?: string | null
          delivery_status?: string | null
          delivery_status_at?: string | null
          direction?: string | null
          error?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          provider_message_id?: string | null
          seen_at?: string | null
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
          company_blurb: string | null
          created_at: string
          demo_project_id: string | null
          demo_review_notes: string | null
          demo_review_status: string
          demo_reviewed_at: string | null
          demo_status: string | null
          demo_token: string | null
          demo_url: string | null
          id: string
          industry_template: string | null
          lat: number | null
          lead_enriched: Json | null
          lead_reasons: Json | null
          lead_score: number | null
          lng: number | null
          location_text: string | null
          outreach_status: string | null
          phone: string | null
          phone_e164: string | null
          phone_raw: string | null
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
          company_blurb?: string | null
          created_at?: string
          demo_project_id?: string | null
          demo_review_notes?: string | null
          demo_review_status?: string
          demo_reviewed_at?: string | null
          demo_status?: string | null
          demo_token?: string | null
          demo_url?: string | null
          id?: string
          industry_template?: string | null
          lat?: number | null
          lead_enriched?: Json | null
          lead_reasons?: Json | null
          lead_score?: number | null
          lng?: number | null
          location_text?: string | null
          outreach_status?: string | null
          phone?: string | null
          phone_e164?: string | null
          phone_raw?: string | null
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
          company_blurb?: string | null
          created_at?: string
          demo_project_id?: string | null
          demo_review_notes?: string | null
          demo_review_status?: string
          demo_reviewed_at?: string | null
          demo_status?: string | null
          demo_token?: string | null
          demo_url?: string | null
          id?: string
          industry_template?: string | null
          lat?: number | null
          lead_enriched?: Json | null
          lead_reasons?: Json | null
          lead_score?: number | null
          lng?: number | null
          location_text?: string | null
          outreach_status?: string | null
          phone?: string | null
          phone_e164?: string | null
          phone_raw?: string | null
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
          delivered_at: string | null
          id: string
          project_id: string
          project_token: string
          read_at: string | null
          sender_type: string
        }
        Insert: {
          content: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          project_id: string
          project_token: string
          read_at?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          created_at?: string
          delivered_at?: string | null
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
      milestone_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          milestone_id: string
          project_token: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          milestone_id: string
          project_token: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          milestone_id?: string
          project_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_notes_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          project_id: string
          project_token: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          project_id: string
          project_token: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          project_id?: string
          project_token?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          project_id: string
          project_token: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          project_id: string
          project_token: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          project_id?: string
          project_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_notes_project_id_fkey"
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
      project_checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_done: boolean
          label: string
          project_id: string
          project_token: string
          sort_order: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          label: string
          project_id: string
          project_token: string
          sort_order?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_done?: boolean
          label?: string
          project_id?: string
          project_token?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_clients: {
        Row: {
          created_at: string
          email: string
          id: string
          invite_sent_at: string | null
          invite_status: string
          last_login_at: string | null
          name: string | null
          phone: string | null
          project_id: string
          project_token: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invite_sent_at?: string | null
          invite_status?: string
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          project_id: string
          project_token: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invite_sent_at?: string | null
          invite_status?: string
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          project_id?: string
          project_token?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_clients_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_discovery_checklist: {
        Row: {
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          created_at: string
          id: string
          key: string
          label: string
          project_id: string
          project_token: string
        }
        Insert: {
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          key: string
          label: string
          project_id: string
          project_token: string
        }
        Update: {
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          key?: string
          label?: string
          project_id?: string
          project_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_discovery_checklist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          project_token: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          project_token: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          project_token?: string
        }
        Relationships: []
      }
      project_intakes: {
        Row: {
          created_at: string
          id: string
          intake_json: Json
          intake_status: string
          intake_version: number
          owner_user_id: string | null
          phase_b_completed_at: string | null
          phase_b_json: Json | null
          phase_b_status: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intake_json?: Json
          intake_status?: string
          intake_version?: number
          owner_user_id?: string | null
          phase_b_completed_at?: string | null
          phase_b_json?: Json | null
          phase_b_status?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intake_json?: Json
          intake_status?: string
          intake_version?: number
          owner_user_id?: string | null
          phase_b_completed_at?: string | null
          phase_b_json?: Json | null
          phase_b_status?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_intakes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_line_items: {
        Row: {
          accepted_at: string | null
          amount_cents: number
          billing_interval: string | null
          billing_mode: string
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invoiced_at: string | null
          label: string
          notes: string | null
          paid_at: string | null
          project_id: string
          project_token: string
          quantity: number
          status: string
          stripe_invoice_id: string | null
          stripe_invoice_item_id: string | null
          stripe_payment_intent_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amount_cents: number
          billing_interval?: string | null
          billing_mode?: string
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invoiced_at?: string | null
          label: string
          notes?: string | null
          paid_at?: string | null
          project_id: string
          project_token: string
          quantity?: number
          status?: string
          stripe_invoice_id?: string | null
          stripe_invoice_item_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amount_cents?: number
          billing_interval?: string | null
          billing_mode?: string
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invoiced_at?: string | null
          label?: string
          notes?: string | null
          paid_at?: string | null
          project_id?: string
          project_token?: string
          quantity?: number
          status?: string
          stripe_invoice_id?: string | null
          stripe_invoice_item_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_line_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          created_at: string
          filename: string
          id: string
          mime_type: string
          project_id: string
          project_token: string
          size_bytes: number
          storage_path: string
          uploader_type: string
          uploader_user_id: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          mime_type: string
          project_id: string
          project_token: string
          size_bytes: number
          storage_path: string
          uploader_type: string
          uploader_user_id?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string
          project_id?: string
          project_token?: string
          size_bytes?: number
          storage_path?: string
          uploader_type?: string
          uploader_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_client_visible: boolean
          is_done: boolean
          label: string
          project_id: string
          project_token: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_client_visible?: boolean
          is_done?: boolean
          label: string
          project_id: string
          project_token: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_client_visible?: boolean
          is_done?: boolean
          label?: string
          project_id?: string
          project_token?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
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
          ai_trial_ends_at: string | null
          ai_trial_status: string | null
          business_name: string
          business_slug: string
          city: string | null
          claim_code: string | null
          claim_code_created_at: string | null
          claim_code_used_at: string | null
          client_account_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          deposit_amount_cents: number | null
          deposit_status: string | null
          email_verified: boolean
          final_approved_at: string | null
          id: string
          is_ai_trial: boolean | null
          needs_info: boolean | null
          needs_info_items: Json | null
          needs_info_note: string | null
          notes: string | null
          owner_user_id: string | null
          pipeline_stage: string
          portal_stage: string
          portal_stage_changed_at: string | null
          portal_stage_changed_by: string | null
          project_token: string
          selected_tier: string | null
          service_type: string
          source: string
          source_demo_token: string | null
          state: string | null
          status: Database["public"]["Enums"]["project_status"]
          ulio_business_id: string | null
          ulio_setup_url: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          ai_trial_ends_at?: string | null
          ai_trial_status?: string | null
          business_name: string
          business_slug: string
          city?: string | null
          claim_code?: string | null
          claim_code_created_at?: string | null
          claim_code_used_at?: string | null
          client_account_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          deposit_amount_cents?: number | null
          deposit_status?: string | null
          email_verified?: boolean
          final_approved_at?: string | null
          id?: string
          is_ai_trial?: boolean | null
          needs_info?: boolean | null
          needs_info_items?: Json | null
          needs_info_note?: string | null
          notes?: string | null
          owner_user_id?: string | null
          pipeline_stage?: string
          portal_stage?: string
          portal_stage_changed_at?: string | null
          portal_stage_changed_by?: string | null
          project_token: string
          selected_tier?: string | null
          service_type?: string
          source?: string
          source_demo_token?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          ulio_business_id?: string | null
          ulio_setup_url?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          ai_trial_ends_at?: string | null
          ai_trial_status?: string | null
          business_name?: string
          business_slug?: string
          city?: string | null
          claim_code?: string | null
          claim_code_created_at?: string | null
          claim_code_used_at?: string | null
          client_account_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          deposit_amount_cents?: number | null
          deposit_status?: string | null
          email_verified?: boolean
          final_approved_at?: string | null
          id?: string
          is_ai_trial?: boolean | null
          needs_info?: boolean | null
          needs_info_items?: Json | null
          needs_info_note?: string | null
          notes?: string | null
          owner_user_id?: string | null
          pipeline_stage?: string
          portal_stage?: string
          portal_stage_changed_at?: string | null
          portal_stage_changed_by?: string | null
          project_token?: string
          selected_tier?: string | null
          service_type?: string
          source?: string
          source_demo_token?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          ulio_business_id?: string | null
          ulio_setup_url?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      prototype_comment_media: {
        Row: {
          comment_id: string | null
          created_at: string
          filename: string
          id: string
          mime_type: string
          project_token: string
          prototype_id: string | null
          size_bytes: number
          storage_path: string
          uploader_type: string
          uploader_user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          filename: string
          id?: string
          mime_type: string
          project_token: string
          prototype_id?: string | null
          size_bytes: number
          storage_path: string
          uploader_type: string
          uploader_user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string
          project_token?: string
          prototype_id?: string | null
          size_bytes?: number
          storage_path?: string
          uploader_type?: string
          uploader_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prototype_comment_media_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "prototype_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototype_comment_media_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      prototype_comments: {
        Row: {
          anchor_id: string | null
          anchor_selector: string | null
          archived_at: string | null
          author_type: string
          body: string
          breakpoint: string | null
          client_confirmed_at: string | null
          client_confirmed_by: string | null
          created_at: string
          crop_h: number | null
          crop_w: number | null
          crop_x: number | null
          crop_y: number | null
          edited_at: string | null
          id: string
          is_internal: boolean
          is_locked: boolean
          is_relevant: boolean | null
          last_activity_at: string | null
          page_path: string | null
          page_url: string | null
          parent_comment_id: string | null
          pin_x: number | null
          pin_y: number | null
          project_token: string
          prototype_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          screenshot_full_path: string | null
          screenshot_h: number | null
          screenshot_media_id: string | null
          screenshot_path: string | null
          screenshot_w: number | null
          scroll_y: number | null
          source_message_id: string | null
          status: string
          text_context: string | null
          text_hint: string | null
          text_offset: number | null
          thread_root_id: string | null
          version_count: number | null
          viewport_h: number | null
          viewport_w: number | null
          x_pct: number | null
          y_pct: number | null
        }
        Insert: {
          anchor_id?: string | null
          anchor_selector?: string | null
          archived_at?: string | null
          author_type: string
          body: string
          breakpoint?: string | null
          client_confirmed_at?: string | null
          client_confirmed_by?: string | null
          created_at?: string
          crop_h?: number | null
          crop_w?: number | null
          crop_x?: number | null
          crop_y?: number | null
          edited_at?: string | null
          id?: string
          is_internal?: boolean
          is_locked?: boolean
          is_relevant?: boolean | null
          last_activity_at?: string | null
          page_path?: string | null
          page_url?: string | null
          parent_comment_id?: string | null
          pin_x?: number | null
          pin_y?: number | null
          project_token: string
          prototype_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_full_path?: string | null
          screenshot_h?: number | null
          screenshot_media_id?: string | null
          screenshot_path?: string | null
          screenshot_w?: number | null
          scroll_y?: number | null
          source_message_id?: string | null
          status?: string
          text_context?: string | null
          text_hint?: string | null
          text_offset?: number | null
          thread_root_id?: string | null
          version_count?: number | null
          viewport_h?: number | null
          viewport_w?: number | null
          x_pct?: number | null
          y_pct?: number | null
        }
        Update: {
          anchor_id?: string | null
          anchor_selector?: string | null
          archived_at?: string | null
          author_type?: string
          body?: string
          breakpoint?: string | null
          client_confirmed_at?: string | null
          client_confirmed_by?: string | null
          created_at?: string
          crop_h?: number | null
          crop_w?: number | null
          crop_x?: number | null
          crop_y?: number | null
          edited_at?: string | null
          id?: string
          is_internal?: boolean
          is_locked?: boolean
          is_relevant?: boolean | null
          last_activity_at?: string | null
          page_path?: string | null
          page_url?: string | null
          parent_comment_id?: string | null
          pin_x?: number | null
          pin_y?: number | null
          project_token?: string
          prototype_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_full_path?: string | null
          screenshot_h?: number | null
          screenshot_media_id?: string | null
          screenshot_path?: string | null
          screenshot_w?: number | null
          scroll_y?: number | null
          source_message_id?: string | null
          status?: string
          text_context?: string | null
          text_hint?: string | null
          text_offset?: number | null
          thread_root_id?: string | null
          version_count?: number | null
          viewport_h?: number | null
          viewport_w?: number | null
          x_pct?: number | null
          y_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prototype_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "prototype_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototype_comments_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototype_comments_screenshot_media_id_fkey"
            columns: ["screenshot_media_id"]
            isOneToOne: false
            referencedRelation: "prototype_comment_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prototype_comments_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      prototypes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          project_token: string
          status: string
          updated_at: string
          url: string
          version_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          project_token: string
          status?: string
          updated_at?: string
          url: string
          version_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          project_token?: string
          status?: string
          updated_at?: string
          url?: string
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prototypes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          project_token: string
          who: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          project_token: string
          who?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          project_token?: string
          who?: string
        }
        Relationships: []
      }
      review_items: {
        Row: {
          client_notes: string | null
          created_at: string
          description: string | null
          id: string
          item_content: string | null
          item_type: string
          item_url: string | null
          project_id: string
          project_token: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_content?: string | null
          item_type?: string
          item_url?: string | null
          project_id: string
          project_token: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_content?: string | null
          item_type?: string
          item_url?: string | null
          project_id?: string
          project_token?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      thread_reads: {
        Row: {
          created_at: string
          id: string
          last_read_at: string
          project_token: string | null
          thread_root_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_read_at?: string
          project_token?: string | null
          thread_root_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_read_at?: string
          project_token?: string | null
          thread_root_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      user_owns_prototype_comment: {
        Args: { comment_prototype_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "user"
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
      app_role: ["admin", "operator", "user"],
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
