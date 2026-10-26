export const schoolAddress = "New Jersey, Makama, Makeni, Sierra Leone";
export const departments = [
  { key: "science", name: "Science", hod: "H.O.D Science", photo: "chemistry",
    intro: "The Science Department builds scientific knowledge, careful observation and problem-solving through lessons, experiments and practical work in our laboratories.",
    subjects: ["Physics", "Chemistry", "Biology", "Agricultural Science", "Mathematics", "Computer Studies"],
    foundation: ["Integrated Science (J.S.S)", "Science (Grades 1–6)", "Environmental studies (Kindergarten)"],
    skills: ["Ask questions and test ideas carefully", "Carry out laboratory work safely", "Link what is learnt to everyday life", "Prepare for science-related further study"],
    leads: ["Medicine", "Nursing", "Pharmacy", "Engineering", "Laboratory science", "Agriculture"] },
  { key: "art", name: "Art", hod: "H.O.D Art", photo: "library",
    intro: "The Art Department develops clear thinking, strong communication, cultural awareness and creativity through the study of language, people and society.",
    subjects: ["Literature in English", "Government", "History", "Geography", "Christian / Islamic Religious Studies", "English Language"],
    foundation: ["Social Studies and Civic Education (J.S.S)", "Religious and Moral Education", "Creative arts, music and dance (early years)"],
    skills: ["Read widely and write clearly", "Speak with confidence", "Understand history, government and society", "Respect culture and different points of view"],
    leads: ["Law", "Teaching", "Journalism", "Public administration", "Diplomacy", "Social work"] },
  { key: "commercial", name: "Commercial", hod: "H.O.D Commercial", photo: "computers",
    intro: "The Commercial Department prepares students for the world of business, money and organisation through the study of accounts, trade and management.",
    subjects: ["Principles of Accounts", "Economics", "Commerce", "Business Management", "Mathematics", "Computer Studies"],
    foundation: [],
    skills: ["Keep simple records and accounts", "Understand how trade and money work", "Plan and manage tasks honestly", "Use the computer room for practical lessons"],
    leads: ["Accounting", "Banking", "Business management", "Economics", "Marketing", "Office administration"] },
] as const;
export const coreSubjects = [
  ["English Language", "Reading, writing and speaking with accuracy and confidence."],
  ["Mathematics", "Number, reasoning and problem-solving for every pathway."],
  ["Computer Studies", "Basic computer skills for school work and everyday life."],
  ["Civic Education", "Responsible citizenship and respect for others."],
] as const;
export const stages = [
  ["Day-care", "Safe, gentle care for our youngest learners."], ["Kindergarten", "Kindergarten 1, 2 and 3: learning through play."],
  ["Grades 1–6", "Strong foundations in reading, writing and number."], ["J.S.S 1–3", "Junior Secondary, leading to the BECE."],
  ["S.S.S 1–3", "Science, Art or Commercial, leading to the WASSCE."],
] as const;
export const terms = [
  ["First Term", "The year begins: orientation, new classes and the first assessments."],
  ["Second Term", "Mid-year tests, school activities and meetings with parents."],
  ["Third Term", "Final examinations, promotions and prize-giving."],
] as const;
export const parentGuide = [
  ["Everyday class matters, attendance or behaviour", "Your child's Form-master"],
  ["A concern about a whole stage (Day-care, Kindergarten, Grade, J.S.S, S.S.S)", "The Coordinator for that stage"],
  ["A subject, practical lesson or examination question", "The Subject Teacher, then the Head of Department"],
  ["Admission, enrolment and school records", "The Senior Administrative Officer"],
  ["School fees, payments and receipts", "The Finance Officer"],
  ["Discipline and daily school operations", "The Vice-Principal"],
  ["Serious concerns, school policy or complaints", "The Principal"],
] as const;
export const structure = ["Proprietor", "Principal", "Vice-Principal", "Senior Administrative Officer", "Finance Officer",
  "Coordinators (Day-care · Kindergarten · Grade · Junior Secondary · Senior Secondary)", "Heads of Department (Science · Art · Commercial)", "Form-masters", "Subject Teachers", "School Prefect", "General Students"] as const;
export const policy = [
  { h: "Part 1 · Privacy Policy" },
  { h: "1. Who we are", p: ["Gbonkolenken International Academy (“GIA”, “we”, “us”) is a school at New Jersey, Makama, Makeni, Sierra Leone. This policy covers our public website, online registration, the online result checker and the School Portal (our school management system)."] },
  { h: "2. Information we collect", ul: ["Admission details: student and parent or guardian names, date of birth, class applied for, address, phone number, email and previous school.", "School records: attendance, assessments, results, fee records and welfare or discipline notes, kept in the School Portal.", "Staff details: names, roles, qualifications and contact information.", "Result PIN activity: when a result was checked and whether it succeeded. We never record the PIN itself.", "Website data: basic technical information, such as browser type and pages visited, used to keep the site working."] },
  { h: "3. How we use information", ul: ["To process admissions and place learners in the right class.", "To teach, assess, report on progress and keep students safe.", "To manage fees, notices and communication with parents and guardians.", "To run the school, meet legal duties and improve our services."], p: ["We do not sell personal information, and we do not use it for third-party advertising."] },
  { h: "4. Children's information", p: ["Most of the information we hold is about children, so we collect only what the school needs and limit access to authorised staff. Photographs of students on our website or in the gallery are used to show school life. Parents or guardians may ask us to remove a photograph of their child at any time."] },
  { h: "5. Sharing, security and retention", p: ["We share information only with people who need it to educate or protect a child, with education authorities where required, or when the law demands it. School Portal access is protected by individual accounts and passwords, and records are kept only as long as needed for school and legal purposes."] },
  { h: "6. Your rights", p: ["Parents, guardians and staff may ask to see, correct or request deletion of their information, subject to school and legal record-keeping requirements. Please contact the school office using the details below."] },
  { h: "Part 2 · Terms of Use" },
  { h: "7. Using our website", p: ["By using this website you agree to use it lawfully and respectfully. You must not try to damage the site, gain unauthorised access, upload harmful files or misuse other people's information."] },
  { h: "8. School Portal accounts and result PINs", ul: ["Accounts are issued by the school to parents, students and staff for their own use only.", "A result PIN is issued by the school office for one pupil and one examination session. Keep it private; it shows published results only.", "Keep your password and PIN private and tell us at once if you suspect misuse. A lost PIN is replaced by the school office after identity is confirmed.", "We may suspend an account or revoke a PIN that breaks these terms or puts the safety of school records at risk."] },
  { h: "9. Online registration and fees", p: ["Sending a registration form is an application, not a guarantee of admission. Admission, class placement and fees are confirmed by the school after review. Please give true and complete information; false details may lead to an offer being withdrawn. Admission is open only while the notice on the Academic Programmes page says so."] },
  { h: "10. Content and liability", p: ["The GIA name, crest, text and photographs belong to the school, or are used with permission, and may not be copied for commercial use without written consent. We work to keep information accurate and the site available, but we are not liable for interruptions or for decisions made only on website content. Please confirm important details with the school office."] },
  { h: "11. Changes and governing law", p: ["We may update this page from time to time; the date above shows the latest version. These terms are governed by the laws of Sierra Leone."] },
  { h: "12. Contact us", p: ["Gbonkolenken International Academy, New Jersey, Makama, Makeni, Sierra Leone."] },
] as const;
