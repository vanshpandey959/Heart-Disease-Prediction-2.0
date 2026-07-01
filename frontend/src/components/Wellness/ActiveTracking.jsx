import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCheck, FiClock, FiSun } from "react-icons/fi";
import {
  fetchTodayTracking,
  updateRoutineTracking,
  updateDietTracking,
} from "../../store/slices/wellnessSlice";

const CATEGORY_COLORS = {
  Exercise: "#B91C1C",
  Medication: "#7C3AED",
  Hydration: "#0284C7",
  Rest: "#15803D",
  Mindfulness: "#D97706",
  Other: "#6B7280",
};

const MEALS = [
  ["breakfast", "Breakfast"],
  ["lunch", "Lunch"],
  ["snacks", "Snacks"],
  ["dinner", "Dinner"],
];

export default function ActiveTracking() {
  const dispatch = useDispatch();
  const { activePlan, todayTracking } = useSelector((s) => s.wellness);

  useEffect(() => {
    if (activePlan) dispatch(fetchTodayTracking());
  }, [dispatch, activePlan]);

  if (!activePlan) {
    return (
      <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"
        style={{ fontFamily: "Nunito, sans-serif" }}>
        <FiSun className="text-4xl text-gray-300 mx-auto mb-2" />
        <p className="font-medium text-gray-500">No active plan</p>
        <p className="text-sm mt-1">
          Go to "My Plans" and click "Follow this Plan" on the one you'd like to track daily.
        </p>
      </div>
    );
  }

  const routine = activePlan.routine || [];
  const diet = activePlan.diet || {};
  const routineDone = todayTracking?.routine_done || {};
  const dietDone = todayTracking?.diet_done || {};

  const totalTasks = routine.length + MEALS.length;
  const doneTasks =
    Object.values(routineDone).filter(Boolean).length +
    Object.values(dietDone).filter(Boolean).length;
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Routine tasks are tracked by index ("r0", "r1", ...). This is stable
  // because a plan's routine array order never changes after generation.
  const toggleRoutine = (index) => {
    const key = `r${index}`;
    dispatch(updateRoutineTracking({ plan_id: activePlan.id, task_key: key, done: !routineDone[key] }));
  };

  const toggleDiet = (meal) => {
    dispatch(updateDietTracking({ plan_id: activePlan.id, meal, done: !dietDone[meal] }));
  };

  return (
    <div className="space-y-6">

      {/* Progress header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-black text-gray-800" style={{ fontFamily: "Archivo Black, sans-serif" }}>
            Today's Progress
          </p>
          <span className="text-red-600 font-bold">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Routine table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <p className="font-bold text-gray-800">Daily Routine</p>
        </div>
        <div className="divide-y divide-gray-50">
          {routine.map((r, i) => {
            const key = `r${i}`;
            const done = !!routineDone[key];
            return (
              <button
                key={key}
                onClick={() => toggleRoutine(i)}
                className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  done ? "bg-green-500 border-green-500" : "border-gray-300"
                }`}>
                  {done && <FiCheck className="text-white text-sm" />}
                </span>
                <span className="text-xs font-semibold text-gray-400 w-16 shrink-0 flex items-center gap-1">
                  <FiClock size={12} />{r.time}
                </span>
                <span className={`flex-1 text-sm ${done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                  {r.task}
                </span>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0"
                  style={{
                    color: CATEGORY_COLORS[r.category] || CATEGORY_COLORS.Other,
                    background: (CATEGORY_COLORS[r.category] || CATEGORY_COLORS.Other) + "15",
                  }}
                >
                  {r.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diet table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <p className="font-bold text-gray-800">Diet Plan</p>
        </div>
        <div className="divide-y divide-gray-50">
          {MEALS.map(([key, label]) => {
            const items = diet[key] || [];
            const done = !!dietDone[key];
            return (
              <div key={key} className="px-5 py-4">
                <button onClick={() => toggleDiet(key)} className="flex items-center gap-3 mb-2">
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    done ? "bg-green-500 border-green-500" : "border-gray-300"
                  }`}>
                    {done && <FiCheck className="text-white text-sm" />}
                  </span>
                  <span className={`font-bold text-sm ${done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                    {label}
                  </span>
                </button>
                <div className="ml-9 space-y-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-500 gap-3">
                      <span>{it.item} <span className="text-gray-400">· {it.quantity}</span></span>
                      {it.notes && <span className="text-gray-400 italic shrink-0">{it.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}