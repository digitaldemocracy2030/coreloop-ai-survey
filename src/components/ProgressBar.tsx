"use client";

interface ProgressDot {
  id: string;
  answered: boolean;
}

interface ProgressBarProps {
  dots: ProgressDot[];
}

export default function ProgressBar({ dots }: ProgressBarProps) {
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="sticky top-[52px] z-10 bg-gray-50 py-2.5 -mt-6 sm:-mt-8">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {dots.map((dot, i) => (
          <button
            key={dot.id}
            type="button"
            onClick={() => handleClick(dot.id)}
            aria-label={`問${i + 1}${dot.answered ? "（回答済み）" : "（未回答）"}`}
            className={`w-5 h-5 rounded-full border-2 transition-all shrink-0
              ${
                dot.answered
                  ? "bg-green-500 border-green-500"
                  : "bg-white border-gray-300"
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}
