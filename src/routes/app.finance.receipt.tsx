import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/gia/kit";
import { Crest } from "@/components/gia/Crest";
import { SCHOOL, leo } from "@/lib/mock";
import { studentsQuery } from "@/lib/students";
import { paymentQuery, paymentsQuery, balancesQuery, settingsQuery } from "@/lib/finance";

export const Route = createFileRoute("/app/finance/receipt")({
  validateSearch: z.object({ id: z.string().uuid().optional() }),
  loader: ({ context }) => context.queryClient.ensureQueryData(studentsQuery),
  component: ReceiptPage,
});

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function words(n: number): string {
  if (n === 0) return "Zero";
  const chunk = (x: number): string => x < 20 ? ones[x]! : x < 100 ? `${tens[Math.floor(x / 10)]} ${ones[x % 10]}`.trim() : `${ones[Math.floor(x / 100)]} Hundred ${chunk(x % 100)}`.trim();
  const parts: string[] = [];
  [[1e9, "Billion"], [1e6, "Million"], [1e3, "Thousand"], [1, ""]].forEach(([v, l]) => { const c = Math.floor(n / (v as number)) % 1000; if (c) parts.push(`${chunk(c)} ${l}`.trim()); });
  return parts.join(" ");
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-end gap-3">
      <span className="shrink-0 font-display text-sm italic">{label}</span>
      <span className={`flex-1 border-b border-dotted border-foreground/60 pb-0.5 text-base font-semibold text-primary ${mono ? "font-mono" : "font-display"}`}>{value}</span>
    </div>
  );
}

function ReceiptList() {
  const { data: students } = useSuspenseQuery(studentsQuery);
  const pays = useQuery(paymentsQuery);
  const name = (id: string) => students.find((x) => x.id === id)?.full_name ?? "Unknown pupil";
  return (
    <>
      <PageHeader title="Receipts" subtitle="Choose a payment to view or print its receipt." />
      {pays.isError && <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">You do not have access to finance records.</p>}
      <ul className="divide-y rounded-xl border bg-card">
        {(pays.data ?? []).slice(0, 50).map((p) => (
          <li key={p.id}><Link to="/app/finance/receipt" search={{ id: p.id }} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted">
            <span><span className="font-mono text-xs text-primary">{p.receipt_no}</span><span className="block font-medium">{name(p.student_id)}{p.kind === "reversal" ? " (reversal)" : ""}</span></span>
            <span className="text-right font-semibold">{leo(p.amount)}<span className="block text-xs font-normal text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span></span></Link></li>))}
        {pays.data?.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">No payments recorded yet.</li>}
      </ul>
    </>
  );
}

function ReceiptPage() {
  const { id } = Route.useSearch();
  return id ? <ReceiptView id={id} /> : <ReceiptList />;
}

function ReceiptView({ id }: { id: string }) {
  const { data: students } = useSuspenseQuery(studentsQuery);
  const pay = useQuery(paymentQuery(id)), settings = useQuery(settingsQuery), balances = useQuery(balancesQuery);
  const [format, setFormat] = useState<"a4" | "thermal">("a4");
  if (pay.isLoading) return <p className="py-20 text-center text-muted-foreground">Loading receipt…</p>;
  const p = pay.data;
  if (!p) return <p className="py-20 text-center text-muted-foreground">Receipt not found, or you do not have access to it.</p>;
  const student = students.find((x) => x.id === p.student_id);
  const bal = balances.data?.find((b) => b.student_id === p.student_id)?.balance;
  const sel = p.method === "Cash" ? "Cash" : p.method === "Bank" ? "Cheque" : "Other";
  const paidBy = ["Cash", "Cheque", "Other"];
  const d = new Date(p.created_at);
  const isRev = p.kind === "reversal";
  return (
    <>
      <div className="no-print"><PageHeader title="GIA Receipt" subtitle="Digital receipt — print on A4 or thermal paper, or save as PDF." actions={<>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">{(["a4", "thermal"] as const).map((f) => <button key={f} onClick={() => setFormat(f)} className={`h-8 rounded-md px-3 text-xs font-semibold uppercase ${format === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>{f}</button>)}</div>
        <Button variant="outline" onClick={() => window.print()}><Download />PDF</Button>
        <Button onClick={() => window.print()}><Printer />Print</Button>
      </>} /></div>
      <div className={`mx-auto border-2 border-primary bg-paper p-1 shadow-md ${format === "a4" ? "max-w-2xl" : "max-w-xs"}`}>
        <div className={`border border-primary/60 ${format === "a4" ? "p-8" : "p-4"}`}>
          <div className={`flex items-center gap-4 border-b-2 border-double border-primary pb-4 ${format === "thermal" ? "flex-col text-center" : ""}`}>
            <Crest className={format === "a4" ? "h-20 w-16 shrink-0" : "h-14 w-12"} />
            <div className={`flex-1 ${format === "a4" ? "text-center" : ""}`}>
              <div className={`font-display font-bold uppercase text-primary ${format === "a4" ? "text-xl" : "text-sm"}`}>{settings.data?.school_name ?? SCHOOL.name} (GIA)</div>
              <div className="mt-1 text-xs">{settings.data?.address ?? "New Jersey, Makama, Makeni, Sierra Leone"}</div>
              <div className="mt-1 text-[10px] italic text-gold">{settings.data?.motto ?? SCHOOL.tagline}</div>
            </div>
          </div>
          <div className="my-5 flex items-center justify-between gap-3">
            <span className="text-xs">No. <span className="font-mono text-base font-bold text-destructive">{p.receipt_no}</span></span>
            <span className="rounded border-2 border-primary px-4 py-1 font-display text-lg font-bold uppercase tracking-[0.2em] text-primary">{isRev ? "Reversal" : "Receipt"}</span>
            <span className="text-xs">Date: <b>{d.toLocaleDateString("en-GB")}</b></span>
          </div>
          <div className={`space-y-5 ${format === "thermal" ? "space-y-4" : ""}`}>
            <Line label={isRev ? "Refunded to" : "Received from"} value={student?.full_name ?? "-"} />
            <Line label="Pupil ID" value={`${student?.adm_no ?? "-"} · ${student?.class_name ?? ""}`} mono />
            <Line label="The sum of" value={`${words(p.amount)} Leones`} />
            <Line label={isRev ? "Reversal of payment for" : "Being part/full payment for"} value={`${p.purpose} – ${p.term} ${p.academic_year}`} />
            <div className={`grid gap-5 ${format === "a4" ? "grid-cols-2" : ""}`}>
              <Line label="NLe" value={p.amount.toLocaleString("en-US")} mono />
              <Line label="Balance now" value={bal === undefined ? "-" : leo(bal)} mono />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-display italic">Paid by:</span>
              {paidBy.map((m) => <span key={m} className="flex items-center gap-1.5"><span className={`grid h-4 w-4 place-items-center border border-foreground text-[10px] font-bold ${sel === m ? "bg-primary text-primary-foreground" : ""}`}>{sel === m ? "✓" : ""}</span>{m}</span>)}
              {p.method !== "Cash" && p.method !== "Bank" && <span className="text-xs text-muted-foreground">({p.method})</span>}
            </div>
            {isRev && p.reason && <p className="text-xs italic">Reason: {p.reason}</p>}
          </div>
          <div className={`mt-10 flex items-end justify-between gap-6 ${format === "thermal" ? "flex-col items-center text-center" : ""}`}>
            <div className="font-display text-lg italic text-primary">With Thanks</div>
            <div className="w-48 text-center"><div className="h-8" /><div className="border-t border-foreground/60 pt-1 text-xs">Signature</div></div>
          </div>
        </div>
      </div>
    </>
  );
}
