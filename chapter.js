(function () {
  const courseLevels = window.courseCatalog || [];
  const subjectChapters = window.subjectChapters || {};
  const chapterDetails = window.chapterDetails || {};
  const content = document.getElementById("chapter-content");

  if (!content) {
    return;
  }

  const toSlug = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getSubjects = () =>
    courseLevels.flatMap((level) =>
      level.subjects.map((subject) => ({
        ...subject,
        id: `${toSlug(level.level)}-${toSlug(subject.name)}`,
        level: level.level,
      }))
    );

  const getChapterInfo = (subjectId, chapterName) => {
    const subjectDetails = chapterDetails[subjectId] || {};

    return (
      subjectDetails[chapterName] || {
        overview:
          "Chapter information will be updated soon. Edit chapter-info-data.js to add details here.",
        topics: ["Overview", "Important topics", "Practice areas"],
        studyTips:
          "Add a short study tip for this chapter in chapter-info-data.js.",
      }
    );
  };

  const getChapterUrl = (subjectId, chapterName) =>
    `chapter.html?subject=${encodeURIComponent(subjectId)}&chapter=${encodeURIComponent(chapterName)}`;

  const getTopicTitle = (topic) =>
    typeof topic === "string" ? topic : topic?.title || topic?.name || "";

  const getTopicSubpoints = (topic, info, topicCount) => {
    if (topic && typeof topic === "object") {
      return (
        topic.subpoints ||
        topic.points ||
        topic.details ||
        topic.information ||
        []
      );
    }

    if (info.topicDetails && info.topicDetails[topic]) {
      return info.topicDetails[topic];
    }

    if (topicCount === 1 && Array.isArray(info.subpoints)) {
      return info.subpoints;
    }

    return [];
  };

  const renderTopicSubpoints = (subpoints) => {
    if (!Array.isArray(subpoints) || !subpoints.length) {
      return "";
    }

    return `
      <ul class="chapter-topic-subpoints">
        ${subpoints
          .map((subpoint) => `<li>${escapeHtml(subpoint)}</li>`)
          .join("")}
      </ul>
    `;
  };

  const renderTopic = (topic, info, topicCount) => {
    const title = getTopicTitle(topic);
    const subpoints = getTopicSubpoints(topic, info, topicCount);

    if (!title) {
      return "";
    }

    return `
      <li>
        <span class="chapter-topic-title">${escapeHtml(title)}</span>
        ${renderTopicSubpoints(subpoints)}
      </li>
    `;
  };

  const renderNotFound = () => {
    content.innerHTML = `
      <div class="chapter-reading-header">
        <span class="eyebrow">Chapter</span>
        <h1>Chapter not found</h1>
        <p>Please go back to courses and choose a chapter again.</p>
      </div>
      <div class="chapter-reading-actions">
        <a class="btn btn-primary" href="courses.html">Choose Chapter</a>
      </div>
    `;
  };

  const params = new URLSearchParams(window.location.search);
  const subjectId = params.get("subject") || "";
  const chapterName = params.get("chapter") || "";
  const subject = getSubjects().find((item) => item.id === subjectId);
  const chapters = subjectChapters[subjectId] || [];
  const currentIndex = chapters.indexOf(chapterName);

  if (!subject || currentIndex === -1) {
    renderNotFound();
    return;
  }

  const info = getChapterInfo(subjectId, chapterName);
  const topics = Array.isArray(info.topics) ? info.topics : [];
  const nextChapter = chapters[currentIndex + 1];
  const previousChapter = chapters[currentIndex - 1];

  document.title = `${chapterName} | Commerce Study Connect`;

  content.innerHTML = `
    <div class="chapter-reading-header">
      <span class="eyebrow">${escapeHtml(subject.level)}</span>
      <h1>${escapeHtml(chapterName)}</h1>
      <p>${escapeHtml(subject.name)}</p>
    </div>

    <div class="chapter-reading-body">
      <section>
        <h2>Overview</h2>
        <p>${escapeHtml(info.overview || "")}</p>
      </section>

      ${
        topics.length
          ? `
            <section>
              <h2>Important Topics</h2>
              <ul class="chapter-reading-list">
                ${topics
                  .map((topic) =>
                    renderTopic(topic, info, topics.length)
                  )
                  .join("")}
              </ul>
            </section>
          `
          : ""
      }

      ${
        info.studyTips
          ? `
            <section class="chapter-reading-tip">
              <h2>Study Tip</h2>
              <p>${escapeHtml(info.studyTips)}</p>
            </section>
          `
          : ""
      }
    </div>

    <div class="chapter-reading-actions">
      ${
        previousChapter
          ? `<a class="btn btn-outline" href="${getChapterUrl(subjectId, previousChapter)}">Previous Chapter</a>`
          : `<a class="btn btn-outline" href="courses.html">Choose Another Chapter</a>`
      }
      ${
        nextChapter
          ? `<a class="btn btn-primary" href="${getChapterUrl(subjectId, nextChapter)}">Next Chapter</a>`
          : `<a class="btn btn-primary" href="courses.html">Finish Subject</a>`
      }
    </div>
  `;
})();
