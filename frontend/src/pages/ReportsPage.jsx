import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiEye } from "react-icons/fi";
import { HiOutlineClipboardDocumentList, HiOutlineSparkles } from "react-icons/hi2";
import { fetchHistory, deletePrediction } from "../store/slices/historySlice";
import { openWellnessChat } from "../store/slices/wellnessSlice";
import { viewSavedResult } from "../store/slices/predictionSlice";

const riskColor = (level) =>
  level === "High" ? "#B91C1C" : level === "Moderate" ? "#D97706" : "#15803D";

export default function ReportsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status } = useSelector((s) => s.history);

  // Report numbers reflect chronological order (oldest = #1), independent of
  // display order, so a report keeps the same number even as new ones are added.
  const numberedItems = useMemo(() => {
    const chronological = [...items].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    const numberById = new Map(chronological.map((it, idx) => [it.id, idx + 1]));
    return items.map((it) => ({ ...it, reportNumber: numberById.get(it.id) }));
  }, [items]);

  useEffect(() => { dispatch(fetchHistory()); }, [dispatch]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this saved report?")) return;
    dispatch(deletePrediction(id));
  };

  // Reuses ResultsPage entirely (same gauge, SHAP charts, explanation, etc.)
  // instead of a separate, out-of-sync "detail modal" — loads the saved
  // report straight into the prediction slice and routes to /results.
  const handleView = (item) => {
    dispatch(viewSavedResult(item));
    navigate("/results");
  };

  const handleGeneratePlan = (item, e) => {
    e?.stopPropagation();
    dispatch(openWellnessChat({ reportId: item.id, reportData: item }));
    navigate("/wellness");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <div className="border-b bg-white text-center shadow-sm py-8 px-6">
        <h1 className="text-3xl font-black text-red-600"
          style={{ fontFamily: "Archivo Black, sans-serif" }}>
          Your Reports
        </h1>
        <p className="text-gray-500 mt-2" style={{ fontFamily: "Nunito, sans-serif" }}>
          All your saved heart disease risk assessments
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">

        {status === "loading" && (
          <p className="text-center text-gray-400 py-12" style={{ fontFamily: "Nunito, sans-serif" }}>
            Loading your reports...
          </p>
        )}

        {status === "succeeded" && items.length === 0 && (
          <div className="flex flex-col items-center text-center py-16">
            <HiOutlineClipboardDocumentList className="text-5xl text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium" style={{ fontFamily: "Nunito, sans-serif" }}>
              No saved reports yet
            </p>
            <button onClick={() => navigate("/predict")}
              className="mt-4 px-6 py-2.5 rounded-full font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
              Run an Assessment
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {numberedItems.map((item) => {
            const inputEntries = Object.entries(item.inputs || {});
            return (
              <div key={item.id}
                onClick={() => handleView(item)}
                className="group aspect-square bg-white border border-gray-100 rounded-xl p-5 shadow-sm cursor-pointer hover:border-red-100 transition-colors flex flex-col">

                {/* Header: report number + delete */}
                <div className="flex items-start justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 text-xs font-black shrink-0"
                      style={{ fontFamily: "Archivo Black, sans-serif" }}>
                      {String(item.reportNumber).padStart(2, "0")}
                    </span>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "Nunito, sans-serif" }}>
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                  <button onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete">
                    <FiTrash2 size={15} />
                  </button>
                </div>

                {/* Prediction + risk */}
                <div className="flex items-center gap-3 mt-3 shrink-0">
                  <div className="w-2.5 h-10 rounded-full shrink-0"
                    style={{ background: riskColor(item.risk_level) }} />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{item.prediction_label}</p>
                    <span style={{ color: riskColor(item.risk_level) }} className="text-xs font-semibold">
                      {item.risk_level} Risk · {Math.round(item.probability_disease * 100)}%
                    </span>
                  </div>
                </div>

                {/* Groq-generated summary */}
                {item.explanation && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-3 flex-1"
                    style={{ fontFamily: "Nunito, sans-serif" }}>
                    {item.explanation}
                  </p>
                )}

                {/* Key inputs used for this prediction */}
                {inputEntries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 overflow-hidden max-h-12">
                    {inputEntries.slice(0, 4).map(([key, value]) => (
                      <span key={key}
                        className="px-2 py-1 rounded-md bg-gray-50 text-gray-500 text-[11px] font-medium truncate max-w-[100px]"
                        style={{ fontFamily: "Nunito, sans-serif" }}>
                        {key}: {String(value)}
                      </span>
                    ))}
                    {inputEntries.length > 4 && (
                      <span className="px-2 py-1 rounded-md bg-gray-50 text-gray-400 text-[11px] font-medium"
                        style={{ fontFamily: "Nunito, sans-serif" }}>
                        +{inputEntries.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-4 shrink-0">
                  <button onClick={() => handleView(item)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 text-xs font-semibold bg-gray-50 hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: "Nunito, sans-serif" }}>
                    <FiEye size={13} />
                    View Full Report
                  </button>
                  <button onClick={(e) => handleGeneratePlan(item, e)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-100 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                    style={{ fontFamily: "Nunito, sans-serif" }}>
                    <HiOutlineSparkles size={13} />
                    Generate Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}