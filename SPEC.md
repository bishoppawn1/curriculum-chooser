# FCPS Middle School Course Planner — Product Specification

## 1. Overview

The FCPS Middle School Course Planner is a standalone web app specifically for **Fairfax County Public Schools (FCPS), Virginia**. It helps a student or family create a possible course plan for grades 6, 7, and 8. The primary interface is an editable schedule chart, not an official FCPS registration form.

In this specification, “FCPS” never refers to Frederick County Public Schools or another division with the same initials.

The planner shows the required schedule slots for each grade, lists applicable course choices, and prevents a student from selecting an advanced course before completing its prerequisite.

## 2. Goals

- Make middle-school course requirements easy to understand.
- Show how many required core classes and elective periods each grade contains.
- Let users compare and modify plans for grades 6–8.
- Make course sequences such as Algebra 1 → Geometry → Algebra 2 and Spanish 1 → Spanish 2 understandable.
- Prevent invalid course sequences.
- Work locally and on ordinary static web hosts without ChatGPT Sites.
- Use Fairfax County Public Schools course names, terminology, and sequencing rules.

## 3. Non-goals

- Submitting official FCPS course requests
- Replacing advice from an FCPS counselor
- Guaranteeing that a course is offered at a particular school
- Student accounts, cloud synchronization, or permanent student records
- Automatic placement decisions based on grades, tests, IEPs, or counselor approval

## 4. Supported grades

### Grade 6

The chart contains:

1. English
2. Math
3. Science
4. Social Studies
5. Health and Physical Education
6. Elective or special 1
7. Elective or special 2

Grade 6 scheduling varies by school because most FCPS sixth graders attend elementary school, while some FCPS middle schools include grade 6. The interface must display this qualification.

### Grade 7

The chart contains:

1. English
2. Math
3. Science
4. Social Studies
5. Health and Physical Education
6. Elective period 1
7. Elective period 2

Grade 7 is the first middle-school planning year for many FCPS students. Users must be able to record advanced or high-school-credit courses completed before grade 7 so that valid grade 7 options can unlock.

### Grade 8

The chart contains:

1. English
2. Math
3. Science
4. Social Studies
5. Health and Physical Education
6. Elective period 1
7. Elective period 2

## 5. Elective periods

The user first chooses one of three elective formats:

- two full-year courses;
- one full-year course and two semester courses; or
- four semester courses.

The format selector controls both elective periods. Each elective period then supports either:

- one yearlong elective; or
- two semester electives, one for fall and one for spring.

A complete elective period requires one selected yearlong course or both semester selections.

## 6. Prerequisite behavior

### General rule

A course with a prerequisite is selectable only when one of its accepted prerequisites appears in the immediately previous grade's plan.

- Grade 7 checks the grade 6 chart and the “completed before grade 7” list.
- Grade 8 checks the grade 7 chart.
- Grade 8 does not skip grade 7 and use an unrelated grade 6 selection directly.

Only courses with an actual FCPS prerequisite are locked. An FCPS open-enrollment course must remain selectable even when the prior-grade chart is empty.

### FCPS mathematics rules

- Grade 7 Prealgebra and Prealgebra Honors are open-enrollment options.
- Grade 7 Algebra 1 Honors is available after Advanced Math 6.
- Grade 8 Algebra 1 and Algebra 1 Honors are open-enrollment options.
- Geometry or Geometry Honors follows successful completion of Algebra 1 or Algebra 1 Honors.
- Algebra 2 or Algebra 2 Honors follows successful completion of both Algebra 1 and Geometry.
- Geometry, Algebra 2, and other accelerated courses may depend on the student's school, FCPS Online availability, counselor approval, or individual placement.

### Required examples

| Desired course | Accepted earlier course |
| --- | --- |
| Algebra 1 Honors in grade 7 | Advanced Math 6 |
| Geometry Honors | Algebra 1 or Algebra 1 Honors |
| Algebra 2 Honors | Algebra 1 and Geometry or Geometry Honors |
| Spanish 1 Part B | Spanish 1 Part A |
| Spanish 2 | Spanish 1 or Spanish 1 Part B |
| Spanish 3 | Spanish 2 |
| French 1 Part B | French 1 Part A |
| French 2 | French 1 or French 1 Part B |
| Latin 2 | Latin 1 |
| Engineering 2 | Engineering 1 |
| Engineering 3 | Engineering 2 |

Equivalent rules apply to other sequential world-language courses included in the data.

Algebra 1 and Algebra 1 Honors in grade 8 are intentionally not listed as locked courses because FCPS identifies them as open enrollment for eighth graders.

### Locked state

When a prerequisite is missing:

- the later course is disabled in its course selector;
- the option states which earlier course is required; and
- the chart explains which previous grade is being checked.

### Removing a prerequisite

If a user removes or changes an earlier course, every later selection that no longer meets its prerequisite must be cleared automatically. Validation must cascade from grade 7 to grade 8.

## 7. Starting in grade 7

The grade 7 view includes a “Courses completed before grade 7” section. It contains common prerequisite courses such as:

- Advanced Math 6
- Algebra 1 or Algebra 1 Honors
- Geometry or Geometry Honors
- Spanish 1 or Spanish 1 Part A/B
- French 1 or French 1 Part A/B
- Latin 1
- Arabic 1
- Japanese 1

Selecting one of these entries is treated as prior completion for grade 7 prerequisite checks. It does not automatically fill an unrelated schedule slot.

## 8. Course-selection behavior

- Each required core slot accepts exactly one course.
- A single elective-format selector switches between two full-year courses, one full-year plus two semester courses, and four semester courses.
- Changing the elective format clears only elective periods whose course length changes.
- The interface displays completed slots as a count out of seven.
- A core slot is complete when one course is selected.
- A yearlong elective period is complete when one course is selected.
- A semester elective period is complete only when both semester courses are selected.
- High-school-credit courses are labeled in the selector.

## 9. Data persistence

- Save the grade charts and pre-grade-7 course list in `localStorage`.
- Restore saved data when the app opens again on the same device and browser.
- Invalid or unreadable saved data must not prevent the app from loading.
- No course-plan data is sent to a server.

## 10. Layout and interaction

- Use grade 6, 7, and 8 buttons to switch charts.
- Show the active grade and a short grade-specific note.
- Present a compact subject-first grid with each subject name above its editable course field.
- Do not display slot numbers, a separate requirement column, a completion counter, or a progress bar.
- Use native form controls.
- On small screens, convert each table row into a readable vertical section.
- Avoid decorative imagery and unnecessary visual effects.

## 11. Hosting and operation

- The app is a standard React/Vite static site.
- `npm run dev` starts local development.
- `npm run build` performs TypeScript validation and generates `dist/`.
- The contents of `dist/` can be served by any ordinary static host.
- The repository must not require ChatGPT Sites, Vinext, Next.js, Cloudflare Workers, or server infrastructure.

## 12. Acceptance criteria

The feature is complete when all of the following are true:

1. Grades 6–8 each display seven clearly labeled course categories in a compact grid.
2. Grade 7 and grade 8 each display five core requirements and two elective periods.
3. Users can change every course selection through native controls.
4. Users can switch among two full-year courses, one full-year plus two semester courses, and four semester courses.
5. Grade 7 users can record courses completed before grade 7.
6. Spanish 2 cannot be selected until Spanish 1 or Part B is present in the previous-grade data.
7. Algebra 2 Honors cannot be selected until Geometry or Geometry Honors is present in the previous-grade data.
8. Locked options name their missing prerequisite.
9. Removing a prerequisite clears invalid dependent selections.
10. Plans persist after a browser refresh on the same device.
11. The layout works at desktop and mobile widths.
12. `npm run build` succeeds and produces a standalone `dist/` directory.

## 13. FCPS sources of truth

Course data and rules must be checked against the current versions of:

- Fairfax County Public Schools course catalogs: `https://www.fcps.edu/academics/coursecatalogs`
- FCPS middle-school mathematics guidance: `https://www.fcps.edu/academics/middle/mathematics`
- FCPS mathematics course sequencing: `https://www.fcps.edu/academics/graduation-requirements/course-sequencing/course-sequencing-mathematics`
- FCPS Honors guidance for grades 7–8: `https://www.fcps.edu/academics/advanced-academic-programs-aap/middle/honors-grades-7-8`
- The current course-selection sheet and academic-advising page for the student's FCPS school

Countywide catalogs describe possible courses, but FCPS states that optional courses may not be offered at every school. The app must continue to display a school-availability disclaimer and must not promise placement.
