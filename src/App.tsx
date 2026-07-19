import { useEffect, useRef, useState, type ChangeEvent } from "react";

type Grade = "7" | "8" | "9" | "10" | "11" | "12";
type Mode = "yearlong" | "semester";
type SelectionField = "primary" | "secondary";
type ElectiveFormat = "two-yearlong" | "mixed" | "four-semester";
type GpaMode = "unweighted" | "weighted";
type DiplomaType = "standard" | "advanced";
type GradeMark = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "F";

type EligibilityRequirement = {
  id: string;
  label: string;
  detail: string;
};

type Course = {
  id: string;
  label: string;
  highSchoolCredit?: boolean;
  gpaWeight?: 0.5 | 1;
  unavailableReason?: string;
  allowedGrades?: Grade[];
  gradeRestrictionReason?: string;
  eligibilityRequirements?: EligibilityRequirement[];
  earlyPlacement?: {
    typicalGrade: Grade;
    anyOf: string[];
    label: string;
  };
  prerequisite?: {
    anyOf: string[];
    allOf?: string[][];
    label: string;
  };
};

type CoreSlot = {
  id: string;
  label: string;
  kind: "core";
  courses: Course[];
};

type ElectiveSlot = {
  id: string;
  label: string;
  kind: "elective";
  yearlong: Course[];
  semester: Course[];
};

type Slot = CoreSlot | ElectiveSlot;

type Plan = {
  school: "middle" | "high";
  note: string;
  usesElectiveFormats: boolean;
  slots: Slot[];
};

type Selection = {
  mode: Mode;
  primary: string;
  secondary: string;
  primaryGrade: GradeMark | "";
  secondaryGrade: GradeMark | "";
};

type Selections = Record<Grade, Record<string, Selection>>;

type SavedPlan = {
  studentName: string;
  selections: Selections;
  lockedSelections: Record<string, boolean>;
  priorCourses: string[];
  priorCourseGrades: Record<string, GradeMark | "">;
  diplomaType: DiplomaType;
  eligibilityChecks: Record<string, boolean>;
};

type ExportedPlan = SavedPlan & {
  formatVersion: 1;
  title: string;
  exportedAt: string;
  activeView: "overview" | `grade-${Grade}`;
};

type PlannerSnapshot = Omit<SavedPlan, "studentName">;

type CourseFamily = {
  id: string;
  label: string;
  courses: Course[];
};

type CourseVersionDetails = {
  familyId: string;
  familyLabel: string;
  versionLabel: string;
};

type CreditCategory = "english" | "math" | "science" | "social" | "healthPe" | "worldLanguage" | "fineArtsCte" | "epf" | "elective";

type RequirementRow = {
  id: string;
  label: string;
  required: number;
  planned: number;
};

type SourceLink = {
  label: string;
  url: string;
};

const sources = {
  carsonAdvising: { label: "Rachel Carson academic advising", url: "https://carsonms.fcps.edu/student-services/academic-advising-course-selection" },
  carsonBooklet: { label: "Rachel Carson 2026–27 course booklet", url: "https://carsonms.fcps.edu/sites/default/files/media/inline-files/26-27course%20catalog%20booklet.pdf" },
  carsonGrade7: { label: "Rachel Carson grade 7 selection sheet", url: "https://carsonms.fcps.edu/sites/default/files/media/inline-files/CourseSelectionSheet7%20DRAFT2026-2027_0.pdf" },
  carsonGrade8: { label: "Rachel Carson grade 8 selection sheet", url: "https://carsonms.fcps.edu/sites/default/files/media/inline-files/CourseSelectionSheet8%202026-2027_0.pdf" },
  skyviewSchool: { label: "Skyview official school page", url: "https://www.fcps.edu/skyview" },
  skyviewAdvising: { label: "Skyview academic advising", url: "https://skyviewhs.fcps.edu/student-services/course-selection-academic-advising" },
  skyviewFaq: { label: "Skyview frequently asked questions", url: "https://skyviewhs.fcps.edu/about/frequently-asked-questions" },
  courseCatalogs: { label: "FCPS course catalogs", url: "https://www.fcps.edu/academics/coursecatalogs" },
  dualEnrollment: { label: "FCPS Dual Enrollment", url: "https://www.fcps.edu/academics/dual-enrollment" },
  dualEnrollmentAdmissions: { label: "FCPS Dual Enrollment admissions criteria", url: "https://www.fcps.edu/academics/dual-enrollment/dual-enrollment-admissions-criteria" },
  middleMath: { label: "FCPS middle-school mathematics", url: "https://www.fcps.edu/academics/middle/mathematics" },
  mathSequence: { label: "FCPS mathematics course sequencing", url: "https://www.fcps.edu/academics/graduation-requirements/course-sequencing/course-sequencing-mathematics" },
  socialStudiesSequence: { label: "FCPS social studies course sequencing", url: "https://www.fcps.edu/academics/graduation-requirements/course-sequencing/course-sequencing-social-studies" },
  graduation: { label: "FCPS graduation requirements", url: "https://www.fcps.edu/graduation-requirements-and-course-planning/first-time-ninth-2018-19" },
} satisfies Record<string, SourceLink>;

const allSources = Object.values(sources);

function uniqueSources(items: SourceLink[]) {
  return items.filter((item, index) => items.findIndex((candidate) => candidate.url === item.url) === index);
}

function sourcesForGrade(grade: Grade) {
  if (grade === "7") return [sources.carsonAdvising, sources.carsonBooklet, sources.carsonGrade7];
  if (grade === "8") return [sources.carsonAdvising, sources.carsonBooklet, sources.carsonGrade8];
  return [sources.skyviewSchool, sources.skyviewAdvising, sources.skyviewFaq, sources.courseCatalogs];
}

function sourcesForCourse(grade: Grade, item: Course, subject: string) {
  const items = sourcesForGrade(grade);
  if (grade === "7" || grade === "8") items.push(sources.courseCatalogs);
  if (subject === "Math") {
    if (grade === "7" || grade === "8") items.push(sources.middleMath);
    items.push(sources.mathSequence);
  }
  if (subject === "Social Studies") items.push(sources.socialStudiesSequence);
  if (collegeCreditDetails[item.id]) items.push(sources.dualEnrollment, sources.dualEnrollmentAdmissions);
  return uniqueSources(items);
}

function SourceLinks({ items, label = "Sources" }: { items: SourceLink[]; label?: string }) {
  const uniqueItems = uniqueSources(items);
  return (
    <details className="source-links">
      <summary>{label} ({uniqueItems.length})</summary>
      <ul>
        {uniqueItems.map((item) => (
          <li key={item.url}><a href={item.url} target="_blank" rel="noreferrer">{item.label}</a></li>
        ))}
      </ul>
    </details>
  );
}

const electiveFormats: { id: ElectiveFormat; label: string; detail: string; modes: [Mode, Mode] }[] = [
  { id: "two-yearlong", label: "2 full-year courses", detail: "One course in each elective period", modes: ["yearlong", "yearlong"] },
  { id: "mixed", label: "1 full-year + 2 semester courses", detail: "One full-year period and one split period", modes: ["yearlong", "semester"] },
  { id: "four-semester", label: "4 semester courses", detail: "Two courses in each elective period", modes: ["semester", "semester"] },
];

const gradePoints: Record<GradeMark, number> = {
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  "D+": 1.3,
  D: 1,
  F: 0,
};

const gradeMarks = Object.keys(gradePoints) as GradeMark[];

const course = (id: string, label: string, extra: Omit<Course, "id" | "label"> = {}): Course => {
  const item: Course = { id, label, ...extra };
  if (item.highSchoolCredit && item.gpaWeight === undefined && /Honors|HN/.test(label)) item.gpaWeight = 0.5;
  return item;
};
const requires = (anyOf: string[], label: string) => ({ prerequisite: { anyOf, label } });
const requiresAll = (allOf: string[][], label: string) => ({ prerequisite: { anyOf: allOf.flat(), allOf, label } });
const earlyPlacement = (typicalGrade: Grade, anyOf: string[], label: string) => ({ earlyPlacement: { typicalGrade, anyOf, label } });

const deApplicationRequirement: EligibilityRequirement = {
  id: "de-application",
  label: "Partner-college application completed",
  detail: "The college must admit and enroll the student in the DE section.",
};
const deReadinessRequirement: EligibilityRequirement = {
  id: "de-readiness",
  label: "College-readiness requirement met",
  detail: "FCPS/NOVA may use GPA or qualifying PSAT, SAT, ACT, or placement results, depending on the course.",
};
const deMathPlacementRequirement: EligibilityRequirement = {
  id: "de-math-placement",
  label: "DE mathematics placement confirmed",
  detail: "Math DE courses have course-specific placement and transcript requirements in addition to the high-school sequence.",
};
const deUnderclassRequirement: EligibilityRequirement = {
  id: "de-underclass-exception",
  label: "Grade 10 exception approved",
  detail: "NOVA DE normally serves grades 11–12; grade 10 participation requires a course-specific exception.",
};
const advancedCalculusRequirement: EligibilityRequirement = {
  id: "advanced-calculus-qualification",
  label: "Qualifying college calculus record or AP Calculus BC score",
  detail: "FCPS/NOVA requires Calculus 1 & 2 DE with a qualifying college grade or an AP Calculus BC exam score of 3 or higher.",
};

const mathDePattern = /precalculus|calculus|differential-equations/;
const dualEnrollmentCourse = (id: string, label: string, extra: Omit<Course, "id" | "label" | "highSchoolCredit" | "gpaWeight" | "allowedGrades" | "gradeRestrictionReason"> = {}) => {
  const eligibilityRequirements = [
    deApplicationRequirement,
    deReadinessRequirement,
    ...(mathDePattern.test(id) ? [deMathPlacementRequirement] : []),
    ...(extra.eligibilityRequirements ?? []),
  ];
  return course(id, label, {
    highSchoolCredit: true,
    gpaWeight: 1,
    allowedGrades: ["10", "11", "12"],
    gradeRestrictionReason: "Dual Enrollment is limited to eligible high-school students; grade 10 eligibility is course-specific",
    ...extra,
    eligibilityRequirements,
  });
};

const courseVersionDetails: Record<string, CourseVersionDetails> = {
  english7: { familyId: "english-7", familyLabel: "English 7", versionLabel: "Standard" },
  english7h: { familyId: "english-7", familyLabel: "English 7", versionLabel: "Honors" },
  english7aa: { familyId: "english-7", familyLabel: "English 7", versionLabel: "AAP Center" },
  english8: { familyId: "english-8", familyLabel: "English 8", versionLabel: "Standard" },
  english8h: { familyId: "english-8", familyLabel: "English 8", versionLabel: "Honors" },
  english8aa: { familyId: "english-8", familyLabel: "English 8", versionLabel: "AAP Center" },
  english9: { familyId: "english-9", familyLabel: "English 9", versionLabel: "Standard" },
  english9h: { familyId: "english-9", familyLabel: "English 9", versionLabel: "Honors" },
  english10: { familyId: "english-10", familyLabel: "English 10", versionLabel: "Standard" },
  english10h: { familyId: "english-10", familyLabel: "English 10", versionLabel: "Honors" },
  english11: { familyId: "english-11", familyLabel: "English 11", versionLabel: "Standard" },
  english11h: { familyId: "english-11", familyLabel: "English 11", versionLabel: "Honors" },
  "ap-language": { familyId: "english-11", familyLabel: "English 11", versionLabel: "AP Language" },
  "english11-de": { familyId: "english-11", familyLabel: "English 11", versionLabel: "Dual Enrollment Composition" },
  english12: { familyId: "english-12", familyLabel: "English 12", versionLabel: "Standard" },
  english12h: { familyId: "english-12", familyLabel: "English 12", versionLabel: "Honors" },
  "ap-literature": { familyId: "english-12", familyLabel: "English 12", versionLabel: "AP Literature" },
  "english12-de-composition": { familyId: "english-12", familyLabel: "English 12", versionLabel: "Dual Enrollment Composition" },
  "english12-de-literature": { familyId: "english-12", familyLabel: "English 12", versionLabel: "Dual Enrollment Literature" },
  prealgebra: { familyId: "prealgebra", familyLabel: "Pre-Algebra", versionLabel: "Standard" },
  prealgebrah: { familyId: "prealgebra", familyLabel: "Pre-Algebra", versionLabel: "Honors" },
  algebra1: { familyId: "algebra-1", familyLabel: "Algebra 1", versionLabel: "Standard" },
  algebra1h: { familyId: "algebra-1", familyLabel: "Algebra 1", versionLabel: "Honors" },
  geometry: { familyId: "geometry", familyLabel: "Geometry", versionLabel: "Standard" },
  geometryh: { familyId: "geometry", familyLabel: "Geometry", versionLabel: "Honors" },
  algebra2: { familyId: "algebra-2", familyLabel: "Algebra 2", versionLabel: "Standard" },
  algebra2h: { familyId: "algebra-2", familyLabel: "Algebra 2", versionLabel: "Honors" },
  precalculus: { familyId: "precalculus", familyLabel: "Precalculus with Trigonometry", versionLabel: "Standard" },
  "precalculus-h": { familyId: "precalculus", familyLabel: "Precalculus with Trigonometry", versionLabel: "Honors" },
  "ap-precalculus": { familyId: "precalculus", familyLabel: "Precalculus with Trigonometry", versionLabel: "AP" },
  "precalculus-de": { familyId: "precalculus", familyLabel: "Precalculus with Trigonometry", versionLabel: "Dual Enrollment" },
  "ap-calculus-ab": { familyId: "calculus", familyLabel: "Calculus", versionLabel: "AP AB" },
  "ap-calculus-bc": { familyId: "calculus", familyLabel: "Calculus", versionLabel: "AP BC" },
  "calculus1-de": { familyId: "calculus", familyLabel: "Calculus", versionLabel: "Dual Enrollment Calculus 1" },
  "calculus12-de": { familyId: "calculus", familyLabel: "Calculus", versionLabel: "Dual Enrollment Calculus 1 & 2" },
  "probability-statistics": { familyId: "statistics", familyLabel: "Statistics", versionLabel: "Probability & Statistics" },
  "ap-statistics": { familyId: "statistics", familyLabel: "Statistics", versionLabel: "AP" },
  "multivariable-linear-algebra-de": { familyId: "multivariable-linear-algebra", familyLabel: "Multivariable Calculus / Linear Algebra", versionLabel: "Dual Enrollment" },
  "differential-equations-de": { familyId: "differential-equations", familyLabel: "Differential Equations", versionLabel: "Dual Enrollment" },
  science7: { familyId: "science-7", familyLabel: "Science 7", versionLabel: "Standard" },
  science7h: { familyId: "science-7", familyLabel: "Science 7", versionLabel: "Honors" },
  science7aa: { familyId: "science-7", familyLabel: "Science 7", versionLabel: "AAP Center" },
  science8: { familyId: "science-8", familyLabel: "Science 8", versionLabel: "Standard" },
  science8h: { familyId: "science-8", familyLabel: "Science 8", versionLabel: "Honors" },
  science8aa: { familyId: "science-8", familyLabel: "Science 8", versionLabel: "AAP Center" },
  biology: { familyId: "biology", familyLabel: "Biology", versionLabel: "Standard" },
  biologyh: { familyId: "biology", familyLabel: "Biology", versionLabel: "Honors" },
  "ap-biology": { familyId: "biology", familyLabel: "Biology", versionLabel: "AP" },
  "biology2-de": { familyId: "biology-2", familyLabel: "Biology 2", versionLabel: "Dual Enrollment" },
  chemistry: { familyId: "chemistry", familyLabel: "Chemistry", versionLabel: "Standard" },
  chemistryh: { familyId: "chemistry", familyLabel: "Chemistry", versionLabel: "Honors" },
  "ap-chemistry": { familyId: "chemistry", familyLabel: "Chemistry", versionLabel: "AP" },
  "chemistry2-de": { familyId: "chemistry-2", familyLabel: "Chemistry 2", versionLabel: "Dual Enrollment" },
  physics: { familyId: "physics", familyLabel: "Physics", versionLabel: "Standard" },
  physicsh: { familyId: "physics", familyLabel: "Physics", versionLabel: "Honors" },
  "ap-physics": { familyId: "physics", familyLabel: "Physics", versionLabel: "AP" },
  "physics1-de": { familyId: "physics", familyLabel: "Physics", versionLabel: "Dual Enrollment" },
  "environmental-science": { familyId: "environmental-science", familyLabel: "Environmental Science", versionLabel: "Standard" },
  "ap-environmental": { familyId: "environmental-science", familyLabel: "Environmental Science", versionLabel: "AP" },
  "environmental-science-de": { familyId: "environmental-science", familyLabel: "Environmental Science", versionLabel: "Dual Enrollment" },
  history7: { familyId: "history-7", familyLabel: "U.S. History 7", versionLabel: "Standard" },
  history7h: { familyId: "history-7", familyLabel: "U.S. History 7", versionLabel: "Honors" },
  history7aa: { familyId: "history-7", familyLabel: "U.S. History 7", versionLabel: "AAP Center" },
  civics: { familyId: "civics-8", familyLabel: "Civics 8", versionLabel: "Standard" },
  civicsh: { familyId: "civics-8", familyLabel: "Civics 8", versionLabel: "Honors" },
  civicsaa: { familyId: "civics-8", familyLabel: "Civics 8", versionLabel: "AAP Center" },
  "world-history1": { familyId: "world-history-1", familyLabel: "World History & Geography 1", versionLabel: "Standard" },
  "world-history1h": { familyId: "world-history-1", familyLabel: "World History & Geography 1", versionLabel: "Honors" },
  "world-history1-de": { familyId: "world-history-1", familyLabel: "World History & Geography 1", versionLabel: "Dual Enrollment" },
  "world-history2": { familyId: "world-history-2", familyLabel: "World History & Geography 2", versionLabel: "Standard" },
  "world-history2h": { familyId: "world-history-2", familyLabel: "World History & Geography 2", versionLabel: "Honors" },
  "ap-world": { familyId: "world-history-2", familyLabel: "World History & Geography 2", versionLabel: "AP World History" },
  "world-history2-de": { familyId: "world-history-2", familyLabel: "World History & Geography 2", versionLabel: "Dual Enrollment" },
  "us-history": { familyId: "us-history", familyLabel: "Virginia & U.S. History", versionLabel: "Standard" },
  "us-historyh": { familyId: "us-history", familyLabel: "Virginia & U.S. History", versionLabel: "Honors" },
  "ap-us-history": { familyId: "us-history", familyLabel: "Virginia & U.S. History", versionLabel: "AP U.S. History" },
  "us-history-de": { familyId: "us-history", familyLabel: "Virginia & U.S. History", versionLabel: "Dual Enrollment" },
  government: { familyId: "government", familyLabel: "Virginia & U.S. Government", versionLabel: "Standard" },
  governmenth: { familyId: "government", familyLabel: "Virginia & U.S. Government", versionLabel: "Honors" },
  "ap-government": { familyId: "government", familyLabel: "Virginia & U.S. Government", versionLabel: "AP Government" },
  "government-de": { familyId: "government", familyLabel: "Virginia & U.S. Government", versionLabel: "Dual Enrollment" },
  spanish4: { familyId: "spanish-4", familyLabel: "Spanish 4", versionLabel: "Standard" },
  "spanish4-de": { familyId: "spanish-4", familyLabel: "Spanish 4", versionLabel: "Dual Enrollment" },
  french4: { familyId: "french-4", familyLabel: "French 4", versionLabel: "Standard" },
  "french4-de": { familyId: "french-4", familyLabel: "French 4", versionLabel: "Dual Enrollment" },
  "computer-science": { familyId: "cs-programming", familyLabel: "CS Programming", versionLabel: "Standard" },
  "cs-programming-de": { familyId: "cs-programming", familyLabel: "CS Programming", versionLabel: "Dual Enrollment" },
  "advanced-programming": { familyId: "advanced-programming", familyLabel: "Advanced Programming", versionLabel: "Standard" },
  "advanced-programming-de": { familyId: "advanced-programming", familyLabel: "Advanced Programming", versionLabel: "Dual Enrollment" },
};

const collegeCreditDetails: Record<string, { credits: number; provider: string; note?: string }> = {
  "english11-de": { credits: 6, provider: "NOVA", note: "ENG 111 and ENG 112" },
  "english12-de-composition": { credits: 6, provider: "NOVA", note: "ENG 111 and ENG 112" },
  "english12-de-literature": { credits: 3, provider: "NOVA", note: "ENG 255" },
  "precalculus-de": { credits: 6, provider: "NOVA", note: "MTH 161 and MTH 162" },
  "calculus1-de": { credits: 4, provider: "NOVA", note: "MTH 263" },
  "calculus12-de": { credits: 8, provider: "NOVA", note: "MTH 263 and MTH 264" },
  "multivariable-linear-algebra-de": { credits: 7, provider: "NOVA", note: "MTH 265 and MTH 266" },
  "differential-equations-de": { credits: 3, provider: "NOVA", note: "MTH 267" },
  "biology2-de": { credits: 4, provider: "NOVA", note: "BIO 101" },
  "chemistry2-de": { credits: 4, provider: "NOVA", note: "CHM 111" },
  "physics1-de": { credits: 4, provider: "NOVA", note: "PHY 201" },
  "environmental-science-de": { credits: 8, provider: "NOVA", note: "ENV 121 and ENV 122" },
  "world-history1-de": { credits: 6, provider: "NOVA", note: "HIS 101 and HIS 111" },
  "world-history2-de": { credits: 6, provider: "NOVA", note: "HIS 102 and HIS 112" },
  "us-history-de": { credits: 6, provider: "NOVA", note: "HIS 121 and HIS 122" },
  "government-de": { credits: 3, provider: "NOVA", note: "PLS 135" },
  "spanish4-de": { credits: 6, provider: "NOVA", note: "SPA 201 and SPA 202" },
  "french4-de": { credits: 6, provider: "NOVA", note: "FRE 201 and FRE 202" },
  "cs-programming-de": { credits: 3, provider: "NOVA", note: "ITP 100" },
  "advanced-programming-de": { credits: 4, provider: "NOVA", note: "ITP 150" },
  "college-success-de": { credits: 1, provider: "NOVA", note: "SDV 100" },
};

const courseExplanations: Record<string, string> = {
  precalculus: "Precalculus with Trigonometry develops functions, analytic geometry, and trigonometry needed before calculus.",
  "precalculus-h": "The honors version moves more quickly and prepares students for advanced calculus pathways.",
  "ap-precalculus": "AP Precalculus follows the College Board course framework and concludes with an AP exam.",
  "precalculus-de": "This is the college-credit Precalculus sequence. FCPS lists it as NOVA MTH 161 and MTH 162.",
  "ap-calculus-ab": "AP Calculus AB is approximately the first college semester of single-variable calculus.",
  "ap-calculus-bc": "AP Calculus BC includes AB content and continues through additional integration, parametric and polar topics, and infinite series.",
  "calculus1-de": "Calculus 1 DE awards NOVA MTH 263 credit when college requirements are satisfied and the course is passed.",
  "calculus12-de": "Calculus 1 & 2 DE covers NOVA MTH 263 and MTH 264 in one FCPS course year.",
  "multivariable-linear-algebra-de": "This advanced DE pairing follows Calculus 1 & 2 or a qualifying AP Calculus BC exam score.",
  "differential-equations-de": "Differential Equations DE follows multivariable calculus and carries additional college eligibility requirements.",
};

const grade7SemesterElectives = [
  course("art-foundations", "Art Foundations"),
  course("3d-art", "3D Art Exploration"),
  course("art-extensions", "Art Extensions", requires(["art-foundations"], "Art Foundations")),
  course("computers-art", "Computers in Art", requires(["art-foundations"], "Art Foundations")),
  course("speech-theatre", "Speech & Theatre Arts Appreciation"),
  course("technical-theatre", "Technical Theatre Arts Appreciation"),
  course("career-investigations", "Career Investigations"),
  course("creative-writing", "Creative Writing"),
  course("newspaper", "Newspaper Journalism"),
  course("strategies", "Strategies for Success"),
  course("computer-solutions", "Computer Solutions"),
  course("coding1", "Coding & Innovative Technologies I", requires(["computer-solutions"], "Computer Solutions")),
  course("facs1", "Family & Consumer Sciences 1"),
  course("engineering1", "Engineering 1: Design & Modeling"),
  course("engineering2", "Engineering 2: Simulation & Fabrication", requires(["engineering1"], "Engineering 1")),
  course("music-lab", "Music Participation Lab"),
];

const grade7YearlongElectives = [
  course("band", "Band — placement by audition/teacher"),
  course("chorus", "Chorus"),
  course("orchestra", "Orchestra — placement by audition/teacher"),
  course("french1", "French Level 1", { highSchoolCredit: true }),
  course("spanish1", "Spanish Level 1", { highSchoolCredit: true }),
  course("japanese1a", "Japanese 1 Part A", { highSchoolCredit: true }),
  course("japanese-immersion1", "Japanese Immersion 1", { highSchoolCredit: true }),
  course("computers-art", "Computers in Art — take Art Foundations concurrently"),
];

const grade8SemesterElectives = [
  course("art-foundations", "Art Foundations"),
  course("3d-art", "3D Art Exploration"),
  course("art-extensions", "Art Extensions", requires(["art-foundations"], "Art Foundations")),
  course("career-investigations", "Career Investigations"),
  course("speech-theatre", "Speech & Theatre Arts Appreciation"),
  course("computers-art", "Computers in Art"),
  course("technical-theatre", "Technical Theatre Arts Appreciation"),
  course("advanced-theatre", "Advanced Theatre Arts", requires(["speech-theatre"], "Speech & Theatre Arts")),
  course("computer-solutions", "Computer Solutions"),
  course("coding1", "Coding & Innovative Technologies I", requires(["computer-solutions"], "Computer Solutions")),
  course("coding2", "Coding & Innovative Technologies II", requires(["coding1"], "Coding I")),
  course("newspaper", "Newspaper Journalism"),
  course("creative-writing", "Creative Writing"),
  course("engineering1", "Engineering 1: Design & Modeling"),
  course("engineering2", "Engineering 2: Simulation & Fabrication", requires(["engineering1"], "Engineering 1")),
  course("media-communication", "Media Communication (RCTV Broadcasting)"),
  course("guitar", "Guitar"),
  course("facs2", "Family & Consumer Sciences 2"),
  course("strategies", "Strategies for Success"),
  course("music-lab", "Music Participation Lab"),
];

const grade8YearlongElectives = [
  course("band", "Band — placement by audition/teacher"),
  course("chorus", "Chorus"),
  course("orchestra", "Orchestra — placement by audition/teacher"),
  course("french1", "French Level 1", { highSchoolCredit: true }),
  course("french2", "French Level 2", { highSchoolCredit: true, ...requires(["french1"], "French Level 1") }),
  course("spanish1", "Spanish Level 1", { highSchoolCredit: true }),
  course("spanish2", "Spanish Level 2", { highSchoolCredit: true, ...requires(["spanish1"], "Spanish Level 1") }),
  course("japanese1b", "Japanese 1 Part B", { highSchoolCredit: true, ...requires(["japanese1a"], "Japanese 1 Part A") }),
  course("japanese-immersion2", "Japanese Immersion 2", { highSchoolCredit: true, ...requires(["japanese-immersion1"], "Japanese Immersion 1") }),
  course("computers-art", "Computers in Art"),
  course("art-extensions", "Art Extensions", requires(["art-foundations"], "Art Foundations")),
  course("advanced-theatre", "Advanced Theatre Arts — audition/teacher recommendation", requires(["speech-theatre"], "Speech & Theatre Arts")),
  course("guitar1", "Guitar 1"),
];

const highSchoolElectives = [
  course("spanish1", "Spanish 1", { highSchoolCredit: true }),
  course("spanish2", "Spanish 2", { highSchoolCredit: true, ...requires(["spanish1"], "Spanish 1") }),
  course("spanish3", "Spanish 3", { highSchoolCredit: true, ...requires(["spanish2"], "Spanish 2") }),
  course("spanish4", "Spanish 4", { highSchoolCredit: true, ...requires(["spanish3"], "Spanish 3") }),
  dualEnrollmentCourse("spanish4-de", "Spanish 4 DE", requires(["spanish3"], "Spanish 3 and college eligibility")),
  course("french1", "French 1", { highSchoolCredit: true }),
  course("french2", "French 2", { highSchoolCredit: true, ...requires(["french1"], "French 1") }),
  course("french3", "French 3", { highSchoolCredit: true, ...requires(["french2"], "French 2") }),
  course("french4", "French 4", { highSchoolCredit: true, ...requires(["french3"], "French 3") }),
  dualEnrollmentCourse("french4-de", "French 4 DE", requires(["french3"], "French 3 and college eligibility")),
  course("computer-science", "CS Programming", { highSchoolCredit: true }),
  dualEnrollmentCourse("cs-programming-de", "CS Programming DE"),
  course("advanced-programming", "Advanced Programming", { highSchoolCredit: true, ...requires(["computer-science"], "Computer Science") }),
  dualEnrollmentCourse("advanced-programming-de", "Advanced Programming DE", requires(["computer-science", "cs-programming-de"], "CS Programming and college eligibility")),
  dualEnrollmentCourse("college-success-de", "College Success Skills DE"),
  course("ai-foundations1", "AI Foundations I", { highSchoolCredit: true }),
  course("ai-foundations2", "AI Foundations II", { highSchoolCredit: true, ...requires(["ai-foundations1"], "AI Foundations I") }),
  course("engineering-design", "Engineering Design", { highSchoolCredit: true }),
  course("art-high", "Art", { highSchoolCredit: true }),
  course("band-high", "Band", { highSchoolCredit: true }),
  course("chorus-high", "Chorus", { highSchoolCredit: true }),
  course("orchestra-high", "Orchestra", { highSchoolCredit: true }),
  course("theatre-high", "Theatre Arts", { highSchoolCredit: true }),
];

const electiveSlot = (id: string, label: string): ElectiveSlot => ({
  id,
  label,
  kind: "elective",
  yearlong: highSchoolElectives,
  semester: [],
});

const plans: Record<Grade, Plan> = {
  "7": {
    school: "middle",
    usesElectiveFormats: true,
    note: "Rachel Carson grade 7: five core subjects and two elective periods. Later FCPS course levels remain available for exceptional placement.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [course("english7", "English 7"), course("english7h", "English 7 HN"), course("english7aa", "English 7 AA — AAP Center")] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("prealgebra", "Pre-Algebra"),
        course("prealgebrah", "Pre-Algebra HN"),
        course("algebra1h", "Algebra 1 HN — school placement only", { highSchoolCredit: true, ...requires(["advancedmath6"], "Advanced Math 6 and school placement") }),
        course("geometryh", "Geometry HN", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1 HN") }),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [course("science7", "Science 7"), course("science7h", "Science 7 HN"), course("science7aa", "Science 7 AA — AAP Center")] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("history7", "U.S. History 7"), course("history7h", "U.S. History 7 HN"), course("history7aa", "History 7 AA — AAP Center")] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: [course("hpe7", "Health & PE 7")] },
      { id: "elective-1", label: "Elective 1", kind: "elective", yearlong: grade7YearlongElectives, semester: grade7SemesterElectives },
      { id: "elective-2", label: "Elective 2", kind: "elective", yearlong: grade7YearlongElectives, semester: grade7SemesterElectives },
    ],
  },
  "8": {
    school: "middle",
    usesElectiveFormats: true,
    note: "Rachel Carson grade 8: five core subjects and two elective periods. Later FCPS course levels remain available for exceptional placement.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [
        course("english8", "English 8", earlyPlacement("8", ["english7", "english7h", "english7aa"], "English 7")),
        course("english8h", "English 8 HN", earlyPlacement("8", ["english7", "english7h", "english7aa"], "English 7")),
        course("english8aa", "English 8 AA — AAP Center", earlyPlacement("8", ["english7", "english7h", "english7aa"], "English 7")),
      ] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("algebra1", "Algebra 1", { highSchoolCredit: true }),
        course("algebra1h", "Algebra 1 Honors", { highSchoolCredit: true }),
        course("geometryh", "Geometry HN", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("algebra2h", "Algebra II HN", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [
        course("science8", "Science 8", requires(["science7", "science7h", "science7aa"], "Science 7")),
        course("science8h", "Science 8 HN", requires(["science7", "science7h", "science7aa"], "Science 7")),
        course("science8aa", "Science 8 AA — AAP Center", requires(["science7", "science7h", "science7aa"], "Science 7")),
      ] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [
        course("civics", "Civics 8", earlyPlacement("8", ["history7", "history7h", "history7aa"], "U.S. History 7")),
        course("civicsh", "Civics 8 Honors", earlyPlacement("8", ["history7", "history7h", "history7aa"], "U.S. History 7")),
        course("civicsaa", "Civics 8 AA — AAP Center", earlyPlacement("8", ["history7", "history7h", "history7aa"], "U.S. History 7")),
      ] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: [course("hpe8", "Health & PE 8")] },
      { id: "elective-1", label: "Elective 1", kind: "elective", yearlong: grade8YearlongElectives, semester: grade8SemesterElectives },
      { id: "elective-2", label: "Elective 2", kind: "elective", yearlong: grade8YearlongElectives, semester: grade8SemesterElectives },
    ],
  },
  "9": {
    school: "high",
    usesElectiveFormats: false,
    note: "Skyview grade 9 planning. Standard offerings are available based on enrollment for the 2026–27 opening year.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [
        course("english9", "English 9", { highSchoolCredit: true, ...earlyPlacement("9", ["english8", "english8h", "english8aa"], "English 8") }),
        course("english9h", "English 9 Honors", { highSchoolCredit: true, ...earlyPlacement("9", ["english8", "english8h", "english8aa"], "English 8") }),
      ] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("algebra1", "Algebra 1", { highSchoolCredit: true }),
        course("algebra1h", "Algebra 1 Honors", { highSchoolCredit: true }),
        course("geometry", "Geometry", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("geometryh", "Geometry Honors", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("algebra2h", "Algebra 2 Honors", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [
        course("biology", "Biology", { highSchoolCredit: true, ...requires(["science8", "science8h", "science8aa"], "Science 8") }),
        course("biologyh", "Biology Honors", { highSchoolCredit: true, ...requires(["science8", "science8h", "science8aa"], "Science 8") }),
      ] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [
        course("world-history1", "World History & Geography 1", { highSchoolCredit: true, ...earlyPlacement("9", ["civics", "civicsh", "civicsaa"], "Civics 8") }),
        course("world-history1h", "World History & Geography 1 Honors", { highSchoolCredit: true, ...earlyPlacement("9", ["civics", "civicsh", "civicsaa"], "Civics 8") }),
        dualEnrollmentCourse("world-history1-de", "World History & Geography 1 DE", earlyPlacement("9", ["civics", "civicsh", "civicsaa"], "Civics 8")),
      ] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: [course("hpe9", "Health & PE 9", { highSchoolCredit: true })] },
      electiveSlot("elective-1", "Elective 1"),
      electiveSlot("elective-2", "Elective 2"),
    ],
  },
  "10": {
    school: "high",
    usesElectiveFormats: false,
    note: "Skyview grade 10 planning. Standard offerings are available based on enrollment for the 2026–27 opening year.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [
        course("english10", "English 10", { highSchoolCredit: true, ...earlyPlacement("10", ["english9", "english9h"], "English 9") }),
        course("english10h", "English 10 Honors", { highSchoolCredit: true, ...earlyPlacement("10", ["english9", "english9h"], "English 9") }),
      ] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("geometry", "Geometry", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("geometryh", "Geometry Honors", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("algebra2", "Algebra 2", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
        course("algebra2h", "Algebra 2 Honors", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
        course("precalculus", "Precalculus with Trigonometry", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        course("precalculus-h", "Precalculus Honors", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        dualEnrollmentCourse("precalculus-de", "Precalculus with Trigonometry DE", requires(["algebra2", "algebra2h"], "Algebra 2 and college eligibility")),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [
        course("chemistry", "Chemistry", { highSchoolCredit: true, ...requiresAll([["biology", "biologyh"], ["algebra1", "algebra1h"]], "Biology and Algebra 1") }),
        course("chemistryh", "Chemistry Honors", { highSchoolCredit: true, ...requiresAll([["biology", "biologyh"], ["geometry", "geometryh"]], "Biology and Geometry; Algebra 2 must be taken concurrently") }),
        course("geosystems", "Geosystems", { highSchoolCredit: true, ...requires(["biology", "biologyh"], "Biology") }),
      ] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [
        course("world-history2", "World History & Geography 2", { highSchoolCredit: true, ...earlyPlacement("10", ["world-history1", "world-history1h", "world-history1-de"], "World History & Geography 1") }),
        course("world-history2h", "World History & Geography 2 Honors", { highSchoolCredit: true, ...earlyPlacement("10", ["world-history1", "world-history1h", "world-history1-de"], "World History & Geography 1") }),
        course("ap-world", "AP World History", { highSchoolCredit: true, gpaWeight: 1, ...earlyPlacement("10", ["world-history1", "world-history1h", "world-history1-de"], "World History & Geography 1") }),
        dualEnrollmentCourse("world-history2-de", "World History & Geography 2 DE", earlyPlacement("10", ["world-history1", "world-history1h", "world-history1-de"], "World History & Geography 1")),
      ] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: [course("hpe10", "Health & PE 10", { highSchoolCredit: true })] },
      electiveSlot("elective-1", "Elective 1"),
      electiveSlot("elective-2", "Elective 2"),
    ],
  },
  "11": {
    school: "high",
    usesElectiveFormats: false,
    note: "Future Skyview grade 11 planning. Skyview opens with grades 9–10 in 2026–27 and will add older grades as it phases in.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [
        course("english11", "English 11", { highSchoolCredit: true, ...earlyPlacement("11", ["english10", "english10h"], "English 10") }),
        course("english11h", "English 11 Honors", { highSchoolCredit: true, ...earlyPlacement("11", ["english10", "english10h"], "English 10") }),
        course("ap-language", "AP English Language", { highSchoolCredit: true, gpaWeight: 1, ...earlyPlacement("11", ["english10", "english10h"], "English 10") }),
        dualEnrollmentCourse("english11-de", "English 11 DE Composition", earlyPlacement("11", ["english10", "english10h"], "English 10")),
      ] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("algebra2", "Algebra 2", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
        course("algebra2h", "Algebra 2 Honors", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
        course("precalculus", "Precalculus with Trigonometry", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        course("precalculus-h", "Precalculus Honors", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        course("ap-precalculus", "AP Precalculus", { highSchoolCredit: true, gpaWeight: 1, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        dualEnrollmentCourse("precalculus-de", "Precalculus with Trigonometry DE", requires(["algebra2", "algebra2h"], "Algebra 2 and college eligibility")),
        course("ap-calculus-ab", "AP Calculus AB", { highSchoolCredit: true, gpaWeight: 1, ...requires(["precalculus", "precalculus-h", "ap-precalculus", "precalculus-de"], "Precalculus") }),
        dualEnrollmentCourse("calculus1-de", "Calculus 1 DE", requires(["precalculus", "precalculus-h", "ap-precalculus", "precalculus-de"], "Precalculus and college eligibility")),
        course("ap-statistics", "AP Statistics", { highSchoolCredit: true, gpaWeight: 1 }),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [
        course("physics", "Physics", { highSchoolCredit: true, ...requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"], ["geometry", "geometryh"]], "Biology, Chemistry, and Geometry") }),
        course("physicsh", "Physics Honors", { highSchoolCredit: true, ...requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"], ["geometry", "geometryh"]], "Biology, Chemistry, and Geometry") }),
        dualEnrollmentCourse("physics1-de", "Physics 1 DE", requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"], ["geometry", "geometryh"]], "Biology, Chemistry, Geometry, and college eligibility")),
        course("ap-biology", "AP Biology", { highSchoolCredit: true, gpaWeight: 1, ...requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"]], "Biology and Chemistry") }),
        dualEnrollmentCourse("biology2-de", "Biology 2 DE", requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"]], "Biology, Chemistry, and college eligibility")),
        course("ap-chemistry", "AP Chemistry", { highSchoolCredit: true, gpaWeight: 1, ...requiresAll([["chemistry", "chemistryh"], ["algebra2", "algebra2h"]], "Chemistry and Algebra 2") }),
        dualEnrollmentCourse("chemistry2-de", "Chemistry 2 DE", requiresAll([["chemistry", "chemistryh"], ["algebra2", "algebra2h"]], "Chemistry, Algebra 2, and college eligibility")),
      ] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [
        course("us-history", "Virginia & U.S. History", { highSchoolCredit: true, ...requires(["world-history1", "world-history1h", "world-history1-de", "world-history2", "world-history2h", "ap-world", "world-history2-de"], "World History & Geography 1 or 2") }),
        course("us-historyh", "Virginia & U.S. History Honors", { highSchoolCredit: true, ...requires(["world-history1", "world-history1h", "world-history1-de", "world-history2", "world-history2h", "ap-world", "world-history2-de"], "World History & Geography 1 or 2") }),
        course("ap-us-history", "AP U.S. History", { highSchoolCredit: true, gpaWeight: 1, ...requires(["world-history1", "world-history1h", "world-history1-de", "world-history2", "world-history2h", "ap-world", "world-history2-de"], "World History & Geography 1 or 2") }),
        dualEnrollmentCourse("us-history-de", "Virginia & U.S. History DE", requires(["world-history1", "world-history1h", "world-history1-de", "world-history2", "world-history2h", "ap-world", "world-history2-de"], "World History & Geography 1 or 2 and college eligibility")),
      ] },
      { id: "epf", label: "Required / Elective", kind: "core", courses: [course("epf", "Economics & Personal Finance", { highSchoolCredit: true }), course("elective-placeholder11", "Use this period for an elective", { highSchoolCredit: true })] },
      electiveSlot("elective-1", "Elective 1"),
      electiveSlot("elective-2", "Elective 2"),
    ],
  },
  "12": {
    school: "high",
    usesElectiveFormats: false,
    note: "Future Skyview grade 12 planning. Final offerings will be published as Skyview adds its senior class.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [
        course("english12", "English 12", { highSchoolCredit: true, ...earlyPlacement("12", ["english11", "english11h", "ap-language", "english11-de"], "English 11") }),
        course("english12h", "English 12 Honors", { highSchoolCredit: true, ...earlyPlacement("12", ["english11", "english11h", "ap-language", "english11-de"], "English 11") }),
        course("ap-literature", "AP English Literature", { highSchoolCredit: true, gpaWeight: 1, ...earlyPlacement("12", ["english11", "english11h", "ap-language", "english11-de"], "English 11") }),
        dualEnrollmentCourse("english12-de-composition", "English 12 DE Composition", earlyPlacement("12", ["english11", "english11h", "ap-language", "english11-de"], "English 11")),
        dualEnrollmentCourse("english12-de-literature", "English 12 DE Literature", requires(["english11-de", "english12-de-composition"], "DE Composition and college eligibility")),
      ] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("precalculus", "Precalculus with Trigonometry", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        course("precalculus-h", "Precalculus Honors", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        course("ap-precalculus", "AP Precalculus", { highSchoolCredit: true, gpaWeight: 1, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        dualEnrollmentCourse("precalculus-de", "Precalculus with Trigonometry DE", requires(["algebra2", "algebra2h"], "Algebra 2 and college eligibility")),
        course("ap-calculus-ab", "AP Calculus AB", { highSchoolCredit: true, gpaWeight: 1, ...requires(["precalculus", "precalculus-h", "ap-precalculus", "precalculus-de"], "Precalculus") }),
        course("ap-calculus-bc", "AP Calculus BC", { highSchoolCredit: true, gpaWeight: 1, ...requires(["precalculus", "precalculus-h", "ap-precalculus", "precalculus-de", "ap-calculus-ab"], "Precalculus or Calculus AB") }),
        dualEnrollmentCourse("calculus1-de", "Calculus 1 DE", requires(["precalculus", "precalculus-h", "ap-precalculus", "precalculus-de"], "Precalculus and college eligibility")),
        dualEnrollmentCourse("calculus12-de", "Calculus 1 & 2 DE", requires(["precalculus", "precalculus-h", "ap-precalculus", "precalculus-de"], "Precalculus and college eligibility")),
        course("probability-statistics", "Probability & Statistics", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        course("ap-statistics", "AP Statistics", { highSchoolCredit: true, gpaWeight: 1 }),
        course("data-science1", "Data Science 1", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        course("data-science2", "Data Science 2", { highSchoolCredit: true, ...requires(["data-science1"], "Data Science 1") }),
        course("discrete-mathematics", "Discrete Mathematics", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        dualEnrollmentCourse("multivariable-linear-algebra-de", "Multivariable Calculus / Linear Algebra DE", { ...requires(["calculus12-de", "ap-calculus-bc"], "Calculus 1 & 2 DE with a C or AP Calculus BC exam score of 3 or higher, plus college eligibility"), eligibilityRequirements: [advancedCalculusRequirement] }),
        dualEnrollmentCourse("differential-equations-de", "Differential Equations DE", requires(["multivariable-linear-algebra-de"], "Multivariable Calculus and college eligibility")),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [
        course("physics", "Physics", { highSchoolCredit: true, ...requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"], ["geometry", "geometryh"]], "Biology, Chemistry, and Geometry") }),
        course("ap-physics", "AP Physics", { highSchoolCredit: true, gpaWeight: 1, ...requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"], ["geometry", "geometryh"]], "Biology, Chemistry, and Geometry") }),
        dualEnrollmentCourse("physics1-de", "Physics 1 DE", requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"], ["geometry", "geometryh"]], "Biology, Chemistry, Geometry, and college eligibility")),
        course("environmental-science", "Environmental Science", { highSchoolCredit: true, ...requires(["science8", "science8h", "science8aa"], "Science 8") }),
        course("ap-environmental", "AP Environmental Science", { highSchoolCredit: true, gpaWeight: 1, ...requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"]], "Biology and Chemistry") }),
        dualEnrollmentCourse("environmental-science-de", "Environmental Science DE", requiresAll([["biology", "biologyh"], ["chemistry", "chemistryh"]], "Biology, Chemistry, and college eligibility")),
      ] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [
        course("government", "Virginia & U.S. Government", { highSchoolCredit: true, ...requires(["us-history", "us-historyh", "ap-us-history", "us-history-de"], "Virginia & U.S. History") }),
        course("governmenth", "Virginia & U.S. Government Honors", { highSchoolCredit: true, ...requires(["us-history", "us-historyh", "ap-us-history", "us-history-de"], "Virginia & U.S. History") }),
        course("ap-government", "AP Government", { highSchoolCredit: true, gpaWeight: 1, ...requires(["us-history", "us-historyh", "ap-us-history", "us-history-de"], "Virginia & U.S. History") }),
        dualEnrollmentCourse("government-de", "Virginia & U.S. Government DE", requires(["us-history", "us-historyh", "ap-us-history", "us-history-de"], "Virginia & U.S. History and college eligibility")),
      ] },
      { id: "epf", label: "Economics", kind: "core", courses: [course("epf", "Economics & Personal Finance", { highSchoolCredit: true })] },
      electiveSlot("elective-1", "Elective 1"),
      electiveSlot("elective-2", "Elective 2"),
    ],
  },
};

const gradeOrder: Grade[] = ["7", "8", "9", "10", "11", "12"];

const publishedPlanCourseIds = Object.fromEntries(gradeOrder.map((grade) => [
  grade,
  new Set(plans[grade].slots.flatMap((slot) => slot.kind === "core" ? slot.courses.map((item) => item.id) : [...slot.yearlong, ...slot.semester].map((item) => item.id))),
])) as Record<Grade, Set<string>>;

function uniqueCourses(courses: Course[]) {
  const seen = new Set<string>();
  return courses.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// Keep later FCPS levels visible for students with exceptional placement or
// unusually early coursework. Sequential courses still enforce prerequisites.
for (const [gradeIndex, grade] of gradeOrder.entries()) {
  const laterPlans = gradeOrder.slice(gradeIndex + 1).map((laterGrade) => plans[laterGrade]);
  for (const slot of plans[grade].slots) {
    if (slot.kind === "core") {
      const laterCourses = laterPlans.flatMap((laterPlan) =>
        laterPlan.slots
          .filter((laterSlot): laterSlot is CoreSlot => laterSlot.kind === "core" && laterSlot.id === slot.id)
          .flatMap((laterSlot) => laterSlot.courses),
      );
      slot.courses = uniqueCourses([...slot.courses, ...laterCourses]);
    } else {
      const laterElectives = laterPlans.flatMap((laterPlan) =>
        laterPlan.slots.filter((laterSlot): laterSlot is ElectiveSlot => laterSlot.kind === "elective"),
      );
      slot.yearlong = uniqueCourses([...slot.yearlong, ...laterElectives.flatMap((laterSlot) => laterSlot.yearlong)]);
      slot.semester = uniqueCourses([...slot.semester, ...laterElectives.flatMap((laterSlot) => laterSlot.semester)]);
    }
  }
}

const allCourseOptions = uniqueCourses(gradeOrder.flatMap((grade) => plans[grade].slots.flatMap((slot) =>
  slot.kind === "core" ? slot.courses : [...slot.yearlong, ...slot.semester],
)));
const courseById = new Map(allCourseOptions.map((item) => [item.id, item]));
const prerequisiteIds = uniqueCourses(allCourseOptions.flatMap((item) =>
  [...(item.prerequisite?.anyOf ?? []), ...(item.earlyPlacement?.anyOf ?? [])].map((id) => courseById.get(id) ?? course(id, id)),
));
const priorCourseChoices = uniqueCourses([course("advancedmath6", "Advanced Math 6"), ...prerequisiteIds]);
const priorCourseGroupOrder = ["English", "Math", "Science", "Social Studies", "Health & PE", "Electives", "Other"];
const priorCourseGroups = priorCourseGroupOrder.map((label) => ({
  label,
  courses: priorCourseChoices.filter((item) => {
    if (item.id === "advancedmath6") return label === "Math";
    const matchingSlot = plans["7"].slots.find((slot) => {
      const options = slot.kind === "core" ? slot.courses : [...slot.yearlong, ...slot.semester];
      return options.some((option) => option.id === item.id);
    });
    const subject = matchingSlot ? (matchingSlot.kind === "core" ? matchingSlot.label : "Electives") : "Other";
    return subject === label;
  }),
})).filter((group) => group.courses.length > 0);

function priorCourseReceivesGrade(item: Course) {
  return Boolean(item.highSchoolCredit || collegeCreditDetails[item.id]);
}

const emptySelections = (): Selections => ({ "7": {}, "8": {}, "9": {}, "10": {}, "11": {}, "12": {} });
const emptySelection = (mode: Mode = "yearlong"): Selection => ({ mode, primary: "", secondary: "", primaryGrade: "", secondaryGrade: "" });

export function selectionLockKey(grade: Grade, slotId: string, field: SelectionField) {
  return `${grade}:${slotId}:${field}`;
}

function sanitizeLockedSelections(lockedSelections: Record<string, boolean>, selections: Selections) {
  const validLocks: Record<string, boolean> = {};
  for (const grade of gradeOrder) {
    for (const slot of plans[grade].slots) {
      const value = selections[grade]?.[slot.id];
      if (!value) continue;
      const primaryKey = selectionLockKey(grade, slot.id, "primary");
      if (lockedSelections[primaryKey] && value.primary) validLocks[primaryKey] = true;
      const secondaryKey = selectionLockKey(grade, slot.id, "secondary");
      if (slot.kind === "elective" && value.mode === "semester" && lockedSelections[secondaryKey] && value.secondary) {
        validLocks[secondaryKey] = true;
      }
    }
  }
  return validLocks;
}

function loadSavedPlan(): SavedPlan {
  const emptyPlan: SavedPlan = {
    studentName: "",
    selections: emptySelections(),
    lockedSelections: {},
    priorCourses: [],
    priorCourseGrades: {},
    diplomaType: "advanced",
    eligibilityChecks: {},
  };

  if (typeof window === "undefined") return emptyPlan;

  try {
    const saved = window.localStorage.getItem("fcps-course-plan-v2") ?? window.localStorage.getItem("rcms-course-plan-v1");
    if (!saved) return emptyPlan;

    const data = JSON.parse(saved) as Partial<SavedPlan>;
    const priorCourses = data.priorCourses ?? [];
    const priorCourseGrades = Object.fromEntries(Object.entries(data.priorCourseGrades ?? {}).filter(([courseId, mark]) =>
      priorCourses.includes(courseId)
      && Boolean(courseById.get(courseId) && priorCourseReceivesGrade(courseById.get(courseId)!))
      && (mark === "" || gradeMarks.includes(mark as GradeMark)),
    )) as Record<string, GradeMark | "">;
    const selections = sanitizeSelections({ ...emptySelections(), ...(data.selections ?? {}) }, priorCourses);
    return {
      studentName: data.studentName ?? "",
      selections,
      lockedSelections: sanitizeLockedSelections(data.lockedSelections ?? {}, selections),
      priorCourses,
      priorCourseGrades,
      diplomaType: data.diplomaType === "standard" ? "standard" : "advanced",
      eligibilityChecks: data.eligibilityChecks ?? {},
    };
  } catch {
    window.localStorage.removeItem("fcps-course-plan-v2");
    return emptyPlan;
  }
}

function planFileStem(name: string) {
  return name
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function saveTimestamp(savedAt: Date) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${savedAt.getFullYear()}-${part(savedAt.getMonth() + 1)}-${part(savedAt.getDate())}_${part(savedAt.getHours())}-${part(savedAt.getMinutes())}-${part(savedAt.getSeconds())}`;
}

function saveDateTimeLabel(savedAt: Date) {
  return saveTimestamp(savedAt).replace("_", " ").replace(/-(\d{2})-(\d{2})$/, ":$1:$2");
}

export function exportDocumentTitle(name: string, savedAt: Date) {
  const student = name.trim();
  return `${student ? `${student} - ` : ""}FCPS Course Plan - Saved ${saveDateTimeLabel(savedAt)}`;
}

export function planFileName(name: string, savedAt: Date = new Date()) {
  const stem = planFileStem(name);
  return `${stem || "course-plan"}-course-plan-${saveTimestamp(savedAt)}.json`;
}

export function pdfDocumentTitle(name: string, savedAt: Date = new Date()) {
  const stem = planFileStem(name);
  return `${stem ? `${stem}-` : ""}fcps-course-plan-${saveTimestamp(savedAt)}`;
}

export function pdfFileName(name: string, savedAt: Date = new Date()) {
  return `${pdfDocumentTitle(name, savedAt)}.pdf`;
}

function exportedPlan(
  studentName: string,
  selections: Selections,
  lockedSelections: Record<string, boolean>,
  priorCourses: string[],
  priorCourseGrades: Record<string, GradeMark | "">,
  diplomaType: DiplomaType,
  eligibilityChecks: Record<string, boolean>,
  grade: Grade,
  isOverview: boolean,
  savedAt: Date = new Date(),
): ExportedPlan {
  return {
    formatVersion: 1,
    title: exportDocumentTitle(studentName, savedAt),
    studentName: studentName.trim(),
    exportedAt: savedAt.toISOString(),
    activeView: isOverview ? "overview" : `grade-${grade}`,
    selections,
    lockedSelections,
    priorCourses,
    priorCourseGrades,
    diplomaType,
    eligibilityChecks,
  };
}

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return window.btoa(binary);
}

function decodeBase64Utf8(value: string) {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function asciiPdfText(value: string) {
  return value
    .replace(/→/g, "to")
    .replace(/[—–]/g, "-")
    .replace(/•/g, "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function wrapPdfLine(value: string, maxLength = 88) {
  const words = asciiPdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= maxLength) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function pdfSummaryLines(plan: ExportedPlan) {
  const credits = plannedCreditTotals(plan.selections);
  const requirements = graduationRequirements(plan.diplomaType, plan.selections);
  const lines = [
    plan.title,
    "Rachel Carson Middle School to Skyview High School",
    `${plan.diplomaType === "advanced" ? "Advanced Studies" : "Standard"} Diploma - ${credits.total} planned high-school credits`,
  ];

  const gradedPriorCourses = plan.priorCourses
    .map((courseId) => courseById.get(courseId))
    .filter((item): item is Course => Boolean(item && priorCourseReceivesGrade(item)));
  if (gradedPriorCourses.length) {
    lines.push("", "High-school-credit courses completed before grade 7");
    gradedPriorCourses.forEach((item) => lines.push(`${item.label} | Grade: ${plan.priorCourseGrades[item.id] || "-"}`));
  }

  for (const planGrade of gradeOrder) {
    lines.push("", `Grade ${planGrade} - ${plans[planGrade].school === "middle" ? "Rachel Carson Middle School" : "Skyview High School"}`);
    for (const slot of plans[planGrade].slots) {
      const value = plan.selections[planGrade]?.[slot.id] ?? emptySelection();
      const addCourse = (term: string, courseId: string, mark: GradeMark | "") => {
        const item = findCourse(planGrade, courseId);
        const courseLabel = item ? `${item.label}${item.highSchoolCredit ? " - HS credit" : ""}` : "Not selected";
        lines.push(...wrapPdfLine(`${slot.label} | ${term} | ${courseLabel} | Grade: ${mark || "-"}`));
      };
      if (slot.kind === "core" || value.mode === "yearlong") addCourse("Full year", value.primary, value.primaryGrade);
      else {
        addCourse("Fall", value.primary, value.primaryGrade);
        addCourse("Spring", value.secondary, value.secondaryGrade);
      }
    }
  }

  lines.push("", "Graduation credit check");
  requirements.forEach((requirement) => lines.push(`${requirement.label}: ${requirement.planned} planned / ${requirement.required} needed`));
  lines.push("", "Planning aid only. Final courses and graduation status require FCPS and counselor confirmation.");
  return lines;
}

function escapePdfString(value: string) {
  return asciiPdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function createRecoverablePdf(plan: ExportedPlan) {
  const encodedPlan = encodeBase64Utf8(JSON.stringify(plan));
  const recoveryLines = encodedPlan.match(/.{1,76}/g) ?? [];
  const recoveryBlock = `%FCPS_PLAN_V1_BEGIN\n${recoveryLines.map((line) => `%${line}`).join("\n")}\n%FCPS_PLAN_V1_END\n`;
  const summaryLines = pdfSummaryLines(plan);
  const linesPerPage = 52;
  const pages = Array.from({ length: Math.max(1, Math.ceil(summaryLines.length / linesPerPage)) }, (_, pageIndex) =>
    summaryLines.slice(pageIndex * linesPerPage, (pageIndex + 1) * linesPerPage),
  );
  const objects: string[] = [];
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  pages.forEach((pageLines, index) => {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = pageObjectId + 1;
    const commands = pageLines.map((line) => `(${escapePdfString(line)}) Tj T*`).join("\n");
    const stream = `BT\n/F1 9 Tf\n48 750 Td\n12 TL\n${commands}\nET`;
    objects[pageObjectId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  const infoObjectId = 4 + pages.length * 2;
  const pdfCreationDate = `D:${plan.exportedAt.replace(/[-:T]/g, "").slice(0, 14)}Z`;
  objects[infoObjectId] = `<< /Title (${escapePdfString(plan.title)}) /CreationDate (${pdfCreationDate}) >>`;

  let pdf = `%PDF-1.4\n% FCPS Course Planner\n${recoveryBlock}`;
  const offsets = [0];
  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    offsets[objectId] = pdf.length;
    pdf += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    pdf += `${String(offsets[objectId]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${infoObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Blob([pdf], { type: "application/pdf" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeImportedSelections(value: unknown) {
  const selections = emptySelections();
  if (!isRecord(value)) return selections;
  const validMarks = new Set<string>([...gradeMarks, ""]);

  for (const planGrade of gradeOrder) {
    const gradeValue = value[planGrade];
    if (!isRecord(gradeValue)) continue;
    for (const slot of plans[planGrade].slots) {
      const selectionValue = gradeValue[slot.id];
      if (!isRecord(selectionValue)) continue;
      const mode = selectionValue.mode === "semester" && slot.kind === "elective" ? "semester" : "yearlong";
      const primary = typeof selectionValue.primary === "string" ? selectionValue.primary : "";
      const secondary = mode === "semester" && typeof selectionValue.secondary === "string" ? selectionValue.secondary : "";
      const primaryGrade = typeof selectionValue.primaryGrade === "string" && validMarks.has(selectionValue.primaryGrade) ? selectionValue.primaryGrade as GradeMark | "" : "";
      const secondaryGrade = typeof selectionValue.secondaryGrade === "string" && validMarks.has(selectionValue.secondaryGrade) ? selectionValue.secondaryGrade as GradeMark | "" : "";
      selections[planGrade][slot.id] = { mode, primary, secondary, primaryGrade, secondaryGrade };
    }
  }
  return selections;
}

function parseImportedPlan(value: unknown) {
  if (!isRecord(value) || !isRecord(value.selections)) throw new Error("This file does not contain a course plan.");
  const priorCourses = Array.isArray(value.priorCourses) ? value.priorCourses.filter((item): item is string => typeof item === "string") : [];
  const allowedPriorCourses = new Set(priorCourseChoices.map((item) => item.id));
  const filteredPriorCourses = priorCourses.filter((item) => allowedPriorCourses.has(item));
  const validMarks = new Set<string>([...gradeMarks, ""]);
  const rawPriorCourseGrades = isRecord(value.priorCourseGrades) ? value.priorCourseGrades : {};
  const priorCourseGrades = Object.fromEntries(Object.entries(rawPriorCourseGrades).filter((entry): entry is [string, GradeMark | ""] =>
    filteredPriorCourses.includes(entry[0])
    && Boolean(courseById.get(entry[0]) && priorCourseReceivesGrade(courseById.get(entry[0])!))
    && typeof entry[1] === "string"
    && validMarks.has(entry[1]),
  ));
  const rawEligibility = isRecord(value.eligibilityChecks) ? value.eligibilityChecks : {};
  const eligibilityChecks = Object.fromEntries(Object.entries(rawEligibility).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"));
  const normalizedSelections = sanitizeSelections(normalizeImportedSelections(value.selections), filteredPriorCourses);
  const rawLockedSelections = isRecord(value.lockedSelections)
    ? Object.fromEntries(Object.entries(value.lockedSelections).filter((entry): entry is [string, boolean] => entry[1] === true))
    : {};
  const plan: SavedPlan = {
    studentName: typeof value.studentName === "string" ? value.studentName.slice(0, 200) : "",
    selections: normalizedSelections,
    lockedSelections: sanitizeLockedSelections(rawLockedSelections, normalizedSelections),
    priorCourses: filteredPriorCourses,
    priorCourseGrades,
    diplomaType: value.diplomaType === "standard" ? "standard" : "advanced",
    eligibilityChecks,
  };
  const activeView = typeof value.activeView === "string" ? value.activeView : "grade-7";
  return { plan, activeView };
}

async function importedJsonFromFile(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("The selected file is larger than 10 MB.");
  if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
    const contents = new TextDecoder("latin1").decode(await file.arrayBuffer());
    const match = contents.match(/%FCPS_PLAN_V1_BEGIN\s+([\s\S]*?)%FCPS_PLAN_V1_END/);
    if (!match) throw new Error("Only PDFs exported by this planner can be loaded and edited.");
    const encoded = match[1].split(/\r?\n/).map((line) => line.replace(/^%/, "")).join("").replace(/\s/g, "");
    return decodeBase64Utf8(encoded);
  }
  return file.text();
}

function selectedCourseIds(grade: Grade, selections: Selections) {
  return new Set(Object.values(selections[grade]).flatMap((value) => [value.primary, value.secondary]).filter(Boolean));
}

function prerequisitesFor(grade: Grade, selections: Selections, priorCourses: string[]) {
  const completed = new Set(priorCourses);
  for (const earlierGrade of gradeOrder.slice(0, gradeOrder.indexOf(grade))) {
    selectedCourseIds(earlierGrade, selections).forEach((courseId) => completed.add(courseId));
  }
  return completed;
}

function unavailableReasonFor(item: Course, grade: Grade) {
  if (item.unavailableReason) return item.unavailableReason;
  if (item.allowedGrades && !item.allowedGrades.includes(grade)) return item.gradeRestrictionReason ?? `Not available in grade ${grade}`;
  if (item.prerequisite) return `requires ${item.prerequisite.label}`;
  if (item.earlyPlacement && Number(grade) < Number(item.earlyPlacement.typicalGrade)) return `early placement requires prior ${item.earlyPlacement.label}`;
  return "unavailable";
}

function isAvailable(item: Course, grade: Grade, selections: Selections, priorCourses: string[], additionalCompleted: string[] = []) {
  if (item.unavailableReason) return false;
  if (item.allowedGrades && !item.allowedGrades.includes(grade)) return false;
  const completed = prerequisitesFor(grade, selections, priorCourses);
  additionalCompleted.forEach((courseId) => completed.add(courseId));
  if (item.prerequisite) {
    const prerequisiteGroups = item.prerequisite.allOf ?? [item.prerequisite.anyOf];
    if (!prerequisiteGroups.every((group) => group.some((required) => completed.has(required)))) return false;
  }
  if (item.earlyPlacement && Number(grade) < Number(item.earlyPlacement.typicalGrade)
    && !item.earlyPlacement.anyOf.some((required) => completed.has(required))) return false;
  return true;
}

function findCourse(grade: Grade, id: string) {
  for (const slot of plans[grade].slots) {
    const options = slot.kind === "core" ? slot.courses : [...slot.yearlong, ...slot.semester];
    const match = options.find((item) => item.id === id);
    if (match) return match;
  }
}

export function canSelectCourse(grade: Grade, courseId: string, selections: Selections, priorCourses: string[] = []) {
  const item = findCourse(grade, courseId);
  return Boolean(item && isAvailable(item, grade, selections, priorCourses));
}

function electiveFormatFor(slots: ElectiveSlot[], gradeSelections: Record<string, Selection>): ElectiveFormat {
  const modes = slots.map((slot) => gradeSelections[slot.id]?.mode ?? "yearlong");
  if (modes.every((mode) => mode === "semester")) return "four-semester";
  if (modes.some((mode) => mode === "semester")) return "mixed";
  return "two-yearlong";
}

function fallSemesterCourseIds(gradeSelections: Record<string, Selection>) {
  return Object.values(gradeSelections)
    .filter((value) => value.mode === "semester" && value.primary)
    .map((value) => value.primary);
}

function courseFamilyId(courseId: string) {
  return courseVersionDetails[courseId]?.familyId ?? courseId;
}

function electiveFamilyIdsExcept(
  electiveSlots: ElectiveSlot[],
  gradeSelections: Record<string, Selection>,
  exceptSlotId: string,
  exceptField: "primary" | "secondary",
) {
  const familyIds: string[] = [];
  for (const electiveSlot of electiveSlots) {
    const value = gradeSelections[electiveSlot.id];
    if (!value) continue;
    if (!(electiveSlot.id === exceptSlotId && exceptField === "primary") && value.primary) {
      familyIds.push(courseFamilyId(value.primary));
    }
    if (value.mode === "semester" && !(electiveSlot.id === exceptSlotId && exceptField === "secondary") && value.secondary) {
      familyIds.push(courseFamilyId(value.secondary));
    }
  }
  return [...new Set(familyIds)];
}

export function sanitizeSelections(selections: Selections, priorCourses: string[]) {
  const next: Selections = structuredClone(selections);
  for (const grade of ["7", "8", "9", "10", "11", "12"] as Grade[]) {
    next[grade] ??= {};
    for (const [slotId, value] of Object.entries(next[grade])) {
      const primary = findCourse(grade, value.primary);
      const primaryIsValid = Boolean(primary && isAvailable(primary, grade, next, priorCourses));
      next[grade][slotId] = {
        ...value,
        primary: primaryIsValid ? value.primary : "",
        primaryGrade: primaryIsValid ? value.primaryGrade ?? "" : "",
      };
    }

    const electiveSlots = plans[grade].slots.filter((slot): slot is ElectiveSlot => slot.kind === "elective");
    const usedElectiveFamilies = new Set<string>();
    for (const electiveSlot of electiveSlots) {
      const value = next[grade][electiveSlot.id];
      if (!value?.primary) continue;
      const familyId = courseFamilyId(value.primary);
      if (usedElectiveFamilies.has(familyId)) {
        next[grade][electiveSlot.id] = { ...value, primary: "", primaryGrade: "" };
      } else {
        usedElectiveFamilies.add(familyId);
      }
    }

    const completedInFall = fallSemesterCourseIds(next[grade]);
    for (const [slotId, value] of Object.entries(next[grade])) {
      const secondary = findCourse(grade, value.secondary);
      const secondaryIsValid = Boolean(value.mode === "semester" && secondary && isAvailable(secondary, grade, next, priorCourses, completedInFall));
      next[grade][slotId] = {
        ...value,
        secondary: secondaryIsValid ? value.secondary : "",
        secondaryGrade: secondaryIsValid ? value.secondaryGrade ?? "" : "",
      };
    }

    for (const electiveSlot of electiveSlots) {
      const value = next[grade][electiveSlot.id];
      if (value?.mode !== "semester" || !value.secondary) continue;
      const familyId = courseFamilyId(value.secondary);
      if (usedElectiveFamilies.has(familyId)) {
        next[grade][electiveSlot.id] = { ...value, secondary: "", secondaryGrade: "" };
      } else {
        usedElectiveFamilies.add(familyId);
      }
    }
  }
  return next;
}

function courseDependencyIds(item: Course) {
  return [...new Set([
    ...(item.prerequisite?.anyOf ?? []),
    ...(item.earlyPlacement?.anyOf ?? []),
  ])];
}

function prerequisiteClosure(courseIds: string[]) {
  const dependencies = new Set<string>();
  const visit = (courseId: string) => {
    const item = courseById.get(courseId);
    if (!item) return;
    for (const dependencyId of courseDependencyIds(item)) {
      if (dependencies.has(dependencyId)) continue;
      dependencies.add(dependencyId);
      visit(dependencyId);
    }
  };
  courseIds.forEach(visit);
  return dependencies;
}

function previousGradeIds(grade: Grade, selections: Selections) {
  const gradeIndex = gradeOrder.indexOf(grade);
  return gradeIndex > 0 ? selectedCourseIds(gradeOrder[gradeIndex - 1], selections) : new Set<string>();
}

function isSequentialFamilyStep(item: Course, completed: Set<string>) {
  const familyId = courseFamilyId(item.id);
  return courseDependencyIds(item).some((dependencyId) =>
    completed.has(dependencyId) && courseFamilyId(dependencyId) === familyId,
  );
}

function lockedCourseEntries(selections: Selections, lockedSelections: Record<string, boolean>) {
  const entries: { grade: Grade; courseId: string }[] = [];
  for (const grade of gradeOrder) {
    for (const slot of plans[grade].slots) {
      const value = selections[grade]?.[slot.id];
      if (!value) continue;
      if (value.primary && lockedSelections[selectionLockKey(grade, slot.id, "primary")]) {
        entries.push({ grade, courseId: value.primary });
      }
      if (slot.kind === "elective" && value.mode === "semester" && value.secondary
        && lockedSelections[selectionLockKey(grade, slot.id, "secondary")]) {
        entries.push({ grade, courseId: value.secondary });
      }
    }
  }
  return entries;
}

export function autofillSelections(
  selections: Selections,
  priorCourses: string[],
  lockedSelections: Record<string, boolean> = {},
) {
  const original = structuredClone(selections);
  const next = emptySelections();
  const lockedEntries = lockedCourseEntries(original, lockedSelections);
  const lockedDependencies = prerequisiteClosure(lockedEntries.map((entry) => entry.courseId));

  for (const grade of gradeOrder) {
    for (const slot of plans[grade].slots) {
      const existing = original[grade]?.[slot.id] ?? emptySelection();
      const mode = slot.kind === "elective" ? existing.mode : "yearlong";
      const primaryLocked = Boolean(existing.primary && lockedSelections[selectionLockKey(grade, slot.id, "primary")]);
      const secondaryLocked = Boolean(slot.kind === "elective" && mode === "semester" && existing.secondary
        && lockedSelections[selectionLockKey(grade, slot.id, "secondary")]);
      next[grade][slot.id] = {
        mode,
        primary: primaryLocked ? existing.primary : "",
        secondary: secondaryLocked ? existing.secondary : "",
        primaryGrade: primaryLocked ? existing.primaryGrade : "",
        secondaryGrade: secondaryLocked ? existing.secondaryGrade : "",
      };
    }
  }

  const chooseCourse = (
    grade: Grade,
    slot: Slot,
    field: SelectionField,
    options: Course[],
    additionalCompleted: string[] = [],
  ) => {
    const value = next[grade][slot.id];
    const lockKey = selectionLockKey(grade, slot.id, field);
    const lockedCourseId = lockedSelections[lockKey] ? value[field] : "";
    const lockedCourse = lockedCourseId ? options.find((item) => item.id === lockedCourseId) : undefined;
    if (lockedCourse && isAvailable(lockedCourse, grade, next, priorCourses, additionalCompleted)) return;

    const completed = prerequisitesFor(grade, next, priorCourses);
    additionalCompleted.forEach((courseId) => completed.add(courseId));
    const completedFamilies = new Set([...completed].map(courseFamilyId));
    const priorGradeCourses = previousGradeIds(grade, next);
    const existingPreference = slot.kind === "elective" ? original[grade]?.[slot.id]?.[field] ?? "" : "";
    const usedElectiveFamilies = slot.kind === "elective"
      ? new Set(electiveFamilyIdsExcept(
        plans[grade].slots.filter((candidate): candidate is ElectiveSlot => candidate.kind === "elective"),
        next[grade],
        slot.id,
        field,
      ))
      : new Set<string>();
    const currentGradeIndex = gradeOrder.indexOf(grade);

    const candidates = options.filter((item) => {
      if (!isAvailable(item, grade, next, priorCourses, additionalCompleted)) return false;
      if (slot.kind === "elective" && usedElectiveFamilies.has(courseFamilyId(item.id))) return false;
      if (completed.has(item.id)) return false;
      if (completedFamilies.has(courseFamilyId(item.id)) && !isSequentialFamilyStep(item, completed)) return false;
      const reservedForFutureLock = lockedEntries.some((entry) =>
        gradeOrder.indexOf(entry.grade) > currentGradeIndex
        && courseFamilyId(entry.courseId) === courseFamilyId(item.id),
      );
      return !reservedForFutureLock || lockedDependencies.has(item.id);
    });

    const ranked = candidates.map((item, index) => {
      const dependencies = courseDependencyIds(item);
      const sequenceFromPreviousGrade = dependencies.some((dependencyId) => priorGradeCourses.has(dependencyId));
      const sequenceFromEarlierWork = dependencies.some((dependencyId) => completed.has(dependencyId));
      const reservedForLaterRequiredSlot = slot.kind === "core" && gradeOrder.slice(currentGradeIndex + 1).some((laterGrade) => {
        const laterSlot = plans[laterGrade].slots.find((candidate) => candidate.kind === "core" && candidate.id === slot.id);
        return Boolean(laterSlot && laterSlot.kind === "core" && groupCourseFamilies(laterSlot.courses).length === 1
          && laterSlot.courses.some((candidate) => candidate.id === item.id));
      });
      const score =
        (lockedDependencies.has(item.id) ? 80_000 : 0)
        + (existingPreference === item.id ? 60_000 : 0)
        + (sequenceFromPreviousGrade ? 45_000 : 0)
        + (sequenceFromEarlierWork ? 35_000 : 0)
        + (publishedPlanCourseIds[grade].has(item.id) ? 30_000 : 0)
        + ((item.gpaWeight ?? 0) * 1_000)
        + (item.highSchoolCredit ? 100 : 0)
        - (reservedForLaterRequiredSlot ? 70_000 : 0)
        - (index / 1_000);
      return { item, score };
    }).sort((left, right) => right.score - left.score);

    const chosen = ranked[0]?.item;
    const previousCourseId = original[grade]?.[slot.id]?.[field] ?? "";
    const gradeField = field === "primary" ? "primaryGrade" : "secondaryGrade";
    next[grade][slot.id] = {
      ...value,
      [field]: chosen?.id ?? "",
      [gradeField]: chosen?.id === previousCourseId ? original[grade]?.[slot.id]?.[gradeField] ?? "" : "",
    };
  };

  for (const grade of gradeOrder) {
    for (const slot of plans[grade].slots) {
      const value = next[grade][slot.id];
      const primaryOptions = slot.kind === "core" ? slot.courses : value.mode === "yearlong" ? slot.yearlong : slot.semester;
      chooseCourse(grade, slot, "primary", primaryOptions);
      if (slot.kind === "elective" && value.mode === "semester") {
        chooseCourse(grade, slot, "secondary", slot.semester, fallSemesterCourseIds(next[grade]));
      }
    }
  }

  return sanitizeSelections(next, priorCourses);
}

function GradeOptions() {
  return gradeMarks.map((mark) => <option key={mark} value={mark}>{mark}</option>);
}

function courseWeightDetails(item: Course) {
  const designation = /Dual Enrollment|(^|\s)DE(\s|$)/i.test(item.label)
    ? "DE"
    : /(^|\s)AP(\s|$)|Advanced Placement/i.test(item.label)
      ? "AP"
      : /Honors|(^|\s)HN(\s|$)/i.test(item.label)
        ? "HONORS"
        : "STANDARD";
  const modifier = item.gpaWeight ?? 0;
  return {
    designation,
    modifier,
    modifierLabel: `+${modifier.toFixed(1)} GPA points`,
    className: designation.toLowerCase(),
  };
}

function CourseWeightBadge({ grade, courseId }: { grade: Grade; courseId: string }) {
  if (!courseId) return null;
  const selectedCourse = findCourse(grade, courseId);
  if (!selectedCourse) return null;
  const details = courseWeightDetails(selectedCourse);
  const context = details.designation === "DE"
    ? "College admission and placement requirements apply"
    : details.designation !== "STANDARD" && !selectedCourse.highSchoolCredit
      ? "Middle-school course; no transcript weight"
      : "Weighted GPA modifier";

  return (
    <div className={`course-weight course-weight-${details.className}`} aria-label={`${details.designation}, ${details.modifierLabel}`}>
      <strong>{details.designation}</strong>
      <span>{details.modifierLabel}</span>
      <small>{context}</small>
    </div>
  );
}

export function calculateGpa(grade: Grade, gradeSelections: Record<string, Selection>, gpaMode: GpaMode) {
  let qualityPoints = 0;
  let credits = 0;
  let courseCount = 0;

  const includeCourse = (courseId: string, mark: GradeMark | "" | undefined, credit: number) => {
    if (!courseId || !mark) return;
    const selectedCourse = findCourse(grade, courseId);
    if (!selectedCourse) return;
    const basePoints = gradePoints[mark];
    const weight = gpaMode === "weighted" && basePoints > 0 ? selectedCourse.gpaWeight ?? 0 : 0;
    qualityPoints += (basePoints + weight) * credit;
    credits += credit;
    courseCount += 1;
  };

  for (const slot of plans[grade].slots) {
    const value = gradeSelections[slot.id];
    if (!value) continue;
    if (slot.kind === "core" || value.mode === "yearlong") {
      includeCourse(value.primary, value.primaryGrade, 1);
    } else {
      includeCourse(value.primary, value.primaryGrade, 0.5);
      includeCourse(value.secondary, value.secondaryGrade, 0.5);
    }
  }

  return { value: credits ? qualityPoints / credits : null, credits, courseCount };
}

export function calculateTranscriptGpa(
  selections: Selections,
  gpaMode: GpaMode,
  priorCourses: string[] = [],
  priorCourseGrades: Record<string, GradeMark | ""> = {},
) {
  let qualityPoints = 0;
  let credits = 0;
  let courseCount = 0;

  const includeCourse = (selectedCourse: Course | undefined, mark: GradeMark | "" | undefined, credit: number) => {
    if (!mark) return;
    if (!selectedCourse?.highSchoolCredit) return;
    const basePoints = gradePoints[mark];
    const weight = gpaMode === "weighted" && basePoints > 0 ? selectedCourse.gpaWeight ?? 0 : 0;
    qualityPoints += (basePoints + weight) * credit;
    credits += credit;
    courseCount += 1;
  };

  for (const courseId of priorCourses) {
    includeCourse(courseById.get(courseId), priorCourseGrades[courseId], 1);
  }

  for (const grade of gradeOrder) {
    for (const slot of plans[grade].slots) {
      const value = selections[grade]?.[slot.id];
      if (!value) continue;
      if (slot.kind === "core" || value.mode === "yearlong") {
        includeCourse(findCourse(grade, value.primary), value.primaryGrade, 1);
      } else {
        includeCourse(findCourse(grade, value.primary), value.primaryGrade, 0.5);
        includeCourse(findCourse(grade, value.secondary), value.secondaryGrade, 0.5);
      }
    }
  }

  return { value: credits ? qualityPoints / credits : null, credits, courseCount };
}

function availabilityDetails(grade: Grade, item: Course) {
  if (collegeCreditDetails[item.id]) return { label: "FCPS DE • Skyview availability unconfirmed", className: "unconfirmed" };
  if (grade === "7" || grade === "8") {
    return publishedPlanCourseIds[grade].has(item.id)
      ? { label: "Rachel Carson 2026–27 selection", className: "confirmed" }
      : { label: "Exceptional FCPS option • counselor review", className: "review" };
  }
  if (grade === "9" || grade === "10") {
    return publishedPlanCourseIds[grade].has(item.id)
      ? { label: "Skyview opening-year plan • enrollment dependent", className: "dependent" }
      : { label: "FCPS option • Skyview availability unconfirmed", className: "unconfirmed" };
  }
  return { label: "Future Skyview plan • offering unconfirmed", className: "future" };
}

function eligibilityForCourse(item: Course, grade: Grade) {
  const requirements = [...(item.eligibilityRequirements ?? [])];
  if (collegeCreditDetails[item.id] && grade === "10") requirements.push(deUnderclassRequirement);
  return requirements.filter((requirement, index) => requirements.findIndex((candidate) => candidate.id === requirement.id) === index);
}

function eligibilityCheckId(grade: Grade, courseId: string, requirementId: string) {
  return `${grade}:${courseId}:${requirementId}`;
}

function explanationForCourse(item: Course) {
  if (courseExplanations[item.id]) return courseExplanations[item.id];
  const designation = courseWeightDetails(item).designation;
  if (designation === "DE") return "Dual Enrollment earns both FCPS and partner-college credit when the student meets college requirements and successfully completes the course.";
  if (designation === "AP") return "Advanced Placement follows a College Board college-level framework and normally concludes with an AP exam. College credit depends on the exam score and college policy.";
  if (designation === "HONORS") return "Honors coursework moves at an accelerated level and carries the configured FCPS honors GPA weight when it is a high-school-credit course.";
  if (item.prerequisite) return `This sequential course follows ${item.prerequisite.label}.`;
  return "This is the standard version of the selected FCPS course.";
}

function CourseSupport({
  grade,
  courseId,
  subject,
  highSchoolCredits,
  eligibilityChecks,
  onToggleEligibility,
}: {
  grade: Grade;
  courseId: string;
  subject: string;
  highSchoolCredits: number;
  eligibilityChecks: Record<string, boolean>;
  onToggleEligibility: (checkId: string) => void;
}) {
  if (!courseId) return null;
  const item = findCourse(grade, courseId);
  if (!item) return null;
  const availability = availabilityDetails(grade, item);
  const collegeCredit = collegeCreditDetails[item.id];
  const eligibility = eligibilityForCourse(item, grade);

  return (
    <div className="course-support">
      <CourseWeightBadge grade={grade} courseId={courseId} />
      <p className={`availability availability-${availability.className}`}>{availability.label}</p>
      {eligibility.length > 0 && (
        <fieldset className="eligibility-checklist">
          <legend>Eligibility checks</legend>
          <p>These are separate from the course prerequisite and require official verification.</p>
          {eligibility.map((requirement) => {
            const checkId = eligibilityCheckId(grade, item.id, requirement.id);
            return (
              <label key={requirement.id} title={requirement.detail}>
                <input type="checkbox" checked={Boolean(eligibilityChecks[checkId])} onChange={() => onToggleEligibility(checkId)} />
                <span>{requirement.label}</span>
              </label>
            );
          })}
        </fieldset>
      )}
      <details className="course-details">
        <summary>Course details</summary>
        <p>{explanationForCourse(item)}</p>
        <dl>
          <div><dt>High-school credit</dt><dd>{item.highSchoolCredit ? highSchoolCredits : 0}</dd></div>
          <div><dt>College credit</dt><dd>{collegeCredit ? `${collegeCredit.credits} ${collegeCredit.provider} credits${collegeCredit.note ? ` • ${collegeCredit.note}` : ""}` : courseWeightDetails(item).designation === "AP" ? "Possible through AP exam; college policy varies" : "None listed"}</dd></div>
          <div><dt>Availability</dt><dd>{availability.label}</dd></div>
          <div><dt>Course prerequisite</dt><dd>{item.prerequisite?.label ?? "None listed"}</dd></div>
          {item.earlyPlacement && <div><dt>Early-placement pre-work</dt><dd>{item.earlyPlacement.label}</dd></div>}
        </dl>
        <SourceLinks items={sourcesForCourse(grade, item, subject)} />
      </details>
    </div>
  );
}

type PlannedCourse = {
  grade: Grade;
  slotId: string;
  courseId: string;
  credit: number;
  item: Course;
};

function plannedCourses(selections: Selections): PlannedCourse[] {
  const entries: PlannedCourse[] = [];
  const addCourse = (grade: Grade, slotId: string, courseId: string, credit: number) => {
    if (!courseId || courseId.startsWith("elective-placeholder")) return;
    const item = findCourse(grade, courseId);
    if (item?.highSchoolCredit) entries.push({ grade, slotId, courseId, credit, item });
  };

  for (const grade of gradeOrder) {
    for (const slot of plans[grade].slots) {
      const value = selections[grade]?.[slot.id];
      if (!value) continue;
      if (slot.kind === "core" || value.mode === "yearlong") {
        addCourse(grade, slot.id, value.primary, 1);
      } else {
        addCourse(grade, slot.id, value.primary, 0.5);
        addCourse(grade, slot.id, value.secondary, 0.5);
      }
    }
  }
  return entries;
}

function creditCategory(entry: PlannedCourse): CreditCategory {
  if (entry.slotId === "english") return "english";
  if (entry.slotId === "math") return "math";
  if (entry.slotId === "science") return "science";
  if (entry.slotId === "social-studies") return "social";
  if (entry.slotId === "health-pe") return "healthPe";
  if (entry.slotId === "epf") return "epf";
  if (/^(spanish|french|japanese|latin|arabic|asl)/.test(entry.courseId)) return "worldLanguage";
  if (/(art|band|chorus|orchestra|music|guitar|theatre|engineering|programming|computer|coding|facs|career)/.test(entry.courseId)) return "fineArtsCte";
  return "elective";
}

export function plannedCreditTotals(selections: Selections) {
  const totals: Record<CreditCategory, number> = { english: 0, math: 0, science: 0, social: 0, healthPe: 0, worldLanguage: 0, fineArtsCte: 0, epf: 0, elective: 0 };
  const entries = plannedCourses(selections);
  entries.forEach((entry) => { totals[creditCategory(entry)] += entry.credit; });
  return { totals, entries, total: entries.reduce((sum, entry) => sum + entry.credit, 0) };
}

export function graduationRequirements(diplomaType: DiplomaType, selections: Selections): RequirementRow[] {
  const { totals } = plannedCreditTotals(selections);
  if (diplomaType === "standard") {
    const combined = totals.worldLanguage + totals.fineArtsCte;
    const electiveCredits = totals.elective
      + Math.max(0, totals.english - 4)
      + Math.max(0, totals.math - 3)
      + Math.max(0, totals.science - 3)
      + Math.max(0, totals.social - 3)
      + Math.max(0, totals.healthPe - 2)
      + Math.max(0, combined - 2)
      + Math.max(0, totals.epf - 1);
    return [
      { id: "english", label: "English", required: 4, planned: totals.english },
      { id: "math", label: "Mathematics", required: 3, planned: totals.math },
      { id: "science", label: "Laboratory Science", required: 3, planned: totals.science },
      { id: "social", label: "History & Social Sciences", required: 3, planned: totals.social },
      { id: "healthPe", label: "Health & PE", required: 2, planned: totals.healthPe },
      { id: "combined", label: "World Language / Fine Arts / CTE", required: 2, planned: combined },
      { id: "epf", label: "Economics & Personal Finance", required: 1, planned: totals.epf },
      { id: "elective", label: "Electives", required: 4, planned: electiveCredits },
    ];
  }
  const electiveCredits = totals.elective
    + Math.max(0, totals.english - 4)
    + Math.max(0, totals.math - 4)
    + Math.max(0, totals.science - 4)
    + Math.max(0, totals.social - 4)
    + Math.max(0, totals.worldLanguage - 3)
    + Math.max(0, totals.healthPe - 2)
    + Math.max(0, totals.fineArtsCte - 1)
    + Math.max(0, totals.epf - 1);
  return [
    { id: "english", label: "English", required: 4, planned: totals.english },
    { id: "math", label: "Mathematics", required: 4, planned: totals.math },
    { id: "science", label: "Laboratory Science", required: 4, planned: totals.science },
    { id: "social", label: "History & Social Sciences", required: 4, planned: totals.social },
    { id: "worldLanguage", label: "World Language", required: 3, planned: totals.worldLanguage },
    { id: "healthPe", label: "Health & PE", required: 2, planned: totals.healthPe },
    { id: "fineArtsCte", label: "Fine Arts / CTE", required: 1, planned: totals.fineArtsCte },
    { id: "epf", label: "Economics & Personal Finance", required: 1, planned: totals.epf },
    { id: "elective", label: "Electives", required: 3, planned: electiveCredits },
  ];
}

function planChecks(diplomaType: DiplomaType, selections: Selections, eligibilityChecks: Record<string, boolean>) {
  const issues: string[] = [];
  const confirmations: string[] = [];
  const requirements = graduationRequirements(diplomaType, selections);
  const missing = requirements.filter((row) => row.planned < row.required).map((row) => row.label);
  if (missing.length) issues.push(`The current six-year plan is short in: ${missing.join(", ")}.`);

  const { entries } = plannedCreditTotals(selections);
  const duplicateNames = entries
    .filter((entry, index) => entries.findIndex((candidate) => candidate.courseId === entry.courseId) !== index)
    .map((entry) => entry.item.label);
  const duplicates = [...new Set(duplicateNames)];
  if (duplicates.length) issues.push(`Repeated course selection: ${duplicates.join(", ")}. Confirm that repeat credit is allowed.`);

  const uncheckedEligibility = entries.filter((entry) => eligibilityForCourse(entry.item, entry.grade)
    .some((requirement) => !eligibilityChecks[eligibilityCheckId(entry.grade, entry.courseId, requirement.id)]));
  if (uncheckedEligibility.length) {
    const labels = [...new Set(uncheckedEligibility.map((entry) => entry.item.label))];
    confirmations.push(`Confirm Dual Enrollment eligibility for: ${labels.join(", ")}.`);
  }

  const unconfirmed = entries.filter((entry) => ["unconfirmed", "future"].includes(availabilityDetails(entry.grade, entry.item).className));
  if (unconfirmed.length) confirmations.push(`${unconfirmed.length} selected ${unconfirmed.length === 1 ? "course has" : "courses have"} unconfirmed Skyview availability. Confirm the planned offerings with a counselor.`);

  if (diplomaType === "advanced" && entries.length && !entries.some((entry) => courseWeightDetails(entry.item).designation !== "STANDARD")) {
    issues.push("The Advanced Diploma plan does not yet include an Honors, AP, or DE course; FCPS requires an advanced course or another approved advanced-learning option.");
  }
  return { issues, confirmations };
}

function versionDetailsFor(item: Course): CourseVersionDetails {
  return courseVersionDetails[item.id] ?? { familyId: item.id, familyLabel: item.label, versionLabel: "" };
}

function groupCourseFamilies(courses: Course[]): CourseFamily[] {
  const families = new Map<string, CourseFamily>();
  for (const item of courses) {
    const details = versionDetailsFor(item);
    const family = families.get(details.familyId);
    if (family) family.courses.push(item);
    else families.set(details.familyId, { id: details.familyId, label: details.familyLabel, courses: [item] });
  }
  return [...families.values()];
}

function sortedVersions(courses: Course[]) {
  const priority = (item: Course) => {
    const version = versionDetailsFor(item).versionLabel;
    if (version === "Standard") return 0;
    if (version === "Honors") return 1;
    if (version === "AAP Center") return 2;
    return 3;
  };
  return [...courses].sort((left, right) => priority(left) - priority(right));
}

function SelectionLockButton({
  locked,
  disabled,
  label,
  onToggle,
}: {
  locked: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`selection-lock${locked ? " selection-lock-active" : ""}`}
      aria-pressed={locked}
      aria-label={`${locked ? "Unlock" : "Lock"} ${label}`}
      title={locked ? "Autofill will keep this course" : "Keep this course during autofill"}
      disabled={disabled}
      onClick={onToggle}
    >
      {locked ? "Locked" : "Lock"}
    </button>
  );
}

function CoursePicker({
  courses,
  grade,
  selections,
  priorCourses,
  value,
  label,
  visibleLabel = true,
  additionalCompleted = [],
  blockedFamilyIds = [],
  onChange,
}: {
  courses: Course[];
  grade: Grade;
  selections: Selections;
  priorCourses: string[];
  value: string;
  label: string;
  visibleLabel?: boolean;
  additionalCompleted?: string[];
  blockedFamilyIds?: string[];
  onChange: (courseId: string) => void;
}) {
  const families = groupCourseFamilies(courses);
  const selectedFamily = families.find((family) => family.courses.some((item) => item.id === value));

  function chooseFamily(familyId: string) {
    if (!familyId) {
      onChange("");
      return;
    }
    const family = families.find((item) => item.id === familyId);
    if (!family || blockedFamilyIds.includes(family.id)) return;
    const firstAvailable = family && sortedVersions(family.courses).find((item) => isAvailable(item, grade, selections, priorCourses, additionalCompleted));
    onChange(firstAvailable?.id ?? "");
  }

  return (
    <div className="course-picker">
      <label>
        <span className={visibleLabel ? undefined : "sr-only"}>{label}</span>
        <select value={selectedFamily?.id ?? ""} onChange={(event) => chooseFamily(event.target.value)}>
          <option value="">Select a course</option>
          {families.map((family) => {
            const duplicate = blockedFamilyIds.includes(family.id);
            const available = !duplicate && family.courses.some((item) => isAvailable(item, grade, selections, priorCourses, additionalCompleted));
            const allDualEnrollment = family.courses.every((item) => courseWeightDetails(item).designation === "DE");
            const suffix = allDualEnrollment ? " • college credit" : family.courses.some((item) => item.highSchoolCredit) ? " • HS credit" : "";
            const reason = family.courses.map((item) => unavailableReasonFor(item, grade)).find(Boolean);
            const unavailable = duplicate ? "already selected in another elective" : reason;
            return <option key={family.id} value={family.id} disabled={!available}>{family.label}{suffix}{available ? "" : ` — ${unavailable}`}</option>;
          })}
        </select>
      </label>

      {selectedFamily && (selectedFamily.courses.length > 1 || versionDetailsFor(selectedFamily.courses[0]).versionLabel) && (
        <label className="version-field">
          <span>Version</span>
          <select value={value} onChange={(event) => onChange(event.target.value)}>
            {sortedVersions(selectedFamily.courses).map((item) => {
              const available = isAvailable(item, grade, selections, priorCourses, additionalCompleted);
              const details = versionDetailsFor(item);
              const locked = available ? "" : ` — ${unavailableReasonFor(item, grade)}`;
              return <option key={item.id} value={item.id} disabled={!available}>{details.versionLabel}{locked}</option>;
            })}
          </select>
        </label>
      )}
    </div>
  );
}

function PlanOverview({
  selections,
  priorCourses,
  priorCourseGrades,
  onEditGrade,
}: {
  selections: Selections;
  priorCourses: string[];
  priorCourseGrades: Record<string, GradeMark | "">;
  onEditGrade: (grade: Grade) => void;
}) {
  const transcriptUnweighted = calculateTranscriptGpa(selections, "unweighted", priorCourses, priorCourseGrades);
  const transcriptWeighted = calculateTranscriptGpa(selections, "weighted", priorCourses, priorCourseGrades);

  return (
    <section className="overview" aria-labelledby="planner-title">
      <div className="overview-heading">
        <div>
          <p className="section-label">All grades</p>
          <h2 id="planner-title">Grade 7–12 overview</h2>
        </div>
        <div className="overview-context">
          <p>Review the full course path in one place. Use Edit grade to make changes.</p>
          <SourceLinks items={allSources} label="All official sources" />
        </div>
      </div>

      <section className="college-gpa" aria-labelledby="college-gpa-title">
        <div className="college-gpa-heading">
          <div>
            <p className="section-label">College-facing GPA estimate</p>
            <h3 id="college-gpa-title">Projected FCPS transcript GPA</h3>
          </div>
          <p>{transcriptWeighted.courseCount ? `${transcriptWeighted.courseCount} graded high-school-credit ${transcriptWeighted.courseCount === 1 ? "course" : "courses"} • ${transcriptWeighted.credits} ${transcriptWeighted.credits === 1 ? "credit" : "credits"}` : "Add grades to high-school-credit courses to calculate this estimate."}</p>
        </div>
        <div className="college-gpa-values" aria-live="polite">
          <div className="college-gpa-primary">
            <span>FCPS weighted GPA</span>
            <strong>{transcriptWeighted.value === null ? "—" : transcriptWeighted.value.toFixed(2)}</strong>
            <small>Reported GPA estimate</small>
          </div>
          <div className="college-gpa-secondary">
            <span>Unweighted reference</span>
            <strong>{transcriptUnweighted.value === null ? "—" : transcriptUnweighted.value.toFixed(2)}</strong>
          </div>
        </div>
        <p className="college-gpa-note">Includes graded high-school-credit courses completed before grade 7 or planned in grades 7–12; semester courses count as half credit. Colleges receive the transcript, but each college may recalculate GPA using its own rules.</p>
      </section>

      <div className="overview-grades">
        {gradeOrder.map((overviewGrade) => {
          const overviewPlan = plans[overviewGrade];
          const overviewSelections = selections[overviewGrade] ?? {};
          const unweighted = calculateGpa(overviewGrade, overviewSelections, "unweighted");
          const weighted = calculateGpa(overviewGrade, overviewSelections, "weighted");

          return (
            <section className="overview-grade" key={overviewGrade} aria-labelledby={`overview-grade-${overviewGrade}`}>
              <div className="overview-grade-heading">
                <div>
                  <h2 id={`overview-grade-${overviewGrade}`}>Grade {overviewGrade}</h2>
                  <p>
                    {overviewPlan.school === "middle" ? "Rachel Carson Middle School" : "Skyview High School"}
                    {overviewGrade === "11" || overviewGrade === "12" ? " · Future planning" : ""}
                  </p>
                  <SourceLinks items={sourcesForGrade(overviewGrade)} />
                </div>
                <div className="overview-grade-actions">
                  <p aria-label={`Grade ${overviewGrade} estimated GPA`}>
                    <span>GPA</span>
                    <strong>UW {unweighted.value === null ? "—" : unweighted.value.toFixed(2)} · W {weighted.value === null ? "—" : weighted.value.toFixed(2)}</strong>
                  </p>
                  <button type="button" onClick={() => onEditGrade(overviewGrade)}>Edit grade {overviewGrade}</button>
                </div>
              </div>

              <div className="overview-course-grid">
                {overviewPlan.slots.map((slot) => {
                  const selection = overviewSelections[slot.id] ?? emptySelection();
                  const entries = slot.kind === "core" || selection.mode === "yearlong"
                    ? [{ term: "", courseId: selection.primary, mark: selection.primaryGrade }]
                    : [
                        { term: "Fall", courseId: selection.primary, mark: selection.primaryGrade },
                        { term: "Spring", courseId: selection.secondary, mark: selection.secondaryGrade },
                      ];
                  const selectedEntries = entries.filter((entry) => entry.courseId);

                  return (
                    <div className="overview-course" key={slot.id}>
                      <h3>{slot.label}</h3>
                      {selectedEntries.length ? selectedEntries.map((entry) => (
                        <p key={`${entry.term}-${entry.courseId}`}>
                          {entry.term && <span>{entry.term}: </span>}
                          {findCourse(overviewGrade, entry.courseId)?.label ?? entry.courseId}
                          {entry.mark && <strong>{entry.mark}</strong>}
                        </p>
                      )) : <p className="overview-empty">Not selected</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function PrintPlan({
  studentName,
  selections,
  priorCourses,
  priorCourseGrades,
  diplomaType,
}: {
  studentName: string;
  selections: Selections;
  priorCourses: string[];
  priorCourseGrades: Record<string, GradeMark | "">;
  diplomaType: DiplomaType;
}) {
  const creditSummary = plannedCreditTotals(selections);
  const requirements = graduationRequirements(diplomaType, selections);
  const visiblePriorCourses = priorCourses
    .map((courseId) => courseById.get(courseId))
    .filter((item): item is Course => Boolean(item && priorCourseReceivesGrade(item)));

  return (
    <section className="print-plan" aria-label="Printable course plan">
      <header>
        <h1>{studentName.trim() ? `${studentName.trim()} — FCPS Course Plan` : "FCPS Course Plan"}</h1>
        <p>Rachel Carson Middle School → Skyview High School</p>
        <p><strong>{diplomaType === "advanced" ? "Advanced Studies" : "Standard"} Diploma:</strong> {creditSummary.total} planned high-school credits</p>
      </header>

      {visiblePriorCourses.length > 0 && (
        <section className="print-grade">
          <h2>High-school-credit courses completed before grade 7</h2>
          <table>
            <thead><tr><th scope="col">Course</th><th scope="col">Grade</th></tr></thead>
            <tbody>{visiblePriorCourses.map((item) => <tr key={item.id}><th scope="row">{item.label}</th><td>{priorCourseGrades[item.id] || "—"}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {gradeOrder.map((printGrade) => (
        <section className="print-grade" key={printGrade}>
          <h2>Grade {printGrade} — {plans[printGrade].school === "middle" ? "Rachel Carson Middle School" : "Skyview High School"}</h2>
          <table>
            <thead><tr><th scope="col">Subject</th><th scope="col">Term</th><th scope="col">Course</th><th scope="col">Grade</th></tr></thead>
            <tbody>
              {plans[printGrade].slots.flatMap((slot) => {
                const value = selections[printGrade]?.[slot.id] ?? emptySelection();
                const row = (term: string, courseId: string, mark: GradeMark | "") => {
                  const item = findCourse(printGrade, courseId);
                  return {
                    key: `${slot.id}-${term}`,
                    subject: slot.label,
                    term,
                    course: item ? `${item.label}${item.highSchoolCredit ? " • HS credit" : ""}` : "Not selected",
                    mark: mark || "—",
                  };
                };
                if (slot.kind === "core" || value.mode === "yearlong") return [row("Full year", value.primary, value.primaryGrade)];
                return [row("Fall", value.primary, value.primaryGrade), row("Spring", value.secondary, value.secondaryGrade)];
              }).map((row) => (
                <tr key={row.key}><th scope="row">{row.subject}</th><td>{row.term}</td><td>{row.course}</td><td>{row.mark}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <section className="print-requirements">
        <h2>Graduation credit check</h2>
        <table>
          <thead><tr><th scope="col">Requirement</th><th scope="col">Planned</th><th scope="col">Needed</th></tr></thead>
          <tbody>{requirements.map((row) => <tr key={row.id}><th scope="row">{row.label}</th><td>{row.planned}</td><td>{row.required}</td></tr>)}</tbody>
        </table>
        <p>Planning aid only. Final courses, credits, eligibility, and graduation status require FCPS and counselor confirmation.</p>
      </section>
    </section>
  );
}

export default function App() {
  const [savedPlan] = useState(loadSavedPlan);
  const loadInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [studentName, setStudentName] = useState(savedPlan.studentName);
  const [grade, setGrade] = useState<Grade>("7");
  const [isOverview, setIsOverview] = useState(false);
  const [selections, setSelections] = useState<Selections>(savedPlan.selections);
  const [lockedSelections, setLockedSelections] = useState<Record<string, boolean>>(savedPlan.lockedSelections);
  const [priorCourses, setPriorCourses] = useState<string[]>(savedPlan.priorCourses);
  const [priorCourseGrades, setPriorCourseGrades] = useState<Record<string, GradeMark | "">>(savedPlan.priorCourseGrades);
  const [diplomaType, setDiplomaType] = useState<DiplomaType>(savedPlan.diplomaType);
  const [eligibilityChecks, setEligibilityChecks] = useState<Record<string, boolean>>(savedPlan.eligibilityChecks);
  const [undoStack, setUndoStack] = useState<PlannerSnapshot[]>([]);
  const undoStackRef = useRef<PlannerSnapshot[]>([]);
  const [loadMessage, setLoadMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [autofillMessage, setAutofillMessage] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    window.localStorage.setItem("fcps-course-plan-v2", JSON.stringify({ studentName, selections, lockedSelections, priorCourses, priorCourseGrades, diplomaType, eligibilityChecks }));
  }, [studentName, selections, lockedSelections, priorCourses, priorCourseGrades, diplomaType, eligibilityChecks]);

  const plan = plans[grade];
  const gradeSelections = selections[grade] ?? {};
  const completedInFall = fallSemesterCourseIds(gradeSelections);
  const electiveSlots = plan.slots.filter((slot): slot is ElectiveSlot => slot.kind === "elective");
  const electiveFormat = electiveFormatFor(electiveSlots, gradeSelections);
  const unweightedGpa = calculateGpa(grade, gradeSelections, "unweighted");
  const weightedGpa = calculateGpa(grade, gradeSelections, "weighted");
  const creditSummary = plannedCreditTotals(selections);
  const requirementRows = graduationRequirements(diplomaType, selections);
  const requiredCreditTotal = diplomaType === "advanced" ? 26 : 22;
  const { issues, confirmations } = planChecks(diplomaType, selections, eligibilityChecks);
  const planCheckCount = issues.length + confirmations.length;
  const hasEnteredGrades = Object.values(priorCourseGrades).some(Boolean)
    || gradeOrder.some((planGrade) => Object.values(selections[planGrade]).some((value) => value.primaryGrade || value.secondaryGrade));

  function rememberCurrentPlan() {
    const snapshot: PlannerSnapshot = {
      selections: structuredClone(selections),
      lockedSelections: { ...lockedSelections },
      priorCourses: [...priorCourses],
      priorCourseGrades: { ...priorCourseGrades },
      diplomaType,
      eligibilityChecks: { ...eligibilityChecks },
    };
    const nextStack = [...undoStackRef.current.slice(-49), snapshot];
    undoStackRef.current = nextStack;
    setUndoStack(nextStack);
  }

  function undoLastChange() {
    const currentStack = undoStackRef.current;
    const previous = currentStack[currentStack.length - 1];
    if (!previous) return;

    setSelections(structuredClone(previous.selections));
    setLockedSelections({ ...previous.lockedSelections });
    setPriorCourses([...previous.priorCourses]);
    setPriorCourseGrades({ ...previous.priorCourseGrades });
    setDiplomaType(previous.diplomaType);
    setEligibilityChecks({ ...previous.eligibilityChecks });
    const nextStack = currentStack.slice(0, -1);
    undoStackRef.current = nextStack;
    setUndoStack(nextStack);
  }

  function updateSelection(slotId: string, patch: Partial<Selection>) {
    rememberCurrentPlan();
    if (patch.primary === "" || patch.secondary === "") {
      setLockedSelections((current) => {
        const next = { ...current };
        if (patch.primary === "") delete next[selectionLockKey(grade, slotId, "primary")];
        if (patch.secondary === "") delete next[selectionLockKey(grade, slotId, "secondary")];
        return next;
      });
    }
    setSelections((current) => {
      const existing = current[grade]?.[slotId] ?? emptySelection();
      const updated = {
        ...current,
        [grade]: { ...current[grade], [slotId]: { ...existing, ...patch } },
      };
      return sanitizeSelections(updated, priorCourses);
    });
  }

  function changeElectiveFormat(format: ElectiveFormat) {
    const formatModes = electiveFormats.find((item) => item.id === format)?.modes;
    if (!formatModes) return;

    rememberCurrentPlan();
    setLockedSelections((current) => {
      const next = { ...current };
      electiveSlots.forEach((slot, index) => {
        const existing = selections[grade]?.[slot.id] ?? emptySelection();
        const mode = formatModes[index] ?? formatModes[formatModes.length - 1];
        if (existing.mode !== mode) {
          delete next[selectionLockKey(grade, slot.id, "primary")];
          delete next[selectionLockKey(grade, slot.id, "secondary")];
        }
      });
      return next;
    });
    setSelections((current) => {
      const nextGrade = { ...current[grade] };
      electiveSlots.forEach((slot, index) => {
        const existing = nextGrade[slot.id] ?? emptySelection();
        const mode = formatModes[index] ?? formatModes[formatModes.length - 1];
        nextGrade[slot.id] = existing.mode === mode ? existing : emptySelection(mode);
      });
      return sanitizeSelections({ ...current, [grade]: nextGrade }, priorCourses);
    });
  }

  function togglePriorCourse(id: string) {
    const updated = priorCourses.includes(id) ? priorCourses.filter((item) => item !== id) : [...priorCourses, id];
    rememberCurrentPlan();
    setPriorCourses(updated);
    if (!updated.includes(id)) {
      setPriorCourseGrades((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
    setSelections((current) => sanitizeSelections(current, updated));
  }

  function updatePriorCourseGrade(courseId: string, mark: GradeMark | "") {
    rememberCurrentPlan();
    setPriorCourseGrades((current) => ({ ...current, [courseId]: mark }));
  }

  function toggleEligibility(checkId: string) {
    rememberCurrentPlan();
    setEligibilityChecks((current) => ({ ...current, [checkId]: !current[checkId] }));
  }

  function changeDiplomaType(nextDiplomaType: DiplomaType) {
    rememberCurrentPlan();
    setDiplomaType(nextDiplomaType);
  }

  function toggleSelectionLock(slotId: string, field: SelectionField) {
    const key = selectionLockKey(grade, slotId, field);
    rememberCurrentPlan();
    setLockedSelections((current) => current[key]
      ? Object.fromEntries(Object.entries(current).filter(([itemKey]) => itemKey !== key))
      : { ...current, [key]: true });
  }

  function autofillPlan() {
    rememberCurrentPlan();
    const filledSelections = autofillSelections(selections, priorCourses, lockedSelections);
    setSelections(filledSelections);
    setLockedSelections((current) => sanitizeLockedSelections(current, filledSelections));
    setAutofillMessage("Autofill updated every unlocked course while preserving locks and elective formats.");
  }

  function savePlanAsJson() {
    const savedAt = new Date();
    const fileName = planFileName(studentName, savedAt);
    const contents = JSON.stringify(exportedPlan(studentName, selections, lockedSelections, priorCourses, priorCourseGrades, diplomaType, eligibilityChecks, grade, isOverview, savedAt), null, 2);
    const url = window.URL.createObjectURL(new Blob([contents], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  }

  function savePlanAsPdf() {
    if (!planFileStem(studentName)) {
      setNameError("Enter your name before saving the plan as a PDF.");
      nameInputRef.current?.focus();
      return;
    }

    setNameError("");
    const savedAt = new Date();
    const planData = exportedPlan(studentName, selections, lockedSelections, priorCourses, priorCourseGrades, diplomaType, eligibilityChecks, grade, isOverview, savedAt);
    const url = window.URL.createObjectURL(createRecoverablePdf(planData));
    const link = document.createElement("a");
    link.href = url;
    link.download = pdfFileName(studentName, savedAt);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  }

  async function loadPlanFromFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const contents = await importedJsonFromFile(file);
      let parsed: unknown;
      try {
        parsed = JSON.parse(contents);
      } catch {
        throw new Error("The selected file does not contain readable planner data.");
      }
      const imported = parseImportedPlan(parsed);
      rememberCurrentPlan();
      setStudentName(imported.plan.studentName);
      setSelections(imported.plan.selections);
      setLockedSelections(imported.plan.lockedSelections);
      setPriorCourses(imported.plan.priorCourses);
      setPriorCourseGrades(imported.plan.priorCourseGrades);
      setDiplomaType(imported.plan.diplomaType);
      setEligibilityChecks(imported.plan.eligibilityChecks);
      const gradeMatch = imported.activeView.match(/^grade-(7|8|9|10|11|12)$/);
      if (imported.activeView === "overview") setIsOverview(true);
      else {
        setGrade((gradeMatch?.[1] as Grade | undefined) ?? "7");
        setIsOverview(false);
      }
      setLoadMessage({ kind: "success", text: `${file.name} loaded. You can now edit the plan.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The selected file could not be loaded.";
      setLoadMessage({ kind: "error", text: message });
    }
  }

  function resetGrades() {
    if (!window.confirm("Clear every entered grade? Course selections, elective formats, locks, and checklist answers will stay in place.")) return;

    rememberCurrentPlan();
    setSelections((current) => {
      const next = structuredClone(current);
      for (const planGrade of gradeOrder) {
        for (const [slotId, value] of Object.entries(next[planGrade])) {
          next[planGrade][slotId] = { ...value, primaryGrade: "", secondaryGrade: "" };
        }
      }
      return next;
    });
    setPriorCourseGrades({});
  }

  function resetPlan() {
    if (!window.confirm("Reset the entire course plan? This clears all course selections, grades, locks, and checklist answers saved on this device.")) return;

    rememberCurrentPlan();
    window.localStorage.removeItem("fcps-course-plan-v2");
    window.localStorage.removeItem("rcms-course-plan-v1");
    setSelections(emptySelections());
    setLockedSelections({});
    setPriorCourses([]);
    setPriorCourseGrades({});
    setDiplomaType("advanced");
    setEligibilityChecks({});
    setGrade("7");
    setIsOverview(false);
  }

  return (
    <main>
      <header className="page-header">
        <div className="plan-file-controls">
          <label className={`plan-name-field${nameError ? " plan-name-field-error" : ""}`}>
            <span>Name for saved file</span>
            <input
              ref={nameInputRef}
              type="text"
              value={studentName}
              autoComplete="name"
              placeholder="e.g., eric"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "plan-name-error" : undefined}
              onChange={(event) => {
                setStudentName(event.target.value);
                if (planFileStem(event.target.value)) setNameError("");
              }}
            />
            {nameError && <span className="plan-name-error" id="plan-name-error" role="alert">{nameError}</span>}
          </label>
          <button type="button" className="undo-button" disabled={!undoStack.length} onClick={undoLastChange}>Undo</button>
          <button type="button" className="json-save-button" disabled={!planFileStem(studentName)} onClick={savePlanAsJson}>Save plan as JSON</button>
          <button type="button" className="print-button" onClick={savePlanAsPdf}>Save plan as PDF</button>
          <input ref={loadInputRef} className="sr-only" type="file" accept=".json,.pdf,application/json,application/pdf" onChange={loadPlanFromFile} />
          <button type="button" className="load-button" onClick={() => loadInputRef.current?.click()}>Load plan</button>
          {loadMessage && <p className={`load-message load-message-${loadMessage.kind}`} role="status">{loadMessage.text}</p>}
        </div>
        <p className="eyebrow">Rachel Carson Middle School → Skyview High School</p>
        <h1>Course Planner</h1>
        <p className="intro">Plan an FCPS course path from grade 7 through grade 12.</p>
      </header>

      <section className="planner" aria-labelledby="planner-title">
        <div className="toolbar">
          <div className="grade-groups">
            <div className="grade-group">
              <span className="toolbar-label">Middle School</span>
              <div className="grade-tabs" aria-label="Choose a middle school grade">
                {(["7", "8"] as Grade[]).map((item) => (
                  <button key={item} type="button" className={!isOverview && grade === item ? "active" : ""} aria-pressed={!isOverview && grade === item} onClick={() => { setGrade(item); setIsOverview(false); }}>Grade {item}</button>
                ))}
              </div>
            </div>
            <div className="grade-group">
              <span className="toolbar-label">High School</span>
              <div className="grade-tabs" aria-label="Choose a high school grade or view the full plan">
                {(["9", "10", "11", "12"] as Grade[]).map((item) => (
                  <button key={item} type="button" className={!isOverview && grade === item ? "active" : ""} aria-pressed={!isOverview && grade === item} onClick={() => { setGrade(item); setIsOverview(false); }}>Grade {item}</button>
                ))}
                <button type="button" className={isOverview ? "active" : ""} aria-pressed={isOverview} onClick={() => setIsOverview(true)}>Overview</button>
              </div>
            </div>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="autofill-button" onClick={autofillPlan}>Autofill highest-GPA path</button>
            <button type="button" className="reset-grades-button" disabled={!hasEnteredGrades} onClick={resetGrades}>Reset grades</button>
            <button type="button" className="reset-button" onClick={resetPlan}>Reset plan</button>
          </div>
        </div>
        <div className="autofill-guidance">
          <p>Autofill chooses the highest-weight available course sequence, continues prerequisites and electives, and never changes elective formats. Lock any course you want it to keep.</p>
          {autofillMessage && <p className="autofill-message" role="status">{autofillMessage}</p>}
        </div>

        {isOverview ? (
          <PlanOverview
            selections={selections}
            priorCourses={priorCourses}
            priorCourseGrades={priorCourseGrades}
            onEditGrade={(item) => { setGrade(item); setIsOverview(false); }}
          />
        ) : <>
        <div className="grade-context">
          <p className="grade-note" id="planner-title">{plan.note}</p>
          <SourceLinks items={sourcesForGrade(grade)} label={`Grade ${grade} sources`} />
        </div>

        <section className="gpa-panel" aria-labelledby="gpa-title">
          <p className="section-label" id="gpa-title">Estimated grade {grade} GPA</p>
          <div className="gpa-values" aria-live="polite">
            <div className="gpa-metric">
              <span>Unweighted</span>
              <strong>{unweightedGpa.value === null ? "—" : unweightedGpa.value.toFixed(2)}</strong>
              <div className="gpa-bar" role="progressbar" aria-label="Unweighted GPA on a 4.0 scale" aria-valuemin={0} aria-valuemax={4} aria-valuenow={unweightedGpa.value ?? 0}>
                <span style={{ width: `${Math.min(100, ((unweightedGpa.value ?? 0) / 4) * 100)}%` }} />
              </div>
            </div>
            <div className="gpa-metric">
              <span>Weighted</span>
              <strong>{weightedGpa.value === null ? "—" : weightedGpa.value.toFixed(2)}</strong>
              <div className="gpa-bar gpa-bar-weighted" role="progressbar" aria-label="Weighted GPA on a 5.0 planning scale" aria-valuemin={0} aria-valuemax={5} aria-valuenow={weightedGpa.value ?? 0}>
                <span style={{ width: `${Math.min(100, ((weightedGpa.value ?? 0) / 5) * 100)}%` }} />
              </div>
            </div>
          </div>
          <p className="gpa-detail">{unweightedGpa.courseCount ? `${unweightedGpa.courseCount} graded ${unweightedGpa.courseCount === 1 ? "course" : "courses"} • ${unweightedGpa.credits} ${unweightedGpa.credits === 1 ? "credit" : "credits"}` : "Choose courses and add grades below."}</p>
          <p className="gpa-note">Weighted GPA adds the configured Honors, AP, or Dual Enrollment weight. Semester courses count as half a full-year course. These planning estimates are not official transcript GPAs.</p>
          <SourceLinks items={[sources.courseCatalogs, sources.dualEnrollment]} />
        </section>

        <section className="graduation-panel" aria-labelledby="graduation-title">
          <div className="graduation-heading">
            <div>
              <p className="section-label" id="graduation-title">FCPS graduation credit check</p>
              <p className="graduation-total"><strong>{creditSummary.total}</strong> of {requiredCreditTotal} planned credits</p>
            </div>
            <label className="diploma-field">
              <span>Diploma</span>
              <select value={diplomaType} onChange={(event) => changeDiplomaType(event.target.value as DiplomaType)}>
                <option value="advanced">Advanced Studies</option>
                <option value="standard">Standard</option>
              </select>
            </label>
          </div>
          <details className="requirements-disclosure">
            <summary>View requirement table</summary>
            <div className="requirements-table-wrap">
              <table className="requirements-table">
                <thead><tr><th scope="col">Requirement</th><th scope="col">Planned</th><th scope="col">Needed</th></tr></thead>
                <tbody>
                  {requirementRows.map((row) => (
                    <tr key={row.id} className={row.planned >= row.required ? "met" : "short"}>
                      <th scope="row">{row.label}</th>
                      <td>{row.planned}</td>
                      <td>{row.required}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="graduation-note">Planning estimate only. FCPS also applies verified-credit, world-language sequence, advanced-course or credential, CPR/AED, virtual-course, and other diploma rules that this chart cannot fully verify.</p>
          <SourceLinks items={[sources.graduation]} />
        </section>

        <details className="plan-warnings">
          <summary>Plan checks ({planCheckCount})</summary>
          {issues.length ? <ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p>No issues found in the choices entered so far.</p>}
          {confirmations.length > 0 && (
            <section className="plan-confirmations" aria-labelledby="plan-confirmations-title">
              <h3 id="plan-confirmations-title">Confirm with counselor or college</h3>
              <p>These are reminders to verify—not signs that the plan is wrong.</p>
              <ul>{confirmations.map((confirmation) => <li key={confirmation}>{confirmation}</li>)}</ul>
            </section>
          )}
          <SourceLinks items={[...sourcesForGrade(grade), sources.courseCatalogs, sources.graduation, sources.dualEnrollmentAdmissions]} />
        </details>

        {plan.usesElectiveFormats && <fieldset className="elective-format">
          <legend>Elective format</legend>
          <div className="format-options">
            {electiveFormats.map((format) => (
              <label key={format.id} className={electiveFormat === format.id ? "selected" : ""}>
                <input
                  type="radio"
                  name={`elective-format-${grade}`}
                  value={format.id}
                  checked={electiveFormat === format.id}
                  onChange={() => changeElectiveFormat(format.id)}
                />
                <span><strong>{format.label}</strong><small>{format.detail}</small></span>
              </label>
            ))}
          </div>
          <SourceLinks items={grade === "7" ? [sources.carsonBooklet, sources.carsonGrade7] : [sources.carsonBooklet, sources.carsonGrade8]} />
        </fieldset>}

        {grade === "7" && (
          <details className="prior-courses">
            <summary>Courses completed before grade 7</summary>
            <div className="prior-content">
              <p>Record sixth-grade, summer, transfer, or independently completed work. These checks unlock defined prerequisites and courses shown earlier than their typical grade; normal grade-level open-enrollment choices remain available without them.</p>
              <div className="prior-groups">
                {priorCourseGroups.map((group) => (
                  <fieldset className="prior-group" key={group.label}>
                    <legend>{group.label}</legend>
                    <div className="check-grid">
                      {group.courses.map((item) => {
                        const selected = priorCourses.includes(item.id);
                        const receivesGrade = priorCourseReceivesGrade(item);
                        const creditLabel = collegeCreditDetails[item.id] ? "College + HS credit" : item.highSchoolCredit ? "HS credit" : "";
                        return (
                          <div className="prior-course-entry" key={item.id}>
                            <label className="prior-course-check">
                              <input type="checkbox" checked={selected} onChange={() => togglePriorCourse(item.id)} />
                              <span>{item.label}{creditLabel && <small>{creditLabel}</small>}</span>
                            </label>
                            {selected && receivesGrade && (
                              <label className="prior-grade-field">
                                <span>Grade for {item.label}</span>
                                <select value={priorCourseGrades[item.id] ?? ""} onChange={(event) => updatePriorCourseGrade(item.id, event.target.value as GradeMark | "")}>
                                  <option value="">No grade entered</option>
                                  <GradeOptions />
                                </select>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
              <SourceLinks items={[sources.middleMath, sources.mathSequence, sources.courseCatalogs]} />
            </div>
          </details>
        )}

        <section className="course-grid" aria-label={`Grade ${grade} course choices`}>
            {plan.slots.map((slot) => {
              const value = gradeSelections[slot.id] ?? emptySelection();
              const options = slot.kind === "core" ? slot.courses : value.mode === "yearlong" ? slot.yearlong : slot.semester;
              const hasLockedOptions = options.some((item) => !isAvailable(item, grade, selections, priorCourses));

              return (
                <div className="course-column" key={slot.id}>
                  <h2>{slot.label}</h2>
                  <div className="course-choice">
                    {slot.kind === "core" ? (
                      <div className="course-grade-fields">
                        <div className="picker-lock-row">
                          <CoursePicker
                            courses={slot.courses}
                            grade={grade}
                            selections={selections}
                            priorCourses={priorCourses}
                            value={value.primary}
                            label={`Choose ${slot.label} for grade ${grade}`}
                            visibleLabel={false}
                            onChange={(courseId) => updateSelection(slot.id, { primary: courseId, primaryGrade: "" })}
                          />
                          <SelectionLockButton
                            locked={Boolean(lockedSelections[selectionLockKey(grade, slot.id, "primary")])}
                            disabled={!value.primary}
                            label={`${slot.label} for grade ${grade}`}
                            onToggle={() => toggleSelectionLock(slot.id, "primary")}
                          />
                        </div>
                        <CourseSupport grade={grade} courseId={value.primary} subject={slot.label} highSchoolCredits={1} eligibilityChecks={eligibilityChecks} onToggleEligibility={toggleEligibility} />
                        <label className="grade-field"><span>Grade</span><select value={value.primaryGrade ?? ""} disabled={!value.primary} onChange={(event) => updateSelection(slot.id, { primaryGrade: event.target.value as GradeMark | "" })}><option value="">No grade</option><GradeOptions /></select></label>
                      </div>
                    ) : (
                      <div className="elective-fields">
                        <div className="elective-course">
                          <div className="picker-lock-row">
                            <CoursePicker
                              courses={options}
                              grade={grade}
                              selections={selections}
                              priorCourses={priorCourses}
                              value={value.primary}
                              label={value.mode === "yearlong" ? "Course" : "Fall semester"}
                              blockedFamilyIds={electiveFamilyIdsExcept(electiveSlots, gradeSelections, slot.id, "primary")}
                              onChange={(courseId) => updateSelection(slot.id, { primary: courseId, primaryGrade: "" })}
                            />
                            <SelectionLockButton
                              locked={Boolean(lockedSelections[selectionLockKey(grade, slot.id, "primary")])}
                              disabled={!value.primary}
                              label={`${slot.label} ${value.mode === "yearlong" ? "course" : "fall semester"} for grade ${grade}`}
                              onToggle={() => toggleSelectionLock(slot.id, "primary")}
                            />
                          </div>
                          <CourseSupport grade={grade} courseId={value.primary} subject={slot.label} highSchoolCredits={value.mode === "semester" ? 0.5 : 1} eligibilityChecks={eligibilityChecks} onToggleEligibility={toggleEligibility} />
                          <label className="grade-field"><span>{value.mode === "yearlong" ? "Grade" : "Fall grade"}</span><select value={value.primaryGrade ?? ""} disabled={!value.primary} onChange={(event) => updateSelection(slot.id, { primaryGrade: event.target.value as GradeMark | "" })}><option value="">No grade</option><GradeOptions /></select></label>
                        </div>
                        {value.mode === "semester" && <div className="elective-course">
                          <div className="picker-lock-row">
                            <CoursePicker
                              courses={slot.semester}
                              grade={grade}
                              selections={selections}
                              priorCourses={priorCourses}
                              value={value.secondary}
                              label="Spring semester"
                              additionalCompleted={completedInFall}
                              blockedFamilyIds={electiveFamilyIdsExcept(electiveSlots, gradeSelections, slot.id, "secondary")}
                              onChange={(courseId) => updateSelection(slot.id, { secondary: courseId, secondaryGrade: "" })}
                            />
                            <SelectionLockButton
                              locked={Boolean(lockedSelections[selectionLockKey(grade, slot.id, "secondary")])}
                              disabled={!value.secondary}
                              label={`${slot.label} spring semester for grade ${grade}`}
                              onToggle={() => toggleSelectionLock(slot.id, "secondary")}
                            />
                          </div>
                          <CourseSupport grade={grade} courseId={value.secondary} subject={slot.label} highSchoolCredits={0.5} eligibilityChecks={eligibilityChecks} onToggleEligibility={toggleEligibility} />
                          <label className="grade-field"><span>Spring grade</span><select value={value.secondaryGrade ?? ""} disabled={!value.secondary} onChange={(event) => updateSelection(slot.id, { secondaryGrade: event.target.value as GradeMark | "" })}><option value="">No grade</option><GradeOptions /></select></label>
                        </div>}
                      </div>
                    )}
                    {hasLockedOptions && <p className="locked-note">Unavailable options show placement or prerequisite requirements.</p>}
                  </div>
                </div>
              );
            })}
        </section>
        </>}
      </section>

      <PrintPlan
        studentName={studentName}
        selections={selections}
        priorCourses={priorCourses}
        priorCourseGrades={priorCourseGrades}
        diplomaType={diplomaType}
      />

      <footer>
        <p>Planning aid only. Final courses depend on school offerings, enrollment, prerequisites, graduation requirements, and counselor review.</p>
        <SourceLinks items={allSources} label="All official sources" />
      </footer>
    </main>
  );
}
