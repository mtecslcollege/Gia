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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      grades: {
        Row: {
          academic_year: string
          entered_by: string | null
          exam_score: number | null
          id: string
          status: string
          student_id: string
          subject: string
          term: string
          test_score: number | null
          updated_at: string
        }
        Insert: {
          academic_year?: string
          entered_by?: string | null
          exam_score?: number | null
          id?: string
          status?: string
          student_id: string
          subject: string
          term: string
          test_score?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          entered_by?: string | null
          exam_score?: number | null
          id?: string
          status?: string
          student_id?: string
          subject?: string
          term?: string
          test_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          audience: string
          author_id: string | null
          body: string
          created_at: string
          id: string
          priority: string
          status: string
          title: string
        }
        Insert: {
          audience?: string
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          title: string
        }
        Update: {
          audience?: string
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      parent_students: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          academic_year: string
          amount: number
          client_uuid: string | null
          created_at: string
          id: string
          method: string
          purpose: string
          receipt_no: string
          received_by: string | null
          status: string
          student_id: string
          term: string
        }
        Insert: {
          academic_year?: string
          amount: number
          client_uuid?: string | null
          created_at?: string
          id?: string
          method: string
          purpose: string
          receipt_no?: string
          received_by?: string | null
          status?: string
          student_id: string
          term?: string
        }
        Update: {
          academic_year?: string
          amount?: number
          client_uuid?: string | null
          created_at?: string
          id?: string
          method?: string
          purpose?: string
          receipt_no?: string
          received_by?: string | null
          status?: string
          student_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          approved?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          approved?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          id: number
          registration_open: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          registration_open?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          registration_open?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          adm_no: string
          class_name: string
          created_at: string
          dob: string | null
          fees_due: number
          full_name: string
          gender: string
          guardian_name: string | null
          guardian_phone: string | null
          house: string | null
          id: string
          status: string
        }
        Insert: {
          adm_no: string
          class_name: string
          created_at?: string
          dob?: string | null
          fees_due?: number
          full_name: string
          gender?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          house?: string | null
          id?: string
          status?: string
        }
        Update: {
          adm_no?: string
          class_name?: string
          created_at?: string
          dob?: string | null
          fees_due?: number
          full_name?: string
          gender?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          house?: string | null
          id?: string
          status?: string
        }
        Relationships: []
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
      approve_user: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_parent_of: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      revoke_user: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "proprietor"
        | "principal"
        | "vice_principal"
        | "admin"
        | "finance"
        | "coordinator"
        | "hod"
        | "formmaster"
        | "teacher"
        | "parent"
        | "student"
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
      app_role: [
        "proprietor",
        "principal",
        "vice_principal",
        "admin",
        "finance",
        "coordinator",
        "hod",
        "formmaster",
        "teacher",
        "parent",
        "student",
      ],
    },
  },
} as const
