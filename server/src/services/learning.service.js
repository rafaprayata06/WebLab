
import pool from '../config/database.js';

// =====================================================
// MODULE ACCESS
// =====================================================

/**
 * Memeriksa apakah sebuah modul sudah boleh diakses user.
 *
 * Aturan:
 * 1. Modul pertama langsung terbuka.
 * 2. Modul berikutnya membutuhkan seluruh materi modul sebelumnya selesai.
 * 3. Modul 1 tidak membutuhkan Lab maupun Quiz.
 * 4. Modul 2 dan seterusnya membutuhkan seluruh checkpoint Lab selesai
 *    dan Quiz modul sebelumnya lulus.
 */
const getModuleAccessStatus = async (db, userId, moduleId) => {
  const result = await db.query(
    `SELECT
        m.id,
        m.slug,
        m.title,
        m.description,
        m.sort_order,
        m.is_published,

        CASE
          WHEN m.sort_order = 1 THEN TRUE

          ELSE EXISTS (
            SELECT 1
            FROM modules previous_module

            WHERE previous_module.sort_order < m.sort_order
              AND previous_module.is_published = TRUE

              -- Hanya modul sebelumnya yang paling dekat.
              AND NOT EXISTS (
                SELECT 1
                FROM modules closer_module
                WHERE closer_module.sort_order < m.sort_order
                  AND closer_module.sort_order > previous_module.sort_order
                  AND closer_module.is_published = TRUE
              )

              -- Semua submodul modul sebelumnya harus selesai.
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

              -- Modul 1 tidak membutuhkan Lab dan Quiz.
              AND (
                previous_module.sort_order = 1

                OR (
                  -- Semua checkpoint Lab modul sebelumnya harus selesai.
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

                  -- Quiz modul sebelumnya harus lulus.
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

/**
 * Memeriksa apakah sebuah submodul sudah boleh diakses user.
 *
 * Submodul berikutnya terbuka setelah submodul sebelumnya selesai.
 * Modulnya sendiri juga harus sudah terbuka.
 */
const assertSubmoduleUnlocked = async (client, userId, submoduleId) => {
  const submoduleResult = await client.query(
    `SELECT
        s.id,
        s.module_id,
        s.sort_order AS submodule_order,
        s.is_published,
        m.sort_order AS module_order,
        m.is_published AS module_is_published

      FROM submodules s

      JOIN modules m
        ON m.id = s.module_id

      WHERE s.id = $1`,
    [submoduleId]
  );

  if (submoduleResult.rows.length === 0) {
    throw new Error('Submodul tidak ditemukan.');
  }

  const submodule = submoduleResult.rows[0];

  if (!submodule.is_published || !submodule.module_is_published) {
    throw new Error('Submodul tidak tersedia.');
  }

  // Periksa apakah modul sudah terbuka.
  const moduleAccess = await getModuleAccessStatus(
    client,
    userId,
    submodule.module_id
  );

  if (!moduleAccess || !moduleAccess.is_unlocked) {
    throw new Error(
      'Selesaikan seluruh persyaratan modul sebelumnya terlebih dahulu.'
    );
  }

  // Periksa submodul sebelumnya dalam modul yang sama.
  if (Number(submodule.submodule_order) > 1) {
    const previousSubmoduleResult = await client.query(
      `SELECT id
       FROM submodules
       WHERE module_id = $1
         AND sort_order < $2
         AND is_published = TRUE
       ORDER BY sort_order DESC
       LIMIT 1`,
      [submodule.module_id, submodule.submodule_order]
    );

    if (previousSubmoduleResult.rows.length > 0) {
      const previousSubmoduleId = previousSubmoduleResult.rows[0].id;

      const previousProgressResult = await client.query(
        `SELECT completed_at
         FROM user_submodule_progress
         WHERE user_id = $1
           AND submodule_id = $2`,
        [userId, previousSubmoduleId]
      );

      if (
        previousProgressResult.rows.length === 0 ||
        !previousProgressResult.rows[0].completed_at
      ) {
        throw new Error(
          'Selesaikan submodul sebelumnya terlebih dahulu.'
        );
      }
    }
  }

  return submodule;
};

// =====================================================
// GET MODULES
// =====================================================

/**
 * Mengambil seluruh modul beserta ringkasan progres user.
 *
 * Modul pertama langsung terbuka.
 * Modul berikutnya membutuhkan seluruh materi, checkpoint Lab,
 * dan Quiz dari modul sebelumnya.
 */
export const getModules = async (userId) => {
  const result = await pool.query(
    `SELECT
        m.id,
        m.slug,
        m.title,
        m.description,
        m.sort_order,

        COUNT(DISTINCT s.id)::INTEGER AS total_submodules,

        COUNT(DISTINCT s.id) FILTER (
          WHERE p.completed_at IS NOT NULL
        )::INTEGER AS completed_submodules,

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

              -- Semua materi modul sebelumnya harus selesai.
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
                -- Modul 1 tidak membutuhkan Lab dan Quiz.
                previous_module.sort_order = 1

                OR (
                  -- Semua checkpoint Lab harus selesai.
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

                  -- Quiz modul sebelumnya harus lulus.
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

      LEFT JOIN submodules s
        ON s.module_id = m.id
       AND s.is_published = TRUE

      LEFT JOIN user_submodule_progress p
        ON p.submodule_id = s.id
       AND p.user_id = $1

      WHERE m.is_published = TRUE

      GROUP BY m.id

      ORDER BY m.sort_order ASC`,
    [userId]
  );

  return result.rows;
};

// =====================================================
// GET MODULE DETAIL
// =====================================================

/**
 * Mengambil detail modul, submodul, materi, dan Lab checkpoint.
 *
 * Lab checkpoint dikembalikan pada tingkat modul,
 * bukan sebagai Lab individual di setiap submodul.
 */
export const getModuleDetail = async (userId, moduleId) => {
  const module = await getModuleAccessStatus(
    pool,
    userId,
    moduleId
  );

  if (!module) {
    throw new Error('Modul tidak ditemukan.');
  }

  if (!module.is_unlocked) {
    throw new Error(
      'Modul ini masih terkunci. Selesaikan persyaratan modul sebelumnya terlebih dahulu.'
    );
  }

  // ---------------------------------------------------
  // SUBMODULES
  // ---------------------------------------------------

  const submodulesResult = await pool.query(
    `SELECT
        s.id,
        s.module_id,
        s.slug,
        s.title,
        s.description,
        s.learning_objectives,
        s.estimated_minutes,
        s.sort_order,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', l.id,
                'title', l.title,
                'content', l.content,
                'sort_order', l.sort_order
              )
              ORDER BY l.sort_order
            )
            FROM lessons l
            WHERE l.submodule_id = s.id
          ),
          '[]'::json
        ) AS lessons,

        p.status AS progress_status,

        COALESCE(p.reading_progress, 0) AS reading_progress,

        p.lesson_completed_at,
        p.completed_at,

        -- Informasi bahwa submodul ini menjadi bagian
        -- dari setidaknya satu checkpoint Lab.
        EXISTS (
          SELECT 1
          FROM lab_exercise_submodules les

          JOIN lab_exercises le
            ON le.id = les.lab_exercise_id

          WHERE les.submodule_id = s.id
        ) AS is_part_of_lab_checkpoint,

        -- Kompatibilitas dengan frontend lama.
        -- Lab tidak lagi ditampilkan per submodul.
        '[]'::json AS lab_exercises,

        EXISTS (
          SELECT 1
          FROM lab_exercise_submodules les
          JOIN lab_exercises le
            ON le.id = les.lab_exercise_id
          WHERE les.submodule_id = s.id
        ) AS has_lab,

        CASE
          WHEN NOT $3::BOOLEAN THEN FALSE

          WHEN s.sort_order = (
            SELECT MIN(first_submodule.sort_order)
            FROM submodules first_submodule
            WHERE first_submodule.module_id = s.module_id
              AND first_submodule.is_published = TRUE
          ) THEN TRUE

          ELSE EXISTS (
            SELECT 1
            FROM submodules previous_submodule

            JOIN user_submodule_progress previous_progress
              ON previous_progress.submodule_id = previous_submodule.id
             AND previous_progress.user_id = $1

            WHERE previous_submodule.module_id = s.module_id
              AND previous_submodule.sort_order < s.sort_order
              AND previous_submodule.is_published = TRUE
              AND previous_progress.completed_at IS NOT NULL

              AND NOT EXISTS (
                SELECT 1
                FROM submodules closer_submodule
                WHERE closer_submodule.module_id = s.module_id
                  AND closer_submodule.sort_order < s.sort_order
                  AND closer_submodule.sort_order > previous_submodule.sort_order
                  AND closer_submodule.is_published = TRUE
              )
          )
        END AS is_unlocked,

        (p.completed_at IS NOT NULL) AS is_completed

      FROM submodules s

      LEFT JOIN user_submodule_progress p
        ON p.submodule_id = s.id
       AND p.user_id = $1

      WHERE s.module_id = $2
        AND s.is_published = TRUE

      ORDER BY s.sort_order ASC`,
    [userId, moduleId, module.is_unlocked]
  );

  // ---------------------------------------------------
  // LAB CHECKPOINTS
  // ---------------------------------------------------

  let labCheckpoints = [];

  // Modul 1 memang tidak menggunakan Lab.
  if (Number(module.sort_order) > 1) {
   

const labResult = await pool.query(
  `SELECT
      le.id,
      le.title,
      le.instructions,
      le.language,
      le.runner,
      le.starter_code,
      le.configuration,
      le.sort_order,

      ulp.status AS progress_status,
      ulp.started_at,
      ulp.completed_at,
      ulp.last_accessed_at,

      (
        -- Lab wajib memiliki prasyarat.
        EXISTS (
          SELECT 1
          FROM lab_exercise_submodules check_relation
          WHERE check_relation.lab_exercise_id = le.id
        )

        -- SEMUA submodul dalam modul wajib selesai.
        AND NOT EXISTS (
          SELECT 1
          FROM submodules module_submodule

          LEFT JOIN user_submodule_progress module_progress
            ON module_progress.submodule_id = module_submodule.id
           AND module_progress.user_id = $1

          WHERE module_submodule.module_id = $2
            AND module_submodule.is_published = TRUE
            AND module_progress.completed_at IS NULL
        )

        -- Semua prasyarat Lab wajib selesai.
        AND NOT EXISTS (
          SELECT 1
          FROM lab_exercise_submodules les

          JOIN submodules s
            ON s.id = les.submodule_id

          LEFT JOIN user_submodule_progress p
            ON p.submodule_id = s.id
           AND p.user_id = $1

          WHERE les.lab_exercise_id = le.id
            AND (
              s.module_id <> $2
              OR s.is_published = FALSE
              OR p.completed_at IS NULL
            )
        )

        -- Lab sebelumnya wajib selesai.
        AND NOT EXISTS (
          SELECT 1
          FROM lab_exercises previous_lab

          JOIN submodules previous_anchor
            ON previous_anchor.id = previous_lab.submodule_id

          LEFT JOIN user_lab_progress previous_progress
            ON previous_progress.lab_exercise_id = previous_lab.id
           AND previous_progress.user_id = $1

          WHERE previous_anchor.module_id = $2
            AND (
              previous_lab.sort_order < le.sort_order
              OR (
                previous_lab.sort_order = le.sort_order
                AND previous_lab.id < le.id
              )
            )
            AND previous_progress.completed_at IS NULL
        )
      ) AS is_unlocked,

      (ulp.completed_at IS NOT NULL) AS is_completed,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', s.id,
              'title', s.title,
              'slug', s.slug,
              'sort_order', s.sort_order,
              'is_completed', (p.completed_at IS NOT NULL)
            )
            ORDER BY les.sort_order
          )
          FROM lab_exercise_submodules les

          JOIN submodules s
            ON s.id = les.submodule_id

          LEFT JOIN user_submodule_progress p
            ON p.submodule_id = s.id
           AND p.user_id = $1

          WHERE les.lab_exercise_id = le.id
        ),
        '[]'::json
      ) AS required_submodules

    FROM lab_exercises le

    JOIN submodules anchor_submodule
      ON anchor_submodule.id = le.submodule_id

    LEFT JOIN user_lab_progress ulp
      ON ulp.lab_exercise_id = le.id
     AND ulp.user_id = $1

    WHERE anchor_submodule.module_id = $2
      AND anchor_submodule.is_published = TRUE

    ORDER BY le.sort_order ASC, le.id ASC`,
  [userId, moduleId]
);



    labCheckpoints = labResult.rows;
  }

  return {
    ...module,
    submodules: submodulesResult.rows,
    lab_checkpoints: labCheckpoints,
  };
};

// =====================================================
// START SUBMODULE
// =====================================================

/**
 * Memulai atau melanjutkan submodul.
 */
export const startSubmodule = async (userId, submoduleId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await assertSubmoduleUnlocked(
      client,
      userId,
      submoduleId
    );

    const result = await client.query(
      `INSERT INTO user_submodule_progress (
          user_id,
          submodule_id,
          status,
          started_at,
          last_accessed_at
       )

       VALUES (
          $1,
          $2,
          'in_progress',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
       )

       ON CONFLICT (user_id, submodule_id)

       DO UPDATE SET
          status = CASE
            WHEN user_submodule_progress.completed_at IS NOT NULL
              THEN 'completed'
            ELSE 'in_progress'
          END,

          last_accessed_at = CURRENT_TIMESTAMP

       RETURNING *`,
      [userId, submoduleId]
    );

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =====================================================
// COMPLETE LESSON
// =====================================================

/**
 * Mencatat penyelesaian materi.
 *
 * Semua modul:
 * - Materi harus mencapai reading_progress 100%.
 * - Penyelesaian materi tidak bergantung pada Lab.
 * - Lab checkpoint memiliki progres tersendiri.
 */
export const completeLesson = async (userId, submoduleId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await assertSubmoduleUnlocked(
      client,
      userId,
      submoduleId
    );

    const progressResult = await client.query(
      `SELECT *
       FROM user_submodule_progress
       WHERE user_id = $1
         AND submodule_id = $2
       FOR UPDATE`,
      [userId, submoduleId]
    );

    if (progressResult.rows.length === 0) {
      throw new Error('Mulai submodul terlebih dahulu.');
    }

    const currentProgress = progressResult.rows[0];

    if (Number(currentProgress.reading_progress) < 100) {
      throw new Error('Selesaikan seluruh materi terlebih dahulu.');
    }

    const result = await client.query(
      `UPDATE user_submodule_progress

       SET
          lesson_completed_at = COALESCE(
            lesson_completed_at,
            CURRENT_TIMESTAMP
          ),

          status = 'completed',

          completed_at = COALESCE(
            completed_at,
            CURRENT_TIMESTAMP
          ),

          last_accessed_at = CURRENT_TIMESTAMP

       WHERE user_id = $1
         AND submodule_id = $2

       RETURNING *`,
      [userId, submoduleId]
    );

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =====================================================
// GET SUBMODULE PROGRESS
// =====================================================

/**
 * Mengambil progres user pada sebuah submodul.
 *
 * has_lab hanya menunjukkan bahwa submodul
 * termasuk dalam checkpoint Lab.
 *
 * Nilai tersebut TIDAK menentukan penyelesaian submodul.
 */
export const getSubmoduleProgress = async (userId, submoduleId) => {
  const result = await pool.query(
    `SELECT
        p.status AS progress_status,

        COALESCE(p.reading_progress, 0) AS reading_progress,

        p.lesson_completed_at,
        p.completed_at,

        EXISTS (
          SELECT 1
          FROM lab_exercise_submodules les
          WHERE les.submodule_id = s.id
        ) AS has_lab,

        EXISTS (
          SELECT 1
          FROM lab_exercise_submodules les
          WHERE les.submodule_id = s.id
        ) AS is_part_of_lab_checkpoint,

        (m.sort_order = 1) AS is_module_one,

        (p.completed_at IS NOT NULL) AS is_completed

      FROM submodules s

      LEFT JOIN user_submodule_progress p
        ON p.submodule_id = s.id
       AND p.user_id = $1

      JOIN modules m
        ON m.id = s.module_id

      WHERE s.id = $2
        AND s.is_published = TRUE
        AND m.is_published = TRUE`,
    [userId, submoduleId]
  );

  if (result.rows.length === 0) {
    throw new Error('Submodul tidak ditemukan.');
  }

  return result.rows[0];
};

// =====================================================
// UPDATE READING PROGRESS
// =====================================================

/**
 * Menyimpan progres membaca.
 *
 * Progres bersifat monoton:
 * - Progres tidak bisa turun.
 * - Nilai harus berupa integer 0 sampai 100.
 *
 * Modul 1:
 * - Ketika progres mencapai 100%, submodul otomatis selesai.
 *
 * Modul 2 dan seterusnya:
 * - Progres membaca disimpan.
 * - Penyelesaian materi dilakukan melalui completeLesson().
 * - Lab checkpoint tidak memengaruhi progres materi.
 */
export const updateReadingProgress = async (
  userId,
  submoduleId,
  readingProgress
) => {
  const progress = Number(readingProgress);

  if (
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100
  ) {
    throw new Error('Reading progress harus berupa angka 0-100.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const submodule = await assertSubmoduleUnlocked(
      client,
      userId,
      submoduleId
    );

    const isModuleOne = Number(submodule.module_order) === 1;

    let result;

    if (isModuleOne) {
      // Modul 1 otomatis selesai ketika progres membaca 100%.
      result = await client.query(
        `INSERT INTO user_submodule_progress (
            user_id,
            submodule_id,
            status,
            started_at,
            last_accessed_at,
            reading_progress,
            lesson_completed_at,
            completed_at
         )

         VALUES (
            $1,
            $2,
            CASE
              WHEN $3 >= 100 THEN 'completed'
              ELSE 'in_progress'
            END,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            $3,
            CASE
              WHEN $3 >= 100 THEN CURRENT_TIMESTAMP
              ELSE NULL
            END,
            CASE
              WHEN $3 >= 100 THEN CURRENT_TIMESTAMP
              ELSE NULL
            END
         )

         ON CONFLICT (user_id, submodule_id)

         DO UPDATE SET
            reading_progress = GREATEST(
              user_submodule_progress.reading_progress,
              EXCLUDED.reading_progress
            ),

            lesson_completed_at = CASE
              WHEN GREATEST(
                user_submodule_progress.reading_progress,
                EXCLUDED.reading_progress
              ) >= 100
                THEN COALESCE(
                  user_submodule_progress.lesson_completed_at,
                  CURRENT_TIMESTAMP
                )
              ELSE user_submodule_progress.lesson_completed_at
            END,

            completed_at = CASE
              WHEN GREATEST(
                user_submodule_progress.reading_progress,
                EXCLUDED.reading_progress
              ) >= 100
                THEN COALESCE(
                  user_submodule_progress.completed_at,
                  CURRENT_TIMESTAMP
                )
              ELSE user_submodule_progress.completed_at
            END,

            status = CASE
              WHEN user_submodule_progress.completed_at IS NOT NULL
                OR GREATEST(
                  user_submodule_progress.reading_progress,
                  EXCLUDED.reading_progress
                ) >= 100
                THEN 'completed'
              ELSE 'in_progress'
            END,

            last_accessed_at = CURRENT_TIMESTAMP

         RETURNING
            reading_progress,
            status,
            lesson_completed_at,
            completed_at`,
        [userId, submoduleId, progress]
      );
    } else {
      // Modul 2 dan seterusnya: simpan progres membaca saja.
      result = await client.query(
        `INSERT INTO user_submodule_progress (
            user_id,
            submodule_id,
            status,
            started_at,
            last_accessed_at,
            reading_progress
         )

         VALUES (
            $1,
            $2,
            'in_progress',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            $3
         )

         ON CONFLICT (user_id, submodule_id)

         DO UPDATE SET
            reading_progress = GREATEST(
              user_submodule_progress.reading_progress,
              EXCLUDED.reading_progress
            ),

            last_accessed_at = CURRENT_TIMESTAMP,

            status = CASE
              WHEN user_submodule_progress.completed_at IS NOT NULL
                THEN 'completed'
              ELSE 'in_progress'
            END

         RETURNING
            reading_progress,
            status,
            lesson_completed_at,
            completed_at`,
        [userId, submoduleId, progress]
      );
    }

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
