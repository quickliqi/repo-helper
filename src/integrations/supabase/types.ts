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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          created_at: string
          full_name: string
          id: string
          is_verified: boolean | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
    }
    Functions: {
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
    },
  },
} as const
