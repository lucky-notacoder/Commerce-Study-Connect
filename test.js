(() => {
  const courseCatalog = window.courseCatalog || [];
  const testData = window.testData || {};
  const subjectList = document.getElementById("test-subject-list");
  const moduleList = document.getElementById("test-module-list");
  let expandedPracticeLevelId = "";
  let expandedModuleLevelId = "";

  if ((!subjectList && !moduleList) || !courseCatalog.length) {
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
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getQuestionCount = (subjectId) =>
    Object.values(testData[subjectId] || {}).flat().length;

  const getModuleLinks = (subjectId) => {
    const questionCount = getQuestionCount(subjectId);

    const moduleLinks = [1, 2, 3]
      .map(
        (set) => `
          <a class="btn btn-outline" href="quiz.html?subject=${encodeURIComponent(subjectId)}&paper=${set}">
            Model Paper - Set ${set}
          </a>
        `,
      )
      .join("");

    return `
      <p class="course-meta">${questionCount ? `${questionCount} MCQs available` : "Model papers ready for question data"}</p>
      <div class="test-module-list" aria-label="Model question papers">
        ${moduleLinks}
      </div>
    `;
  };

  const renderPracticeLevels = () => {
    if (!subjectList) {
      return;
    }

    if (!courseCatalog.length) {
      subjectList.innerHTML =
        '<p class="muted">No subjects are available for test selection.</p>';
      return;
    }

    subjectList.innerHTML = courseCatalog
      .map((course) => {
        const levelId = toSlug(course.level);
        const isExpanded = expandedPracticeLevelId === levelId;

        return `
          <article class="level-card ${isExpanded ? "is-expanded" : ""}">
            <button class="level-heading" type="button" data-level-id="${levelId}" aria-expanded="${isExpanded}">
              <span class="eyebrow">${course.level}</span>
              <strong>${course.subjects.length} subjects</strong>
            </button>
            ${
              isExpanded
                ? `
                  <div class="subject-grid">
                    ${course.subjects
                      .map((subject) => {
                        const subjectId = `${levelId}-${toSlug(subject.name)}`;

                        return `
                          <article class="feature-card">
                            <h3>${escapeHtml(subject.name)}</h3>
                            <p>${escapeHtml(subject.description)}</p>
                            <p class="course-meta">Satisfaction: ${subject.satisfaction}%</p>
                            <a class="btn btn-primary" href="quiz.html?subject=${encodeURIComponent(subjectId)}">Question Bank Practice</a>
                          </article>
                        `;
                      })
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

  const renderModuleLevels = () => {
    if (!moduleList) {
      return;
    }

    if (!courseCatalog.length) {
      moduleList.innerHTML =
        '<p class="muted">No test modules are available yet.</p>';
      return;
    }

    moduleList.innerHTML = courseCatalog
      .map((course) => {
        const levelId = toSlug(course.level);
        const isExpanded = expandedModuleLevelId === levelId;

        return `
          <article class="level-card ${isExpanded ? "is-expanded" : ""}">
            <button class="level-heading" type="button" data-module-level-id="${levelId}" aria-expanded="${isExpanded}">
              <span class="eyebrow">${escapeHtml(course.level)}</span>
              <strong>${course.subjects.length} subjects</strong>
            </button>
            ${
              isExpanded
                ? `
                  <div class="subject-grid">
                    ${course.subjects
                      .map((subject) => {
                        const subjectId = `${levelId}-${toSlug(subject.name)}`;
                        return `
                          <article class="feature-card">
                            <h3>${escapeHtml(subject.name)}</h3>
                            <p>${escapeHtml(subject.description)}</p>
                            ${getModuleLinks(subjectId)}
                          </article>
                        `;
                      })
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
    renderPracticeLevels();
    renderModuleLevels();
  };

  document.addEventListener("click", (event) => {
    const levelButton = event.target.closest("[data-level-id]");
    if (levelButton) {
      const levelId = levelButton.dataset.levelId;
      expandedPracticeLevelId =
        expandedPracticeLevelId === levelId ? "" : levelId;
      render();
      return;
    }

    const moduleLevelButton = event.target.closest("[data-module-level-id]");
    if (moduleLevelButton) {
      const levelId = moduleLevelButton.dataset.moduleLevelId;
      expandedModuleLevelId = expandedModuleLevelId === levelId ? "" : levelId;
      render();
    }
  });

  render();
})();
