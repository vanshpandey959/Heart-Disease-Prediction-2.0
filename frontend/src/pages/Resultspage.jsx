import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FiAlertTriangle, FiCheckCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import RiskGauge from "../components/Results/RiskGauge";
import ShapChart from "../components/Results/ShapChart";
import ContributionPie from "../components/Results/ContributionPie";
import ProbabilityBar from "../components/Results/ProbabilityBar";

// ── Small reusable card wrapper ───────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm ${className}`}
  >
    {children}
  </div>
);

// ── Top 3 risk factor highlight cards ────────────────────────────────────────
const TopFactors = ({ contributions }) => {
  if (!contributions || Object.keys(contributions).length === 0) return null;

  const top = Object.entries(contributions)
    .filter(([, v]) => v > 0.01)
    .slice(0, 3);

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3">Top Risk Factors</h3>
      <div className="flex flex-col gap-3">
        {top.map(([label, val], i) => {
          const pct = Math.min(100, Math.round(Math.abs(val) * 400));
          return (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {i + 1}. {label}
                </span>
                <span className="text-red-600 font-bold">+{val.toFixed(3)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #B91C1C, #EF4444)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Groq explanation block ────────────────────────────────────────────────────
const ExplanationBlock = ({ text, riskLevel }) => {
  if (!text) return null;
  const isHigh = riskLevel === "High";
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: isHigh ? "#FEF2F2" : "#F0FDF4",
        border: `1px solid ${isHigh ? "#FECACA" : "#BBF7D0"}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <HiOutlineSparkles
          className="text-lg"
          style={{ color: isHigh ? "#B91C1C" : "#15803D" }}
        />
        <span
          className="font-bold text-sm uppercase tracking-widest"
          style={{ color: isHigh ? "#B91C1C" : "#15803D" }}
        >
          AI Explanation
        </span>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: "Nunito, sans-serif" }}>
        {text}
      </p>
    </div>
  );
};

// ── Input summary table ───────────────────────────────────────────────────────
const InputSummary = ({ inputs }) => {
  if (!inputs) return null;
  const rows = [
    ["Age", `${inputs.Age} yrs`],
    ["Sex", inputs.Sex === "M" ? "Male" : "Female"],
    ["Chest Pain", inputs.ChestPainType],
    ["Resting BP", `${inputs.RestingBP} mmHg`],
    ["Cholesterol", `${inputs.Cholesterol} mg/dL`],
    ["Fasting BS >120", inputs.FastingBS ? "Yes" : "No"],
    ["Resting ECG", inputs.RestingECG],
    ["Max HR", `${inputs.MaxHR} bpm`],
    ["Exercise Angina", inputs.ExerciseAngina === "Y" ? "Yes" : "No"],
    ["Oldpeak", `${inputs.Oldpeak} mm`],
    ["ST Slope", inputs.ST_Slope],
  ];
  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3">Your Input Summary</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-gray-50 py-1">
            <span className="text-xs text-gray-400">{k}</span>
            <span className="text-xs font-semibold text-gray-700">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Results Page ─────────────────────────────────────────────────────────
export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  // If navigated here directly without result, go back
  useEffect(() => {
    if (!result) navigate("/predict");
  }, [result, navigate]);

  if (!result) return null;

  const {
    prediction, prediction_label, probability_disease,
    probability_no_disease, risk_level, shap_contributions,
    explanation, input_summary,
  } = result;

  const isHigh = prediction === 1;
  const accentColor = isHigh ? "#B91C1C" : "#15803D";
  const hasSHAP = shap_contributions && Object.keys(shap_contributions).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* ── Page header ── */}
      <div
        className="py-10 px-6 text-center"
        style={{
          background: isHigh
            ? "linear-gradient(135deg, #7F1D1D, #B91C1C)"
            : "linear-gradient(135deg, #14532D, #15803D)",
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          {isHigh
            ? <FiAlertTriangle className="text-white text-3xl" />
            : <FiCheckCircle className="text-white text-3xl" />}
          <h1 className="text-3xl font-black text-white">{prediction_label}</h1>
        </div>
        <p className="text-white/70 text-sm">
          Based on your 11 clinical inputs · AI-powered analysis
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">

        {/* ── Row 1: Gauge + Probability + Top Factors ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <Card className="flex flex-col items-center justify-center">
            <RiskGauge probability={probability_disease} riskLevel={risk_level} />
          </Card>

          <Card>
            <ProbabilityBar
              probDisease={probability_disease}
              probNoDisease={probability_no_disease}
            />
          </Card>

          <Card>
            <TopFactors contributions={shap_contributions} />
          </Card>

        </div>

        {/* ── Groq Explanation ── */}
        {explanation && (
          <ExplanationBlock text={explanation} riskLevel={risk_level} />
        )}

        {/* ── Row 2: SHAP bar + Pie ── */}
        {hasSHAP && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <ShapChart contributions={shap_contributions} />
            </Card>
            <Card>
              <ContributionPie contributions={shap_contributions} />
            </Card>
          </div>
        )}

        {/* ── Row 3: Input summary ── */}
        <Card>
          <InputSummary inputs={input_summary} />
        </Card>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <button
            onClick={() => navigate("/predict")}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-white transition-all hover:opacity-90"
            style={{ background: accentColor }}
          >
            <FiRefreshCw />
            Re-assess
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold border-2 text-gray-700 border-gray-200 bg-white hover:bg-gray-50 transition-all"
          >
            <FiArrowLeft />
            Back to Home
          </button>
        </div>

        {/* ── Disclaimer ── */}
        <p className="text-center text-xs text-gray-400 pt-2">
          ⚕️ This is a screening tool only. Always consult a qualified cardiologist for medical decisions.
        </p>

      </div>
    </div>
  );
}