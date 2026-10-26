import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/gia/Crest";
import { supabase } from "@/integrations/supabase/client";
import { loadSession, roleLabel, homeFor } from "@/lib/auth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/pending")({
  ssr: false,
  head: () => seo("Awaiting approval — GIA Digital Portal", "Your GIA account is waiting for administrator approval."),
  beforeLoad: async () => {
    const s = await loadSession();
    if (!s) throw redirect({ to: "/login" });
    if (s.roles.length) throw redirect({ to: homeFor(s.primary) as "/app" });
    return { s };
  },
  component: Pending,
});

function Pending() {
  const { s } = Route.useRouteContext();
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-background px-5">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="flex justify-center"><Wordmark /></div>
        <Clock className="mx-auto mt-8 h-12 w-12 text-gold" />
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">Awaiting approval</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you, {s.profile?.full_name || s.user.email}. Your request for a <b>{s.profile ? roleLabel[s.profile.requested_role] : ""}</b> account has been sent to the school administration. You can sign in once it is approved.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>Check again</Button>
          <Button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login", replace: true }); }}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
