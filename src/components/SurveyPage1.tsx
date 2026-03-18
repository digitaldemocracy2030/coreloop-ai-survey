"use client";

import { useState } from "react";
import { SURVEY_QUESTIONS, INTEREST_OPTIONS, type LikertValue } from "@/lib/survey-data";
import LikertScale from "./LikertScale";
import FreeTextWithHints from "./FreeTextWithHints";
import ProgressBar from "./ProgressBar";

interface SurveyPage1Props {
  onSubmit: (data: {
    interestLevel: number;
    answers: Record<string, { likert: string; freetext: string }>;
  }) => void;
  isSubmitting: boolean;
}

export default function SurveyPage1({ onSubmit, isSubmitting }: SurveyPage1Props) {
  const [interestLevel, setInterestLevel] = useState<number | null>(null);
  const [answers, setAnswers] = useState<
    Record<string, { likert: LikertValue | null; freetext: string }>
  >({});

  const setLikert = (qId: string, value: LikertValue) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], likert: value, freetext: prev[qId]?.freetext || "" },
    }));
  };

  const setFreetext = (qId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], likert: prev[qId]?.likert || null, freetext: value },
    }));
  };

  // Calculate progress
  const totalRequired = 7; // interest + 6 likert
  const completedCount =
    (interestLevel ? 1 : 0) +
    SURVEY_QUESTIONS.filter((q) => answers[q.id]?.likert).length;

  const canSubmit = interestLevel !== null && SURVEY_QUESTIONS.every((q) => answers[q.id]?.likert);

  const handleSubmit = () => {
    if (!canSubmit || !interestLevel) return;
    const formattedAnswers: Record<string, { likert: string; freetext: string }> = {};
    for (const q of SURVEY_QUESTIONS) {
      formattedAnswers[q.id] = {
        likert: answers[q.id]?.likert || "",
        freetext: answers[q.id]?.freetext || "",
      };
    }
    onSubmit({ interestLevel, answers: formattedAnswers });
  };

  // Build previousAnswers for hints context
  const previousAnswersForHints = Object.fromEntries(
    Object.entries(answers)
      .filter(([, v]) => v.likert)
      .map(([k, v]) => [k, { likert: v.likert || "", freetext: v.freetext }])
  );

  return (
    <div className="space-y-8">
      {/* Progress */}
      <ProgressBar
        current={completedCount}
        total={totalRequired}
        label={`ページ 1/2 - ${completedCount}/${totalRequired} 問回答済み`}
      />

      {/* Interest Level */}
      <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-text mb-2">
          はじめに：オンライン広告詐欺の問題への関心度
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          SNSなどに表示される偽の広告による詐欺問題について、どの程度関心をお持ちですか？
        </p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setInterestLevel(parseInt(opt.value))}
              className={`likert-option px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                interestLevel === parseInt(opt.value)
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-text-secondary border-border hover:border-accent hover:text-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Questions Q1-Q6 */}
      {SURVEY_QUESTIONS.map((question, index) => (
        <section
          key={question.id}
          className="bg-white border border-border rounded-xl p-6 shadow-sm"
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-xs text-text-muted">{question.description}</span>
            </div>
            <h3 className="text-base font-semibold text-text leading-relaxed">
              {question.text}
            </h3>
          </div>

          {/* Likert Scale */}
          <div className="mb-4">
            <LikertScale
              value={answers[question.id]?.likert || null}
              onChange={(val) => setLikert(question.id, val)}
            />
          </div>

          {/* Free text with AI hints (shown after Likert selection) */}
          {answers[question.id]?.likert && (
            <div className="border-t border-border pt-4">
              <FreeTextWithHints
                questionId={question.id}
                likertAnswer={answers[question.id]?.likert || null}
                value={answers[question.id]?.freetext || ""}
                onChange={(val) => setFreetext(question.id, val)}
                previousAnswers={previousAnswersForHints}
                starterSentences={question.starterSentences}
                pros={question.pros}
                cons={question.cons}
              />
            </div>
          )}
        </section>
      ))}

      {/* Submit */}
      <div className="flex flex-col items-center gap-3 pt-4">
        {!canSubmit && (
          <p className="text-sm text-text-muted">
            全ての設問（選択式）に回答すると次のページに進めます。自由記述は任意です。
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
            "次のページへ進む"
          )}
        </button>
        <p className="text-xs text-text-muted">
          自由記述をスキップして進むこともできます
        </p>
      </div>
    </div>
  );
}
