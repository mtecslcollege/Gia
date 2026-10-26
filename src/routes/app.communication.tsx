import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Status, Field, inputCls } from "@/components/gia/kit";
import { notices as seed } from "@/lib/mock";

export const Route = createFileRoute("/app/communication")({ component: Comms });
const audiences = ["Individual", "Role", "Department", "Class", "Stage", "All Staff", "All Parents", "All Students", "Entire School"];
const tabs = ["All", "Draft", "Pending Approval", "Approved", "Published"];

function Comms() {
  const [list, setList] = useState(seed);
  const [tab, setTab] = useState("All");
  const [open, setOpen] = useState(false);
  const shown = list.filter((n) => tab === "All" || n.status === tab);
  return (
    <>
      <PageHeader title="Communication" subtitle="Notices and announcements" actions={<Button variant="gold" onClick={() => setOpen(true)}><Plus />Create Notice</Button>} />
      <div className="mb-4 flex gap-2 overflow-x-auto">{tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${tab === t ? "bg-primary text-primary-foreground" : "border bg-card"}`}>{t}</button>)}</div>
      <div className="space-y-3">
        {shown.map((n) => (
          <div key={n.id} className="grid gap-2 rounded-xl border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0"><div className="font-semibold">{n.title}</div><div className="text-sm text-muted-foreground">{n.audience} • {n.date}</div></div>
            <div className="flex gap-2"><Status value={n.priority} /><Status value={n.status} /></div>
          </div>
        ))}
        {shown.length === 0 && <p className="py-12 text-center text-muted-foreground">No notices in this status.</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Notice</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault(); const f = new FormData(e.currentTarget);
            setList([{ id: Date.now(), title: String(f.get("title")), audience: String(f.get("aud")), date: "04 Oct 2026", priority: String(f.get("pri")), status: "Pending Approval" }, ...list]);
            setOpen(false); toast.success("Notice submitted for approval");
          }}>
            <Field label="Title"><input name="title" required className={inputCls} /></Field>
            <Field label="Message"><textarea rows={4} className={`${inputCls} h-auto py-2`} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Audience"><select name="aud" className={inputCls}>{audiences.map((a) => <option key={a}>{a}</option>)}</select></Field>
              <Field label="Priority"><select name="pri" className={inputCls}><option>Normal</option><option>High</option><option>Low</option></select></Field>
            </div>
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 text-sm text-muted-foreground"><Paperclip className="h-4 w-4" />Add attachment<input type="file" className="hidden" /></label>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="gold">Submit Notice</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
