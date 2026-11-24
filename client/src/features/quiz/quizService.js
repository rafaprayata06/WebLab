
import pool from '../config/database.js';

const QUIZ_DURATION_SECONDS = 15 * 60;

// =====================================================
// HELPER: MODULE ACCESS
// =====================================================

/**
 * Memeriksa apakah modul sudah terbuka.
 * Mengikuti aturan akses yang digunakan learning.service.js.
 */
const getModuleAccessStatus = async (db, userId, moduleId) => {
  const result = await db.query(
    `SELECT
        m.id,
        m.slug,
        m.title,
        m.sort_order,
        m.is_published,

        CASE
          WHEN m.sort_order = 1 THEN TRUE

          ELSE EXISTS (
            SELECT 1
            FROM modules previous_module

            WHERE previous_module.sort_order < m.sort_order
              AND previous_module.is_published = TRUE

              AND NOT EXISTS (
                SELECT 1
                FROM modules closer_module
                WHERE closer_module.sort_order < m.sort_order
                  AND closer_module.sort_order > previous_module.sort_order
                  AND closer_module.is_published = TRUE
              )

              AND NOT EXISTS (
                SELECT 1
                FROM submodules previous_submodule
                WHERE previous_submodule.module_id = previous_module.id
                  AND previous_submodule.is_published = TRUE

                  AND NOT EXISTS (
                    SELECT 1
                    FROM user_submodule_progress previous_progress
                    WHERE previous_progress.user_id = $1
                      AND previous_progress.submodule_id = previous_submodule.id
                      AND previous_progress.completed_at IS NOT NULL
                  )
              )

              AND (
                previous_module.sort_order = 1

                OR (
                  NOT EXISTS (
                    SELECT 1
                    FROM lab_exercises le

                    JOIN lab_exercise_submodules les
                      ON les.lab_exercise_id = le.id

                    JOIN submodules lab_submodule
                      ON lab_submodule.id = les.submodule_id

                    LEFT JOIN user_lab_progress ulp
                      ON ulp.lab_exercise_id = le.id
                     AND ulp.user_id = $1

                    WHERE lab_submodule.module_id = previous_module.id
                      AND ulp.completed_at IS NULL
                  )

                  AND EXISTS (
                    SELECT 1
                    FROM quizzes q

                    JOIN quiz_attempts qa
                      ON qa.quiz_id = q.id

                    WHERE q.module_id = previous_module.id
                      AND q.is_published = TRUE
                      AND qa.user_id = $1
                      AND qa.is_passed = TRUE
                  )
                )
              )
          )
        END AS is_unlocked

      FROM modules m

      WHERE m.id = $2
        AND m.is_published = TRUE`,
    [userId, moduleId]
  );

  return result.rows[0] || null;
};

// =====================================================
// HELPER: QUIZ ACCESS
// =====================================================

/**
 * Memastikan user memenuhi seluruh persyaratan Quiz:
 * 1. Modul tersedia dan sudah terbuka.
 * 2. Semua submodul modul tersebut selesai.
 * 3. Semua Lab checkpoint modul tersebut selesai.
 * 4. Quiz sudah dipublikasikan.
 */
const assertQuizAccessible = async (db, userId, moduleId) => {
  const module = await getModuleAccessStatus(
    db,
    userId,
    moduleId
  );

  if (!module) {
    throw new Error('Modul tidak ditemukan atau belum tersedia.');
  }

  if (!module.is_unlocked) {
    throw new Error(
      'Modul masih terkunci. Selesaikan persyaratan modul sebelumnya.'
    );
  }

  // Periksa seluruh submodul pada modul ini.
  const incompleteSubmodules = await db.query(
    `SELECT s.id
     FROM submodules s

     LEFT JOIN user_submodule_progress p
       ON p.submodule_id = s.id
      AND p.user_id = $1

     WHERE s.module_id = $2
       AND s.is_published = TRUE
       AND p.completed_at IS NULL

     LIMIT 1`,
    [userId, moduleId]
  );

  if (incompleteSubmodules.rows.length > 0) {
    throw new Error(
      'Selesaikan seluruh materi pada modul ini sebelum mengikuti Quiz.'
    );
  }

  // Periksa seluruh Lab checkpoint pada modul ini.
  const incompleteLabs = await db.query(
    `SELECT le.id
     FROM lab_exercises le

     JOIN submodules anchor_submodule
       ON anchor_submodule.id = le.submodule_id

     LEFT JOIN user_lab_progress ulp
       ON ulp.lab_exercise_id = le.id
      AND ulp.user_id = $1

     WHERE anchor_submodule.module_id = $2
       AND anchor_submodule.is_published = TRUE
       AND ulp.completed_at IS NULL

     LIMIT 1`,
    [userId, moduleId]
  );

  if (incompleteLabs.rows.length > 0) {
    throw new Error(
      'Selesaikan seluruh Lab checkpoint pada modul ini sebelum mengikuti Quiz.'
    );
  }

  // Ambil Quiz yang sudah dipublikasikan.
  const quizResult = await db.query(
    `SELECT
        id,
        module_id,
        title,
        description,
        passing_score,
        question_count,
        is_published

     FROM quizzes

     WHERE module_id = $1
       AND is_published = TRUE

     LIMIT 1`,
    [moduleId]
  );

  if (quizResult.rows.length === 0) {
    throw new Error('Quiz untuk modul ini belum tersedia.');
  }

  return quizResult.rows[0];
};

// =====================================================
// HELPER: GET QUESTIONS
// =====================================================

/**
 * Mengambil soal tanpa membocorkan correct_answer.
 */
const getQuizQuestions = async (db, quizId) => {
  const result = await db.query(
    `SELECT
        id,
        quiz_id,
        question,
        question_type,
        options,
        points,
        sort_order

     FROM quiz_questions

     WHERE quiz_id = $1

     ORDER BY sort_order ASC`,
    [quizId]
  );

  return result.rows;
};

// =====================================================
// HELPER: ANSWER COMPARISON
// =====================================================

const isAnswerCorrect = (selectedAnswer, correctAnswer) => {
  if (selectedAnswer === null || selectedAnswer === undefined) {
    return false;
  }

  if (Array.isArray(selectedAnswer) && Array.isArray(correctAnswer)) {
    if (selectedAnswer.length !== correctAnswer.length) {
      return false;
    }

    const selected = [...selectedAnswer].map(String).sort();
    const correct = [...correctAnswer].map(String).sort();

    return selected.every((value, index) => value === correct[index]);
  }

  return JSON.stringify(selectedAnswer) === JSON.stringify(correctAnswer);
};

// =====================================================
// HELPER: VALIDATE ANSWER
// =====================================================

const validateSelectedAnswer = (question, selectedAnswer) => {
  if (selectedAnswer === null || selectedAnswer === undefined) {
    return;
  }

  if (question.question_type === 'multiple_choice') {
    const validValues = question.options.map((option) =>
      String(option.value)
    );

    if (!validValues.includes(String(selectedAnswer))) {
      throw new Error(
        `Jawaban untuk soal nomor ${question.sort_order} tidak valid.`
      );
    }

    return;
  }

  if (question.question_type === 'true_false') {
    const validValues = question.options.map((option) =>
      String(option.value)
    );

    if (!validValues.includes(String(selectedAnswer))) {
      throw new Error(
        `Jawaban untuk soal nomor ${question.sort_order} tidak valid.`
      );
    }

    return;
  }

  if (question.question_type === 'multiple_select') {
    if (!Array.isArray(selectedAnswer)) {
      throw new Error(
        `Jawaban soal nomor ${question.sort_order} harus berupa array.`
      );
    }

    const validValues = question.options.map((option) =>
      String(option.value)
    );

    const uniqueAnswers = [...new Set(selectedAnswer.map(String))];

    if (
      uniqueAnswers.length !== selectedAnswer.length ||
      uniqueAnswers.some((answer) => !validValues.includes(answer))
    ) {
      throw new Error(
        `Jawaban untuk soal nomor ${question.sort_order} tidak valid.`
      );
    }
  }
};

// =====================================================
// HELPER: CREATE ANSWER RECORDS
// =====================================================

/**
 * Menyimpan jawaban dan menghitung nilai.
 * Jawaban kosong mendapatkan 0 poin.
 */
const saveAndGradeAnswers = async (
  client,
  attemptId,
  questions,
  submittedAnswers
) => {
  const answerMap = new Map();

  for (const answer of submittedAnswers) {
    const questionId = String(answer.question_id);

    if (answerMap.has(questionId)) {
      throw new Error('Terdapat jawaban ganda untuk satu soal.');
    }

    answerMap.set(questionId, answer.selected_answer ?? null);
  }

  const questionIds = new Set(
    questions.map((question) => String(question.id))
  );

  for (const questionId of answerMap.keys()) {
    if (!questionIds.has(questionId)) {
      throw new Error('Terdapat ID soal yang tidak valid.');
    }
  }

  let earnedPoints = 0;
  let totalPoints = 0;

  const review = [];

  for (const question of questions) {
    const questionId = String(question.id);

    const selectedAnswer = answerMap.has(questionId)
      ? answerMap.get(questionId)
      : null;

    validateSelectedAnswer(question, selectedAnswer);

    const correct = isAnswerCorrect(
      selectedAnswer,
      question.correct_answer
    );

    const points = Number(question.points);
    const pointsAwarded = correct ? points : 0;

    totalPoints += points;
    earnedPoints += pointsAwarded;

    await client.query(
      `INSERT INTO quiz_attempt_answers (
          attempt_id,
          question_id,
          selected_answer,
          is_correct,
          points_awarded,
          answered_at
       )

       VALUES ($1, $2, $3::JSONB, $4, $5, CURRENT_TIMESTAMP)`,
      [
        attemptId,
        question.id,
        selectedAnswer === null
          ? null
          : JSON.stringify(selectedAnswer),
        correct,
        pointsAwarded
      ]
    );

    review.push({
      question_id: question.id,
      question: question.question,
      question_type: question.question_type,
      options: question.options,
      selected_answer: selectedAnswer,
      correct_answer: question.correct_answer,
      is_correct: correct,
      points_awarded: pointsAwarded,
      total_points: points,
      explanation: question.explanation,
      sort_order: question.sort_order
    });
  }

  const score =
    totalPoints > 0
      ? Number(((earnedPoints / totalPoints) * 100).toFixed(2))
      : 0;

  return {
    earnedPoints,
    totalPoints,
    score,
    review
  };
};

// =====================================================
// HELPER: EXPIRE ATTEMPT
// =====================================================

/**
 * Menyelesaikan attempt yang sudah melewati batas waktu.
 * Karena jawaban belum disimpan satu per satu,
 * attempt yang kedaluwarsa tanpa submit akan dinilai 0.
 */
const expireAttempt = async (client, attempt) => {
  const questions = await client.query(
    `SELECT
        id,
        points,
        sort_order

     FROM quiz_questions

     WHERE quiz_id = $1

     ORDER BY sort_order ASC`,
    [attempt.quiz_id]
  );

  const totalPoints = questions.rows.reduce(
    (total, question) => total + Number(question.points),
    0
  );

  // Simpan jawaban kosong untuk semua soal.
  for (const question of questions.rows) {
    await client.query(
      `INSERT INTO quiz_attempt_answers (
          attempt_id,
          question_id,
          selected_answer,
          is_correct,
          points_awarded,
          answered_at
       )

       VALUES ($1, $2, NULL, FALSE, 0, CURRENT_TIMESTAMP)

       ON CONFLICT (attempt_id, question_id) DO NOTHING`,
      [attempt.id, question.id]
    );
  }

  await client.query(
    `UPDATE quiz_attempts

     SET
        score = 0,
        total_points = $2,
        is_passed = FALSE,
        completed_at = CURRENT_TIMESTAMP

     WHERE id = $1
       AND completed_at IS NULL`,
    [attempt.id, totalPoints]
  );

  return {
    score: 0,
    earned_points: 0,
    total_points: totalPoints,
    is_passed: false,
    is_timed_out: true
  };
};

// =====================================================
// GET QUIZ BY MODULE
// =====================================================

export const getQuizByModule = async (userId, moduleId) => {
  const quiz = await assertQuizAccessible(
    pool,
    userId,
    moduleId
  );

  const questions = await getQuizQuestions(pool, quiz.id);

  if (questions.length !== Number(quiz.question_count)) {
    throw new Error(
      'Jumlah soal Quiz belum sesuai dengan konfigurasi.'
    );
  }

  return {
    quiz: {
      id: quiz.id,
      module_id: quiz.module_id,
      title: quiz.title,
      description: quiz.description,
      passing_score: Number(quiz.passing_score),
      question_count: Number(quiz.question_count),
      duration_seconds: QUIZ_DURATION_SECONDS
    },
    questions
  };
};

// =====================================================
// START QUIZ
// =====================================================

export const startQuiz = async (userId, moduleId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const quiz = await assertQuizAccessible(
      client,
      userId,
      moduleId
    );

    const questions = await getQuizQuestions(client, quiz.id);

    if (questions.length !== Number(quiz.question_count)) {
      throw new Error(
        'Jumlah soal Quiz belum sesuai dengan konfigurasi.'
      );
    }

    // Cari attempt yang belum selesai.
    const activeAttemptResult = await client.query(
      `SELECT
          id,
          user_id,
          quiz_id,
          started_at,
          completed_at

       FROM quiz_attempts

       WHERE user_id = $1
         AND quiz_id = $2
         AND completed_at IS NULL

       ORDER BY started_at DESC

       LIMIT 1

       FOR UPDATE`,
      [userId, quiz.id]
    );

    let attempt;
    let remainingSeconds;

    if (activeAttemptResult.rows.length > 0) {
      const activeAttempt = activeAttemptResult.rows[0];

      const elapsedResult = await client.query(
        `SELECT
            GREATEST(
              0,
              FLOOR(
                $2::INTEGER -
                EXTRACT(
                  EPOCH FROM (
                    CURRENT_TIMESTAMP - $1::TIMESTAMPTZ
                  )
                )
              )
            )::INTEGER AS remaining_seconds`,
        [activeAttempt.started_at, QUIZ_DURATION_SECONDS]
      );

      remainingSeconds = Number(
        elapsedResult.rows[0].remaining_seconds
      );

      if (remainingSeconds <= 0) {
        // Attempt lama kedaluwarsa.
        await expireAttempt(client, activeAttempt);

        // Buat attempt baru untuk percobaan berikutnya.
        const newAttemptResult = await client.query(
          `INSERT INTO quiz_attempts (
              user_id,
              quiz_id,
              started_at
           )

           VALUES ($1, $2, CURRENT_TIMESTAMP)

           RETURNING id, user_id, quiz_id, started_at, completed_at`,
          [userId, quiz.id]
        );

        attempt = newAttemptResult.rows[0];
        remainingSeconds = QUIZ_DURATION_SECONDS;
      } else {
        // Lanjutkan attempt yang masih aktif.
        attempt = activeAttempt;
      }
    } else {
      // Belum ada attempt aktif.
      const newAttemptResult = await client.query(
        `INSERT INTO quiz_attempts (
            user_id,
            quiz_id,
            started_at
         )

         VALUES ($1, $2, CURRENT_TIMESTAMP)

         RETURNING id, user_id, quiz_id, started_at, completed_at`,
        [userId, quiz.id]
      );

      attempt = newAttemptResult.rows[0];
      remainingSeconds = QUIZ_DURATION_SECONDS;
    }

    await client.query('COMMIT');

    return {
      attempt_id: attempt.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passing_score: Number(quiz.passing_score),
        question_count: Number(quiz.question_count),
        duration_seconds: QUIZ_DURATION_SECONDS
      },
      started_at: attempt.started_at,
      remaining_seconds: remainingSeconds,
      questions
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =====================================================
// SUBMIT QUIZ
// =====================================================

export const submitQuiz = async (userId, attemptId, answers) => {
  if (!Array.isArray(answers)) {
    throw new Error('Format jawaban Quiz tidak valid.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock attempt untuk mencegah submit bersamaan.
    const attemptResult = await client.query(
      `SELECT
          qa.id,
          qa.user_id,
          qa.quiz_id,
          qa.started_at,
          qa.completed_at,

          q.module_id,
          q.passing_score,
          q.title

       FROM quiz_attempts qa

       JOIN quizzes q
         ON q.id = qa.quiz_id

       WHERE qa.id = $1
         AND qa.user_id = $2

       FOR UPDATE OF qa`,
      [attemptId, userId]
    );

    if (attemptResult.rows.length === 0) {
      throw new Error('Attempt Quiz tidak ditemukan.');
    }

    const attempt = attemptResult.rows[0];

    if (attempt.completed_at) {
      throw new Error(
        'Quiz ini sudah dikumpulkan dan tidak dapat dikumpulkan kembali.'
      );
    }

    // Hitung waktu berdasarkan database.
    const timeResult = await client.query(
      `SELECT
          EXTRACT(
            EPOCH FROM (
              CURRENT_TIMESTAMP - $1::TIMESTAMPTZ
            )
          ) AS elapsed_seconds`,
      [attempt.started_at]
    );

    const elapsedSeconds = Number(
      timeResult.rows[0].elapsed_seconds
    );

    const isTimedOut = elapsedSeconds >= QUIZ_DURATION_SECONDS;

    const questionsResult = await client.query(
      `SELECT
          id,
          quiz_id,
          question,
          question_type,
          options,
          correct_answer,
          explanation,
          points,
          sort_order

       FROM quiz_questions

       WHERE quiz_id = $1

       ORDER BY sort_order ASC`,
      [attempt.quiz_id]
    );

    const questions = questionsResult.rows;

    if (questions.length === 0) {
      throw new Error('Soal Quiz tidak ditemukan.');
    }

    if (questions.length !== 5) {
      throw new Error('Konfigurasi Quiz harus berisi 5 soal.');
    }

    // Jika sudah melewati batas waktu, jawaban yang dikirim
    // tetap diproses sebagai pengumpulan akhir.
    // Jawaban yang tidak dikirim akan mendapat 0 poin.
    const result = await saveAndGradeAnswers(
      client,
      attempt.id,
      questions,
      answers
    );

    const isPassed =
      result.score >= Number(attempt.passing_score);

    await client.query(
      `UPDATE quiz_attempts

       SET
          score = $2,
          total_points = $3,
          is_passed = $4,
          completed_at = CURRENT_TIMESTAMP

       WHERE id = $1
         AND completed_at IS NULL`,
      [
        attempt.id,
        result.score,
        result.totalPoints,
        isPassed
      ]
    );

    await client.query('COMMIT');

    return {
      attempt_id: attempt.id,
      quiz_id: attempt.quiz_id,
      quiz_title: attempt.title,
      score: result.score,
      earned_points: result.earnedPoints,
      total_points: result.totalPoints,
      passing_score: Number(attempt.passing_score),
      is_passed: isPassed,
      is_timed_out: isTimedOut,
      message: isPassed
        ? 'Selamat! Kamu berhasil lulus Quiz.'
        : 'Kamu belum lulus Quiz. Pelajari kembali materi dan coba lagi.',
      answers: result.review
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =====================================================
// GET QUIZ RESULT
// =====================================================

export const getQuizResult = async (userId, attemptId) => {
  const attemptResult = await pool.query(
    `SELECT
        qa.id AS attempt_id,
        qa.user_id,
        qa.quiz_id,
        qa.score,
        qa.total_points,
        qa.is_passed,
        qa.started_at,
        qa.completed_at,

        q.title AS quiz_title,
        q.passing_score,
        q.module_id

     FROM quiz_attempts qa

     JOIN quizzes q
       ON q.id = qa.quiz_id

     WHERE qa.id = $1
       AND qa.user_id = $2`,
    [attemptId, userId]
  );

  if (attemptResult.rows.length === 0) {
    throw new Error('Hasil Quiz tidak ditemukan.');
  }

  const attempt = attemptResult.rows[0];

  if (!attempt.completed_at) {
    throw new Error('Quiz belum dikumpulkan.');
  }

  const answersResult = await pool.query(
    `SELECT
        q.id AS question_id,
        q.question,
        q.question_type,
        q.options,
        q.correct_answer,
        q.explanation,
        q.points AS total_points,
        q.sort_order,

        aa.selected_answer,
        aa.is_correct,
        aa.points_awarded

     FROM quiz_attempt_answers aa

     JOIN quiz_questions q
       ON q.id = aa.question_id

     WHERE aa.attempt_id = $1

     ORDER BY q.sort_order ASC`,
    [attemptId]
  );

  return {
    attempt_id: attempt.attempt_id,
    quiz_id: attempt.quiz_id,
    quiz_title: attempt.quiz_title,
    module_id: attempt.module_id,
    score: Number(attempt.score),
    earned_points: Number(
      answersResult.rows.reduce(
        (total, answer) => total + Number(answer.points_awarded),
        0
      )
    ),
    total_points: Number(attempt.total_points),
    passing_score: Number(attempt.passing_score),
    is_passed: attempt.is_passed,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,
    answers: answersResult.rows
  };
};
