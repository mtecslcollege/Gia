import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Avatar, Donut, Status } from "@/components/gia/kit";
import { students, leo, payments, notices } from "@/lib/mock";

export const Route = createFileRoute("/app/parent")({ component: ParentPortal });

function ParentPortal() {
  const kids = [students[0]!, students[10]!];
  const [k, setK] = useState(0);
  const c = kids[k]!;
  return (
    <>
      <PageHeader title="Welcome, Parent" subtitle="Alhaji Kamara • 2 children at GIA" />
      <div className="grid gap-3 sm:grid-cols-2">
        {kids.map((s, i) => (
          <button key={s.id} onClick={() => setK(i)} className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${k === i ? "border-primary bg-info-soft ring-2 ring-primary/15" : "bg-card"}`}>
            <Avatar name={s.name} size="h-14 w-14 text-base" />
            <div><div className="font-semibold text-primary">{s.name}</div><div className="text-sm text-muted-foreground">{s.adm} • {s.cls}</div></div>
          </button>
        ))}
      </div>
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="h-auto flex-wrap justify-start">{["overview", "results", "attendance", "fees", "receipts", "notices"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}</TabsList>
        <TabsContent value="overview" className="mt-4 grid gap-6 lg:grid-cols-3">
          <Panel title="Fee Summary">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt>Total Fees</dt><dd className="font-semibold">{leo(2400000)}</dd></div>
              <div className="flex justify-between"><dt>Paid</dt><dd className="font-semibold text-success">{leo(2400000 - c.balance)}</dd></div>
              <div className="flex justify-between border-t pt-3"><dt className="font-semibold">Balance</dt><dd className="font-bold text-destructive">{leo(c.balance)}</dd></div>
            </dl>
          </Panel>
          <Panel title="Academic Performance"><div className="text-4xl font-bold text-primary">{c.average}%</div><p className="text-sm text-muted-foreground">Term 1 average • Position 6 of 42</p></Panel>
          <Panel title="Attendance"><Donut value={c.attendance} label="this term" /></Panel>
        </TabsContent>
        <TabsContent value="results" className="mt-4"><Panel title="Term 1 Results"><ul className="divide-y text-sm">{["English", "Mathematics", "Science", "Social Studies"].map((s, i) => <li key={s} className="flex justify-between py-2"><span>{s}</span><span className="font-semibold">{c.average - 5 + i * 3}</span></li>)}</ul></Panel></TabsContent>
        <TabsContent value="attendance" className="mt-4"><Panel title="Attendance"><Donut value={c.attendance} label="present" /></Panel></TabsContent>
        <TabsContent value="fees" className="mt-4"><Panel title="Fees">Outstanding balance: <b className="text-destructive">{leo(c.balance)}</b></Panel></TabsContent>
        <TabsContent value="receipts" className="mt-4"><Panel title="Receipts"><ul className="divide-y text-sm">{payments.slice(0, 3).map((p) => <li key={p.no} className="flex items-center justify-between py-2"><span>{p.no} • {leo(p.amount)}</span><Button asChild size="sm" variant="outline"><Link to="/app/finance/receipt">View</Link></Button></li>)}</ul></Panel></TabsContent>
        <TabsContent value="notices" className="mt-4"><Panel title="Notices"><ul className="divide-y text-sm">{notices.filter((n) => n.status === "Published").map((n) => <li key={n.id} className="flex justify-between py-2"><span>{n.title}</span><Status value={n.priority} /></li>)}</ul></Panel></TabsContent>
      </Tabs>
    </>
  );
}
