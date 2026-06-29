import React from "react";

export default function Toggle({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block font-medium font-nunito text-gray-700">
          {label}
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                py-3 rounded-xl border transition-all duration-200
                font-medium font-nunito
                ${
                  active
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-white border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600"
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}