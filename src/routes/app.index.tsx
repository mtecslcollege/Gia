import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Briefcase, UserCheck, UserPlus, Wallet, CalendarCheck, UserRoundPlus, Receipt, PenLine, Megaphone, GraduationCap, FileCheck2 } from "lucide-react";
import { PageHeader, Panel, Stat, Bars, Line, Donut, Status } from "@/components/gia/kit";
import { activities, notices } from "@/lib/mock";

export const Route = createFileRoute("/app/")({ component: Dashboard });

const icons = { student: GraduationCap, payment: Receipt, result: FileCheck2, admission: UserPlus };

function Dashboard() {
  return (
    <>
      <PageHeader title="Good morning, Principal" subtitle="Here's what's happening at GIA today — Sunday, 4 October 2026." />
      <div className="mb-6 flex gap-3 rounded-xl border-l-4 border-l-gold bg-gold-soft p-4 text-sm">
        <span className="font-semibold text-primary">Bursary Directive:</span>
        <span className="text-foreground/80">All SSS tuition and WASSCE mock fees should be paid to the school bank account. Present teller slips at the bursary for an official GIA receipt. <span className="font-mono text-xs">Ref GIA/BUR/25/08</span></span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat icon={Users} label="Total Students" value="1,248" hint="+36 this term" />
        <Stat icon={Briefcase} label="Total Staff" value="86" hint="64 teaching • 22 support" />
        <Stat icon={UserCheck} label="Parents" value="1,012" />
        <Stat icon={UserPlus} label="Pending Admissions" value="42" tone="gold" />
        <Stat icon={Wallet} label="Outstanding Fees" value="NLe 285,600" tone="red" hint="Across 214 students" />
        <Stat icon={CalendarCheck} label="Today's Attendance" value="96%" tone="green" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Student Enrollment"><Bars data={[182, 240, 214, 228, 196, 188]} labels={["KG", "Pri", "JSS1", "JSS2", "SSS1", "SSS2"]} /></Panel>
        <Panel title="Fee Collection (NLe '000)"><Line data={[120, 180, 160, 240, 210, 290]} labels={["May", "Jun", "Jul", "Aug", "Sep", "Oct"]} /></Panel>
        <Panel title="Attendance Today"><Donut value={96} label="1,198 present" /></Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Recent Activities">
          <ul className="space-y-4">
            {activities.map((a) => { const I = icons[a.kind as keyof typeof icons]; return (
              <li key={a.text} className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-info-soft text-primary"><I className="h-4 w-4" /></div><div className="min-w-0"><div className="text-sm">{a.text}</div><div className="text-xs text-muted-foreground">{a.time}</div></div></li>
            ); })}
          </ul>
        </Panel>
        <Panel title="Announcements" action={<Link to="/app/communication" className="text-xs font-semibold text-primary">View all</Link>}>
          <ul className="divide-y">
            {notices.slice(0, 4).map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-3 first:pt-0"><div className="min-w-0"><div className="truncate text-sm font-medium">{n.title}</div><div className="text-xs text-muted-foreground">{n.date}</div></div><Status value={n.status} /></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            {[
              { i: UserRoundPlus, l: "Register Student", to: "/app/students" },
              { i: Receipt, l: "Record Payment", to: "/app/finance/payment" },
              { i: PenLine, l: "Enter Grades", to: "/app/grades" },
              { i: Megaphone, l: "Create Notice", to: "/app/communication" },
            ].map((q) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Link key={q.l} to={q.to as any} className="flex flex-col items-center gap-2 rounded-lg border bg-background p-4 text-center text-sm font-medium transition hover:border-gold"><q.i className="h-6 w-6 text-primary" />{q.l}</Link>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Senior Secondary Continuous Assessment — SSS 3" className="mt-6" action={<Link to="/app/grades" className="text-xs font-semibold text-primary">Open grade sheet</Link>}>
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr>{["Adm No", "Pupil", "Test (30)", "Exam (70)", "Total", "Grade", "Status"].map((h) => <th key={h} className="px-5 py-2.5">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {[["GIA-2022-014", "Kamara, Aminata B.", 27.5, 61, "A1", "Approved"], ["GIA-2022-045", "Sesay, Mohamed L.", 23, 54, "B2", "Approved"], ["GIA-2022-089", "Kallon, Fatmata S.", 25, 58.5, "A1", "Approved"], ["GIA-2023-112", "Bangura, Alusine G.", 18.5, 44, "B3", "Pending"]].map(([a, n, t, e, g, s]) => (
                <tr key={a as string}><td className="px-5 py-2.5 font-mono text-xs">{a}</td><td className="px-5 py-2.5 font-medium">{n}</td><td className="px-5 py-2.5">{t}</td><td className="px-5 py-2.5">{e}</td><td className="px-5 py-2.5 font-bold text-primary">{(t as number) + (e as number)}</td><td className="px-5 py-2.5 font-semibold">{g}</td><td className="px-5 py-2.5"><Status value={s as string} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
