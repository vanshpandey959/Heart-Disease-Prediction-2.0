import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const runPrediction = createAsyncThunk(
  "prediction/run",
  async (formData, { rejectWithValue }) => {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) return rejectWithValue("Prediction failed. Check that the backend is running.");
    return res.json();
  }
);

const initialState = {
  result: null,
  status: "idle",
  error: null,
  // "live"  -> came from a fresh /predict call on PredictPage (show Save button)
  // "saved" -> came from ReportsPage, viewing a previously saved report
  //            (show Generate Plan button instead, hide Save)
  source: null,
};

const predictionSlice = createSlice({
  name: "prediction",
  initialState,
  reducers: {
    clearPrediction: (state) => {
      state.result = null;
      state.status = "idle";
      state.error = null;
      state.source = null;
    },
    // Used by ReportsPage to reuse ResultsPage for viewing a saved report,
    // instead of duplicating the whole gauge/chart/summary UI in a modal.
    viewSavedResult: (state, action) => {
      state.result = action.payload;
      state.status = "succeeded";
      state.error = null;
      state.source = "saved";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runPrediction.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(runPrediction.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.result = action.payload;
        state.source = "live";
      })
      .addCase(runPrediction.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearPrediction, viewSavedResult } = predictionSlice.actions;
export default predictionSlice.reducer;