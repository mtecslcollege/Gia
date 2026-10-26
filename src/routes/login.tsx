import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Wordmark, Crest } from "@/components/gia/Crest";
import { Field, inputCls } from "@/components/gia/kit";
import { seo } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { loadSession, homeFor, signupRoles, roleLabel, type AppRole } from "@/lib/auth";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/login")({
  head: () => seo("Sign in — GIA Digital Portal", "Sign in or request an account on the Gbonkolenken International Academy portal."),
  component: Login,
});

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [loading, setLoading] = useState(false);
  const [regOpen, setRegOpen] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("school_settings").select("registration_open").eq("id", 1).maybeSingle()
      .then(({ data }) => setRegOpen(data?.registration_open ?? true));
  }, []);

  async function go() {
    const s = await loadSession();
    if (!s) return;
    navigate({ to: (s.roles.length ? homeFor(s.primary) : "/pending") as "/app" });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    setLoading(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await go();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + "/login",
            data: { full_name: String(f.get("full_name")).trim(), phone: String(f.get("phone")).trim(), requested_role: String(f.get("role")) as AppRole },
          },
        });
        if (error) throw error;
        if (data.session) await go(); else setSent(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(/closed/i.test(msg) ? "Registration is currently closed." : msg);
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-deep text-primary-foreground lg:block">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Wordmark light />
          <div>
            <Crest className="h-20 w-16" />
            <h2 className="mt-6 font-display text-4xl font-bold">Seat of Wisdom</h2>
            <p className="mt-2 font-display text-xl italic text-gold">Excellence in Education</p>
          </div>
          <p className="text-sm text-primary-foreground/60">New Jersey Road, Off Makama Road, Makeni City</p>
        </div>
      </div>
      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden"><Wordmark /></div>
          <h1 className="mt-8 font-display text-3xl font-bold text-primary lg:mt-0">{mode === "in" ? "Welcome Back" : "Request an Account"}</h1>
          <p className="mt-1 text-muted-foreground">{mode === "in" ? "Sign in to the GIA Digital Portal." : "The school administration approves every new account."}</p>
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["in", "up"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setSent(false); }} className={`h-9 rounded-md text-sm font-semibold transition ${mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>{m === "in" ? "Sign in" : "Register"}</button>
            ))}
          </div>
          {mode === "up" && regOpen === false ? (
            <div className="mt-6 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm">Registration is currently closed. Please contact the school office.</div>
          ) : sent ? (
            <div className="mt-6 rounded-lg border bg-card p-4 text-sm">Check your email and click the confirmation link. After that, the school will review your request.</div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {mode === "up" && (<>
                <Field label="Full name"><input name="full_name" required className={inputCls} /></Field>
                <Field label="Phone"><input name="phone" className={inputCls} placeholder="+232…" /></Field>
                <Field label="I am a"><select name="role" className={inputCls} defaultValue="parent">{signupRoles.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}</select></Field>
              </>)}
              <Field label="Email"><input name="email" type="email" required className={inputCls} /></Field>
              <Field label="Password"><input name="password" type="password" required minLength={6} className={inputCls} /></Field>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}{mode === "in" ? "Sign in" : "Send request"}</Button>
            </form>
          )}
          <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to GIA Website</Link>
        </div>
      </div>
    </div>
  );
}
