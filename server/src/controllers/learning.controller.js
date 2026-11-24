
import {
  getModules,
  getModuleDetail,
  startSubmodule,
  completeLesson,
  getSubmoduleProgress,
  updateReadingProgress,
} from '../services/learning.service.js';

// =========================================
// LEARNING ERROR HANDLER
// =========================================

const handleLearningError = (res, error, defaultMessage, action) => {
  console.error(`${action}:`, error);

  const clientErrorMessages = [
    'Submodul tidak ditemukan.',
    'Submodul tidak tersedia.',
    'Modul tidak ditemukan.',
    'Selesaikan seluruh submodul dan lulus kuis modul sebelumnya terlebih dahulu.',
    'Selesaikan seluruh submodul dan lulus kuis modul sebelumnya terlebih dahulu.',
    'Selesaikan submodul sebelumnya terlebih dahulu.',
    'Mulai submodul terlebih dahulu.',
    'Selesaikan seluruh materi terlebih dahulu.',
    'Reading progress harus berupa angka 0-100.',
  ];

  const statusCode =
    error.statusCode ||
    (clientErrorMessages.includes(error.message) ? 400 : 500);

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? defaultMessage
        : error.message,
  });
};

// =========================================
// GET ALL MODULES
// =========================================

export const getModulesController = async (req, res) => {
  try {
    const modules = await getModules(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Daftar modul berhasil diambil.',
      data: modules,
    });
  } catch (error) {
    console.error('Get modules error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar modul.',
    });
  }
};

// =========================================
// GET MODULE DETAIL
// =========================================

export const getModuleDetailController = async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);

    if (!Number.isSafeInteger(moduleId) || moduleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID modul tidak valid.',
      });
    }

    const module = await getModuleDetail(req.user.id, moduleId);

    return res.status(200).json({
      success: true,
      message: 'Detail modul berhasil diambil.',
      data: module,
    });
  } catch (error) {
    return handleLearningError(
      res,
      error,
      'Gagal mengambil detail modul.',
      'Get module detail error'
    );
  }
};

// =========================================
// START SUBMODULE
// =========================================

export const startSubmoduleController = async (req, res) => {
  try {
    const submoduleId = Number(req.params.submoduleId);

    if (!Number.isSafeInteger(submoduleId) || submoduleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID submodul tidak valid.',
      });
    }

    const progress = await startSubmodule(req.user.id, submoduleId);

    return res.status(200).json({
      success: true,
      message: 'Submodul berhasil dimulai.',
      data: progress,
    });
  } catch (error) {
    return handleLearningError(
      res,
      error,
      'Gagal memulai submodul.',
      'Start submodule error'
    );
  }
};

// =========================================
// COMPLETE LESSON
// =========================================

export const completeLessonController = async (req, res) => {
  try {
    const submoduleId = Number(req.params.submoduleId);

    if (!Number.isSafeInteger(submoduleId) || submoduleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID submodul tidak valid.',
      });
    }

    const progress = await completeLesson(req.user.id, submoduleId);

    return res.status(200).json({
      success: true,
      message: 'Materi berhasil ditandai selesai.',
      data: progress,
    });
  } catch (error) {
    return handleLearningError(
      res,
      error,
      'Gagal menyelesaikan materi.',
      'Complete lesson error'
    );
  }
};

// =========================================
// GET SUBMODULE PROGRESS
// =========================================

export const getSubmoduleProgressController = async (req, res) => {
  try {
    const submoduleId = Number(req.params.submoduleId);

    if (!Number.isSafeInteger(submoduleId) || submoduleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID submodul tidak valid.',
      });
    }

    const progress = await getSubmoduleProgress(
      req.user.id,
      submoduleId
    );

    return res.status(200).json({
      success: true,
      message: 'Progres submodul berhasil diambil.',
      data: progress,
    });
  } catch (error) {
    return handleLearningError(
      res,
      error,
      'Gagal mengambil progres submodul.',
      'Get submodule progress error'
    );
  }
};

// =========================================
// UPDATE READING PROGRESS
// =========================================

export const updateReadingProgressController = async (req, res) => {
  try {
    const submoduleId = Number(req.params.submoduleId);
    const { readingProgress } = req.body;

    if (!Number.isSafeInteger(submoduleId) || submoduleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID submodul tidak valid.',
      });
    }

    const progress = await updateReadingProgress(
      req.user.id,
      submoduleId,
      readingProgress
    );

    return res.status(200).json({
      success: true,
      message: 'Reading progress berhasil disimpan.',
      data: progress,
    });
  } catch (error) {
    return handleLearningError(
      res,
      error,
      'Gagal menyimpan reading progress.',
      'Update reading progress error'
    );
  }
};
