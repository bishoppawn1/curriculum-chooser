# AGENTS.md

## Project purpose

This repository contains a standalone curriculum chooser specifically for a Fairfax County Public Schools (FCPS), Virginia path from **Rachel Carson Middle School** to **Skyview High School**. Rachel Carson covers grades 7 and 8; Skyview covers grades 9 through 12. Do not add a grade 6 schedule. Students use an editable chart to select required core courses and electives.

Skyview opens in 2026–27 with grades 9 and 10. Treat grades 11 and 12 as future planning until Skyview publishes its offerings as those grades phase in. Clearly identify that uncertainty in the interface and documentation.

Do not adapt the data to another school division that also uses the initials “FCPS,” such as Frederick County Public Schools, without an explicit request.

## Technology

- React 19
- TypeScript
- Vite
- Plain CSS
- Device-local persistence through `localStorage`

The project is a standard static web app. Do not add ChatGPT Sites, Vinext, Next.js, Cloudflare Workers, authentication, a database, or a server unless the user explicitly requests it.

## Important files

- `src/App.tsx`: course data, prerequisite rules, state, and UI
- `src/styles.css`: all visual styling and responsive behavior
- `src/main.tsx`: React entry point
- `index.html`: document shell and metadata
- `SPEC.md`: product behavior and acceptance criteria
- `src/plannerRules.test.ts`: course-rule, GPA, credit, export, and sanitization tests
- `src/App.test.tsx`: user-interface, persistence, loading, undo, and accessibility tests
- `vitest.config.ts`: automated test environment

## Commands

```bash
npm install
npm run dev
npm test
npm run test:watch
npm run build
npm run preview
```

Run `npm test` and `npm run build` after implementation changes. The test suite must pass, TypeScript checking must pass, and the build must produce a static `dist/` directory.

Every new feature, course rule, interface behavior, persistence change, import/export change, or bug fix must add or update automated tests in the same change. A feature is not complete when its new behavior is untested. Test both the underlying planner rule and the user-visible behavior when both layers change. Do not delete, skip, or weaken a valid assertion merely to make the suite pass.

After every requested change, commit the completed work and push it to the configured GitHub remote. Do not include unrelated user files or changes in the commit.

## Product rules

1. Keep the interface a short, subject-first editable chart. Put each subject name above its course selector. Do not reintroduce slot numbers, a slot column, a completion bar, decorative imagery, dashboards, or unrelated features.
2. Support grades 7 through 12. Group grades 7 and 8 under “Middle School” and grades 9 through 12 under “High School.” Sixth-grade coursework may appear only in the pre-grade-7 prerequisite/placement checklist.
3. Clearly label every schedule slot by subject or purpose.
4. Grades 7 and 8 have five required core categories and two elective periods.
5. An elective period can contain one yearlong course or two semester courses.
6. A course with a prerequisite must remain unavailable until its prerequisite appears in any earlier grade, the pre-grade-7 completion list, or an eligible fall-semester selection before a spring course. Do not require the prerequisite to be repeated in the immediately previous grade.
7. Grade 7 users may record relevant sixth-grade, summer, or transfer courses in the pre-grade-7 checklist.
8. If an earlier prerequisite is removed, clear any now-invalid later selection.
9. Clearly identify high-school-credit courses.
10. Persist selections only on the user's device unless persistent accounts are explicitly requested.
11. Use Rachel Carson's current offerings for grades 7 and 8. For Skyview, use current official school or FCPS sources, label enrollment-dependent and future offerings, and do not present the planner as an official registration system.
12. Do not impose a normal grade-level ceiling. Starting in grade 7, show later FCPS course levels in the matching subject so accelerated, transfer, independently educated, or exceptionally placed students can represent their actual path. Keep normal grade-level choices first, enforce genuine course prerequisites, and label final availability as counselor/school dependent.
13. Represent Standard, Honors, AAP, AP, or similar versions as variants of one course family. The first dropdown chooses the base course (for example, Algebra 2); a second **Version** dropdown appears only when that course has multiple versions. Store the selected version's stable course ID so prerequisites and GPA weighting continue to work.
14. For semester electives, a course selected in fall satisfies prerequisites for spring in the same grade. Consider fall selections from either elective period. Removing or changing the fall prerequisite must clear a now-invalid spring selection.
15. Include official FCPS Dual Enrollment (DE) choices as college-credit options. Keep DE distinct from AP and Honors, use a +1.0 GPA weight, enforce high-school grade restrictions and course prerequisites, and state that college admission/placement criteria and school availability still apply.

## Course-data changes

- Treat current Fairfax County Public Schools sources as authoritative. Start with:
  - Rachel Carson academic advising: `https://carsonms.fcps.edu/student-services/academic-advising-course-selection`
  - Skyview school page: `https://www.fcps.edu/skyview`
  - Skyview academic advising: `https://skyviewhs.fcps.edu/student-services/course-selection-academic-advising`
  - Skyview FAQ: `https://skyviewhs.fcps.edu/about/frequently-asked-questions`
  - Rachel Carson 2026–27 course booklet: `https://carsonms.fcps.edu/sites/default/files/media/inline-files/26-27course%20catalog%20booklet.pdf`
  - FCPS course catalogs: `https://www.fcps.edu/academics/coursecatalogs`
  - FCPS Dual Enrollment courses and policies: `https://www.fcps.edu/academics/dual-enrollment`
  - FCPS middle-school mathematics: `https://www.fcps.edu/academics/middle/mathematics`
  - FCPS mathematics sequencing: `https://www.fcps.edu/academics/graduation-requirements/course-sequencing/course-sequencing-mathematics`
  - Rachel Carson's current grade 7 and grade 8 course-selection sheets
- Never substitute generic Virginia, national, or another school division's requirements for an FCPS rule.
- Use FCPS terminology. Middle-school advanced core courses are called “Honors,” not “AP.”
- Rachel Carson's grade 7 sheet lists Pre-Algebra, Pre-Algebra HN, placement-only Algebra 1 HN, and Geometry HN.
- Rachel Carson's grade 8 sheet lists Algebra 1, Algebra 1 Honors, Geometry HN, and Algebra II HN.
- Use stable course IDs for prerequisite matching.
- Keep the display name separate from the stable ID.
- Express prerequisites with explicit course IDs and a readable requirement label.
- Check both the primary and secondary course in an elective period.
- When adding a course level such as Spanish 2 or Algebra 2 Honors, add its earlier level and prerequisite rule at the same time.
- The pre-grade-7 checklist must include every course needed to unlock an advanced grade 7 choice, including Geometry for Algebra 2 Honors. This flexibility applies to all subjects and electives, not math alone.
- Verify current official FCPS course catalogs or school selection sheets when changing course names or requirements.
- Note school-specific or uncertain offerings instead of implying countywide availability.
- A DE course offered somewhere in FCPS is not automatically offered at Skyview. Keep the school/counselor availability warning visible.
- Model FCPS trigonometry within the published “Precalculus with Trigonometry” course family. Higher DE mathematics must preserve the FCPS/NOVA order: Precalculus, Calculus 1 or Calculus 1 & 2, Multivariable Calculus/Linear Algebra, then Differential Equations where eligible.
- Skyview's opening-year grade 9 and 10 offerings depend on enrollment. Grades 11 and 12 must remain visibly marked as future planning until official school-specific selections are available.

## UI and accessibility

- Use native buttons, checkboxes, and select elements.
- Preserve visible keyboard focus.
- Every control must have a visible or screen-reader label.
- The chart must remain usable on mobile without horizontal page scrolling.
- Locked options must explain which prerequisite is missing.
- Do not rely on color alone to communicate completion or availability.

## Scope discipline

- Do not deploy to ChatGPT Sites.
- Do not replace the chart with cards, a wizard, or a decorative landing page.
- Do not add sign-in, student records, counselor messaging, or official registration submission without an explicit request.
- Keep unrelated starter files and generated build artifacts out of source control.
