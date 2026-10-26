import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, School, Users, BookOpen } from "lucide-react";
import { PageHeader, Panel, Stat, Field, inputCls } from "@/components/gia/kit";
import { Modal, btnPrimary, btnGhost } from "@/components/gia/Modal";
import { initialClasses, initialSubjects, teachers, type SchoolClass } from "@/lib/academic-setup";
import { students } from "@/lib/mock";

export const Route = createFileRoute("/app/classes")({
  head: () => ({ meta: [{ title: "Classes — GIA School Management" }, { name: "robots", content: "noindex" }] }),
  component: ClassesPage,
});

const blank: SchoolClass = { id: "", name: "", level: "JSS", stream: "A", formTeacher: teachers[0]!, room: "", capacity: 40, subjects: [] };

function ClassesPage() {
  const [classes, setClasses] = useState(initialClasses);
  const [edit, setEdit] = useState<SchoolClass | null>(null);
  const subjects = initialSubjects;
  const enrolled = (name: string) => students.filter((s) => s.cls === name).length;

  const save = () => {
    if (!edit || !edit.name.trim()) return;
    setClasses((cs) => edit.id ? cs.map((c) => c.id === edit.id ? edit : c) : [...cs, { ...edit, id: `c${Date.now()}` }]);
    setEdit(null);
  };
  const toggle = (id: string) => edit && setEdit({ ...edit, subjects: edit.subjects.includes(id) ? edit.subjects.filter((s) => s !== id) : [...edit.subjects, id] });

  return (
    <>
      <PageHeader title="Classes" subtitle="Create classes, assign form teachers and the subjects each class takes."
        actions={<button className={btnPrimary} onClick={() => setEdit({ ...blank })}><Plus className="h-4 w-4" />New class</button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={School} label="Classes" value={String(classes.length)} />
        <Stat icon={Users} label="Total capacity" value={String(classes.reduce((a, c) => a + c.capacity, 0))} tone="gold" />
        <Stat icon={BookOpen} label="Subjects offered" value={String(subjects.length)} tone="green" />
      </div>
      <Panel title="All classes" action={<Link to="/app/subjects" className="text-sm font-semibold text-primary hover:underline">Manage subjects →</Link>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">Class</th><th className="pr-3">Form teacher</th><th className="pr-3">Room</th><th className="pr-3">Students</th><th className="pr-3">Subjects</th><th className="text-right">Actions</th>
            </tr></thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 pr-3"><div className="font-semibold text-primary">{c.name}</div><div className="text-xs text-muted-foreground">{c.level} • Stream {c.stream}</div></td>
                  <td className="pr-3">{c.formTeacher}</td>
                  <td className="pr-3">{c.room || "—"}</td>
                  <td className="pr-3">{enrolled(c.name)} / {c.capacity}</td>
                  <td className="pr-3"><div className="flex max-w-xs flex-wrap gap-1">{c.subjects.map((id) => { const s = subjects.find((x) => x.id === id); return s && <span key={id} className="rounded bg-info-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">{s.code}</span>; })}</div></td>
                  <td className="text-right whitespace-nowrap">
                    <button aria-label={`Edit ${c.name}`} onClick={() => setEdit({ ...c })} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted inline-grid"><Pencil className="h-4 w-4" /></button>
                    <button aria-label={`Delete ${c.name}`} onClick={() => confirm(`Delete ${c.name}?`) && setClasses((cs) => cs.filter((x) => x.id !== c.id))} className="inline-grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive-soft"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {edit && (
        <Modal title={edit.id ? `Edit ${edit.name}` : "New class"} onClose={() => setEdit(null)}
          footer={<><button className={btnGhost} onClick={() => setEdit(null)}>Cancel</button><button className={btnPrimary} disabled={!edit.name.trim()} onClick={save}>Save class</button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class name"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. JSS 1" /></Field>
            <Field label="Level"><select className={inputCls} value={edit.level} onChange={(e) => setEdit({ ...edit, level: e.target.value as SchoolClass["level"] })}><option>Primary</option><option>JSS</option><option>SSS</option></select></Field>
            <Field label="Stream"><input className={inputCls} value={edit.stream} onChange={(e) => setEdit({ ...edit, stream: e.target.value })} /></Field>
            <Field label="Room"><input className={inputCls} value={edit.room} onChange={(e) => setEdit({ ...edit, room: e.target.value })} /></Field>
            <Field label="Form teacher"><select className={inputCls} value={edit.formTeacher} onChange={(e) => setEdit({ ...edit, formTeacher: e.target.value })}>{teachers.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Capacity"><input type="number" min={1} className={inputCls} value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: Number(e.target.value) })} /></Field>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">Assigned subjects</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((s) => (
                <label key={s.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <input type="checkbox" checked={edit.subjects.includes(s.id)} onChange={() => toggle(s.id)} className="accent-primary" />
                  <span className="font-semibold text-primary">{s.code}</span> {s.name}
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
