export type SchoolClass = { id: string; name: string; level: "Primary" | "JSS" | "SSS"; stream: string; formTeacher: string; room: string; capacity: number; subjects: string[] };
export type Subject = { id: string; code: string; name: string; dept: string; teacher: string; type: "Core" | "Elective"; periods: number };

export const teachers = ["Mr. Samuel Turay", "Mrs. Alice Bangura", "Ms. Grace Koroma", "Mr. Ibrahim Sesay", "Mrs. Fatu Conteh", "Mr. Osman Kanu", "Ms. Isatu Jalloh", "Mr. Peter Mansaray"];
export const departments = ["Sciences", "Mathematics", "Languages", "Humanities", "Commercial", "Technical", "Arts"];

export const initialSubjects: Subject[] = [
  { id: "sub1", code: "MTH", name: "Mathematics", dept: "Mathematics", teacher: "Mr. Samuel Turay", type: "Core", periods: 6 },
  { id: "sub2", code: "ENG", name: "English Language", dept: "Languages", teacher: "Mrs. Alice Bangura", type: "Core", periods: 6 },
  { id: "sub3", code: "BIO", name: "Biology", dept: "Sciences", teacher: "Ms. Grace Koroma", type: "Core", periods: 4 },
  { id: "sub4", code: "CHE", name: "Chemistry", dept: "Sciences", teacher: "Mr. Ibrahim Sesay", type: "Elective", periods: 4 },
  { id: "sub5", code: "PHY", name: "Physics", dept: "Sciences", teacher: "Mr. Ibrahim Sesay", type: "Elective", periods: 4 },
  { id: "sub6", code: "ICT", name: "Computer Studies", dept: "Technical", teacher: "Mr. Osman Kanu", type: "Core", periods: 3 },
  { id: "sub7", code: "SOC", name: "Social Studies", dept: "Humanities", teacher: "Mrs. Fatu Conteh", type: "Core", periods: 3 },
  { id: "sub8", code: "ACC", name: "Financial Accounting", dept: "Commercial", teacher: "Mr. Peter Mansaray", type: "Elective", periods: 4 },
  { id: "sub9", code: "LIT", name: "Literature in English", dept: "Languages", teacher: "Ms. Isatu Jalloh", type: "Elective", periods: 3 },
];

const all = initialSubjects.map((s) => s.id);
export const initialClasses: SchoolClass[] = [
  { id: "c1", name: "JSS 1", level: "JSS", stream: "A", formTeacher: "Mrs. Fatu Conteh", room: "Block A-01", capacity: 40, subjects: ["sub1", "sub2", "sub3", "sub6", "sub7"] },
  { id: "c2", name: "JSS 2", level: "JSS", stream: "A", formTeacher: "Mr. Osman Kanu", room: "Block A-02", capacity: 40, subjects: ["sub1", "sub2", "sub3", "sub6", "sub7"] },
  { id: "c3", name: "JSS 3", level: "JSS", stream: "A", formTeacher: "Ms. Isatu Jalloh", room: "Block A-03", capacity: 40, subjects: ["sub1", "sub2", "sub3", "sub6", "sub7"] },
  { id: "c4", name: "SSS 1", level: "SSS", stream: "Science", formTeacher: "Ms. Grace Koroma", room: "Block B-01", capacity: 35, subjects: ["sub1", "sub2", "sub3", "sub4", "sub5", "sub6"] },
  { id: "c5", name: "SSS 2", level: "SSS", stream: "Commercial", formTeacher: "Mr. Peter Mansaray", room: "Block B-02", capacity: 35, subjects: ["sub1", "sub2", "sub8", "sub7", "sub6"] },
  { id: "c6", name: "SSS 3", level: "SSS", stream: "Arts", formTeacher: "Mrs. Alice Bangura", room: "Block B-03", capacity: 35, subjects: all.filter((s) => s !== "sub5") },
];
