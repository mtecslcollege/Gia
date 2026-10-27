import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Check, Camera, FileUp, Printer, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/gia/kit";
import { ApplicationDocument, downloadPdf } from "@/components/gia/ApplicationDocument";
import { supabase } from "@/integrations/supabase/client";
import { submitApplication, finalizeApplication, type FileSpec, type UploadTicket } from "@/lib/admissions.functions";
import { blankFields, fullName, DISTRICTS, DOC_KINDS, EARLY, LEVELS, SSS, docRequired, type DocKind, type FieldKey, type Fields } from "@/lib/application-data";

const TITLES = ["Applicant", "Residence", "Guardian", "Academic", "Medical", "Documents", "Review"] as const;
const DRAFT = "gia_application_draft_v2";
const PHONE = /^[0-9+() -]{7,20}$/;
const SPAN: Record<number, string> = { 2: "sm:col-span-2", 3: "sm:col-span-3", 4: "sm:col-span-4", 6: "sm:col-span-6" };
const FIELD_LABEL: Record<string, string> = { surname: "the surname", first_name: "the first name", dob: "the date of birth", gender: "the gender", guardian_phone: "the phone number", guardian_email: "the email address", emergency_phone: "the emergency phone number", consent: "the declarations", signature_name: "your signature name" };
const years = () => { const d = new Date(); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return [`${y}/${y + 1}`, `${y + 1}/${y + 2}`]; };

type Photo = { url: string; blob: Blob };
type Done = { ref: string; duplicate: boolean; failed: DocKind[] | string[] };

function Fld({ k, label, req, span = 2, err, children }: { k: string; label: string; req?: boolean; span?: 2 | 3 | 4 | 6; err: boolean; children: React.ReactNode }) {
  return <div className={`flex flex-col gap-1 ${SPAN[span]}`}><label className="text-[13px] font-semibold" htmlFor={k}>{label}{req && <span className="text-destructive"> *</span>}{!req && <em className="ml-1 text-[11px] font-normal not-italic text-muted-foreground">optional</em>}</label>{children}{err && <span className="text-xs text-destructive">Please complete this field</span>}</div>;
}

export function ApplicationForm() {
  const [f, setF] = useState<Fields>(blankFields);
  const [step, setStep] = useState(0); const [reached, setReached] = useState(0);
  const [errs, setErrs] = useState<Set<string>>(new Set());
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [docs, setDocs] = useState<Partial<Record<DocKind, File>>>({});
  const [decl, setDecl] = useState({ a: false, b: false, c: false });
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const [done, setDone] = useState<Done | null>(null);
  const [banner, setBanner] = useState(""); const [website, setWebsite] = useState("");
  const tickets = useRef<{ kind: string; file: Blob; t: UploadTicket }[]>([]);
  const pick = useRef<DocKind | null>(null); const fileIn = useRef<HTMLInputElement>(null); const photoIn = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => { try { const d = JSON.parse(localStorage.getItem(DRAFT) ?? "null") as { f: Fields; photo?: string } | null; if (d?.f) { setF({ ...blankFields(), ...d.f });
    if (d.photo) fetch(d.photo).then((r) => r.blob()).then((blob) => setPhoto({ url: d.photo!, blob })); setBanner("Your saved draft was restored."); } } catch { /* ignore */ } }, []);
  const saveDraft = (msg = false) => { try { localStorage.setItem(DRAFT, JSON.stringify({ f, photo: photo?.url })); if (msg) setBanner("Draft saved on this device. Uploaded documents are not stored and must be added again."); } catch { if (msg) setBanner("Draft could not be saved in this browser."); } };

  const set = (k: FieldKey, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrs((p) => { if (!p.has(k)) return p; const n = new Set(p); n.delete(k); return n; }); };
  const bad = (k: string) => errs.has(k);
  const cls = (k: string) => `${inputCls} ${bad(k) ? "border-destructive bg-destructive-soft" : ""}`;
  const classes = useMemo(() => LEVELS[f.level] ?? [], [f.level]);
  const early = EARLY.includes(f.level), sss = f.level === SSS;

  const T = (k: FieldKey, label: string, o: { req?: boolean; span?: 2 | 3 | 4 | 6; type?: string; ph?: string } = {}) => (
    <Fld k={k} label={label} req={o.req ?? false} span={o.span ?? 2} err={bad(k)}><input id={k} type={o.type ?? "text"} className={cls(k)} value={f[k]} placeholder={o.ph} max={o.type === "date" ? new Date().toISOString().slice(0, 10) : undefined} onChange={(e) => set(k, e.target.value)} /></Fld>);
  const S = (k: FieldKey, label: string, opts: string[], o: { req?: boolean; span?: 2 | 3 | 4 | 6 } = {}) => (
    <Fld k={k} label={label} req={o.req ?? false} span={o.span ?? 2} err={bad(k)}><select id={k} className={cls(k)} value={f[k]} onChange={(e) => set(k, e.target.value)}><option value="">Select</option>{opts.map((x) => <option key={x}>{x}</option>)}</select></Fld>);
  const A = (k: FieldKey, label: string, o: { span?: 2 | 3 | 4 | 6; ph?: string } = {}) => (
    <Fld k={k} label={label} span={o.span ?? 3} err={bad(k)}><textarea id={k} rows={2} className={`${cls(k)} min-h-16 py-2`} value={f[k]} placeholder={o.ph} onChange={(e) => set(k, e.target.value)} /></Fld>);

  function onPhoto(file?: File) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setBanner("Please choose a JPG, PNG or WebP photo.");
    if (file.size > 5 * 1024 * 1024) return setBanner("This photo is larger than 5 MB. Choose a smaller one.");
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const W = 360, H = 480, c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!, s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.drawImage(img, (W - w) / 2, (H - h) * 0.35, w, h); URL.revokeObjectURL(url);
      c.toBlob((b) => { if (b) { setPhoto({ url: c.toDataURL("image/jpeg", 0.88), blob: b }); setErrs((p) => { const n = new Set(p); n.delete("photo"); return n; }); } }, "image/jpeg", 0.88);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setBanner("This image could not be read. Try another photo."); };
    img.src = url;
  }
  function onDoc(file?: File) {
    const kind = pick.current; if (!file || !kind) return;
    if (!/^(application\/pdf|image\/(png|jpeg))$/.test(file.type)) return setBanner("Choose a PDF, JPG or PNG file.");
    if (file.size > 3 * 1024 * 1024) return setBanner("That file is larger than 3 MB.");
    setDocs((p) => ({ ...p, [kind]: file })); setErrs((p) => { const n = new Set(p); n.delete("doc-" + kind); return n; }); setBanner("");
  }

  function validate(i: number): boolean {
    const e = new Set<string>(); const need = (...ks: FieldKey[]) => ks.forEach((k) => { if (!f[k].trim()) e.add(k); });
    if (i === 0) { need("surname", "first_name", "gender", "dob", "place_of_birth", "nationality"); if (!photo) e.add("photo"); }
    if (i === 1) need("address", "town", "district");
    if (i === 2) { need("guardian_name", "guardian_relationship", "guardian_phone", "guardian_address", "fee_payer");
      if (f.guardian_phone && !PHONE.test(f.guardian_phone)) e.add("guardian_phone"); if (f.guardian_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.guardian_email)) e.add("guardian_email"); }
    if (i === 3) { need("academic_year", "term", "level", "class_applied"); if (sss) need("department"); if (f.level && !early) need("previous_school"); }
    if (i === 4) { need("emergency_name", "emergency_relationship", "emergency_phone"); if (f.emergency_phone && !PHONE.test(f.emergency_phone)) e.add("emergency_phone"); }
    if (i === 5) DOC_KINDS.forEach((d) => { if (docRequired(d.id, f.level) && !docs[d.id]) e.add("doc-" + d.id); });
    setErrs(e); if (e.size) setBanner("Please complete the highlighted items."); else setBanner("");
    return e.size === 0;
  }
  const go = (n: number) => { setStep(n); setReached((r) => Math.max(r, n)); setErrs(new Set()); top.current?.scrollIntoView({ block: "start", behavior: "smooth" }); };
  const next = () => { if (validate(step)) { saveDraft(); go(step + 1); } };

  async function upload(list: typeof tickets.current): Promise<string[]> {
    const failed: string[] = [];
    for (const x of list) {
      const { error } = await supabase.storage.from("application-files").uploadToSignedUrl(x.t.path, x.t.token, x.file, { contentType: (x.file as File).type || "image/jpeg" });
      if (error) failed.push(x.kind);
    }
    return failed;
  }
  async function submit() {
    if (!decl.a || !decl.b || !f.signature_name.trim() || f.signature_name.trim().length < 3) { setErrs(new Set([...(decl.a && decl.b ? [] : ["decl"]), ...(f.signature_name.trim().length >= 3 ? [] : ["signature_name"])])); return setBanner("Tick the two required declarations and type your full name to sign."); }
    setPhase("sending"); setBanner("");
    const files: FileSpec[] = []; if (photo) files.push({ kind: "photo", name: "photo.jpg", size: photo.blob.size, type: "image/jpeg" });
    for (const d of DOC_KINDS) { const x = docs[d.id]; if (x) files.push({ kind: d.id, name: x.name, size: x.size, type: x.type }); }
    const r = await submitApplication({ data: { fields: f, consent_true: decl.a, consent_rules: decl.b, consent_medical: decl.c, files, website } });
    if (r.status !== "ok") {
      setPhase("form");
      return setBanner(r.status === "invalid" ? `Please check ${FIELD_LABEL[r.field] ?? r.field.replace(/_/g, " ")}.` : r.status === "closed" ? "Online applications are closed at the moment. Please contact the school office."
        : r.status === "limited" ? "Too many applications from this connection. Please try again later or contact the school office." : "We could not send your application. Please try again, or contact the school office.");
    }
    tickets.current = r.uploads.map((t) => ({ kind: t.kind, t, file: t.kind === "photo" ? photo!.blob : docs[t.kind as DocKind]! })).filter((x) => x.file);
    const failed = await upload(tickets.current);
    if (r.uploads.length) await finalizeApplication({ data: { ref: r.ref } });
    tickets.current = tickets.current.filter((x) => failed.includes(x.kind));
    try { localStorage.removeItem(DRAFT); } catch { /* ignore */ }
    setDone({ ref: r.ref, duplicate: !!r.duplicate, failed }); setPhase("done"); window.scrollTo({ top: 0 });
  }
  async function retry() {
    if (!done) return; setPhase("sending"); const failed = await upload(tickets.current); await finalizeApplication({ data: { ref: done.ref } });
    tickets.current = tickets.current.filter((x) => failed.includes(x.kind)); setDone({ ...done, failed }); setPhase("done");
  }
  const reset = () => { setF(blankFields()); setPhoto(null); setDocs({}); setDecl({ a: false, b: false, c: false }); setDone(null); setStep(0); setReached(0); setPhase("form"); setBanner(""); };
  const pdfName = `GIA-Application-${f.surname.replace(/\W+/g, "")}-${f.first_name.replace(/\W+/g, "")}.pdf`;
  const attached = Object.fromEntries(DOC_KINDS.map((d) => [d.id, !!docs[d.id]])) as Record<string, boolean>;

  if (phase === "done" && done) return (
    <div className="py-10 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h3 className="mt-4 font-display text-xl font-bold text-primary">{done.duplicate ? "Application already received" : "Application submitted"}</h3>
      <p className="mt-2 text-muted-foreground">Your application number is</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-primary">{done.ref}</p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">Keep this number and print or download a copy. The school office will contact you by phone. Sending an application does not guarantee admission.</p>
      {done.failed.length > 0 && <div className="mx-auto mt-4 max-w-sm rounded-lg bg-gold-soft p-3 text-sm">Your application was saved, but {done.failed.length} file(s) did not upload ({done.failed.join(", ")}). <Button size="sm" className="mt-2" onClick={retry}>Try uploading again</Button><p className="mt-1 text-xs text-muted-foreground">If it keeps failing, bring the documents to the school office with your application number.</p></div>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => { setPhase("form"); go(6); }}>View application</Button>
        <Button variant="gold" onClick={() => { setPhase("form"); go(6); setTimeout(() => void downloadPdf(pdfName), 500); }}><Download />Download PDF</Button>
        <Button variant="outline" onClick={() => { setPhase("form"); go(6); setTimeout(() => window.print(), 500); }}><Printer />Print</Button>
        <Button variant="ghost" onClick={() => { if (confirm("Start a new application? The current form will be cleared.")) reset(); }}>Start a new application</Button>
      </div>
    </div>
  );

  return (
    <div ref={top} className="scroll-mt-24">
      <h3 className="font-display text-xl font-bold text-primary">Online Application for Admission</h3>
      <nav className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Application steps">
        {TITLES.map((t, i) => <button key={t} type="button" disabled={i > reached} onClick={() => go(i)} aria-selected={i === step}
          className={`flex min-h-14 min-w-[84px] flex-1 flex-col items-center justify-center rounded-lg border px-1 text-[11.5px] font-semibold disabled:opacity-50 ${i === step ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
          <b className={`mb-0.5 grid h-6 w-6 place-items-center rounded-full border text-xs ${i === step ? "border-gold bg-gold text-primary" : i < step ? "border-primary bg-primary text-gold" : "border-gold bg-gold-soft text-[#7A6310]"}`}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</b>{t}</button>)}
      </nav>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted"><i className="block h-full bg-primary transition-all" style={{ width: `${((step + 1) / 7) * 100}%` }} /></div>
      {banner && <p role="status" className={`mt-4 rounded-md p-3 text-sm ${errs.size ? "bg-destructive-soft text-destructive" : "bg-gold-soft"}`}>{banner}</p>}
      <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>

      <div className="mt-5 space-y-6">
        {step === 0 && <>
          <div className={`flex flex-wrap items-center gap-4 rounded-lg border bg-gold-soft p-4 ${bad("photo") ? "border-destructive" : ""}`}>
            <div className={`grid h-44 w-32 place-items-center overflow-hidden rounded border-2 bg-white text-center text-xs text-muted-foreground ${photo ? "border-solid border-primary" : "border-dashed border-primary/60"}`}>{photo ? <img src={photo.url} alt="Applicant passport photograph" className="h-full w-full object-cover" /> : <span className="p-2">Passport photograph<br />(required)</span>}</div>
            <div className="min-w-0 flex-1 text-sm"><h4 className="font-semibold text-primary">Passport photograph</h4>
              <ul className="my-1 list-disc pl-5 text-xs text-muted-foreground"><li>Clear face, plain light background</li><li>JPG, PNG or WebP, up to 5 MB</li><li>Cropped to passport size automatically</li></ul>
              <div className="flex gap-2"><Button type="button" size="sm" onClick={() => photoIn.current?.click()}><Camera />{photo ? "Change photo" : "Upload photo"}</Button>{photo && <Button type="button" size="sm" variant="outline" onClick={() => setPhoto(null)}>Remove</Button>}</div>
              {bad("photo") && <p className="mt-2 text-xs text-destructive">Please upload the applicant's passport photograph.</p>}
              <input ref={photoIn} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = ""; }} /></div>
          </div>
          <div><h4 className="mb-3 font-semibold text-primary">Applicant's full name</h4><div className="grid gap-4 sm:grid-cols-6">{T("surname", "Surname", { req: true })}{T("first_name", "First name", { req: true })}{T("middle_name", "Middle name")}</div></div>
          <div><h4 className="mb-3 font-semibold text-primary">Personal details</h4><div className="grid gap-4 sm:grid-cols-6">{S("gender", "Gender", ["Female", "Male"], { req: true })}{T("dob", "Date of birth", { req: true, type: "date" })}{T("place_of_birth", "Place of birth", { req: true })}{T("nationality", "Nationality", { req: true })}{T("religion", "Religion")}{T("birth_cert_no", "Birth certificate no.")}</div></div></>}
        {step === 1 && <div><h4 className="mb-3 font-semibold text-primary">Home address</h4><div className="grid gap-4 sm:grid-cols-6">{T("address", "Street / house address", { req: true, span: 6 })}{T("town", "Town / village", { req: true, span: 3 })}{S("district", "District", DISTRICTS, { req: true, span: 3 })}{T("chiefdom", "Chiefdom / ward", { span: 3 })}</div></div>}
        {step === 2 && <>
          <div><h4 className="mb-3 font-semibold text-primary">Primary parent / guardian</h4><div className="grid gap-4 sm:grid-cols-6">{T("guardian_name", "Full name", { req: true, span: 3 })}{S("guardian_relationship", "Relationship to applicant", ["Mother", "Father", "Aunt", "Uncle", "Grandparent", "Sibling", "Legal guardian"], { req: true, span: 3 })}
            {T("guardian_occupation", "Occupation")}{T("guardian_phone", "Phone number", { req: true, type: "tel", ph: "+232 XX XXX XXX" })}{T("guardian_whatsapp", "WhatsApp number", { type: "tel" })}{T("guardian_email", "Email address", { type: "email", span: 3 })}{T("guardian_address", "Residential address", { req: true, span: 3 })}</div></div>
          <div><h4 className="mb-3 font-semibold text-primary">Second contact</h4><div className="grid gap-4 sm:grid-cols-6">{T("contact2_name", "Full name", { span: 3 })}{T("contact2_phone", "Phone number", { type: "tel", span: 3 })}</div></div>
          <div><h4 className="mb-3 font-semibold text-primary">Person responsible for school fees</h4><div className="grid gap-4 sm:grid-cols-6">{S("fee_payer", "Fees will be paid by", ["The parent / guardian named above", "Another person", "A sponsor or organisation"], { req: true, span: 3 })}{T("fee_payer_name", "Name (if different)", { span: 3 })}</div></div></>}
        {step === 3 && <>
          <div><h4 className="mb-3 font-semibold text-primary">Class applied for</h4><div className="grid gap-4 sm:grid-cols-6">
            {S("academic_year", "Academic year", years(), { req: true, span: 3 })}{S("term", "Term of entry", ["First Term", "Second Term", "Third Term"], { req: true, span: 3 })}
            <Fld k="level" label="School stage" req span={3} err={bad("level")}><select id="level" className={cls("level")} value={f.level} onChange={(e) => { set("level", e.target.value); set("class_applied", (LEVELS[e.target.value] ?? []).length === 1 ? (LEVELS[e.target.value] ?? [""])[0]! : ""); if (e.target.value !== SSS) set("department", ""); }}><option value="">Select stage</option>{Object.keys(LEVELS).map((x) => <option key={x}>{x}</option>)}</select></Fld>
            <Fld k="class_applied" label="Class" req span={3} err={bad("class_applied")}><select id="class_applied" disabled={!f.level} className={cls("class_applied")} value={f.class_applied} onChange={(e) => set("class_applied", e.target.value)}><option value="">{f.level ? "Select class" : "Select stage first"}</option>{classes.map((x) => <option key={x}>{x}</option>)}</select></Fld>
            {sss && S("department", "Department (Senior Secondary)", ["Science", "Art", "Commercial"], { req: true, span: 6 })}</div></div>
          <div><h4 className="mb-1 font-semibold text-primary">Previous schooling</h4><p className="mb-3 text-xs text-muted-foreground">{early ? "Optional for Day-care and Kindergarten." : "Previous school details are required from Grade 1 upward."}</p>
            <div className="grid gap-4 sm:grid-cols-6"><Fld k="previous_school" label="Previous school" req={!!f.level && !early} span={3} err={bad("previous_school")}><input id="previous_school" className={cls("previous_school")} value={f.previous_school} onChange={(e) => set("previous_school", e.target.value)} /></Fld>{T("last_class", "Last class completed", { span: 3, ph: "e.g. Grade 5" })}{T("reason_leaving", "Reason for leaving", { span: 6 })}</div></div></>}
        {step === 4 && <>
          <div><h4 className="mb-1 font-semibold text-primary">Health information</h4><p className="mb-3 text-xs text-muted-foreground">Kept confidential and shared only with those who need it for the applicant's care.</p>
            <div className="grid gap-4 sm:grid-cols-6">{S("blood_group", "Blood group", ["Unknown", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"])}{A("allergies", "Allergies", { span: 4, ph: "List known allergies, or write None" })}{A("medical_conditions", "Medical conditions", { ph: "Ongoing conditions or medication, or write None" })}{A("special_needs", "Disability or special learning needs")}</div></div>
          <div><h4 className="mb-3 font-semibold text-primary">Emergency contact</h4><div className="grid gap-4 sm:grid-cols-6">{T("emergency_name", "Contact person", { req: true })}{T("emergency_relationship", "Relationship", { req: true })}{T("emergency_phone", "Phone number", { req: true, type: "tel" })}</div></div></>}
        {step === 5 && <div>
          <p className="mb-3 text-sm text-muted-foreground">PDF, JPG or PNG, up to 3 MB each. Clear scans or photos are accepted.</p>
          <input ref={fileIn} type="file" accept="application/pdf,image/png,image/jpeg" hidden onChange={(e) => { onDoc(e.target.files?.[0]); e.target.value = ""; }} />
          <ul className="divide-y rounded-lg border bg-card">{DOC_KINDS.map((d) => { const req = docRequired(d.id, f.level), file = docs[d.id]; return (
            <li key={d.id} className="flex flex-wrap items-center gap-3 p-3"><div className="min-w-[180px] flex-1"><b className="text-sm">{d.label}{req && <span className="text-destructive"> *</span>}</b><div className="text-xs text-muted-foreground">{d.sub}</div>{bad("doc-" + d.id) && <div className="text-xs text-destructive">This document is required.</div>}</div>
              <span className={`max-w-[200px] truncate rounded-full px-3 py-1 text-xs font-bold ${file ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive"}`}>{file ? file.name : "Not uploaded"}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => { pick.current = d.id; fileIn.current?.click(); }}><FileUp />{file ? "Replace" : "Choose file"}</Button>
              {file && <Button type="button" size="sm" variant="ghost" aria-label={`Remove ${d.label}`} onClick={() => setDocs((p) => { const n = { ...p }; delete n[d.id]; return n; })}><Trash2 /></Button>}</li>); })}</ul></div>}
        {step === 6 && <>
          <p className="text-sm text-muted-foreground">This is the application form the school will receive. Check every detail.</p>
          <div className="overflow-x-auto rounded-lg bg-muted p-2 sm:p-4"><ApplicationDocument f={f} reference={done?.ref ?? "Assigned when you submit"} photoUrl={photo?.url} attached={attached} /></div>
          <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
            <h4 className="font-semibold text-primary">Declaration</h4>
            {([["a", "I confirm that the information and documents provided are true and complete. *"], ["b", "I agree to abide by the rules and regulations of Gbonkolenken International Academy and to pay school fees promptly. *"], ["c", "I consent to the school seeking emergency medical treatment for the applicant if I cannot be reached. (optional)"]] as const).map(([k, t]) =>
              <label key={k} className={`flex items-start gap-3 ${bad("decl") && k !== "c" && !decl[k] ? "text-destructive" : ""}`}><input type="checkbox" className="mt-1 h-5 w-5" checked={decl[k]} onChange={(e) => setDecl((p) => ({ ...p, [k]: e.target.checked }))} /><span>{t}</span></label>)}
            <p className="text-xs text-muted-foreground">See our <Link to="/privacy" className="underline">Privacy Policy &amp; Terms</Link>.</p>
            <div className="grid gap-4 sm:grid-cols-6">{T("signature_name", "Type your full name as signature", { req: true, span: 3 })}</div>
          </div></>}
      </div>

      <div className="mt-8 flex flex-wrap justify-between gap-3 border-t pt-5">
        <div>{step > 0 && <Button type="button" variant="outline" className="h-12" onClick={() => go(step - 1)}>Back</Button>}</div>
        <div className="flex flex-wrap gap-2">
          {step < 6 && <Button type="button" variant="outline" className="h-12" onClick={() => saveDraft(true)}>Save draft</Button>}
          {step < 6 && <Button type="button" className="h-12" onClick={next}>Next: {TITLES[step + 1]}</Button>}
          {step === 6 && <><Button type="button" variant="outline" className="h-12" onClick={() => window.print()}><Printer />Print</Button><Button type="button" variant="gold" className="h-12" onClick={() => void downloadPdf(pdfName)}><Download />Download PDF</Button>
            <Button type="button" className="h-12" disabled={phase === "sending"} onClick={submit}>{phase === "sending" ? "Submitting…" : "Submit application"}</Button></>}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Applicant: {fullName(f) || "—"} · Questions? <Link to="/contact" className="underline">Contact the school office</Link>.</p>
    </div>
  );
}
