export const FIELD_KEYS = ["surname", "first_name", "middle_name", "gender", "dob", "place_of_birth", "nationality", "religion", "birth_cert_no",
  "address", "town", "district", "chiefdom", "guardian_name", "guardian_relationship", "guardian_occupation", "guardian_phone", "guardian_whatsapp",
  "guardian_email", "guardian_address", "contact2_name", "contact2_phone", "fee_payer", "fee_payer_name", "academic_year", "term", "level", "class_applied",
  "department", "previous_school", "last_class", "reason_leaving", "blood_group", "allergies", "medical_conditions", "special_needs",
  "emergency_name", "emergency_relationship", "emergency_phone", "signature_name"] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];
export type Fields = Record<FieldKey, string>;

export const LEVELS: Record<string, string[]> = {
  "Day-care": ["Day-care"],
  "Kindergarten": ["Kindergarten 1", "Kindergarten 2", "Kindergarten 3"],
  "Primary (Grades)": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  "Junior Secondary School (J.S.S)": ["J.S.S 1", "J.S.S 2", "J.S.S 3"],
  "Senior Secondary School (S.S.S)": ["S.S.S 1", "S.S.S 2", "S.S.S 3"],
};
export const COORD: Record<string, string> = {
  "Day-care": "Day-care Coordinator", "Kindergarten": "Kindergarten Coordinator", "Primary (Grades)": "Grade Coordinator",
  "Junior Secondary School (J.S.S)": "Junior Secondary School Coordinator", "Senior Secondary School (S.S.S)": "Senior Secondary School Coordinator",
};
export const EARLY = ["Day-care", "Kindergarten"];
export const SSS = "Senior Secondary School (S.S.S)";
export const DISTRICTS = ["Bo", "Bombali", "Bonthe", "Falaba", "Kailahun", "Kambia", "Karene", "Kenema", "Koinadugu", "Kono", "Moyamba", "Port Loko", "Pujehun", "Tonkolili", "Western Area Rural", "Western Area Urban"];
export const DOC_KINDS = [
  { id: "birth", label: "Birth certificate", sub: "Required" },
  { id: "report", label: "Last school report / result", sub: "Required from Grade 1 upward" },
  { id: "immun", label: "Immunisation / health card", sub: "Optional, recommended for Day-care and Kindergarten" },
  { id: "letter", label: "Recommendation or transfer letter", sub: "Optional" },
] as const;
export type DocKind = (typeof DOC_KINDS)[number]["id"];
export const docRequired = (id: DocKind, level: string) => id === "birth" || (id === "report" && !!level && !EARLY.includes(level));

export const blankFields = (): Fields => {
  const f = Object.fromEntries(FIELD_KEYS.map((k) => [k, ""])) as Fields;
  const d = new Date(); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  f.nationality = "Sierra Leonean"; f.academic_year = `${y}/${y + 1}`;
  return f;
};
export const fullName = (f: Fields) => [f.first_name, f.middle_name, f.surname].filter(Boolean).join(" ");

export type StoredFile = { kind: string; path: string; name?: string; size?: number };
export type AppRowLike = Partial<Record<FieldKey, string | null>> & { pupil_name?: string; gender?: string | null; ref?: string; created_at?: string; photo_path?: string | null; documents?: StoredFile[] };
/** Turns a stored application row into the fields the printable document needs. */
export function rowToFields(r: AppRowLike): Fields {
  const f = blankFields(); f.nationality = ""; f.academic_year = "";
  for (const k of FIELD_KEYS) { const v = r[k]; if (typeof v === "string") f[k] = v; }
  if (!f.first_name && !f.surname && r.pupil_name) f.first_name = r.pupil_name;
  f.gender = r.gender === "M" ? "Male" : r.gender === "F" ? "Female" : f.gender;
  return f;
}
