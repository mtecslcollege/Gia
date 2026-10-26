import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { PageHeader, Panel, Field, inputCls } from "@/components/gia/kit";
import { Modal, btnPrimary, btnGhost } from "@/components/gia/Modal";
import { initialClasses, initialSubjects, teachers, departments, type Subject } from "@/lib/academic-setup";

export const Route = createFileRoute("/app/subjects")({
  head: () => ({ meta: [{ title: "Subjects — GIA School Management" }, { name: "robots", content: "noindex" }] }),
  component: SubjectsPage,
});

type Draft = Subject & { classes: string[] };

function SubjectsPage() {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [classes, setClasses] = useState(initialClasses);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Draft | null>(null);

  const classesFor = (id: string) => classes.filter((c) => c.subjects.includes(id));
  const open = (s?: Subject) => setEdit(s ? { ...s, classes: classesFor(s.id).map((c) => c.id) }
    : { id: "", code: "", name: "", dept: departments[0]!, teacher: teachers[0]!, type: "Core", periods: 4, classes: [] });

  const save = () => {
    if (!edit || !edit.name.trim() || !edit.code.trim()) return;
    const { classes: assigned, ...sub } = edit;
    const id = sub.id || `sub${Date.now()}`;
    setSubjects((ss) => sub.id ? ss.map((s) => s.id === id ? { ...sub, id } : s) : [...ss, { ...sub, id }]);
    setClasses((cs) => cs.map((c) => {
      const has = c.subjects.includes(id), want = assigned.includes(c.id);
      return has === want ? c : { ...c, subjects: want ? [...c.subjects, id] : c.subjects.filter((x) => x !== id) };
    }));
    setEdit(null);
  };
  const remove = (s: Subject) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    setSubjects((ss) => ss.filter((x) => x.id !== s.id));
    setClasses((cs) => cs.map((c) => ({ ...c, subjects: c.subjects.filter((x) => x !== s.id) })));
  };
  const list = subjects.filter((s) => `${s.name} ${s.code} ${s.dept} ${s.teacher}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Subjects" subtitle="Create subjects, assign subject teachers and the classes that take them."
        actions={<button className={btnPrimary} onClick={() => open()}><Plus className="h-4 w-4" />New subject</button>} />
      <Panel title={`${subjects.length} subjects`} action={<Link to="/app/classes" className="text-sm font-semibold text-primary hover:underline">Manage classes →</Link>}>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subjects…" className={`${inputCls} pl-9`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">Code</th><th className="pr-3">Subject</th><th className="pr-3">Teacher</th><th className="pr-3">Periods/wk</th><th className="pr-3">Classes</th><th className="text-right">Actions</th>
            </tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-3 pr-3 font-mono font-bold text-primary">{s.code}</td>
                  <td className="pr-3"><div className="font-semibold">{s.name}</div><div className="text-xs text-muted-foreground">{s.dept} • <span className={s.type === "Core" ? "text-success" : "text-warning"}>{s.type}</span></div></td>
                  <td className="pr-3">{s.teacher}</td>
                  <td className="pr-3">{s.periods}</td>
                  <td className="pr-3"><div className="flex flex-wrap gap-1">{classesFor(s.id).map((c) => <span key={c.id} className="rounded bg-gold-soft px-1.5 py-0.5 text-[11px] font-semibold text-warning">{c.name}</span>)}</div></td>
                  <td className="whitespace-nowrap text-right">
                    <button aria-label={`Edit ${s.name}`} onClick={() => open(s)} className="inline-grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button aria-label={`Delete ${s.name}`} onClick={() => remove(s)} className="inline-grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive-soft"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No subjects match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {edit && (
        <Modal title={edit.id ? `Edit ${edit.name}` : "New subject"} onClose={() => setEdit(null)}
          footer={<><button className={btnGhost} onClick={() => setEdit(null)}>Cancel</button><button className={btnPrimary} disabled={!edit.name.trim() || !edit.code.trim()} onClick={save}>Save subject</button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject name"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Code"><input className={inputCls} value={edit.code} maxLength={5} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="Department"><select className={inputCls} value={edit.dept} onChange={(e) => setEdit({ ...edit, dept: e.target.value })}>{departments.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Type"><select className={inputCls} value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Subject["type"] })}><option>Core</option><option>Elective</option></select></Field>
            <Field label="Subject teacher"><select className={inputCls} value={edit.teacher} onChange={(e) => setEdit({ ...edit, teacher: e.target.value })}>{teachers.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Periods per week"><input type="number" min={1} className={inputCls} value={edit.periods} onChange={(e) => setEdit({ ...edit, periods: Number(e.target.value) })} /></Field>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">Taught in classes</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {classes.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <input type="checkbox" className="accent-primary" checked={edit.classes.includes(c.id)}
                    onChange={() => setEdit({ ...edit, classes: edit.classes.includes(c.id) ? edit.classes.filter((x) => x !== c.id) : [...edit.classes, c.id] })} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
