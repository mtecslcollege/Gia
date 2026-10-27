import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero, SectionTitle } from "@/components/gia/SiteLayout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ApplicationForm } from "@/components/gia/ApplicationForm";
import { seo } from "@/lib/seo";
import { schoolPhotos, schoolEmail } from "@/lib/school-site";

export const Route = createFileRoute("/admissions")({
  head: () => seo("Admissions — Apply to GIA", "Explore admission to Gbonkolenken International Academy, from Day-care to SSS 3, and contact the school office about places and requirements."),
  component: Admissions,
});

const steps: [string, string][] = [
  ["Enquire (optional)", "Contact the school office about available places."],
  ["Apply online", "Fill in the application form on this page and keep your reference number."],
  ["Admission Decision", "You will be notified by phone or email."],
  ["Registration", "Complete registration and pay fees."],
  ["Start School", "Welcome to the GIA family!"],
];
const faqs: [string, string][] = [
  ["What documents are required?", "Contact the school office for the current document checklist for your child’s stage."],
  ["Are places available?", "The school office can confirm current places, start dates and fees."],
  ["Which levels does GIA offer?", "Day-care, Kindergarten 1–3, Grades 1–6, JSS 1–3 and SSS 1–3."],
  ["How do I begin?", "Fill in the online application on this page. The school office will contact you by phone about the next steps."],
];

function Admissions() {
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
          <ApplicationForm />
        </div>
      </section>
    </SiteLayout>
  );
}
