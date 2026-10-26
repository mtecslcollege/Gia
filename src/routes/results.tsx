import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, ShieldCheck } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/gia/SiteLayout";
import { Crest } from "@/components/gia/Crest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkResult, type ResultPayload } from "@/lib/result-checker.functions";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Online Examination Result Checker | GIA" }, { name: "robots", content: "noindex" }] }),
  component: Results,
});

const fmt = (n: number | null) => (n === null || n === undefined ? "–" : String(Math.round(Number(n) * 10) / 10));

function Results() {
  const [pupilId, setPupilId] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultPayload | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await checkResult({ data: { pupilId, pin } });
    setBusy(false);
    setPin("");                                   // never keep the PIN after checking
    if (r.status === "ok") { setResult(r); return; }
    setError(r.status === "locked" ? "Too many attempts. Please wait 15 minutes and try again, or contact the school office."
      : r.status === "error" ? "The result service is not available right now. Please try again later."
      : "We could not verify those details. Check the Pupil ID and PIN, or contact the school office.");
  }
  function clear() { setPupilId(""); setPin(""); setError(""); setResult(null); }

  if (result) return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:py-0">
        <div className="rounded-lg border bg-card p-5 print:border-0 print:p-0">
          <div className="flex items-center gap-3 border-b pb-4">
            <Crest className="h-14 w-14" />
            <div><div className="font-display text-lg font-bold text-primary">{result.school?.name ?? "Gbonkolenken International Academy"}</div>
              <div className="text-sm text-muted-foreground">{result.school?.motto ?? "Seat of Wisdom"}</div></div>
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">Examination Result</h1>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Pupil</dt><dd className="font-semibold">{result.pupil.name}</dd>
            <dt className="text-muted-foreground">Pupil ID</dt><dd className="font-mono">{result.pupil.pupil_id}</dd>
            <dt className="text-muted-foreground">Class</dt><dd>{result.pupil.class}</dd>
            <dt className="text-muted-foreground">Session</dt><dd>{result.session ? `${result.session.term}, ${result.session.academic_year}` : "–"}</dd>
          </dl>
          {result.subjects.length === 0 ? (
            <p className="mt-6 rounded-md bg-gold-soft p-4 text-sm">No results have been published for this session yet. Please check again later.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2 pr-2">Subject</th><th className="px-2">Test</th><th className="px-2">Exam</th><th className="px-2">Mean</th><th className="pl-2">Grade</th></tr></thead>
                <tbody>{result.subjects.map((s) => (
                  <tr key={s.subject} className="border-b"><td className="py-2 pr-2 font-medium">{s.subject}</td><td className="px-2">{fmt(s.test)}</td><td className="px-2">{fmt(s.exam)}</td><td className="px-2">{fmt(s.mean)}</td><td className="pl-2 font-semibold">{s.grade ?? "–"}</td></tr>))}
                </tbody>
              </table>
              <p className="mt-3 text-sm"><span className="text-muted-foreground">Average: </span><b>{fmt(result.average)}</b></p>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Published results only{result.published_at ? ` · published ${new Date(result.published_at).toLocaleDateString()}` : ""}. Contact the school office for questions: {result.school?.email ?? "infogia@gmail.com"}.</p>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row print:hidden">
          <Button onClick={() => window.print()} className="h-12"><Printer /> Print or save as PDF</Button>
          <Button variant="outline" onClick={clear} className="h-12">Check another result</Button>
        </div>
      </section>
    </SiteLayout>
  );

  return (
    <SiteLayout>
      <PageHero eyebrow="For parents and guardians" title="Online Examination Result Checker" text="Enter the Pupil ID and the result PIN given to you by the school office." />
      <section className="mx-auto max-w-md px-4 py-10">
        <form onSubmit={submit} className="space-y-5 rounded-lg border bg-card p-5" autoComplete="off">
          <div className="space-y-2"><Label htmlFor="pid">Pupil ID number</Label>
            <Input id="pid" value={pupilId} onChange={(e) => setPupilId(e.target.value)} required maxLength={40} autoCapitalize="characters" className="h-12 text-base" placeholder="e.g. GIA001" /></div>
          <div className="space-y-2"><Label htmlFor="pin">Result PIN</Label>
            <Input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} required maxLength={16} autoComplete="off" autoCapitalize="characters" className="h-12 text-base tracking-widest" placeholder="10-character PIN" /></div>
          {error && <p role="alert" className="rounded-md bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="gold" disabled={busy} className="h-12 flex-1">{busy ? "Checking…" : "CHECK RESULT"}</Button>
            <Button type="button" variant="outline" onClick={clear} className="h-12">Clear</Button>
          </div>
          <p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Lost your PIN? Visit or contact the school office. They will confirm who you are before issuing a new one.</p>
        </form>
      </section>
    </SiteLayout>
  );
}
