export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    display_name: string | null
                    phone_number: string | null
                    avatar_url: string | null
                    role: string | null
                    subscription_plan: string | null
                    scans_balance: number | null
                    purchased_scans: number | null
                    billing_type: string | null
                    preferences: Json | null
                    signup_date: string | null
                }
                Insert: {
                    id: string
                    email: string
                    display_name?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    role?: string | null
                    subscription_plan?: string | null
                    scans_balance?: number | null
                    purchased_scans?: number | null
                    billing_type?: string | null
                    preferences?: Json | null
                    signup_date?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    display_name?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    role?: string | null
                    subscription_plan?: string | null
                    scans_balance?: number | null
                    purchased_scans?: number | null
                    billing_type?: string | null
                    preferences?: Json | null
                    signup_date?: string | null
                }
            }
            projects: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    owner_id: string
                    status: string | null
                    created_at: string | null
                    settings: Json | null
                    investment_balance: number | null
                    total_invested: number | null
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    owner_id: string
                    status?: string | null
                    created_at?: string | null
                    settings?: Json | null
                    investment_balance?: number | null
                    total_invested?: number | null
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    owner_id?: string
                    status?: string | null
                    created_at?: string | null
                    settings?: Json | null
                    investment_balance?: number | null
                    total_invested?: number | null
                }
            }
            // ... adding other tables as needed, but profiles is the priority
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
