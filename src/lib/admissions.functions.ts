import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { FIELD_KEYS } from "@/lib/application-data";

export type FileSpec = { kind: "photo" | "birth" | "report" | "immun" | "letter"; name: string; size: number; type: string };
export type ApplicationInput = {
  fields: Record<string, string>; consent_true: boolean; consent_rules: boolean; consent_medical: boolean; files: FileSpec[]; website?: string;
};
export type UploadTicket = { kind: string; path: string; token: string };
export type SubmitReply =
  | { status: "ok"; ref: string; duplicate?: boolean; uploads: UploadTicket[] }
  | { status: "invalid"; field: string } | { status: "closed" } | { status: "limited" } | { status: "error" };

const KINDS = ["photo", "birth", "report", "immun", "letter"];
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" };
const BUCKET = "application-files";
type Rpc = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { id: string } | null }> } } };
  storage: { from: (b: string) => {
    createSignedUploadUrl: (p: string) => Promise<{ data: { token: string; path: string } | null; error: { message: string } | null }>;
    list: (prefix: string) => Promise<{ data: { name: string; metadata?: { size?: number } | null }[] | null }> } } };

async function admin(): Promise<Rpc> { return (await import("@/integrations/supabase/client.server")).supabaseAdmin as unknown as Rpc; }

/** Public application. Validation, duplicate guard and rate limits live in Postgres (submit_application).
 *  Files never pass through this function: it returns short-lived signed upload tickets and the browser uploads directly. */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((d: ApplicationInput) => {
    const fields: Record<string, unknown> = {};
    for (const k of FIELD_KEYS) fields[k] = String(d?.fields?.[k] ?? "").slice(0, 400);
    fields["consent_true"] = d?.consent_true === true; fields["consent_rules"] = d?.consent_rules === true; fields["consent_medical"] = d?.consent_medical === true;
    const files = (Array.isArray(d?.files) ? d.files : []).slice(0, 5).filter((f) => KINDS.includes(f?.kind) && EXT[String(f?.type)] && Number(f?.size) > 0
      && Number(f.size) <= (f.kind === "photo" ? 1.5e6 : 3e6) && (f.kind !== "photo" || f.type === "image/jpeg"))
      .map((f) => ({ kind: f.kind, type: String(f.type) }));
    return { fields, files, honeypot: String(d?.website ?? "") };
  })
  .handler(async ({ data }): Promise<SubmitReply> => {
    setResponseHeader("Cache-Control", "no-store");
    if (data.honeypot) return { status: "ok", ref: "APP-00000", uploads: [] };   // bots: fake success, nothing stored
    try {
      const { createHash, randomUUID } = await import("node:crypto");
      const sb = await admin();
      const ip = (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() || getRequestHeader("x-real-ip") || "unknown";
      const client = createHash("sha256").update(`${process.env["RESULT_CLIENT_SALT"] ?? "gia"}|${ip}`).digest("hex");
      const { data: r, error } = await sb.rpc("submit_application", { _d: data.fields, _client: client });
      const reply = r as { status: string; ref?: string; id?: string; duplicate?: boolean; field?: string } | null;
      if (error || !reply) return { status: "error" };
      if (reply.status !== "ok") return reply as SubmitReply;
      const uploads: UploadTicket[] = [];
      if (!reply.duplicate && reply.id) {
        for (const f of data.files) {
          const path = `${reply.id}/${f.kind}-${randomUUID().slice(0, 8)}.${EXT[f.type]}`;
          const { data: t } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
          if (t) uploads.push({ kind: f.kind, path: t.path, token: t.token });
        }
      }
      return reply.duplicate ? { status: "ok", ref: reply.ref ?? "", duplicate: true, uploads } : { status: "ok", ref: reply.ref ?? "", uploads };
    } catch { return { status: "error" }; }
  });

/** After the browser has uploaded, record which files really exist in storage against the application. */
export const finalizeApplication = createServerFn({ method: "POST" })
  .inputValidator((d: { ref: string }) => ({ ref: String(d?.ref ?? "").slice(0, 20) }))
  .handler(async ({ data }): Promise<{ ok: boolean; photo: boolean; documents: number }> => {
    setResponseHeader("Cache-Control", "no-store");
    try {
      const sb = await admin();
      const { data: app } = await sb.from("applications").select("id").eq("ref", data.ref).maybeSingle();
      if (!app) return { ok: false, photo: false, documents: 0 };
      const { data: objs } = await sb.storage.from(BUCKET).list(app.id);
      const list = objs ?? [];
      const photoObj = list.filter((o) => o.name.startsWith("photo-")).pop();
      const docs = list.filter((o) => !o.name.startsWith("photo-")).map((o) => ({ kind: o.name.split("-")[0], path: `${app.id}/${o.name}`, name: o.name, size: o.metadata?.size ?? null }));
      const { error } = await sb.rpc("attach_application_files", { _ref: data.ref, _photo: photoObj ? `${app.id}/${photoObj.name}` : null, _docs: docs });
      return { ok: !error, photo: !!photoObj, documents: docs.length };
    } catch { return { ok: false, photo: false, documents: 0 }; }
  });
