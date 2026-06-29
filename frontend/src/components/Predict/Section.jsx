import React from "react";

export default function Section({
  title,
  icon: Icon,
  subtitle,
  children,
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
            <Icon className="text-red-600 text-xl" />
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold font-poppins text-gray-900">
            {title}
          </h2>

          {subtitle && (
            <p className="text-sm text-gray-500 font-nunito mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}