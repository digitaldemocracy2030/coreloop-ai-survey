import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { SURVEY_QUESTIONS, LIKERT_OPTIONS, FOLLOWUP_HINT_SYSTEM_PROMPT } from "@/lib/survey-data";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionId,
      questionText,
      likertAnswer,
      currentText,
      previousAnswers,
    }: {
      questionId: string;
      questionText?: string;
      likertAnswer: string;
      currentText: string;
      previousAnswers: Record<string, { likert: string; freetext: string }>;
    } = body;

    // Find system prompt: use question-specific one for base questions, generic for followups
    const baseQuestion = SURVEY_QUESTIONS.find((q) => q.id === questionId);
    let systemPrompt: string;

    if (baseQuestion) {
      systemPrompt = baseQuestion.hintSystemPrompt;
    } else {
      // Followup question — use generic prompt with the question text
      const qText = questionText || "（質問文なし）";
      systemPrompt = FOLLOWUP_HINT_SYSTEM_PROMPT.replace("{{QUESTION_TEXT}}", qText);
    }

    // Format previous answers for context
    const prevAnswersFormatted = Object.entries(previousAnswers || {})
      .map(([qId, ans]) => {
        const q = SURVEY_QUESTIONS.find((sq) => sq.id === qId);
        const likertLabel =
          LIKERT_OPTIONS.find((o) => o.value === ans.likert)?.label || ans.likert;
        return `${qId.toUpperCase()}: ${likertLabel}${ans.freetext ? ` - "${ans.freetext}"` : ""}`;
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

上記を踏まえ、回答者がさらに考えを深めるための問いかけを一文で提示してください。パッと読んで理解できる簡潔な文にしてください。`;

    const hint = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
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
