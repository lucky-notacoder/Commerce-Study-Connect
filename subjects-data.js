// This file aggregates chapter lists from separate data files.
// Place CA and CMA chapter files in the data/ca-foundation and data/cma-foundation folders.
(function () {
  const chapterLists = Object.assign(
    {},
    window.caFoundationChapters || {},
    window.cmaFoundationChapters || {}
  );
  const chapterDetails = Object.assign(
    {},
    window.caFoundationChapterDetails || {},
    window.cmaFoundationChapterDetails || {}
  );

  window.subjectChapters = Object.keys(chapterDetails).reduce(
    (subjects, subjectId) => {
      const listedChapters = subjects[subjectId] || [];
      const detailChapters = Object.keys(chapterDetails[subjectId] || {});

      subjects[subjectId] = Array.from(
        new Set([...listedChapters, ...detailChapters])
      );

      return subjects;
    },
    chapterLists
  );
})();
