import React from "react";

export default function Button({
  children,
  onClick,
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full
        flex
        items-center
        justify-center
        gap-2
        rounded-xl
        bg-red-600
        px-6
        py-3
        font-semibold
        font-poppins
        text-white
        transition
        hover:bg-red-700
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="40"
              strokeDashoffset="20"
            />
          </svg>

          Loading...
        </>
      ) : (
        <>
          {Icon && <Icon size={18} />}
          {children}
        </>
      )}
    </button>
  );
}