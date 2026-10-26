import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { KeyRound, Copy, Printer, Ban, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Status, Field, inputCls } from "@/components/gia/kit";
import { Modal, btnGhost, btnPrimary } from "@/components/gia/Modal";
import { studentsQuery } from "@/lib/students";
import { termsQuery, classesQuery, pinsQuery, issuePin, issuePinsForClass, revokePin, type IssuedPin, type PinRow } from "@/lib/result-pins";

export const Route = createFileRoute("/app/result-pins")({
  loader: ({ context }) => context.queryClient.ensureQueryData(studentsQuery),
  errorComponent: ({ error }) => <p className="py-20 text-center text-destructive">Could not load: {(error as Error).message}</p>,
  component: ResultPins,
});

const show = (p: string) => `${p.slice(0, 5)}-${p.slice(5)}`;

function ResultPins() {
  const { data: students } = useSuspenseQuery(studentsQuery);
  const terms = useQuery(termsQuery), classes = useQuery(classesQuery), pins = useQuery(pinsQuery);
  const qc = useQueryClient();
  const [termId, setTermId] = useState(""); const [classId, setClassId] = useState(""); const [q, setQ] = useState("");
  const [studentId, setStudentId] = useState(""); const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<IssuedPin[] | null>(null);          // plaintext lives only in this state
  const [reasonFor, setReasonFor] = useState<{ kind: "revoke" | "reissue"; pin: PinRow } | null>(null);
  const [reason, setReason] = useState("");

  const termLabel = (id: string) => { const t = terms.data?.find((x) => x.id === id); return t ? `${t.name}, ${t.academic_years?.name ?? ""}` : "-"; };
  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const matches = useMemo(() => q.length < 2 ? [] : students.filter((s) => (s.full_name + " " + s.adm_no).toLowerCase().includes(q.toLowerCase())).slice(0, 6), [q, students]);
  const activeFor = (sid: string) => pins.data?.find((p) => p.student_id === sid && p.term_id === termId && p.status === "active");
  const refresh = () => qc.invalidateQueries({ queryKey: ["result-pins"] });
  const run = async (f: () => Promise<void>) => { setBusy(true); try { await f(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } };

  const issueOne = () => run(async () => {
    const s = byId.get(studentId); if (!s) return;
    const pin = await issuePin(s.id, termId);
    setIssued([{ student_id: s.id, adm_no: s.adm_no, full_name: s.full_name, pin }]); setStudentId(""); setQ(""); refresh();
  });
  const issueClass = () => run(async () => {
    const rows = await issuePinsForClass(classId, termId);
    if (rows.length === 0) { toast.info("Every enrolled pupil in this class already has an active PIN."); return; }
    setIssued(rows); refresh();
  });
  const confirmReason = () => run(async () => {
    if (!reasonFor) return;
    if (reasonFor.kind === "revoke") { await revokePin(reasonFor.pin.id, reason); toast.success("PIN revoked"); }
    else { const pin = await issuePin(reasonFor.pin.student_id, reasonFor.pin.term_id, reason); const s = byId.get(reasonFor.pin.student_id);
      setIssued([{ student_id: reasonFor.pin.student_id, adm_no: s?.adm_no ?? "", full_name: s?.full_name ?? "", pin }]); }
    setReasonFor(null); setReason(""); refresh();
  });

  const needTerm = !termId;
  return (
    <>
      <PageHeader title="Result PINs" subtitle="Issue, reissue and revoke the PIN parents use at /results" />
      {terms.data?.length === 0 && <p className="mb-4 rounded-lg bg-gold-soft p-3 text-sm">No examination sessions exist yet. Create the academic year and terms first.</p>}
      <div className="grid gap-4 lg:grid-cols-2 print:hidden">
        <Panel title="1. Choose the examination session">
          <Field label="Term / session"><select className={inputCls} value={termId} onChange={(e) => setTermId(e.target.value)}>
            <option value="">Select a session…</option>{terms.data?.map((t) => <option key={t.id} value={t.id}>{t.name}, {t.academic_years?.name}</option>)}</select></Field>
          <p className="mt-2 text-xs text-muted-foreground">A PIN opens only this session and only the published results of one pupil.</p>
        </Panel>
        <Panel title="2. Issue to one pupil">
          <Field label="Search pupil (name or ID)"><input className={inputCls} value={q} onChange={(e) => { setQ(e.target.value); setStudentId(""); }} placeholder="Type at least 2 letters" /></Field>
          {matches.length > 0 && !studentId && <ul className="mt-2 divide-y rounded-lg border">{matches.map((s) => (
            <li key={s.id}><button className="flex min-h-12 w-full items-center justify-between px-3 text-left text-sm hover:bg-muted" onClick={() => { setStudentId(s.id); setQ(`${s.full_name} (${s.adm_no})`); }}><span>{s.full_name}</span><span className="font-mono text-xs text-muted-foreground">{s.adm_no}</span></button></li>))}</ul>}
          {studentId && activeFor(studentId) && <p className="mt-2 text-xs text-destructive">This pupil already has an active PIN for this session. Use Reissue in the list below.</p>}
          <button className={`${btnPrimary} mt-3 h-12 w-full justify-center`} disabled={busy || needTerm || !studentId || !!activeFor(studentId)} onClick={issueOne}><KeyRound className="h-4 w-4" />Generate PIN</button>
        </Panel>
        <Panel title="3. Issue to a whole class" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Class (enrolled pupils without an active PIN)"><select className={inputCls} value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Select a class…</option>{classes.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <button className={`${btnPrimary} h-11 justify-center`} disabled={busy || needTerm || !classId} onClick={issueClass}><KeyRound className="h-4 w-4" />Generate for class</button>
          </div>
        </Panel>
      </div>

      <div className="mt-4 print:hidden">
        <Panel title={`PIN status${termId ? ` for ${termLabel(termId)}` : ""}`}>
          {!termId ? <p className="text-sm text-muted-foreground">Select a session to see its PINs.</p> : (
            <ul className="divide-y">
              {(pins.data ?? []).filter((p) => p.term_id === termId).map((p) => { const s = byId.get(p.student_id); return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <div className="min-w-0 flex-1"><div className="font-medium">{s?.full_name ?? "Unknown pupil"}</div><div className="text-xs text-muted-foreground"><span className="font-mono">{s?.adm_no}</span> · issued {new Date(p.issued_at).toLocaleDateString()}{p.revoke_reason ? ` · ${p.revoke_reason}` : ""}</div></div>
                  <Status value={p.status === "active" ? "Active" : "Revoked"} />
                  {p.status === "active" && <div className="flex gap-2">
                    <button className={btnGhost} onClick={() => setReasonFor({ kind: "reissue", pin: p })}><RefreshCw className="h-4 w-4" />Reissue</button>
                    <button className={btnGhost} onClick={() => setReasonFor({ kind: "revoke", pin: p })}><Ban className="h-4 w-4" />Revoke</button></div>}
                </li>); })}
              {(pins.data ?? []).filter((p) => p.term_id === termId).length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No PINs issued for this session yet.</li>}
            </ul>)}
        </Panel>
      </div>

      {issued && (
        <div className="print:hidden"><Modal title={issued.length > 1 ? `${issued.length} PINs generated` : "PIN generated"} onClose={() => setIssued(null)}
          footer={<><button className={btnGhost} onClick={() => window.print()}><Printer className="h-4 w-4" />Print slips</button>
            {issued.length === 1 && <button className={btnGhost} onClick={() => { navigator.clipboard.writeText(issued[0]!.pin); toast.success("Copied"); }}><Copy className="h-4 w-4" />Copy</button>}
            <button className={btnPrimary} onClick={() => setIssued(null)}>I have recorded them</button></>}>
          <p className="rounded-lg bg-gold-soft p-3 text-sm font-medium">These PINs are shown only once and cannot be recovered. Print the slips or hand them over now; to replace a lost PIN you must reissue it.</p>
          <ul className="divide-y">{issued.map((r) => <li key={r.student_id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{r.full_name}<span className="block font-mono text-xs text-muted-foreground">{r.adm_no}</span></span><b className="font-mono text-base tracking-widest">{show(r.pin)}</b></li>)}</ul>
        </Modal></div>
      )}
      {reasonFor && (
        <Modal title={reasonFor.kind === "revoke" ? "Revoke PIN" : "Reissue PIN"} onClose={() => { setReasonFor(null); setReason(""); }}
          footer={<><button className={btnGhost} onClick={() => { setReasonFor(null); setReason(""); }}>Cancel</button><button className={btnPrimary} disabled={busy || reason.trim().length < 5} onClick={confirmReason}>{reasonFor.kind === "revoke" ? "Revoke PIN" : "Revoke old and issue new"}</button></>}>
          <p className="text-sm">{byId.get(reasonFor.pin.student_id)?.full_name}: the current PIN stops working immediately.</p>
          <Field label={reasonFor.kind === "reissue" ? "Reason (e.g. parent identity checked at the office)" : "Reason (e.g. PIN shared publicly)"}><textarea className={`${inputCls} h-24 py-2`} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        </Modal>
      )}

      {/* print-only slips: one card per pupil */}
      {issued && <div className="hidden print:block"><div className="grid grid-cols-2 gap-4">{issued.map((r) => (
        <div key={r.student_id} className="break-inside-avoid rounded border border-black p-4 text-sm">
          <div className="font-bold">Gbonkolenken International Academy</div><div>Online result checker: {typeof window !== "undefined" ? window.location.origin : ""}/results</div>
          <div className="mt-2">Pupil: <b>{r.full_name}</b></div><div>Pupil ID: <b className="font-mono">{r.adm_no}</b></div>
          <div className="mt-1">PIN: <b className="font-mono text-lg tracking-widest">{show(r.pin)}</b></div>
          <div className="mt-2 text-xs">Keep this PIN private. It shows published results only.</div></div>))}</div></div>}
    </>
  );
}
