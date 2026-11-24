
import {
  getLabExercise,
  startLab,
  submitLab,
} from '../services/lab.service.js';

const handleLabError = (res, error) => {
  const message = error.message || 'Terjadi kesalahan pada Lab.';

  let statusCode = 400;

  if (message === 'Lab tidak ditemukan.') {
    statusCode = 404;
  } else if (
    message.includes('Selesaikan seluruh materi prasyarat')
  ) {
    statusCode = 403;
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// GET DETAIL LAB
export const getLabExerciseController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { labId } = req.params;

    const lab = await getLabExercise(userId, labId);

    if (!lab.is_unlocked) {
      return res.status(403).json({
        success: false,
        message:
          'Selesaikan seluruh materi prasyarat sebelum mengerjakan Lab ini.',
      });
    }

    return res.status(200).json({
      success: true,
      data: lab,
    });
  } catch (error) {
    return handleLabError(res, error);
  }
};

// START LAB
export const startLabController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { labId } = req.params;

    const result = await startLab(userId, labId);

    return res.status(200).json({
      success: true,
      message: 'Lab berhasil dimulai.',
      data: result,
    });
  } catch (error) {
    return handleLabError(res, error);
  }
};

// SUBMIT LAB
export const submitLabController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { labId } = req.params;
    const { code } = req.body;

    const result = await submitLab(userId, labId, code);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleLabError(res, error);
  }
};
