import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/gia/SiteLayout";
import { schoolEmail } from "@/lib/school-site";
import { policy } from "@/lib/school-pages";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({ head: () => seo("Privacy Policy & Terms | GIA", "How Gbonkolenken International Academy protects personal information and the rules for using the website, School Portal and result checker."), component: Privacy });
function Privacy() { return <SiteLayout>
  <PageHero eyebrow="Last updated: October 2026" title="Privacy Policy & Terms" text="We hold the trust of parents, students and staff as a responsibility. This page explains how we protect personal information and the rules for using our website, School Portal and result checker." />
  <article className="mx-auto max-w-3xl space-y-4 px-5 py-12">
    {policy.map((s, i) => !("p" in s) && !("ul" in s) ? <h2 key={i} className="pt-6 font-display text-2xl font-bold text-primary">{s.h}</h2> : (
      <section key={i}><h3 className="font-semibold text-primary">{s.h}</h3>
        {"ul" in s && s.ul && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{s.ul.map((l) => <li key={l}>{l}</li>)}</ul>}
        {"p" in s && s.p && s.p.map((t) => <p key={t} className="mt-2 text-sm text-muted-foreground">{t}</p>)}</section>))}
    <p className="pt-4 text-sm">Email: <a className="font-semibold text-primary underline" href={`mailto:${schoolEmail}`}>{schoolEmail}</a></p>
  </article>
</SiteLayout>; }
