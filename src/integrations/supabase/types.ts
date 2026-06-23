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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      link_clicks: {
        Row: {
          created_at: string
          id: string
          link_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          position: number
          profile_id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          position?: number
          profile_id: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          position?: number
          profile_id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          duration_days: number | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          duration_days?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      profile_tags: {
        Row: {
          assigned_at: string
          hidden: boolean
          profile_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          hidden?: boolean
          profile_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          hidden?: boolean
          profile_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accent_color: string
          aliases: string | null
          audio_url: string | null
          avatar_url: string | null
          background_color: string
          background_effect: string
          background_image_url: string | null
          banned_at: string | null
          banner_url: string | null
          bio: string | null
          button_layout: string
          button_style: string
          button_theme: string
          card_blur: number
          card_enabled: boolean
          card_opacity: number
          card_tilt: boolean
          card_width: number
          created_at: string
          cursor_effect: string
          cursor_url: string | null
          discord_id: string | null
          display_name: string | null
          entrance_animation: string
          font_family: string
          force_tag_color: string | null
          freeze_video_last_frame: boolean
          hide_views: boolean
          icon_glow_color: string | null
          id: string
          is_premium: boolean
          location: string | null
          music_autoplay: boolean
          music_volume: number
          name_gradient: string | null
          page_description: string | null
          page_title: string | null
          premium_expires_at: string | null
          seo_description: string | null
          seo_title: string | null
          show_views: boolean
          tab_icon_url: string | null
          tagline: string | null
          text_color: string
          theme: string
          typewriter_enabled: boolean
          uid: string | null
          updated_at: string
          username: string
          username_effect: string
          view_count: number
        }
        Insert: {
          accent_color?: string
          aliases?: string | null
          audio_url?: string | null
          avatar_url?: string | null
          background_color?: string
          background_effect?: string
          background_image_url?: string | null
          banned_at?: string | null
          banner_url?: string | null
          bio?: string | null
          button_layout?: string
          button_style?: string
          button_theme?: string
          card_blur?: number
          card_enabled?: boolean
          card_opacity?: number
          card_tilt?: boolean
          card_width?: number
          created_at?: string
          cursor_effect?: string
          cursor_url?: string | null
          discord_id?: string | null
          display_name?: string | null
          entrance_animation?: string
          font_family?: string
          force_tag_color?: string | null
          freeze_video_last_frame?: boolean
          hide_views?: boolean
          icon_glow_color?: string | null
          id: string
          is_premium?: boolean
          location?: string | null
          music_autoplay?: boolean
          music_volume?: number
          name_gradient?: string | null
          page_description?: string | null
          page_title?: string | null
          premium_expires_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_views?: boolean
          tab_icon_url?: string | null
          tagline?: string | null
          text_color?: string
          theme?: string
          typewriter_enabled?: boolean
          uid?: string | null
          updated_at?: string
          username: string
          username_effect?: string
          view_count?: number
        }
        Update: {
          accent_color?: string
          aliases?: string | null
          audio_url?: string | null
          avatar_url?: string | null
          background_color?: string
          background_effect?: string
          background_image_url?: string | null
          banned_at?: string | null
          banner_url?: string | null
          bio?: string | null
          button_layout?: string
          button_style?: string
          button_theme?: string
          card_blur?: number
          card_enabled?: boolean
          card_opacity?: number
          card_tilt?: boolean
          card_width?: number
          created_at?: string
          cursor_effect?: string
          cursor_url?: string | null
          discord_id?: string | null
          display_name?: string | null
          entrance_animation?: string
          font_family?: string
          force_tag_color?: string | null
          freeze_video_last_frame?: boolean
          hide_views?: boolean
          icon_glow_color?: string | null
          id?: string
          is_premium?: boolean
          location?: string | null
          music_autoplay?: boolean
          music_volume?: number
          name_gradient?: string | null
          page_description?: string | null
          page_title?: string | null
          premium_expires_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_views?: boolean
          tab_icon_url?: string | null
          tagline?: string | null
          text_color?: string
          theme?: string
          typewriter_enabled?: boolean
          uid?: string | null
          updated_at?: string
          username?: string
          username_effect?: string
          view_count?: number
        }
        Relationships: []
      }
      reserved_usernames: {
        Row: {
          created_at: string
          name: string
        }
        Insert: {
          created_at?: string
          name: string
        }
        Update: {
          created_at?: string
          name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          description: string | null
          event_end: string | null
          event_start: string | null
          icon: string | null
          icon_url: string | null
          id: string
          is_event: boolean
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          event_end?: string | null
          event_start?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          is_event?: boolean
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          event_end?: string | null
          event_start?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          is_event?: boolean
          name?: string
          slug?: string
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
      profiles_public: {
        Row: {
          accent_color: string | null
          aliases: string | null
          audio_url: string | null
          avatar_url: string | null
          background_color: string | null
          background_effect: string | null
          background_image_url: string | null
          banned_at: string | null
          banner_url: string | null
          bio: string | null
          button_layout: string | null
          button_style: string | null
          button_theme: string | null
          card_blur: number | null
          card_enabled: boolean | null
          card_opacity: number | null
          card_tilt: boolean | null
          card_width: number | null
          cursor_effect: string | null
          cursor_url: string | null
          discord_id: string | null
          display_name: string | null
          entrance_animation: string | null
          font_family: string | null
          force_tag_color: string | null
          freeze_video_last_frame: boolean | null
          icon_glow_color: string | null
          id: string | null
          is_premium: boolean | null
          location: string | null
          music_autoplay: boolean | null
          music_volume: number | null
          name_gradient: string | null
          page_description: string | null
          page_title: string | null
          seo_description: string | null
          seo_title: string | null
          show_views: boolean | null
          tab_icon_url: string | null
          tagline: string | null
          text_color: string | null
          theme: string | null
          typewriter_enabled: boolean | null
          uid: string | null
          username: string | null
          username_effect: string | null
          view_count: number | null
        }
        Insert: {
          accent_color?: string | null
          aliases?: string | null
          audio_url?: string | null
          avatar_url?: string | null
          background_color?: string | null
          background_effect?: string | null
          background_image_url?: string | null
          banned_at?: string | null
          banner_url?: string | null
          bio?: string | null
          button_layout?: string | null
          button_style?: string | null
          button_theme?: string | null
          card_blur?: number | null
          card_enabled?: boolean | null
          card_opacity?: number | null
          card_tilt?: boolean | null
          card_width?: number | null
          cursor_effect?: string | null
          cursor_url?: string | null
          discord_id?: string | null
          display_name?: string | null
          entrance_animation?: string | null
          font_family?: string | null
          force_tag_color?: string | null
          freeze_video_last_frame?: boolean | null
          icon_glow_color?: string | null
          id?: string | null
          is_premium?: boolean | null
          location?: string | null
          music_autoplay?: boolean | null
          music_volume?: number | null
          name_gradient?: string | null
          page_description?: string | null
          page_title?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_views?: never
          tab_icon_url?: string | null
          tagline?: string | null
          text_color?: string | null
          theme?: string | null
          typewriter_enabled?: boolean | null
          uid?: string | null
          username?: string | null
          username_effect?: string | null
          view_count?: never
        }
        Update: {
          accent_color?: string | null
          aliases?: string | null
          audio_url?: string | null
          avatar_url?: string | null
          background_color?: string | null
          background_effect?: string | null
          background_image_url?: string | null
          banned_at?: string | null
          banner_url?: string | null
          bio?: string | null
          button_layout?: string | null
          button_style?: string | null
          button_theme?: string | null
          card_blur?: number | null
          card_enabled?: boolean | null
          card_opacity?: number | null
          card_tilt?: boolean | null
          card_width?: number | null
          cursor_effect?: string | null
          cursor_url?: string | null
          discord_id?: string | null
          display_name?: string | null
          entrance_animation?: string | null
          font_family?: string | null
          force_tag_color?: string | null
          freeze_video_last_frame?: boolean | null
          icon_glow_color?: string | null
          id?: string | null
          is_premium?: boolean | null
          location?: string | null
          music_autoplay?: boolean | null
          music_volume?: number | null
          name_gradient?: string | null
          page_description?: string | null
          page_title?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_views?: never
          tab_icon_url?: string | null
          tagline?: string | null
          text_color?: string | null
          theme?: string | null
          typewriter_enabled?: boolean | null
          uid?: string | null
          username?: string | null
          username_effect?: string | null
          view_count?: never
        }
        Relationships: []
      }
    }
    Functions: {
      admin_add_views: {
        Args: { _count: number; _user_id: string }
        Returns: Json
      }
      admin_ban_user: {
        Args: { _ban: boolean; _user_id: string }
        Returns: Json
      }
      admin_grant_premium: {
        Args: { _duration_days: number; _user_id: string }
        Returns: Json
      }
      admin_revoke_premium: { Args: { _user_id: string }; Returns: Json }
      admin_stats: { Args: never; Returns: Json }
      create_tag: {
        Args: {
          _color: string
          _description: string
          _icon: string
          _name: string
          _slug: string
        }
        Returns: Json
      }
      generate_premium_code: {
        Args: { _duration_days: number; _quantity?: number }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view: { Args: { _profile_id: string }; Returns: undefined }
      redeem_admin_master_code: { Args: { _code: string }; Returns: Json }
      redeem_premium_code: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
