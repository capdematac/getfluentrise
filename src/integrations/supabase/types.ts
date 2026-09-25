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
      attempts: {
        Row: {
          context: string
          correct: boolean
          created_at: string
          exercise_id: string
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          response: string | null
          skill: Database["public"]["Enums"]["skill_area"]
          user_id: string
        }
        Insert: {
          context?: string
          correct: boolean
          created_at?: string
          exercise_id: string
          id?: string
          level: Database["public"]["Enums"]["cefr_level"]
          response?: string | null
          skill: Database["public"]["Enums"]["skill_area"]
          user_id: string
        }
        Update: {
          context?: string
          correct?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          response?: string | null
          skill?: Database["public"]["Enums"]["skill_area"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          answer: Json
          created_at: string
          created_by: string | null
          est_seconds: number
          examples: string[]
          explanation: string | null
          id: string
          is_placement: boolean
          lesson_id: string | null
          level: Database["public"]["Enums"]["cefr_level"]
          objective: string | null
          options: Json
          passage: string | null
          position: number
          prompt: string
          skill: Database["public"]["Enums"]["skill_area"]
          status: string
          tags: string[]
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          answer: Json
          created_at?: string
          created_by?: string | null
          est_seconds?: number
          examples?: string[]
          explanation?: string | null
          id?: string
          is_placement?: boolean
          lesson_id?: string | null
          level: Database["public"]["Enums"]["cefr_level"]
          objective?: string | null
          options?: Json
          passage?: string | null
          position?: number
          prompt: string
          skill: Database["public"]["Enums"]["skill_area"]
          status?: string
          tags?: string[]
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          answer?: Json
          created_at?: string
          created_by?: string | null
          est_seconds?: number
          examples?: string[]
          explanation?: string | null
          id?: string
          is_placement?: boolean
          lesson_id?: string | null
          level?: Database["public"]["Enums"]["cefr_level"]
          objective?: string | null
          options?: Json
          passage?: string | null
          position?: number
          prompt?: string
          skill?: Database["public"]["Enums"]["skill_area"]
          status?: string
          tags?: string[]
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          accuracy: number | null
          completed_at: string | null
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          completed_at?: string | null
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          completed_at?: string | null
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          est_minutes: number
          id: string
          module_id: string
          position: number
          published: boolean
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          est_minutes?: number
          id?: string
          module_id: string
          position?: number
          published?: boolean
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          est_minutes?: number
          id?: string
          module_id?: string
          position?: number
          published?: boolean
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          objective: string | null
          position: number
          published: boolean
          slug: string
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["cefr_level"]
          objective?: string | null
          position?: number
          published?: boolean
          slug: string
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          objective?: string | null
          position?: number
          published?: boolean
          slug?: string
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      placement_results: {
        Row: {
          confidence: number
          created_at: string
          id: string
          overall: Database["public"]["Enums"]["cefr_level"]
          per_skill: Json
          strengths: string[]
          user_id: string
          weaknesses: string[]
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          overall: Database["public"]["Enums"]["cefr_level"]
          per_skill?: Json
          strengths?: string[]
          user_id: string
          weaknesses?: string[]
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          overall?: Database["public"]["Enums"]["cefr_level"]
          per_skill?: Json
          strengths?: string[]
          user_id?: string
          weaknesses?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          confidence: number | null
          created_at: string
          daily_goal_minutes: number
          display_name: string | null
          estimated_level: Database["public"]["Enums"]["cefr_level"] | null
          goal: string | null
          id: string
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string | null
          estimated_level?: Database["public"]["Enums"]["cefr_level"] | null
          goal?: string | null
          id: string
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string | null
          estimated_level?: Database["public"]["Enums"]["cefr_level"] | null
          goal?: string | null
          id?: string
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      review_items: {
        Row: {
          created_at: string
          due_at: string
          exercise_id: string
          id: string
          interval_days: number
          lapses: number
          reps: number
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_at?: string
          exercise_id: string
          id?: string
          interval_days?: number
          lapses?: number
          reps?: number
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_at?: string
          exercise_id?: string
          id?: string
          interval_days?: number
          lapses?: number
          reps?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "learner"
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      skill_area:
        | "grammar"
        | "vocabulary"
        | "reading"
        | "listening"
        | "writing"
        | "speaking"
        | "use_of_english"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "learner"],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      skill_area: [
        "grammar",
        "vocabulary",
        "reading",
        "listening",
        "writing",
        "speaking",
        "use_of_english",
      ],
    },
  },
} as const
