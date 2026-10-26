import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCheck, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Avatar, inputCls } from "@/components/gia/kit";
import { students } from "@/lib/mock";

export const Route = createFileRoute("/app/attendance")({ component: Attendance });
const opts = ["Present", "Absent", "Late", "Excused"] as const;
type O = (typeof opts)[number];
const tone: Record<O, string> = { Present: "bg-success text-primary-foreground", Absent: "bg-destructive text-destructive-foreground", Late: "bg-warning text-primary-foreground", Excused: "bg-primary text-primary-foreground" };

function Attendance() {
  const list = students.slice(0, 10);
  const [m, setM] = useState<Record<string, O>>(() => Object.fromEntries(list.map((s, i) => [s.id, i === 3 ? "Absent" : i === 6 ? "Late" : "Present"])));
  const pct = Math.round((Object.values(m).filter((v) => v === "Present" || v === "Late").length / list.length) * 100);
  return (
    <>
      <PageHeader title="Attendance" subtitle="Sunday, 4 October 2026" actions={<select className={`${inputCls} h-10 w-40`}><option>JSS 1</option><option>JSS 2</option><option>SSS 1</option></select>} />
      <div className="mb-4 rounded-xl border bg-card p-4">
        <div className="flex justify-between text-sm"><span className="font-medium">Attendance rate</span><span className="font-bold text-primary">{pct}%</span></div>
        <div className="mt-2 h-2.5 rounded-full bg-muted"><div className="h-2.5 rounded-full bg-success transition-all" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="divide-y rounded-xl border bg-card">
        {list.map((s) => (
          <div key={s.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-3"><Avatar name={s.name} /><div className="min-w-0"><div className="truncate font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.adm}</div></div></div>
            <div className="grid grid-cols-4 gap-1">
              {opts.map((o) => <button key={o} onClick={() => setM({ ...m, [s.id]: o })} className={`h-10 rounded-md px-3 text-xs font-semibold transition ${m[s.id] === o ? tone[o] : "bg-muted text-muted-foreground"}`}>{o}</button>)}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-16 mt-4 flex justify-end gap-2 rounded-xl border bg-card p-3 shadow-md lg:bottom-4">
        <Button variant="outline" onClick={() => setM(Object.fromEntries(list.map((s) => [s.id, "Present" as O])))}><CheckCheck />Mark All Present</Button>
        <Button variant="gold" onClick={() => toast.success("Attendance saved")}><Save />Save Attendance</Button>
      </div>
    </>
  );
}
