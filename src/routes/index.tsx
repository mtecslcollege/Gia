import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BookOpen, ShieldCheck, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout, SectionTitle } from "@/components/gia/SiteLayout";
import { programmes, schoolPhotos, galleryPhotos } from "@/lib/school-site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Gbonkolenken International Academy — Seat of Wisdom, Makeni", "Discover GIA in Makama, Makeni: caring, disciplined education from Day-care through Senior Secondary, with real campus photographs and academic programmes."),
  component: Home,
});

function Home() {
  return <SiteLayout>
    <section className="home-cover relative isolate flex items-end overflow-hidden bg-navy-deep text-primary-foreground">
      <img src={schoolPhotos.campus} alt="Gbonkolenken International Academy’s three-storey campus in Makama, Makeni" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" fetchPriority="high" />
      <div className="absolute inset-0 -z-10 bg-navy-deep/55" />
      <div className="mx-auto w-full max-w-7xl px-5 pb-12 pt-16 md:pb-16 md:pt-24">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-2"><span className="h-px w-8 bg-gold" />Day-care to SSS 3 · Makeni, Sierra Leone</p>
          <h1 className="mt-5 font-display text-3xl font-bold leading-snug sm:text-4xl md:text-5xl">Gbonkolenken<br className="hidden sm:block" /> International Academy</h1>
          <p className="mt-4 font-display text-xl italic text-gold">Seat of Wisdom</p>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-primary-foreground">A place to grow in knowledge, confidence and character. Caring, disciplined education from your child’s first discoveries to their next big step.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg"><Link to="/admissions">Apply to GIA <ArrowUpRight /></Link></Button>
            <Button asChild variant="onDark" size="lg"><Link to="/academics">Our Programmes <ArrowRight /></Link></Button>
          </div>
        </div>
      </div>
    </section>
    <section className="border-b bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x px-5 md:grid-cols-4">
        {[["Since 2023", "A growing school community"], ["Day-care – SSS 3", "One complete learning journey"], ["3 departments", "Science · Art · Commercial"], ["Makama, Makeni", "Rooted in our community"]].map(([title, text]) => <div key={title} className="px-4 py-6 first:pl-0"><p className="font-display text-base font-bold text-primary md:text-lg">{title}</p><p className="mt-1 text-xs text-muted-foreground sm:text-sm">{text}</p></div>)}
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-16">
      <figure><img src={schoolPhotos.gate} alt="GIA’s school gate, bearing the school name and crest" className="aspect-[4/3] w-full rounded-lg object-cover" loading="lazy" /><figcaption className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />New Jersey Road, Makama, Makeni</figcaption></figure>
      <div><SectionTitle eyebrow="Welcome to our school" title="Every child known. Every future nurtured." /><p className="mt-6 leading-relaxed text-muted-foreground">Founded on 3 September 2023, GIA is a private school with a public purpose: to give children an education that prepares them for life. We encourage understanding, not just memorising, and help each learner grow with discipline, curiosity and integrity.</p><div className="mt-7 space-y-4">{[{i:BookOpen,t:"Learning beyond the textbook",d:"Practical science, reading and computer studies."},{i:ShieldCheck,t:"Guidance at every stage",d:"Coordinators, Form-masters and teachers working together."},{i:Heart,t:"A partnership with families",d:"Care, clear communication and a shared commitment to each child."}].map(x=><div key={x.t} className="flex gap-4"><x.i className="mt-1 h-5 w-5 shrink-0 text-primary"/><div><h3 className="font-semibold text-primary">{x.t}</h3><p className="mt-1 text-sm text-muted-foreground">{x.d}</p></div></div>)}</div><Button asChild variant="link" className="mt-6 px-0"><Link to="/about">Our story and values <ArrowRight /></Link></Button></div>
    </section>
    <section className="border-y bg-muted/50 py-16"><div className="mx-auto max-w-7xl px-5"><div className="flex flex-wrap items-end justify-between gap-5"><SectionTitle eyebrow="The academic journey" title="A place for every stage of growth" /><Button asChild variant="outline"><Link to="/academics">All programmes <ArrowRight /></Link></Button></div><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{programmes.map((p,i)=><Link key={p.title} to="/academics" className="group overflow-hidden rounded-lg border bg-card"><img src={p.image} alt={p.title === "Grades 1–6" ? "School library supporting the primary grades" : `${p.title} learning space at GIA`} className="aspect-[4/3] w-full object-cover" loading="lazy"/><div className="p-4"><span className="text-xs font-semibold text-muted-foreground">0{i+1} / {p.stage}</span><h3 className="mt-2 font-display text-base font-bold text-primary">{p.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.text}</p><ArrowUpRight className="mt-4 h-5 w-5 text-primary group-hover:text-gold"/></div></Link>)}</div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-16"><div className="flex flex-wrap items-end justify-between gap-4"><SectionTitle eyebrow="Inside GIA" title="Real spaces. Everyday discovery." /><Button asChild variant="outline"><Link to="/gallery">Explore the gallery <ArrowRight /></Link></Button></div><div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4">{[galleryPhotos[0], galleryPhotos[3], galleryPhotos[5], galleryPhotos[8]].map(p=>p&&<figure key={p.title}><img src={p.src} alt={p.title} className="aspect-[4/3] w-full rounded-lg object-cover" loading="lazy"/><figcaption className="mt-3 text-sm font-semibold text-primary">{p.title}</figcaption></figure>)}</div></section>
    <section className="bg-primary text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-12"><div><p className="text-sm text-gold">Your child’s next chapter</p><h2 className="mt-2 font-display text-2xl font-bold">Become part of the GIA school family.</h2><p className="mt-3 text-primary-foreground/80">Speak with our school office about the right stage for your child.</p></div><Button asChild variant="gold" size="lg"><Link to="/contact">Contact the school <ArrowUpRight /></Link></Button></div></section>
  </SiteLayout>;
}
