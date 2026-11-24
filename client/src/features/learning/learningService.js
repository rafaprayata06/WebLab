
const API_URL = import.meta.env.VITE_API_URL;

const request = async (url, token, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Permintaan gagal diproses.');
  }

  return data;
};

export const getModules = async (token) => {
  const data = await request('/api/learning/modules', token);
  return data.data;
};

export const getModuleDetail = async ({ moduleId, token }) => {
  const data = await request(
    `/api/learning/modules/${moduleId}`,
    token
  );

  return data.data;
};

export const startSubmodule = async ({ submoduleId, token }) => {
  return request(
    `/api/learning/submodules/${submoduleId}/start`,
    token,
    { method: 'POST' }
  );
};

export const getSubmoduleProgress = async ({ submoduleId, token }) => {
  const data = await request(
    `/api/learning/submodules/${submoduleId}/progress`,
    token
  );

  return data.data;
};

export const updateReadingProgress = async ({
  submoduleId,
  token,
  readingProgress,
}) => {
  return request(
    `/api/learning/submodules/${submoduleId}/reading-progress`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ readingProgress }),
    }
  );
};

export const completeLesson = async ({ submoduleId, token }) => {
  return request(
    `/api/learning/submodules/${submoduleId}/complete-lesson`,
    token,
    { method: 'POST' }
  );
};
