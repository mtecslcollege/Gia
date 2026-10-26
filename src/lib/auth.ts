import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const roleLabel: Record<AppRole, string> = {
  proprietor: "Proprietor", principal: "Principal", vice_principal: "Vice Principal", admin: "Administrator",
  finance: "Finance Officer", coordinator: "Coordinator", hod: "Head of Department", formmaster: "Form Master",
  teacher: "Teacher", parent: "Parent", student: "Student",
};

export const signupRoles: AppRole[] = ["parent", "student", "teacher", "formmaster", "hod", "coordinator", "finance", "admin", "vice_principal"];
export const allRoles = Object.keys(roleLabel) as AppRole[];

const rank: AppRole[] = ["proprietor", "principal", "vice_principal", "admin", "finance", "coordinator", "hod", "formmaster", "teacher", "parent", "student"];

export async function loadSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  const roles = (roleRows ?? []).map((r) => r.role).sort((a, b) => rank.indexOf(a) - rank.indexOf(b));
  return { user, profile, roles, primary: roles[0] ?? null };
}

export function homeFor(role: AppRole | null) {
  if (role === "parent") return "/app/parent";
  if (role === "student") return "/app/student";
  if (role === "teacher" || role === "formmaster" || role === "hod") return "/app/staff";
  return "/app";
}
