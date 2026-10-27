import { Crest } from "@/components/gia/Crest";
import { COORD, DOC_KINDS, docRequired, fullName, type Fields } from "@/lib/application-data";
import { schoolAddress } from "@/lib/school-pages";
import { schoolEmail } from "@/lib/school-site";

const longDate = (iso?: string) => (iso ? new Date(iso) : new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
function Row({ a, b, c, d }: { a: string; b?: string; c?: string; d?: string }) {
  const k = "w-1/5 border border-[#BFB88F] bg-[#FBF6DD] px-2 py-1 align-top text-[11.5px] font-semibold text-primary";
  const v = "border border-[#BFB88F] px-2 py-1 align-top";
  return c === undefined
    ? <tr><td className={k}>{a}</td><td className={v} colSpan={3}>{b || "—"}</td></tr>
    : <tr><td className={k}>{a}</td><td className={v}>{b || "—"}</td><td className={k}>{c}</td><td className={v}>{d || "—"}</td></tr>;
}
function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return <div className="mt-3 break-inside-avoid"><h3 className="border-l-[5px] border-primary bg-gold-soft px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-primary">{t}</h3>{children}</div>;
}

/** The application letter/form the school receives. Used for review, print/PDF and the admin screen. */
export function ApplicationDocument({ f, reference, photoUrl, date, attached }: { f: Fields; reference: string; photoUrl?: string | undefined; date?: string | undefined; attached: Record<string, boolean> }) {
  const name = fullName(f), stream = f.department ? `, ${f.department} Department` : "";
  const dob = f.dob ? new Date(f.dob + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  const st = (id: (typeof DOC_KINDS)[number]["id"]) => (attached[id] ? "Attached" : docRequired(id, f.level) ? "Missing" : "Not supplied");
  return (
    <>
      <style>{`@media print{body *{visibility:hidden}#application-doc,#application-doc *{visibility:visible}#application-doc{position:absolute;left:0;top:0;width:100%;max-width:none!important;border:0!important;padding:0!important}@page{size:A4;margin:10mm}}`}</style>
      <div id="application-doc" className="mx-auto w-full min-w-[640px] max-w-[794px] border bg-white p-5 text-[12.5px] leading-snug text-black sm:p-9">
        <div className="relative flex flex-col items-center gap-3 border-b-4 border-primary pb-3 text-center sm:flex-row">
          <Crest className="h-20 w-16 shrink-0" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-primary">Gbonkolenken International Academy</h2>
            <div className="font-display text-sm italic text-[#7A6310]">“Seat of Wisdom”</div>
            <div className="text-[11px]">{schoolAddress}<br />Email: {schoolEmail}</div>
          </div>
        </div>
        <div className="mb-3 mt-5 text-center"><span className="inline-block rounded-sm bg-primary px-6 py-1.5 font-display text-[15px] font-semibold tracking-widest text-gold">APPLICATION FOR ADMISSION</span>
          <div className="mt-1 text-[11.5px]">Academic Year {f.academic_year} — {f.term} entry</div></div>
        <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div className="mb-2 text-[11.5px]"><b className="text-primary">Application No.:</b> {reference}<br /><b className="text-primary">Date:</b> {longDate(date)}</div>
            <p className="mb-1.5"><b>The Principal,</b><br />Gbonkolenken International Academy,<br />{schoolAddress}.</p>
            <p className="mb-1.5">Dear Sir/Madam,</p>
            <p className="mb-1.5"><b>RE: APPLICATION FOR ADMISSION INTO {f.class_applied.toUpperCase()}</b></p>
            <p className="mb-1.5 text-justify">I, <b>{f.guardian_name}</b>, the {f.guardian_relationship.toLowerCase()} of <b>{name}</b>, write to apply for the admission of the above-named applicant into <b>{f.class_applied}{stream}</b> at Gbonkolenken International Academy for the <b>{f.term}</b> of the <b>{f.academic_year}</b> academic year.</p>
            <p className="mb-1.5 text-justify">I have completed this application form and attached the required documents. I undertake to ensure the applicant's regular attendance and good conduct, to pay school fees promptly, and to abide by the rules and regulations of the Academy.</p>
            <p>Yours faithfully,</p>
          </div>
          <div className="grid h-36 w-28 shrink-0 place-items-center border-[1.5px] border-primary bg-neutral-100 text-center text-[10px] text-neutral-500">
            {photoUrl ? <img src={photoUrl} alt="Passport photograph" className="h-full w-full object-cover" crossOrigin="anonymous" /> : <span>Passport<br />photograph</span>}
          </div>
        </div>
        <Sec t="A. Applicant details"><table className="w-full border-collapse"><tbody>
          <Row a="Full name" b={`${f.surname.toUpperCase()} ${[f.first_name, f.middle_name].filter(Boolean).join(" ")}`.trim()} />
          <Row a="Gender" b={f.gender} c="Date of birth" d={dob} />
          <Row a="Place of birth" b={f.place_of_birth} c="Nationality" d={f.nationality} />
          <Row a="Religion" b={f.religion} c="Birth certificate no." d={f.birth_cert_no} /></tbody></table></Sec>
        <Sec t="B. Residence"><table className="w-full border-collapse"><tbody>
          <Row a="Home address" b={f.address} /><Row a="Town / village" b={f.town} c="District" d={f.district} />{f.chiefdom && <Row a="Chiefdom / ward" b={f.chiefdom} />}</tbody></table></Sec>
        <Sec t="C. Parent / guardian"><table className="w-full border-collapse"><tbody>
          <Row a="Full name" b={f.guardian_name} c="Relationship" d={f.guardian_relationship} /><Row a="Phone" b={f.guardian_phone} c="WhatsApp" d={f.guardian_whatsapp} />
          <Row a="Occupation" b={f.guardian_occupation} c="Email" d={f.guardian_email} /><Row a="Residential address" b={f.guardian_address} />
          {(f.contact2_name || f.contact2_phone) && <Row a="Second contact" b={f.contact2_name} c="Phone" d={f.contact2_phone} />}
          <Row a="Fees paid by" b={f.fee_payer} c="Name" d={f.fee_payer_name} /></tbody></table></Sec>
        <Sec t="D. Academic details"><table className="w-full border-collapse"><tbody>
          <Row a="School stage" b={f.level} c="Class applied for" d={f.class_applied} /><Row a="Academic year" b={f.academic_year} c="Term of entry" d={f.term} />
          {f.department && <Row a="Department" b={f.department} />}<Row a="Previous school" b={f.previous_school} c="Last class completed" d={f.last_class} />
          {f.reason_leaving && <Row a="Reason for leaving" b={f.reason_leaving} />}</tbody></table></Sec>
        <Sec t="E. Medical and emergency"><table className="w-full border-collapse"><tbody>
          <Row a="Blood group" b={f.blood_group} c="Allergies" d={f.allergies} /><Row a="Medical conditions" b={f.medical_conditions} c="Special needs" d={f.special_needs} />
          <Row a="Emergency contact" b={f.emergency_name} c="Relationship" d={f.emergency_relationship} /><Row a="Emergency phone" b={f.emergency_phone} /></tbody></table></Sec>
        <Sec t="F. Documents submitted"><table className="w-full border-collapse"><tbody>
          <Row a={DOC_KINDS[0].label} b={st("birth")} c={DOC_KINDS[1].label} d={st("report")} /><Row a={DOC_KINDS[2].label} b={st("immun")} c={DOC_KINDS[3].label} d={st("letter")} /></tbody></table></Sec>
        <Sec t="G. Declaration"><p className="mt-1.5 text-justify">I declare that the information given in this application is true and complete to the best of my knowledge. I agree to abide by the rules and regulations of Gbonkolenken International Academy, to pay school fees promptly, and I consent to emergency medical treatment for the applicant if I cannot be reached.</p></Sec>
        <div className="mt-5 flex gap-8 break-inside-avoid text-center text-[11.5px]">
          <div className="flex-1"><div className="flex h-8 items-end justify-center border-b border-black font-display text-[15px] italic text-primary">{f.signature_name}</div>Signature of parent / guardian</div>
          <div className="flex-1"><div className="flex h-8 items-end justify-center border-b border-black font-display text-[15px] italic text-primary">{longDate(date)}</div>Date</div>
        </div>
        <div className="mt-4 break-inside-avoid border-2 border-primary">
          <h3 className="bg-primary px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-gold">For official use only</h3>
          <table className="w-full border-collapse"><tbody>
            {([["Received by (Senior Administrative Officer)", "Date received"], ["Fees confirmed (Finance Officer)", "Receipt no."], [COORD[f.level] ?? "Level Coordinator", "Class allocated"], ["Vice-Principal's recommendation", "Admission no."]] as const).map(([a, b]) => (
              <tr key={a}><td className="h-9 w-1/5 border border-[#BFB88F] bg-[#FBF6DD] px-2 text-[11.5px] font-semibold text-primary">{a}</td><td className="border border-[#BFB88F]" /><td className="w-1/5 border border-[#BFB88F] bg-[#FBF6DD] px-2 text-[11.5px] font-semibold text-primary">{b}</td><td className="border border-[#BFB88F]" /></tr>))}
            <tr><td className="h-9 border border-[#BFB88F] bg-[#FBF6DD] px-2 text-[11.5px] font-semibold text-primary">Principal's decision</td><td colSpan={3} className="border border-[#BFB88F] px-2">☐ Admitted &nbsp;&nbsp; ☐ Waiting list &nbsp;&nbsp; ☐ Not admitted &nbsp;&nbsp;&nbsp; Signature: ____________________</td></tr>
          </tbody></table>
        </div>
        <div className="mt-3 border-t-2 border-gold pt-1.5 text-center text-[10.5px] text-neutral-600">Gbonkolenken International Academy (GIA) | {schoolAddress} | {schoolEmail}</div>
      </div>
    </>
  );
}
export async function downloadPdf(name: string) {
  const el = document.getElementById("application-doc"); if (!el) return;
  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf().set({ margin: [8, 8, 8, 8], filename: name, image: { type: "jpeg", quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }, pagebreak: { mode: ["css", "legacy"], avoid: [".break-inside-avoid"] } } as never).from(el).save();
}
