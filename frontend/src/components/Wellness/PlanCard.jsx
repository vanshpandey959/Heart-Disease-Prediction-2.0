import { useState } from "react";
import { useDispatch } from "react-redux";
import { FiChevronDown, FiChevronUp, FiCheck, FiClock } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import { activatePlan } from "../../store/slices/wellnessSlice";

const riskColor = (level) =>
  level === "High" ? "#B91C1C" : level === "Moderate" ? "#D97706" : "#15803D";

const QUESTIONNAIRE_LABELS = {
  conditions: "Other Conditions",
  intolerances: "Intolerances",
  diet_type: "Diet Type",
  work_start: "Work Start",
  work_end: "Work End",
  breakfast_time: "Breakfast Time",
  lunch_time: "Lunch Time",
  snacks_time: "Snacks Time",
  dinner_time: "Dinner Time",
};

const MEALS = [
  ["breakfast", "Breakfast"],
  ["lunch", "Lunch"],
  ["snacks", "Snacks"],
  ["dinner", "Dinner"],
];

export default function PlanCard({ plan }) {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  const snapshot = plan.report_snapshot || {};
  const color = riskColor(snapshot.risk_level);

  const handleFollow = (e) => {
    e.stopPropagation();
    dispatch(activatePlan(plan.id));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-5 flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2.5 h-12 rounded-full shrink-0" style={{ background: color }} />
          <div className="min-w-0">
            <p className="font-bold text-gray-800 truncate">
              {snapshot.prediction_label || "Wellness Plan"}
            </p>
            <p className="text-xs text-gray-400" style={{ fontFamily: "Nunito, sans-serif" }}>
              {new Date(plan.created_at).toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric",
              })}
              {snapshot.risk_level && (
                <> · <span style={{ color }} className="font-semibold">{snapshot.risk_level} Risk</span></>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {plan.is_active ? (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold">
              <FiCheck /> Following
            </span>
          ) : (
            <span
              onClick={handleFollow}
              role="button"
              className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Follow this Plan
            </span>
          )}
          {expanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 p-5 space-y-5">

          {/* Why this plan */}
          {plan.reasoning && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex gap-2">
              <HiOutlineSparkles className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-500 mb-1">
                  Why this plan
                </p>
                <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: "Nunito, sans-serif" }}>
                  {plan.reasoning}
                </p>
              </div>
            </div>
          )}

          {/* Your inputs */}
          <div>
            <p className="font-bold text-gray-800 text-sm mb-2">Your Inputs</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {Object.entries(plan.questionnaire || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-50 py-1">
                  <span className="text-xs text-gray-400">{QUESTIONNAIRE_LABELS[k] || k}</span>
                  <span className="text-xs font-semibold text-gray-700">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Routine */}
          <div>
            <p className="font-bold text-gray-800 text-sm mb-2">Daily Routine</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {(plan.routine || []).map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="text-xs font-semibold text-gray-400 w-16 flex items-center gap-1 shrink-0">
                    <FiClock size={12} />{r.time}
                  </span>
                  <span className="flex-1 text-gray-700">{r.task}</span>
                  <span className="text-[10px] font-bold uppercase text-gray-400">{r.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div>
            <p className="font-bold text-gray-800 text-sm mb-2">Diet Plan</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {MEALS.map(([key, label]) => (
                <div key={key} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs font-bold uppercase text-red-600 mb-1.5">{label}</p>
                  <div className="space-y-1">
                    {(plan.diet?.[key] || []).map((it, idx) => (
                      <div key={idx} className="text-xs text-gray-600">
                        <span className="font-medium">{it.item}</span>
                        <span className="text-gray-400"> · {it.quantity}</span>
                        {it.notes && <span className="text-gray-400 italic"> — {it.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}