(() => {
  const client = window.studySupabaseClient;
  if (!client) return;

  const setValue = (id, value) => {
    const element = document.getElementById(id);
    if (element && value !== null && value !== undefined) element.textContent = value;
  };

  const renderProgress = (progress) => {
    if (!progress) return;
    setValue("dashboard-course-name", progress.course_name);
    setValue("dashboard-course-status", progress.course_status);
    setValue("dashboard-progress", `${progress.progress_percent}%`);
    setValue("dashboard-lessons", progress.total_lessons);
    setValue("dashboard-rating", progress.rating);
    setValue("dashboard-quiz-score", progress.quiz_score);
    setValue("dashboard-lessons-completed", `${progress.lessons_completed}/${progress.total_lessons}`);
    setValue("dashboard-streak", `${progress.learning_streak} days`);
  };

  const loadProgress = async (userId) => {
    const { data, error } = await client
      .from("student_progress")
      .select("course_name, course_status, progress_percent, total_lessons, rating, quiz_score, lessons_completed, learning_streak")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error) renderProgress(data);
  };

  let subscribedUserId = null;
  client.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    if (!user || user.id === subscribedUserId) return;

    subscribedUserId = user.id;
    loadProgress(user.id);
    client
      .channel(`student-progress-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "student_progress",
        filter: `user_id=eq.${user.id}`
      }, (payload) => renderProgress(payload.new))
      .subscribe();
  });
})();