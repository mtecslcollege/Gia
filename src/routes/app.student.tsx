import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Avatar, Donut, Status } from "@/components/gia/kit";
import { students, leo, notices } from "@/lib/mock";

export const Route = createFileRoute("/app/student")({ component: StudentPortal });

function StudentPortal() {
  const s = students[1]!;
  return (
    <>
      <PageHeader title={`Welcome, ${s.name.split(" ")[0]}`} subtitle="Student Portal • First Term 2025/2026" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Profile"><div className="flex items-center gap-4"><Avatar name={s.name} size="h-16 w-16 text-lg" /><div><div className="font-semibold">{s.name}</div><div className="text-sm text-muted-foreground">{s.adm}</div><div className="mt-1 text-sm">Current class: <b>{s.cls}</b></div></div></div></Panel>
        <Panel title="Academic Performance"><div className="text-4xl font-bold text-primary">{s.average}%</div><p className="text-sm text-muted-foreground">Term average</p></Panel>
        <Panel title="Attendance"><Donut value={s.attendance} label="present" /></Panel>
        <Panel title="Fees"><div className="text-sm">Balance</div><div className={`text-2xl font-bold ${s.balance ? "text-destructive" : "text-success"}`}>{leo(s.balance)}</div></Panel>
        <Panel title="Recent Results"><ul className="divide-y text-sm">{["English", "Mathematics", "Biology"].map((x, i) => <li key={x} className="flex justify-between py-2"><span>{x}</span><b>{s.average - 4 + i * 4}</b></li>)}</ul></Panel>
        <Panel title="Notices"><ul className="divide-y text-sm">{notices.slice(0, 3).map((n) => <li key={n.id} className="flex items-center justify-between gap-2 py-2"><span className="truncate">{n.title}</span><Status value={n.priority} /></li>)}</ul></Panel>
      </div>
    </>
  );
}
