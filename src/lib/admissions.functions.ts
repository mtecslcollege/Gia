import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

export type ApplicationInput = {
  pupil_name: string; dob: string; gender: string; level: string; class_applied: string; department: string;
  academic_year: string; term: string; guardian_name: string; guardian_phone: string; guardian_email: string; address: string;
  previous_school: string; last_class: string; reason_leaving: string;
  consent_true: boolean; consent_rules: boolean; consent_medical: boolean; signature_name: string;
  website?: string;   // honeypot: real people leave it empty
};
export type SubmitReply = { status: "ok"; ref: string; duplicate?: boolean } | { status: "invalid"; field: string } | { status: "closed" } | { status: "limited" } | { status: "error" };

const TEXT_FIELDS = ["pupil_name", "dob", "gender", "level", "class_applied", "department", "academic_year", "term", "guardian_name", "guardian_phone", "guardian_email", "address", "previous_school", "last_class", "reason_leaving", "signature_name"] as const;

/** Public application. Validation, duplicate guard and rate limiting live in Postgres (submit_application). */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((d: ApplicationInput) => {
    const out: Record<string, unknown> = {};
    for (const k of TEXT_FIELDS) out[k] = String((d as Record<string, unknown>)?.[k] ?? "").slice(0, 400);
    out["consent_true"] = d?.consent_true === true; out["consent_rules"] = d?.consent_rules === true; out["consent_medical"] = d?.consent_medical === true;
    return { fields: out, honeypot: String(d?.website ?? "") };
  })
  .handler(async ({ data }): Promise<SubmitReply> => {
    setResponseHeader("Cache-Control", "no-store");
    if (data.honeypot) return { status: "ok", ref: "APP-00000" };   // bots get a fake success and nothing is stored
    try {
      const { createHash } = await import("node:crypto");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const ip = (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() || getRequestHeader("x-real-ip") || "unknown";
      const client = createHash("sha256").update(`${process.env["RESULT_CLIENT_SALT"] ?? "gia"}|${ip}`).digest("hex");
      const { data: reply, error } = await (supabaseAdmin as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
      }).rpc("submit_application", { _d: data.fields, _client: client });
      if (error || !reply) return { status: "error" };
      return reply as SubmitReply;
    } catch { return { status: "error" }; }
  });
