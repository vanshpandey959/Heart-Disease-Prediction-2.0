import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiUser, FiActivity, FiHeart,
  FiTrendingUp, FiTrendingDown, FiBarChart2, FiAlertCircle,
} from "react-icons/fi";

import Section from "../components/Predict/Section";
import Slider from "../components/Predict/Slider";
import Toggle from "../components/Predict/Toggle";
import RadioGroup from "../components/Predict/RadioGroup";
import Button from "../components/Predict/Button";
import { runPrediction } from "../store/slices/predictionSlice";

const defaultForm = {
  Age: 50, Sex: "M", ChestPainType: "ATA",
  RestingBP: 130, Cholesterol: 200, FastingBS: 0,
  RestingECG: "Normal", MaxHR: 140, ExerciseAngina: "N",
  Oldpeak: 0, ST_Slope: "Up",
};

export default function PredictPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.prediction);
  const [form, setForm] = useState(defaultForm);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handlePredict = async () => {
    const result = await dispatch(runPrediction(form));
    if (runPrediction.fulfilled.match(result)) {
      navigate("/results");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="border-b bg-white text-center shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Heart Disease Prediction</h1>
          <p className="mt-2 text-gray-500">
            Enter your health information to estimate your heart disease risk.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">

          <Section title="Personal Information" subtitle="Basic demographic details" icon={FiUser}>
            <div className="space-y-8">
              <Slider label="Age" value={form.Age} min={20} max={80} unit="Years" onChange={set("Age")} />
              <Toggle
                label="Biological Sex"
                value={form.Sex}
                onChange={set("Sex")}
                options={[{ label: "Male", value: "M" }, { label: "Female", value: "F" }]}
              />
              <RadioGroup
                label="Chest Pain Type"
                value={form.ChestPainType}
                onChange={set("ChestPainType")}
                columns={2}
                options={[
                  { label: "Typical Angina",   value: "TA",  description: "Classic chest pain",    icon: FiHeart },
                  { label: "Atypical Angina",  value: "ATA", description: "Different from typical", icon: FiAlertCircle },
                  { label: "Non Anginal Pain", value: "NAP", description: "Usually not cardiac",    icon: FiActivity },
                  { label: "Asymptomatic",     value: "ASY", description: "No chest pain",          icon: FiBarChart2 },
                ]}
              />
            </div>
          </Section>

          <Section title="Clinical Measurements" subtitle="Vitals and laboratory values" icon={FiActivity}>
            <div className="space-y-8">
              <Slider label="Resting Blood Pressure" value={form.RestingBP} min={80}  max={200} unit="mmHg"  onChange={set("RestingBP")} />
              <Slider label="Serum Cholesterol"       value={form.Cholesterol} min={100} max={600} step={5} unit="mg/dL" onChange={set("Cholesterol")} />
              <Slider label="Maximum Heart Rate"      value={form.MaxHR}      min={60}  max={220} unit="bpm"   onChange={set("MaxHR")} />
              <Slider label="Old Peak"                value={form.Oldpeak}    min={-3}  max={7}   step={0.1} unit="mm" onChange={set("Oldpeak")} />
              <Toggle
                label="Fasting Blood Sugar > 120 mg/dL"
                value={form.FastingBS}
                onChange={set("FastingBS")}
                options={[{ label: "No", value: 0 }, { label: "Yes", value: 1 }]}
              />
            </div>
          </Section>

          <Section title="ECG Information" subtitle="Electrocardiogram findings" icon={FiBarChart2}>
            <RadioGroup
              label="Resting ECG"
              value={form.RestingECG}
              onChange={set("RestingECG")}
              columns={3}
              options={[
                { label: "Normal", value: "Normal", icon: FiActivity },
                { label: "ST",     value: "ST",     description: "ST-T Wave Abnormality",        icon: FiTrendingUp },
                { label: "LVH",    value: "LVH",    description: "Left Ventricular Hypertrophy", icon: FiHeart },
              ]}
            />
          </Section>

          <Section title="Exercise Test" subtitle="Exercise induced measurements" icon={FiTrendingUp}>
            <div className="space-y-8">
              <Toggle
                label="Exercise Induced Angina"
                value={form.ExerciseAngina}
                onChange={set("ExerciseAngina")}
                options={[{ label: "Yes", value: "Y" }, { label: "No", value: "N" }]}
              />
              <RadioGroup
                label="ST Slope"
                value={form.ST_Slope}
                onChange={set("ST_Slope")}
                columns={3}
                options={[
                  { label: "Up",   value: "Up",   description: "Up Sloping",  icon: FiTrendingUp },
                  { label: "Flat", value: "Flat", description: "Flat",         icon: FiActivity },
                  { label: "Down", value: "Down", description: "Down Sloping", icon: FiTrendingDown },
                ]}
              />
            </div>
          </Section>

        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 font-medium text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-10">
          <Button icon={FiHeart} loading={status === "loading"} onClick={handlePredict}>
            Predict Heart Disease
          </Button>
        </div>
      </div>
    </div>
  );
}