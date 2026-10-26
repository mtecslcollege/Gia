import { createFileRoute, Link } from "@tanstack/react-router";
import { PenLine, CalendarCheck, Users, Megaphone } from "lucide-react";
import { PageHeader, Panel, Status } from "@/components/gia/kit";
import { notices } from "@/lib/mock";

export const Route = createFileRoute("/app/staff")({ component: StaffPortal });

function StaffPortal() {
  const qa = [
    { i: PenLine, l: "Enter Grades", to: "/app/grades" }, { i: CalendarCheck, l: "Take Attendance", to: "/app/attendance" },
    { i: Users, l: "View Students", to: "/app/students" }, { i: Megaphone, l: "Create Notice", to: "/app/communication" },
  ] as const;
  return (
    <>
      <PageHeader title="Welcome, Mr. Sesay" subtitle="Mathematics Department • Form Master, SSS 2 Science" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {qa.map((q) => <Link key={q.l} to={q.to} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 text-sm font-semibold transition hover:border-gold"><div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-gold"><q.i className="h-5 w-5" /></div>{q.l}</Link>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Assigned Classes"><ul className="space-y-2 text-sm">{["SSS 2 Science", "SSS 1 Arts", "JSS 3 B"].map((c) => <li key={c} className="rounded-md bg-muted px-3 py-2">{c}</li>)}</ul></Panel>
        <Panel title="Subjects"><ul className="space-y-2 text-sm"><li>Mathematics</li><li>Further Mathematics</li></ul></Panel>
        <Panel title="Pending Grade Entry"><ul className="divide-y text-sm">{([["SSS 2 Mathematics", "Draft"], ["JSS 3 Mathematics", "Returned"]] as [string, string][]).map(([a, b]) => <li key={a} className="flex justify-between py-2"><span>{a}</span><Status value={b} /></li>)}</ul></Panel>
        <Panel title="Attendance"><p className="text-sm">SSS 2 Science: <b className="text-success">not yet taken today</b></p></Panel>
        <Panel title="Notices" className="lg:col-span-2"><ul className="divide-y text-sm">{notices.slice(0, 3).map((n) => <li key={n.id} className="flex justify-between py-2"><span>{n.title}</span><span className="text-muted-foreground">{n.date}</span></li>)}</ul></Panel>
      </div>
    </>
  );
}
