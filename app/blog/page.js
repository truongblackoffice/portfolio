"use client";
import { useState } from "react";
import { listItems } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { PostCard, Filters, applyFilters } from "@/components/Cards";

export default function Blog() {
  const { data } = useAsync(
    async () => (await listItems("posts", true)).filter((p) => p.published),
    [],
    "blog_posts"
  );
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [tag, setTag] = useState("");
  const list = data ? applyFilters(data, q, cat, tag) : [];

  return (
    <div className="container section">
      <h1 className="gradient-text" style={{ fontSize: "2.6rem", marginBottom: 24 }}>Bài viết</h1>
      {data && <Filters items={data} query={q} setQuery={setQ} cat={cat} setCat={setCat} tag={tag} setTag={setTag} />}
      {!data ? (
        <div className="grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card glass reveal" style={{ minHeight: 180, animation: "pulse 1.5s infinite" }}>
              <div style={{ height: 16, width: "35%", background: "var(--glass-border)", borderRadius: 4, marginBottom: 16 }} />
              <div style={{ height: 22, width: "75%", background: "var(--glass-border)", borderRadius: 4, marginBottom: 14 }} />
              <div style={{ height: 14, width: "100%", background: "var(--glass-border)", borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 14, width: "55%", background: "var(--glass-border)", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : list.length ? (
        <div className="grid">{list.map((p) => <PostCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="empty">Không tìm thấy bài viết.</div>
      )}
    </div>
  );
}
