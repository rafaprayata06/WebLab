import pool from '../config/database.js';

// Mengambil status onboarding pengguna
export const getOnboardingStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT onboarding_completed
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      onboarding_completed: result.rows[0].onboarding_completed,
    });
  } catch (error) {
    console.error('Get onboarding status error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil status onboarding.',
    });
  }
};

// Menandai onboarding sebagai selesai
export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE users
       SET onboarding_completed = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING onboarding_completed`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Guided Tour berhasil diselesaikan.',
      onboarding_completed: result.rows[0].onboarding_completed,
    });
  } catch (error) {
    console.error('Complete onboarding error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan status onboarding.',
    });
  }
};