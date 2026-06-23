(function () {
  const testData = window.testData || {};
  const courseCatalog = window.courseCatalog || [];
  const quizContent = document.getElementById("quiz-content");
  const quizTitle = document.getElementById("quiz-title");
  const submitBtn = document.getElementById("submit-quiz");

  const getUrlParameter = (param) => {
    const url = new URLSearchParams(window.location.search);
    return url.get(param);
  };

  const toSlug = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const unSlug = (slug) =>
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getSubjectName = (subjectId) => {
    const parts = subjectId.split("-");
    const levelSlug = parts[0];
    
    for (const course of courseCatalog) {
      if (toSlug(course.level) === levelSlug) {
        for (const subject of course.subjects) {
          if (toSlug(subject.name) === parts.slice(1).join("-")) {
            return subject.name;
          }
        }
      }
    }
    return unSlug(subjectId);
  };

  const renderQuiz = () => {
    const subjectId = getUrlParameter("subject");

    if (!subjectId) {
      quizContent.innerHTML =
        '<p class="muted">No subject selected. Please go back and select a subject.</p>';
      return;
    }

    const questions = testData[subjectId];

    if (!questions) {
      quizContent.innerHTML =
        '<p class="muted">No questions available for this subject.</p>';
      return;
    }

    const subjectName = getSubjectName(subjectId);
    quizTitle.innerHTML = `
      <span class="eyebrow">Quiz</span>
      <h1>${escapeHtml(subjectName)}</h1>
    `;

    const totalQuestions = Object.values(questions).flat().length;
    quizContent.innerHTML = `
      <div class="quiz-info">
        <p class="quiz-stats">Total Questions: <strong>${totalQuestions}</strong></p>
      </div>
      ${Object.entries(questions)
        .map(
          ([chapterName, chapterQuestions]) => `
            <section class="chapter-section">
              <h2 class="chapter-heading">${escapeHtml(chapterName)}</h2>
              <div class="questions-container">
                ${chapterQuestions
                  .map(
                    (q) => `
                      <article class="question-card">
                        <div class="question-header">
                          <span class="question-number">Q${q.id}</span>
                          <p class="question-text">${escapeHtml(q.question)}</p>
                        </div>
                        <div class="options-list">
                          ${q.options
                            .map(
                              (option) => `
                                <label class="option-label">
                                  <input type="radio" name="q${q.id}" value="${option[0]}" class="question-input" />
                                  <span>${escapeHtml(option)}</span>
                                </label>
                              `
                            )
                            .join("")}
                        </div>
                        <details class="question-details">
                          <summary>Show Explanation</summary>
                          <p>${escapeHtml(q.explanation)}</p>
                        </details>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
        )
        .join("")}
    `;
  };

  const calculateScore = () => {
    const subjectId = getUrlParameter("subject");
    const questions = testData[subjectId];

    if (!questions) return;

    let correct = 0;
    const totalQuestions = Object.values(questions).flat().length;

    Object.values(questions).forEach((chapterQuestions) => {
      chapterQuestions.forEach((q) => {
        const selectedOption = document.querySelector(`input[name="q${q.id}"]:checked`);
        if (selectedOption && selectedOption.value === q.correctAnswer) {
          correct++;
        }
      });
    });

    const percentage = Math.round((correct / totalQuestions) * 100);
    const subjectName = getSubjectName(subjectId);
    
    alert(
      `Quiz Complete!\n\nSubject: ${subjectName}\nScore: ${correct}/${totalQuestions} (${percentage}%)\n\nGreat effort! Review the explanations to strengthen your understanding.`
    );
  };

  submitBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    calculateScore();
  });

  renderQuiz();
})();