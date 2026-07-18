"use client";

import { useEffect, useMemo, useState } from "react";

type Grade = "6" | "7" | "8";
type Mode = "yearlong" | "semester";

type CoreSlot = {
  id: string;
  label: string;
  kind: "core";
  courses: string[];
};

type ElectiveSlot = {
  id: string;
  label: string;
  kind: "elective";
  yearlong: string[];
  semester: string[];
};

type Slot = CoreSlot | ElectiveSlot;

type Selection = {
  mode: Mode;
  primary: string;
  secondary: string;
};

type Selections = Record<Grade, Record<string, Selection>>;

const sharedSemesterElectives = [
  "Art Foundations",
  "3D Art Exploration",
  "Computers in Art",
  "Theatre Arts Appreciation",
  "Technical Theatre Appreciation",
  "Creative Writing",
  "Computer Solutions",
  "Coding & Innovative Technologies",
  "Engineering 1",
  "Engineering 2",
  "Family & Consumer Sciences",
  "Career Investigations",
];

const grade7Yearlong = [
  "Beginning Band",
  "Brass Ensemble",
  "Woodwind Ensemble",
  "Percussion Ensemble",
  "Advanced Band",
  "Beginning Orchestra",
  "Intermediate Orchestra",
  "Theatre Arts Appreciation",
  "Tenor Bass Chorus",
  "Intermediate Chorus",
  "French 1 Part A",
  "Arabic 1 Part A",
  "Japanese 1 Part A",
  "Latin 1",
  "Spanish 1 Part A",
  "Spanish Immersion 1",
  "Spanish for Heritage Speakers 1",
  "Literary Arts: Yearbook",
  "AVID 7",
];

const grade8Yearlong = [
  "Beginning Band",
  "Brass Ensemble",
  "Woodwind Ensemble",
  "Percussion Ensemble",
  "Advanced Band",
  "Beginning Orchestra",
  "Intermediate Orchestra",
  "Advanced Orchestra",
  "Theatre Arts Appreciation",
  "Advanced Theatre Arts Appreciation",
  "Tenor Bass Chorus",
  "Advanced Chorus",
  "French 1 or Part B",
  "Arabic 1 or Part B",
  "Japanese 1 or Part B",
  "Latin 1 or 2",
  "Spanish 1, Part B, or 2",
  "Spanish for Heritage Speakers 1 or 2",
  "Literary Arts: Yearbook",
  "AVID 8",
];

const grade6Electives = [
  "Art",
  "Band",
  "Chorus",
  "Orchestra",
  "Technology & Engineering",
  "Family & Consumer Sciences",
  "World Language Exploration",
  "School-assigned special",
];

const plans: Record<Grade, { note: string; slots: Slot[] }> = {
  "6": {
    note: "Grade 6 schedules vary by school. Most FCPS sixth graders are in elementary school, while some FCPS middle schools include grade 6.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: ["English 6", "Advanced Academic Language Arts 6"] },
      { id: "math", label: "Math", kind: "core", courses: ["Math 6", "Advanced Math 6"] },
      { id: "science", label: "Science", kind: "core", courses: ["Science 6", "Advanced Academic Science 6"] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: ["Social Studies 6", "Advanced Academic Social Studies 6"] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: ["Health & Physical Education 6"] },
      { id: "elective-1", label: "Elective / Special 1", kind: "elective", yearlong: grade6Electives, semester: grade6Electives },
      { id: "elective-2", label: "Elective / Special 2", kind: "elective", yearlong: grade6Electives, semester: grade6Electives },
    ],
  },
  "7": {
    note: "FCPS grade 7 uses five required subjects plus two elective periods. Each elective period can hold one yearlong course or two semester courses.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: ["English 7", "English 7 Honors"] },
      { id: "math", label: "Math", kind: "core", courses: ["Math 7", "Pre-Algebra", "Pre-Algebra Honors", "Algebra 1 Honors"] },
      { id: "science", label: "Science", kind: "core", courses: ["Life Science", "Life Science Honors"] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: ["U.S. History 7", "U.S. History 7 Honors"] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: ["Health & PE 7"] },
      { id: "elective-1", label: "Elective Period 1", kind: "elective", yearlong: grade7Yearlong, semester: sharedSemesterElectives },
      { id: "elective-2", label: "Elective Period 2", kind: "elective", yearlong: grade7Yearlong, semester: sharedSemesterElectives },
    ],
  },
  "8": {
    note: "FCPS grade 8 uses five required subjects plus two elective periods. Each elective period can hold one yearlong course or two semester courses.",
    slots: [
      { id: "english", label: "English", kind: "core", courses: ["English 8", "English 8 Honors"] },
      { id: "math", label: "Math", kind: "core", courses: ["Pre-Algebra", "Algebra 1", "Algebra 1 Honors", "Geometry Honors"] },
      { id: "science", label: "Science", kind: "core", courses: ["Physical Science", "Physical Science Honors"] },
      { id: "social-studies", label: "Social Studies", kind: "core", courses: ["Civics & Economics", "Civics & Economics Honors"] },
      { id: "health-pe", label: "Health & PE", kind: "core", courses: ["Health & PE 8"] },
      { id: "elective-1", label: "Elective Period 1", kind: "elective", yearlong: grade8Yearlong, semester: [...sharedSemesterElectives, "Engineering 3", "Yoga for Wellness"] },
      { id: "elective-2", label: "Elective Period 2", kind: "elective", yearlong: grade8Yearlong, semester: [...sharedSemesterElectives, "Engineering 3", "Yoga for Wellness"] },
    ],
  },
};

const emptySelections = (): Selections => ({ "6": {}, "7": {}, "8": {} });

export default function Home() {
  const [grade, setGrade] = useState<Grade>("7");
  const [selections, setSelections] = useState<Selections>(emptySelections);

  useEffect(() => {
    const saved = window.localStorage.getItem("fcps-course-plan");
    if (saved) {
      try {
        setSelections(JSON.parse(saved) as Selections);
      } catch {
        window.localStorage.removeItem("fcps-course-plan");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("fcps-course-plan", JSON.stringify(selections));
  }, [selections]);

  const plan = plans[grade];
  const gradeSelections = selections[grade] ?? {};

  const completeCount = useMemo(
    () => plan.slots.filter((slot) => {
      const value = gradeSelections[slot.id];
      if (!value?.primary) return false;
      return slot.kind === "core" || value.mode === "yearlong" || Boolean(value.secondary);
    }).length,
    [gradeSelections, plan.slots],
  );

  function updateSelection(slotId: string, patch: Partial<Selection>) {
    setSelections((current) => {
      const existing = current[grade]?.[slotId] ?? { mode: "yearlong" as Mode, primary: "", secondary: "" };
      return {
        ...current,
        [grade]: {
          ...current[grade],
          [slotId]: { ...existing, ...patch },
        },
      };
    });
  }

  function changeMode(slotId: string, mode: Mode) {
    updateSelection(slotId, { mode, primary: "", secondary: "" });
  }

  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Fairfax County Public Schools</p>
        <h1>Middle School Course Planner</h1>
        <p className="intro">Choose one course for every required slot. Your choices are saved on this device.</p>
      </header>

      <section className="planner" aria-labelledby="planner-title">
        <div className="toolbar">
          <div>
            <span className="toolbar-label">Grade</span>
            <div className="grade-tabs" aria-label="Choose a grade">
              {(["6", "7", "8"] as Grade[]).map((item) => (
                <button key={item} type="button" className={grade === item ? "active" : ""} aria-pressed={grade === item} onClick={() => setGrade(item)}>
                  Grade {item}
                </button>
              ))}
            </div>
          </div>
          <div className="progress-text" aria-live="polite">
            <strong>{completeCount} of {plan.slots.length}</strong>
            <span>slots complete</span>
          </div>
        </div>

        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${(completeCount / plan.slots.length) * 100}%` }} />
        </div>

        <p className="grade-note" id="planner-title">{plan.note}</p>

        <table>
          <caption className="sr-only">Editable course selections for grade {grade}</caption>
          <thead>
            <tr>
              <th scope="col">Slot</th>
              <th scope="col">Requirement</th>
              <th scope="col">Course choice</th>
            </tr>
          </thead>
          <tbody>
            {plan.slots.map((slot, index) => {
              const value = gradeSelections[slot.id] ?? { mode: "yearlong" as Mode, primary: "", secondary: "" };
              const isComplete = Boolean(value.primary) && (slot.kind === "core" || value.mode === "yearlong" || Boolean(value.secondary));

              return (
                <tr key={slot.id} className={isComplete ? "complete" : ""}>
                  <td data-label="Slot" className="slot-number">{index + 1}</td>
                  <th data-label="Requirement" scope="row">
                    {slot.label}
                    <span>{slot.kind === "core" ? "Required" : "Required elective slot"}</span>
                  </th>
                  <td data-label="Course choice">
                    {slot.kind === "core" ? (
                      <label>
                        <span className="sr-only">Choose {slot.label} for grade {grade}</span>
                        <select value={value.primary} onChange={(event) => updateSelection(slot.id, { primary: event.target.value })}>
                          <option value="">Select a course</option>
                          {slot.courses.map((course) => <option key={course} value={course}>{course}</option>)}
                        </select>
                      </label>
                    ) : (
                      <div className="elective-fields">
                        <label className="mode-field">
                          <span>Length</span>
                          <select value={value.mode} onChange={(event) => changeMode(slot.id, event.target.value as Mode)}>
                            <option value="yearlong">One yearlong course</option>
                            <option value="semester">Two semester courses</option>
                          </select>
                        </label>
                        <label>
                          <span>{value.mode === "yearlong" ? "Course" : "Fall semester"}</span>
                          <select value={value.primary} onChange={(event) => updateSelection(slot.id, { primary: event.target.value })}>
                            <option value="">Select a course</option>
                            {(value.mode === "yearlong" ? slot.yearlong : slot.semester).map((course) => <option key={course} value={course}>{course}</option>)}
                          </select>
                        </label>
                        {value.mode === "semester" && (
                          <label>
                            <span>Spring semester</span>
                            <select value={value.secondary} onChange={(event) => updateSelection(slot.id, { secondary: event.target.value })}>
                              <option value="">Select a course</option>
                              {slot.semester.map((course) => <option key={course} value={course}>{course}</option>)}
                            </select>
                          </label>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <footer>
        <p>Course names are based on FCPS 2026–27 middle-school selection materials. Availability, prerequisites, and support placements vary by school.</p>
        <a href="https://www.fcps.edu/academics/coursecatalogs" target="_blank" rel="noreferrer">Check the official FCPS course catalog</a>
      </footer>
    </main>
  );
}
