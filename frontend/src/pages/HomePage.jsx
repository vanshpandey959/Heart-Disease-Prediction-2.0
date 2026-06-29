import { useNavigate } from "react-router-dom";
import {
  HiOutlineHeart,
  HiOutlineCpuChip,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineArrowRight,
} from "react-icons/hi2";

const StatCard = ({ value, label }) => (
  <div className="flex flex-col items-center gap-1 px-8 py-5 rounded-xl bg-red-50 border border-red-100">
    <span
      className="text-3xl font-black text-red-600"
      style={{ fontFamily: "Archivo Black, sans-serif" }}
    >
      {value}
    </span>

    <span
      className="text-sm text-gray-500 text-center"
      style={{ fontFamily: "Nunito, sans-serif" }}
    >
      {label}
    </span>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="flex flex-col gap-3 p-6 rounded-xl bg-white border border-red-100 hover:shadow-md transition-all">
    <div className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl text-white bg-red-700">
      {icon}
    </div>

    <h3
      className="font-bold text-red-600 text-base"
      style={{ fontFamily: "Archivo Black, sans-serif" }}
    >
      {title}
    </h3>

    <p
      className="text-gray-500 text-sm leading-relaxed"
      style={{ fontFamily: "Nunito, sans-serif" }}
    >
      {desc}
    </p>
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="flex flex-col items-center text-center pt-15 pb-14 px-6">

        <div
          className="inline-flex items-center gap-2 px-4 py-3 rounded-full mb-6 text-medium font-semibold text-red-600 bg-red-50 border border-red-200"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          <HiOutlineHeart className="text-xl" />
          <span>Good Heart, Good Health</span>
        </div>

        <h1
          className="text-5xl md:text-6xl font-black text-red-600 leading-tight mb-4"
          style={{ fontFamily: "Archivo Black, sans-serif" }}
        >
          Know Your Heart
          <br />
          Before It's Too Late
        </h1>

        <p
          className="text-gray-500 text-lg max-w-xl leading-relaxed mb-8"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Heart disease is the world's #1 silent killer. Our AI model predicts
          your risk in seconds — so you can act before symptoms appear.
        </p>

        <button
          onClick={() => navigate("/predict")}
          className="px-10 py-4 rounded-full font-bold text-white text-lg bg-red-600 hover:bg-red-700 transition-colors"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <HiOutlineHeart className="text-xl" />
            <span>Check Heart Disease with my AI Model</span>
          </div>
        </button>

      </section>

      {/* Stats */}

      <section className="flex justify-center gap-5 px-6 pb-16 flex-wrap">

        <StatCard
          value="918+"
          label="Clinical records trained on"
        />

        <StatCard
          value="≥90%"
          label="Model accuracy (ROC-AUC)"
        />

        <StatCard
          value="11"
          label="Risk factors analyzed"
        />

        <StatCard
          value="<10s"
          label="Prediction time"
        />

      </section>

      {/* Divider */}

      <div className="w-full flex items-center gap-4 px-12 mb-14">
        <div className="flex-1 h-px bg-red-100" />

        <HiOutlineHeart className="text-red-300 text-xl" />

        <div className="flex-1 h-px bg-red-100" />
      </div>

      {/* Features */}

      <section className="max-w-5xl mx-auto px-6 pb-20">

        <h2
          className="text-center text-3xl font-black text-gray-800 mb-2"
          style={{ fontFamily: "Archivo Black, sans-serif" }}
        >
          Why <span className="text-red-600">HeartPredict?</span>
        </h2>

        <p
          className="text-center text-gray-400 text-sm mb-10"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Built with clinical rigor. Designed for everyone.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <FeatureCard
            icon={<HiOutlineCpuChip />}
            title="AI-Powered Analysis"
            desc="Ensemble model combining XGBoost, ExtraTrees, and Logistic Regression for maximum accuracy."
          />

          <FeatureCard
            icon={<HiOutlineShieldCheck />}
            title="Clinically Validated"
            desc="Based on 11 real clinical indicators — the same your cardiologist would measure."
          />

          <FeatureCard
            icon={<HiOutlineChartBar />}
            title="Instant Reports"
            desc="Get a detailed risk breakdown with contributing factors, not just a yes/no result."
          />

          <FeatureCard
            icon={<HiOutlineSparkles />}
            title="Personalized Plans"
            desc="Diet, routine, and emergency guidance tailored to your cardiovascular risk profile."
          />

        </div>

      </section>
            {/* How It Works */}
      <section className="py-10 px-6 bg-red-700">
        <h2
          className="text-center text-3xl font-black text-white mb-8"
          style={{ fontFamily: "Archivo Black, sans-serif" }}
        >
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
          {[
            {
              step: "1",
              label: "Enter your health data",
              icon: <HiOutlineClipboardDocumentList />,
            },
            {
              step: "2",
              label: "AI processes 11 risk factors",
              icon: <HiOutlineCpuChip />,
            },
            {
              step: "3",
              label: "Receive your risk prediction",
              icon: <HiOutlineChartBar />,
            },
          ].map(({ step, label, icon }, i) => (
            <div
              key={step}
              className="relative flex flex-col items-center text-center bg-white/10 border border-white/20 rounded-2xl px-6 py-7 gap-4"
            >
              {i < 2 && (
                <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 items-center justify-center text-white/60">
                  <HiOutlineArrowRight className="text-2xl" />
                </div>
              )}

              <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-white text-3xl">
                {icon}
              </div>

              <span
                className="text-xs tracking-widest uppercase text-red-100 font-black"
                style={{ fontFamily: "Archivo Black, sans-serif" }}
              >
                Step {step}
              </span>

              <p
                className="text-white font-semibold leading-relaxed"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/predict")}
            className="px-8 py-3 rounded-full font-bold text-red-700 bg-white hover:bg-red-50 transition-colors"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            <div className="flex items-center gap-2">
              <span>Start My Assessment</span>
              <HiOutlineArrowRight className="text-lg" />
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 px-6"
        style={{ fontFamily: "Nunito, sans-serif" }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <HiOutlineHeart className="text-red-500 text-3xl" />

          <p className="text-gray-500 text-sm max-w-2xl">
            HeartPredict is a screening tool and should not be considered a
            substitute for professional medical advice, diagnosis, or treatment.
            Always consult a qualified cardiologist for medical decisions.
          </p>

          <div className="w-20 h-px bg-red-200 my-1" />

          <span className="text-red-600 font-semibold text-sm">
            Heart Disease Prediction Model V1 · Built with ❤️
          </span>
        </div>
      </footer>
    </div>
  );
}