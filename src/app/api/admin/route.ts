import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  // Fetch all responses
  const { data: responses, error } = await supabase
    .from("responses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin fetch error:", error);
    return NextResponse.json(
      { error: "データの取得に失敗しました。" },
      { status: 500 }
    );
  }

  if (format === "csv") {
    // Generate CSV
    if (!responses || responses.length === 0) {
      return new NextResponse("No data", { status: 200 });
    }

    const headers = Object.keys(responses[0]);
    const csvRows = [
      headers.join(","),
      ...responses.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val);
            // Escape CSV fields
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      ),
    ];

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="survey-responses-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // Return JSON with summary stats
  const total = responses?.length || 0;
  const completed = responses?.filter((r) => r.page_completed === 2).length || 0;
  const page1Only = responses?.filter((r) => r.page_completed === 1).length || 0;

  // Calculate Likert distributions for Q1-Q6
  const likertDistributions: Record<string, Record<string, number>> = {};
  for (let i = 1; i <= 6; i++) {
    const qId = `q${i}`;
    const dist: Record<string, number> = {};
    for (const r of responses || []) {
      const val = r[`${qId}_likert`];
      if (val) {
        dist[val] = (dist[val] || 0) + 1;
      }
    }
    likertDistributions[qId] = dist;
  }

  // Collect Q7-Q10 data
  const followupData: Record<
    string,
    { text: string; likert: string }[]
  > = { q7: [], q8: [], q9: [], q10: [] };
  for (const r of responses || []) {
    for (let i = 7; i <= 10; i++) {
      const qId = `q${i}`;
      if (r[`${qId}_text`] && r[`${qId}_likert`]) {
        followupData[qId].push({
          text: r[`${qId}_text`],
          likert: r[`${qId}_likert`],
        });
      }
    }
  }

  // Interest level distribution
  const interestDist: Record<string, number> = {};
  for (const r of responses || []) {
    if (r.interest_level) {
      const key = String(r.interest_level);
      interestDist[key] = (interestDist[key] || 0) + 1;
    }
  }

  return NextResponse.json({
    summary: {
      total,
      completed,
      page1Only,
      startedButNotCompleted: total - completed - page1Only,
    },
    interestDistribution: interestDist,
    likertDistributions,
    followupData,
    responses,
  });
}
