import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Search, Eye, Pencil, Ban, SearchX, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Status, Avatar, inputCls } from "@/components/gia/kit";
import { Modal, btnGhost, btnPrimary } from "@/components/gia/Modal";
import { studentsQuery, saveStudent, setStudentStatus, type StudentRow } from "@/lib/students";

export const Route = createFileRoute("/app/students/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(studentsQuery),
  errorComponent: ({ error }) => <p className="py-20 text-center text-destructive">Could not load students: {(error as Error).message}</p>,
  notFoundComponent: () => <p className="py-20 text-center text-muted-foreground">Not found.</p>,
  component: Students,
});

const CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];

function Students() {
  const { data: students } = useSuspenseQuery(studentsQuery);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const [gender, setGender] = useState("All");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<StudentRow | "new" | null>(null);
  const list = useMemo(() => students.filter((s) =>
    (s.full_name.toLowerCase().includes(q.toLowerCase()) || s.adm_no.toLowerCase().includes(q.toLowerCase())) &&
    (cls === "All" || s.class_name === cls) && (gender === "All" || s.gender === gender) && (status === "All" || s.status === status)), [students, q, cls, gender, status]);
  const sel = `${inputCls} h-10`;
  const refresh = () => qc.invalidateQueries({ queryKey: ["students"] });

  const toggle = async (s: StudentRow) => {
    const next = s.status === "Active" ? "Inactive" : "Active";
    try { await setStudentStatus(s.id, next); toast.success(`${s.full_name} is now ${next}`); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <>
      <PageHeader title="Students" subtitle={`${students.length} students enrolled • 2025/2026`} actions={<Button variant="gold" onClick={() => setEditing("new")}><Plus />Add Student</Button>} />
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="grid gap-3 border-b p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or admission no." className={`${sel} pl-9`} /></div>
          <select className={sel} value={cls} onChange={(e) => setCls(e.target.value)}>{["All", ...CLASSES].map((c) => <option key={c} value={c}>{c === "All" ? "All classes" : c}</option>)}</select>
          <select className={sel} value={gender} onChange={(e) => setGender(e.target.value)}><option value="All">All genders</option><option value="M">Male</option><option value="F">Female</option></select>
          <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}><option value="All">All statuses</option><option>Active</option><option>Inactive</option><option>Graduated</option></select>
        </div>
        {list.length === 0 ? (
          <div className="py-16 text-center"><SearchX className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-medium">No students found</p><p className="text-sm text-muted-foreground">Try a different search, or add a student.</p></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>{["Student", "Adm. No", "Class", "Gender", "Guardian", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {list.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={s.full_name} /><span className="font-medium">{s.full_name}</span></div></td>
                      <td className="px-4 py-3 font-mono text-xs">{s.adm_no}</td>
                      <td className="px-4 py-3">{s.class_name}</td>
                      <td className="px-4 py-3">{s.gender}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.guardian_name ?? "—"}</td>
                      <td className="px-4 py-3"><Status value={s.status} /></td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label="View"><Link to="/app/students/$id" params={{ id: s.id }}><Eye /></Link></Button>
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(s)}><Pencil /></Button>
                        <Button variant="ghost" size="icon" aria-label={s.status === "Active" ? "Deactivate" : "Reactivate"} onClick={() => toggle(s)}>{s.status === "Active" ? <Ban /> : <RotateCcw />}</Button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y md:hidden">
              {list.map((s) => (
                <li key={s.id}><Link to="/app/students/$id" params={{ id: s.id }} className="flex items-center gap-3 p-4">
                  <Avatar name={s.full_name} size="h-11 w-11 text-sm" />
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{s.full_name}</div><div className="text-xs text-muted-foreground">{s.adm_no} • {s.class_name} • {s.gender}</div></div>
                  <Status value={s.status} />
                </Link></li>
              ))}
            </ul>
          </>
        )}
      </div>
      {editing && <StudentForm student={editing === "new" ? null : editing} nextAdm={nextAdm(students)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </>
  );
}

function nextAdm(list: StudentRow[]) {
  const max = list.reduce((m, s) => Math.max(m, parseInt(s.adm_no.replace(/\D/g, ""), 10) || 0), 0);
  return `GIA${String(max + 1).padStart(3, "0")}`;
}

function StudentForm({ student, nextAdm, onClose, onSaved }: { student: StudentRow | null; nextAdm: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    adm_no: student?.adm_no ?? nextAdm,
    full_name: student?.full_name ?? "",
    class_name: student?.class_name ?? "JSS 1",
    gender: student?.gender ?? "M",
    dob: student?.dob ?? "",
    house: student?.house ?? "",
    guardian_name: student?.guardian_name ?? "",
    guardian_phone: student?.guardian_phone ?? "",
    fees_due: String(student?.fees_due ?? 0),
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    if (!f.full_name.trim() || !f.adm_no.trim()) { toast.error("Name and admission number are required"); return; }
    setBusy(true);
    try {
      await saveStudent({ ...f, full_name: f.full_name.trim(), dob: f.dob || null, house: f.house || null, guardian_name: f.guardian_name || null, guardian_phone: f.guardian_phone || null, fees_due: Number(f.fees_due) || 0 }, student?.id);
      toast.success(student ? "Student updated" : "Student added");
      onSaved();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const field = (label: string, el: React.ReactNode) => <label className="block text-sm"><span className="mb-1 block font-medium">{label}</span>{el}</label>;
  const ic = `${inputCls} h-10`;
  return (
    <Modal title={student ? "Edit student" : "Add student"} onClose={onClose} footer={<><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save"}</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("Full name", <input className={ic} value={f.full_name} onChange={set("full_name")} />)}
        {field("Admission no.", <input className={ic} value={f.adm_no} onChange={set("adm_no")} />)}
        {field("Class", <select className={ic} value={f.class_name} onChange={set("class_name")}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select>)}
        {field("Gender", <select className={ic} value={f.gender} onChange={set("gender")}><option value="M">Male</option><option value="F">Female</option></select>)}
        {field("Date of birth", <input type="date" className={ic} value={f.dob} onChange={set("dob")} />)}
        {field("House", <select className={ic} value={f.house} onChange={set("house")}><option value="">—</option>{["Blue", "Gold", "Green", "Red"].map((h) => <option key={h}>{h}</option>)}</select>)}
        {field("Guardian name", <input className={ic} value={f.guardian_name} onChange={set("guardian_name")} />)}
        {field("Guardian phone", <input className={ic} value={f.guardian_phone} onChange={set("guardian_phone")} />)}
        {field("Fees due (NLe)", <input type="number" className={ic} value={f.fees_due} onChange={set("fees_due")} />)}
      </div>
    </Modal>
  );
}
