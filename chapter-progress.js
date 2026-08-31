(() => {
  const button = document.getElementById("complete-chapter-btn");
  const client = window.studySupabaseClient;
  if (!button || !client) return;

  const chapterKey = `${button.dataset.subjectId}:${button.dataset.chapterName}`;

  const showNextChapter = () => {
    const nextButton = document.createElement("a");
    nextButton.className = "btn btn-primary";
    nextButton.href = button.dataset.nextChapterUrl;
    nextButton.textContent = button.dataset.nextChapterLabel;
    button.replaceWith(nextButton);
  };

  const loadNextChapter = () => {
    window.location.assign(button.dataset.nextChapterUrl);
  };

  const getChapterName = (chapter) =>
    typeof chapter === "string" ? chapter : chapter?.name || "";
  const getChapterUnits = (chapter) =>
    chapter && typeof chapter === "object" && Array.isArray(chapter.units)
      ? chapter.units
      : [];
  const getAllChapterKeys = () => Object.entries(window.subjectChapters || {}).flatMap(
    ([subjectId, chapters]) => chapters.flatMap((chapter) => {
      const name = getChapterName(chapter);
      const units = getChapterUnits(chapter);
      return [name, ...units].filter(Boolean).map((chapterName) => `${subjectId}:${chapterName}`);
    })
  );

  const getSession = async () => {
    const { data } = await client.auth.getSession();
    return data.session;
  };

  const loadState = async (userId) => {
    const { data } = await client
      .from("student_progress")
      .select("completed_chapters, completed_courses")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      chapters: Array.isArray(data?.completed_chapters) ? data.completed_chapters : [],
      courses: Array.isArray(data?.completed_courses) ? data.completed_courses : []
    };
  };

  getSession().then(async (session) => {
    if (!session) {
      button.textContent = "Sign in to Track Completion";
      return;
    }

    const progress = await loadState(session.user.id);
    if (progress.chapters.includes(chapterKey)) {
      showNextChapter();
    }
  });

  button.addEventListener("click", async () => {
    const session = await getSession();
    if (!session) {
      document.querySelector(".auth-trigger")?.click();
      return;
    }

    button.disabled = true;
    const progress = await loadState(session.user.id);
    const completedChapters = progress.chapters;
    const completedCourses = progress.courses;
    if (!completedChapters.includes(chapterKey)) completedChapters.push(chapterKey);
    const allChapterKeys = getAllChapterKeys();
    const subjectChapterKeys = allChapterKeys.filter((key) => key.startsWith(`${button.dataset.subjectId}:`));
    if (subjectChapterKeys.every((key) => completedChapters.includes(key)) && !completedCourses.includes(button.dataset.subjectId)) {
      completedCourses.push(button.dataset.subjectId);
    }

    const { error } = await client.from("student_progress").upsert({
      user_id: session.user.id,
      course_name: button.dataset.subjectName,
      completed_chapters: completedChapters,
      lessons_completed: completedChapters.length,
      total_lessons: allChapterKeys.length,
      completed_courses: completedCourses,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

    button.disabled = false;
    if (error) {
      button.textContent = "Could not save completion";
      return;
    }

    loadNextChapter();
  });
})();