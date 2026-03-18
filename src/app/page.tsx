"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { SURVEY_INTRO } from "@/lib/survey-data";
import SurveyPage1 from "@/components/SurveyPage1";
import SurveyPage2 from "@/components/SurveyPage2";
import Link from "next/link";

type SurveyState = "intro" | "page1" | "page2" | "complete";

export default function Home() {
  const [state, setState] = useState<SurveyState>("intro");
  const [sessionId, setSessionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page1Data, setPage1Data] = useState<{
    interestLevel: number;
    answers: Record<string, { likert: string; freetext: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate or restore session ID
    const stored = sessionStorage.getItem("survey_session_id");
    if (stored) {
      setSessionId(stored);
    } else {
      const newId = uuidv4();
      sessionStorage.setItem("survey_session_id", newId);
      setSessionId(newId);
    }

    // Restore state if page was refreshed
    const storedState = sessionStorage.getItem("survey_state");
    if (storedState === "page2") {
      const storedPage1 = sessionStorage.getItem("survey_page1_data");
      if (storedPage1) {
        setPage1Data(JSON.parse(storedPage1));
        setState("page2");
      }
    }
  }, []);

  const handlePage1Submit = async (data: {
    interestLevel: number;
    answers: Record<string, { likert: string; freetext: string }>;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          page: 1,
          data: {
            ...data,
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to submit page 1");

      setPage1Data(data);
      sessionStorage.setItem("survey_page1_data", JSON.stringify(data));
      sessionStorage.setItem("survey_state", "page2");
      setState("page2");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submit error:", err);
      setError("回答の送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePage2Submit = async (data: {
    followupQuestions: { id: string; text: string }[];
    followupAnswers: Record<string, string>;
    additionalComments: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          page: 2,
          data,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit page 2");

      sessionStorage.removeItem("survey_state");
      sessionStorage.removeItem("survey_page1_data");
      setState("complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submit error:", err);
      setError("回答の送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-primary">{SURVEY_INTRO.title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-500 mt-1 underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* Intro */}
        {state === "intro" && (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-text mb-4">
                {SURVEY_INTRO.subtitle}
              </h2>
              <div className="space-y-3 text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {SURVEY_INTRO.description}
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-text-muted">
                  {SURVEY_INTRO.estimatedTime}
                </p>
                <p className="text-xs text-text-muted">
                  {SURVEY_INTRO.privacyNote}
                </p>
                <p className="text-xs text-text-muted">
                  {SURVEY_INTRO.aiNote}
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setState("page1")}
                className="px-8 py-3 bg-primary text-white rounded-xl text-base font-semibold hover:bg-primary-light transition-all shadow-md hover:shadow-lg"
              >
                調査を始める
              </button>
            </div>
          </div>
        )}

        {/* Page 1 */}
        {state === "page1" && (
          <SurveyPage1 onSubmit={handlePage1Submit} isSubmitting={isSubmitting} />
        )}

        {/* Page 2 */}
        {state === "page2" && page1Data && (
          <SurveyPage2
            page1Answers={page1Data.answers}
            onSubmit={handlePage2Submit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Complete */}
        {state === "complete" && (
          <div className="text-center py-16 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text">
              ご回答ありがとうございました
            </h2>
            <p className="text-text-secondary max-w-md mx-auto leading-relaxed">
              いただいたご意見は、今後の熟議型世論調査での論点整理に活用させていただきます。
              みなさまの声が、より良い政策づくりの一助となります。
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <p>市民意識調査プロジェクト</p>
          <div className="flex gap-4">
            <Link href="/transparency" className="hover:text-accent underline">
              AIの使用について
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
