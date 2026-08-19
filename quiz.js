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
    for (const course of courseCatalog) {
      const levelSlug = toSlug(course.level);

      if (subjectId.startsWith(`${levelSlug}-`)) {
        const subjectSlug = subjectId.slice(levelSlug.length + 1);

        for (const subject of course.subjects) {
          if (toSlug(subject.name) === subjectSlug) {
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

    // If there are more than 20 questions available, pick a random set of 20
    // and keep the original `testData` untouched. Store the selected set on
    // `window._currentQuizQuestions` so scoring uses the same selection.
    const allQuestionsArray = Object.values(questions).flat();
    const totalAvailable = allQuestionsArray.length;

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
      }
      return array;
    }

    let renderQuestionsObj = questions;
    if (totalAvailable > 20) {
      const sampled = shuffle(allQuestionsArray.slice()).slice(0, 20);
      renderQuestionsObj = { "Random 20 MCQs": sampled };
    }

    // expose the currently-rendered questions for scoring and submission
    window._currentQuizQuestions = renderQuestionsObj;

    const subjectName = getSubjectName(subjectId);
    quizTitle.innerHTML = `
      <span class="eyebrow">Quiz</span>
      <h1>${escapeHtml(subjectName)}</h1>
    `;

    const totalQuestions = Object.values(window._currentQuizQuestions).flat().length;
    // global counter to show sequential numbers (1..N) irrespective of original question IDs
    let qCounter = 0;
    quizContent.innerHTML = `
      <div class="quiz-info">
        <p class="quiz-stats">Total Questions: <strong>${totalQuestions}</strong></p>
      </div>
      ${Object.entries(window._currentQuizQuestions)
        .map(
          ([chapterName, chapterQuestions], chapterIndex) => `
            <section class="chapter-section">
              <h2 class="chapter-heading">${escapeHtml(chapterName)}</h2>
              <div class="questions-container">
                ${chapterQuestions
                  .map(
                    (q, questionIndex) => {
                      const displayNumber = ++qCounter;
                      const inputName = `q-${chapterIndex}-${questionIndex}`;

                      return `
                        <article class="question-card">
                          <div class="question-header">
                            <span class="question-number">Q${displayNumber}</span>
                            <p class="question-text">${escapeHtml(q.question)}</p>
                          </div>
                          <div class="options-list">
                            ${q.options
                              .map(
                                (option) => `
                                  <label class="option-label">
                                    <input type="radio" name="${inputName}" value="${option[0]}" class="question-input" />
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
                      `;
                    }
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
    // Use the currently-rendered questions (may be a sampled set) so scoring
    // matches what the user saw. Fall back to the full test data if not set.
    const questions = window._currentQuizQuestions || testData[subjectId];

    if (!questions) return;

    let correct = 0;
    const totalQuestions = Object.values(questions).flat().length;

    Object.values(questions).forEach((chapterQuestions, chapterIndex) => {
      chapterQuestions.forEach((q, questionIndex) => {
        const inputName = `q-${chapterIndex}-${questionIndex}`;
        const selectedOption = document.querySelector(
          `input[name="${inputName}"]:checked`
        );

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

    // Show inline result with actions so user can take another random test
    const resultHtml = `
      <div class="quiz-result-card">
        <div class="performance-header">
          <div>
            <span class="eyebrow">Result</span>
            <h2>Score: ${correct}/${totalQuestions} (${percentage}%)</h2>
          </div>
        </div>
        <p>Your attempt has been saved to the Performance tab.</p>
        <div class="quiz-result-actions">
          <button type="button" class="btn btn-primary" id="next-test-btn">Next Test</button>
          <button type="button" class="btn btn-secondary" id="view-performance-btn">View Performance</button>
        </div>
      </div>
    `;

    quizContent.innerHTML = resultHtml;
    if (performanceContent) performanceContent.hidden = true;
  };

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target instanceof HTMLElement && target.matches("#submit-quiz-btn")) {
      calculateScore();
    }

    if (target instanceof HTMLElement && target.matches("#back-to-quiz-btn")) {
      togglePerformanceView(false);
    }

    if (target instanceof HTMLElement && target.matches("#next-test-btn")) {
      // Clear the previously-sampled questions so renderQuiz will pick a new random set
      window._currentQuizQuestions = null;
      renderQuiz();
    }

    if (target instanceof HTMLElement && target.matches("#view-performance-btn")) {
      renderPerformance();
    }
  });

  performanceBtn?.addEventListener("click", () => {
    renderPerformance();
  });

  renderQuiz();
})();
