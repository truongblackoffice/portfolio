"use client";
import Link from "next/link";
import { fmtDate } from "@/lib/db";
import { renderIcon } from "@/lib/presets";

export function PostCard({ p }) {
  return (
    <Link href={`/blog/${p.slug || p.id}`} className="card glass reveal" style={{ padding: p.cover ? 0 : 26, overflow: "hidden" }}>
      {p.cover && (
        <div style={{ height: 160, width: "100%", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.cover} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: ".3s" }} />
        </div>
      )}
      <div style={{ padding: p.cover ? 20 : 0, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div className="meta">
          {p.membersOnly && <span>🔒 Thành viên</span>}
          <span>{p.category}</span>
          {p.readTime && <span>· {p.readTime}</span>}
          {p.views > 0 && <span>· 👁️ {p.views}</span>}
          <span>· {fmtDate(p.createdAt)}</span>
        </div>
        <h3 style={{ fontSize: "1.2rem" }}>{p.title}</h3>
        <p className="muted grow" style={{ fontSize: ".92rem" }}>{p.excerpt}</p>
        <div className="chips">{(p.tags || []).map((t) => <span className="chip" key={t}>#{t}</span>)}</div>
      </div>
    </Link>
  );
}

export function DocCard({ d }) {
  return (
    <div className="card glass reveal">
      <div className="meta">
        {d.membersOnly && <span>🔒 Thành viên</span>}
        <span>{d.category}</span>
        <span>{d.fileType}{d.size ? ` · ${d.size}` : ""}</span>
        {d.version && <span>· v{d.version}</span>}
        <span>· {fmtDate(d.createdAt)}</span>
      </div>
      <h3>{d.title}</h3>
      {d.author && <div className="muted" style={{ fontSize: ".82rem" }}>Nguồn/Tác giả: <b>{d.author}</b></div>}
      <p className="muted grow">{d.description}</p>
      <div className="chips">{(d.tags || []).map((t) => <span className="chip" key={t}>#{t}</span>)}</div>
      <a className="btn btn-primary btn-sm" href={d.fileUrl} target="_blank" rel="noreferrer" style={{ alignSelf: "flex-start", marginTop: 6 }}>
        Mở / Tải về ↗
      </a>
    </div>
  );
}

/* Thẻ chủ đề ôn tập */
export function TopicCard({ g }) {
  const t = g.topic;
  return (
    <Link href={`/quiz/topic/${t.id}`} className="card glass reveal quiz-topic" style={{ "--topic": t.color || "#8b5cf6" }}>
      <div className="quiz-topic-icon" aria-hidden="true">{renderIcon(t.icon, "📁")}</div>
      <h3 style={{ fontSize: "1.1rem" }}>{t.name}</h3>
      {t.desc && <p className="muted" style={{ fontSize: ".86rem" }}>{t.desc}</p>}
      <div className="meta" style={{ marginTop: "auto" }}>
        <span>{g.quizCount} bộ đề</span>
        <span>· {g.questionCount} câu</span>
      </div>
    </Link>
  );
}

/* Thẻ bộ đề trắc nghiệm */
export function QuizCard({ q }) {
  const n = q.questions?.length || 0;
  return (
    <div className="card glass reveal">
      <div className="meta">
        {q.membersOnly && <span>🔒 Thành viên</span>}
        <span>{q.category || "Chưa phân loại"}</span>
        <span>· {n} câu</span>
        {q.timeLimitMin > 0 && <span>· ⏱ {q.timeLimitMin} phút</span>}
      </div>
      <h3 style={{ fontSize: "1.15rem" }}>{q.title}</h3>
      {q.description && <p className="muted grow" style={{ fontSize: ".92rem" }}>{q.description}</p>}
      <div className="chips">{(q.tags || []).map((t) => <span className="chip" key={t}>#{t}</span>)}</div>
      <div className="qrow" style={{ gap: 8, marginTop: 6 }}>
        <Link className="btn btn-primary btn-sm" href={`/quiz/${q.id}`}>Làm bài</Link>
        <Link className="btn btn-ghost btn-sm" href={`/quiz/${q.id}?mode=study`}>📖 Lời giải</Link>
      </div>
    </div>
  );
}

/* Thanh tìm kiếm + lọc danh mục + thẻ */
export function Filters({ items, query, setQuery, cat, setCat, tag, setTag }) {
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const tags = [...new Set(items.flatMap((i) => i.tags || []))];
  return (
    <>
      <div className="toolbar">
        <input id="search-input" placeholder="🔍 Tìm kiếm..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select id="category-select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Tất cả danh mục</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="chips" style={{ marginBottom: 28 }}>
        {tags.map((t) => (
          <button key={t} className={`chip ${tag === t ? "on" : ""}`} onClick={() => setTag(tag === t ? "" : t)}>#{t}</button>
        ))}
      </div>
    </>
  );
}

export function applyFilters(items, query, cat, tag) {
  const q = query.toLowerCase();
  return items.filter((i) =>
    (!cat || i.category === cat) &&
    (!tag || (i.tags || []).includes(tag)) &&
    (!q || `${i.title} ${i.excerpt || i.description || ""}`.toLowerCase().includes(q)));
}
