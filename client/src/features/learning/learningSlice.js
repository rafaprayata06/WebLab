
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  getModules,
  getModuleDetail,
  startSubmodule,
  getSubmoduleProgress,
  updateReadingProgress,
  completeLesson,
} from './learningService';

// ======================================================
// DAFTAR MODUL
// ======================================================

export const fetchModules = createAsyncThunk(
  'learning/fetchModules',
  async (token, { rejectWithValue }) => {
    try {
      return await getModules(token);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ======================================================
// DETAIL MODUL
// ======================================================

export const fetchModuleDetail = createAsyncThunk(
  'learning/fetchModuleDetail',
  async ({ moduleId, token }, { rejectWithValue }) => {
    try {
      return await getModuleDetail({ moduleId, token });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ======================================================
// MEMULAI SUBMODUL
// ======================================================

export const beginSubmodule = createAsyncThunk(
  'learning/startSubmodule',
  async ({ submoduleId, token }, { rejectWithValue }) => {
    try {
      return await startSubmodule({ submoduleId, token });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ======================================================
// MENGAMBIL PROGRES SUBMODUL
// ======================================================

export const fetchSubmoduleProgress = createAsyncThunk(
  'learning/fetchSubmoduleProgress',
  async ({ submoduleId, token }, { rejectWithValue }) => {
    try {
      return await getSubmoduleProgress({ submoduleId, token });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ======================================================
// MENYIMPAN PROGRES MEMBACA
// ======================================================

export const saveReadingProgress = createAsyncThunk(
  'learning/saveReadingProgress',
  async (
    { submoduleId, token, readingProgress },
    { rejectWithValue }
  ) => {
    try {
      return await updateReadingProgress({
        submoduleId,
        token,
        readingProgress,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ======================================================
// MENYELESAIKAN MATERI
// ======================================================

export const finishLesson = createAsyncThunk(
  'learning/completeLesson',
  async ({ submoduleId, token }, { rejectWithValue }) => {
    try {
      return await completeLesson({ submoduleId, token });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ======================================================
// INITIAL STATE
// ======================================================

const initialState = {
  modules: [],
  status: 'idle',
  error: null,

  moduleDetail: null,
  detailStatus: 'idle',
  detailError: null,

  submoduleProgress: null,
  progressStatus: 'idle',
  progressError: null,

  completionStatus: 'idle',
  completionError: null,
};

// ======================================================
// LEARNING SLICE
// ======================================================

const learningSlice = createSlice({
  name: 'learning',
  initialState,

  reducers: {
    resetLearning: () => initialState,

    clearModuleDetail: (state) => {
      state.moduleDetail = null;
      state.detailStatus = 'idle';
      state.detailError = null;

      state.submoduleProgress = null;
      state.progressStatus = 'idle';
      state.progressError = null;

      state.completionStatus = 'idle';
      state.completionError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ==================================================
      // DAFTAR MODUL
      // ==================================================

      .addCase(fetchModules.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })

      .addCase(fetchModules.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.modules = action.payload;
      })

      .addCase(fetchModules.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // ==================================================
      // DETAIL MODUL
      // ==================================================

      .addCase(fetchModuleDetail.pending, (state) => {
        state.detailStatus = 'loading';
        state.detailError = null;

        // Pertahankan moduleDetail lama selama refresh.
        // Jangan set moduleDetail menjadi null di sini.
      })

      .addCase(fetchModuleDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.moduleDetail = action.payload;
      })

      .addCase(fetchModuleDetail.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload;
      })

      // ==================================================
      // PROGRES SUBMODUL
      // ==================================================

      .addCase(fetchSubmoduleProgress.pending, (state) => {
        state.progressStatus = 'loading';
        state.progressError = null;
      })

      .addCase(fetchSubmoduleProgress.fulfilled, (state, action) => {
        state.progressStatus = 'succeeded';
        state.submoduleProgress = action.payload;
      })

      .addCase(fetchSubmoduleProgress.rejected, (state, action) => {
        state.progressStatus = 'failed';
        state.progressError = action.payload;
      })

      // ==================================================
      // PENYELESAIAN MATERI
      // ==================================================

      .addCase(finishLesson.pending, (state) => {
        state.completionStatus = 'loading';
        state.completionError = null;
      })

      .addCase(finishLesson.fulfilled, (state) => {
        state.completionStatus = 'succeeded';
      })

      .addCase(finishLesson.rejected, (state, action) => {
        state.completionStatus = 'failed';
        state.completionError = action.payload;
      });
  },
});

// ======================================================
// EXPORT
// ======================================================

export const {
  resetLearning,
  clearModuleDetail,
} = learningSlice.actions;

export default learningSlice.reducer;
