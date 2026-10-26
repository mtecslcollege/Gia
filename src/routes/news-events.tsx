import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero, SectionTitle } from "@/components/gia/SiteLayout";
import { Button } from "@/components/ui/button";
import { schoolPhotos, schoolEmail } from "@/lib/school-site";
import { seo } from "@/lib/seo";
import { terms } from "@/lib/school-pages";

export const Route = createFileRoute("/news-events")({ head: () => seo("News & Events | GIA", "School announcements, the school year and how to stay connected with Gbonkolenken International Academy."), component: News });
function News() { return <SiteLayout>
  <PageHero eyebrow="For parents, guardians and the community" title="News and Events" text="Announcements, achievements and the school calendar." image={schoolPhotos.front} />
  <section className="mx-auto max-w-7xl px-5 py-14"><SectionTitle eyebrow="Recent school updates" title="What is happening at GIA" />
    <p className="mt-6 rounded-xl border bg-card p-6 text-sm text-muted-foreground">No announcements have been posted yet. Parents and students receive notices through their School Portal account, and the school office answers questions by email.</p></section>
  <section className="border-y bg-muted/50 py-14"><div className="mx-auto max-w-7xl px-5"><SectionTitle eyebrow="The school year" title="Three terms, one steady rhythm" /><div className="mt-8 grid gap-4 md:grid-cols-3">{terms.map(([t, d]) => <div key={t} className="rounded-xl border bg-card p-5"><div className="font-semibold text-primary">{t}</div><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>)}</div></div></section>
  <section className="mx-auto max-w-7xl px-5 py-14"><SectionTitle eyebrow="Stay connected" title="Never miss a school notice" /><div className="mt-8 grid gap-4 md:grid-cols-3">
    <div className="rounded-xl border bg-card p-5"><div className="font-semibold text-primary">School Portal</div><p className="mt-1 text-sm text-muted-foreground">Parents and students receive records and notices through their School Portal account.</p><Button asChild className="mt-4 h-11"><Link to="/portal">Sign in</Link></Button></div>
    <div className="rounded-xl border bg-card p-5"><div className="font-semibold text-primary">Check results</div><p className="mt-1 text-sm text-muted-foreground">Use the Pupil ID and the PIN from the school office to see published results.</p><Button asChild variant="gold" className="mt-4 h-11"><Link to="/results">Result checker</Link></Button></div>
    <div className="rounded-xl border bg-card p-5"><div className="font-semibold text-primary">Ask the school office</div><p className="mt-1 text-sm text-muted-foreground">Questions about dates, fees or admission? Write to us and we will reply by email.</p><Button asChild variant="outline" className="mt-4 h-11"><a href={`mailto:${schoolEmail}`}>Email the office</a></Button></div>
  </div></section>
</SiteLayout>; }
