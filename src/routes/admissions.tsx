<<<<<<< HEAD
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteLayout, PageHero, SectionTitle } from "@/components/gia/SiteLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Field, inputCls } from "@/components/gia/kit";
import { seo } from "@/lib/seo";
import { schoolPhotos, schoolEmail, programmes } from "@/lib/school-site";
=======
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero, SectionTitle } from "@/components/gia/SiteLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ApplicationForm } from "@/components/gia/ApplicationForm";
import { seo } from "@/lib/seo";
import { schoolPhotos, schoolEmail } from "@/lib/school-site";
>>>>>>> 5ff510d (Fix repository configuration)

export const Route = createFileRoute("/admissions")({
  head: () => seo("Admissions — Apply to GIA", "Explore admission to Gbonkolenken International Academy, from Day-care to SSS 3, and contact the school office about places and requirements."),
  component: Admissions,
});

const steps: [string, string][] = [
<<<<<<< HEAD
  ["Enquire", "Contact the school office about available places."],
  ["Prepare your application", "The school will confirm the documents and assessment required."],
=======
  ["Enquire (optional)", "Contact the school office about available places."],
  ["Apply online", "Fill in the application form on this page and keep your reference number."],
>>>>>>> 5ff510d (Fix repository configuration)
  ["Admission Decision", "You will be notified by phone or email."],
  ["Registration", "Complete registration and pay fees."],
  ["Start School", "Welcome to the GIA family!"],
];
const faqs: [string, string][] = [
  ["What documents are required?", "Contact the school office for the current document checklist for your child’s stage."],
  ["Are places available?", "The school office can confirm current places, start dates and fees."],
  ["Which levels does GIA offer?", "Day-care, Kindergarten 1–3, Grades 1–6, JSS 1–3 and SSS 1–3."],
<<<<<<< HEAD
  ["How do I begin?", "Send an admission enquiry to infogia@gmail.com. The school will guide you through registration."],
];

function Admissions() {
  const [sent, setSent] = useState(false);
=======
  ["How do I begin?", "Fill in the online application on this page. The school office will contact you by phone about the next steps."],
];

function Admissions() {
>>>>>>> 5ff510d (Fix repository configuration)
  return (
    <SiteLayout>
      <PageHero eyebrow="Join the GIA school family" title="Admissions at Gbonkolenken International Academy" text="From Day-care to Senior Secondary, find the right stage for your child. Contact the school office for places, dates and fees." image={schoolPhotos.campus} />
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionTitle title="Admission Process" />
          <ol className="mt-8 space-y-5">
            {steps.map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-bold text-gold">{i + 1}</span>
                <div><div className="font-semibold text-primary">{t}</div><div className="text-sm text-muted-foreground">{d}</div></div>
              </li>
            ))}
          </ol>
          <h3 className="mt-12 font-display text-xl font-bold text-primary">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="mt-4">
            {faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}><AccordionTrigger className="text-left">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="h-fit rounded-xl border bg-card p-6 shadow-sm md:p-8">
<<<<<<< HEAD
          {sent ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
              <h3 className="mt-4 font-display text-xl font-bold text-primary">Admission enquiry prepared</h3>
              <p className="mt-2 text-muted-foreground">Send the draft from your email app to the school office. Your enquiry has not been submitted until you send it.</p>
              <Button className="mt-6" variant="outline" onClick={() => setSent(false)}>Prepare another enquiry</Button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); const body = Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`).join("\n"); window.location.href = `mailto:${schoolEmail}?subject=${encodeURIComponent("Admission enquiry — GIA")}&body=${encodeURIComponent(body)}`; setSent(true); }} className="space-y-4">
              <h3 className="font-display text-xl font-bold text-primary">Admission Enquiry</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Pupil's full name"><input name="Pupil name" required className={inputCls} placeholder="Pupil’s full name" /></Field>
                <Field label="Date of birth"><input name="Date of birth" type="date" className={inputCls} /></Field>
                <Field label="Gender"><select name="Gender" className={inputCls}><option>Male</option><option>Female</option></select></Field>
                <Field label="Level applying for"><select name="Level" className={inputCls}>{programmes.map((p) => <option key={p.title}>{p.title}</option>)}</select></Field>
                <Field label="Parent / guardian name"><input name="Guardian name" required className={inputCls} /></Field>
                <Field label="Phone number"><input name="Contact phone" type="tel" required className={inputCls} placeholder="+232 ..." /></Field>
              </div>
              <Field label="Previous school"><input name="Previous school" className={inputCls} /></Field>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" variant="gold" size="lg">Compose admission enquiry</Button>
                <Button asChild variant="outline" size="lg"><Link to="/contact">Contact Admissions</Link></Button>
              </div>
            </form>
          )}
=======
          <ApplicationForm />
>>>>>>> 5ff510d (Fix repository configuration)
        </div>
      </section>
    </SiteLayout>
  );
}
