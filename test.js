(function () {
  const courseCatalog = window.courseCatalog || [];
  const subjectList = document.getElementById("test-subject-list");
  let expandedLevelId = "";

  if (!subjectList || !courseCatalog.length) {
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

  const renderLevels = () => {
    if (!courseCatalog.length) {
      subjectList.innerHTML =
        '<p class="muted">No subjects are available for test selection.</p>';
      return;
    }

    subjectList.innerHTML = courseCatalog
      .map((course) => {
        const levelId = toSlug(course.level);
        const isExpanded = expandedLevelId === levelId;

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
                            <a class="btn btn-primary" href="quiz.html?subject=${encodeURIComponent(subjectId)}">Start Test</a>
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
    renderLevels();
  };

  document.addEventListener("click", (event) => {
    const levelButton = event.target.closest("[data-level-id]");
    if (levelButton) {
      const levelId = levelButton.dataset.levelId;
      expandedLevelId = expandedLevelId === levelId ? "" : levelId;
      render();
    }
  });

  render();
})();