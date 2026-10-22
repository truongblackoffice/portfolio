"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtDate } from "@/lib/db";
import { renderIcon } from "@/lib/presets";

const OPTIMIZED_HOSTS = [
  "firebasestorage.googleapis.com",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "images.unsplash.com",
];

function canOptimize(src) {
  if (!src || typeof src !== "string") return false;
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return OPTIMIZED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

export function PostCard({ p }) {
  return (
    <Link href={`/blog/${p.slug || p.id}`} className="card glass reveal" style={{ padding: p.cover ? 0 : 26, overflow: "hidden" }}>
      {p.cover && (
        <div style={{ height: 160, width: "100%", overflow: "hidden", position: "relative" }}>
          <Image
            src={p.cover}
            alt={p.title || "Ảnh bài viết"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover", transition: ".3s" }}
            unoptimized={!canOptimize(p.cover)}
          />
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
  const router = useRouter();
  const n = q.questions?.length || 0;

  const handleCardClick = (e) => {
    // Không can thiệp nếu người dùng bấm vào các nút hoặc liên kết con
    if (e.target.closest("a, button")) return;
    router.push(`/quiz/${q.id}`);
  };

  return (
    <div
      className="card glass reveal"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.target.closest("a, button")) {
          router.push(`/quiz/${q.id}`);
        }
      }}
      title="Bấm để vào trang tùy chọn chế độ thi & ôn tập"
    >
      <div className="meta">
        {q.membersOnly && <span>🔒 Thành viên</span>}
        <span>{q.category || "Chưa phân loại"}</span>
        <span>· {n} câu</span>
        {q.timeLimitMin > 0 && <span>· ⏱ {q.timeLimitMin} phút</span>}
      </div>
      <h3 style={{ fontSize: "1.15rem" }}>
        <Link href={`/quiz/${q.id}`} style={{ color: "inherit", textDecoration: "none" }} className="hover-underline">
          {q.title}
        </Link>
      </h3>
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
