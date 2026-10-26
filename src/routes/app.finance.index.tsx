import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Banknote, CalendarRange, AlertCircle, ArrowLeftRight, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Stat, Line, Status } from "@/components/gia/kit";
import { leo } from "@/lib/mock";
import { studentsQuery } from "@/lib/students";
import { paymentsQuery, balancesQuery, signedAmount } from "@/lib/finance";

export const Route = createFileRoute("/app/finance/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(studentsQuery),
  component: Finance,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Finance() {
  const { data: students } = useSuspenseQuery(studentsQuery);
  const pays = useQuery(paymentsQuery), bals = useQuery(balancesQuery);
  const name = (id: string) => students.find((s) => s.id === id)?.full_name ?? "Unknown pupil";
  const stats = useMemo(() => {
    const now = new Date(); const rows = pays.data ?? [];
    const sameDay = (d: Date) => d.toDateString() === now.toDateString();
    const sameMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    let today = 0, month = 0; const buckets: number[] = []; const labels: string[] = [];
    for (let i = 5; i >= 0; i--) { const m = new Date(now.getFullYear(), now.getMonth() - i, 1); labels.push(MONTHS[m.getMonth()]!); buckets.push(0); }
    for (const p of rows) {
      const d = new Date(p.created_at), v = signedAmount(p);
      if (sameDay(d)) today += v; if (sameMonth(d)) month += v;
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
      if (diff >= 0 && diff < 6) buckets[5 - diff]! += v / 1e6;
    }
    return { today, month, buckets: buckets.map((b) => Math.round(b * 100) / 100), labels };
  }, [pays.data]);
  const outstanding = (bals.data ?? []).reduce((a, b) => a + Math.max(0, b.balance), 0);
  const denied = pays.isError;

  return (
    <>
      <PageHeader title="Finance" subtitle="Confirmed payments and balances" actions={<>
        <Button asChild variant="outline"><Link to="/app/finance/receipt"><Receipt />View Receipts</Link></Button>
        <Button asChild variant="gold"><Link to="/app/finance/payment"><Plus />Record Payment</Link></Button>
      </>} />
      {denied && <p className="mb-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">You do not have access to finance records. Ask the school administrator if you need it.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Banknote} label="Today's Collections" value={pays.isLoading ? "…" : leo(stats.today)} tone="green" />
        <Stat icon={CalendarRange} label="This Month" value={pays.isLoading ? "…" : leo(stats.month)} />
        <Stat icon={AlertCircle} label="Outstanding Fees" value={bals.isLoading ? "…" : leo(outstanding)} tone="red" hint="Charges minus payments" />
        <Stat icon={ArrowLeftRight} label="Transactions (latest 500)" value={pays.isLoading ? "…" : String((pays.data ?? []).length)} tone="gold" />
      </div>
      <Panel title="Fee Collection (NLe millions, last 6 months)" className="mt-6"><Line data={stats.buckets} labels={stats.labels} /></Panel>
      <Panel title="Recent Payments" className="mt-6">
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Receipt No", "Student", "Amount", "Purpose", "Method", "Date", "Status"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {(pays.data ?? []).slice(0, 20).map((p) => (
                <tr key={p.id}><td className="px-5 py-3 font-mono text-xs"><Link to="/app/finance/receipt" search={{ id: p.id }} className="text-primary hover:underline">{p.receipt_no}</Link></td><td className="px-5 py-3 font-medium">{name(p.student_id)}</td><td className="px-5 py-3 font-semibold">{p.kind === "reversal" ? "−" : ""}{leo(p.amount)}</td><td className="px-5 py-3">{p.purpose}</td><td className="px-5 py-3">{p.method}</td><td className="px-5 py-3">{new Date(p.created_at).toLocaleDateString("en-GB")}</td><td className="px-5 py-3"><Status value={p.kind === "reversal" ? "Reversed" : p.status} /></td></tr>
              ))}
              {!pays.isLoading && (pays.data ?? []).length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No payments recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
