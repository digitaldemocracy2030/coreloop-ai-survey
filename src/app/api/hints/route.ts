import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { SURVEY_QUESTIONS, LIKERT_OPTIONS } from "@/lib/survey-data";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionId,
      likertAnswer,
      currentText,
      previousAnswers,
    }: {
      questionId: string;
      likertAnswer: string;
      currentText: string;
      previousAnswers: Record<string, { likert: string; freetext: string }>;
    } = body;

    const question = SURVEY_QUESTIONS.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    // Format previous answers for context
    const prevAnswersFormatted = Object.entries(previousAnswers || {})
      .map(([qId, ans]) => {
        const q = SURVEY_QUESTIONS.find((sq) => sq.id === qId);
        const likertLabel =
          LIKERT_OPTIONS.find((o) => o.value === ans.likert)?.label || ans.likert;
        return `${q?.id?.toUpperCase()}: ${likertLabel}${ans.freetext ? ` - "${ans.freetext}"` : ""}`;
      })
      .join("\n");

    const likertLabel =
      LIKERT_OPTIONS.find((o) => o.value === likertAnswer)?.label ||
      likertAnswer ||
      "未回答";

    const userMessage = `回答者のこの設問への回答（リッカート尺度）: ${likertLabel}
回答者のこれまでの全回答:
${prevAnswersFormatted || "（まだ他の設問には回答していません）"}
回答者の現在の自由記述: ${currentText || "（まだ何も書いていません）"}

上記を踏まえ、回答者がさらに考えを深めるためのヒントを2-3文で提示してください。`;

    const hint = await callOpenRouter(
      [
        { role: "system", content: question.hintSystemPrompt },
        { role: "user", content: userMessage },
      ],
      { maxTokens: 256, temperature: 0.7 }
    );

    return NextResponse.json({ hint });
  } catch (error) {
    console.error("Hint generation error:", error);
    return NextResponse.json(
      { error: "ヒントの生成中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
