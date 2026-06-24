// Aggregates course data from separate files for each level.
// Each level has its own data file in data/{level-folder}/courses.js
window.courseCatalog = [
  window.caFoundationCourses,
  window.cmaFoundationCourses,
  window.caInterCourses,
  window.cmaInterCourses,
  window.caFinalCourses,
  window.cmaFinalCourses,
].filter(Boolean);
