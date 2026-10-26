import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Banknote, Landmark, Smartphone, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, Panel, Field, Avatar, inputCls } from "@/components/gia/kit";
import { leo } from "@/lib/mock";
import { studentsQuery } from "@/lib/students";
import { balancesQuery, recordPayment } from "@/lib/finance";
import { termsQuery } from "@/lib/result-pins";

export const Route = createFileRoute("/app/finance/payment")({
  loader: ({ context }) => context.queryClient.ensureQueryData(studentsQuery),
  component: Payment,
});

const methods = [{ k: "Cash", i: Banknote }, { k: "Bank", i: Landmark }, { k: "Mobile Money", i: Smartphone }, { k: "Other", i: MoreHorizontal }];

function Payment() {
  const { data: students } = useSuspenseQuery(studentsQuery);
  const balances = useQuery(balancesQuery), terms = useQuery(termsQuery);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("School fees");
  const [method, setMethod] = useState("Cash");
  const [termKey, setTermKey] = useState("");
  const [manualTerm, setManualTerm] = useState("First Term");
  const [manualYear, setManualYear] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const clientId = useRef(crypto.randomUUID());          // one id per form: a retried save cannot double-record
  const navigate = useNavigate();
  const student = students.find((s) => s.id === studentId);
  const bal = balances.data?.find((b) => b.student_id === studentId);
  const picked = terms.data?.find((t) => t.id === termKey);
  const termName = picked ? picked.name : manualTerm;
  const yearName = picked ? (picked.academic_years?.name ?? "") : manualYear.trim();
  const matches = useMemo(() => q ? students.filter((s) => s.full_name.toLowerCase().includes(q.toLowerCase()) || s.adm_no.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [], [q, students]);
  const amt = Number(amount || 0);
  const canSave = !!student && amt > 0 && yearName.length > 0;
  const save = async () => {
    if (!student) return; setSaving(true);
    try {
      const row = await recordPayment({ student_id: student.id, amount: amt, purpose, term: termName, academic_year: yearName, method, client_uuid: clientId.current });
      qc.invalidateQueries({ queryKey: ["payments"] }); qc.invalidateQueries({ queryKey: ["fee-balances"] });
      toast.success(`Receipt ${row.receipt_no} issued`);
      navigate({ to: "/app/finance/receipt", search: { id: row.id } });
    } catch (e) { toast.error((e as Error).message); setConfirm(false); } finally { setSaving(false); }
  };
  return (
    <>
      <PageHeader title="Record Payment" subtitle="Payments are recorded and a GIA receipt is issued." />
      <form className="grid gap-6 lg:grid-cols-[1fr_1.4fr]" onSubmit={(e) => { e.preventDefault(); if (canSave) setConfirm(true); else toast.error("Choose a student, an amount and the academic year."); }}>
        <Panel title="Student">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or admission no." className={`${inputCls} pl-9`} /></div>
          {matches.length > 0 && <ul className="mt-2 divide-y rounded-lg border">{matches.map((m) => <li key={m.id}><button type="button" onClick={() => { setStudentId(m.id); setQ(""); }} className="flex min-h-12 w-full items-center gap-3 p-3 text-left text-sm hover:bg-muted"><Avatar name={m.full_name} size="h-8 w-8 text-[10px]" />{m.full_name} <span className="text-muted-foreground">{m.adm_no}</span></button></li>)}</ul>}
          {student ? (
            <div className="mt-5 flex items-center gap-4 rounded-lg bg-info-soft p-4">
              <Avatar name={student.full_name} size="h-14 w-14 text-base" />
              <div className="min-w-0 text-sm"><div className="font-semibold text-primary">{student.full_name}</div><div className="text-muted-foreground">{student.adm_no} • {student.class_name}</div>
                <div className="mt-1">Balance: {bal ? <span className={`font-semibold ${bal.balance > 0 ? "text-destructive" : "text-success"}`}>{leo(bal.balance)}</span> : <span className="text-muted-foreground">{balances.isLoading ? "loading…" : "not available"}</span>}</div></div>
            </div>
          ) : <p className="mt-5 rounded-lg bg-muted p-4 text-sm text-muted-foreground">Search for a student to begin.</p>}
        </Panel>
        <Panel title="Payment Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (NLe)"><input required inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className={inputCls} /></Field>
            <Field label="Payment Purpose"><select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputCls}>{["School fees", "Exam fees", "Uniform", "Books", "Transport", "Other"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            {terms.data && terms.data.length > 0 ? (
              <Field label="Term and academic year"><select required value={termKey} onChange={(e) => setTermKey(e.target.value)} className={inputCls}><option value="">Select…</option>{terms.data.map((t) => <option key={t.id} value={t.id}>{t.name}, {t.academic_years?.name}</option>)}</select></Field>
            ) : (<>
              <Field label="Academic Year (e.g. 2026/2027)"><input required value={manualYear} onChange={(e) => setManualYear(e.target.value)} placeholder="2026/2027" className={inputCls} /></Field>
              <Field label="Term"><select value={manualTerm} onChange={(e) => setManualTerm(e.target.value)} className={inputCls}><option>First Term</option><option>Second Term</option><option>Third Term</option></select></Field>
            </>)}
          </div>
          <div className="mt-5 text-sm font-medium">Payment Method</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {methods.map((m) => (
              <button type="button" key={m.k} onClick={() => setMethod(m.k)} className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition ${method === m.k ? "border-primary bg-info-soft text-primary ring-2 ring-primary/20" : "bg-card hover:border-primary"}`}><m.i className="h-5 w-5" />{m.k}</button>
            ))}
          </div>
          <div className="sticky bottom-20 mt-6 lg:static"><Button type="submit" variant="gold" size="lg" className="w-full" disabled={saving}>Record Payment</Button></div>
        </Panel>
      </form>
      <AlertDialog open={confirm} onOpenChange={(o) => !saving && setConfirm(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm payment</AlertDialogTitle>
            <AlertDialogDescription>Record <b>{leo(amt)}</b> from <b>{student?.full_name}</b> ({student?.adm_no}) for {purpose.toLowerCase()} via {method}, {termName} {yearName}? A receipt will be issued and the payment cannot be edited afterwards; mistakes are corrected by a reversal approved by school management.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(e) => { e.preventDefault(); void save(); }}>{saving ? "Saving…" : "Confirm & Issue Receipt"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
