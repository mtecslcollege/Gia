import campus from "@/assets/school/hero-campus.jpg.asset.json";
import front from "@/assets/school/campus-front.jpg.asset.json";
import gate from "@/assets/school/school-gate.jpg.asset.json";
import kindergarten from "@/assets/school/kindergarten.jpg.asset.json";
import daycare from "@/assets/school/daycare-room.jpg.asset.json";
import computers from "@/assets/school/computer-lab.jpg.asset.json";
import library from "@/assets/school/library.jpg.asset.json";
import science from "@/assets/school/science-lab.jpg.asset.json";
import chemistry from "@/assets/school/lab-chemistry.jpg.asset.json";
import microscopes from "@/assets/school/microscopes.jpg.asset.json";
import corridor from "@/assets/school/corridor.jpg.asset.json";

export const schoolPhotos = { campus: campus.url, front: front.url, gate: gate.url, kindergarten: kindergarten.url, daycare: daycare.url, computers: computers.url, library: library.url, science: science.url, chemistry: chemistry.url, microscopes: microscopes.url, corridor: corridor.url };
export const schoolEmail = "infogia@gmail.com";
export const programmes = [
  { title: "Day-care", stage: "Early years", image: schoolPhotos.daycare, text: "A warm, caring environment with guided play, storytelling and gentle daily routines." },
  { title: "Kindergarten 1–3", stage: "First discoveries", image: schoolPhotos.kindergarten, text: "Learning through play, early reading, number skills, creativity and friendship." },
  { title: "Grades 1–6", stage: "Strong foundations", image: schoolPhotos.library, text: "Reading, writing, Mathematics, Science and practical skills that encourage curiosity and confidence." },
  { title: "JSS 1–3", stage: "BECE pathway", image: schoolPhotos.science, text: "English, Mathematics, Integrated Science, Computer Studies and more, with steady preparation for the BECE." },
  { title: "SSS 1–3", stage: "WASSCE pathway", image: schoolPhotos.chemistry, text: "Focused study in Science, Art or Commercial, preparing learners for the WASSCE, further study and careers." },
];
export const galleryPhotos = [
  { src: schoolPhotos.front, cat: "Campus", title: "Our school in Makama" },
  { src: schoolPhotos.gate, cat: "Campus", title: "The school entrance" },
  { src: schoolPhotos.corridor, cat: "Campus", title: "Along the school corridor" },
  { src: schoolPhotos.kindergarten, cat: "Early Years", title: "Kindergarten classroom" },
  { src: schoolPhotos.daycare, cat: "Early Years", title: "Day-care room" },
  { src: schoolPhotos.science, cat: "Laboratories", title: "Science laboratory" },
  { src: schoolPhotos.chemistry, cat: "Laboratories", title: "Chemistry apparatus" },
  { src: schoolPhotos.microscopes, cat: "Laboratories", title: "Biology microscopes" },
  { src: schoolPhotos.computers, cat: "Learning Spaces", title: "Computer room" },
  { src: schoolPhotos.library, cat: "Learning Spaces", title: "School library" },
];