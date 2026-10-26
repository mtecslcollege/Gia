import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { allRoles, roleLabel, type AppRole } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const Route = createFileRoute("/app/users")({
  head: () => ({ meta: [{ title: "User Approval — GIA" }, { name: "robots", content: "noindex" }] }),
  component: Users,
});

function Users() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole[]>>({});
  const [pick, setPick] = useState<Record<string, AppRole>>({});
  const [open, setOpen] = useState<boolean | null>(null);

  async function load() {
    const [p, r, s] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("school_settings").select("registration_open").eq("id", 1).maybeSingle(),
    ]);
    setRows(p.data ?? []);
    const m: Record<string, AppRole[]> = {};
    (r.data ?? []).forEach((x) => { (m[x.user_id] ??= []).push(x.role); });
    setRoles(m);
    setOpen(s.data?.registration_open ?? null);
  }
  useEffect(() => { load(); }, []);

  async function toggleGate() {
    const { error } = await supabase.from("school_settings").update({ registration_open: !open, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success(!open ? "Registration opened" : "Registration closed"); load();
  }
  async function approve(p: Profile) {
    const { error } = await supabase.rpc("approve_user", { _user_id: p.id, _role: pick[p.id] ?? p.requested_role });
    if (error) { toast.error(error.message); return; }
    toast.success(`${p.full_name || p.email} approved`); load();
  }
  async function revoke(p: Profile) {
    const { error } = await supabase.rpc("revoke_user", { _user_id: p.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Access removed"); load();
  }

  const pending = rows.filter((p) => !(roles[p.id]?.length));
  const active = rows.filter((p) => roles[p.id]?.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold text-primary">User Approval</h1><p className="text-sm text-muted-foreground">Approve new accounts and control who can register.</p></div>
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2 text-sm">
          Registration is <b className={open ? "text-success" : "text-destructive"}>{open === null ? "…" : open ? "Open" : "Closed"}</b>
          <button onClick={toggleGate} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">{open ? "Close" : "Open"}</button>
        </div>
      </div>

      <section className="rounded-xl border bg-card">
        <h2 className="border-b px-5 py-3 font-semibold">Waiting for approval ({pending.length})</h2>
        {pending.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No requests waiting.</p> : pending.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 border-b px-5 py-3 last:border-0">
            <div className="min-w-0 flex-1"><div className="font-medium">{p.full_name || "—"}</div><div className="truncate text-xs text-muted-foreground">{p.email} {p.phone && `• ${p.phone}`} • asked for {roleLabel[p.requested_role]}</div></div>
            <select value={pick[p.id] ?? p.requested_role} onChange={(e) => setPick({ ...pick, [p.id]: e.target.value as AppRole })} className="h-9 rounded-md border bg-background px-2 text-sm">
              {allRoles.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
            </select>
            <button onClick={() => approve(p)} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Approve</button>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card">
        <h2 className="border-b px-5 py-3 font-semibold">Active accounts ({active.length})</h2>
        {active.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 border-b px-5 py-3 last:border-0">
            <div className="min-w-0 flex-1"><div className="font-medium">{p.full_name || "—"}</div><div className="truncate text-xs text-muted-foreground">{p.email}</div></div>
            <div className="flex flex-wrap gap-1">{roles[p.id]!.map((r) => <span key={r} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{roleLabel[r]}</span>)}</div>
            <button onClick={() => revoke(p)} className="h-9 rounded-md border px-3 text-sm text-destructive">Remove access</button>
          </div>
        ))}
      </section>
    </div>
  );
}
