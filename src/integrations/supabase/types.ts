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
      buy_boxes: {
        Row: {
          created_at: string
          deal_types: Database["public"]["Enums"]["deal_type"][]
          id: string
          is_active: boolean | null
          max_arv: number | null
          max_price: number | null
          max_radius_miles: number | null
          min_arv: number | null
          min_equity_percentage: number | null
          min_price: number | null
          name: string
          notes: string | null
          preferred_conditions:
            | Database["public"]["Enums"]["property_condition"][]
            | null
          property_types: Database["public"]["Enums"]["property_type"][]
          target_cities: string[] | null
          target_states: string[] | null
          target_zip_codes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_types?: Database["public"]["Enums"]["deal_type"][]
          id?: string
          is_active?: boolean | null
          max_arv?: number | null
          max_price?: number | null
          max_radius_miles?: number | null
          min_arv?: number | null
          min_equity_percentage?: number | null
          min_price?: number | null
          name?: string
          notes?: string | null
          preferred_conditions?:
            | Database["public"]["Enums"]["property_condition"][]
            | null
          property_types?: Database["public"]["Enums"]["property_type"][]
          target_cities?: string[] | null
          target_states?: string[] | null
          target_zip_codes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_types?: Database["public"]["Enums"]["deal_type"][]
          id?: string
          is_active?: boolean | null
          max_arv?: number | null
          max_price?: number | null
          max_radius_miles?: number | null
          min_arv?: number | null
          min_equity_percentage?: number | null
          min_price?: number | null
          name?: string
          notes?: string | null
          preferred_conditions?:
            | Database["public"]["Enums"]["property_condition"][]
            | null
          property_types?: Database["public"]["Enums"]["property_type"][]
          target_cities?: string[] | null
          target_states?: string[] | null
          target_zip_codes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          id: string
          investor_email: string
          investor_id: string
          investor_name: string
          investor_phone: string | null
          message: string | null
          property_id: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          investor_email: string
          investor_id: string
          investor_name: string
          investor_phone?: string | null
          message?: string | null
          property_id: string
          seller_id: string
        }
        Update: {
          created_at?: string
          id?: string
          investor_email?: string
          investor_id?: string
          investor_name?: string
          investor_phone?: string | null
          message?: string | null
          property_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          investor_id: string
          property_id: string | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          investor_id: string
          property_id?: string | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          investor_id?: string
          property_id?: string | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_leads: {
        Row: {
          converted_to_user: boolean | null
          converted_user_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          landing_page: string | null
          lead_type: string
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          converted_to_user?: boolean | null
          converted_user_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          landing_page?: string | null
          lead_type: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          converted_to_user?: boolean | null
          converted_user_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          landing_page?: string | null
          lead_type?: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      listing_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          credits_used: number
          id: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          buy_box_id: string
          created_at: string
          id: string
          investor_id: string
          is_contacted: boolean | null
          is_saved: boolean | null
          is_viewed: boolean | null
          match_score: number | null
          property_id: string
        }
        Insert: {
          buy_box_id: string
          created_at?: string
          id?: string
          investor_id: string
          is_contacted?: boolean | null
          is_saved?: boolean | null
          is_viewed?: boolean | null
          match_score?: number | null
          property_id: string
        }
        Update: {
          buy_box_id?: string
          created_at?: string
          id?: string
          investor_id?: string
          is_contacted?: boolean | null
          is_saved?: boolean | null
          is_viewed?: boolean | null
          match_score?: number | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_buy_box_id_fkey"
            columns: ["buy_box_id"]
            isOneToOne: false
            referencedRelation: "buy_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_match_id: string | null
          related_property_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_match_id?: string | null
          related_property_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_match_id?: string | null
          related_property_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_match_id_fkey"
            columns: ["related_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_property_id_fkey"
            columns: ["related_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          status: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          avg_response_time_hours: number | null
          bio: string | null
          city: string | null
          company_name: string | null
          created_at: string
          deals_closed: number | null
          fcm_token: string | null
          full_name: string
          id: string
          is_actively_buying: boolean | null
          is_verified: boolean | null
          member_since: string | null
          phone: string | null
          response_rate: number | null
          state: string | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          avg_response_time_hours?: number | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          deals_closed?: number | null
          fcm_token?: string | null
          full_name: string
          id?: string
          is_actively_buying?: boolean | null
          is_verified?: boolean | null
          member_since?: string | null
          phone?: string | null
          response_rate?: number | null
          state?: string | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          avg_response_time_hours?: number | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          deals_closed?: number | null
          fcm_token?: string | null
          full_name?: string
          id?: string
          is_actively_buying?: boolean | null
          is_verified?: boolean | null
          member_since?: string | null
          phone?: string | null
          response_rate?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          arv: number | null
          asking_price: number
          assignment_fee: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          condition: Database["public"]["Enums"]["property_condition"]
          created_at: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          description: string | null
          equity_percentage: number | null
          highlights: string[] | null
          id: string
          image_urls: string[] | null
          is_demo: boolean | null
          lot_size_sqft: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          repair_estimate: number | null
          sqft: number | null
          state: string
          status: Database["public"]["Enums"]["property_status"] | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          arv?: number | null
          asking_price: number
          assignment_fee?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          condition: Database["public"]["Enums"]["property_condition"]
          created_at?: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          description?: string | null
          equity_percentage?: number | null
          highlights?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_demo?: boolean | null
          lot_size_sqft?: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          repair_estimate?: number | null
          sqft?: number | null
          state: string
          status?: Database["public"]["Enums"]["property_status"] | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          arv?: number | null
          asking_price?: number
          assignment_fee?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          condition?: Database["public"]["Enums"]["property_condition"]
          created_at?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          description?: string | null
          equity_percentage?: number | null
          highlights?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_demo?: boolean | null
          lot_size_sqft?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          repair_estimate?: number | null
          sqft?: number | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      property_match_throttle: {
        Row: {
          last_reset_date: string | null
          properties_created_today: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          last_reset_date?: string | null
          properties_created_today?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          last_reset_date?: string | null
          properties_created_today?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          request_count: number | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          request_count?: number | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          request_count?: number | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          deal_types: string[] | null
          id: string
          last_notified_at: string | null
          max_price: number | null
          min_price: number | null
          name: string
          notifications_enabled: boolean | null
          property_types: string[] | null
          search_query: string | null
          states: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_types?: string[] | null
          id?: string
          last_notified_at?: string | null
          max_price?: number | null
          min_price?: number | null
          name: string
          notifications_enabled?: boolean | null
          property_types?: string[] | null
          search_query?: string | null
          states?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_types?: string[] | null
          id?: string
          last_notified_at?: string | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          notifications_enabled?: boolean | null
          property_types?: string[] | null
          search_query?: string | null
          states?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scrape_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          credits_used: number
          current_period_end: string | null
          current_period_start: string | null
          id: string
          stripe_subscription_id: string | null
          subscription_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          stripe_subscription_id?: string | null
          subscription_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          stripe_subscription_id?: string | null
          subscription_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scrape_results: {
        Row: {
          analysis_notes: string | null
          confidence_score: number | null
          created_at: string
          extracted_data: Json | null
          id: string
          is_saved: boolean | null
          match_score: number | null
          matched_buy_box_id: string | null
          post_content: string | null
          scrape_session_id: string
          source_url: string
          user_id: string
        }
        Insert: {
          analysis_notes?: string | null
          confidence_score?: number | null
          created_at?: string
          extracted_data?: Json | null
          id?: string
          is_saved?: boolean | null
          match_score?: number | null
          matched_buy_box_id?: string | null
          post_content?: string | null
          scrape_session_id: string
          source_url: string
          user_id: string
        }
        Update: {
          analysis_notes?: string | null
          confidence_score?: number | null
          created_at?: string
          extracted_data?: Json | null
          id?: string
          is_saved?: boolean | null
          match_score?: number | null
          matched_buy_box_id?: string | null
          post_content?: string | null
          scrape_session_id?: string
          source_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_results_matched_buy_box_id_fkey"
            columns: ["matched_buy_box_id"]
            isOneToOne: false
            referencedRelation: "buy_boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          deals_found: number | null
          id: string
          source_url: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deals_found?: number | null
          id?: string
          source_url: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deals_found?: number | null
          id?: string
          source_url?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ratings: {
        Row: {
          created_at: string
          id: string
          property_id: string | null
          rated_user_id: string
          rater_user_id: string
          rating: number
          review: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          property_id?: string | null
          rated_user_id: string
          rater_user_id: string
          rating: number
          review?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string | null
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
          review?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_type: string
          document_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_function_name: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      get_rate_limit_remaining: {
        Args: {
          p_function_name: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: number
      }
      get_user_avg_rating: { Args: { p_user_id: string }; Returns: number }
      get_user_rating_count: { Args: { p_user_id: string }; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_views: { Args: { p_property_id: string }; Returns: undefined }
      match_property_to_buy_boxes: {
        Args: { property_id_input: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "investor" | "wholesaler" | "admin"
      deal_type:
        | "fix_and_flip"
        | "buy_and_hold"
        | "wholesale"
        | "subject_to"
        | "seller_finance"
        | "other"
      property_condition: "excellent" | "good" | "fair" | "poor" | "distressed"
      property_status:
        | "active"
        | "under_contract"
        | "pending"
        | "sold"
        | "withdrawn"
      property_type:
        | "single_family"
        | "multi_family"
        | "condo"
        | "townhouse"
        | "commercial"
        | "land"
        | "mobile_home"
        | "other"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "past_due"
        | "incomplete"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["investor", "wholesaler", "admin"],
      deal_type: [
        "fix_and_flip",
        "buy_and_hold",
        "wholesale",
        "subject_to",
        "seller_finance",
        "other",
      ],
      property_condition: ["excellent", "good", "fair", "poor", "distressed"],
      property_status: [
        "active",
        "under_contract",
        "pending",
        "sold",
        "withdrawn",
      ],
      property_type: [
        "single_family",
        "multi_family",
        "condo",
        "townhouse",
        "commercial",
        "land",
        "mobile_home",
        "other",
      ],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "past_due",
        "incomplete",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
