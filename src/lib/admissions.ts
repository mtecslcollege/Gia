import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FIELD_KEYS, type StoredFile } from "@/lib/application-data";

type Res<T> = Promise<{ data: T | null; error: { message: string } | null }>;
type Untyped = {
  from: (t: string) => { select: (c: string) => { order: (c: string, o?: { ascending: boolean }) => Res<any[]> } };
  rpc: (fn: string, args?: Record<string, unknown>) => Res<any>;
};
const db = supabase as unknown as Untyped;

export type ApplicationRow = {
  id: string; ref: string; created_at: string; status: "Pending" | "Under review" | "Approved" | "Rejected" | "Admitted";
  pupil_name: string; dob: string | null; gender: "M" | "F"; level: string; class_applied: string | null; department: string | null;
  academic_year: string | null; term: string | null; guardian_name: string; guardian_phone: string; guardian_email: string | null;
  address: string | null; previous_school: string | null; last_class: string | null; reason_leaving: string | null;
  decision_note: string | null; student_id: string | null;
  surname: string | null; first_name: string | null; middle_name: string | null; photo_path: string | null; documents: StoredFile[];
} & Partial<Record<(typeof FIELD_KEYS)[number], string | null>>;
export const applicationsQuery = queryOptions({
  queryKey: ["applications"],
  queryFn: async () => {
    const cols = ["id", "ref", "created_at", "status", "pupil_name", "decision_note", "student_id", "photo_path", "documents", ...FIELD_KEYS.filter((k) => k !== "signature_name"), "signature_name"].join(", ");
    const { data, error } = await db.from("applications").select(cols).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ApplicationRow[];
  },
});
export async function decideApplication(id: string, status: "Under review" | "Approved" | "Rejected", note?: string) {
  const { error } = await db.rpc("decide_application", { _id: id, _status: status, _note: note ?? null });
  if (error) throw new Error(error.message);
}
export async function admitApplication(id: string, classId: string): Promise<{ student_id: string; adm_no: string; class: string; enrolled: boolean }> {
  const { data, error } = await db.rpc("admit_application", { _id: id, _class: classId });
  if (error) throw new Error(error.message);
  return data;
}
export async function setAdmissionsOpen(open: boolean) {
  const { error } = await (supabase as unknown as { from: (t: string) => { update: (v: unknown) => { eq: (c: string, v: unknown) => Res<unknown> } } }).from("school_settings").update({ admissions_open: open }).eq("id", 1);
  if (error) throw new Error(error.message);
}

/** Short-lived link to a private application file (photo or document). */
export async function signedFileUrl(path: string, seconds = 300): Promise<string | null> {
  const { data, error } = await supabase.storage.from("application-files").createSignedUrl(path, seconds);
  return error ? null : data.signedUrl;
}
