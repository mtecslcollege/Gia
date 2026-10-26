import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero, SectionTitle } from "@/components/gia/SiteLayout";
import { Button } from "@/components/ui/button";
import { schoolPhotos, schoolEmail } from "@/lib/school-site";
import { seo } from "@/lib/seo";
import { parentGuide, structure } from "@/lib/school-pages";

export const Route = createFileRoute("/staff")({ head: () => seo("Staff & Faculty | GIA", "How GIA is organised and who parents should speak to."), component: Staff });
const care = [["Care", "From the Day-care room to the senior classes, every child has an adult who knows them and watches over their welfare.", schoolPhotos.kindergarten], ["Teaching", "Teachers prepare lessons carefully, use our laboratories, library and computer room, and give students fair, regular feedback.", schoolPhotos.science], ["Character", "We teach respect, honesty, discipline and responsibility, in class and around the school.", schoolPhotos.library]] as const;
function Staff() { return <SiteLayout>
  <PageHero eyebrow="Clear leadership · One coordinator for every stage · Three departments" title="Staff and Faculty" text="Qualified, caring and dedicated people who guide every child from Day-care to Senior Secondary School with discipline, integrity and a love of learning." />
  <section className="mx-auto max-w-7xl px-5 py-14"><SectionTitle eyebrow="How our staff care" title="Care, teaching and character" /><div className="mt-8 grid gap-6 md:grid-cols-3">{care.map(([t, d, img]) => <article key={t} className="overflow-hidden rounded-xl border bg-card"><img src={img} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" /><div className="p-5"><h3 className="font-display text-xl font-bold text-primary">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></div></article>)}</div></section>
  <section className="border-y bg-muted/50 py-14"><div className="mx-auto max-w-4xl px-5"><SectionTitle eyebrow="A guide for parents" title="Who should I speak to?" /><p className="mt-3 text-muted-foreground">Start with the person closest to your child's question. If it cannot be solved there, move up one step.</p>
    <ul className="mt-6 divide-y rounded-xl border bg-card">{parentGuide.map(([q, who]) => <li key={q} className="grid gap-1 p-4 sm:grid-cols-2 sm:gap-4"><span className="text-sm text-muted-foreground">{q}</span><span className="font-semibold text-primary">{who}</span></li>)}</ul>
    <Button asChild className="mt-6 h-12"><a href={`mailto:${schoolEmail}`}>Write to a school office</a></Button></div></section>
  <section className="mx-auto max-w-3xl px-5 py-14"><SectionTitle eyebrow="School structure" title="How the school is organised" /><ol className="mt-8 space-y-2">{structure.map((s, i) => <li key={s} className="flex gap-3 rounded-lg border bg-card px-4 py-3 text-sm"><span className="font-display text-gold-foreground/60">{i + 1}</span>{s}</li>)}</ol>
    <div className="mt-10 rounded-xl bg-gold-soft p-5 text-sm"><b>Would you like to teach at GIA?</b> If you are a qualified, caring educator who shares our values, please write to the Principal's Office at <a className="underline" href={`mailto:${schoolEmail}`}>{schoolEmail}</a>. <Link to="/contact" className="underline">Contact page</Link></div></section>
</SiteLayout>; }
