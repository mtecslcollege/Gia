import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, UserPlus, Wallet, BookOpen, CalendarCheck, Megaphone, FileText, BarChart3, Settings,
  Search, Bell, Menu, X, GraduationCap, Briefcase, Home, ChevronDown, LogOut, ShieldCheck,
} from "lucide-react";
import { Crest } from "@/components/gia/Crest";
import { Avatar } from "@/components/gia/kit";
import { supabase } from "@/integrations/supabase/client";
import { loadSession, roleLabel } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({ meta: [{ title: "GIA School Management System" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const s = await loadSession();
    if (!s) throw redirect({ to: "/login" });
    if (!s.roles.length) throw redirect({ to: "/pending" });
    return { session: s };
  },
  component: AppShell,
});

type Item = { label: string; to: string; params?: Record<string, string> };
type Group = { label: string; icon: typeof Users; to?: string; items?: Item[] };

const groups: Group[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/app" },
  { label: "People", icon: Users, items: [
    { label: "Students", to: "/app/students" },
    { label: "Parents", to: "/app/$section", params: { section: "parents" } },
    { label: "Staff", to: "/app/$section", params: { section: "staff-directory" } },
  ] },
  { label: "Admissions", icon: UserPlus, to: "/app/admissions" },
  { label: "Finance", icon: Wallet, items: [
    { label: "Overview", to: "/app/finance" },
    { label: "Record Payment", to: "/app/finance/payment" },
    { label: "Receipts", to: "/app/finance/receipt" },
    { label: "Fee Balances", to: "/app/finance/balances" },
  ] },
  { label: "Academics", icon: BookOpen, items: [
    { label: "Overview", to: "/app/academics" },
    { label: "Grade Entry", to: "/app/grades" },
    { label: "Result Approval", to: "/app/approval" },
    { label: "Result PINs", to: "/app/result-pins" },
    { label: "Classes", to: "/app/classes" },
    { label: "Subjects", to: "/app/subjects" },
  ] },
  { label: "Attendance", icon: CalendarCheck, to: "/app/attendance" },
  { label: "Communication", icon: Megaphone, to: "/app/communication" },
  { label: "Documents", icon: FileText, to: "/app/documents" },
  { label: "Reports", icon: BarChart3, to: "/app/$section" },
  { label: "Settings", icon: Settings, to: "/app/$section" },
];

const portalLinks = [
  { label: "Parent Portal", to: "/app/parent", icon: Users },
  { label: "Student Portal", to: "/app/student", icon: GraduationCap },
  { label: "Staff Portal", to: "/app/staff", icon: Briefcase },
] as const;

const linkCls = "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const active = { className: "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-primary" };

function SideLink({ to, params, children, exact }: { to: string; params?: Record<string, string> | undefined; children: ReactNode; exact?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Link to={to as any} params={params as any} className={linkCls} activeProps={active} activeOptions={{ exact: exact ?? true }}>{children}</Link>;
}

function Sidebar({ onNav }: { onNav?: () => void }) {
  const [openG, setOpenG] = useState<string[]>(["People", "Finance", "Academics"]);
  return (
    <div className="flex h-full flex-col bg-sidebar" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) onNav?.(); }}>
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <Crest className="h-10 w-9" />
        <div className="leading-tight"><div className="font-display font-bold text-sidebar-accent-foreground">GIA</div><div className="text-[11px] text-sidebar-foreground/70">School Management</div></div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {groups.map((g) => g.items ? (
          <div key={g.label}>
            <button onClick={() => setOpenG((o) => o.includes(g.label) ? o.filter((x) => x !== g.label) : [...o, g.label])} className={`${linkCls} w-full`}>
              <g.icon className="h-4 w-4" /> <span className="flex-1 text-left">{g.label}</span>
              <ChevronDown className={`h-4 w-4 transition ${openG.includes(g.label) ? "" : "-rotate-90"}`} />
            </button>
            {openG.includes(g.label) && (
              <div className="ml-7 space-y-0.5 border-l border-sidebar-border pl-2">
                {g.items.map((i) => <SideLink key={i.label} to={i.to} params={i.params}>{i.label}</SideLink>)}
              </div>
            )}
          </div>
        ) : (
          <SideLink key={g.label} to={g.to!} params={g.to === "/app/$section" ? { section: g.label.toLowerCase() } : undefined}><g.icon className="h-4 w-4" />{g.label}</SideLink>
        ))}
        <div className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">Portal previews</div>
        {portalLinks.map((p) => <SideLink key={p.to} to={p.to}><p.icon className="h-4 w-4" />{p.label}</SideLink>)}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <SideLink to="/app/users"><ShieldCheck className="h-4 w-4" />User Approval</SideLink>
        <SignOut />
      </div>
    </div>
  );
}

function SignOut() {
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  return (
    <button className={`${linkCls} w-full`} onClick={async () => {
      await queryClient.cancelQueries(); queryClient.clear();
      await supabase.auth.signOut(); navigate({ to: "/login", replace: true });
    }}><LogOut className="h-4 w-4" /> Sign out</button>
  );
}

function AppShell() {
  const [open, setOpen] = useState(false);
  const { session } = Route.useRouteContext();
  const name = session.profile?.full_name || session.user.email || "User";
  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-deep/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72"><Sidebar onNav={() => setOpen(false)} /></div>
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-card" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
      )}
      <div className="lg:pl-64 print:pl-0">
        <header className="no-print sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur lg:px-8">
          <button className="grid h-10 w-10 place-items-center rounded-md border lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="relative hidden max-w-md lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search students, receipts, staff…" className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex min-w-0 items-center gap-2 lg:hidden"><Crest className="h-8 w-7 shrink-0" /><span className="truncate font-display font-bold text-primary">GIA</span></div>
          <div className="flex items-center gap-3">
            <button className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted" aria-label="Notifications"><Bell className="h-5 w-5 text-muted-foreground" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" /></button>
            <div className="flex items-center gap-2"><Avatar name={name} /><div className="hidden text-sm leading-tight sm:block"><div className="font-semibold">{name}</div><div className="text-xs text-muted-foreground">{session.primary ? roleLabel[session.primary] : ""}</div></div></div>
          </div>
        </header>
        <main className="px-4 py-6 pb-28 lg:px-8 lg:pb-10"><Outlet /></main>
      </div>
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card lg:hidden">
        {[
          { to: "/app", icon: Home, l: "Home" }, { to: "/app/students", icon: Users, l: "Students" },
          { to: "/app/finance", icon: Wallet, l: "Finance" }, { to: "/app/grades", icon: BookOpen, l: "Grades" },
        ].map((b) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Link key={b.to} to={b.to as any} activeOptions={{ exact: b.to === "/app" }} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <b.icon className="h-5 w-5" />{b.l}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"><Menu className="h-5 w-5" />More</button>
      </nav>
    </div>
  );
}
