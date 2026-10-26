import { createFileRoute } from "@tanstack/react-router";
<<<<<<< HEAD
import { useState } from "react";
import { toast } from "sonner";
import { Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Status, Stat } from "@/components/gia/kit";
import { applications } from "@/lib/mock";
import { Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/app/admissions")({ component: Admissions });

function Admissions() {
  const [rows, setRows] = useState(applications);
  const set = (id: string, status: string) => { setRows((r) => r.map((x) => x.id === id ? { ...x, status } : x)); toast.success(`Application ${id} ${status.toLowerCase()}`); };
  return (
    <>
      <PageHeader title="Admissions" subtitle="Applications for the 2026/2027 academic year" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} label="Total Applications" value="142" />
        <Stat icon={Clock} label="Pending Review" value="42" tone="gold" />
        <Stat icon={CheckCircle2} label="Approved" value="87" tone="green" />
        <Stat icon={XCircle} label="Rejected" value="13" tone="red" />
      </div>
      <div className="mt-6 space-y-3">
        {rows.map((a) => (
          <div key={a.id} className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{a.name}</span><Status value={a.status} /></div>
              <div className="mt-1 text-sm text-muted-foreground">{a.id} • {a.level} • {a.guardian} • {a.date}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => set(a.id, "Rejected")}><XIcon />Reject</Button>
              <Button size="sm" onClick={() => set(a.id, "Approved")}><Check />Approve</Button>
            </div>
          </div>
        ))}
      </div>
=======
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X as XIcon, Eye, UserPlus, Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Status, Stat, Field, inputCls } from "@/components/gia/kit";
import { Modal, btnGhost, btnPrimary } from "@/components/gia/Modal";
import { applicationsQuery, decideApplication, admitApplication, setAdmissionsOpen, type ApplicationRow } from "@/lib/admissions";
import { classesQuery } from "@/lib/result-pins";
import { settingsQuery } from "@/lib/finance";

export const Route = createFileRoute("/app/admissions")({ component: Admissions });

const FILTERS = ["All", "Pending", "Under review", "Approved", "Admitted", "Rejected"] as const;

function Admissions() {
  const apps = useQuery(applicationsQuery), classes = useQuery(classesQuery), settings = useQuery(settingsQuery);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [reject, setReject] = useState<ApplicationRow | null>(null); const [note, setNote] = useState("");
  const [admit, setAdmit] = useState<ApplicationRow | null>(null); const [classId, setClassId] = useState("");
  const [result, setResult] = useState<{ adm_no: string; name: string; enrolled: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = apps.data ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const shown = useMemo(() => rows.filter((r) => filter === "All" || r.status === filter), [rows, filter]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["applications"] });
  const run = async (f: () => Promise<void>) => { setBusy(true); try { await f(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } };
  const decide = (a: ApplicationRow, s: "Under review" | "Approved") => run(async () => { await decideApplication(a.id, s); toast.success(`${a.ref} marked ${s.toLowerCase()}`); refresh(); });
  const doReject = () => run(async () => { if (!reject) return; await decideApplication(reject.id, "Rejected", note); toast.success(`${reject.ref} rejected`); setReject(null); setNote(""); refresh(); });
  const doAdmit = () => run(async () => {
    if (!admit || !classId) return;
    const r = await admitApplication(admit.id, classId);
    setResult({ adm_no: r.adm_no, name: admit.pupil_name, enrolled: r.enrolled }); setAdmit(null); setClassId("");
    refresh(); qc.invalidateQueries({ queryKey: ["students"] });
  });
  const open = (settings.data as { admissions_open?: boolean } | null)?.admissions_open;

  return (
    <>
      <PageHeader title="Admissions" subtitle="Applications from the online form" actions={
        <Button variant="outline" disabled={busy} onClick={() => run(async () => { await setAdmissionsOpen(!(open ?? true)); toast.success(open === false ? "Online applications opened" : "Online applications closed"); qc.invalidateQueries({ queryKey: ["school-settings"] }); })}>
          {open === false ? "Open applications" : "Close applications"}</Button>} />
      {apps.isError && <p className="mb-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">You do not have access to admissions.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} label="Total Applications" value={String(rows.length)} />
        <Stat icon={Clock} label="Pending Review" value={String(count("Pending") + count("Under review"))} tone="gold" />
        <Stat icon={CheckCircle2} label="Approved / Admitted" value={String(count("Approved") + count("Admitted"))} tone="green" />
        <Stat icon={XCircle} label="Rejected" value={String(count("Rejected"))} tone="red" />
      </div>
      <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1">{FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={`h-10 shrink-0 rounded-full border px-4 text-sm font-medium ${filter === f ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{f}{f !== "All" ? ` (${count(f)})` : ""}</button>)}</div>
      <div className="mt-4 space-y-3">
        {shown.map((a) => (
          <div key={a.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{a.pupil_name}</span><Status value={a.status} /></div>
                <div className="mt-1 text-sm text-muted-foreground">{a.ref} • {a.class_applied || a.level} • {a.guardian_name} • <a className="underline" href={`tel:${a.guardian_phone}`}>{a.guardian_phone}</a> • {new Date(a.created_at).toLocaleDateString("en-GB")}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {a.status === "Pending" && <Button size="sm" variant="outline" disabled={busy} onClick={() => decide(a, "Under review")}><Eye />Review</Button>}
                {(a.status === "Pending" || a.status === "Under review") && <>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setReject(a)}><XIcon />Reject</Button>
                  <Button size="sm" disabled={busy} onClick={() => decide(a, "Approved")}><Check />Approve</Button></>}
                {a.status === "Approved" && <Button size="sm" variant="gold" disabled={busy} onClick={() => setAdmit(a)}><UserPlus />Admit</Button>}
              </div>
            </div>
            <details className="mt-3 text-sm"><summary className="cursor-pointer text-primary">Details</summary>
              <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">{([["Date of birth", a.dob], ["Gender", a.gender === "M" ? "Male" : "Female"], ["Stage", a.level], ["Department", a.department], ["Entry", [a.term, a.academic_year].filter(Boolean).join(", ")], ["Email", a.guardian_email], ["Address", a.address], ["Previous school", a.previous_school], ["Last class", a.last_class], ["Reason for leaving", a.reason_leaving], ["Decision note", a.decision_note]] as const).filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex gap-2"><dt className="text-muted-foreground">{k}:</dt><dd>{v}</dd></div>)}</dl></details>
          </div>
        ))}
        {!apps.isLoading && shown.length === 0 && <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">No applications to show.</p>}
      </div>

      {reject && <Modal title={`Reject ${reject.ref}`} onClose={() => { setReject(null); setNote(""); }} footer={<><button className={btnGhost} onClick={() => { setReject(null); setNote(""); }}>Cancel</button><button className={btnPrimary} disabled={busy || note.trim().length < 5} onClick={doReject}>Reject application</button></>}>
        <p className="text-sm">{reject.pupil_name}: a reason is required and is kept on the record.</p>
        <Field label="Reason"><textarea className={`${inputCls} h-24 py-2`} value={note} onChange={(e) => setNote(e.target.value)} /></Field></Modal>}
      {admit && <Modal title={`Admit ${admit.pupil_name}`} onClose={() => { setAdmit(null); setClassId(""); }} footer={<><button className={btnGhost} onClick={() => { setAdmit(null); setClassId(""); }}>Cancel</button><button className={btnPrimary} disabled={busy || !classId} onClick={doAdmit}>Admit and create pupil record</button></>}>
        <p className="text-sm">Applied for: <b>{admit.class_applied || admit.level}</b>. This creates the pupil record and gives the next pupil ID.</p>
        <Field label="Place in class"><select className={inputCls} value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Select a class…</option>{classes.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        {classes.data?.length === 0 && <p className="text-xs text-destructive">No classes exist yet. Add classes first.</p>}</Modal>}
      {result && <Modal title="Pupil admitted" onClose={() => setResult(null)} footer={<button className={btnPrimary} onClick={() => setResult(null)}>Done</button>}>
        <p className="text-sm"><b>{result.name}</b> now has pupil ID <b className="font-mono text-base">{result.adm_no}</b>.</p>
        <p className="text-xs text-muted-foreground">{result.enrolled ? "Enrolled in the current academic year." : "No current academic year is set, so enrolment still needs to be added."}</p></Modal>}
>>>>>>> 5ff510d (Fix repository configuration)
    </>
  );
}
