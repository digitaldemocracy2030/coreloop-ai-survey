import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import {
  SURVEY_QUESTIONS,
  LIKERT_OPTIONS,
  FOLLOWUP_GENERATION_PROMPT,
} from "@/lib/survey-data";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      answers,
    }: {
      answers: Record<string, { likert: string; freetext: string }>;
    } = body;

    // Format answers for prompt
    const answersFormatted = SURVEY_QUESTIONS.map((q) => {
      const ans = answers[q.id];
      if (!ans) return `${q.id.toUpperCase()}: 未回答`;
      const likertLabel =
        LIKERT_OPTIONS.find((o) => o.value === ans.likert)?.label || ans.likert;
      return `${q.id.toUpperCase()} "${q.text}"
  回答: ${likertLabel}
  理由: ${ans.freetext || "（記述なし）"}`;
    }).join("\n\n");

    const result = await callOpenRouter(
      [
        { role: "system", content: FOLLOWUP_GENERATION_PROMPT },
        {
          role: "user",
          content: `回答者のQ1〜Q6の回答:\n\n${answersFormatted}\n\nこの回答パターンから、背景にある価値観・考え方を探るフォローアップ質問を4つ生成してください。JSON配列のみ出力してください。`,
        },
      ],
      { maxTokens: 1024, temperature: 0.6 }
    );

    // Parse JSON from response (handle markdown code blocks)
    let questions;
    try {
      let jsonStr = result.trim();
      // Strip markdown code block if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      questions = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", result);
      // Fallback questions
      questions = [
        {
          id: "q7",
          text: "テクノロジー企業は、政府よりも市民の安全を守る能力が高いと思う。",
        },
        {
          id: "q8",
          text: "多少の不便や制約があっても、詐欺被害を未然に防ぐための規制は必要だと思う。",
        },
        {
          id: "q9",
          text: "インターネット上の問題には、既存の法律の枠組みでは十分に対処できないと思う。",
        },
        {
          id: "q10",
          text: "詐欺被害が起きてから対処するよりも、事前に厳しく規制する方が社会全体のコストは低いと思う。",
        },
      ];
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Question generation error:", error);
    // Return fallback questions on error
    return NextResponse.json({
      questions: [
        {
          id: "q7",
          text: "テクノロジー企業は、政府よりも市民の安全を守る能力が高いと思う。",
        },
        {
          id: "q8",
          text: "多少の不便や制約があっても、詐欺被害を未然に防ぐための規制は必要だと思う。",
        },
        {
          id: "q9",
          text: "インターネット上の問題には、既存の法律の枠組みでは十分に対処できないと思う。",
        },
        {
          id: "q10",
          text: "詐欺被害が起きてから対処するよりも、事前に厳しく規制する方が社会全体のコストは低いと思う。",
        },
      ],
    });
  }
}
