"use client";

import { LIKERT_OPTIONS, type LikertValue } from "@/lib/survey-data";

interface LikertScaleProps {
  value: LikertValue | null;
  onChange: (value: LikertValue) => void;
  disabled?: boolean;
}

export default function LikertScale({
  value,
  onChange,
  disabled,
}: LikertScaleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {LIKERT_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        const isDontKnow = option.value === "dont_know";

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`likert-option px-4 py-2 rounded-lg border text-sm font-medium transition-all
              ${
                isSelected
                  ? isDontKnow
                    ? "bg-gray-600 text-white border-gray-600 selected"
                    : "bg-primary text-white border-primary selected"
                  : "bg-white text-text-secondary border-border hover:border-accent hover:text-accent"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
