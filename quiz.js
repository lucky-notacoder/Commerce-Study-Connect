(function () {
  const testData = window.testData || {};
  const courseCatalog = window.courseCatalog || [];
  const quizContent = document.getElementById("quiz-content");
  const quizTitle = document.getElementById("quiz-title");
  const performanceBtn = document.getElementById("performance-tab");
  const performanceContent = document.getElementById("performance-content");
  const modelPaperSize = 15;

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

  const saveSupabasePerformance = async (attempt) => {
    const client = window.studySupabaseClient;
    if (!client) return;

    const { data } = await client.auth.getSession();
    const user = data.session?.user;
    if (!user) return;

    await client.from("student_progress").upsert({
      user_id: user.id,
      course_name: attempt.subjectName,
      quiz_score: attempt.percentage,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

    await client.from("quiz_attempts").insert({
      user_id: user.id,
      subject_name: attempt.subjectName,
      correct_answers: attempt.correct,
      total_questions: attempt.totalQuestions,
      percentage: attempt.percentage,
      attempted_at: attempt.date
    });
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

  const getPerformanceAttempts = async () => {
    const client = window.studySupabaseClient;
    if (!client) return [];
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return [];
    const { data, error } = await client
      .from("quiz_attempts")
      .select("subject_name, correct_answers, total_questions, percentage, attempted_at")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false });
    if (error) return [];
    return (data || []).map((attempt) => ({
      subjectName: attempt.subject_name,
      correct: attempt.correct_answers,
      totalQuestions: attempt.total_questions,
      percentage: attempt.percentage,
      date: attempt.attempted_at
    }));
  };

  const renderPerformance = async () => {
    const attempts = await getPerformanceAttempts();

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
        <p class="muted">Only your signed-in account's quiz attempts appear here.</p>
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
            <p>No quiz attempts found for this account yet.</p>
            <p class="performance-details">Sign in and complete a quiz to track your personal performance here.</p>
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

  const getModelPaperNumber = () => {
    const paper = Number(getUrlParameter("paper"));
    return Number.isInteger(paper) && paper >= 1 && paper <= 3 ? paper : 0;
  };

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const supportsSectionB = (subjectId) =>
    /^(ca-intermediate|cma-intermediate|ca-final|cma-final)-/.test(subjectId);

  const renderSectionB = (subjectId, paperNumber) => {
    if (!paperNumber || !supportsSectionB(subjectId)) return "";

    const sectionBPapers = window.sectionBData?.[subjectId] || {};
    const selectedPaper = sectionBPapers[paperNumber] || {};
    const questionBank = Object.entries(selectedPaper)
      .filter(([questionNumber, question]) =>
        /^\d+$/.test(questionNumber) && question?.a && question?.b
      )
      .map(([, question]) => question);

    const questions = shuffle(questionBank.slice())
      .slice(0, 8)
      .map((question, index) => ({ number: index + 2, ...question }));
    window._currentSectionBQuestions = questions;

    return `
      <section class="section-b-paper" aria-labelledby="section-b-heading">
        <div class="section-paper-heading">
          <span class="eyebrow">Section B</span>
          <h2 id="section-b-heading">Descriptive Questions</h2>
          <p>Attempt any five questions. Each question has Part (a) and Part (b).</p>
        </div>
        <div class="section-b-questions">
          ${questions.map((question) => `
            <article class="section-b-question">
              <h3>Question ${question.number}</h3>
              <div class="section-b-part">
                <p><strong>(a)</strong> ${escapeHtml(question.a || "Question will be added here.")}</p>
                <label for="section-b-${question.number}-a">Your answer</label>
                <textarea id="section-b-${question.number}-a" name="section-b-${question.number}-a" rows="5" placeholder="Write your answer here..."></textarea>
                <label class="section-b-file-label" for="section-b-${question.number}-a-file">Attach a file (optional)</label>
                <input id="section-b-${question.number}-a-file" name="section-b-${question.number}-a-file" type="file" accept=".pdf,.doc,.docx,image/*" />
              </div>
              <div class="section-b-part">
                <p><strong>(b)</strong> ${escapeHtml(question.b || "Question will be added here.")}</p>
                <label for="section-b-${question.number}-b">Your answer</label>
                <textarea id="section-b-${question.number}-b" name="section-b-${question.number}-b" rows="5" placeholder="Write your answer here..."></textarea>
                <label class="section-b-file-label" for="section-b-${question.number}-b-file">Attach a file (optional)</label>
                <input id="section-b-${question.number}-b-file" name="section-b-${question.number}-b-file" type="file" accept=".pdf,.doc,.docx,image/*" />
              </div>
            </article>
          `).join("")}
        </div>
      </section>`;
  };

  const renderQuiz = () => {
    const subjectId = getUrlParameter("subject");

    if (!subjectId) {
      quizContent.innerHTML =
        '<p class="muted">No subject selected. Please go back and select a subject.</p>';
      return;
    }

    const questions = testData[subjectId];
    window._currentSectionBQuestions = [];

    if (!questions) {
      quizContent.innerHTML =
        '<p class="muted">No questions available for this subject.</p>';
      return;
    }

    // Model papers and Question Bank Practice use 15-question sets.
    const allQuestionsArray = Object.values(questions).flat();
    const totalAvailable = allQuestionsArray.length;
    const modelPaperNumber = getModelPaperNumber();

    let renderQuestionsObj = questions;
    let quizLabel = getSubjectName(subjectId);

    if (modelPaperNumber) {
      renderQuestionsObj = {
        [`Model Question Paper - Set ${modelPaperNumber}`]: shuffle(
          allQuestionsArray.slice()
        ).slice(0, modelPaperSize),
      };
      quizLabel += ` - Model Question Paper Set ${modelPaperNumber}`;
    } else if (totalAvailable > modelPaperSize) {
      const sampled = shuffle(allQuestionsArray.slice()).slice(0, modelPaperSize);
      renderQuestionsObj = { "Random 15 MCQs": sampled };
    }

    // expose the currently-rendered questions for scoring and submission
    window._currentQuizQuestions = renderQuestionsObj;
    window._currentQuizLabel = quizLabel;

    quizTitle.innerHTML = `
      <span class="eyebrow">Quiz</span>
      <h1>${escapeHtml(quizLabel)}</h1>
    `;

    const totalQuestions = Object.values(window._currentQuizQuestions).flat().length;
    // global counter to show sequential numbers (1..N) irrespective of original question IDs
    let qCounter = 0;
    quizContent.innerHTML = `
      <div class="quiz-info">
        <p class="quiz-stats">Total Questions: <strong>${totalQuestions}</strong></p>
      </div>
      <section class="section-a-paper">
        <div class="section-paper-heading">
          <span class="eyebrow">Section A</span>
          <h2>Multiple Choice Questions</h2>
          <p>Answer all 15 MCQs.</p>
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
      </section>
      ${renderSectionB(subjectId, modelPaperNumber)}
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
    let questionNumber = 0;
    const mcqReview = [];
    const totalQuestions = Object.values(questions).flat().length;

    Object.values(questions).forEach((chapterQuestions, chapterIndex) => {
      chapterQuestions.forEach((q, questionIndex) => {
        questionNumber++;
        const inputName = `q-${chapterIndex}-${questionIndex}`;
        const selectedOption = document.querySelector(
          `input[name="${inputName}"]:checked`
        );
        const attemptedAnswer = selectedOption?.value || "";
        let correctOption = "";
        let correctAnswer = "";

        if (q.answerCode !== undefined && q.answerCode !== null && q.answerCode !== "") {
          const answerCode = Number(q.answerCode);
          const optionIndex = Number.isInteger(answerCode)
            ? typeof q.answerCode === "string"
              ? answerCode - 1
              : answerCode
            : -1;
          correctOption = q.options[optionIndex] || "";
          correctAnswer = correctOption ? correctOption[0] : "";
        } else {
          correctAnswer = q.correctAnswer || "";
          correctOption =
            q.options.find((option) => option.startsWith(correctAnswer)) || correctAnswer;
        }

        const isCorrect = Boolean(attemptedAnswer) && attemptedAnswer === correctAnswer;

        if (isCorrect) {
          correct++;
        }

        mcqReview.push({
          number: questionNumber,
          question: q.question,
          attemptedAnswer,
          correctAnswer,
          attemptedOption: attemptedAnswer
            ? q.options.find((option) => option.startsWith(attemptedAnswer)) || attemptedAnswer
            : "Not attempted",
          correctOption,
          marks: isCorrect ? 2 : 0,
        });
      });
    });

    const percentage = Math.round((correct / totalQuestions) * 100);
    const subjectName =
      window._currentQuizLabel || getSubjectName(subjectId);
    const attempt = {
      subjectName,
      correct,
      totalQuestions,
      percentage,
      date: new Date().toISOString(),
    };

    saveSupabasePerformance(attempt);

    const sectionBReview = (window._currentSectionBQuestions || [])
      .map((question) => {
        const getResponse = (part) => {
          const answer = document.querySelector(
            `textarea[name="section-b-${question.number}-${part}"]`
          )?.value.trim();
          const file = document.querySelector(
            `input[name="section-b-${question.number}-${part}-file"]`
          )?.files?.[0];
          return { answer: answer || "Not attempted", fileName: file?.name || "" };
        };

        return { question, a: getResponse("a"), b: getResponse("b") };
      })
      .map(({ question, a, b }) => `
        <article class="answer-review-card section-b-review-card">
          <h3>Question ${question.number}</h3>
          ${["a", "b"].map((part) => {
            const response = part === "a" ? a : b;
            const modelAnswer = question.answers?.[part] || "Model answer will be added soon.";
            return `
              <div class="descriptive-review-part">
                <div class="review-part-heading">
                  <strong>(${part})</strong>
                  <span class="pending-marks">Marks: Pending / 7</span>
                </div>
                <p class="review-question">${escapeHtml(question[part])}</p>
                <p><strong>Your answer:</strong></p>
                <div class="written-answer">${escapeHtml(response.answer)}</div>
                ${response.fileName ? `<p class="attached-file"><strong>Attached file:</strong> ${escapeHtml(response.fileName)}</p>` : ""}
                <p><strong>Model answer:</strong></p>
                <div class="model-answer">${escapeHtml(modelAnswer)}</div>
              </div>`;
          }).join("")}
        </article>`)
      .join("");

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
        <section class="answer-review-section">
          <h3>Section A: MCQ Answer Review</h3>
          <p class="muted">Marks shown as correct = 2 and incorrect/unattempted = 0.</p>
          <div class="answer-review-list">
            ${mcqReview.map((item) => `
              <article class="answer-review-card ${item.marks ? "is-correct" : "is-incorrect"}">
                <div class="review-card-heading">
                  <strong>Question ${item.number}</strong>
                  <span class="review-marks">Marks: ${item.marks}</span>
                </div>
                <p>${escapeHtml(item.question)}</p>
                <p><strong>Your answer:</strong> ${escapeHtml(item.attemptedOption)}</p>
                <p><strong>Correct answer:</strong> ${escapeHtml(item.correctOption)}</p>
              </article>`).join("")}
          </div>
        </section>
        ${sectionBReview ? `
          <section class="answer-review-section">
            <h3>Section B: Descriptive Answer Review</h3>
            <p class="muted">Marks will appear here once AI rubric evaluation is enabled.</p>
            <div class="answer-review-list">${sectionBReview}</div>
          </section>` : ""}
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
