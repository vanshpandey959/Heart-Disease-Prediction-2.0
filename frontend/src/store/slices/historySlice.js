import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const fetchHistory = createAsyncThunk(
  "history/fetch",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/history/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return rejectWithValue("Could not load history");
    return res.json();
  }
);

export const savePrediction = createAsyncThunk(
  "history/save",
  async (predictionResult, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("Log in to save this result");

    const res = await fetch(`${API_URL}/history/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(predictionResult),
    });
    if (!res.ok) return rejectWithValue("Could not save result");
    return res.json();
  }
);

export const deletePrediction = createAsyncThunk(
  "history/delete",
  async (predictionId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/history/${predictionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return rejectWithValue("Could not delete");
    return predictionId;
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    clearSaveStatus: (state) => {
      state.saveStatus = "idle";
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchHistory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Save
      .addCase(savePrediction.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(savePrediction.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(savePrediction.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload;
      })
      // Delete
      .addCase(deletePrediction.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearSaveStatus } = historySlice.actions;
export default historySlice.reducer;