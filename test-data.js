// Aggregates test data from separate files for each level.
// Each level can have its own tests file in data/{level-folder}/tests.js.
window.testData = Object.assign(
  {},
  window.caFoundationTests || {},
  window.cmaFoundationTests || {},
  window.caInterTests || {},
  window.cmaInterTests || {},
  window.caFinalTests || {},
  window.cmaFinalTests || {}
);
