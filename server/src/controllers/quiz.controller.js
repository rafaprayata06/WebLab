import {
  getQuizByModule,
  startQuiz,
  submitQuiz,
  getQuizResult,
} from '../services/quiz.service.js';

import {
  getQuizHistory,
} from '../services/quizHistory.service.js';

// =====================================================
// GET QUIZ BY MODULE
// =====================================================

export const getQuizByModuleController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;

    const result = await getQuizByModule(userId, moduleId);

    return res.status(200).json({
      success: true,
      message: 'Quiz berhasil dimuat.',
      data: result,
    });
  } catch (error) {
    console.error('GET QUIZ ERROR:', error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET QUIZ HISTORY
// =====================================================

export const getQuizHistoryController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;

    const result = await getQuizHistory(userId, moduleId);

    return res.status(200).json({
      success: true,
      message: 'Riwayat Quiz berhasil dimuat.',
      data: result,
    });
  } catch (error) {
    console.error('GET QUIZ HISTORY ERROR:', error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// START QUIZ
// =====================================================

export const startQuizController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;

    const result = await startQuiz(userId, moduleId);

    return res.status(200).json({
      success: true,
      message: 'Quiz berhasil dimulai.',
      data: result,
    });
  } catch (error) {
    console.error('START QUIZ ERROR:', error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// SUBMIT QUIZ
// =====================================================

export const submitQuizController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;
    const { answers } = req.body;

    console.log('\n====================================');
    console.log('QUIZ SUBMISSION - CONTROLLER');
    console.log('====================================');

    console.log('USER ID:', userId);
    console.log('ATTEMPT ID:', attemptId);
    console.log(
      'REQUEST BODY:',
      JSON.stringify(req.body, null, 2)
    );

    console.log('ANSWERS TYPE:', typeof answers);
    console.log('ANSWERS IS ARRAY:', Array.isArray(answers));

    if (Array.isArray(answers)) {
      console.log('TOTAL ANSWERS:', answers.length);

      console.log(
        'QUESTION IDS:',
        answers.map((answer) => answer.question_id)
      );
    }

    console.log('====================================\n');

    const result = await submitQuiz(
      userId,
      attemptId,
      answers
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error('\n====================================');
    console.error('SUBMIT QUIZ ERROR');
    console.error('====================================');
    console.error(error);
    console.error('====================================\n');

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET QUIZ RESULT
// =====================================================

export const getQuizResultController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;

    const result = await getQuizResult(userId, attemptId);

    return res.status(200).json({
      success: true,
      message: 'Hasil Quiz berhasil dimuat.',
      data: result,
    });
  } catch (error) {
    console.error('GET QUIZ RESULT ERROR:', error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};