# FCPS Course Planner: Rachel Carson to Skyview
Try it out https://bishoppawn1.github.io/curriculum-chooser/
A standalone React and Vite app for planning an FCPS course path from Rachel Carson Middle School through Skyview High School.

- **Middle School:** grades 7 and 8 at Rachel Carson
- **High School:** grades 9 through 12 at Skyview

Skyview opens for grades 9 and 10 in 2026–27. Grades 11 and 12 are future-planning charts and should be checked against Skyview's published offerings as the school phases in those grade levels.

The deployable static site is written to `dist/` and can be hosted by any static web server.

## Course prerequisites

Courses such as Geometry HN, Algebra II HN, Spanish 2, and other sequential courses stay locked until the required course is present anywhere in the student's earlier course history. Students entering grade 7 can record relevant sixth-grade, summer, or transfer coursework.

The chooser does not impose the usual grade-level ceiling. Later FCPS levels appear in every matching subject, allowing accelerated or exceptionally placed students to plan courses such as Algebra 2 Honors in grade 7 after recording the required prior work.

Courses with multiple versions use two controls: choose the base course first, then choose Standard, Honors, AAP Center, or AP from the **Version** dropdown that appears below it.

Fall-semester selections can satisfy spring-semester prerequisites in the same grade. For example, Engineering 1 in fall unlocks Engineering 2 in spring.

The planner also includes selected FCPS Dual Enrollment courses. DE versions are marked separately, receive the FCPS +1.0 weight, and remain subject to partner-college eligibility, prerequisites, and actual availability at Skyview.

The advanced math path includes Precalculus with Trigonometry, Calculus, Multivariable Calculus/Linear Algebra DE, and Differential Equations DE, with each later course unlocked by its earlier coursework.

## Planning checks and course details

The chart keeps course prerequisites separate from enrollment eligibility. A missing prerequisite locks a sequential course; DE admission, college-readiness, mathematics placement, and grade-10 exceptions appear as verification checkboxes after the course is selected.

Selected courses show their FCPS/Skyview availability status and include a collapsed details section with a plain-language explanation, high-school credit, college credit, and prerequisite information. Skyview opening-year, future-grade, and unconfirmed offerings remain visibly labeled.

The FCPS graduation check compares planned high-school credits with either Standard or Advanced Studies diploma category totals. It also reports incomplete categories, repeated courses, unverified DE eligibility, and unconfirmed Skyview offerings. This is an estimate; verified credits and non-course diploma requirements still require official review.
