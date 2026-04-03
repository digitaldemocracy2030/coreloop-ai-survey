"use client";

import { LIKERT_OPTIONS, type LikertValue } from "@/lib/survey-data";

interface LikertScaleProps {
  value: LikertValue | null;
  onChange: (value: LikertValue) => void;
  disabled?: boolean;
}

const LIKERT_SELECTED_STYLES: Record<string, string> = {
  strongly_agree: "bg-blue-600 text-white border-blue-600 shadow-sm",
  agree: "bg-blue-500 text-white border-blue-500 shadow-sm",
  neutral: "bg-gray-500 text-white border-gray-500 shadow-sm",
  disagree: "bg-orange-500 text-white border-orange-500 shadow-sm",
  strongly_disagree: "bg-red-500 text-white border-red-500 shadow-sm",
  dont_know: "bg-gray-400 text-white border-gray-400 shadow-sm",
};

const LIKERT_EMOJIS: Record<string, string> = {
  strongly_agree: "👍",
  agree: "🙂",
  neutral: "😐",
  disagree: "🙁",
  strongly_disagree: "👎",
  dont_know: "❓",
};

export default function LikertScale({
  value,
  onChange,
  disabled,
}: LikertScaleProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {LIKERT_OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-center font-medium transition-all
              ${
                isSelected
                  ? LIKERT_SELECTED_STYLES[option.value]
                  : "bg-white text-text-secondary border-border hover:border-primary/40 hover:text-primary"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <span className="text-lg leading-none">{LIKERT_EMOJIS[option.value]}</span>
            <span className="text-[10px] sm:text-xs leading-tight">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
