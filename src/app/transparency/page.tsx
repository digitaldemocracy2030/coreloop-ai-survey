import { MODEL_INFO } from "@/lib/openrouter";
import { SURVEY_QUESTIONS, FOLLOWUP_GENERATION_PROMPT } from "@/lib/survey-data";
import { PROMPTS } from "@/lib/prompts";
import Link from "next/link";

export const metadata = {
  title: "AIの使用について - 市民意識調査",
};

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">
            AIの使用について
          </h1>
          <Link href="/" className="text-sm text-accent hover:underline">
            調査に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Overview */}
        <section>
          <h2 className="text-xl font-bold text-text mb-4">概要</h2>
          <div className="bg-surface border border-border rounded-xl p-6 space-y-3 text-sm text-text-secondary leading-relaxed">
            <p>
              この市民意識調査では、回答体験を支援するためにAI（人工知能）を2つの場面で使用しています。
              以下に、使用しているモデル、各場面での使用目的、使用しているプロンプト（AIへの指示文）の全文を開示します。
            </p>
            <p>
              AIは回答者の意見を誘導するためではなく、考えを深めるきっかけを提供するために使用しています。
              AIが提示するヒントや問いかけは参考情報であり、回答者はこれらを無視して自由に回答することができます。
            </p>
          </div>
        </section>

        {/* Model Info */}
        <section>
          <h2 className="text-xl font-bold text-text mb-4">使用モデル</h2>
          <div className="bg-white border border-border rounded-xl p-6">
            <dl className="space-y-3 text-sm">
              <div className="flex gap-4">
                <dt className="font-medium text-text w-32 shrink-0">モデル名</dt>
                <dd className="text-text-secondary">{MODEL_INFO.name}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium text-text w-32 shrink-0">モデルID</dt>
                <dd className="text-text-secondary font-mono text-xs">{MODEL_INFO.id}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium text-text w-32 shrink-0">提供元</dt>
                <dd className="text-text-secondary">{MODEL_INFO.provider}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium text-text w-32 shrink-0">説明</dt>
                <dd className="text-text-secondary">{MODEL_INFO.description}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Usage 1: Hints */}
        <section>
          <h2 className="text-xl font-bold text-text mb-4">
            使用場面 1：自由記述の回答ヒント生成
          </h2>
          <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
            <p>
              各設問の自由記述欄で回答者が文章を入力する際、AIが「考えるヒント」を自動的に提示します。
              ヒントは回答者のリッカート尺度での回答内容と、自由記述の内容を踏まえて生成されます。
            </p>

            {/* Common prompt template */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-medium text-text mb-2">
                {PROMPTS.hintGeneration.name}
              </h3>
              <p className="text-xs text-text-muted mb-3">
                {PROMPTS.hintGeneration.description}
              </p>
              <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                {PROMPTS.hintGeneration.template}
              </pre>
            </div>

            {/* Per-question system prompts */}
            <h3 className="font-medium text-text mt-6">設問別システムプロンプト</h3>
            {SURVEY_QUESTIONS.map((q, i) => (
              <details key={q.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer hover:bg-surface text-sm font-medium text-text">
                  Q{i + 1}: {q.text.substring(0, 50)}...
                </summary>
                <div className="px-6 pb-4">
                  <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                    {q.hintSystemPrompt}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Usage 2: Follow-up Questions */}
        <section>
          <h2 className="text-xl font-bold text-text mb-4">
            使用場面 2：フォローアップ質問（Q7-Q10）の生成
          </h2>
          <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
            <p>
              2ページ目では、1ページ目（Q1-Q6）の回答パターンに基づいて、回答者の価値観や考え方をより深く理解するための
              追加質問4問をAIが生成します。生成された質問は各回答者によって異なる場合があります。
            </p>
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-medium text-text mb-2">
                {PROMPTS.followupQuestionGeneration.name}
              </h3>
              <p className="text-xs text-text-muted mb-3">
                {PROMPTS.followupQuestionGeneration.description}
              </p>
              <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                {FOLLOWUP_GENERATION_PROMPT}
              </pre>
            </div>
          </div>
        </section>

        {/* Data handling */}
        <section>
          <h2 className="text-xl font-bold text-text mb-4">データの取り扱い</h2>
          <div className="bg-surface border border-border rounded-xl p-6 space-y-3 text-sm text-text-secondary leading-relaxed">
            <p>
              回答データは匿名で収集されます。AIサービス（OpenRouter経由でGoogleのGeminiモデル）に送信されるデータは、
              回答内容のみであり、個人を特定する情報は含まれません。
            </p>
            <p>
              回答データはSupabaseのデータベースに保存されます。収集したデータは熟議型世論調査の論点整理の
              目的にのみ使用し、第三者への販売や目的外の利用は行いません。
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="text-sm text-accent hover:underline">
            調査に戻る
          </Link>
        </div>
      </footer>
    </div>
  );
}
