
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    // 1. Mengambil token dari Authorization header
    const authHeader = req.headers.authorization;

    // 2. Memastikan token tersedia dan menggunakan format Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    // 3. Mengambil token tanpa tulisan Bearer
    const token = authHeader.split(' ')[1];

    // 4. Memeriksa konfigurasi JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET belum dikonfigurasi.');
    }

    // 5. Memverifikasi token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ['HS256'],
      }
    );

    // 6. Menyimpan identitas pengguna ke request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    // 7. Melanjutkan request ke middleware atau controller berikutnya
    next();

  } catch (error) {
    // 8. Menangani token tidak valid atau kedaluwarsa
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kedaluwarsa. Silakan login kembali.',
      });
    }

    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({ 
        success: false,
        message: 'Token tidak valid.',
      });
    }

    console.error('Authentication middleware error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan autentikasi.',
    });
  }
};
