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
  if (!data) return <div className="empty">Đang tải...</div>;
  const list = applyFilters(data, q, cat, tag);
  return (
    <div className="container section">
      <h1 className="gradient-text" style={{ fontSize: "2.6rem", marginBottom: 24 }}>Bài viết</h1>
      <Filters items={data} query={q} setQuery={setQ} cat={cat} setCat={setCat} tag={tag} setTag={setTag} />
      {list.length ? <div className="grid">{list.map((p) => <PostCard key={p.id} p={p} />)}</div> : <div className="empty">Không tìm thấy bài viết.</div>}
    </div>
  );
}
