import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crest } from "@/components/gia/Crest";
import { Status } from "@/components/gia/kit";
import { students } from "@/lib/mock";

export const Route = createFileRoute("/app/grades")({ component: Grades });

type Term = { test: string; exam: string };
const pupils = students.slice(0, 12);
const terms = ["First Term", "Second Term", "Third Term"];

function Grades() {
  const [data, setData] = useState<Record<string, Term[]>>(() =>
    Object.fromEntries(pupils.map((p, i) => [p.id, [{ test: String(20 + (i * 3) % 18), exam: String(40 + (i * 7) % 45) }, { test: "", exam: "" }, { test: "", exam: "" }]])));
  const [status, setStatus] = useState("Draft");
  const upd = (id: string, t: number, k: keyof Term, v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 3);
    setData((d) => ({ ...d, [id]: d[id]!.map((x, i) => i === t ? { ...x, [k]: n } : x) }));
  };
  const min = (x: Term) => (x.test || x.exam) ? Math.round(((Number(x.test) || 0) + (Number(x.exam) || 0)) / 2) : "";
  const cell = "h-9 w-14 rounded border border-input bg-card text-center text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20";
  return (
    <>
      <div className="rounded-xl border-2 border-primary bg-paper shadow-sm">
        <div className="flex flex-col items-center gap-2 border-b-2 border-primary p-5 text-center sm:flex-row sm:text-left">
          <Crest className="h-14 w-12 shrink-0" />
          <div className="flex-1">
            <div className="font-display font-bold uppercase text-primary">Gbonkolenken International Academy</div>
            <div className="font-display text-lg font-bold">Academic Grade Sheet • 2025 / 2026 • Secondary</div>
          </div>
          <Status value={status} />
        </div>
        <div className="grid gap-4 border-b p-5 text-sm sm:grid-cols-3">
          {[["Name of Teacher", "Mr. Abdul Sesay"], ["Subject", "Mathematics"], ["Level", "SSS 2 Science"]].map(([k, v]) => (
            <div key={k} className="flex items-end gap-2"><span className="shrink-0 font-display italic">{k}:</span><span className="flex-1 border-b border-dotted border-foreground/60 font-semibold text-primary">{v}</span></div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th rowSpan={2} className="sticky left-0 z-10 w-10 border border-primary-foreground/20 bg-primary px-2 py-2">No.</th>
                <th rowSpan={2} className="sticky left-10 z-10 min-w-[180px] border border-primary-foreground/20 bg-primary px-3 text-left">Pupils' Name</th>
                <th rowSpan={2} className="border border-primary-foreground/20 px-2">Adm. No</th>
                {terms.map((t) => <th key={t} colSpan={3} className="border border-primary-foreground/20 px-2 py-2 font-display">{t}</th>)}
              </tr>
              <tr className="bg-navy-deep text-xs text-gold">
                {terms.flatMap((t) => ["Test", "Exam", "Min"].map((h) => <th key={t + h} className="border border-primary-foreground/20 px-2 py-1.5">{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {pupils.map((p, i) => (
                <tr key={p.id} className="odd:bg-card even:bg-muted/60">
                  <td className="sticky left-0 border bg-inherit px-2 text-center text-muted-foreground">{i + 1}</td>
                  <td className="sticky left-10 border bg-inherit px-3 py-1.5 font-medium">{p.name}</td>
                  <td className="border px-2 text-center font-mono text-xs">{p.adm}</td>
                  {data[p.id]!.map((t, ti) => (
                    <Fragment key={ti}>
                      <td key={`${ti}t`} className="border px-1 py-1 text-center"><input aria-label={`${p.name} ${terms[ti]} test`} className={cell} value={t.test} onChange={(e) => upd(p.id, ti, "test", e.target.value)} /></td>
                      <td key={`${ti}e`} className="border px-1 py-1 text-center"><input aria-label={`${p.name} ${terms[ti]} exam`} className={cell} value={t.exam} onChange={(e) => upd(p.id, ti, "exam", e.target.value)} /></td>
                      <td key={`${ti}m`} className="border bg-gold-soft px-2 text-center font-bold text-primary">{min(t)}</td>
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="sticky bottom-16 z-10 mt-4 flex justify-end gap-2 rounded-xl border bg-card p-3 shadow-md lg:bottom-4">
        <Button variant="outline" onClick={() => { setStatus("Draft"); toast.success("Draft saved"); }}><Save />Save Draft</Button>
        <Button variant="gold" onClick={() => { setStatus("Submitted"); toast.success("Grade sheet submitted to HOD for review"); }}><Send />Submit for Review</Button>
      </div>
    </>
  );
}
