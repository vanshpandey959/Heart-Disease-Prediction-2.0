import { configureStore } from "@reduxjs/toolkit";
import authReducer       from "./slices/authSlice";
import predictionReducer from "./slices/predictionSlice";
import historyReducer    from "./slices/historySlice";
import wellnessReducer   from "./slices/wellnessSlice";

export const store = configureStore({
  reducer: {
    auth:       authReducer,
    prediction: predictionReducer,
    history:    historyReducer,
    wellness:   wellnessReducer,
  },
});