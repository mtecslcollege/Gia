import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Receipt, FileText, Mail, ClipboardList, Sheet, ScrollText, Award, FolderCog, Eye, Printer, Download, GraduationCap, BookOpen, BadgeCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Stat, Status, Panel } from "@/components/gia/kit";
import { documents, docCategories } from "@/lib/mock";

export const Route = createFileRoute("/app/documents")({ component: Docs });
const icons = [Receipt, FileText, Mail, ClipboardList, Sheet, ScrollText, Award, FolderCog];
const queue = [
  { n: "Hawa Aminata Koroma", adm: "GIA/2023/2668", cls: "SSS 2 Science", gpa: "3.82", rank: "3rd / 42", doc: "Official Full Transcript", ref: "GIA-TRN-2026/0188", st: "Issued" },
  { n: "Musa Abu Koroma", adm: "GIA/2023/2672", cls: "SSS 2 Commercial", gpa: "3.65", rank: "7th / 42", doc: "Term 3 Fee Clearance", ref: "ROKEL-MAK-88912", st: "Published" },
  { n: "Fatmata Zainab Sesay", adm: "GIA/2021/0488", cls: "SSS 3 Arts", gpa: "3.91", rank: "1st / 38", doc: "WASSCE Admission Docket", ref: "WAEC 4160201088", st: "Approved" },
  { n: "Alhaji Mohamed Kamara", adm: "GIA/2021/0491", cls: "SSS 3 Sciences", gpa: "3.74", rank: "4th / 38", doc: "Official Full Transcript", ref: "GIA-TRN-2026/0191", st: "Pending" },
];

function Docs() {
  const [cat, setCat] = useState<string | null>(null);
  const list = documents.filter((d) => !cat || d.cat === cat);
  return (
    <>
      <PageHeader title="Document Center" subtitle="Official records, transcripts and certified documents • 2025/2026" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={GraduationCap} label="Sealed Transcripts" value="412" hint="+18 this week" />
        <Stat icon={BookOpen} label="Report Cards (Term 3)" value="1,386" hint="of 1,428 generated" tone="green" />
        <Stat icon={Receipt} label="Fee Clearance Slips" value="1,294" tone="gold" />
        <Stat icon={BadgeCheck} label="Exam Dockets" value="812" hint="SSS 1–3" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {docCategories.map((c, i) => { const I = icons[i]!; return (
          <button key={c} onClick={() => setCat(cat === c ? null : c)} className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${cat === c ? "border-primary bg-info-soft" : "bg-card hover:border-gold"}`}>
            <I className="h-6 w-6 text-primary" /><span className="text-sm font-semibold">{c}</span><span className="text-xs text-muted-foreground">{documents.filter((d) => d.cat === c).length} files</span>
          </button>
        ); })}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((d) => (
          <div key={d.name} className="flex flex-col rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2"><span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-bold">{d.type}</span><Status value={d.status} /></div>
            <div className="mt-3 flex-1 font-medium">{d.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{d.cat} • {d.date}</div>
            <div className="mt-4 grid grid-cols-3 gap-1 border-t pt-3">
              <Button variant="ghost" size="sm"><Eye />View</Button>
              <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer />Print</Button>
              <Button variant="ghost" size="sm" onClick={() => toast.success("Download started (prototype)")}><Download /></Button>
            </div>
          </div>
        ))}
      </div>
      <Panel title="Certified Transcript Queue" className="mt-6" action={<span className="flex items-center gap-1 text-xs font-semibold text-success"><ShieldCheck className="h-4 w-4" />Seal verification active</span>}>
        <ul className="divide-y">
          {queue.map((q) => (
            <li key={q.adm} className="grid gap-3 py-4 first:pt-0 md:grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0"><div className="font-semibold">{q.n}</div><div className="text-xs text-muted-foreground">{q.adm} • {q.cls}</div></div>
              <div className="text-sm"><span className="font-bold text-primary">GPA {q.gpa}</span><div className="text-xs text-muted-foreground">Rank {q.rank}</div></div>
              <div className="min-w-0 text-sm"><div className="truncate">{q.doc}</div><div className="truncate font-mono text-xs text-muted-foreground">{q.ref}</div></div>
              <div className="flex items-center gap-2"><Status value={q.st} /><Button size="sm" variant="outline"><Eye />Inspect</Button></div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
