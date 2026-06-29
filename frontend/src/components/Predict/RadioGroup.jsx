import React from "react";

export default function RadioGroup({
  label,
  value,
  options,
  onChange,
  columns = 2,
}) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block font-medium font-nunito text-gray-700">
          {label}
        </label>
      )}

      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                p-4 rounded-xl border text-left transition-all duration-200
                ${
                  active
                    ? "border-red-600 bg-red-50"
                    : "border-gray-200 bg-white hover:border-red-400"
                }
              `}
            >
              <div className="flex items-start gap-3">
                {Icon && (
                  <Icon
                    className={`text-xl ${
                      active ? "text-red-600" : "text-gray-500"
                    }`}
                  />
                )}

                <div>
                  <h3
                    className={`font-semibold font-poppins ${
                      active ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {option.label}
                  </h3>

                  {option.description && (
                    <p className="text-sm text-gray-500 mt-1 font-nunito">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}