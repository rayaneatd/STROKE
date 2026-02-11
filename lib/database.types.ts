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
            candidates: {
                Row: {
                    candidate_name: string | null
                    email_draft: string | null
                    email_sent_at: string | null
                    exported_by: string[] | null
                    id: string
                    name: string
                    project_id: string
                    score: number | null
                    size: string | null
                    status: string | null
                    uploaded_at: string | null
                    uploaded_by: string | null
                    viewed_by: string[] | null
                }
                Insert: {
                    candidate_name?: string | null
                    email_draft?: string | null
                    email_sent_at?: string | null
                    exported_by?: string[] | null
                    id?: string
                    name: string
                    project_id: string
                    score?: number | null
                    size?: string | null
                    status?: string | null
                    uploaded_at?: string | null
                    uploaded_by?: string | null
                    viewed_by?: string[] | null
                }
                Update: {
                    candidate_name?: string | null
                    email_draft?: string | null
                    email_sent_at?: string | null
                    exported_by?: string[] | null
                    id?: string
                    name?: string
                    project_id?: string
                    score?: number | null
                    size?: string | null
                    status?: string | null
                    uploaded_at?: string | null
                    uploaded_by?: string | null
                    viewed_by?: string[] | null
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
            profiles: {
                Row: {
                    avatar_url: string | null
                    billing_type: string | null
                    company: string | null
                    display_name: string | null
                    email: string
                    id: string
                    industry: string | null
                    overage_cap: number | null
                    phone_number: string | null
                    preferences: Json | null
                    purchased_scans: number | null
                    role: string | null
                    scans_balance: number | null
                    signup_date: string | null
                    subscription_plan: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    billing_type?: string | null
                    company?: string | null
                    display_name?: string | null
                    email: string
                    id: string
                    industry?: string | null
                    overage_cap?: number | null
                    phone_number?: string | null
                    preferences?: Json | null
                    purchased_scans?: number | null
                    role?: string | null
                    scans_balance?: number | null
                    signup_date?: string | null
                    subscription_plan?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    billing_type?: string | null
                    company?: string | null
                    display_name?: string | null
                    email?: string
                    id?: string
                    industry?: string | null
                    overage_cap?: number | null
                    phone_number?: string | null
                    preferences?: Json | null
                    purchased_scans?: number | null
                    role?: string | null
                    scans_balance?: number | null
                    signup_date?: string | null
                    subscription_plan?: string | null
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
                    created_at: string | null
                    description: string | null
                    id: string
                    investment_balance: number | null
                    owner_id: string
                    settings: Json | null
                    status: string | null
                    title: string
                    total_invested: number | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    investment_balance?: number | null
                    owner_id: string
                    settings?: Json | null
                    status?: string | null
                    title: string
                    total_invested?: number | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    investment_balance?: number | null
                    owner_id?: string
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
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
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
            get_project_owner_connections: {
                Args: { p_project_id: string }
                Returns: {
                    avatar_url: string | null
                    billing_type: string | null
                    company: string | null
                    display_name: string | null
                    email: string
                    id: string
                    industry: string | null
                    overage_cap: number | null
                    phone_number: string | null
                    preferences: Json | null
                    purchased_scans: number | null
                    role: string | null
                    scans_balance: number | null
                    signup_date: string | null
                    subscription_plan: string | null
                }[]
            }
            mark_candidate_exported: {
                Args: { candidate_id: string; user_id: string }
                Returns: undefined
            }
            mark_candidate_viewed: {
                Args: { candidate_id: string; user_id: string }
                Returns: undefined
            }
            transfer_project_funds: {
                Args: { p_action: string; p_amount: number; p_project_id: string }
                Returns: Json
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
