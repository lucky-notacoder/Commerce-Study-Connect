// This file aggregates chapter lists from separate data files.
// Place CA and CMA chapter files in the data/ca-foundation and data/cma-foundation folders.
(function () {
  const getChapterName = (chapter) =>
    typeof chapter === "string" ? chapter : chapter?.name || "";

  const getChapterUnits = (chapter) =>
    chapter && typeof chapter === "object" && Array.isArray(chapter.units)
      ? chapter.units
      : [];

  const hasChapterEntry = (chapters, chapterName) =>
    chapters.some(
      (chapter) =>
        getChapterName(chapter) === chapterName ||
        getChapterUnits(chapter).includes(chapterName)
    );

  const chapterLists = Object.assign(
    {},
    window.caFoundationChapters || {},
    window.cmaFoundationChapters || {},
    window.caInterChapters || {},
    window.cmaInterChapters || {},
    window.caFinalChapters || {},
    window.cmaFinalChapters || {}
  );
  const chapterDetails = Object.assign(
    {},
    window.caFoundationChapterDetails || {},
    window.cmaFoundationChapterDetails || {},
    window.caInterChapterDetails || {},
    window.cmaInterChapterDetails || {},
    window.caFinalChapterDetails || {},
    window.cmaFinalChapterDetails || {}
  );

  window.subjectChapters = Object.keys(chapterDetails).reduce(
    (subjects, subjectId) => {
      const listedChapters = subjects[subjectId] || [];
      const detailChapters = Object.keys(chapterDetails[subjectId] || {});

      subjects[subjectId] = [
        ...listedChapters,
        ...detailChapters.filter(
          (chapterName) => !hasChapterEntry(listedChapters, chapterName)
        ),
      ];

      return subjects;
    },
    chapterLists
  );
})();
