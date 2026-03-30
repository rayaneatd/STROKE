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
      analytics_events: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          project_id: string
          user_id: string
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          project_id: string
          user_id: string
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      aurinko_work_mails: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string
          id: string
          provider: string | null
          refresh_token: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email: string
          id?: string
          provider?: string | null
          refresh_token?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string
          id?: string
          provider?: string | null
          refresh_token?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aurinko_work_mails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_interview_questions: {
        Row: {
          candidate_id: string
          context: string | null
          created_at: string | null
          created_by: string | null
          id: string
          question: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          question: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          question?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_interview_questions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_interview_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          ai_analysis_version: string | null
          ai_model_used: string | null
          candidate_name: string | null
          career_trajectory: string | null
          current_position: string | null
          email: string | null
          email_draft: string | null
          email_sent_at: string | null
          executive_summary: string | null
          exported_by: string[] | null
          file_hash: string | null
          hidden_gem_reason: string | null
          id: string
          interview_questions: Json | null
          is_favorite: boolean | null
          is_hidden_gem: boolean | null
          key_skills: Json | null
          location: string | null
          match_score: number | null
          missing_skills: Json | null
          original_resume_name: string | null
          phone: string | null
          project_id: string
          recruiter_notes: string | null
          recruiter_override_score: number | null
          red_flags: Json | null
          resume_path: string | null
          scanned_at: string | null
          score_breakdown: Json | null
          score_justification: string | null
          size: string | null
          social_links: Json | null
          soft_skills_analysis: string | null
          status: string | null
          total_tokens_used: number | null
          uploaded_at: string | null
          uploaded_by: string | null
          viewed_by: string[] | null
          years_of_experience: number | null
        }
        Insert: {
          ai_analysis_version?: string | null
          ai_model_used?: string | null
          candidate_name?: string | null
          career_trajectory?: string | null
          current_position?: string | null
          email?: string | null
          email_draft?: string | null
          email_sent_at?: string | null
          executive_summary?: string | null
          exported_by?: string[] | null
          file_hash?: string | null
          hidden_gem_reason?: string | null
          id?: string
          interview_questions?: Json | null
          is_favorite?: boolean | null
          is_hidden_gem?: boolean | null
          key_skills?: Json | null
          location?: string | null
          match_score?: number | null
          missing_skills?: Json | null
          original_resume_name?: string | null
          phone?: string | null
          project_id: string
          recruiter_notes?: string | null
          recruiter_override_score?: number | null
          red_flags?: Json | null
          resume_path?: string | null
          scanned_at?: string | null
          score_breakdown?: Json | null
          score_justification?: string | null
          size?: string | null
          social_links?: Json | null
          soft_skills_analysis?: string | null
          status?: string | null
          total_tokens_used?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          viewed_by?: string[] | null
          years_of_experience?: number | null
        }
        Update: {
          ai_analysis_version?: string | null
          ai_model_used?: string | null
          candidate_name?: string | null
          career_trajectory?: string | null
          current_position?: string | null
          email?: string | null
          email_draft?: string | null
          email_sent_at?: string | null
          executive_summary?: string | null
          exported_by?: string[] | null
          file_hash?: string | null
          hidden_gem_reason?: string | null
          id?: string
          interview_questions?: Json | null
          is_favorite?: boolean | null
          is_hidden_gem?: boolean | null
          key_skills?: Json | null
          location?: string | null
          match_score?: number | null
          missing_skills?: Json | null
          original_resume_name?: string | null
          phone?: string | null
          project_id?: string
          recruiter_notes?: string | null
          recruiter_override_score?: number | null
          red_flags?: Json | null
          resume_path?: string | null
          scanned_at?: string | null
          score_breakdown?: Json | null
          score_justification?: string | null
          size?: string | null
          social_links?: Json | null
          soft_skills_analysis?: string | null
          status?: string | null
          total_tokens_used?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          viewed_by?: string[] | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string | null
          sender_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_members: {
        Row: {
          org_id: string
          user_id: string
        }
        Insert: {
          org_id: string
          user_id: string
        }
        Update: {
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organisation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          org_id: string
          org_name: string
        }
        Insert: {
          org_id?: string
          org_name: string
        }
        Update: {
          org_id?: string
          org_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_type: string | null
          company: string | null
          display_name: string | null
          email: string
          feedback_consent: boolean | null
          id: string
          industry: string | null
          is_owner: boolean | null
          language: string | null
          marketing_consent: boolean | null
          onboarding_status: Json | null
          overage_cap: number | null
          preferences: Json | null
          primary_email: string | null
          purchased_scans: number | null
          role: string | null
          scans_balance: Json | null
          signup_date: string | null
          subscription_plan: string | null
          work_email: string | null
          work_mails: Json
        }
        Insert: {
          avatar_url?: string | null
          billing_type?: string | null
          company?: string | null
          display_name?: string | null
          email: string
          feedback_consent?: boolean | null
          id: string
          industry?: string | null
          is_owner?: boolean | null
          language?: string | null
          marketing_consent?: boolean | null
          onboarding_status?: Json | null
          overage_cap?: number | null
          preferences?: Json | null
          primary_email?: string | null
          purchased_scans?: number | null
          role?: string | null
          scans_balance?: Json | null
          signup_date?: string | null
          subscription_plan?: string | null
          work_email?: string | null
          work_mails?: Json
        }
        Update: {
          avatar_url?: string | null
          billing_type?: string | null
          company?: string | null
          display_name?: string | null
          email?: string
          feedback_consent?: boolean | null
          id?: string
          industry?: string | null
          is_owner?: boolean | null
          language?: string | null
          marketing_consent?: boolean | null
          onboarding_status?: Json | null
          overage_cap?: number | null
          preferences?: Json | null
          primary_email?: string | null
          purchased_scans?: number | null
          role?: string | null
          scans_balance?: Json | null
          signup_date?: string | null
          subscription_plan?: string | null
          work_email?: string | null
          work_mails?: Json
        }
        Relationships: []
      }
      project_members: {
        Row: {
          joined_at: string | null
          permissions: string[] | null
          project_id: string
          role: string | null
          scan_quota: string | null
          scans_used: number | null
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          permissions?: string[] | null
          project_id: string
          role?: string | null
          scan_quota?: string | null
          scans_used?: number | null
          user_id: string
        }
        Update: {
          joined_at?: string | null
          permissions?: string[] | null
          project_id?: string
          role?: string | null
          scan_quota?: string | null
          scans_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          channel: string | null
          content: string
          created_at: string | null
          id: string
          is_encrypted: boolean | null
          project_id: string
          sender_id: string
        }
        Insert: {
          channel?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_encrypted?: boolean | null
          project_id: string
          sender_id: string
        }
        Update: {
          channel?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_encrypted?: boolean | null
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_slots: Json | null
          created_at: string | null
          description: string | null
          id: string
          investment_balance: number | null
          owner_id: string
          scoring_config: Json | null
          settings: Json | null
          status: string | null
          title: string
          total_invested: number | null
        }
        Insert: {
          budget_slots?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          investment_balance?: number | null
          owner_id: string
          scoring_config?: Json | null
          settings?: Json | null
          status?: string | null
          title: string
          total_invested?: number | null
        }
        Update: {
          budget_slots?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          investment_balance?: number | null
          owner_id?: string
          scoring_config?: Json | null
          settings?: Json | null
          status?: string | null
          title?: string
          total_invested?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_texts: {
        Row: {
          created_at: string | null
          file_hash: string
          last_accessed_at: string | null
          raw_text: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          file_hash: string
          last_accessed_at?: string | null
          raw_text?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          file_hash?: string
          last_accessed_at?: string | null
          raw_text?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_availability: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      check_is_project_admin_or_owner: {
        Args: { p_id: string; u_id: string }
        Returns: boolean
      }
      check_is_project_member: {
        Args: { p_id: string; u_id: string }
        Returns: boolean
      }
      check_is_project_owner: {
        Args: { p_id: string; u_id: string }
        Returns: boolean
      }
      create_project_with_funding: {
        Args: {
          p_investment_amount: number
          p_owner_id: string
          p_project_data: Json
        }
        Returns: Json
      }
      deduct_scan_credits: {
        Args: { p_cost: number; p_project_id: string; p_user_id: string }
        Returns: Json
      }
      deduct_scans: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      delete_project_safely: { Args: { p_project_id: string }; Returns: Json }
      extract_org_name: { Args: { email: string }; Returns: string }
      find_profile_by_email: {
        Args: { search_email: string }
        Returns: {
          avatar_url: string
          display_name: string
          email: string
          id: string
        }[]
      }
      get_candidate_drawer_data: {
        Args: { p_candidate_id: string }
        Returns: {
          ai_analysis_version: string
          ai_model_used: string
          candidate_name: string
          career_trajectory: string
          current_position: string
          email: string
          email_draft: string
          email_sent_at: string
          executive_summary: string
          interview_questions: Json
          key_skills: Json
          location: string
          match_score: number
          missing_skills: Json
          original_resume_name: string
          phone: string
          recruiter_notes: string
          recruiter_override_score: number
          red_flags: Json
          resume_path: string
          scanned_at: string
          score_breakdown: Json
          social_links: Json
          soft_skills_analysis: string
          uploaded_at: string
          years_of_experience: number
        }[]
      }
      get_my_org_ids: { Args: never; Returns: string[] }
      get_my_profile: { Args: never; Returns: Json }
      get_project_activity_timeline: {
        Args: { p_project_id: string; p_start_date?: string }
        Returns: {
          added: number
          date: string
          failed: number
          qualified: number
        }[]
      }
      get_project_ai_model: { Args: { p_project_id: string }; Returns: string }
      get_project_candidates: {
        Args: {
          p_filter_activities?: string[]
          p_filter_scores?: string[]
          p_filter_uploaders?: string[]
          p_page_param?: number
          p_page_size?: number
          p_project_id: string
          p_search_query?: string
          p_sort_option?: string
          p_user_id: string
        }
        Returns: {
          ai_analysis_version: string
          ai_model_used: string
          candidate_name: string
          career_trajectory: string
          current_position: string
          email: string
          email_draft: string
          email_sent_at: string
          executive_summary: string
          exported_by: string[]
          full_count: number
          id: string
          interview_questions: Json
          is_favorite: boolean
          key_skills: Json
          location: string
          match_score: number
          missing_skills: Json
          original_resume_name: string
          phone: string
          project_id: string
          rank: number
          recruiter_notes: string
          recruiter_override_score: number
          red_flags: Json
          scanned_at: string
          score_breakdown: Json
          size: string
          social_links: Json
          soft_skills_analysis: string
          status: string
          total_tokens_used: number
          uploaded_at: string
          uploaded_by: string
          viewed_by: string[]
          years_of_experience: number
        }[]
      }
      get_project_failure_distribution: {
        Args: { p_project_id: string; p_start_date?: string }
        Returns: {
          count: number
          reason: string
        }[]
      }
      get_project_owner_ai_tone: {
        Args: { p_project_id: string }
        Returns: string
      }
      get_project_owner_connections: {
        Args: { p_id: string }
        Returns: {
          connection_id: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_user_connections: {
        Args: { p_user_id: string }
        Returns: {
          connection_id: string
          created_at: string
          is_sender: boolean
          other_user_avatar_url: string
          other_user_display_name: string
          other_user_email: string
          other_user_id: string
          other_user_org_names: Json
          status: string
        }[]
      }
      get_user_project: {
        Args: { target_project_id: string; target_user_id: string }
        Returns: {
          created_at: string
          description: string
          id: string
          investment_balance: number
          member_count: number
          members: Json
          owner_id: string
          settings: Json
          status: string
          title: string
          total_invested: number
        }[]
      }
      get_user_projects: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          description: string
          id: string
          investment_balance: number
          member_count: number
          members: Json
          owner_id: string
          settings: Json
          status: string
          title: string
          total_invested: number
        }[]
      }
      get_user_scans_balance: { Args: { p_user_id: string }; Returns: number }
      log_failure_event: {
        Args: {
          p_file_name: string
          p_file_size: number
          p_file_type: string
          p_project_id: string
          p_reason: string
          p_user_id: string
        }
        Returns: boolean
      }
      mark_candidate_exported: {
        Args: { p_candidate_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_candidate_viewed: {
        Args: { p_candidate_id: string; p_user_id: string }
        Returns: undefined
      }
      purchase_credits:
        | { Args: { p_amount: number; p_user_id: string }; Returns: Json }
        | {
            Args: { p_amount: number; p_price?: number; p_user_id: string }
            Returns: Json
          }
      purchase_scans: {
        Args: { p_amount: number; p_price?: number; p_user_id: string }
        Returns: number
      }
      save_candidate_email_draft: {
        Args: { p_candidate_id: string; p_draft: string; p_sent_at?: string }
        Returns: undefined
      }
      share_organisation: { Args: { u1: string; u2: string }; Returns: boolean }
      transfer_project_funds: {
        Args: { p_action: string; p_amount: number; p_project_id: string }
        Returns: Json
      }
      transfer_scans_to_project: {
        Args: { p_amount: number; p_project_id: string; p_user_id: string }
        Returns: number
      }
      transfer_scans_to_user: {
        Args: { p_amount: number; p_project_id: string; p_user_id: string }
        Returns: number
      }
      update_candidate_interview_questions: {
        Args: { p_candidate_id: string; p_questions: Json }
        Returns: undefined
      }
      update_project: {
        Args: {
          p_description?: string
          p_project_id: string
          p_settings?: Json
          p_status?: string
          p_title?: string
        }
        Returns: boolean
      }
      update_project_settings_and_sync_quotas: {
        Args: { p_project_id: string; p_settings: Json }
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          p_avatar_url?: string
          p_billing_type?: string
          p_company?: string
          p_display_name?: string
          p_industry?: string
          p_overage_cap?: number
          p_preferences?: Json
        }
        Returns: boolean
      }
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
