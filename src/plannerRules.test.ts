import { describe, expect, it } from "vitest";
import {
  autofillSelections,
  calculateGpa,
  calculateTranscriptGpa,
  canSelectCourse,
  createRecoverablePdf,
  exportDocumentTitle,
  graduationRequirements,
  pdfDocumentTitle,
  pdfFileName,
  planFileName,
  plannedCreditTotals,
  sanitizeSelections,
  selectionLockKey,
} from "./App";

type Selections = Parameters<typeof sanitizeSelections>[0];
type Selection = Selections["7"][string];

const emptySelections = (): Selections => ({
  "7": {},
  "8": {},
  "9": {},
  "10": {},
  "11": {},
  "12": {},
});

const selection = (
  primary: string,
  primaryGrade: Selection["primaryGrade"] = "",
  mode: Selection["mode"] = "yearlong",
  secondary = "",
  secondaryGrade: Selection["secondaryGrade"] = "",
): Selection => ({ mode, primary, secondary, primaryGrade, secondaryGrade });

describe("course availability and prerequisite chains", () => {
  it("unlocks placement-only grade 7 math from pre-grade-7 work", () => {
    const selections = emptySelections();
    expect(canSelectCourse("7", "algebra1h", selections)).toBe(false);
    expect(canSelectCourse("7", "algebra1h", selections, ["advancedmath6"])).toBe(true);
    expect(canSelectCourse("7", "geometryh", selections, ["algebra1h"])).toBe(true);
  });

  it("accepts prerequisites from any earlier grade instead of only the previous grade", () => {
    const selections = emptySelections();
    selections["7"].math = selection("precalculus");
    expect(canSelectCourse("12", "ap-calculus-bc", selections)).toBe(true);
  });

  it("enforces all required science prerequisite groups", () => {
    const selections = emptySelections();
    selections["9"].science = selection("biology");
    expect(canSelectCourse("10", "chemistry", selections)).toBe(false);
    selections["9"].math = selection("algebra1");
    expect(canSelectCourse("10", "chemistry", selections)).toBe(true);
  });

  it("keeps DE out of grade 9 and enforces its academic prerequisite", () => {
    const selections = emptySelections();
    expect(canSelectCourse("9", "precalculus-de", selections, ["algebra2"])).toBe(false);
    expect(canSelectCourse("10", "precalculus-de", selections)).toBe(false);
    expect(canSelectCourse("10", "precalculus-de", selections, ["algebra2"])).toBe(true);
  });

  it("preserves the higher DE math sequence", () => {
    const selections = emptySelections();
    expect(canSelectCourse("12", "multivariable-linear-algebra-de", selections)).toBe(false);
    expect(canSelectCourse("12", "multivariable-linear-algebra-de", selections, ["calculus12-de"])).toBe(true);
    expect(canSelectCourse("12", "differential-equations-de", selections, ["calculus12-de"])).toBe(false);
    expect(canSelectCourse("12", "differential-equations-de", selections, ["multivariable-linear-algebra-de"])).toBe(true);
  });
});

describe("selection sanitization", () => {
  it("clears a later course and its grade when an earlier prerequisite is removed", () => {
    const selections = emptySelections();
    selections["7"].math = selection("algebra1h", "A");
    selections["8"].math = selection("geometryh", "B+");

    const valid = sanitizeSelections(selections, ["advancedmath6"]);
    expect(valid["8"].math.primary).toBe("geometryh");

    valid["7"].math = selection("");
    const invalidated = sanitizeSelections(valid, []);
    expect(invalidated["8"].math.primary).toBe("");
    expect(invalidated["8"].math.primaryGrade).toBe("");
  });

  it("allows a fall elective to unlock a spring elective in either period", () => {
    const selections = emptySelections();
    selections["8"]["elective-1"] = selection("engineering1", "A", "semester");
    selections["8"]["elective-2"] = selection("career-investigations", "A", "semester", "engineering2", "A-");

    const sanitized = sanitizeSelections(selections, []);
    expect(sanitized["8"]["elective-2"].secondary).toBe("engineering2");

    sanitized["8"]["elective-1"] = selection("", "", "semester");
    const invalidated = sanitizeSelections(sanitized, []);
    expect(invalidated["8"]["elective-2"].secondary).toBe("");
    expect(invalidated["8"]["elective-2"].secondaryGrade).toBe("");
  });

  it("removes duplicate electives across periods", () => {
    const selections = emptySelections();
    selections["7"]["elective-1"] = selection("spanish1", "A");
    selections["7"]["elective-2"] = selection("spanish1", "B");
    const sanitized = sanitizeSelections(selections, []);
    expect(sanitized["7"]["elective-1"].primary).toBe("spanish1");
    expect(sanitized["7"]["elective-2"].primary).toBe("");
  });

  it("treats Standard and DE versions as the same elective family", () => {
    const selections = emptySelections();
    selections["10"]["elective-1"] = selection("computer-science", "A");
    selections["10"]["elective-2"] = selection("cs-programming-de", "A");
    const sanitized = sanitizeSelections(selections, []);
    expect(sanitized["10"]["elective-1"].primary).toBe("computer-science");
    expect(sanitized["10"]["elective-2"].primary).toBe("");
  });
});

describe("highest-GPA path autofill", () => {
  it("fills every primary course spot from an empty plan", () => {
    const filled = autofillSelections(emptySelections(), []);
    for (const grade of ["7", "8", "9", "10", "11", "12"] as const) {
      expect(Object.values(filled[grade])).toHaveLength(7);
      const emptySlots = Object.entries(filled[grade]).filter(([, value]) => !value.primary).map(([slotId]) => slotId);
      expect(emptySlots, `grade ${grade} empty slots`).toEqual([]);
    }
  });

  it("continues accelerated math from pre-grade-7 Geometry", () => {
    const filled = autofillSelections(emptySelections(), ["geometry"]);
    expect(filled["7"].math.primary).toBe("algebra2h");
    expect(filled["8"].math.primary).toBe("ap-precalculus");
    expect(filled["9"].math.primary).toBe("ap-calculus-ab");
  });

  it("keeps an elective interest and continues its next level", () => {
    const selections = emptySelections();
    selections["7"]["elective-1"] = selection("spanish1");
    const filled = autofillSelections(selections, []);
    expect(filled["7"]["elective-1"].primary).toBe("spanish1");
    expect(Object.values(filled["8"]).some((value) => value.primary === "spanish2")).toBe(true);
  });

  it("preserves locked choices and the selected elective format", () => {
    const selections = emptySelections();
    selections["7"]["elective-1"] = selection("", "", "yearlong");
    selections["7"]["elective-2"] = selection("", "", "semester");
    selections["10"].math = selection("discrete-mathematics");
    const locks = { [selectionLockKey("10", "math", "primary")]: true };

    const filled = autofillSelections(selections, ["geometry"], locks);
    expect(filled["10"].math.primary).toBe("discrete-mathematics");
    expect(filled["7"]["elective-1"].mode).toBe("yearlong");
    expect(filled["7"]["elective-2"].mode).toBe("semester");
    expect(filled["7"]["elective-2"].secondary).not.toBe("");
  });
});

describe("GPA calculations", () => {
  it("calculates full-year and half-credit grades with Honors/AP weighting", () => {
    const gradeSelections: Selections["12"] = {
      english: selection("ap-literature", "A"),
      math: selection("ap-statistics", "B"),
      "elective-1": selection("computer-science", "A", "semester", "art-high", "B"),
    };

    expect(calculateGpa("12", gradeSelections, "unweighted")).toEqual({ value: 3.5, credits: 3, courseCount: 4 });
    expect(calculateGpa("12", gradeSelections, "weighted").value).toBeCloseTo(4.1667, 4);
  });

  it("does not add weighting to a failing grade", () => {
    const result = calculateGpa("12", { english: selection("ap-literature", "F") }, "weighted");
    expect(result.value).toBe(0);
  });

  it("includes DE and prior high-school-credit work but excludes ordinary middle-school courses", () => {
    const selections = emptySelections();
    selections["7"].english = selection("english7h", "A");
    selections["7"]["elective-1"] = selection("spanish1", "A");
    selections["10"]["social-studies"] = selection("world-history2-de", "A");

    const unweighted = calculateTranscriptGpa(selections, "unweighted", ["algebra1h"], { algebra1h: "B" });
    const weighted = calculateTranscriptGpa(selections, "weighted", ["algebra1h"], { algebra1h: "B" });
    expect(unweighted).toEqual({ value: 11 / 3, credits: 3, courseCount: 3 });
    expect(weighted.value).toBeCloseTo(12.5 / 3, 6);
  });
});

describe("credits and diploma planning", () => {
  it("categorizes high-school credits and excludes placeholders", () => {
    const selections = emptySelections();
    selections["9"] = {
      english: selection("english9"),
      math: selection("algebra1"),
      science: selection("biology"),
      "social-studies": selection("world-history1"),
      "health-pe": selection("hpe9"),
      "elective-1": selection("spanish1"),
      "elective-2": selection("art-high"),
    };
    selections["11"].epf = selection("elective-placeholder11");

    const summary = plannedCreditTotals(selections);
    expect(summary.total).toBe(7);
    expect(summary.totals).toMatchObject({ english: 1, math: 1, science: 1, social: 1, healthPe: 1, worldLanguage: 1, fineArtsCte: 1 });
  });

  it("uses the correct Standard and Advanced Studies requirement totals", () => {
    const selections = emptySelections();
    const standard = graduationRequirements("standard", selections);
    const advanced = graduationRequirements("advanced", selections);
    expect(standard.reduce((sum, row) => sum + row.required, 0)).toBe(22);
    expect(advanced.reduce((sum, row) => sum + row.required, 0)).toBe(26);
  });
});

describe("saved filenames and recoverable PDF export", () => {
  const savedAt = new Date(2026, 6, 18, 14, 5, 9);

  it("sanitizes the student name and adds a timestamp", () => {
    expect(planFileName(" Éric Bishop ", savedAt)).toBe("Eric-Bishop-course-plan-2026-07-18_14-05-09.json");
    expect(pdfDocumentTitle(" Éric Bishop ", savedAt)).toBe("Eric-Bishop-fcps-course-plan-2026-07-18_14-05-09");
    expect(pdfFileName(" Éric Bishop ", savedAt)).toBe("Eric-Bishop-fcps-course-plan-2026-07-18_14-05-09.pdf");
    expect(exportDocumentTitle("Eric Bishop", savedAt)).toContain("Eric Bishop - FCPS Course Plan");
  });

  it("embeds editable plan data in the generated PDF", async () => {
    const plan = {
      formatVersion: 1,
      title: exportDocumentTitle("Eric Bishop", savedAt),
      exportedAt: savedAt.toISOString(),
      activeView: "overview",
      studentName: "Eric Bishop",
      selections: emptySelections(),
      lockedSelections: {},
      priorCourses: [],
      priorCourseGrades: {},
      diplomaType: "advanced",
      eligibilityChecks: {},
    } as Parameters<typeof createRecoverablePdf>[0];
    const pdf = createRecoverablePdf(plan);
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const contents = new TextDecoder("latin1").decode(bytes);
    expect(pdf.type).toBe("application/pdf");
    expect(contents).toMatch(/^%PDF-1\.4/);
    expect(contents).toContain("%FCPS_PLAN_V1_BEGIN");
    expect(contents).toContain("Eric Bishop");
  });
});
