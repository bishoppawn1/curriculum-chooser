import { useEffect, useState } from "react";

type Grade = "7" | "8" | "9" | "10" | "11" | "12";
type Mode = "yearlong" | "semester";
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
  prerequisite?: {
    anyOf: string[];
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
        course("algebra1h", "Algebra 1 HN — school placement only", { highSchoolCredit: true }),
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
      { id: "english", label: "English", kind: "core", courses: [course("english8", "English 8"), course("english8h", "English 8 HN"), course("english8aa", "English 8 AA — AAP Center")] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("algebra1", "Algebra 1", { highSchoolCredit: true }),
        course("algebra1h", "Algebra 1 Honors", { highSchoolCredit: true }),
        course("geometryh", "Geometry HN", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("algebra2h", "Algebra II HN", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [course("science8", "Science 8"), course("science8h", "Science 8 HN"), course("science8aa", "Science 8 AA — AAP Center")] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("civics", "Civics 8"), course("civicsh", "Civics 8 Honors"), course("civicsaa", "Civics 8 AA — AAP Center")] },
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
      { id: "english", label: "English", kind: "core", courses: [course("english9", "English 9", { highSchoolCredit: true }), course("english9h", "English 9 Honors", { highSchoolCredit: true })] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("algebra1", "Algebra 1", { highSchoolCredit: true }),
        course("algebra1h", "Algebra 1 Honors", { highSchoolCredit: true }),
        course("geometry", "Geometry", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("geometryh", "Geometry Honors", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("algebra2h", "Algebra 2 Honors", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [course("biology", "Biology", { highSchoolCredit: true }), course("biologyh", "Biology Honors", { highSchoolCredit: true })] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("world-history1", "World History & Geography 1", { highSchoolCredit: true }), course("world-history1h", "World History & Geography 1 Honors", { highSchoolCredit: true }), dualEnrollmentCourse("world-history1-de", "World History & Geography 1 DE")] },
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
      { id: "english", label: "English", kind: "core", courses: [course("english10", "English 10", { highSchoolCredit: true }), course("english10h", "English 10 Honors", { highSchoolCredit: true })] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("geometry", "Geometry", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("geometryh", "Geometry Honors", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("algebra2", "Algebra 2", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
        course("algebra2h", "Algebra 2 Honors", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
        course("precalculus", "Precalculus with Trigonometry", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        course("precalculus-h", "Precalculus Honors", { highSchoolCredit: true, ...requires(["algebra2", "algebra2h"], "Algebra 2") }),
        dualEnrollmentCourse("precalculus-de", "Precalculus with Trigonometry DE", requires(["algebra2", "algebra2h"], "Algebra 2 and college eligibility")),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [course("chemistry", "Chemistry", { highSchoolCredit: true }), course("chemistryh", "Chemistry Honors", { highSchoolCredit: true }), course("geosystems", "Geosystems", { highSchoolCredit: true })] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("world-history2", "World History & Geography 2", { highSchoolCredit: true }), course("world-history2h", "World History & Geography 2 Honors", { highSchoolCredit: true }), course("ap-world", "AP World History", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("world-history2-de", "World History & Geography 2 DE")] },
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
      { id: "english", label: "English", kind: "core", courses: [course("english11", "English 11", { highSchoolCredit: true }), course("english11h", "English 11 Honors", { highSchoolCredit: true }), course("ap-language", "AP English Language", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("english11-de", "English 11 DE Composition")] },
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
      { id: "science", label: "Science", kind: "core", courses: [course("physics", "Physics", { highSchoolCredit: true }), course("physicsh", "Physics Honors", { highSchoolCredit: true }), dualEnrollmentCourse("physics1-de", "Physics 1 DE"), course("ap-biology", "AP Biology", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("biology2-de", "Biology 2 DE", requires(["biology", "biologyh", "ap-biology"], "Biology and college eligibility")), course("ap-chemistry", "AP Chemistry", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("chemistry2-de", "Chemistry 2 DE", requires(["chemistry", "chemistryh", "ap-chemistry"], "Chemistry and college eligibility"))] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("us-history", "Virginia & U.S. History", { highSchoolCredit: true }), course("us-historyh", "Virginia & U.S. History Honors", { highSchoolCredit: true }), course("ap-us-history", "AP U.S. History", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("us-history-de", "Virginia & U.S. History DE")] },
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
      { id: "english", label: "English", kind: "core", courses: [course("english12", "English 12", { highSchoolCredit: true }), course("english12h", "English 12 Honors", { highSchoolCredit: true }), course("ap-literature", "AP English Literature", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("english12-de-composition", "English 12 DE Composition"), dualEnrollmentCourse("english12-de-literature", "English 12 DE Literature", requires(["english11-de", "english12-de-composition"], "DE Composition and college eligibility"))] },
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
      { id: "science", label: "Science", kind: "core", courses: [course("physics", "Physics", { highSchoolCredit: true }), course("ap-physics", "AP Physics", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("physics1-de", "Physics 1 DE"), course("environmental-science", "Environmental Science", { highSchoolCredit: true }), course("ap-environmental", "AP Environmental Science", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("environmental-science-de", "Environmental Science DE")] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("government", "Virginia & U.S. Government", { highSchoolCredit: true }), course("governmenth", "Virginia & U.S. Government Honors", { highSchoolCredit: true }), course("ap-government", "AP Government", { highSchoolCredit: true, gpaWeight: 1 }), dualEnrollmentCourse("government-de", "Virginia & U.S. Government DE")] },
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
  item.prerequisite?.anyOf.map((id) => courseById.get(id) ?? course(id, id)) ?? [],
));
const priorCourseChoices = uniqueCourses([course("advancedmath6", "Advanced Math 6"), ...prerequisiteIds]);

const emptySelections = (): Selections => ({ "7": {}, "8": {}, "9": {}, "10": {}, "11": {}, "12": {} });
const emptySelection = (mode: Mode = "yearlong"): Selection => ({ mode, primary: "", secondary: "", primaryGrade: "", secondaryGrade: "" });

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
  return "unavailable";
}

function isAvailable(item: Course, grade: Grade, selections: Selections, priorCourses: string[], additionalCompleted: string[] = []) {
  if (item.unavailableReason) return false;
  if (item.allowedGrades && !item.allowedGrades.includes(grade)) return false;
  if (!item.prerequisite) return true;
  const completed = prerequisitesFor(grade, selections, priorCourses);
  additionalCompleted.forEach((courseId) => completed.add(courseId));
  return item.prerequisite.anyOf.some((required) => completed.has(required));
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

function sanitizeSelections(selections: Selections, priorCourses: string[]) {
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
  }
  return next;
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
  highSchoolCredits,
  eligibilityChecks,
  onToggleEligibility,
}: {
  grade: Grade;
  courseId: string;
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
        </dl>
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

function planWarnings(diplomaType: DiplomaType, selections: Selections, eligibilityChecks: Record<string, boolean>) {
  const warnings: string[] = [];
  const requirements = graduationRequirements(diplomaType, selections);
  const missing = requirements.filter((row) => row.planned < row.required).map((row) => row.label);
  if (missing.length) warnings.push(`The current six-year plan is short in: ${missing.join(", ")}.`);

  const { entries } = plannedCreditTotals(selections);
  const duplicateNames = entries
    .filter((entry, index) => entries.findIndex((candidate) => candidate.courseId === entry.courseId) !== index)
    .map((entry) => entry.item.label);
  const duplicates = [...new Set(duplicateNames)];
  if (duplicates.length) warnings.push(`Repeated course selection: ${duplicates.join(", ")}. Confirm that repeat credit is allowed.`);

  const uncheckedEligibility = entries.filter((entry) => eligibilityForCourse(entry.item, entry.grade)
    .some((requirement) => !eligibilityChecks[eligibilityCheckId(entry.grade, entry.courseId, requirement.id)]));
  if (uncheckedEligibility.length) {
    const labels = [...new Set(uncheckedEligibility.map((entry) => entry.item.label))];
    warnings.push(`Eligibility still needs verification for: ${labels.join(", ")}.`);
  }

  const unconfirmed = entries.filter((entry) => ["unconfirmed", "future"].includes(availabilityDetails(entry.grade, entry.item).className));
  if (unconfirmed.length) warnings.push(`${unconfirmed.length} selected ${unconfirmed.length === 1 ? "course has" : "courses have"} unconfirmed Skyview availability.`);

  if (diplomaType === "advanced" && entries.length && !entries.some((entry) => courseWeightDetails(entry.item).designation !== "STANDARD")) {
    warnings.push("The Advanced Diploma plan does not yet include an Honors, AP, or DE course; FCPS requires an advanced course or another approved advanced-learning option.");
  }
  return warnings;
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

function CoursePicker({
  courses,
  grade,
  selections,
  priorCourses,
  value,
  label,
  visibleLabel = true,
  additionalCompleted = [],
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
            const available = family.courses.some((item) => isAvailable(item, grade, selections, priorCourses, additionalCompleted));
            const allDualEnrollment = family.courses.every((item) => courseWeightDetails(item).designation === "DE");
            const suffix = allDualEnrollment ? " • college credit" : family.courses.some((item) => item.highSchoolCredit) ? " • HS credit" : "";
            const reason = family.courses.map((item) => unavailableReasonFor(item, grade)).find(Boolean);
            return <option key={family.id} value={family.id} disabled={!available}>{family.label}{suffix}{available ? "" : ` — ${reason}`}</option>;
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

export default function App() {
  const [grade, setGrade] = useState<Grade>("7");
  const [selections, setSelections] = useState<Selections>(emptySelections);
  const [priorCourses, setPriorCourses] = useState<string[]>([]);
  const [diplomaType, setDiplomaType] = useState<DiplomaType>("advanced");
  const [eligibilityChecks, setEligibilityChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fcps-course-plan-v2") ?? window.localStorage.getItem("rcms-course-plan-v1");
      if (saved) {
        const data = JSON.parse(saved) as {
          selections?: Selections;
          priorCourses?: string[];
          diplomaType?: DiplomaType;
          eligibilityChecks?: Record<string, boolean>;
        };
        setSelections({ ...emptySelections(), ...(data.selections ?? {}) });
        setPriorCourses(data.priorCourses ?? []);
        setDiplomaType(data.diplomaType === "standard" ? "standard" : "advanced");
        setEligibilityChecks(data.eligibilityChecks ?? {});
      }
    } catch {
      window.localStorage.removeItem("fcps-course-plan-v2");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("fcps-course-plan-v2", JSON.stringify({ selections, priorCourses, diplomaType, eligibilityChecks }));
  }, [selections, priorCourses, diplomaType, eligibilityChecks]);

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
  const warnings = planWarnings(diplomaType, selections, eligibilityChecks);

  function updateSelection(slotId: string, patch: Partial<Selection>) {
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
    setPriorCourses(updated);
    setSelections((current) => sanitizeSelections(current, updated));
  }

  function toggleEligibility(checkId: string) {
    setEligibilityChecks((current) => ({ ...current, [checkId]: !current[checkId] }));
  }

  return (
    <main>
      <header className="page-header">
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
                  <button key={item} type="button" className={grade === item ? "active" : ""} aria-pressed={grade === item} onClick={() => setGrade(item)}>Grade {item}</button>
                ))}
              </div>
            </div>
            <div className="grade-group">
              <span className="toolbar-label">High School</span>
              <div className="grade-tabs" aria-label="Choose a high school grade">
                {(["9", "10", "11", "12"] as Grade[]).map((item) => (
                  <button key={item} type="button" className={grade === item ? "active" : ""} aria-pressed={grade === item} onClick={() => setGrade(item)}>Grade {item}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="grade-note" id="planner-title">{plan.note}</p>

        <section className="gpa-panel" aria-labelledby="gpa-title">
          <p className="section-label" id="gpa-title">Estimated grade {grade} GPA</p>
          <div className="gpa-values" aria-live="polite">
            <div className="gpa-metric">
              <span>Unweighted</span>
              <strong>{unweightedGpa.value === null ? "—" : unweightedGpa.value.toFixed(2)}</strong>
            </div>
            <div className="gpa-metric">
              <span>Weighted</span>
              <strong>{weightedGpa.value === null ? "—" : weightedGpa.value.toFixed(2)}</strong>
            </div>
          </div>
          <p className="gpa-detail">{unweightedGpa.courseCount ? `${unweightedGpa.courseCount} graded ${unweightedGpa.courseCount === 1 ? "course" : "courses"} • ${unweightedGpa.credits} ${unweightedGpa.credits === 1 ? "credit" : "credits"}` : "Choose courses and add grades below."}</p>
          <p className="gpa-note">Weighted GPA adds the configured Honors, AP, or Dual Enrollment weight. Semester courses count as half a full-year course. These planning estimates are not official transcript GPAs.</p>
        </section>

        <section className="graduation-panel" aria-labelledby="graduation-title">
          <div className="graduation-heading">
            <div>
              <p className="section-label" id="graduation-title">FCPS graduation credit check</p>
              <p className="graduation-total"><strong>{creditSummary.total}</strong> of {requiredCreditTotal} planned credits</p>
            </div>
            <label className="diploma-field">
              <span>Diploma</span>
              <select value={diplomaType} onChange={(event) => setDiplomaType(event.target.value as DiplomaType)}>
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
        </section>

        <details className="plan-warnings">
          <summary>Plan checks ({warnings.length})</summary>
          {warnings.length ? <ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p>No issues found in the choices entered so far.</p>}
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
        </fieldset>}

        {grade === "7" && (
          <details className="prior-courses">
            <summary>Courses completed before grade 7</summary>
            <div className="prior-content">
              <p>Record any sixth-grade, summer, transfer, or independently completed course that supports exceptional placement or satisfies a prerequisite.</p>
              <div className="check-grid">
                {priorCourseChoices.map((item) => (
                  <label key={item.id}><input type="checkbox" checked={priorCourses.includes(item.id)} onChange={() => togglePriorCourse(item.id)} /> {item.label}</label>
                ))}
              </div>
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
                        <CourseSupport grade={grade} courseId={value.primary} highSchoolCredits={1} eligibilityChecks={eligibilityChecks} onToggleEligibility={toggleEligibility} />
                        <label className="grade-field"><span>Grade</span><select value={value.primaryGrade ?? ""} disabled={!value.primary} onChange={(event) => updateSelection(slot.id, { primaryGrade: event.target.value as GradeMark | "" })}><option value="">No grade</option><GradeOptions /></select></label>
                      </div>
                    ) : (
                      <div className="elective-fields">
                        <div className="elective-course">
                          <CoursePicker
                            courses={options}
                            grade={grade}
                            selections={selections}
                            priorCourses={priorCourses}
                            value={value.primary}
                            label={value.mode === "yearlong" ? "Course" : "Fall semester"}
                            onChange={(courseId) => updateSelection(slot.id, { primary: courseId, primaryGrade: "" })}
                          />
                          <CourseSupport grade={grade} courseId={value.primary} highSchoolCredits={value.mode === "semester" ? 0.5 : 1} eligibilityChecks={eligibilityChecks} onToggleEligibility={toggleEligibility} />
                          <label className="grade-field"><span>{value.mode === "yearlong" ? "Grade" : "Fall grade"}</span><select value={value.primaryGrade ?? ""} disabled={!value.primary} onChange={(event) => updateSelection(slot.id, { primaryGrade: event.target.value as GradeMark | "" })}><option value="">No grade</option><GradeOptions /></select></label>
                        </div>
                        {value.mode === "semester" && <div className="elective-course">
                          <CoursePicker
                            courses={slot.semester}
                            grade={grade}
                            selections={selections}
                            priorCourses={priorCourses}
                            value={value.secondary}
                            label="Spring semester"
                            additionalCompleted={completedInFall}
                            onChange={(courseId) => updateSelection(slot.id, { secondary: courseId, secondaryGrade: "" })}
                          />
                          <CourseSupport grade={grade} courseId={value.secondary} highSchoolCredits={0.5} eligibilityChecks={eligibilityChecks} onToggleEligibility={toggleEligibility} />
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
      </section>

      <footer>
        <p>Planning aid only. Final courses depend on school offerings, enrollment, prerequisites, graduation requirements, and counselor review.</p>
        <a href={plan.school === "middle" ? "https://carsonms.fcps.edu/student-services/academic-advising-course-selection" : "https://skyviewhs.fcps.edu/student-services/course-selection-academic-advising"} target="_blank" rel="noreferrer">{plan.school === "middle" ? "Rachel Carson advising" : "Skyview advising"}</a>
      </footer>
    </main>
  );
}
