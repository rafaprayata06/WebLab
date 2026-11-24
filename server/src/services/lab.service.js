
import pool from '../config/database.js';

// =====================================================
// GET LAB EXERCISE
// =====================================================

/**
 * Mengambil Lab dan memeriksa:
 * 1. Lab memiliki minimal satu submodul prasyarat.
 * 2. Semua submodul dalam modul harus selesai.
 * 3. Semua prasyarat Lab harus berasal dari modul yang sama.
 * 4. Semua prasyarat Lab harus selesai.
 * 5. Semua Lab sebelumnya harus diselesaikan.
 */
export const getLabExercise = async (userId, labId) => {
  const result = await pool.query(
    `SELECT
        le.id,
        le.submodule_id,
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
          -- Lab harus memiliki minimal satu submodul prasyarat.
          EXISTS (
            SELECT 1
            FROM lab_exercise_submodules les
            WHERE les.lab_exercise_id = le.id
          )

          -- Seluruh submodul dalam modul harus selesai.
          AND NOT EXISTS (
            SELECT 1
            FROM submodules module_submodule

            LEFT JOIN user_submodule_progress module_progress
              ON module_progress.submodule_id = module_submodule.id
             AND module_progress.user_id = $1

            WHERE module_submodule.module_id = anchor.module_id
              AND module_submodule.is_published = TRUE
              AND module_progress.completed_at IS NULL
          )

          -- Seluruh prasyarat Lab harus selesai
          -- dan berasal dari modul yang sama.
          AND NOT EXISTS (
            SELECT 1
            FROM lab_exercise_submodules les

            JOIN submodules s
              ON s.id = les.submodule_id

            LEFT JOIN user_submodule_progress usp
              ON usp.submodule_id = s.id
             AND usp.user_id = $1

            WHERE les.lab_exercise_id = le.id
              AND (
                s.module_id <> anchor.module_id
                OR s.is_published = FALSE
                OR usp.completed_at IS NULL
              )
          )

          -- Semua Lab sebelumnya harus selesai.
          AND NOT EXISTS (
            SELECT 1
            FROM lab_exercises previous_lab

            JOIN submodules previous_anchor
              ON previous_anchor.id = previous_lab.submodule_id

            LEFT JOIN user_lab_progress previous_progress
              ON previous_progress.lab_exercise_id = previous_lab.id
             AND previous_progress.user_id = $1

            WHERE previous_anchor.module_id = anchor.module_id
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

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', s.id,
                'title', s.title,
                'sort_order', s.sort_order,
                'is_completed', (usp.completed_at IS NOT NULL)
              )
              ORDER BY les.sort_order
            )
            FROM lab_exercise_submodules les

            JOIN submodules s
              ON s.id = les.submodule_id

            LEFT JOIN user_submodule_progress usp
              ON usp.submodule_id = s.id
             AND usp.user_id = $1

            WHERE les.lab_exercise_id = le.id
          ),
          '[]'::json
        ) AS required_submodules

      FROM lab_exercises le

      JOIN submodules anchor
        ON anchor.id = le.submodule_id

      JOIN modules m
        ON m.id = anchor.module_id

      LEFT JOIN user_lab_progress ulp
        ON ulp.lab_exercise_id = le.id
       AND ulp.user_id = $1

      WHERE le.id = $2
        AND anchor.is_published = TRUE
        AND m.is_published = TRUE`,
    [userId, labId]
  );

  if (result.rows.length === 0) {
    throw new Error('Lab tidak ditemukan.');
  }

  return result.rows[0];
};

// =====================================================
// ASSERT LAB ACCESS
// =====================================================

/**
 * Memastikan Lab benar-benar boleh dikerjakan.
 * Pengecekan dilakukan di backend.
 */
const assertLabUnlocked = async (userId, labId) => {
  const lab = await getLabExercise(userId, labId);

  if (!lab.is_unlocked) {
    throw new Error(
      'Selesaikan seluruh materi prasyarat dan Lab sebelumnya terlebih dahulu.'
    );
  }

  return lab;
};

// =====================================================
// START LAB
// =====================================================

/**
 * Memulai atau melanjutkan pengerjaan Lab.
 * Progres Lab disimpan terpisah dari progres materi.
 */
export const startLab = async (userId, labId) => {
  const lab = await assertLabUnlocked(userId, labId);

  const result = await pool.query(
    `INSERT INTO user_lab_progress (
        user_id,
        lab_exercise_id,
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

     ON CONFLICT (user_id, lab_exercise_id)

     DO UPDATE SET
        status = CASE
          WHEN user_lab_progress.completed_at IS NOT NULL
            THEN 'completed'
          ELSE 'in_progress'
        END,

        last_accessed_at = CURRENT_TIMESTAMP

     RETURNING *`,
    [userId, labId]
  );

  return {
    lab,
    progress: result.rows[0],
  };
};

// =====================================================
// VALIDATE HTML
// =====================================================

/**
 * Validasi struktur HTML berdasarkan configuration Lab.
 */
const validateHtmlStructure = (code, configuration = {}) => {
  const validation = configuration?.validation;

  if (
    !validation ||
    validation.type !== 'html_structure' ||
    !Array.isArray(validation.requiredElements)
  ) {
    throw new Error('Konfigurasi validasi Lab tidak valid.');
  }

  // Komentar HTML tidak dihitung sebagai elemen.
  const cleanCode = code.replace(/<!--[\s\S]*?-->/g, '');

  const missingElements = validation.requiredElements.filter(
    (element) => {
      const safeElement = String(element).replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

      const pattern = new RegExp(
        `<\\s*${safeElement}(?=[\\s/>])`,
        'i'
      );

      return !pattern.test(cleanCode);
    }
  );

  return {
    passed: missingElements.length === 0,
    missingElements,
  };
};

// =====================================================
// SUBMIT LAB
// =====================================================

/**
 * Memeriksa kode yang dikirim pengguna.
 * Status completed hanya diberikan jika validasi backend berhasil.
 */
export const submitLab = async (userId, labId, code) => {
  if (typeof code !== 'string' || !code.trim()) {
    throw new Error('Kode HTML tidak boleh kosong.');
  }

  if (code.length > 100000) {
    throw new Error('Kode terlalu panjang. Maksimal 100 KB.');
  }

  // Pastikan seluruh materi dan Lab sebelumnya selesai.
  const lab = await assertLabUnlocked(userId, labId);

  if (lab.language !== 'html' || lab.runner !== 'browser') {
    throw new Error(
      'Jenis Lab ini belum didukung oleh validator saat ini.'
    );
  }

  const validation = validateHtmlStructure(
    code,
    lab.configuration
  );

  // Jika validasi gagal, progres tidak diselesaikan.
  if (!validation.passed) {
    await pool.query(
      `UPDATE user_lab_progress
       SET last_accessed_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
         AND lab_exercise_id = $2`,
      [userId, labId]
    );

    return {
      passed: false,
      missing_elements: validation.missingElements,
      message: 'Masih ada elemen HTML yang belum dibuat.',
    };
  }

  // Jika validasi berhasil, tandai Lab selesai.
  const result = await pool.query(
    `INSERT INTO user_lab_progress (
        user_id,
        lab_exercise_id,
        status,
        started_at,
        completed_at,
        last_accessed_at
     )

     VALUES (
        $1,
        $2,
        'completed',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
     )

     ON CONFLICT (user_id, lab_exercise_id)

     DO UPDATE SET
        status = 'completed',
        completed_at = COALESCE(
          user_lab_progress.completed_at,
          CURRENT_TIMESTAMP
        ),
        last_accessed_at = CURRENT_TIMESTAMP

     RETURNING *`,
    [userId, labId]
  );

  return {
    passed: true,
    missing_elements: [],
    message: 'Selamat! Lab berhasil diselesaikan.',
    progress: result.rows[0],
  };
};
