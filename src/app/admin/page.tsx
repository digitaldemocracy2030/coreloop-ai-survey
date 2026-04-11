"use client";

import { useCallback, useEffect, useState } from "react";
import {
  INTEREST_OPTIONS,
  LIKERT_OPTIONS,
  SURVEY_QUESTIONS,
} from "@/lib/survey-data";

interface AnswerRow {
  question_id: string;
  question_text: string | null;
  likert: string | null;
  freetext: string | null;
  is_followup: boolean | null;
}

interface SessionRow {
  session_id: string;
  interest_level: number | null;
  interest_reasons: string[] | null;
  interest_other_text: string | null;
  additional_comments: string | null;
  page_completed: number | null;
  user_agent: string | null;
  created_at: string | null;
  completed_at: string | null;
}

interface FollowupEntry {
  question_id: string;
  text: string;
  likert: string;
  freetext: string;
}

interface AdminData {
  summary: {
    total: number;
    completed: number;
    page1Only: number;
    startedButNotCompleted: number;
  };
  interestDistribution: Record<string, number>;
  likertDistributions: Record<string, Record<string, number>>;
  followupBySession: Record<string, FollowupEntry[]>;
  sessions: SessionRow[];
  answersBySession: Record<string, AnswerRow[]>;
}

const INTEREST_LABELS: Record<string, string> = {};
for (const opt of INTEREST_OPTIONS) {
  INTEREST_LABELS[opt.value] = opt.label;
}

const LIKERT_LABELS: Record<string, string> = {};
for (const opt of LIKERT_OPTIONS) {
  LIKERT_LABELS[opt.value] = opt.label;
}

const LIKERT_COLORS: Record<string, string> = {
  strongly_agree: "bg-blue-600",
  agree: "bg-blue-400",
  neutral: "bg-gray-400",
  disagree: "bg-orange-400",
  strongly_disagree: "bg-red-500",
  dont_know: "bg-gray-300",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "q1-13" | "q14-18" | "responses"
  >("overview");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(),
  );

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (response.status === 401) {
        setIsAuthenticated(false);
        setError("パスワードが正しくありません。");
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch data");
      const result = await response.json();
      setData(result);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError("データの取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCsvDownload = async () => {
    try {
      const response = await fetch("/api/admin?format=csv", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (!response.ok) throw new Error("CSV download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `survey-responses-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV download error:", err);
      setError("CSVのダウンロードに失敗しました。");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="bg-white border border-border rounded-xl p-8 shadow-sm max-w-sm w-full space-y-4"
        >
          <h1 className="text-lg font-bold text-text">管理者ダッシュボード</h1>
          <p className="text-sm text-text-secondary">
            パスワードを入力してください。
          </p>
          {error && <p className="text-sm text-error">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-2 border border-border rounded-lg text-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-all"
          >
            {isLoading ? "読み込み中..." : "ログイン"}
          </button>
        </form>
      </div>
    );
  }

  if (!data) return null;

  // Helper: get answers for a session as a map
  const getAnswerMap = (sessionId: string): Record<string, AnswerRow> => {
    const map: Record<string, AnswerRow> = {};
    for (const a of data.answersBySession[sessionId] || []) {
      map[a.question_id] = a;
    }
    return map;
  };

  // Helper: collect free texts for a question from answersBySession
  const getFreetextsForQuestion = (
    questionId: string,
  ): { text: string; likert: string }[] => {
    const results: { text: string; likert: string }[] = [];
    for (const answers of Object.values(data.answersBySession)) {
      for (const a of answers) {
        if (a.question_id === questionId && a.freetext && a.freetext.trim()) {
          results.push({ text: a.freetext, likert: a.likert || "" });
        }
      }
    }
    return results;
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">
            管理者ダッシュボード
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="text-sm text-accent hover:underline disabled:opacity-50"
            >
              {isLoading ? "更新中..." : "データを更新"}
            </button>
            <button
              type="button"
              onClick={handleCsvDownload}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-all"
            >
              CSVダウンロード
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="総回答数" value={data.summary.total} />
          <SummaryCard
            label="完了（2ページ目まで）"
            value={data.summary.completed}
          />
          <SummaryCard
            label="1ページ目のみ完了"
            value={data.summary.page1Only}
          />
          <SummaryCard
            label="完了率"
            value={
              data.summary.total > 0
                ? `${Math.round((data.summary.completed / data.summary.total) * 100)}%`
                : "—"
            }
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-border rounded-lg p-1">
          {(
            [
              ["overview", "概要"],
              ["q1-13", "Q1-Q13 詳細"],
              ["q14-18", "フォローアップ"],
              ["responses", "個別回答"],
            ] as const
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-surface"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Interest Distribution */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-semibold text-text mb-4">関心度の分布</h3>
              <div className="space-y-2">
                {INTEREST_OPTIONS.map((opt) => {
                  const count = data.interestDistribution[opt.value] || 0;
                  const total = data.summary.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={opt.value} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-32 shrink-0">
                        {opt.label}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted w-16 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Q1-Q13 Likert Summary */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-semibold text-text mb-4">Q1-Q13 回答分布</h3>
              <div className="space-y-4">
                {SURVEY_QUESTIONS.map((q, i) => {
                  const dist = data.likertDistributions[q.id] || {};
                  const total =
                    Object.values(dist).reduce((s, v) => s + v, 0) || 1;
                  return (
                    <div key={q.id}>
                      <p className="text-xs text-text-secondary mb-1.5 leading-relaxed">
                        Q{i + 1}: {q.text.substring(0, 60)}...
                      </p>
                      <div className="flex h-6 rounded-md overflow-hidden">
                        {LIKERT_OPTIONS.map((opt) => {
                          const count = dist[opt.value] || 0;
                          const pct = (count / total) * 100;
                          if (pct === 0) return null;
                          return (
                            <div
                              key={opt.value}
                              className={`${LIKERT_COLORS[opt.value]} flex items-center justify-center text-white text-[10px] font-medium`}
                              style={{ width: `${pct}%` }}
                              title={`${opt.label}: ${count} (${Math.round(pct)}%)`}
                            >
                              {pct >= 8 ? `${Math.round(pct)}%` : ""}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Legend */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                  {LIKERT_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-1.5">
                      <div
                        className={`w-3 h-3 rounded ${LIKERT_COLORS[opt.value]}`}
                      />
                      <span className="text-[10px] text-text-muted">
                        {opt.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "q1-13" && (
          <div className="space-y-6">
            {SURVEY_QUESTIONS.map((q, i) => {
              const dist = data.likertDistributions[q.id] || {};
              const total = Object.values(dist).reduce((s, v) => s + v, 0) || 1;
              const freetexts = getFreetextsForQuestion(q.id);

              return (
                <div
                  key={q.id}
                  className="bg-white border border-border rounded-xl p-6"
                >
                  <h3 className="font-semibold text-text mb-3">
                    Q{i + 1}: {q.text}
                  </h3>

                  {/* Bar chart */}
                  <div className="space-y-1.5 my-4">
                    {LIKERT_OPTIONS.map((opt) => {
                      const count = dist[opt.value] || 0;
                      const pct = (count / total) * 100;
                      return (
                        <div
                          key={opt.value}
                          className="flex items-center gap-2"
                        >
                          <span className="text-xs text-text-secondary w-36 shrink-0 text-right">
                            {opt.label}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
                            <div
                              className={`h-full ${LIKERT_COLORS[opt.value]} rounded transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted w-16 shrink-0">
                            {count} ({Math.round(pct)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Free text responses */}
                  <details>
                    <summary className="text-sm text-accent cursor-pointer hover:underline">
                      自由記述回答を見る ({freetexts.length}件)
                    </summary>
                    <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                      {freetexts.length === 0 ? (
                        <p className="text-sm text-text-muted">
                          自由記述回答はありません。
                        </p>
                      ) : (
                        freetexts.map((ft, j) => (
                          <div
                            key={`${q.id}-ft-${j}`}
                            className="bg-surface rounded-lg p-3 text-sm"
                          >
                            {ft.likert && (
                              <span className="inline-block px-2 py-0.5 bg-gray-200 text-text-muted rounded text-xs mb-1">
                                {LIKERT_LABELS[ft.likert] || ft.likert}
                              </span>
                            )}
                            <p className="text-text-secondary leading-relaxed">
                              {ft.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "q14-18" && (
          <FollowupTab
            data={data}
            expandedSessions={expandedSessions}
            toggleSession={toggleSession}
          />
        )}

        {activeTab === "responses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                全{data.sessions?.length || 0}件の回答
              </p>
              <button
                type="button"
                onClick={handleCsvDownload}
                className="text-sm text-accent hover:underline"
              >
                CSVでダウンロード
              </button>
            </div>
            <div className="overflow-x-auto bg-white border border-border rounded-xl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2 text-left font-medium text-text-muted">
                      日時
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-text-muted">
                      関心度
                    </th>
                    {SURVEY_QUESTIONS.map((q, i) => (
                      <th
                        key={q.id}
                        className="px-3 py-2 text-left font-medium text-text-muted"
                      >
                        Q{i + 1}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-medium text-text-muted">
                      完了
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data.sessions || []).map((s) => {
                    const answerMap = getAnswerMap(s.session_id);
                    return (
                      <tr
                        key={s.session_id}
                        className="border-b border-border last:border-0 hover:bg-surface"
                      >
                        <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
                          {s.created_at
                            ? new Date(s.created_at).toLocaleString("ja-JP", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">
                          {s.interest_level
                            ? INTEREST_LABELS[String(s.interest_level)] ||
                              String(s.interest_level)
                            : "—"}
                        </td>
                        {SURVEY_QUESTIONS.map((q) => {
                          const answer = answerMap[q.id];
                          return (
                            <td key={q.id} className="px-3 py-2">
                              <span
                                className="inline-block px-1.5 py-0.5 rounded text-[10px]"
                                title={
                                  answer?.likert
                                    ? LIKERT_LABELS[answer.likert] ||
                                      answer.likert
                                    : "—"
                                }
                              >
                                {answer?.likert
                                  ? (
                                      LIKERT_LABELS[answer.likert] ||
                                      answer.likert
                                    ).charAt(0)
                                  : "—"}
                              </span>
                              {answer?.freetext && answer.freetext.trim() ? (
                                <span
                                  className="ml-1 text-accent cursor-help"
                                  title={answer.freetext}
                                >
                                  +
                                </span>
                              ) : null}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-text-secondary">
                          {s.page_completed === 2
                            ? "✓"
                            : `P${s.page_completed}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// Q14-Q18 Followup Tab: grouped by respondent
// ============================================================
function FollowupTab({
  data,
  expandedSessions,
  toggleSession,
}: {
  data: AdminData;
  expandedSessions: Set<string>;
  toggleSession: (id: string) => void;
}) {
  // Sessions that completed page 2 (have followup data)
  const sessionsWithFollowup = (data.sessions || []).filter(
    (s) => data.followupBySession[s.session_id]?.length,
  );

  const totalFollowupSessions = sessionsWithFollowup.length;

  // Calculate overall Likert distribution across all followup answers
  const overallDist: Record<string, number> = {};
  let totalFollowupAnswers = 0;
  for (const entries of Object.values(data.followupBySession)) {
    for (const entry of entries) {
      if (entry.likert) {
        overallDist[entry.likert] = (overallDist[entry.likert] || 0) + 1;
        totalFollowupAnswers++;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard label="回答者数" value={totalFollowupSessions} />
        <SummaryCard label="回答総数" value={totalFollowupAnswers} />
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs text-text-muted mb-2">回答傾向</p>
          {totalFollowupAnswers > 0 ? (
            <div className="flex h-5 rounded-md overflow-hidden">
              {LIKERT_OPTIONS.map((opt) => {
                const count = overallDist[opt.value] || 0;
                const pct = (count / totalFollowupAnswers) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={opt.value}
                    className={`${LIKERT_COLORS[opt.value]} flex items-center justify-center text-white text-[10px] font-medium`}
                    style={{ width: `${pct}%` }}
                    title={`${opt.label}: ${count} (${Math.round(pct)}%)`}
                  >
                    {pct >= 10 ? `${Math.round(pct)}%` : ""}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted">—</p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {LIKERT_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${LIKERT_COLORS[opt.value]}`} />
            <span className="text-[10px] text-text-muted">{opt.label}</span>
          </div>
        ))}
      </div>

      {/* Per-respondent list */}
      {sessionsWithFollowup.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-text-muted">
            フォローアップ回答がありません。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionsWithFollowup.map((session) => {
            const followups = data.followupBySession[session.session_id] || [];
            const isExpanded = expandedSessions.has(session.session_id);
            const answeredCount = followups.filter((f) => f.likert).length;
            const dateStr = session.created_at
              ? new Date(session.created_at).toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";

            return (
              <div
                key={session.session_id}
                className="bg-white border border-border rounded-xl overflow-hidden"
              >
                {/* Session header (clickable) */}
                <button
                  type="button"
                  onClick={() => toggleSession(session.session_id)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-surface/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-text-secondary">
                      {dateStr}
                    </span>
                    <span className="text-xs text-text-muted">
                      関心度:{" "}
                      {session.interest_level
                        ? INTEREST_LABELS[String(session.interest_level)] ||
                          session.interest_level
                        : "—"}
                    </span>
                    <span className="text-xs text-text-muted">
                      {answeredCount}/{followups.length}問回答済
                    </span>
                    {/* Mini distribution bar */}
                    <div className="flex h-3 w-24 rounded overflow-hidden">
                      {LIKERT_OPTIONS.map((opt) => {
                        const count = followups.filter(
                          (f) => f.likert === opt.value,
                        ).length;
                        const pct =
                          followups.length > 0
                            ? (count / followups.length) * 100
                            : 0;
                        if (pct === 0) return null;
                        return (
                          <div
                            key={opt.value}
                            className={LIKERT_COLORS[opt.value]}
                            style={{ width: `${pct}%` }}
                            title={`${opt.label}: ${count}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-text-muted text-sm">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-3">
                    {followups.map((f, idx) => (
                      <div
                        key={f.question_id}
                        className="bg-surface rounded-lg p-3"
                      >
                        <p className="text-xs text-text-muted mb-1">
                          質問 {idx + 1}
                        </p>
                        <p className="text-sm text-text mb-2">{f.text}</p>
                        <div className="flex items-center gap-2">
                          {f.likert && (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs text-white ${LIKERT_COLORS[f.likert] || "bg-gray-400"}`}
                            >
                              {LIKERT_LABELS[f.likert] || f.likert}
                            </span>
                          )}
                          {!f.likert && (
                            <span className="text-xs text-text-muted">
                              未回答
                            </span>
                          )}
                        </div>
                        {f.freetext && f.freetext.trim() && (
                          <p className="mt-2 text-sm text-text-secondary bg-white rounded p-2 leading-relaxed">
                            {f.freetext}
                          </p>
                        )}
                      </div>
                    ))}
                    {session.additional_comments &&
                      session.additional_comments.trim() && (
                        <div className="bg-surface rounded-lg p-3">
                          <p className="text-xs text-text-muted mb-1">
                            追加コメント
                          </p>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {session.additional_comments}
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}
