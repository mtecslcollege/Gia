import { useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/gia/kit";
import { programmes } from "@/lib/school-site";
import { submitApplication, type ApplicationInput } from "@/lib/admissions.functions";

const CLASSES: Record<string, string[]> = {
  "Day-care": ["Day-care"], "Kindergarten 1–3": ["Kindergarten 1", "Kindergarten 2", "Kindergarten 3"],
  "Grades 1–6": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"], "JSS 1–3": ["JSS 1", "JSS 2", "JSS 3"], "SSS 1–3": ["SSS 1", "SSS 2", "SSS 3"],
};
const FIELD_LABEL: Record<string, string> = { pupil_name: "the pupil's name", dob: "the date of birth", gender: "the gender", level: "the level", guardian_name: "the parent/guardian name", guardian_phone: "a valid phone number", guardian_email: "a valid email address", consent: "the two required confirmations", signature_name: "your full name as signature" };
const defaultYear = () => { const d = new Date(); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return `${y}/${y + 1}`; };
const blank = (): ApplicationInput => ({ pupil_name: "", dob: "", gender: "Male", level: programmes[0]!.title, class_applied: "", department: "", academic_year: defaultYear(), term: "First Term", guardian_name: "", guardian_phone: "", guardian_email: "", address: "", previous_school: "", last_class: "", reason_leaving: "", consent_true: false, consent_rules: false, consent_medical: false, signature_name: "", website: "" });

export function ApplicationForm() {
  const [f, setF] = useState<ApplicationInput>(blank());
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [ref, setRef] = useState("");
  const submitting = useRef(false);
  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const classes = useMemo(() => CLASSES[f.level] ?? [], [f.level]);
  const sss = f.level.startsWith("SSS");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (submitting.current) return; submitting.current = true; setBusy(true); setError("");
    const r = await submitApplication({ data: { ...f, department: sss ? f.department : "" } });
    setBusy(false); submitting.current = false;
    if (r.status === "ok") { setRef(r.ref); return; }
    setError(r.status === "invalid" ? `Please check ${FIELD_LABEL[r.field] ?? "the form"}.`
      : r.status === "closed" ? "Online applications are closed at the moment. Please contact the school office."
      : r.status === "limited" ? "Too many applications from this connection. Please try again later or contact the school office."
      : "We could not send your application. Please try again, or contact the school office.");
  }

  if (ref) return (
    <div className="py-10 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h3 className="mt-4 font-display text-xl font-bold text-primary">Application received</h3>
      <p className="mt-2 text-muted-foreground">Your reference number is</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-primary">{ref}</p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">Keep this number. The school office will contact you by phone about the next steps. Sending an application does not guarantee admission.</p>
      <Button className="mt-6" variant="outline" onClick={() => { setRef(""); setF(blank()); }}>Apply for another child</Button>
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-4" autoComplete="off">
      <h3 className="font-display text-xl font-bold text-primary">Online Application</h3>
      <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} value={f.website} onChange={(e) => set("website", e.target.value)} /></label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pupil's full name *"><input required className={inputCls} value={f.pupil_name} onChange={(e) => set("pupil_name", e.target.value)} maxLength={120} /></Field>
        <Field label="Date of birth"><input type="date" className={inputCls} value={f.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
        <Field label="Gender *"><select className={inputCls} value={f.gender} onChange={(e) => set("gender", e.target.value)}><option>Male</option><option>Female</option></select></Field>
        <Field label="School stage *"><select className={inputCls} value={f.level} onChange={(e) => { set("level", e.target.value); set("class_applied", ""); }}>{programmes.map((p) => <option key={p.title}>{p.title}</option>)}</select></Field>
        <Field label="Class applying for"><select className={inputCls} value={f.class_applied} onChange={(e) => set("class_applied", e.target.value)}><option value="">Select…</option>{classes.map((c) => <option key={c}>{c}</option>)}</select></Field>
        {sss && <Field label="Department (Senior Secondary)"><select className={inputCls} value={f.department} onChange={(e) => set("department", e.target.value)}><option value="">Select…</option><option>Science</option><option>Art</option><option>Commercial</option></select></Field>}
        <Field label="Academic year"><input className={inputCls} value={f.academic_year} onChange={(e) => set("academic_year", e.target.value)} maxLength={20} /></Field>
        <Field label="Term of entry"><select className={inputCls} value={f.term} onChange={(e) => set("term", e.target.value)}><option>First Term</option><option>Second Term</option><option>Third Term</option></select></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Parent / guardian name *"><input required className={inputCls} value={f.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} maxLength={120} /></Field>
        <Field label="Phone number *"><input required type="tel" inputMode="tel" className={inputCls} placeholder="+232 ..." value={f.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} maxLength={20} /></Field>
        <Field label="Email (optional)"><input type="email" className={inputCls} value={f.guardian_email} onChange={(e) => set("guardian_email", e.target.value)} maxLength={160} /></Field>
        <Field label="Home address (optional)"><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} maxLength={300} /></Field>
        <Field label="Previous school (optional)"><input className={inputCls} value={f.previous_school} onChange={(e) => set("previous_school", e.target.value)} maxLength={160} /></Field>
        <Field label="Last class completed (optional)"><input className={inputCls} value={f.last_class} onChange={(e) => set("last_class", e.target.value)} maxLength={60} /></Field>
      </div>
      <Field label="Reason for leaving previous school (optional)"><input className={inputCls} value={f.reason_leaving} onChange={(e) => set("reason_leaving", e.target.value)} maxLength={300} /></Field>
      <fieldset className="space-y-3 rounded-lg bg-muted p-4 text-sm">
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={f.consent_true} onChange={(e) => set("consent_true", e.target.checked)} /><span>I confirm that the information provided is true and complete. *</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={f.consent_rules} onChange={(e) => set("consent_rules", e.target.checked)} /><span>I agree to follow the rules of Gbonkolenken International Academy and have read the <Link to="/privacy" className="underline">Privacy Policy &amp; Terms</Link>. *</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={f.consent_medical} onChange={(e) => set("consent_medical", e.target.checked)} /><span>I consent to the school seeking emergency medical treatment for my child if I cannot be reached. (optional)</span></label>
      </fieldset>
      <Field label="Type your full name as signature *"><input required className={inputCls} value={f.signature_name} onChange={(e) => set("signature_name", e.target.value)} maxLength={120} /></Field>
      {error && <p role="alert" className="rounded-md bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" variant="gold" size="lg" disabled={busy || !f.consent_true || !f.consent_rules} className="h-12 flex-1 sm:flex-none">{busy ? "Sending…" : "Submit application"}</Button>
        <Button asChild variant="outline" size="lg" className="h-12"><Link to="/contact">Contact Admissions</Link></Button>
      </div>
    </form>
  );
}
