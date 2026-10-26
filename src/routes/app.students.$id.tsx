import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel, Status, Avatar } from "@/components/gia/kit";
import { leo } from "@/lib/mock";
import { studentQuery, studentPaymentsQuery, studentGradesQuery } from "@/lib/students";

export const Route = createFileRoute("/app/students/$id")({
  loader: async ({ context, params }) => {
    const s = await context.queryClient.ensureQueryData(studentQuery(params.id));
    if (!s) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(studentPaymentsQuery(params.id)),
      context.queryClient.ensureQueryData(studentGradesQuery(params.id)),
    ]);
  },
  notFoundComponent: () => <p className="py-20 text-center text-muted-foreground">Student not found.</p>,
  errorComponent: ({ error }) => <p className="py-20 text-center text-destructive">Could not load student: {(error as Error).message}</p>,
  component: Profile,
});

function Row({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>;
}

function Profile() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(studentQuery(id));
  const { data: pays } = useSuspenseQuery(studentPaymentsQuery(id));
  const { data: grades } = useSuspenseQuery(studentGradesQuery(id));
  if (!data) return null;
  const s = data;
  const paid = pays.filter((p) => p.status === "Completed").reduce((t, p) => t + Number(p.amount), 0);
  const due = Number(s.fees_due);
  return (
    <>
      <Link to="/app/students" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Students</Link>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
        <Avatar name={s.full_name} size="h-20 w-20 text-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-2xl font-bold text-primary">{s.full_name}</h1><Status value={s.status} /></div>
          <p className="text-sm text-muted-foreground">{s.adm_no} • {s.class_name}{s.house ? ` • ${s.house} House` : ""}</p>
        </div>
      </div>
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="h-auto flex-wrap justify-start">
          {["overview", "academics", "fees"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="overview" className="mt-4 grid gap-6 lg:grid-cols-2">
          <Panel title="Student Information"><dl className="grid grid-cols-2 gap-4 text-sm"><Row k="Date of Birth" v={s.dob ? new Date(s.dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"} /><Row k="Gender" v={s.gender === "M" ? "Male" : "Female"} /><Row k="Registered" v={new Date(s.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })} /><Row k="Class" v={s.class_name} /><Row k="House" v={s.house ?? "—"} /><Row k="Academic Year" v="2025/2026" /></dl></Panel>
          <Panel title="Parent / Guardian"><dl className="space-y-4 text-sm"><Row k="Name" v={s.guardian_name ?? "—"} /><div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" />{s.guardian_phone ?? "—"}</div></dl></Panel>
        </TabsContent>
        <TabsContent value="academics" className="mt-4"><Panel title="Grades">
          {grades.length === 0 ? <p className="text-sm text-muted-foreground">No grades entered yet.</p> : (
            <div className="space-y-3">{grades.map((g) => { const v = Number(g.test_score ?? 0) + Number(g.exam_score ?? 0); return (
              <div key={g.id}><div className="flex justify-between text-sm"><span>{g.subject} <span className="text-muted-foreground">• {g.term}</span></span><span className="font-semibold">{v}</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, v)}%` }} /></div></div>
            ); })}</div>
          )}
        </Panel></TabsContent>
        <TabsContent value="fees" className="mt-4"><Panel title="Fee Summary">
          <dl className="grid grid-cols-3 gap-4 text-sm"><Row k="Balance due" v={leo(due)} /><Row k="Paid (recorded)" v={leo(paid)} /><div><dt className="text-xs text-muted-foreground">Status</dt><dd className={`font-bold ${due ? "text-destructive" : "text-success"}`}>{due ? "Owing" : "Cleared"}</dd></div></dl>
          {pays.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">No payments recorded yet.</p> : (
            <ul className="mt-5 divide-y text-sm">{pays.map((p) => <li key={p.id} className="flex justify-between py-2"><span>{p.receipt_no} • {p.purpose} • {new Date(p.created_at).toLocaleDateString("en-GB")}</span><span className="font-semibold">{leo(Number(p.amount))}</span></li>)}</ul>
          )}
        </Panel></TabsContent>
      </Tabs>
    </>
  );
}
