// Aggregates chapter details from separate level files.
// Each level has its own chapter details file in data/{level-folder}/chapter-details.js
window.chapterDetails = Object.assign(
  {},
  window.caFoundationChapterDetails || {},
  window.cmaFoundationChapterDetails || {}
);
