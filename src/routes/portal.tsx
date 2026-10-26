import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Users, Briefcase, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/gia/SiteLayout";
import { Crest } from "@/components/gia/Crest";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/portal")({
  head: () => seo("GIA Digital Portal — Choose your portal", "Sign in to the GIA student, parent, staff or administration portal."),
  component: Portal,
});

const portals = [
  { role: "student", icon: GraduationCap, t: "Student Portal", d: "Results, attendance, fees and school notices." },
  { role: "parent", icon: Users, t: "Parent Portal", d: "Monitor your children's progress, fees and receipts." },
  { role: "staff", icon: Briefcase, t: "Staff Portal", d: "Grade entry, attendance, classes and notices." },
  { role: "admin", icon: ShieldCheck, t: "Administration", d: "School management system for leadership and office." },
] as const;

function Portal() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center">
          <Crest className="mx-auto h-16 w-14" />
          <h1 className="mt-4 font-display text-3xl font-bold text-primary">GIA Digital Portal</h1>
          <p className="mt-2 text-muted-foreground">Choose your portal to get started.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {portals.map((p) => (
            <div key={p.role} className="flex flex-col rounded-xl border bg-card p-6 text-center shadow-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-gold"><p.icon className="h-7 w-7" /></div>
              <div className="mt-4 font-semibold text-primary">{p.t}</div>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.d}</p>
              <Button asChild className="mt-5 w-full"><Link to="/login" search={{ role: p.role }}>Login</Link></Button>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
