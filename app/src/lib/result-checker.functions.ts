import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

export type ResultSubject = { subject: string; test: number | null; exam: number | null; mean: number | null; grade: string | null; remark: string | null };
export type ResultPayload = {
  status: "ok";
  school: { name: string | null; motto: string | null; logo_url: string | null; email: string | null; phone: string | null } | null;
  pupil: { name: string; pupil_id: string; class: string };
  session: { term: string; academic_year: string } | null;
  subjects: ResultSubject[];
  average: number | null;
  published_at: string | null;
  class_position: null;
};
export type CheckResultReply = ResultPayload | { status: "invalid" } | { status: "locked" } | { status: "error" };

/** Public result check. The PIN is verified inside Postgres (verify_result); this function only
 *  validates input, supplies a hashed network key for rate limiting, and forbids caching. */
export const checkResult = createServerFn({ method: "POST" })
  .inputValidator((d: { pupilId: string; pin: string; termId?: string }) => {
    const pupilId = String(d?.pupilId ?? "").trim().slice(0, 40);
    const pin = String(d?.pin ?? "").slice(0, 32);
    const termId = d?.termId && /^[0-9a-f-]{36}$/i.test(d.termId) ? d.termId : undefined;
    return { pupilId, pin, termId };
  })
  .handler(async ({ data }): Promise<CheckResultReply> => {
    setResponseHeader("Cache-Control", "no-store, max-age=0");
    setResponseHeader("Pragma", "no-cache");
    try {
      const { createHash } = await import("node:crypto");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const ip = (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() || getRequestHeader("x-real-ip") || "unknown";
      const client = createHash("sha256").update(`${process.env["RESULT_CLIENT_SALT"] ?? "gia"}|${ip}`).digest("hex");
      // verify_result is not in the generated types until types.ts is regenerated
      const { data: reply, error } = await (supabaseAdmin as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
      }).rpc("verify_result", { _pupil_id: data.pupilId, _pin: data.pin, _term: data.termId ?? null, _client: client });
      if (error || !reply) return { status: "error" };
      return reply as CheckResultReply;   // never logs the PIN
    } catch {
      return { status: "error" };
    }
  });
