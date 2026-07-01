import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const authHeader = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ── Thunks ────────────────────────────────────────────────────────────────────

export const generatePlan = createAsyncThunk(
  "wellness/generate",
  async ({ report_id, questionnaire }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/wellness/generate`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ report_id, questionnaire }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return rejectWithValue(err.detail || "Plan generation failed.");
    }
    return res.json();
  }
);

export const fetchPlans = createAsyncThunk(
  "wellness/fetchPlans",
  async (report_id = null, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const url = report_id
      ? `${API_URL}/wellness/plans/${report_id}`
      : `${API_URL}/wellness/plans`;
    const res = await fetch(url, { headers: authHeader(token) });
    if (!res.ok) return rejectWithValue("Could not load plans.");
    return res.json();
  }
);

export const deletePlan = createAsyncThunk(
  "wellness/deletePlan",
  async (planId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/wellness/plans/${planId}`, {
      method: "DELETE",
      headers: authHeader(token),
    });
    if (!res.ok) return rejectWithValue("Could not delete plan.");
    return planId;
  }
);

export const activatePlan = createAsyncThunk(
  "wellness/activate",
  async (plan_id, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/wellness/activate/${plan_id}`, {
      method: "POST",
      headers: authHeader(token),
    });
    if (!res.ok) return rejectWithValue("Could not activate plan.");
    return res.json();
  }
);

export const fetchActivePlan = createAsyncThunk(
  "wellness/fetchActive",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/wellness/active`, {
      headers: authHeader(token),
    });
    if (!res.ok) return rejectWithValue("Could not fetch active plan.");
    const data = await res.json();
    return data; // null if no active plan
  }
);

export const fetchTodayTracking = createAsyncThunk(
  "wellness/fetchTracking",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/wellness/tracking/today`, {
      headers: authHeader(token),
    });
    if (!res.ok) return rejectWithValue("Could not fetch tracking.");
    return res.json();
  }
);

export const updateRoutineTracking = createAsyncThunk(
  "wellness/updateRoutine",
  async ({ plan_id, task_key, done }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/wellness/tracking/routine`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ plan_id, task_key, done }),
    });
    if (!res.ok) return rejectWithValue("Could not update tracking.");
    return res.json();
  }
);

export const updateDietTracking = createAsyncThunk(
  "wellness/updateDiet",
  async ({ plan_id, meal, done }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const res = await fetch(`${API_URL}/wellness/tracking/diet`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ plan_id, meal, done }),
    });
    if (!res.ok) return rejectWithValue("Could not update diet tracking.");
    return res.json();
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const wellnessSlice = createSlice({
  name: "wellness",
  initialState: {
    plans: [],                // plans for a specific report
    activePlan: null,          // the currently-followed plan
    todayTracking: null,        // today's tracking doc
    generateStatus: "idle",     // "idle"|"loading"|"succeeded"|"failed"
    generateError: null,
    plansStatus: "idle",
    activateStatus: "idle",
    trackingStatus: "idle",
    chatOpen: false,           // controls WellnessChatModal visibility
    chatReportId: null,         // which report the chat is for
    chatReportData: null,       // full report data passed to modal
  },
  reducers: {
    openWellnessChat: (state, action) => {
      state.chatOpen = true;
      state.chatReportId = action.payload.reportId;
      state.chatReportData = action.payload.reportData;
      state.generateStatus = "idle";
      state.generateError = null;
    },
    closeWellnessChat: (state) => {
      state.chatOpen = false;
      state.chatReportId = null;
      state.chatReportData = null;
    },
    clearPlans: (state) => {
      state.plans = [];
      state.plansStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate
      .addCase(generatePlan.pending, (state) => {
        state.generateStatus = "loading";
        state.generateError = null;
      })
      .addCase(generatePlan.fulfilled, (state, action) => {
        state.generateStatus = "succeeded";
        state.chatOpen = false;
        state.plans.unshift(action.payload);
      })
      .addCase(generatePlan.rejected, (state, action) => {
        state.generateStatus = "failed";
        state.generateError = action.payload;
      })
      // Fetch plans
      .addCase(fetchPlans.pending, (state) => { state.plansStatus = "loading"; })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.plansStatus = "succeeded";
        state.plans = action.payload;
      })
      .addCase(fetchPlans.rejected, (state) => { state.plansStatus = "failed"; })
      // Delete
      .addCase(deletePlan.fulfilled, (state, action) => {
        state.plans = state.plans.filter((p) => p.id !== action.payload);
        if (state.activePlan?.id === action.payload) {
          state.activePlan = null;
          state.todayTracking = null;
        }
      })
      // Activate
      .addCase(activatePlan.fulfilled, (state, action) => {
        state.activePlan = action.payload;
        state.activateStatus = "succeeded";
        // Mark is_active correctly in local plans list too
        state.plans = state.plans.map((p) => ({
          ...p,
          is_active: p.id === action.payload.id,
        }));
      })
      // Fetch active
      .addCase(fetchActivePlan.fulfilled, (state, action) => {
        state.activePlan = action.payload;
      })
      // Tracking
      .addCase(fetchTodayTracking.fulfilled, (state, action) => {
        state.todayTracking = action.payload;
      })
      .addCase(updateRoutineTracking.fulfilled, (state, action) => {
        state.todayTracking = action.payload;
      })
      .addCase(updateDietTracking.fulfilled, (state, action) => {
        state.todayTracking = action.payload;
      });
  },
});

export const { openWellnessChat, closeWellnessChat, clearPlans } = wellnessSlice.actions;
export default wellnessSlice.reducer;