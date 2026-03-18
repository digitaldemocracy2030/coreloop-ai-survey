"use client";

import { useState, useEffect } from "react";
import { LIKERT_OPTIONS, type LikertValue } from "@/lib/survey-data";
import ProgressBar from "./ProgressBar";

interface FollowupQuestion {
  id: string;
  text: string;
}

interface SurveyPage2Props {
  page1Answers: Record<string, { likert: string; freetext: string }>;
  onSubmit: (data: {
    followupQuestions: FollowupQuestion[];
    followupAnswers: Record<string, string>;
    additionalComments: string;
  }) => void;
  isSubmitting: boolean;
}

export default function SurveyPage2({
  page1Answers,
  onSubmit,
  isSubmitting,
}: SurveyPage2Props) {
  const [questions, setQuestions] = useState<FollowupQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, LikertValue | null>>({});
  const [additionalComments, setAdditionalComments] = useState("");

  // Fetch AI-generated follow-up questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: page1Answers }),
        });

        if (!response.ok) throw new Error("Failed to generate questions");
        const data = await response.json();
        setQuestions(data.questions);
      } catch (err) {
        console.error("Failed to generate follow-up questions:", err);
        setLoadError(true);
        // Use fallback questions
        setQuestions([
          { id: "q7", text: "テクノロジー企業は、政府よりも市民の安全を守る能力が高いと思う。" },
          { id: "q8", text: "多少の不便や制約があっても、詐欺被害を未然に防ぐための規制は必要だと思う。" },
          { id: "q9", text: "インターネット上の問題には、既存の法律の枠組みでは十分に対処できないと思う。" },
          { id: "q10", text: "詐欺被害が起きてから対処するよりも、事前に厳しく規制する方が社会全体のコストは低いと思う。" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [page1Answers]);

  const setAnswer = (qId: string, value: LikertValue) => {
    setFollowupAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const answeredCount = questions.filter((q) => followupAnswers[q.id]).length;
  const canSubmit = questions.length > 0 && questions.every((q) => followupAnswers[q.id]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const formattedAnswers: Record<string, string> = {};
    for (const q of questions) {
      formattedAnswers[q.id] = followupAnswers[q.id] || "";
    }
    onSubmit({
      followupQuestions: questions,
      followupAnswers: formattedAnswers,
      additionalComments,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">
          あなたの回答に基づいて、追加の質問を生成しています...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress */}
      <ProgressBar
        current={answeredCount}
        total={questions.length}
        label={`ページ 2/2 - ${answeredCount}/${questions.length} 問回答済み`}
      />

      {/* Intro text */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-sm text-text-secondary leading-relaxed">
          前のページのご回答をもとに、あなたの考え方をより深く理解するための追加質問をAIが生成しました。
          こちらもそれぞれの設問について、あなたの考えに最も近いものをお選びください。
        </p>
        {loadError && (
          <p className="text-xs text-warning mt-2">
            ※ AI質問生成に問題が発生したため、標準の質問を表示しています。
          </p>
        )}
      </div>

      {/* Follow-up Questions Q7-Q10 */}
      {questions.map((question, index) => (
        <section
          key={question.id}
          className="bg-white border border-border rounded-xl p-6 shadow-sm"
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-xs font-bold">
                {index + 7}
              </span>
            </div>
            <h3 className="text-base font-semibold text-text leading-relaxed">
              {question.text}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {LIKERT_OPTIONS.map((option) => {
              const isSelected = followupAnswers[question.id] === option.value;
              const isDontKnow = option.value === "dont_know";

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAnswer(question.id, option.value)}
                  className={`likert-option px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isSelected
                      ? isDontKnow
                        ? "bg-gray-600 text-white border-gray-600"
                        : "bg-accent text-white border-accent"
                      : "bg-white text-text-secondary border-border hover:border-accent hover:text-accent"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Additional Comments */}
      <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text mb-2">
          その他、ご意見があればお聞かせください
        </h3>
        <p className="text-sm text-text-muted mb-3">（任意）</p>
        <textarea
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          placeholder="オンライン広告詐欺対策について、他にお考えのことがあれば自由にお書きください..."
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-border bg-white text-text resize-y text-sm leading-relaxed placeholder:text-text-muted"
        />
      </section>

      {/* Submit */}
      <div className="flex flex-col items-center gap-3 pt-4">
        {!canSubmit && (
          <p className="text-sm text-text-muted">
            全ての設問に回答すると送信できます。
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`px-8 py-3 rounded-xl text-base font-semibold transition-all ${
            canSubmit && !isSubmitting
              ? "bg-primary text-white hover:bg-primary-light shadow-md hover:shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              送信中...
            </span>
          ) : (
            "回答を送信する"
          )}
        </button>
      </div>
    </div>
  );
}
