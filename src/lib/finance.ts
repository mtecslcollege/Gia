import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// New columns/views (kind, reverses_id, student_fee_balances) are not in the generated types until types.ts is regenerated.
type Res<T> = Promise<{ data: T | null; error: { message: string } | null }>;
type Q = { select: (c: string) => Q; order: (c: string, o?: { ascending: boolean }) => Q; limit: (n: number) => Q; eq: (c: string, v: unknown) => Q; single: () => Res<any>; maybeSingle: () => Res<any>; then: Res<any[]>["then"] };
type Untyped = { from: (t: string) => Q & { insert: (v: Record<string, unknown>) => Q }; };
const db = supabase as unknown as Untyped;

export type PaymentRow = { id: string; receipt_no: string; student_id: string; amount: number; purpose: string; term: string; academic_year: string; method: string; status: string; kind: "payment" | "reversal"; reason: string | null; created_at: string };
export type BalanceRow = { student_id: string; adm_no: string; full_name: string; class_name: string; charged: number; paid: number; balance: number };

const COLS = "id, receipt_no, student_id, amount, purpose, term, academic_year, method, status, kind, reason, created_at";
const num = (v: unknown) => Number(v ?? 0);

export const paymentsQuery = queryOptions({
  queryKey: ["payments", "recent"],
  queryFn: async () => {
    const { data, error } = await (db.from("payments").select(COLS).order("created_at", { ascending: false }).limit(500) as unknown as Res<PaymentRow[]>);
    if (error) throw new Error(error.message);
    return (data ?? []).map((p) => ({ ...p, amount: num(p.amount) }));
  },
});
export const balancesQuery = queryOptions({
  queryKey: ["fee-balances"],
  queryFn: async () => {
    const { data, error } = await (db.from("student_fee_balances").select("student_id, adm_no, full_name, class_name, charged, paid, balance").order("adm_no") as unknown as Res<BalanceRow[]>);
    if (error) throw new Error(error.message);
    return (data ?? []).map((b) => ({ ...b, charged: num(b.charged), paid: num(b.paid), balance: num(b.balance) }));
  },
});
export const paymentQuery = (id: string) => queryOptions({
  queryKey: ["payments", id],
  queryFn: async () => {
    const { data, error } = await (db.from("payments").select(COLS).eq("id", id).maybeSingle() as unknown as Res<PaymentRow>);
    if (error) throw new Error(error.message);
    return data ? { ...data, amount: num(data.amount) } : null;
  },
});
export const settingsQuery = queryOptions({
  queryKey: ["school-settings"],
  queryFn: async () => {
    const { data } = await (db.from("school_settings").select("school_name, motto, address, contact_email, contact_phone").eq("id", 1).maybeSingle() as unknown as Res<{ school_name: string | null; motto: string | null; address: string | null; contact_email: string | null; contact_phone: string | null }>);
    return data;
  },
});

export type NewPayment = { student_id: string; amount: number; purpose: string; term: string; academic_year: string; method: string; client_uuid: string };
/** Inserts one payment. client_uuid makes a retried submit harmless (unique constraint). Returns the saved row. */
export async function recordPayment(p: NewPayment): Promise<PaymentRow> {
  const { data, error } = await (db.from("payments").insert({ ...p }).select(COLS).single() as unknown as Res<PaymentRow>);
  if (error) {
    if (/duplicate key|client_uuid/i.test(error.message)) {
      const { data: again } = await (db.from("payments").select(COLS).eq("client_uuid", p.client_uuid).maybeSingle() as unknown as Res<PaymentRow>);
      if (again) return { ...again, amount: num(again.amount) };
    }
    if (/row-level security|permission denied/i.test(error.message)) throw new Error("Only a finance officer can record payments.");
    throw new Error(error.message);
  }
  return { ...(data as PaymentRow), amount: num((data as PaymentRow).amount) };
}
export const signedAmount = (p: Pick<PaymentRow, "amount" | "kind">) => (p.kind === "reversal" ? -p.amount : p.amount);
