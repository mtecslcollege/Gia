import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, CornerUpLeft, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Status } from "@/components/gia/kit";
import { approvalStages } from "@/lib/mock";

export const Route = createFileRoute("/app/approval")({ component: Approval });

const sheets = [
  { t: "SSS 2 Mathematics", teacher: "Mr. A. Sesay", stage: 3 },
  { t: "JSS 3 English Language", teacher: "Mrs. F. Conteh", stage: 1 },
  { t: "SSS 1 Biology", teacher: "Mr. I. Koroma", stage: 0, returned: true },
  { t: "SSS 3 Economics", teacher: "Ms. A. Turay", stage: 6 },
];

function statusFor(stage: number, returned?: boolean) {
  if (returned) return "Returned";
  if (stage === 0) return "Draft";
  if (stage === 1) return "Submitted";
  if (stage >= 6) return "Published";
  if (stage === 5) return "Approved";
  return "Under Review";
}

function Approval() {
  const [rows, setRows] = useState(sheets);
  const [sel, setSel] = useState(0);
  const cur = rows[sel]!;
  const act = (dir: 1 | -1) => {
    setRows((r) => r.map((x, i) => i === sel ? { ...x, stage: Math.max(0, Math.min(6, x.stage + dir)), returned: dir === -1 } : x));
    toast.success(dir === 1 ? "Approved and forwarded" : "Returned to previous stage");
  };
  return (
    <>
      <PageHeader title="Result Approval" subtitle="Every grade sheet passes through six reviewers before publication." />
      <div className="mb-4 flex flex-wrap gap-2">{["Draft", "Submitted", "Under Review", "Approved", "Returned", "Published"].map((s) => <Status key={s} value={s} />)}</div>
      <Panel title={cur.t} action={<Status value={statusFor(cur.stage, cur.returned)} />}>
        <ol className="flex flex-col gap-0 md:flex-row md:items-start">
          {approvalStages.map((s, i) => {
            const done = i < cur.stage || cur.stage === 6, now = i === cur.stage && cur.stage !== 6;
            return (
              <li key={s} className="flex flex-1 items-center gap-3 md:flex-col md:gap-2 md:text-center">
                <div className="flex items-center md:w-full">
                  <div className={`hidden h-0.5 flex-1 md:block ${i === 0 ? "opacity-0" : done || now ? "bg-primary" : "bg-border"}`} />
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 ${done ? "border-success bg-success text-primary-foreground" : now ? (cur.returned ? "border-destructive bg-destructive-soft text-destructive" : "border-gold bg-gold-soft text-primary") : "border-border bg-card text-muted-foreground"}`}>
                    {done ? <Check className="h-5 w-5" /> : <Circle className="h-3 w-3 fill-current" />}
                  </div>
                  <div className={`hidden h-0.5 flex-1 md:block ${i === approvalStages.length - 1 ? "opacity-0" : done ? "bg-primary" : "bg-border"}`} />
                </div>
                <div className="py-2 text-sm"><div className={`font-medium ${now ? "text-primary" : ""}`}>{s}</div>{now && <div className="text-xs text-muted-foreground">{cur.returned ? "Returned" : "Awaiting action"}</div>}</div>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" disabled={cur.stage === 0 || cur.stage === 6} onClick={() => act(-1)}><CornerUpLeft />Return</Button>
          <Button disabled={cur.stage === 6} onClick={() => act(1)}><Check />{cur.stage === 5 ? "Publish Result" : "Approve & Forward"}</Button>
        </div>
      </Panel>
      <Panel title="Grade Sheets" className="mt-6">
        <ul className="divide-y">
          {rows.map((r, i) => (
            <li key={r.t}><button onClick={() => setSel(i)} className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 text-left text-sm ${i === sel ? "bg-info-soft" : "hover:bg-muted"}`}>
              <div className="min-w-0"><div className="truncate font-medium">{r.t}</div><div className="text-muted-foreground">{r.teacher} • at {approvalStages[r.stage]}</div></div>
              <Status value={statusFor(r.stage, r.returned)} />
            </button></li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
