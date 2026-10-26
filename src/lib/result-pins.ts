import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// The new tables/functions are not in the generated types until types.ts is regenerated.
type Untyped = {
  from: (t: string) => { select: (c: string) => { order: (c: string, o?: { ascending: boolean }) => Promise<{ data: any[] | null; error: Error | null }> } };
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: Error | null }>;
};
const db = supabase as unknown as Untyped;

export type TermRow = { id: string; name: string; academic_year_id: string; academic_years: { name: string } | null };
export type ClassRow = { id: string; name: string };
export type PinRow = { id: string; student_id: string; term_id: string; status: "active" | "revoked"; issued_at: string; revoked_at: string | null; revoke_reason: string | null };
export type IssuedPin = { student_id: string; adm_no: string; full_name: string; pin: string };

export const termsQuery = queryOptions({
  queryKey: ["terms"],
  queryFn: async () => {
    const { data, error } = await db.from("terms").select("id, name, academic_year_id, academic_years(name)").order("academic_year_id");
    if (error) throw error;
    return (data ?? []) as TermRow[];
  },
});
export const classesQuery = queryOptions({
  queryKey: ["classes"],
  queryFn: async () => {
    const { data, error } = await db.from("classes").select("id, name").order("name");
    if (error) throw error;
    return (data ?? []) as ClassRow[];
  },
});
export const pinsQuery = queryOptions({
  queryKey: ["result-pins"],
  queryFn: async () => {
    // pin_hash is not selectable by anyone; only status columns are granted
    const { data, error } = await db.from("result_pins").select("id, student_id, term_id, status, issued_at, revoked_at, revoke_reason").order("issued_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PinRow[];
  },
});

export async function issuePin(studentId: string, termId: string, reason?: string): Promise<string> {
  const { data, error } = await db.rpc("issue_result_pin", { _student: studentId, _term: termId, _reason: reason ?? null });
  if (error) throw error;
  return data as string;
}
export async function issuePinsForClass(classId: string, termId: string): Promise<IssuedPin[]> {
  const { data, error } = await db.rpc("issue_result_pins_for_class", { _class: classId, _term: termId });
  if (error) throw error;
  return (data ?? []) as IssuedPin[];
}
export async function revokePin(pinId: string, reason: string): Promise<void> {
  const { error } = await db.rpc("revoke_result_pin", { _pin_id: pinId, _reason: reason });
  if (error) throw error;
}
