// This file aggregates chapter lists from separate data files.
// Place CA and CMA chapter files in the data/ca-foundation and data/cma-foundation folders.
window.subjectChapters = Object.assign(
  {},
  window.caFoundationChapters || {},
  window.cmaFoundationChapters || {}
);
