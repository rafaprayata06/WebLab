
const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// REGISTER
// ==========================================
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Registrasi gagal. Silakan coba kembali.'
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Tidak dapat terhubung ke server. Periksa koneksi atau server.',
        { cause: error }
      );
    }

    throw error;
  }
};

// ==========================================
// LOGIN
// ==========================================
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Login gagal. Silakan coba kembali.'
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Tidak dapat terhubung ke server. Periksa koneksi atau server.',
        { cause: error }
      );
    }

    throw error;
  }
};

// ==========================================
// GET CURRENT USER
// ==========================================
export const getCurrentUser = async (token) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Gagal mengambil data pengguna.'
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Tidak dapat terhubung ke server. Periksa koneksi atau server.',
        { cause: error }
      );
    }

    throw error;
  }
};

// ==========================================
// LOGOUT
// ==========================================
export const logoutUser = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

//verify email
export const verifyEmail = async (token) => {
  const response = await fetch(
    `${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Verifikasi email gagal.');
  }

  return data;
};