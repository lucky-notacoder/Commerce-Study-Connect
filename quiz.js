(function () {
  const testData = window.testData || {};
  const courseCatalog = window.courseCatalog || [];
  const quizContent = document.getElementById("quiz-content");
  const quizTitle = document.getElementById("quiz-title");
  const performanceBtn = document.getElementById("performance-tab");
  const performanceContent = document.getElementById("performance-content");
  const performanceStorageKey = "commerceStudyQuizPerformance";

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

  const getStoredPerformance = () => {
    try {
      return JSON.parse(localStorage.getItem(performanceStorageKey)) || [];
    } catch (error) {
      return [];
    }
  };

  const saveStoredPerformance = (attempts) => {
    localStorage.setItem(performanceStorageKey, JSON.stringify(attempts));
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const togglePerformanceView = (showPerformance) => {
    if (!performanceContent) {
      return;
    }

    performanceContent.hidden = !showPerformance;
    quizContent.hidden = showPerformance;
    performanceBtn?.classList.toggle("active", showPerformance);
  };

  const renderPerformance = () => {
    const attempts = getStoredPerformance();

    if (!performanceContent) {
      return;
    }

    performanceContent.innerHTML = `
      <div class="performance-card">
        <div class="performance-header">
          <div>
            <span class="eyebrow">Performance</span>
            <h2>Your Quiz History</h2>
          </div>
          <button type="button" class="btn btn-secondary" id="back-to-quiz-btn">Back to Quiz</button>
        </div>
        <p class="muted">Quiz attempts are saved locally and will appear here after you submit.</p>
        ${attempts.length ? `
          <div class="performance-table-wrapper">
            <table class="performance-table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${attempts
                  .map(
                    (attempt) => `
                      <tr>
                        <td>${escapeHtml(attempt.subjectName)}</td>
                        <td>${attempt.correct}/${attempt.totalQuestions}</td>
                        <td>${attempt.percentage}%</td>
                        <td>${escapeHtml(formatDate(attempt.date))}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="performance-no-data">
            <p>No quiz attempts found yet.</p>
            <p class="performance-details">Complete a quiz and submit your answers to track your performance here.</p>
          </div>
        `}
      </div>
    `;

    togglePerformanceView(true);
  };

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
      <div class="quiz-footer">
        <button type="button" class="btn btn-primary" id="submit-quiz-btn">Submit Quiz</button>
        <p class="muted">Submit your answers when you finish the last question.</p>
      </div>
    `;
    if (performanceContent) {
      performanceContent.hidden = true;
    }
    if (quizContent) {
      quizContent.hidden = false;
    }
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
    const attempts = getStoredPerformance();

    const attempt = {
      subjectName,
      correct,
      totalQuestions,
      percentage,
      date: new Date().toISOString(),
    };

    attempts.unshift(attempt);
    saveStoredPerformance(attempts.slice(0, 20));

    alert(
      `Quiz Complete!\n\nSubject: ${subjectName}\nScore: ${correct}/${totalQuestions} (${percentage}%)\n\nYour attempt has been saved to the Performance tab.`
    );

    renderPerformance();
  };

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target instanceof HTMLElement && target.matches("#submit-quiz-btn")) {
      calculateScore();
    }

    if (target instanceof HTMLElement && target.matches("#back-to-quiz-btn")) {
      togglePerformanceView(false);
    }
  });

  performanceBtn?.addEventListener("click", () => {
    renderPerformance();
  });

  renderQuiz();
})();