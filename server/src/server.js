import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WebLab API is running!',
  });
});

// Tes koneksi PostgreSQL
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.status(200).json({
      success: true,
      message: 'PostgreSQL connected successfully!',
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      success: false,
      message: 'PostgreSQL connection failed!',
    });
  }
});

app.use('/api/auth', authRoutes);
app.listen(PORT, () => {
  console.log(`WebLab Server running on port ${PORT}`);
});


// Fungsi untuk memverifikasi email pengguna
export const verifyEmail = async (req, res) => {
  // 1. Mengambil token dari query URL
  const { token } = req.query;

  // 2. Memastikan token tersedia dan berbentuk string
  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Token verifikasi tidak ditemukan.',
    });
  }

  // 3. Mengubah token asli menjadi hash SHA-256
  // Hash ini digunakan untuk mencocokkan token di database
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // 4. Membuat koneksi database
  const client = await pool.connect();

  try {
    // Memulai transaksi database
    await client.query('BEGIN');

    // 5. Mencari token dan mengunci barisnya selama transaksi
    const tokenResult = await client.query(
      `SELECT id, user_id, expires_at, used_at
       FROM email_verifications
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );

    // Jika token tidak ditemukan atau sudah pernah digunakan
    if (
      tokenResult.rows.length === 0 ||
      tokenResult.rows[0].used_at !== null
    ) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak valid atau sudah digunakan.',
      });
    }

    const verification = tokenResult.rows[0];

    // 6. Memeriksa apakah token sudah kedaluwarsa
    if (new Date(verification.expires_at) <= new Date()) {
      await client.query('ROLLBACK');

      return res.status(410).json({
        success: false,
        message: 'Token verifikasi sudah kedaluwarsa.',
      });
    }

    // 7. Mengubah status akun menjadi terverifikasi
    await client.query(
      `UPDATE users
       SET is_verified = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [verification.user_id]
    );

    // 8. Menandai seluruh token aktif milik pengguna sebagai sudah digunakan
    await client.query(
      `UPDATE email_verifications
       SET used_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
         AND used_at IS NULL`,
      [verification.user_id]
    );

    // Menyimpan seluruh perubahan database
    await client.query('COMMIT');

    // 9. Mengirim respons jika verifikasi berhasil
    return res.status(200).json({
      success: true,
      message: 'Email berhasil diverifikasi. Akun WebLab kamu sudah aktif.',
    });

  } catch (error) {
    // Membatalkan transaksi jika terjadi kesalahan
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError.message);
    }

    console.error('Verify email error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memverifikasi email.',
    });

  } finally {
    // Mengembalikan koneksi ke pool
    client.release();
  }
};
