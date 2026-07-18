# FCPS Course Planner: Rachel Carson to Skyview — Product Specification

## 1. Scope

The planner follows a Fairfax County Public Schools path from **Rachel Carson Middle School (RCMS)** through **Skyview High School**:

- Middle School: grades 7 and 8 at Rachel Carson
- High School: grades 9, 10, 11, and 12 at Skyview

Rachel Carson does not have a sixth-grade schedule. Sixth-grade, summer, or transfer coursework appears only in a compact “completed before grade 7” section when it affects placement or prerequisites.

Skyview opens in 2026–27 with grades 9 and 10. The grade 11 and 12 charts are future planning based on FCPS sequences; school-specific choices must be updated when Skyview publishes those offerings. The app is a planning aid, not an official registration form or placement decision.

## 2. Navigation and interface

- Show Grade 7 and Grade 8 under a visible **Middle School** heading.
- Show Grade 9, Grade 10, Grade 11, and Grade 12 under a visible **High School** heading.
- Show an **Overview** tab after Grade 12 with the complete grade 7–12 plan, entered grades, per-grade GPA estimates, and a prominent projected FCPS transcript GPA in one place.
- Use a short, subject-first grid with each course category directly above its selector.
- Select the base course first. When it has multiple versions, show a second **Version** dropdown immediately below it for Standard, Honors, AAP Center, AP, or another published version.
- Do not list Standard and Honors as unrelated courses in the first dropdown. For example, list “Algebra 2” once, then offer Standard and Honors in its Version dropdown.
- Do not show slot numbers, a slot column, a completion counter, or a slot progress bar.
- Keep pre-grade-7 information collapsed until opened.
- Keep course explanations, graduation details, and plan checks compact and collapsible.
- Use native, keyboard-accessible controls and reflow on mobile without horizontal page scrolling.

## 3. Rachel Carson schedule

Each RCMS student takes seven classes each semester:

1. English
2. Math
3. Social Studies (U.S. History 7 or Civics 8)
4. Science
5. Health and Physical Education
6. Elective period 1
7. Elective period 2

The two elective periods can contain two yearlong electives, one yearlong plus two semester electives, or four semester electives.

The same elective course family cannot be selected more than once in the same grade, including across elective periods, fall/spring semester halves, or different versions of that course. Duplicate options remain visible but disabled with an explanation.

Grade 7 core choices include English 7 levels, the school-published math placements from Pre-Algebra through Geometry HN, U.S. History 7 levels, Science 7 levels, and Health & PE 7.

Grade 8 core choices include English 8 levels, Algebra 1 through Algebra II HN, Civics 8 levels, Science 8 levels, and Health & PE 8.

Normal grade-level electives from Rachel Carson's current selection materials appear first. Later FCPS levels also remain available for exceptional placement. Audition, teacher-recommendation, concurrent-enrollment, and school-placement conditions must be included in the course label or prerequisite message.

There is no hard grade-level ceiling. A grade 7 student may select a later FCPS course in any matching subject—for example, Algebra 2 Honors after recording Geometry as completed. This flexibility applies to English, math, science, social studies, Health & PE, world languages, arts, and technology electives. The same rule continues in later grades so an accelerated path does not dead-end.

## 4. Skyview schedule

Each high-school grade uses a compact seven-category planning chart for English, Math, Science, Social Studies, Health & PE or another required course where appropriate, and two electives.

- Grades 9 and 10 represent Skyview's 2026–27 opening-year population. Standard offerings remain enrollment-dependent.
- Grades 11 and 12 must be visibly described as future plans while Skyview phases in older grades.
- Use official FCPS naming and sequencing. Do not imply that a school-specific course is guaranteed when Skyview has not published it.
- Skyview specialty choices may include its officially announced computer science, Advanced Programming, and AI Foundations pathways when grade-appropriate.

## 5. Prerequisites

- Grade 7 checks the “completed before grade 7” list.
- The pre-grade-7 list includes all earlier courses needed by the advanced choices shown in grade 7.
- Group pre-grade-7 choices by subject. English early placement follows English 7 → 8 → 9 → 10 → 11 → 12, while the typical grade-level English course remains open without an early-placement check.
- Social Studies early placement follows U.S. History 7 → Civics 8 → World History & Geography 1 → World History & Geography 2. Virginia & U.S. History requires World History & Geography 1 or 2, and Virginia & U.S. Government requires Virginia & U.S. History.
- Each later grade checks the complete course history from all earlier grades. A prerequisite completed more than one year earlier remains valid.
- A fall-semester course also satisfies a prerequisite for a spring-semester course in the same grade, even when the two courses use different elective periods.
- Geometry requires Algebra 1; Algebra 2 requires Geometry; later math courses require the appropriate earlier sequence.
- Language levels require the previous level, such as Spanish 2 after Spanish 1.
- Sequential art, coding, engineering, theatre, programming, and AI courses require their defined earlier course.
- Locked options must name the missing prerequisite.
- Removing an earlier prerequisite must clear now-invalid later selections.
- Removing a fall prerequisite must likewise clear its dependent spring selection.
- Keep prerequisites separate from admission or placement eligibility. Prerequisites control whether a course can be chosen; eligibility items remain visible checks that require official confirmation.

## 6. Data and operation

- Every selected course must show a prominent STANDARD, HONORS, or AP designation and its weighted-GPA point modifier.
- Honors high-school-credit courses use a +0.5 modifier and AP courses use a +1.0 modifier; middle-school Honors courses explicitly show that they have no transcript weight.
- Show the estimated unweighted and weighted GPA at the same time; do not require the user to switch between GPA modes. Give each estimate its own labeled bar using a 4.0 unweighted scale and 5.0 weighted planning scale.
- On Overview, show a cumulative college-facing GPA estimate using only graded high-school-credit courses across grades 7–12. Display the projected FCPS weighted GPA prominently, include an unweighted reference, and explain that individual colleges may recalculate GPA.
- Save plans locally in the browser and do not send student data to a server.
- Provide a “Save plan as PDF” action that downloads a readable summary of grades 7–12 and the graduation credit check. Embed the structured plan data so PDFs exported by the planner can be loaded and edited later. The suggested PDF filename must begin with the sanitized value entered in the name field.
- Provide a “Load plan” action that accepts planner-exported JSON or PDF files, validates their plan data, restores the saved view, and leaves the imported plan editable. Reject unrelated PDFs with a clear message.
- Run as a standalone React/Vite static app.
- Do not use ChatGPT Sites, Vinext, Next.js, or Cloudflare Workers.
- `npm run build` must generate a deployable `dist/` directory.

## 6B. Planning support

- Show a visible availability label for every selected course: Rachel Carson published choice, exceptional/counselor-review option, Skyview enrollment-dependent choice, unconfirmed FCPS option, or future Skyview plan.
- Show high-school credit and published partner-college credit for the selected course. AP college credit must be described as exam- and college-policy-dependent rather than guaranteed.
- Compare planned credits with the current FCPS Standard and Advanced Studies diploma category totals. Count excess subject credits toward electives where appropriate.
- Keep a collapsed plain-language explanation and prerequisite summary with each selected course.
- Warn about missing graduation categories, repeated courses, unchecked eligibility, and unconfirmed Skyview offerings.
- State that verified credits, CPR/AED, virtual-course participation, credentials/work-based learning, and other non-course rules are not fully verified by the planner.

## 6A. College-credit courses

- Include FCPS Dual Enrollment (DE) options in English, mathematics, science, social studies, world languages, and technology where represented in the 2026–27 FCPS list.
- Treat DE as a separate version from Standard, Honors, and AP.
- Apply FCPS's +1.0 DE GPA weighting.
- Disable DE for grades 7–9. Grade 10 participation is course-specific; all DE selections remain subject to the partner college's admission, placement, and prerequisite rules.
- Explain that availability varies by school. Listing an FCPS DE course does not promise that Skyview will run it.
- Use the exact selected DE course ID for prerequisites and persistence.
- In mathematics, include Standard, Honors, AP, and DE versions of Precalculus with Trigonometry; Calculus AB/BC and Calculus 1/1 & 2 DE; and the later Multivariable Calculus/Linear Algebra DE and Differential Equations DE sequence.
- Do not present “Trigonometry” as a guaranteed standalone Skyview course when FCPS publishes it as part of Precalculus with Trigonometry.

## 7. Sources of truth

- Rachel Carson academic advising: `https://carsonms.fcps.edu/student-services/academic-advising-course-selection`
- Rachel Carson 2026–27 course booklet: `https://carsonms.fcps.edu/sites/default/files/media/inline-files/26-27course%20catalog%20booklet.pdf`
- Rachel Carson 2026–27 grade 7 selection sheet: `https://carsonms.fcps.edu/sites/default/files/media/inline-files/CourseSelectionSheet7%20DRAFT2026-2027_0.pdf`
- Rachel Carson 2026–27 grade 8 selection sheet: `https://carsonms.fcps.edu/sites/default/files/media/inline-files/CourseSelectionSheet8%202026-2027_0.pdf`
- Skyview official school page: `https://www.fcps.edu/skyview`
- Skyview FAQ: `https://skyviewhs.fcps.edu/about/frequently-asked-questions`
- Skyview academic advising: `https://skyviewhs.fcps.edu/student-services/course-selection-academic-advising`
- FCPS course catalogs: `https://www.fcps.edu/academics/coursecatalogs`
- FCPS Dual Enrollment: `https://www.fcps.edu/academics/dual-enrollment`
- FCPS Dual Enrollment admissions criteria: `https://www.fcps.edu/academics/dual-enrollment/dual-enrollment-admissions-criteria`
- FCPS graduation requirements for students entering grade 9 in 2018–19 or later: `https://www.fcps.edu/graduation-requirements-and-course-planning/first-time-ninth-2018-19`
- FCPS Postsecondary Profile and transcript GPA rules: `https://www.fcps.edu/about-fcps/leadership/district-performance-transparency/postsecondary-profile`

Offerings can change because of staffing, enrollment, scheduling conflicts, support placement, graduation requirements, and counselor review.

## 8. Acceptance criteria

1. No grade 6 schedule or grade 6 tab is displayed.
2. Grades 7 and 8 appear under Middle School; grades 9 through 12 appear under High School, followed by an Overview tab that summarizes all six grades.
3. Every grade uses the compact subject-first editable chart.
4. Rachel Carson's normal choices appear first, with later FCPS levels available in every subject for exceptional placement.
5. Skyview's opening and future grade-level status is accurately labeled.
6. Sequential courses enforce their prerequisites from any earlier grade or, for grade 7, the pre-grade-7 completion list.
7. Grade 7 can represent relevant coursework completed before RCMS.
8. Plans persist after a browser refresh.
9. The chart works on desktop and mobile.
10. `npm run build` passes.
11. Selected courses prominently show their level and exact GPA point modifier.
12. Unweighted and weighted GPA estimates and their separate bars are visible simultaneously and update from the same entered grades.
13. Course prerequisites and DE eligibility checks are presented as separate concepts.
14. Selected courses show availability, credit, and collapsed explanation details.
15. Math uses the same single course/version/grade layout as the other required core subjects.
16. The Standard/Advanced Studies credit table updates from selections and clearly identifies its unverified requirements.
17. Plan checks identify missing categories, duplicate selections, unchecked eligibility, and availability uncertainty.
18. A student cannot select the same elective course family twice within one grade.
19. The PDF/print view includes every grade from 7 through 12, entered grades, high-school-credit labels, and graduation credit totals.
20. Entering a name such as “Eric Bishop” makes the suggested PDF filename begin with `Eric-Bishop`.
21. Pre-grade-7 English work unlocks the next English level when it is planned earlier than its typical grade; the same checklist continues to unlock defined Math, Science, language, and elective prerequisites.
22. Overview prominently shows cumulative weighted and unweighted transcript GPA estimates based only on graded high-school-credit coursework.
23. A planner-exported JSON or PDF file can be loaded into the app, restores its saved view and selections, and remains fully editable; unrelated PDFs are rejected with a clear message.
