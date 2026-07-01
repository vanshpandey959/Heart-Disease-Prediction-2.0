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
};

const predictionSlice = createSlice({
  name: "prediction",
  initialState,
  reducers: {
    clearPrediction: (state) => {
      state.result = null;
      state.status = "idle";
      state.error = null;
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
      })
      .addCase(runPrediction.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearPrediction } = predictionSlice.actions;
export default predictionSlice.reducer;