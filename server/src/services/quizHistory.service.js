import pool from '../config/database.js';

export const getQuizHistory = async (userId, moduleId) => {
  const result = await pool.query(
    `SELECT
        q.id AS quiz_id,
        q.module_id,
        q.title,

        (latest_attempt.id IS NOT NULL) AS has_been_attempted,

        latest_attempt.id AS latest_attempt_id,
        latest_attempt.score AS latest_score,
        latest_attempt.is_passed AS latest_is_passed,
        latest_attempt.started_at AS latest_started_at,
        latest_attempt.completed_at AS latest_completed_at

     FROM quizzes q

     LEFT JOIN LATERAL (
       SELECT
          qa.id,
          qa.score,
          qa.is_passed,
          qa.started_at,
          qa.completed_at

       FROM quiz_attempts qa

       WHERE qa.quiz_id = q.id
         AND qa.user_id = $1
         AND qa.completed_at IS NOT NULL

       ORDER BY qa.completed_at DESC

       LIMIT 1
     ) latest_attempt ON TRUE

     WHERE q.module_id = $2
       AND q.is_published = TRUE

     LIMIT 1`,
    [userId, moduleId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const history = result.rows[0];

  return {
    quiz_id: history.quiz_id,
    module_id: history.module_id,
    title: history.title,

    has_been_attempted: history.has_been_attempted,

    latest_attempt: history.latest_attempt_id
      ? {
          id: history.latest_attempt_id,
          score:
            history.latest_score === null
              ? null
              : Number(history.latest_score),
          is_passed: history.latest_is_passed,
          started_at: history.latest_started_at,
          completed_at: history.latest_completed_at,
        }
      : null,
  };
};