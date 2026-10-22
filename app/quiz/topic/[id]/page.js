"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { listItems } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { groupByTopic, collectSolutions } from "@/lib/quiz";
import { QuizCard } from "@/components/Cards";
import { SolutionItem } from "@/components/QuizParts";

export default function TopicPage() {
  const { id } = useParams();
  const { data, loading } = useAsync(
    async () => {
      const [quizzes, topics] = await Promise.all([listItems("quizzes", true), listItems("quizTopics")]);
      return { quizzes: quizzes.filter((q) => q.published), topics };
    },
    [],
    "quiz_list"
  );
  const [tab, setTab] = useState("quizzes");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(() => new Set());

  if (!data && loading) return <div className="empty">Đang tải chủ đề...</div>;
  const g = data ? groupByTopic(data.quizzes, data.topics).find((x) => x.topic.id === id) : null;
  if (!g) {
    return (
      <div className="container section">
        <div className="empty">
          <h2>Không tìm thấy chủ đề</h2>
          <p className="muted" style={{ margin: "12px 0 20px" }}>Chủ đề có thể đã bị xóa hoặc chưa có bộ đề nào.</p>
          <Link href="/quiz" className="btn btn-primary btn-sm">← Quay lại Ôn tập</Link>
        </div>
      </div>
    );
  }

  const { topic } = g;
  const kw = search.trim().toLowerCase();
  const sections = collectSolutions(g.quizzes)
    .map((s) => ({
      ...s,
      questions: s.questions.filter((q) =>
        !kw || `${q.text} ${(q.options || []).join(" ")} ${q.explanation || ""}`.toLowerCase().includes(kw)),
    }))
    .filter((s) => s.questions.length);
  const allKeys = sections.flatMap((s) => s.questions.map((q) => `${s.quizId}:${q.id}`));
  const allOpen = allKeys.length > 0 && allKeys.every((k) => open.has(k));
  const toggle = (k) => setOpen((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div className="container section">
      <Link href="/quiz" className="muted" style={{ fontSize: ".9rem" }}>← Tất cả chủ đề</Link>
      <div className="quiz-topic-head" style={{ "--topic": topic.color || "#8b5cf6" }}>
        <div className="quiz-topic-icon" aria-hidden="true">{topic.icon || "📁"}</div>
        <div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}>{topic.name}</h1>
          {topic.desc && <p className="muted" style={{ marginTop: 6 }}>{topic.desc}</p>}
          <div className="meta muted" style={{ marginTop: 8 }}>
            <span>{g.quizCount} bộ đề</span><span>· {g.questionCount} câu hỏi</span>
          </div>
        </div>
      </div>

      <div className="admin-tabs" style={{ margin: "24px 0" }}>
        <a href="#" className={tab === "quizzes" ? "active" : ""} onClick={(e) => { e.preventDefault(); setTab("quizzes"); }}>📝 Bộ đề</a>
        <a href="#" className={tab === "solutions" ? "active" : ""} onClick={(e) => { e.preventDefault(); setTab("solutions"); }}>📖 Lời giải</a>
      </div>

      {tab === "quizzes" ? (
        <div className="grid">
          {g.quizzes.map((z) => <QuizCard key={z.id} q={{ ...z, category: topic.name }} />)}
        </div>
      ) : (
        <div>
          <div className="toolbar" style={{ alignItems: "center" }}>
            <input
              id="solution-search"
              placeholder="🔍 Tìm trong lời giải..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="btn btn-ghost btn-sm"
              disabled={!allKeys.length}
              onClick={() => setOpen(allOpen ? new Set() : new Set(allKeys))}
            >
              {allOpen ? "Thu gọn tất cả" : "Mở tất cả"}
            </button>
          </div>
          {sections.length ? sections.map((s) => (
            <section key={s.quizId} style={{ marginBottom: 28 }}>
              <div className="qrow" style={{ justifyContent: "space-between", margin: "8px 0 12px", gap: 10 }}>
                <h2 style={{ fontSize: "1.15rem" }}>{s.quizTitle}</h2>
                <Link href={`/quiz/${s.quizId}`} className="btn btn-ghost btn-sm">Làm bài</Link>
              </div>
              <div className="quiz-sol-list">
                {s.questions.map((q) => {
                  const k = `${s.quizId}:${q.id}`;
                  return <SolutionItem key={k} q={q} number={q.number} open={open.has(k)} onToggle={() => toggle(k)} />;
                })}
              </div>
            </section>
          )) : (
            <div className="empty">Không có câu nào khớp.</div>
          )}
        </div>
      )}
    </div>
  );
}
