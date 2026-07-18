import { useEffect, useMemo, useState } from "react";

type Grade = "6" | "7" | "8";
type Mode = "yearlong" | "semester";

type Course = {
  id: string;
  label: string;
  highSchoolCredit?: boolean;
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

type Selection = {
  mode: Mode;
  primary: string;
  secondary: string;
};

type Selections = Record<Grade, Record<string, Selection>>;

const course = (id: string, label: string, extra: Omit<Course, "id" | "label"> = {}): Course => ({ id, label, ...extra });
const requires = (anyOf: string[], label: string) => ({ prerequisite: { anyOf, label } });

const semesterElectives = [
  course("art-foundations", "Art Foundations"),
  course("3d-art", "3D Art Exploration"),
  course("computers-art", "Computers in Art"),
  course("theatre", "Theatre Arts Appreciation"),
  course("technical-theatre", "Technical Theatre Appreciation"),
  course("creative-writing", "Creative Writing"),
  course("computer-solutions", "Computer Solutions"),
  course("coding", "Coding & Innovative Technologies"),
  course("engineering1", "Engineering 1"),
  course("engineering2", "Engineering 2", requires(["engineering1"], "Engineering 1")),
  course("facs", "Family & Consumer Sciences"),
  course("career-investigations", "Career Investigations"),
];

const performingArts = [
  course("beginning-band", "Beginning Band"),
  course("advanced-band", "Advanced Band"),
  course("beginning-orchestra", "Beginning Orchestra"),
  course("intermediate-orchestra", "Intermediate Orchestra"),
  course("chorus", "Chorus"),
  course("yearbook", "Literary Arts: Yearbook"),
];

const languages7 = [
  course("spanish1a", "Spanish 1 Part A", { highSchoolCredit: true }),
  course("spanish1", "Spanish 1", { highSchoolCredit: true }),
  course("spanish1b", "Spanish 1 Part B", { highSchoolCredit: true, ...requires(["spanish1a"], "Spanish 1 Part A") }),
  course("spanish2", "Spanish 2", { highSchoolCredit: true, ...requires(["spanish1", "spanish1b"], "Spanish 1 or Part B") }),
  course("french1a", "French 1 Part A", { highSchoolCredit: true }),
  course("french1", "French 1", { highSchoolCredit: true }),
  course("french1b", "French 1 Part B", { highSchoolCredit: true, ...requires(["french1a"], "French 1 Part A") }),
  course("french2", "French 2", { highSchoolCredit: true, ...requires(["french1", "french1b"], "French 1 or Part B") }),
  course("latin1", "Latin 1", { highSchoolCredit: true }),
  course("latin2", "Latin 2", { highSchoolCredit: true, ...requires(["latin1"], "Latin 1") }),
  course("arabic1a", "Arabic 1 Part A", { highSchoolCredit: true }),
  course("arabic1", "Arabic 1", { highSchoolCredit: true }),
  course("arabic2", "Arabic 2", { highSchoolCredit: true, ...requires(["arabic1"], "Arabic 1") }),
  course("japanese1a", "Japanese 1 Part A", { highSchoolCredit: true }),
  course("japanese1", "Japanese 1", { highSchoolCredit: true }),
  course("japanese2", "Japanese 2", { highSchoolCredit: true, ...requires(["japanese1"], "Japanese 1") }),
];

const languages8 = [
  ...languages7,
  course("spanish3", "Spanish 3", { highSchoolCredit: true, ...requires(["spanish2"], "Spanish 2") }),
  course("french3", "French 3", { highSchoolCredit: true, ...requires(["french2"], "French 2") }),
  course("latin3", "Latin 3", { highSchoolCredit: true, ...requires(["latin2"], "Latin 2") }),
];

const grade6Electives = [
  ...performingArts,
  course("technology", "Technology & Engineering"),
  course("world-language-exploration", "World Language Exploration"),
  course("spanish1a", "Spanish 1 Part A", { highSchoolCredit: true }),
  course("spanish1", "Spanish 1", { highSchoolCredit: true }),
  course("french1a", "French 1 Part A", { highSchoolCredit: true }),
  course("french1", "French 1", { highSchoolCredit: true }),
  course("latin1", "Latin 1", { highSchoolCredit: true }),
  course("arabic1", "Arabic 1", { highSchoolCredit: true }),
  course("japanese1", "Japanese 1", { highSchoolCredit: true }),
];

const plans: Record<Grade, { note: string; slots: Slot[] }> = {
  "6": {
    note: "Grade 6 schedules vary by school. Use this chart when your school asks students to choose sixth-grade courses.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [course("english6", "English 6"), course("english6-aap", "Advanced Academic Language Arts 6")] },
      { id: "math", label: "Math", kind: "core", courses: [course("math6", "Math 6"), course("advancedmath6", "Advanced Math 6"), course("algebra1h", "Algebra 1 Honors", { highSchoolCredit: true })] },
      { id: "science", label: "Science", kind: "core", courses: [course("science6", "Science 6"), course("science6-aap", "Advanced Academic Science 6")] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("social6", "Social Studies 6"), course("social6-aap", "Advanced Academic Social Studies 6")] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: [course("hpe6", "Health & Physical Education 6")] },
      { id: "elective-1", label: "Elective / Special 1", kind: "elective", yearlong: grade6Electives, semester: semesterElectives },
      { id: "elective-2", label: "Elective / Special 2", kind: "elective", yearlong: grade6Electives, semester: semesterElectives },
    ],
  },
  "7": {
    note: "Choose five required subjects and two elective periods. Locked courses become available when their prerequisite is present in grade 6 or in the prior-course list below.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [course("english7", "English 7"), course("english7h", "English 7 Honors")] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("math7", "Math 7"),
        course("prealgebra", "Pre-Algebra"),
        course("prealgebrah", "Pre-Algebra Honors"),
        course("algebra1h", "Algebra 1 Honors", { highSchoolCredit: true, ...requires(["advancedmath6"], "Advanced Math 6") }),
        course("geometryh", "Geometry Honors", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("algebra2h", "Algebra 2 Honors", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [course("life-science", "Life Science"), course("life-scienceh", "Life Science Honors")] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("history7", "U.S. History 7"), course("history7h", "U.S. History 7 Honors")] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: [course("hpe7", "Health & PE 7")] },
      { id: "elective-1", label: "Elective Period 1", kind: "elective", yearlong: [...performingArts, ...languages7, course("avid7", "AVID 7")], semester: semesterElectives },
      { id: "elective-2", label: "Elective Period 2", kind: "elective", yearlong: [...performingArts, ...languages7, course("avid7", "AVID 7")], semester: semesterElectives },
    ],
  },
  "8": {
    note: "Choose five required subjects and two elective periods. A course with a prerequisite must follow the matching course in the grade 7 chart.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: [course("english8", "English 8"), course("english8h", "English 8 Honors")] },
      { id: "math", label: "Math", kind: "core", courses: [
        course("prealgebra", "Pre-Algebra"),
        course("algebra1", "Algebra 1", { highSchoolCredit: true, ...requires(["math7", "prealgebra", "prealgebrah"], "Math 7 or Pre-Algebra") }),
        course("algebra1h", "Algebra 1 Honors", { highSchoolCredit: true, ...requires(["math7", "prealgebra", "prealgebrah"], "Math 7 or Pre-Algebra") }),
        course("geometryh", "Geometry Honors", { highSchoolCredit: true, ...requires(["algebra1", "algebra1h"], "Algebra 1") }),
        course("algebra2h", "Algebra 2 Honors", { highSchoolCredit: true, ...requires(["geometry", "geometryh"], "Geometry") }),
      ] },
      { id: "science", label: "Science", kind: "core", courses: [course("physical-science", "Physical Science"), course("physical-scienceh", "Physical Science Honors")] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: [course("civics", "Civics & Economics"), course("civicsh", "Civics & Economics Honors")] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: [course("hpe8", "Health & PE 8")] },
      { id: "elective-1", label: "Elective Period 1", kind: "elective", yearlong: [...performingArts, ...languages8, course("avid8", "AVID 8")], semester: [...semesterElectives, course("engineering3", "Engineering 3", requires(["engineering2"], "Engineering 2")), course("yoga", "Yoga for Wellness")] },
      { id: "elective-2", label: "Elective Period 2", kind: "elective", yearlong: [...performingArts, ...languages8, course("avid8", "AVID 8")], semester: [...semesterElectives, course("engineering3", "Engineering 3", requires(["engineering2"], "Engineering 2")), course("yoga", "Yoga for Wellness")] },
    ],
  },
};

const priorCourseChoices = [
  course("advancedmath6", "Advanced Math 6"),
  course("algebra1", "Algebra 1"),
  course("algebra1h", "Algebra 1 Honors"),
  course("geometry", "Geometry"),
  course("geometryh", "Geometry Honors"),
  course("spanish1a", "Spanish 1 Part A"),
  course("spanish1", "Spanish 1"),
  course("spanish1b", "Spanish 1 Part B"),
  course("french1a", "French 1 Part A"),
  course("french1", "French 1"),
  course("french1b", "French 1 Part B"),
  course("latin1", "Latin 1"),
  course("arabic1", "Arabic 1"),
  course("japanese1", "Japanese 1"),
];

const emptySelections = (): Selections => ({ "6": {}, "7": {}, "8": {} });

function selectedCourseIds(grade: Grade, selections: Selections) {
  return new Set(Object.values(selections[grade]).flatMap((value) => [value.primary, value.secondary]).filter(Boolean));
}

function prerequisitesFor(grade: Grade, selections: Selections, priorCourses: string[]) {
  if (grade === "6") return new Set<string>();
  if (grade === "7") return new Set([...selectedCourseIds("6", selections), ...priorCourses]);
  return selectedCourseIds("7", selections);
}

function isAvailable(item: Course, grade: Grade, selections: Selections, priorCourses: string[]) {
  if (!item.prerequisite) return true;
  const completed = prerequisitesFor(grade, selections, priorCourses);
  return item.prerequisite.anyOf.some((required) => completed.has(required));
}

function findCourse(grade: Grade, id: string) {
  for (const slot of plans[grade].slots) {
    const options = slot.kind === "core" ? slot.courses : [...slot.yearlong, ...slot.semester];
    const match = options.find((item) => item.id === id);
    if (match) return match;
  }
}

function sanitizeSelections(selections: Selections, priorCourses: string[]) {
  const next: Selections = structuredClone(selections);
  for (const grade of ["7", "8"] as Grade[]) {
    for (const [slotId, value] of Object.entries(next[grade])) {
      const primary = findCourse(grade, value.primary);
      const secondary = findCourse(grade, value.secondary);
      next[grade][slotId] = {
        ...value,
        primary: primary && isAvailable(primary, grade, next, priorCourses) ? value.primary : "",
        secondary: secondary && isAvailable(secondary, grade, next, priorCourses) ? value.secondary : "",
      };
    }
  }
  return next;
}

function CourseOptions({ courses, grade, selections, priorCourses }: { courses: Course[]; grade: Grade; selections: Selections; priorCourses: string[] }) {
  return courses.map((item) => {
    const available = isAvailable(item, grade, selections, priorCourses);
    const suffix = item.highSchoolCredit ? " • HS credit" : "";
    const locked = !available && item.prerequisite ? ` — requires ${item.prerequisite.label}` : "";
    return <option key={item.id} value={item.id} disabled={!available}>{item.label}{suffix}{locked}</option>;
  });
}

export default function App() {
  const [grade, setGrade] = useState<Grade>("7");
  const [selections, setSelections] = useState<Selections>(emptySelections);
  const [priorCourses, setPriorCourses] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fcps-course-plan-v3");
      if (saved) {
        const data = JSON.parse(saved) as { selections?: Selections; priorCourses?: string[] };
        setSelections(data.selections ?? emptySelections());
        setPriorCourses(data.priorCourses ?? []);
      }
    } catch {
      window.localStorage.removeItem("fcps-course-plan-v3");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("fcps-course-plan-v3", JSON.stringify({ selections, priorCourses }));
  }, [selections, priorCourses]);

  const plan = plans[grade];
  const gradeSelections = selections[grade] ?? {};
  const completeCount = useMemo(() => plan.slots.filter((slot) => {
    const value = gradeSelections[slot.id];
    if (!value?.primary) return false;
    return slot.kind === "core" || value.mode === "yearlong" || Boolean(value.secondary);
  }).length, [gradeSelections, plan.slots]);

  function updateSelection(slotId: string, patch: Partial<Selection>) {
    setSelections((current) => {
      const existing = current[grade]?.[slotId] ?? { mode: "yearlong" as Mode, primary: "", secondary: "" };
      const updated = {
        ...current,
        [grade]: { ...current[grade], [slotId]: { ...existing, ...patch } },
      };
      return sanitizeSelections(updated, priorCourses);
    });
  }

  function changeMode(slotId: string, mode: Mode) {
    updateSelection(slotId, { mode, primary: "", secondary: "" });
  }

  function togglePriorCourse(id: string) {
    const updated = priorCourses.includes(id) ? priorCourses.filter((item) => item !== id) : [...priorCourses, id];
    setPriorCourses(updated);
    setSelections((current) => sanitizeSelections(current, updated));
  }

  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Fairfax County Public Schools</p>
        <h1>Middle School Course Planner</h1>
        <p className="intro">Choose one course for every required slot. Later courses unlock when their prerequisite appears in the previous grade.</p>
      </header>

      <section className="planner" aria-labelledby="planner-title">
        <div className="toolbar">
          <div>
            <span className="toolbar-label">Grade</span>
            <div className="grade-tabs" aria-label="Choose a grade">
              {(["6", "7", "8"] as Grade[]).map((item) => (
                <button key={item} type="button" className={grade === item ? "active" : ""} aria-pressed={grade === item} onClick={() => setGrade(item)}>Grade {item}</button>
              ))}
            </div>
          </div>
          <div className="progress-text" aria-live="polite"><strong>{completeCount} of {plan.slots.length}</strong><span>slots complete</span></div>
        </div>

        <div className="progress-track" aria-hidden="true"><span style={{ width: `${(completeCount / plan.slots.length) * 100}%` }} /></div>
        <p className="grade-note" id="planner-title">{plan.note}</p>

        {grade === "7" && (
          <fieldset className="prior-courses">
            <legend>Courses completed before grade 7</legend>
            <p>Select any high-school-level or advanced courses already completed. These can satisfy grade 7 prerequisites when no grade 6 plan is available.</p>
            <div className="check-grid">
              {priorCourseChoices.map((item) => (
                <label key={item.id}><input type="checkbox" checked={priorCourses.includes(item.id)} onChange={() => togglePriorCourse(item.id)} /> {item.label}</label>
              ))}
            </div>
          </fieldset>
        )}

        <table>
          <caption className="sr-only">Editable course selections for grade {grade}</caption>
          <thead><tr><th scope="col">Slot</th><th scope="col">Requirement</th><th scope="col">Course choice</th></tr></thead>
          <tbody>
            {plan.slots.map((slot, index) => {
              const value = gradeSelections[slot.id] ?? { mode: "yearlong" as Mode, primary: "", secondary: "" };
              const isComplete = Boolean(value.primary) && (slot.kind === "core" || value.mode === "yearlong" || Boolean(value.secondary));
              const options = slot.kind === "core" ? slot.courses : value.mode === "yearlong" ? slot.yearlong : slot.semester;
              const hasLockedOptions = options.some((item) => !isAvailable(item, grade, selections, priorCourses));

              return (
                <tr key={slot.id} className={isComplete ? "complete" : ""}>
                  <td className="slot-number">{index + 1}</td>
                  <th scope="row">{slot.label}<span>{slot.kind === "core" ? "Required" : "Required elective slot"}</span></th>
                  <td>
                    {slot.kind === "core" ? (
                      <label>
                        <span className="sr-only">Choose {slot.label} for grade {grade}</span>
                        <select value={value.primary} onChange={(event) => updateSelection(slot.id, { primary: event.target.value })}>
                          <option value="">Select a course</option>
                          <CourseOptions courses={slot.courses} grade={grade} selections={selections} priorCourses={priorCourses} />
                        </select>
                      </label>
                    ) : (
                      <div className="elective-fields">
                        <label className="mode-field"><span>Length</span><select value={value.mode} onChange={(event) => changeMode(slot.id, event.target.value as Mode)}><option value="yearlong">One yearlong course</option><option value="semester">Two semester courses</option></select></label>
                        <label><span>{value.mode === "yearlong" ? "Course" : "Fall semester"}</span><select value={value.primary} onChange={(event) => updateSelection(slot.id, { primary: event.target.value })}><option value="">Select a course</option><CourseOptions courses={options} grade={grade} selections={selections} priorCourses={priorCourses} /></select></label>
                        {value.mode === "semester" && <label><span>Spring semester</span><select value={value.secondary} onChange={(event) => updateSelection(slot.id, { secondary: event.target.value })}><option value="">Select a course</option><CourseOptions courses={slot.semester} grade={grade} selections={selections} priorCourses={priorCourses} /></select></label>}
                      </div>
                    )}
                    {hasLockedOptions && <p className="locked-note">Locked options show the course required in grade {grade === "7" ? "6" : "7"}.</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <footer><p>Course offerings and placement rules vary by school. Confirm final choices with the student’s FCPS counselor.</p><a href="https://www.fcps.edu/academics/coursecatalogs" target="_blank" rel="noreferrer">Official FCPS course catalog</a></footer>
    </main>
  );
}
