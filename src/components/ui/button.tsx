"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      disabled,
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-medium rounded-[var(--radius-bae)]",
          // Transitions including transform for press feedback
          "transition-all duration-200",
          // Press feedback - scale down slightly on active
          "active:scale-[0.98]",
          // Focus styles (visible outline)
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 focus-visible:ring-offset-2",
          // Disabled styles
          "disabled:opacity-50 disabled:pointer-events-none",
          // Hit target minimum (44px on mobile)
          "min-h-[44px] min-w-[44px]",
          // Variants
          variant === "primary" &&
            "bg-bae-500 text-white hover:bg-bae-600 active:bg-bae-700 shadow-[var(--shadow-bae)]",
          variant === "secondary" &&
            "bg-bae-100 text-bae-700 hover:bg-bae-200 border border-bae-200",
          variant === "ghost" && "hover:bg-bae-100 text-bae-600",
          variant === "danger" &&
            "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
          // Sizes
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2 text-base",
          size === "lg" && "px-6 py-3 text-lg",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
