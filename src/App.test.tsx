import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

const emptySelections = () => ({ "7": {}, "8": {}, "9": {}, "10": {}, "11": {}, "12": {} });

function savedPlan(overrides: Record<string, unknown> = {}) {
  return {
    studentName: "",
    selections: emptySelections(),
    lockedSelections: {},
    priorCourses: [],
    priorCourseGrades: {},
    diplomaType: "advanced",
    eligibilityChecks: {},
    ...overrides,
  };
}

function saveToBrowser(plan: ReturnType<typeof savedPlan>) {
  window.localStorage.setItem("fcps-course-plan-v2", JSON.stringify(plan));
}

describe("planner navigation and structure", () => {
  it("shows grades 7–12 in the correct school groups without a grade 6 schedule", () => {
    render(<App />);
    const middle = screen.getByLabelText("Choose a middle school grade");
    const high = screen.getByLabelText("Choose a high school grade or view the full plan");
    expect(within(middle).getAllByRole("button").map((button) => button.textContent)).toEqual(["Grade 7", "Grade 8"]);
    expect(within(high).getAllByRole("button").map((button) => button.textContent)).toEqual(["Grade 9", "Grade 10", "Grade 11", "Grade 12", "Overview"]);
    expect(screen.queryByRole("button", { name: "Grade 6" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Grade 7 course choices" })).toBeInTheDocument();
  });

  it("marks grades 11 and 12 as future planning and returns from Overview to an editable grade", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Grade 12" }));
    expect(screen.getByText(/Future Skyview grade 12 planning/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.getByRole("heading", { name: "Grade 7–12 overview" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Edit grade/ })).toHaveLength(6);
    await user.click(screen.getByRole("button", { name: "Edit grade 8" }));
    expect(screen.getByRole("region", { name: "Grade 8 course choices" })).toBeInTheDocument();
  });
});

describe("elective formats and duplicate prevention", () => {
  it("switches between two full-year, mixed, and four-semester layouts", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getAllByLabelText("Course")).toHaveLength(2);

    await user.click(screen.getByRole("radio", { name: /1 full-year \+ 2 semester courses/ }));
    expect(screen.getAllByLabelText("Course")).toHaveLength(1);
    expect(screen.getAllByLabelText("Fall semester")).toHaveLength(1);
    expect(screen.getAllByLabelText("Spring semester")).toHaveLength(1);

    await user.click(screen.getByRole("radio", { name: /4 semester courses/ }));
    expect(screen.getAllByLabelText("Fall semester")).toHaveLength(2);
    expect(screen.getAllByLabelText("Spring semester")).toHaveLength(2);
  });

  it("disables an elective family after it is selected in another period", async () => {
    const user = userEvent.setup();
    render(<App />);
    const electiveSelects = screen.getAllByLabelText("Course");
    await user.selectOptions(electiveSelects[0], "spanish1");
    const duplicate = within(electiveSelects[1]).getByRole("option", { name: /Spanish Level 1.*already selected in another elective/ });
    expect(duplicate).toBeDisabled();
  });
});

describe("autofill and course locks", () => {
  it("keeps a locked course and preserves the selected elective format", async () => {
    const user = userEvent.setup();
    render(<App />);
    const englishColumn = screen.getByRole("heading", { name: "English" }).closest(".course-column");
    const english = within(englishColumn as HTMLElement);
    await user.selectOptions(english.getByLabelText("Choose English for grade 7"), "english-7");
    await user.selectOptions(english.getByLabelText("Version"), "english7aa");
    await user.click(english.getByRole("button", { name: "Lock English for grade 7" }));
    await user.click(screen.getByRole("radio", { name: /1 full-year \+ 2 semester courses/ }));
    await user.click(screen.getByRole("button", { name: "Autofill highest-GPA path" }));

    expect(english.getByLabelText("Version")).toHaveValue("english7aa");
    expect(english.getByRole("button", { name: "Unlock English for grade 7" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByLabelText("Course")).toHaveLength(1);
    expect(screen.getAllByLabelText("Fall semester")).toHaveLength(1);
    expect(screen.getAllByLabelText("Spring semester")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("preserving locks and elective formats");
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("fcps-course-plan-v2") ?? "{}").lockedSelections["7:english:primary"]).toBe(true));
  });
});

describe("course versions, grades, and GPA display", () => {
  it("selects an Honors version, records a grade, and displays its modifier and GPA", async () => {
    const user = userEvent.setup();
    render(<App />);
    const englishColumn = screen.getByRole("heading", { name: "English" }).closest(".course-column");
    expect(englishColumn).not.toBeNull();
    const english = within(englishColumn as HTMLElement);
    await user.selectOptions(english.getByLabelText("Choose English for grade 7"), "english-7");
    await user.selectOptions(english.getByLabelText("Version"), "english7h");
    await user.selectOptions(english.getByLabelText("Grade"), "A");

    expect(english.getByLabelText("HONORS, +0.0 GPA points")).toBeInTheDocument();
    expect(english.getByText("Middle-school course; no transcript weight")).toBeInTheDocument();
    expect(screen.getByLabelText("Unweighted GPA on a 4.0 scale")).toHaveAttribute("aria-valuenow", "4");
    expect(screen.getByLabelText("Weighted GPA on a 5.0 planning scale")).toHaveAttribute("aria-valuenow", "4");
  });

  it("shows weighted and unweighted college-facing GPA in Overview", async () => {
    const selections = emptySelections();
    selections["11"] = {
      english: { mode: "yearlong", primary: "ap-language", secondary: "", primaryGrade: "A", secondaryGrade: "" },
    };
    saveToBrowser(savedPlan({ selections }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Overview" }));
    const card = screen.getByRole("heading", { name: "Projected FCPS transcript GPA" }).closest(".college-gpa");
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText("5.00")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("4.00")).toBeInTheDocument();
    const weightedBar = within(card as HTMLElement).getByRole("progressbar", { name: "Cumulative FCPS weighted GPA on a 5.0 planning scale" });
    const unweightedBar = within(card as HTMLElement).getByRole("progressbar", { name: "Cumulative unweighted GPA on a 4.0 scale" });
    expect(weightedBar).toHaveAttribute("aria-valuenow", "5");
    expect(weightedBar).toHaveAttribute("aria-valuemax", "5");
    expect(weightedBar.querySelector("span")).toHaveStyle({ width: "100%" });
    expect(unweightedBar).toHaveAttribute("aria-valuenow", "4");
    expect(unweightedBar).toHaveAttribute("aria-valuemax", "4");
    expect(unweightedBar.querySelector("span")).toHaveStyle({ width: "100%" });
    expect(within(card as HTMLElement).getByText(/Colleges receive the transcript/)).toBeInTheDocument();
  });

  it("includes graded pre-grade-7 high-school-credit work in the final GPA", async () => {
    saveToBrowser(savedPlan({ priorCourses: ["algebra1h"], priorCourseGrades: { algebra1h: "B" } }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Overview" }));
    const card = screen.getByRole("heading", { name: "Projected FCPS transcript GPA" }).closest(".college-gpa");
    expect(within(card as HTMLElement).getByText("3.50")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("3.00")).toBeInTheDocument();
  });
});

describe("plan checks and confirmation reminders", () => {
  it("shows unchecked DE eligibility as a side reminder instead of a plan issue", async () => {
    const selections = emptySelections();
    selections["11"] = {
      "elective-1": { mode: "yearlong", primary: "college-success-de", secondary: "", primaryGrade: "A", secondaryGrade: "" },
    };
    saveToBrowser(savedPlan({ selections }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Plan checks (3)"));
    expect(screen.getByRole("heading", { name: "Confirm with counselor or college" })).toBeInTheDocument();
    expect(screen.getByText("These are reminders to verify—not signs that the plan is wrong.")).toBeInTheDocument();
    expect(screen.getByText(/Confirm Dual Enrollment eligibility for: College Success Skills DE/)).toBeInTheDocument();
    expect(screen.getByText(/1 selected course has unconfirmed Skyview availability/).closest(".plan-confirmations")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Grade 11" }));
    await user.click(screen.getByRole("checkbox", { name: "Partner-college application completed" }));
    await user.click(screen.getByRole("checkbox", { name: "College-readiness requirement met" }));
    expect(screen.queryByText(/Confirm Dual Enrollment eligibility/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirm with counselor or college" })).toBeInTheDocument();
    expect(screen.getByText("Plan checks (2)")).toBeInTheDocument();
  });
});

describe("device-local persistence, reset, and undo", () => {
  it("supports several consecutive Undo presses, including rapid presses", async () => {
    const user = userEvent.setup();
    render(<App />);
    const englishColumn = screen.getByRole("heading", { name: "English" }).closest(".course-column");
    const english = within(englishColumn as HTMLElement);
    await user.selectOptions(english.getByLabelText("Choose English for grade 7"), "english-7");
    await user.selectOptions(english.getByLabelText("Version"), "english7h");
    await user.selectOptions(english.getByLabelText("Grade"), "A");

    const undo = screen.getByRole("button", { name: "Undo" });
    act(() => {
      undo.click();
      undo.click();
      undo.click();
    });

    expect(english.getByLabelText("Choose English for grade 7")).toHaveValue("");
    expect(undo).toBeDisabled();
  });

  it("restores a saved plan and writes edits back to localStorage", async () => {
    const selections = emptySelections();
    selections["7"] = {
      english: { mode: "yearlong", primary: "english7h", secondary: "", primaryGrade: "A-", secondaryGrade: "" },
    };
    saveToBrowser(savedPlan({ studentName: "Saved Student", selections }));
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByLabelText("Name for saved file")).toHaveValue("Saved Student");
    expect(screen.getByLabelText("Choose English for grade 7")).toHaveValue("english-7");

    await user.clear(screen.getByLabelText("Name for saved file"));
    await user.type(screen.getByLabelText("Name for saved file"), "Updated Student");
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("fcps-course-plan-v2") ?? "{}").studentName).toBe("Updated Student"));
  });

  it("resets the plan after confirmation and restores it with Undo", async () => {
    const selections = emptySelections();
    selections["7"] = {
      english: { mode: "yearlong", primary: "english7", secondary: "", primaryGrade: "A", secondaryGrade: "" },
    };
    saveToBrowser(savedPlan({ selections }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Reset plan" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByLabelText("Choose English for grade 7")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByLabelText("Choose English for grade 7")).toHaveValue("english-7");
  });

  it("resets only grades while preserving courses and locks, then restores grades with Undo", async () => {
    const selections = emptySelections();
    selections["7"] = {
      english: { mode: "yearlong", primary: "english7h", secondary: "", primaryGrade: "A", secondaryGrade: "" },
    };
    saveToBrowser(savedPlan({
      selections,
      lockedSelections: { "7:english:primary": true },
      priorCourses: ["algebra1h"],
      priorCourseGrades: { algebra1h: "B" },
    }));
    const user = userEvent.setup();
    render(<App />);

    const englishColumn = screen.getByRole("heading", { name: "English" }).closest(".course-column");
    expect(englishColumn).not.toBeNull();
    const english = within(englishColumn as HTMLElement);

    const resetGrades = screen.getByRole("button", { name: "Reset grades" });
    expect(resetGrades).toBeEnabled();
    await user.click(resetGrades);
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Clear every entered grade"));
    expect(screen.getByLabelText("Choose English for grade 7")).toHaveValue("english-7");
    expect(english.getByLabelText("Grade")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Unlock English for grade 7" })).toBeInTheDocument();
    expect(resetGrades).toBeDisabled();
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem("fcps-course-plan-v2") ?? "{}");
      expect(saved.priorCourseGrades).toEqual({});
      expect(saved.lockedSelections).toEqual({ "7:english:primary": true });
    });

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(english.getByLabelText("Grade")).toHaveValue("A");
    expect(screen.getByRole("button", { name: "Reset grades" })).toBeEnabled();
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("fcps-course-plan-v2") ?? "{}").priorCourseGrades).toEqual({ algebra1h: "B" }));
  });

  it("switches diploma requirements and allows the change to be undone", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/of 26 planned credits/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Diploma"), "standard");
    expect(screen.getByText(/of 22 planned credits/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText(/of 26 planned credits/)).toBeInTheDocument();
  });
});

describe("plan files and supporting information", () => {
  it("keeps the matching JSON and PDF save buttons clickable without a name", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Save plan as JSON" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save plan as JSON" })).toHaveClass("plan-save-button");
    expect(screen.getByRole("button", { name: "Save plan as PDF" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save plan as PDF" })).toHaveClass("plan-save-button");
    expect(screen.getByRole("button", { name: "Load plan" })).toBeEnabled();
  });

  it("blocks an unnamed JSON export and points the error to the name field", async () => {
    const user = userEvent.setup();
    const downloadClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<App />);
    const name = screen.getByLabelText("Name for saved file");
    const saveJson = screen.getByRole("button", { name: "Save plan as JSON" });

    await user.click(saveJson);

    expect(screen.getByRole("alert")).toHaveTextContent("Enter your name before saving the plan as JSON.");
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAttribute("aria-describedby", "plan-name-error");
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();

    await user.type(name, "Eric");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(saveJson);
    expect(window.URL.createObjectURL).toHaveBeenCalledOnce();
    expect(downloadClick).toHaveBeenCalledOnce();
  });

  it("blocks an unnamed PDF export and points the error to the name field", async () => {
    const user = userEvent.setup();
    const downloadClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<App />);
    const name = screen.getByLabelText("Name for saved file");
    const savePdf = screen.getByRole("button", { name: "Save plan as PDF" });

    await user.click(savePdf);

    expect(screen.getByRole("alert")).toHaveTextContent("Enter your name before saving the plan as a PDF.");
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAttribute("aria-describedby", "plan-name-error");
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();

    await user.type(name, "Eric");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(savePdf);
    expect(window.URL.createObjectURL).toHaveBeenCalledOnce();
    expect(downloadClick).toHaveBeenCalledOnce();
  });

  it("loads an editable JSON plan and restores its active view", async () => {
    const user = userEvent.setup();
    render(<App />);
    const imported = {
      ...savedPlan({ studentName: "Imported Student" }),
      formatVersion: 1,
      title: "Imported plan",
      exportedAt: "2026-07-18T12:00:00.000Z",
      activeView: "overview",
    };
    const file = new File([JSON.stringify(imported)], "imported-plan.json", { type: "application/json" });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    await user.upload(input as HTMLInputElement, file);
    expect(await screen.findByRole("status")).toHaveTextContent("imported-plan.json loaded");
    expect(screen.getByLabelText("Name for saved file")).toHaveValue("Imported Student");
    expect(screen.getByRole("heading", { name: "Grade 7–12 overview" })).toBeInTheDocument();
  });

  it("shows official source disclosures, plan checks, and accessible GPA bars", () => {
    render(<App />);
    expect(screen.getByText(/Grade 7 sources/)).toBeInTheDocument();
    expect(screen.getByText(/Plan checks \(/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Unweighted GPA on a 4.0 scale" })).toHaveAttribute("aria-valuemax", "4");
    expect(screen.getByRole("progressbar", { name: "Weighted GPA on a 5.0 planning scale" })).toHaveAttribute("aria-valuemax", "5");
  });
});
