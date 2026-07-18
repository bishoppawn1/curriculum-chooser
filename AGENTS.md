# AGENTS.md

## Project purpose

This repository contains a standalone curriculum chooser specifically for **Fairfax County Public Schools (FCPS), Virginia**, for grades 6–8. Students use an editable chart to select required core courses and electives. The app must apply FCPS course names, pathways, and prerequisite rules.

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

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

Run `npm run build` after implementation changes. The build must pass TypeScript checking and produce a static `dist/` directory.

## Product rules

1. Keep the interface a short, subject-first editable chart. Put each subject name above its course selector. Do not reintroduce slot numbers, a slot column, a completion bar, decorative imagery, dashboards, or unrelated features.
2. Support grades 6, 7, and 8.
3. Clearly label every schedule slot by subject or purpose.
4. Grades 7 and 8 have five required core slots and two elective periods.
5. An elective period can contain one yearlong course or two semester courses.
6. A course with a prerequisite must remain unavailable until its prerequisite appears in the immediately previous grade.
7. Grade 7 users may record relevant courses completed before grade 7 when no grade 6 plan is available.
8. If an earlier prerequisite is removed, clear any now-invalid later selection.
9. Clearly identify high-school-credit courses.
10. Persist selections only on the user's device unless persistent accounts are explicitly requested.
11. Course availability and exact placement rules vary by FCPS school. Do not present the planner as an official registration system.

## Course-data changes

- Treat current Fairfax County Public Schools sources as authoritative. Start with:
  - FCPS course catalogs: `https://www.fcps.edu/academics/coursecatalogs`
  - FCPS middle-school mathematics: `https://www.fcps.edu/academics/middle/mathematics`
  - FCPS mathematics sequencing: `https://www.fcps.edu/academics/graduation-requirements/course-sequencing/course-sequencing-mathematics`
  - The student's school-specific academic-advising and course-selection materials
- Never substitute generic Virginia, national, or another school division's requirements for an FCPS rule.
- Use FCPS terminology. Middle-school advanced core courses are called “Honors,” not “AP.”
- FCPS currently allows open enrollment in Prealgebra and Prealgebra Honors for grade 7 and Algebra 1 or Algebra 1 Honors for grade 8. Do not invent prerequisites for those open-enrollment options.
- FCPS allows a student who completed Advanced Math 6 to choose Algebra 1 Honors in grade 7. Geometry follows Algebra 1, and Algebra 2 follows Algebra 1 and Geometry.
- Use stable course IDs for prerequisite matching.
- Keep the display name separate from the stable ID.
- Express prerequisites with explicit course IDs and a readable requirement label.
- Check both the primary and secondary course in an elective period.
- When adding a course level such as Spanish 2 or Algebra 2 Honors, add its earlier level and prerequisite rule at the same time.
- Verify current official FCPS course catalogs or school selection sheets when changing course names or requirements.
- Note school-specific or uncertain offerings instead of implying countywide availability.

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
