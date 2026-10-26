export const SCHOOL = {
  name: "Gbonkolenken International Academy",
  short: "GIA",
  tagline: "Seat of Wisdom • Excellence in Education",
  address: "New Jersey Road, Off Makama Road, Makeni City, Sierra Leone – West Africa",
  email: "info@gbonkolenken.edu.sl",
  phone: "+232 76 000 000",
  year: "2025 / 2026",
};

export type Student = {
  id: string; name: string; adm: string; cls: string; gender: "M" | "F";
  parent: string; parentPhone: string; status: "Active" | "Inactive" | "Graduated";
  dob: string; house: string; admitted: string; balance: number; attendance: number; average: number;
};

const first = ["Abubakar", "Fatmata", "Mohamed", "Aminata", "Ibrahim", "Mariama", "Alhaji", "Isatu", "Sorie", "Kadiatu", "Osman", "Hawa", "Santigie", "Adama", "Foday", "Zainab", "Abdul", "Christiana", "Musa", "Jeneba"];
const last = ["Kamara", "Conteh", "Sesay", "Koroma", "Bangura", "Turay", "Mansaray", "Kanu", "Jalloh", "Fofanah"];
const classes = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];
const houses = ["Blue", "Gold", "Green", "Red"];

export const students: Student[] = first.map((f, i) => {
  const l = last[i % last.length]!;
  return {
    id: `s${i + 1}`,
    name: `${f} ${l}`,
    adm: `GIA${String(i + 1).padStart(3, "0")}`,
    cls: classes[i % classes.length]!,
    gender: i % 2 === 0 ? "M" : "F",
    parent: `${i % 3 === 0 ? "Mrs." : "Mr."} ${["Alhaji", "Haja", "Pa", "Mama"][i % 4]} ${l}`,
    parentPhone: `+232 7${(i % 9) + 1} ${String(100000 + i * 7919).slice(0, 3)} ${String(100 + i * 37).slice(0, 3)}`,
    status: i === 7 ? "Inactive" : "Active",
    dob: `${(i % 27) + 1} ${["Jan", "Mar", "May", "Jul", "Sep", "Nov"][i % 6]} 20${10 + (i % 5)}`,
    house: houses[i % 4]!,
    admitted: `Sep 20${20 + (i % 5)}`,
    balance: [0, 400000, 850000, 0, 1200000, 250000][i % 6]!,
    attendance: 86 + ((i * 7) % 14),
    average: 58 + ((i * 11) % 38),
  };
});

export const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");

export const leo = (n: number) => `NLe ${n.toLocaleString("en-US")}`;

export const payments = [
  { no: "GIA-R-00248", student: "Abubakar Kamara", amount: 1500000, purpose: "School fees – Term 1", method: "Cash", date: "04 Oct 2026", status: "Completed" },
  { no: "GIA-R-00247", student: "Fatmata Conteh", amount: 800000, purpose: "School fees – Term 1", method: "Mobile Money", date: "04 Oct 2026", status: "Completed" },
  { no: "GIA-R-00246", student: "Mohamed Sesay", amount: 250000, purpose: "Uniform", method: "Bank", date: "03 Oct 2026", status: "Completed" },
  { no: "GIA-R-00245", student: "Aminata Koroma", amount: 1000000, purpose: "School fees – Term 1", method: "Mobile Money", date: "03 Oct 2026", status: "Pending" },
  { no: "GIA-R-00244", student: "Ibrahim Bangura", amount: 150000, purpose: "Exam fees", method: "Cash", date: "02 Oct 2026", status: "Completed" },
  { no: "GIA-R-00243", student: "Mariama Turay", amount: 600000, purpose: "School fees – Term 1", method: "Bank", date: "01 Oct 2026", status: "Reversed" },
];

export const applications = [
  { id: "APP-0142", name: "Hassan Kargbo", level: "JSS 1", date: "02 Oct 2026", guardian: "Mr. Sahr Kargbo", status: "Pending" },
  { id: "APP-0141", name: "Mabinty Sankoh", level: "SSS 1", date: "01 Oct 2026", guardian: "Mrs. Fatu Sankoh", status: "Under Review" },
  { id: "APP-0140", name: "Daniel Koroma", level: "JSS 2", date: "29 Sep 2026", guardian: "Mr. Peter Koroma", status: "Interview" },
  { id: "APP-0139", name: "Salamatu Jalloh", level: "KG 2", date: "28 Sep 2026", guardian: "Haja Isatu Jalloh", status: "Approved" },
  { id: "APP-0138", name: "Emmanuel Kanu", level: "Primary 4", date: "27 Sep 2026", guardian: "Mrs. Rugiatu Kanu", status: "Rejected" },
];

export const notices = [
  { id: 1, title: "School holiday announcement", audience: "Entire School", date: "16 Sep 2026", priority: "Normal", status: "Published" },
  { id: 2, title: "First term examination timetable", audience: "All Students", date: "12 Sep 2026", priority: "High", status: "Published" },
  { id: 3, title: "Parent–teacher meeting", audience: "All Parents", date: "10 Sep 2026", priority: "Normal", status: "Pending Approval" },
  { id: 4, title: "Inter-house sports day", audience: "Entire School", date: "05 Sep 2026", priority: "Low", status: "Approved" },
  { id: 5, title: "Staff development workshop", audience: "All Staff", date: "02 Sep 2026", priority: "Normal", status: "Draft" },
];

export const activities = [
  { text: "New student registered – Abdul Rahman (JSS 1)", time: "2 hours ago", kind: "student" },
  { text: "Payment received – NLe 1,500,000 (Cash)", time: "3 hours ago", kind: "payment" },
  { text: "Result submitted – SSS 2 Mathematics", time: "5 hours ago", kind: "result" },
  { text: "Admission application received – Hassan Kargbo", time: "Yesterday", kind: "admission" },
];

export const documents = [
  { name: "Receipt GIA-R-00248", cat: "Receipts", type: "PDF", date: "04 Oct 2026", status: "Issued" },
  { name: "Term 3 Report Card – Kamara A.", cat: "Report Cards", type: "PDF", date: "20 Jul 2026", status: "Published" },
  { name: "Admission Letter – Hassan Kargbo", cat: "Letters", type: "DOCX", date: "02 Oct 2026", status: "Draft" },
  { name: "Student Registration Form", cat: "Student Forms", type: "PDF", date: "01 Sep 2026", status: "Template" },
  { name: "Grade Sheet – SSS 2 Mathematics", cat: "Academic Grade Sheets", type: "XLSX", date: "30 Sep 2026", status: "Under Review" },
  { name: "Transcript – Christiana Sesay", cat: "Transcripts", type: "PDF", date: "15 Aug 2026", status: "Issued" },
  { name: "WASSCE Certificate Register", cat: "Certificates", type: "PDF", date: "10 Aug 2026", status: "Archived" },
  { name: "Staff Code of Conduct", cat: "Administrative Documents", type: "PDF", date: "01 Sep 2026", status: "Published" },
];

export const docCategories = ["Receipts", "Report Cards", "Letters", "Student Forms", "Academic Grade Sheets", "Transcripts", "Certificates", "Administrative Documents"];

export const leadership = [
  { role: "Principal", name: "Mr. John Kamara" },
  { role: "Vice Principal", name: "Mrs. Alice Bangura" },
  { role: "HOD Academics", name: "Mr. Samuel Turay" },
  { role: "HOD Administration", name: "Ms. Grace Koroma" },
];

export const approvalStages = ["Subject Teacher", "HOD", "Coordinator", "Form Master/Mistress", "Vice Principal", "Principal", "Published"];
