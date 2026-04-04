import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { TablesInsert, TablesUpdate } from "@/lib/database.types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, data, page } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (page === 1) {
      const row: TablesInsert<"responses"> = {
        session_id: sessionId,
        interest_level: data.interestLevel,
        page_completed: 1,
        user_agent: data.userAgent || "",
        q1_likert: data.answers?.q1?.likert || null,
        q1_freetext: data.answers?.q1?.freetext || "",
        q2_likert: data.answers?.q2?.likert || null,
        q2_freetext: data.answers?.q2?.freetext || "",
        q3_likert: data.answers?.q3?.likert || null,
        q3_freetext: data.answers?.q3?.freetext || "",
        q4_likert: data.answers?.q4?.likert || null,
        q4_freetext: data.answers?.q4?.freetext || "",
        q5_likert: data.answers?.q5?.likert || null,
        q5_freetext: data.answers?.q5?.freetext || "",
        q6_likert: data.answers?.q6?.likert || null,
        q6_freetext: data.answers?.q6?.freetext || "",
      };

      const { error } = await supabase.from("responses").upsert(row, {
        onConflict: "session_id",
      });

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { error: "回答の保存に失敗しました。" },
          { status: 500 }
        );
      }
    } else if (page === 2) {
      const row: TablesUpdate<"responses"> = {
        page_completed: 2,
        completed_at: new Date().toISOString(),
        additional_comments: data.additionalComments || "",
        q7_text: data.followupQuestions?.find((fq: { id: string }) => fq.id === "q7")?.text || "",
        q7_likert: data.followupAnswers?.q7 || null,
        q8_text: data.followupQuestions?.find((fq: { id: string }) => fq.id === "q8")?.text || "",
        q8_likert: data.followupAnswers?.q8 || null,
        q9_text: data.followupQuestions?.find((fq: { id: string }) => fq.id === "q9")?.text || "",
        q9_likert: data.followupAnswers?.q9 || null,
        q10_text: data.followupQuestions?.find((fq: { id: string }) => fq.id === "q10")?.text || "",
        q10_likert: data.followupAnswers?.q10 || null,
        q11_text: data.followupQuestions?.find((fq: { id: string }) => fq.id === "q11")?.text || "",
        q11_likert: data.followupAnswers?.q11 || null,
      };

      const { error } = await supabase
        .from("responses")
        .update(row)
        .eq("session_id", sessionId);

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json(
          { error: "回答の保存に失敗しました。" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "回答の送信中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
