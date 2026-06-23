(function () {
  const storageKey = "commerceStudyCourseChoices";
  const courseLevels = window.courseCatalog || [];
  const subjectChapters = window.subjectChapters || {};
  let expandedLevelId = "";
  let selectedSubjectId = "";

  if (!courseLevels.length) {
    return;
  }

  const getStoredChoices = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (error) {
      return {};
    }
  };

  const saveStoredChoices = (choices) => {
    localStorage.setItem(storageKey, JSON.stringify(choices));
  };

  const toSlug = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const getSubjectsWithChoices = () => {
    const choices = getStoredChoices();

    return courseLevels.flatMap((level) =>
      level.subjects.map((subject) => {
        const id = `${toSlug(level.level)}-${toSlug(subject.name)}`;

        return {
          ...subject,
          id,
          level: level.level,
          liveSessions: level.liveSessions,
          chosen: choices[id] || 0,
        };
      })
    );
  };

  const setText = (id, value) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  };

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const renderDashboard = (subjectsWithChoices) => {
    const topSubject = subjectsWithChoices.reduce((currentTop, subject) =>
      subject.chosen > currentTop.chosen ? subject : currentTop
    );
    const averageSatisfaction = Math.round(
      subjectsWithChoices.reduce(
        (total, subject) => total + subject.satisfaction,
        0
      ) / subjectsWithChoices.length
    );
    const sessionFrequency = courseLevels.reduce((counts, level) => {
      counts[level.liveSessions] = (counts[level.liveSessions] || 0) + 1;
      return counts;
    }, {});
    const liveSessionText = Object.entries(sessionFrequency).sort(
      (first, second) => second[1] - first[1]
    )[0][0];
    const hasChosenSubject = subjectsWithChoices.some(
      (subject) => subject.chosen > 0
    );
    const caFoundation = courseLevels.find(
      (level) => level.level === "CA Foundation"
    );
    const cmaFoundation = courseLevels.find(
      (level) => level.level === "CMA Foundation"
    );

    setText(
      "top-course-name",
      hasChosenSubject
        ? `${topSubject.level}: ${topSubject.name}`
        : "No subject chosen yet"
    );
    setText(
      "top-course-badge",
      hasChosenSubject ? `${topSubject.chosen} chosen` : "Choose a subject"
    );
    setText("course-count", String(courseLevels.length).padStart(2, "0"));
    setText("subject-count", String(subjectsWithChoices.length).padStart(2, "0"));
    setText("satisfaction-rate", `${averageSatisfaction}%`);
    setText("ca-subject-count", caFoundation ? caFoundation.subjects.length : 0);
    setText(
      "cma-subject-count",
      cmaFoundation ? cmaFoundation.subjects.length : 0
    );
    setText("live-session-frequency", liveSessionText);
  };

  const renderCourseList = (subjectsWithChoices) => {
    const courseList = document.getElementById("course-list");

    if (!courseList) {
      return;
    }

    courseList.innerHTML = courseLevels
      .map((level) => {
        const levelId = toSlug(level.level);
        const isExpanded = expandedLevelId === levelId;
        const subjects = subjectsWithChoices.filter(
          (subject) => subject.level === level.level
        );

        return `
          <article class="level-card ${isExpanded ? "is-expanded" : ""}">
            <button class="level-heading" type="button" data-level-id="${levelId}" aria-expanded="${isExpanded}">
              <span class="eyebrow">${level.level}</span>
              <strong>${subjects.length} subjects</strong>
            </button>
            ${
              isExpanded
                ? `
                  <div class="subject-grid">
                    ${subjects
                      .map(
                        (subject) => `
                          <div class="feature-card ${selectedSubjectId === subject.id ? "is-selected" : ""}">
                            <h3>${subject.name}</h3>
                            <p>${subject.description}</p>
                            <p class="course-meta">${subject.chosen} times chosen.</p>
                            <button class="btn btn-primary course-choice" type="button" data-course-id="${subject.id}">
                              ${selectedSubjectId === subject.id ? "Selected" : "Choose Subject"}
                            </button>
                            ${
                              selectedSubjectId === subject.id
                                ? `
                                  <div class="chapter-panel">
                                    <h4>Chapters</h4>
                                    <ol class="chapter-list">
                                      ${(subjectChapters[subject.id] || ["Chapters will be updated soon."])
                                        .map(
                                          (chapter) => `
                                            <li>
                                              <a class="chapter-button" href="chapter.html?subject=${encodeURIComponent(subject.id)}&chapter=${encodeURIComponent(chapter)}">
                                                ${escapeHtml(chapter)}
                                              </a>
                                            </li>
                                          `
                                        )
                                        .join("")}
                                    </ol>
                                  </div>
                                `
                                : ""
                            }
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : ""
            }
          </article>
        `;
      })
      .join("");
  };

  const render = () => {
    const subjectsWithChoices = getSubjectsWithChoices();
    renderDashboard(subjectsWithChoices);
    renderCourseList(subjectsWithChoices);
  };

  document.addEventListener("click", (event) => {
    const levelButton = event.target.closest("[data-level-id]");

    if (levelButton) {
      const levelId = levelButton.dataset.levelId;
      expandedLevelId = expandedLevelId === levelId ? "" : levelId;
      render();
      return;
    }

    const button = event.target.closest("[data-course-id]");

    if (!button) {
      return;
    }

    const choices = getStoredChoices();
    const courseId = button.dataset.courseId;
    choices[courseId] = (choices[courseId] || 0) + 1;
    selectedSubjectId = courseId;
    saveStoredChoices(choices);
    render();
  });

  render();
})();
