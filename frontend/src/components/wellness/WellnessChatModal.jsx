import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiX } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import { generatePlan, closeWellnessChat } from "../../store/slices/wellnessSlice";

const defaultQ = {
  conditions: "none",
  intolerances: "none",
  diet_type: "non-vegetarian",
  work_start: "09:00",
  work_end: "17:00",
  breakfast_time: "08:00",
  lunch_time: "13:00",
  snacks_time: "16:00",
  dinner_time: "20:00",
};

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-semibold text-gray-700"
      style={{ fontFamily: "Nunito, sans-serif" }}>{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none text-sm text-gray-800";

export default function WellnessChatModal() {
  const dispatch = useDispatch();
  const { chatReportId, chatReportData, generateStatus, generateError } =
    useSelector((s) => s.wellness);
  const [q, setQ] = useState(defaultQ);

  const set = (key) => (e) => setQ((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatReportId || !chatReportData) return;
    dispatch(generatePlan({ report_id: chatReportId, questionnaire: q }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2">
            <HiOutlineSparkles className="text-red-600 text-xl" />
            <h2 className="font-bold text-gray-800 text-lg">Generate Wellness Plan</h2>
          </div>
          <button onClick={() => dispatch(closeWellnessChat())}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Diet type */}
          <Field label="Diet Type">
            <div className="grid grid-cols-3 gap-2">
              {["non-vegetarian", "vegetarian", "vegan"].map((opt) => (
                <button key={opt} type="button"
                  onClick={() => setQ((prev) => ({ ...prev, diet_type: opt }))}
                  className={`py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    q.diet_type === opt
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-red-400"
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          </Field>

          {/* Conditions & intolerances */}
          <Field label="Medical Conditions (or 'none')">
            <input type="text" value={q.conditions} onChange={set("conditions")}
              placeholder="e.g. diabetes, hypertension" className={inputCls} />
          </Field>

          <Field label="Food Intolerances / Allergies (or 'none')">
            <input type="text" value={q.intolerances} onChange={set("intolerances")}
              placeholder="e.g. lactose, gluten" className={inputCls} />
          </Field>

          {/* Work hours */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Work Start">
              <input type="time" value={q.work_start} onChange={set("work_start")} className={inputCls} />
            </Field>
            <Field label="Work End">
              <input type="time" value={q.work_end} onChange={set("work_end")} className={inputCls} />
            </Field>
          </div>

          {/* Meal timings */}
          <p className="text-sm font-bold text-gray-600" style={{ fontFamily: "Nunito, sans-serif" }}>
            Meal Timings
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Breakfast">
              <input type="time" value={q.breakfast_time} onChange={set("breakfast_time")} className={inputCls} />
            </Field>
            <Field label="Lunch">
              <input type="time" value={q.lunch_time} onChange={set("lunch_time")} className={inputCls} />
            </Field>
            <Field label="Snacks">
              <input type="time" value={q.snacks_time} onChange={set("snacks_time")} className={inputCls} />
            </Field>
            <Field label="Dinner">
              <input type="time" value={q.dinner_time} onChange={set("dinner_time")} className={inputCls} />
            </Field>
          </div>

          {generateError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
              {generateError}
            </div>
          )}

          <button type="submit"
            disabled={generateStatus === "loading"}
            className="w-full py-3 rounded-full font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: "Nunito, sans-serif" }}>
            <HiOutlineSparkles />
            {generateStatus === "loading" ? "Generating your plan..." : "Generate Plan"}
          </button>
        </form>
      </div>
    </div>
  );
}