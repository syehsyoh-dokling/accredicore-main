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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      access_audit_logs: {
        Row: {
          access_result: string | null
          additional_context: Json | null
          id: number
          operation: string | null
          table_name: string | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          access_result?: string | null
          additional_context?: Json | null
          id?: never
          operation?: string | null
          table_name?: string | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          access_result?: string | null
          additional_context?: Json | null
          id?: never
          operation?: string | null
          table_name?: string | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      access_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: number
          ip_address: unknown
          is_active: boolean | null
          last_used_at: string | null
          token_hash: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: never
          ip_address?: unknown
          is_active?: boolean | null
          last_used_at?: string | null
          token_hash: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: never
          ip_address?: unknown
          is_active?: boolean | null
          last_used_at?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      accreditation_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      action_plans: {
        Row: {
          created_at: string
          id: number
          incident_id: number
          plan: string
          proposer_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          incident_id: number
          plan: string
          proposer_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          incident_id?: number
          plan?: string
          proposer_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: number
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id: number
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: number
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_progress: {
        Row: {
          completed_at: string | null
          control_id: number
          created_at: string | null
          due_date: string | null
          evidence_files: string[] | null
          facility_id: number
          id: number
          notes: string | null
          progress_percentage: number
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          control_id: number
          created_at?: string | null
          due_date?: string | null
          evidence_files?: string[] | null
          facility_id: number
          id?: never
          notes?: string | null
          progress_percentage?: number
          started_at?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          control_id?: number
          created_at?: string | null
          due_date?: string | null
          evidence_files?: string[] | null
          facility_id?: number
          id?: never
          notes?: string | null
          progress_percentage?: number
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_progress_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_progress_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls_matrix_view"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_schedules: {
        Row: {
          assigned_to: string | null
          audit_type: string
          auditor_company: string | null
          auditor_name: string | null
          created_at: string
          created_by: string
          department: string
          description: string | null
          duration_days: number | null
          id: string
          priority: string
          scheduled_date: string
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          audit_type: string
          auditor_company?: string | null
          auditor_name?: string | null
          created_at?: string
          created_by: string
          department: string
          description?: string | null
          duration_days?: number | null
          id?: string
          priority?: string
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          audit_type?: string
          auditor_company?: string | null
          auditor_name?: string | null
          created_at?: string
          created_by?: string
          department?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          priority?: string
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_schedules_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          accreditation_type_id: number
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          accreditation_type_id: number
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          accreditation_type_id?: number
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_accreditation_type_id_fkey"
            columns: ["accreditation_type_id"]
            isOneToOne: false
            referencedRelation: "accreditation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          category_id: number
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          category_id: number
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
        }
        Update: {
          category_id?: number
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_records: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          policy_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          policy_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          policy_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_records_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_records_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      control_policies: {
        Row: {
          control_id: number
          created_at: string | null
          id: number
          policy_id: string
        }
        Insert: {
          control_id: number
          created_at?: string | null
          id?: never
          policy_id: string
        }
        Update: {
          control_id?: number
          created_at?: string | null
          id?: never
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "control_policies_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_policies_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls_matrix_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_policies_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      controls: {
        Row: {
          category: string | null
          compliance_standards: string[] | null
          control_number: string
          created_at: string | null
          description: string | null
          domain: string
          embedding: string | null
          id: number
          risk_level: string | null
          sub_category: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          compliance_standards?: string[] | null
          control_number: string
          created_at?: string | null
          description?: string | null
          domain: string
          embedding?: string | null
          id?: never
          risk_level?: string | null
          sub_category?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          compliance_standards?: string[] | null
          control_number?: string
          created_at?: string | null
          description?: string | null
          domain?: string
          embedding?: string | null
          id?: never
          risk_level?: string | null
          sub_category?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      docker_images: {
        Row: {
          created_at: string
          description: string | null
          digest: string
          id: string
          layers: number | null
          name: string
          owner_id: string
          size_bytes: number | null
          tag: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          digest: string
          id?: string
          layers?: number | null
          name: string
          owner_id: string
          size_bytes?: number | null
          tag: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          digest?: string
          id?: string
          layers?: number | null
          name?: string
          owner_id?: string
          size_bytes?: number | null
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      docker_layers: {
        Row: {
          created_at: string
          digest: string
          id: string
          image_id: string
          size_bytes: number
        }
        Insert: {
          created_at?: string
          digest: string
          id?: string
          image_id: string
          size_bytes: number
        }
        Update: {
          created_at?: string
          digest?: string
          id?: string
          image_id?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "docker_layers_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "docker_images"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean
          mime_type: string
          original_filename: string
          storage_bucket: string
          tags: string[] | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          mime_type: string
          original_filename: string
          storage_bucket?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          mime_type?: string
          original_filename?: string
          storage_bucket?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      facilities: {
        Row: {
          created_at: string | null
          department_id: number | null
          description: string | null
          id: number
          is_active: boolean | null
          location: string | null
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: number | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          location?: string | null
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: number | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          location?: string | null
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_plans: {
        Row: {
          action_items: Json | null
          actual_completion_date: string | null
          assigned_to: string | null
          budget_allocated: number | null
          budget_spent: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          incident_id: number | null
          notes: string | null
          priority: string
          root_cause_id: string | null
          status: string
          success_metrics: Json | null
          target_completion_date: string | null
          team_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          actual_completion_date?: string | null
          assigned_to?: string | null
          budget_allocated?: number | null
          budget_spent?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          incident_id?: number | null
          notes?: string | null
          priority?: string
          root_cause_id?: string | null
          status?: string
          success_metrics?: Json | null
          target_completion_date?: string | null
          team_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          actual_completion_date?: string | null
          assigned_to?: string | null
          budget_allocated?: number | null
          budget_spent?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          incident_id?: number | null
          notes?: string | null
          priority?: string
          root_cause_id?: string | null
          status?: string
          success_metrics?: Json | null
          target_completion_date?: string | null
          team_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_plans_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_plans_root_cause_id_fkey"
            columns: ["root_cause_id"]
            isOneToOne: false
            referencedRelation: "root_cause_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assigned_team_id: number | null
          assigned_user_id: string | null
          id: number
          incident_id: number
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assigned_team_id?: number | null
          assigned_user_id?: string | null
          id?: never
          incident_id: number
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assigned_team_id?: number | null
          assigned_user_id?: string | null
          id?: never
          incident_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "incident_assignments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_user_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: number
          priority: string | null
          status: string
          team_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: never
          priority?: string | null
          status?: string
          team_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: never
          priority?: string | null
          status?: string
          team_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      investigation_notes: {
        Row: {
          author_id: string
          created_at: string
          id: number
          incident_id: number
          note: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: never
          incident_id: number
          note: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: never
          incident_id?: number
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_notes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          ip_address: unknown
          is_active: boolean | null
          last_used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          ip_address: unknown
          is_active?: boolean | null
          last_used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          ip_address?: unknown
          is_active?: boolean | null
          last_used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mfa_configurations: {
        Row: {
          backup_codes: string[] | null
          failed_attempts: number | null
          is_mfa_enabled: boolean | null
          last_mfa_challenge_time: string | null
          lockout_until: string | null
          mfa_method: string | null
          totp_secret: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          failed_attempts?: number | null
          is_mfa_enabled?: boolean | null
          last_mfa_challenge_time?: string | null
          lockout_until?: string | null
          mfa_method?: string | null
          totp_secret?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          failed_attempts?: number | null
          is_mfa_enabled?: boolean | null
          last_mfa_challenge_time?: string | null
          lockout_until?: string | null
          mfa_method?: string | null
          totp_secret?: string | null
          user_id?: string
        }
        Relationships: []
      }
      national_standards_access: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          page_key: string
          role: Database["public"]["Enums"]["national_standards_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          page_key?: string
          role?: Database["public"]["Enums"]["national_standards_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          page_key?: string
          role?: Database["public"]["Enums"]["national_standards_role"]
          user_id?: string
        }
        Relationships: []
      }
      national_standards_project_settings: {
        Row: {
          boolean_value: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_sensitive: boolean | null
          json_value: Json | null
          number_value: number | null
          setting_key: string
          setting_type: Database["public"]["Enums"]["project_setting_type"]
          string_value: string | null
          updated_at: string | null
          updated_by: string | null
          value_type: Database["public"]["Enums"]["setting_value_type"]
        }
        Insert: {
          boolean_value?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_sensitive?: boolean | null
          json_value?: Json | null
          number_value?: number | null
          setting_key: string
          setting_type: Database["public"]["Enums"]["project_setting_type"]
          string_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value_type: Database["public"]["Enums"]["setting_value_type"]
        }
        Update: {
          boolean_value?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_sensitive?: boolean | null
          json_value?: Json | null
          number_value?: number | null
          setting_key?: string
          setting_type?: Database["public"]["Enums"]["project_setting_type"]
          string_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value_type?: Database["public"]["Enums"]["setting_value_type"]
        }
        Relationships: []
      }
      national_standards_settings_audit_log: {
        Row: {
          action: string
          action_timestamp: string | null
          actor_id: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          reason: string | null
          setting_key: string
        }
        Insert: {
          action: string
          action_timestamp?: string | null
          actor_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          setting_key: string
        }
        Update: {
          action?: string
          action_timestamp?: string | null
          actor_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          setting_key?: string
        }
        Relationships: []
      }
      national_standards_user_management_log: {
        Row: {
          action: string
          action_timestamp: string | null
          actor_id: string | null
          id: string
          new_role:
            | Database["public"]["Enums"]["national_standards_role"]
            | null
          previous_role:
            | Database["public"]["Enums"]["national_standards_role"]
            | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          action_timestamp?: string | null
          actor_id?: string | null
          id?: string
          new_role?:
            | Database["public"]["Enums"]["national_standards_role"]
            | null
          previous_role?:
            | Database["public"]["Enums"]["national_standards_role"]
            | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          action_timestamp?: string | null
          actor_id?: string | null
          id?: string
          new_role?:
            | Database["public"]["Enums"]["national_standards_role"]
            | null
          previous_role?:
            | Database["public"]["Enums"]["national_standards_role"]
            | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          email_enabled: boolean | null
          push_enabled: boolean | null
          sms_enabled: boolean | null
          type_id: number
          user_id: string
        }
        Insert: {
          email_enabled?: boolean | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          type_id: number
          user_id: string
        }
        Update: {
          email_enabled?: boolean | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          type_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_types: {
        Row: {
          description: string | null
          display_name: string
          id: number
          type_key: string
        }
        Insert: {
          description?: string | null
          display_name: string
          id?: never
          type_key: string
        }
        Update: {
          description?: string | null
          display_name?: string
          id?: never
          type_key?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: number
          is_read: boolean | null
          message: string
          metadata: Json | null
          type_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: never
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          type_id?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: never
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          type_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      page_translations: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          language: Database["public"]["Enums"]["user_language"]
          metadata: Json | null
          page_key: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          language: Database["public"]["Enums"]["user_language"]
          metadata?: Json | null
          page_key: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          language?: Database["public"]["Enums"]["user_language"]
          metadata?: Json | null
          page_key?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies_files: {
        Row: {
          accreditation_type_id: number | null
          category_id: number | null
          chapter_id: number | null
          created_at: string | null
          file_name: string
          id: number
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          accreditation_type_id?: number | null
          category_id?: number | null
          chapter_id?: number | null
          created_at?: string | null
          file_name: string
          id?: never
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          accreditation_type_id?: number | null
          category_id?: number | null
          chapter_id?: number | null
          created_at?: string | null
          file_name?: string
          id?: never
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_files_accreditation_type_id_fkey"
            columns: ["accreditation_type_id"]
            isOneToOne: false
            referencedRelation: "accreditation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_files_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_files_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_manual_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string | null
          change_notes: string | null
          completed_at: string | null
          created_at: string
          due_date: string | null
          file_path: string | null
          file_size: number | null
          id: string
          original_filename: string | null
          policy_content: string
          policy_id: string
          policy_title: string
          priority: string
          section: string
          status: string
          task_description: string | null
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to?: string | null
          change_notes?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          original_filename?: string | null
          policy_content?: string
          policy_id: string
          policy_title: string
          priority?: string
          section?: string
          status?: string
          task_description?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string | null
          change_notes?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          original_filename?: string | null
          policy_content?: string
          policy_id?: string
          policy_title?: string
          priority?: string
          section?: string
          status?: string
          task_description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      policy_templates: {
        Row: {
          category: string
          content: string
          content_ar: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          mime_type: string | null
          original_filename: string | null
          storage_bucket: string | null
          tags: string[] | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          original_filename?: string | null
          storage_bucket?: string | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          original_filename?: string | null
          storage_bucket?: string | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: number | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          last_login: string | null
          password_reset_required: boolean | null
          phone: string | null
          preferred_language:
            | Database["public"]["Enums"]["user_language"]
            | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: number | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          job_title?: string | null
          last_login?: string | null
          password_reset_required?: boolean | null
          phone?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["user_language"]
            | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: number | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          last_login?: string | null
          password_reset_required?: boolean | null
          phone?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["user_language"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      project_quality_plan: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          details: Json | null
          id: string
          order_index: number
          team_id: number | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          details?: Json | null
          id?: string
          order_index?: number
          team_id?: number | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          details?: Json | null
          id?: string
          order_index?: number
          team_id?: number | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_quality_plan_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          description_ar: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_active: boolean
          language: string
          mime_type: string | null
          organization: string
          original_filename: string | null
          publication_date: string | null
          storage_bucket: string | null
          tags: string[] | null
          title: string
          title_ar: string | null
          type: string
          updated_at: string
          url: string | null
          version: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          description_ar?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          language?: string
          mime_type?: string | null
          organization: string
          original_filename?: string | null
          publication_date?: string | null
          storage_bucket?: string | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          type: string
          updated_at?: string
          url?: string | null
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          description_ar?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          language?: string
          mime_type?: string | null
          organization?: string
          original_filename?: string | null
          publication_date?: string | null
          storage_bucket?: string | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          type?: string
          updated_at?: string
          url?: string | null
          version?: string | null
        }
        Relationships: []
      }
      root_cause_analyses: {
        Row: {
          completed_at: string | null
          contributing_factors: Json | null
          created_at: string
          created_by: string
          id: string
          incident_id: number | null
          notes: string | null
          priority: string
          problem: string
          root_causes: Json | null
          status: string
          team_id: number | null
          title: string
          updated_at: string
          why_analysis: Json | null
        }
        Insert: {
          completed_at?: string | null
          contributing_factors?: Json | null
          created_at?: string
          created_by: string
          id?: string
          incident_id?: number | null
          notes?: string | null
          priority?: string
          problem: string
          root_causes?: Json | null
          status?: string
          team_id?: number | null
          title: string
          updated_at?: string
          why_analysis?: Json | null
        }
        Update: {
          completed_at?: string | null
          contributing_factors?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          incident_id?: number | null
          notes?: string | null
          priority?: string
          problem?: string
          root_causes?: Json | null
          status?: string
          team_id?: number | null
          title?: string
          updated_at?: string
          why_analysis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "root_cause_analyses_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "root_cause_analyses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_progress: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          progress_percentage: number
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          progress_percentage?: number
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          progress_percentage?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          team_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          team_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          team_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      "Team Members Table": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      "Team Table": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          joined_at: string | null
          permissions: string[] | null
          role: string
          team_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: string[] | null
          role: string
          team_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: string[] | null
          role?: string
          team_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          description_ar: string | null
          id: number
          is_active: boolean | null
          name: string
          name_ar: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          description_ar?: string | null
          id?: never
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          description_ar?: string | null
          id?: never
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_page_preferences: {
        Row: {
          created_at: string | null
          id: string
          page_key: string
          preferred_language:
            | Database["public"]["Enums"]["user_language"]
            | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_key: string
          preferred_language?:
            | Database["public"]["Enums"]["user_language"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_key?: string
          preferred_language?:
            | Database["public"]["Enums"]["user_language"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      controls_matrix_view: {
        Row: {
          category: string | null
          compliance_standards: string[] | null
          control_number: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          embedding: string | null
          id: number | null
          risk_level: string | null
          sub_category: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          compliance_standards?: string[] | null
          control_number?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          embedding?: string | null
          id?: number | null
          risk_level?: string | null
          sub_category?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          compliance_standards?: string[] | null
          control_number?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          embedding?: string | null
          id?: number | null
          risk_level?: string | null
          sub_category?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _is_project_member_by_team: {
        Args: { p_team_id: number }
        Returns: boolean
      }
      add_ip_to_whitelist: {
        Args: {
          p_description?: string
          p_ip_address: unknown
          p_user_id: string
        }
        Returns: undefined
      }
      add_national_standards_user: {
        Args: {
          p_role: Database["public"]["Enums"]["national_standards_role"]
          p_target_user_id: string
        }
        Returns: {
          message: string
          status: string
        }[]
      }
      advanced_audit_progress_filter: {
        Args: { p_filters?: Json }
        Returns: {
          completed_at: string
          control_id: number
          due_date: string
          facility_id: number
          id: number
          progress_percentage: number
          status: string
        }[]
      }
      assign_team_role: {
        Args: { p_role_key: string; p_team_id: number; p_user_id: string }
        Returns: {
          message: string
          status: string
        }[]
      }
      delete_national_standards_setting: {
        Args: { p_setting_key: string }
        Returns: {
          message: string
          status: string
        }[]
      }
      generate_access_token: {
        Args: {
          p_duration?: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      generate_backup_codes: { Args: { p_user_id: string }; Returns: string[] }
      generate_totp_secret: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_department_compliance_summary: {
        Args: { dept_id?: number }
        Returns: {
          completed_controls: number
          compliance_percentage: number
          department_name: string
          in_progress_controls: number
          not_started_controls: number
          total_controls: number
        }[]
      }
      get_facility_compliance: {
        Args: { facility_id: number }
        Returns: number
      }
      get_page_translation: {
        Args: {
          p_language?: Database["public"]["Enums"]["user_language"]
          p_page_key: string
        }
        Returns: {
          content: string
          metadata: Json
          title: string
        }[]
      }
      get_user_teams:
        | {
            Args: never
            Returns: {
              team_id: number
              team_name: string
            }[]
          }
        | {
            Args: { user_id: string }
            Returns: {
              member_count: number
              team_description: string
              team_id: number
              team_name: string
              user_role: string
            }[]
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ip_whitelisted: {
        Args: { p_ip_address: unknown; p_user_id: string }
        Returns: boolean
      }
      is_member_of_team: {
        Args: { p_team_id: number; p_user_id?: string }
        Returns: boolean
      }
      log_access_attempt: {
        Args: {
          p_access_result: string
          p_additional_context?: Json
          p_operation: string
          p_table_name: string
          p_user_id: string
        }
        Returns: undefined
      }
      map_app_role_to_role_key: {
        Args: { p_app_role: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      migrate_team_memberships_to_role_system: {
        Args: never
        Returns: {
          message: string
          records_processed: number
          status: string
        }[]
      }
      migrate_user_roles_to_role_management: {
        Args: never
        Returns: {
          message: string
          records_processed: number
          status: string
        }[]
      }
      remove_national_standards_user: {
        Args: { p_target_user_id: string }
        Returns: {
          message: string
          status: string
        }[]
      }
      secure_authenticate: {
        Args: {
          p_email: string
          p_ip_address?: unknown
          p_mfa_token?: string
          p_password: string
        }
        Returns: string
      }
      send_notification:
        | { Args: never; Returns: undefined }
        | {
            Args: { p_message: string; p_type_name?: string; p_user_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_expires_at?: string
              p_message: string
              p_metadata?: Json
              p_type_key: string
              p_user_id: string
            }
            Returns: number
          }
      update_audit_progress:
        | {
            Args: {
              p_control_id: number
              p_facility_id: number
              p_notes?: string
              p_progress_percentage: number
              p_status: string
              p_user_id: string
            }
            Returns: {
              id: number
              progress_percentage: number
              status: string
            }[]
          }
        | {
            Args: {
              p_due_date: string
              p_id: number
              p_notes: string
              p_status: string
            }
            Returns: {
              due_date: string
              id: number
              notes: string
              status: string
              updated_at: string
            }[]
          }
      update_policy_to_use_role_management: {
        Args: {
          p_new_check: string
          p_old_check: string
          p_policy_name: string
          p_table_name: string
        }
        Returns: {
          message: string
          status: string
        }[]
      }
      upsert_national_standards_setting: {
        Args: {
          p_boolean_value?: boolean
          p_description?: string
          p_is_sensitive?: boolean
          p_json_value?: Json
          p_number_value?: number
          p_setting_key: string
          p_setting_type: Database["public"]["Enums"]["project_setting_type"]
          p_string_value?: string
          p_value_type: Database["public"]["Enums"]["setting_value_type"]
        }
        Returns: {
          message: string
          status: string
        }[]
      }
      validate_access_token: {
        Args: { p_ip_address?: unknown; p_token: string }
        Returns: string
      }
      verify_mfa_token: {
        Args: { p_method?: string; p_token: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "system_admin"
        | "super_user"
        | "admin"
        | "user"
        | "team"
        | "client"
        | "developer"
      national_standards_role:
        | "viewer"
        | "editor"
        | "creator"
        | "approver"
        | "admin"
      project_setting_type:
        | "general"
        | "compliance"
        | "workflow"
        | "notification"
        | "integration"
        | "security"
      setting_value_type: "string" | "number" | "boolean" | "json"
      user_language: "en" | "ar" | "fr" | "es" | "de"
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
      app_role: [
        "system_admin",
        "super_user",
        "admin",
        "user",
        "team",
        "client",
        "developer",
      ],
      national_standards_role: [
        "viewer",
        "editor",
        "creator",
        "approver",
        "admin",
      ],
      project_setting_type: [
        "general",
        "compliance",
        "workflow",
        "notification",
        "integration",
        "security",
      ],
      setting_value_type: ["string", "number", "boolean", "json"],
      user_language: ["en", "ar", "fr", "es", "de"],
    },
  },
} as const
