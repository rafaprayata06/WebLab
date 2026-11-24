
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import pool from '../config/database.js';
import { sendVerificationEmail } from '../services/email.service.js';
import jwt from 'jsonwebtoken';

// Fungsi untuk menangani proses registrasi pengguna
export const register = async (req, res) => {
  try {
    // 1. Mengambil data dari request body
    const { name, email, password } = req.body;

    // 2. Memastikan semua input sudah diisi
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi.',
      });
    }

    // 3. Memastikan semua input berupa string
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Format input tidak valid.',
      });
    }

    // 4. Membersihkan spasi dan menyeragamkan email
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 5. Memvalidasi nama
    if (!normalizedName || normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Nama wajib diisi dan maksimal 100 karakter.',
      });
    }

    // 6. Memvalidasi format email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(normalizedEmail) ||
      normalizedEmail.length > 255
    ) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid.',
      });
    }

    // 7. Memvalidasi panjang password
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password harus terdiri dari 8–72 karakter.',
      });
    }

    // 8. Memeriksa apakah email sudah terdaftar
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar.',
      });
    }

    // 9. Melakukan hashing password
    const passwordHash = await bcrypt.hash(password, 12);

    // 10. Membuat token verifikasi acak
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 11. Mengubah token menjadi hash SHA-256
    const tokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // 12. Menentukan masa berlaku token selama 15 menit
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 13. Membuat koneksi untuk transaksi database
    const client = await pool.connect();

    let user;

    try {
      // Memulai transaksi
      await client.query('BEGIN');

      // 14. Menyimpan data pengguna
      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, is_verified, created_at`,
        [normalizedName, normalizedEmail, passwordHash]
      );

      user = userResult.rows[0];

      // 15. Menyimpan hash token verifikasi
      await client.query(
        `INSERT INTO email_verifications
         (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      // Menyimpan perubahan database
      await client.query('COMMIT');

    } catch (error) {
      // Membatalkan transaksi jika terjadi kesalahan
      await client.query('ROLLBACK');
      throw error;

    } finally {
      // Mengembalikan koneksi ke pool
      client.release();
    }

    // 16. Mengirim email verifikasi
    try {
      await sendVerificationEmail({
        to: normalizedEmail,
        name: normalizedName,
        token: verificationToken,
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError.message);

      return res.status(502).json({
        success: false,
        message: 'Akun berhasil dibuat, tetapi email verifikasi gagal dikirim.',
        data: {
          id: user.id,
          email: user.email,
          is_verified: user.is_verified,
        },
      });
    }

    // 17. Mengirim respons registrasi berhasil
    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan periksa email untuk verifikasi.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_verified: user.is_verified,
      },
    });

  } catch (error) {
    console.error('Register error:', error.message);

    // Menangani email yang sudah terdaftar
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};


// Fungsi untuk menangani verifikasi email pengguna
export const verifyEmail = async (req, res) => {
  // 1. Mengambil token dari URL
  const { token } = req.query;

  // 2. Memastikan token tersedia dan valid
  if (
    !token ||
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Token verifikasi tidak valid.',
    });
  }

  // 3. Mengubah token menjadi hash SHA-256
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // 4. Membuat koneksi database
  const client = await pool.connect();

  try {
    // Memulai transaksi
    await client.query('BEGIN');

    // 5. Mencari token dan mengunci datanya
    const tokenResult = await client.query(
      `SELECT id, user_id, expires_at, used_at
       FROM email_verifications
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );

    if ( tokenResult.rows.length === 0 ||tokenResult.rows[0].used_at !== null) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak valid atau sudah digunakan.',
      });
    }

    const verification = tokenResult.rows[0];

    // 6. Memeriksa masa berlaku token
    if (new Date(verification.expires_at) <= new Date()) {
      await client.query('ROLLBACK');

      return res.status(410).json({
        success: false,
        message: 'Token verifikasi sudah kedaluwarsa.',
      });
    }

    // 7. Mengaktifkan akun pengguna
    await client.query(
      `UPDATE users
       SET is_verified = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [verification.user_id]
    );

    // 8. Menandai seluruh token aktif pengguna sebagai sudah digunakan
    await client.query(
      `UPDATE email_verifications
       SET used_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
         AND used_at IS NULL`,
      [verification.user_id]
    );

    // Menyimpan seluruh perubahan
    await client.query('COMMIT');

    // 9. Mengirim respons berhasil
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


export const login = async (req, res) => {
  try {
    // 1. Mengambil email dan password dari request
    const { email, password } = req.body;

    // 2. Memastikan email dan password tersedia
    if ( !email || !password || typeof email !== 'string' ||typeof password !== 'string')
      {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    // 3. Normalisasi email
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Mencari pengguna berdasarkan email
   const result = await pool.query(
  `SELECT id, name, email, password_hash, is_verified,
          onboarding_completed
   FROM users
   WHERE email = $1`,
  [normalizedEmail]
);

    // 5. Memeriksa apakah pengguna ditemukan
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const user = result.rows[0];

    // 6. Membandingkan password dengan password hash di database
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // 7. Memastikan email sudah diverifikasi
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Silakan verifikasi email terlebih dahulu.',
      });
    }

    // 8. Membuat JWT access token
    const accessToken = jwt.sign(
      {
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        subject: String(user.id),
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      accessToken,
     user: {
  id: user.id,
  name: user.name,
  email: user.email,
  is_verified: user.is_verified,
  onboarding_completed: user.onboarding_completed,
},
    });

  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login.',
    });
  }
};


export const getMe = async (req, res) => {
  try {
    // 1. Mengambil ID pengguna dari middleware
    const userId = req.user.id;

    // 2. Mencari data pengguna berdasarkan ID
    const result = await pool.query(
  `SELECT id, name, email, is_verified, created_at,
          onboarding_completed
   FROM users
   WHERE id = $1`,
  [userId]
);

    // 3. Memastikan pengguna masih tersedia di database
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // 4. Mengambil data pengguna
    const user = result.rows[0];

    // 5. Mengirim informasi pengguna
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboarding_completed: user.onboarding_completed,
        is_verified: user.is_verified,
        created_at: user.created_at,
      },
    });

  } catch (error) {
    console.error('Get current user error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pengguna.',
    });
  }
};
