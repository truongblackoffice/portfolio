"use client";
import { useState } from "react";
import { listItems } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { groupByTopic } from "@/lib/quiz";
import { QuizCard, TopicCard, Filters, applyFilters } from "@/components/Cards";

export default function QuizHome() {
  const { data } = useAsync(
    async () => {
      const [quizzes, topics] = await Promise.all([listItems("quizzes", true), listItems("quizTopics")]);
      return { quizzes: quizzes.filter((q) => q.published), topics };
    },
    [],
    "quiz_list"
  );
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [tag, setTag] = useState("");

  const groups = data ? groupByTopic(data.quizzes, data.topics).filter((g) => g.quizCount > 0) : [];
  // Ghép tên chủ đề vào category lúc hiển thị để dùng lại bộ lọc có sẵn
  const nameById = new Map(groups.flatMap((g) => g.quizzes.map((z) => [z.id, g.topic.name])));
  const items = data ? data.quizzes.map((z) => ({ ...z, category: nameById.get(z.id) || "Chưa phân loại" })) : [];
  const list = applyFilters(items, q, cat, tag);

  return (
    <div className="container section">
      <h1 className="gradient-text" style={{ fontSize: "2.6rem", marginBottom: 8 }}>Ôn tập trắc nghiệm</h1>
      <p className="muted" style={{ marginBottom: 28 }}>
        Luyện tập theo chủ đề, thi thử có tính giờ hoặc xem lời giải chi tiết từng bộ đề.
      </p>

      {!data ? (
        <div className="grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card glass reveal" style={{ minHeight: 150, animation: "pulse 1.5s infinite" }}>
              <div style={{ height: 40, width: 40, background: "var(--glass-border)", borderRadius: 10, marginBottom: 16 }} />
              <div style={{ height: 20, width: "60%", background: "var(--glass-border)", borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 14, width: "40%", background: "var(--glass-border)", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : !data.quizzes.length ? (
        <div className="empty">Chưa có bộ đề nào được đăng.</div>
      ) : (
        <>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 14 }}>Chủ đề</h2>
          <div className="grid" style={{ marginBottom: 40 }}>
            {groups.map((g) => <TopicCard key={g.topic.id} g={g} />)}
          </div>

          <h2 style={{ fontSize: "1.3rem", marginBottom: 14 }}>Tất cả bộ đề</h2>
          <Filters items={items} query={q} setQuery={setQ} cat={cat} setCat={setCat} tag={tag} setTag={setTag} />
          {list.length ? (
            <div className="grid">{list.map((z) => <QuizCard key={z.id} q={z} />)}</div>
          ) : (
            <div className="empty">Không tìm thấy bộ đề phù hợp.</div>
          )}
        </>
      )}
    </div>
  );
}
