import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageHeader, Panel, inputCls } from "@/components/gia/kit";
import { leo } from "@/lib/mock";
import { balancesQuery } from "@/lib/finance";

export const Route = createFileRoute("/app/finance/balances")({ component: Balances });

function Balances() {
  const bals = useQuery(balancesQuery);
  const [q, setQ] = useState(""); const [onlyOwing, setOnlyOwing] = useState(true);
  const rows = useMemo(() => (bals.data ?? []).filter((b) => (!onlyOwing || b.balance > 0) && (b.full_name + " " + b.adm_no).toLowerCase().includes(q.toLowerCase())), [bals.data, q, onlyOwing]);
  const total = rows.reduce((a, b) => a + Math.max(0, b.balance), 0);
  return (
    <>
      <PageHeader title="Fee Balances" subtitle={`${rows.length} pupils · outstanding ${leo(total)}`} />
      {bals.isError && <p className="mb-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">You do not have access to fee balances.</p>}
      <Panel>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or pupil ID" className={`${inputCls} pl-9`} /></div>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={onlyOwing} onChange={(e) => setOnlyOwing(e.target.checked)} />Only pupils who owe</label>
        </div>
        <div className="-mx-5 mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Pupil", "Class", "Charged", "Paid", "Balance", ""].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y">{rows.map((b) => (
              <tr key={b.student_id}><td className="px-5 py-3"><div className="font-medium">{b.full_name}</div><div className="font-mono text-xs text-muted-foreground">{b.adm_no}</div></td><td className="px-5 py-3">{b.class_name}</td><td className="px-5 py-3">{leo(b.charged)}</td><td className="px-5 py-3">{leo(b.paid)}</td><td className={`px-5 py-3 font-semibold ${b.balance > 0 ? "text-destructive" : ""}`}>{leo(b.balance)}</td><td className="px-5 py-3"><Link to="/app/students/$id" params={{ id: b.student_id }} className="text-primary hover:underline">Open</Link></td></tr>))}
              {!bals.isLoading && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nothing to show.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
