
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      canvas_state: {
        Row: {
          id: string
          minimap_visible: boolean
          sidebar_collapsed: boolean
          snap_to_grid: boolean
          updated_at: string
          user_id: string
          viewport_x: number
          viewport_y: number
          viewport_zoom: number
        }
        Insert: {
          id?: string
          minimap_visible?: boolean
          sidebar_collapsed?: boolean
          snap_to_grid?: boolean
          updated_at?: string
          user_id: string
          viewport_x?: number
          viewport_y?: number
          viewport_zoom?: number
        }
        Update: {
          id?: string
          minimap_visible?: boolean
          sidebar_collapsed?: boolean
          snap_to_grid?: boolean
          updated_at?: string
          user_id?: string
          viewport_x?: number
          viewport_y?: number
          viewport_zoom?: number
        }
        Relationships: []
      }
      components: {
        Row: {
          created_at: string
          data: Json
          height: number
          id: string
          position_x: number
          position_y: number
          type: Database["public"]["Enums"]["component_type"]
          updated_at: string
          user_id: string
          width: number
          z_index: number
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          height?: number
          id?: string
          position_x?: number
          position_y?: number
          type: Database["public"]["Enums"]["component_type"]
          updated_at?: string
          user_id: string
          width?: number
          z_index?: number
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          height?: number
          id?: string
          position_x?: number
          position_y?: number
          type?: Database["public"]["Enums"]["component_type"]
          updated_at?: string
          user_id?: string
          width?: number
          z_index?: number
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "components_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          color: string
          created_at: string
          from_anchor: string
          from_component_id: string
          id: string
          label: string | null
          style: Database["public"]["Enums"]["connector_style"]
          to_anchor: string
          to_component_id: string
          type: Database["public"]["Enums"]["connector_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          from_anchor?: string
          from_component_id: string
          id?: string
          label?: string | null
          style?: Database["public"]["Enums"]["connector_style"]
          to_anchor?: string
          to_component_id: string
          type?: Database["public"]["Enums"]["connector_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          from_anchor?: string
          from_component_id?: string
          id?: string
          label?: string | null
          style?: Database["public"]["Enums"]["connector_style"]
          to_anchor?: string
          to_component_id?: string
          type?: Database["public"]["Enums"]["connector_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connectors_from_component_id_fkey"
            columns: ["from_component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connectors_to_component_id_fkey"
            columns: ["to_component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          color: string
          created_at: string
          height: number
          id: string
          name: string
          position_x: number
          position_y: number
          updated_at: string
          user_id: string
          width: number
          z_index: number
        }
        Insert: {
          color?: string
          created_at?: string
          height?: number
          id?: string
          name?: string
          position_x?: number
          position_y?: number
          updated_at?: string
          user_id: string
          width?: number
          z_index?: number
        }
        Update: {
          color?: string
          created_at?: string
          height?: number
          id?: string
          name?: string
          position_x?: number
          position_y?: number
          updated_at?: string
          user_id?: string
          width?: number
          z_index?: number
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
      component_type:
        | "link_box"
        | "data_table"
        | "sticky_note"
        | "process_block"
        | "image"
      connector_style: "solid" | "dashed"
      connector_type: "line" | "arrow" | "bidirectional"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      component_type: [
        "link_box",
        "data_table",
        "sticky_note",
        "process_block",
        "image",
      ],
      connector_style: ["solid", "dashed"],
      connector_type: ["line", "arrow", "bidirectional"],
    },
  },
} as const
