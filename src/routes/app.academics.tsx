import { createFileRoute, Link } from "@tanstack/react-router";
import { School, BookOpen, Users, FileClock, FileCheck2 } from "lucide-react";
import { PageHeader, Panel, Stat, Status } from "@/components/gia/kit";

export const Route = createFileRoute("/app/academics")({ component: Academic });

const classes = [{ c: "SSS 2 Science", s: "Mathematics", n: 38 }, { c: "SSS 1 Arts", s: "Mathematics", n: 42 }, { c: "JSS 3 B", s: "Mathematics", n: 45 }];
const reviews = [{ t: "SSS 2 Mathematics", by: "Mr. A. Sesay", st: "Under Review" }, { t: "JSS 3 English", by: "Mrs. F. Conteh", st: "Submitted" }, { t: "SSS 1 Biology", by: "Mr. I. Koroma", st: "Returned" }];
const subs = [{ t: "JSS 1 Integrated Science", d: "03 Oct 2026", st: "Approved" }, { t: "SSS 3 Economics", d: "02 Oct 2026", st: "Published" }, { t: "JSS 2 French", d: "01 Oct 2026", st: "Draft" }];

function Academic() {
  return (
    <>
      <PageHeader title="Academics" subtitle="Academic Year 2025/2026 • First Term" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={School} label="Classes" value="32" />
        <Stat icon={BookOpen} label="Subjects" value="24" />
        <Stat icon={Users} label="Teachers" value="64" />
        <Stat icon={FileClock} label="Pending Grade Sheets" value="11" tone="gold" />
        <Stat icon={FileCheck2} label="Published Results" value="48" tone="green" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="My Classes"><ul className="divide-y">{classes.map((c) => <li key={c.c} className="flex justify-between py-3 text-sm first:pt-0"><div><div className="font-medium">{c.c}</div><div className="text-muted-foreground">{c.s}</div></div><span className="text-muted-foreground">{c.n} pupils</span></li>)}</ul></Panel>
        <Panel title="Pending Reviews" action={<Link to="/app/approval" className="text-xs font-semibold text-primary">Open workflow</Link>}><ul className="divide-y">{reviews.map((r) => <li key={r.t} className="flex items-center justify-between gap-2 py-3 text-sm first:pt-0"><div className="min-w-0"><div className="truncate font-medium">{r.t}</div><div className="text-muted-foreground">{r.by}</div></div><Status value={r.st} /></li>)}</ul></Panel>
        <Panel title="Recent Grade Submissions" action={<Link to="/app/grades" className="text-xs font-semibold text-primary">Enter grades</Link>}><ul className="divide-y">{subs.map((r) => <li key={r.t} className="flex items-center justify-between gap-2 py-3 text-sm first:pt-0"><div className="min-w-0"><div className="truncate font-medium">{r.t}</div><div className="text-muted-foreground">{r.d}</div></div><Status value={r.st} /></li>)}</ul></Panel>
      </div>
    </>
  );
}
