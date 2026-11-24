
const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// API REQUEST
// ==========================================

const request = async (url, token, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error('Respons server tidak dapat dibaca.');
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Permintaan Lab gagal.');
  }

  return data;
};

// ==========================================
// GET LAB DETAIL
// ==========================================

export const getLabExercise = async ({ labId, token }) => {
  const response = await request(
    `/api/labs/${labId}`,
    token
  );

  return response.data;
};

// ==========================================
// START LAB
// ==========================================

export const startLab = async ({ labId, token }) => {
  const response = await request(
    `/api/labs/${labId}/start`,
    token,
    {
      method: 'POST',
    }
  );

  return response.data;
};

// ==========================================
// SUBMIT LAB
// ==========================================

export const submitLab = async ({ labId, token, code }) => {
  const response = await request(
    `/api/labs/${labId}/submit`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ code }),
    }
  );

  return response.data;
};
