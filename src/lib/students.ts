import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type StudentRow = Tables<"students">;
export type StudentInput = TablesInsert<"students">;

export const studentsQuery = queryOptions({
  queryKey: ["students"],
  queryFn: async () => {
    const { data, error } = await supabase.from("students").select("*").order("adm_no");
    if (error) throw error;
    return data;
  },
});

export const studentQuery = (id: string) =>
  queryOptions({
    queryKey: ["students", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const studentPaymentsQuery = (id: string) =>
  queryOptions({
    queryKey: ["payments", "student", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("student_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const studentGradesQuery = (id: string) =>
  queryOptions({
    queryKey: ["grades", "student", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("grades").select("*").eq("student_id", id).order("subject");
      if (error) throw error;
      return data;
    },
  });

export async function saveStudent(input: StudentInput, id?: string) {
  const { error } = id
    ? await supabase.from("students").update(input).eq("id", id)
    : await supabase.from("students").insert(input);
  if (error) throw error;
}

export async function setStudentStatus(id: string, status: string) {
  const { error } = await supabase.from("students").update({ status }).eq("id", id);
  if (error) throw error;
}
