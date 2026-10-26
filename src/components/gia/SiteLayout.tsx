import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, MapPin, Mail, ArrowUpRight, Home, BookOpen, UserPlus, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark, Crest } from "./Crest";
import { schoolAddress } from "@/lib/school-pages";
import { schoolEmail } from "@/lib/school-site";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/academics", label: "Academics" },
  { to: "/admissions", label: "Admissions" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;
const more = [
  { to: "/departments", label: "Departments" },
  { to: "/campus-life", label: "Campus Life" },
  { to: "/news-events", label: "News & Events" },
  { to: "/staff", label: "Staff" },
  { to: "/results", label: "Check Results" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="school-site min-h-screen bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 py-2 text-xs">
          <span>Makama, Makeni · Sierra Leone</span>
          <a href={`mailto:${schoolEmail}`} className="flex items-center gap-2"><Mail className="h-3 w-3" />{schoolEmail}</a>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 lg:flex lg:justify-between">
          <Link to="/" className="min-w-0"><Wordmark /></Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary font-semibold" }}>
                {n.label}
              </Link>
            ))}
            <details className="group relative"><summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary">More</summary>
              <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border bg-card p-1 shadow-lg">{more.map((n) => <Link key={n.to} to={n.to} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">{n.label}</Link>)}</div></details>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="default"><Link to="/portal">Portal Login</Link></Button>
            <Button asChild variant="gold"><Link to="/admissions">Apply Now</Link></Button>
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {open && (
          <div className="border-t bg-card px-4 pb-4 lg:hidden">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block border-b py-3 text-base font-medium">{n.label}</Link>
            ))}
            {more.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block border-b py-3 text-base font-medium">{n.label}</Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild><Link to="/portal">Portal Login</Link></Button>
              <Button asChild variant="gold"><Link to="/admissions">Apply Now</Link></Button>
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="bg-navy-deep text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Wordmark light />
            <p className="mt-4 max-w-sm text-sm text-primary-foreground/70">A caring school community in Makama, Makeni. From Day-care to Senior Secondary, learning with discipline, purpose and possibility.</p>
          </div>
          <div className="space-y-3 text-sm text-primary-foreground/80">
            <div className="font-semibold text-gold">Visit</div>
            <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{schoolAddress}</p>
          </div>
          <div className="space-y-3 text-sm text-primary-foreground/80">
            <div className="font-semibold text-gold">Contact</div>
            <a href={`mailto:${schoolEmail}`} className="flex items-center gap-2"><Mail className="h-4 w-4" />{schoolEmail}</a>
            <Link to="/contact" className="flex items-center gap-2">Contact the school office <ArrowUpRight className="h-4 w-4" /></Link>
            <Link to="/results" className="flex items-center gap-2">Check examination results <ArrowUpRight className="h-4 w-4" /></Link>
            <Link to="/privacy" className="flex items-center gap-2">Privacy Policy &amp; Terms <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-primary-foreground/60">
            <span className="flex items-center gap-2"><Crest className="h-5 w-5" />© 2026 Gbonkolenken International Academy. All rights reserved.</span>
            <span>Seat of Wisdom • Excellence in Education</span>
          </div>
        </div>
      </footer>
      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 border-gold bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_rgba(7,24,58,.12)] lg:hidden">
        {([["/", "Home", Home], ["/academics", "Academics", BookOpen], ["/admissions", "Apply", UserPlus], ["/results", "Results", FileCheck]] as const).map(([to, l, Icon]) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold text-muted-foreground" activeProps={{ className: "text-primary" }}><Icon className="h-5 w-5" />{l}</Link>))}
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11.5px] font-semibold text-muted-foreground"><Menu className="h-5 w-5" />More</button>
      </nav>
    </div>
  );
}

export function PageHero({ eyebrow, title, text, image }: { eyebrow: string; title: string; text: string; image?: string }) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-navy-deep/65" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 md:py-20">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-primary-foreground/80">{text}</p>
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, center = false }: { eyebrow?: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className={`mt-2 font-display text-2xl font-bold text-primary md:text-3xl gold-rule ${center ? "[&::after]:mx-auto" : ""}`}>{title}</h2>
    </div>
  );
}
