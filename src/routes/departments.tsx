import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero, SectionTitle } from "@/components/gia/SiteLayout";
import { Button } from "@/components/ui/button";
import { schoolPhotos, schoolEmail } from "@/lib/school-site";
import { seo } from "@/lib/seo";
import { departments, coreSubjects } from "@/lib/school-pages";

export const Route = createFileRoute("/departments")({ head: () => seo("Academic Departments | GIA", "Science, Art and Commercial departments at Gbonkolenken International Academy, Makeni."), component: Departments });
const photo = (k: string) => (schoolPhotos as Record<string, string>)[k];
function List({ items }: { items: readonly string[] }) { return <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{items.map((i) => <li key={i} className="rounded-md bg-muted px-3 py-2">{i}</li>)}</ul>; }
function Departments() { return <SiteLayout>
  <PageHero eyebrow="Senior Secondary pathways" title="Academic Departments" text="Three departments, Science, Art and Commercial, each led by a Head of Department, guide students from Junior Secondary foundations to Senior Secondary success." />
  <section className="mx-auto max-w-7xl px-5 py-12">
    <p className="max-w-3xl text-muted-foreground">In Junior Secondary School every student studies a broad range of subjects. In S.S.S 1, each student joins the department that best fits their strengths and ambitions.</p>
    <div className="mt-6 flex flex-wrap gap-2">{departments.map((d) => <a key={d.key} href={`#${d.key}`} className="inline-flex h-11 items-center rounded-full border bg-card px-5 text-sm font-semibold text-primary hover:bg-muted">{d.name}</a>)}</div>
  </section>
  {departments.map((d, i) => <section id={d.key} key={d.key} className={`scroll-mt-24 border-t py-14 ${i % 2 ? "bg-muted/50" : ""}`}><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
    <div><div className="text-xs font-semibold uppercase tracking-wide text-gold-foreground/70">{d.hod}</div><h2 className="mt-1 font-display text-3xl font-bold text-primary">{d.name} Department</h2><p className="mt-3 text-muted-foreground">{d.intro}</p>
      <h3 className="mt-6 font-semibold">Senior Secondary subjects</h3><List items={d.subjects} />
      {d.foundation.length > 0 && <><h3 className="mt-6 font-semibold">Foundation in earlier levels</h3><List items={d.foundation} /></>}
      <h3 className="mt-6 font-semibold">What students learn to do</h3><List items={d.skills} />
      <h3 className="mt-6 font-semibold">Where it can lead</h3><div className="mt-3 flex flex-wrap gap-2">{d.leads.map((l) => <span key={l} className="rounded-full bg-gold-soft px-3 py-1 text-sm">{l}</span>)}</div></div>
    <figure className="self-start"><img src={photo(d.photo)} alt={`${d.name} department facilities`} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover shadow-sm" /></figure>
  </div></section>)}
  <section className="mx-auto max-w-7xl px-5 py-14"><SectionTitle eyebrow="For all students" title="Core subjects, shared by every department" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{coreSubjects.map(([t, d]) => <div key={t} className="rounded-xl border bg-card p-5"><div className="font-semibold text-primary">{t}</div><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>)}</div></section>
  <section className="bg-primary py-14 text-center text-primary-foreground"><div className="mx-auto max-w-2xl px-5"><h2 className="font-display text-2xl font-bold">Find the right department for your child</h2><p className="mt-2 text-primary-foreground/80">Three departments, one shared commitment to learning and good character.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild variant="gold" className="h-12"><Link to="/admissions">Apply Online</Link></Button><Button asChild variant="outline" className="h-12 bg-transparent"><a href={`mailto:${schoolEmail}`}>Contact Us</a></Button></div></div></section>
</SiteLayout>; }
