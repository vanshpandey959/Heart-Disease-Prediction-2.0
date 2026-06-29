import React from "react";

export default function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="font-medium font-nunito text-gray-600">
          {label}
        </label>

        <span className="text-sm font-roboto font-semibold text-red-600">
          {value} {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          w-full
          h-2
          rounded-lg
          cursor-pointer
          accent-red-600
        "
      />

      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}