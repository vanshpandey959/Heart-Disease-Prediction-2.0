import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiEye, FiX } from "react-icons/fi";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { fetchHistory, deletePrediction } from "../store/slices/historySlice";

const riskColor = (level) =>
  level === "High" ? "#B91C1C" : level === "Moderate" ? "#D97706" : "#15803D";

export default function ReportsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status } = useSelector((state) => state.history);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    dispatch(fetchHistory());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm("Delete this saved report?")) {
      dispatch(deletePrediction(id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Header */}
      <div className="border-b bg-white text-center shadow-sm py-8 px-6">
        <h1
          className="text-3xl font-black text-red-600"
          style={{ fontFamily: "Archivo Black, sans-serif" }}
        >
          Your Reports
        </h1>
        <p className="text-gray-500 mt-2" style={{ fontFamily: "Nunito, sans-serif" }}>
          All your saved heart disease risk assessments
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">

        {status === "loading" && (
          <p className="text-center text-gray-400 py-12">Loading your reports...</p>
        )}

        {status === "succeeded" && items.length === 0 && (
          <div className="flex flex-col items-center text-center py-16">
            <HiOutlineClipboardDocumentList className="text-5xl text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium" style={{ fontFamily: "Nunito, sans-serif" }}>
              No saved reports yet
            </p>
            <button
              onClick={() => navigate("/predict")}
              className="mt-4 px-6 py-2.5 rounded-full font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              Run an Assessment
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className="w-3 h-12 rounded-full shrink-0"
                  style={{ background: riskColor(item.risk_level) }}
                />
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">{item.prediction_label}</p>
                  <p className="text-sm text-gray-400" style={{ fontFamily: "Nunito, sans-serif" }}>
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                    {" · "}
                    <span style={{ color: riskColor(item.risk_level) }} className="font-semibold">
                      {item.risk_level} Risk
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setViewing(item)}
                  className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="View details"
                >
                  <FiEye />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-bold text-lg text-gray-800">{viewing.prediction_label}</h2>
              <button onClick={() => setViewing(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="rounded-xl p-4 text-center font-bold text-lg"
                style={{
                  background: riskColor(viewing.risk_level) + "12",
                  color: riskColor(viewing.risk_level),
                }}
              >
                {Math.round(viewing.probability_disease * 100)}% Risk Score
              </div>

              {viewing.explanation && (
                <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "Nunito, sans-serif" }}>
                  {viewing.explanation}
                </p>
              )}

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t">
                {Object.entries(viewing.input_summary || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1">
                    <span className="text-xs text-gray-400">{k}</span>
                    <span className="text-xs font-semibold text-gray-700">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}