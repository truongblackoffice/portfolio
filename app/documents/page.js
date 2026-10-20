"use client";
import { useState } from "react";
import { listItems } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { DocCard, Filters, applyFilters } from "@/components/Cards";

export default function Documents() {
  const { data } = useAsync(() => listItems("documents"), [], "documents_list");
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [tag, setTag] = useState("");
  if (!data) return <div className="empty">Đang tải...</div>;
  const list = applyFilters(data, q, cat, tag);
  return (
    <div className="container section">
      <h1 className="gradient-text" style={{ fontSize: "2.6rem", marginBottom: 24 }}>Thư viện tài liệu</h1>
      <Filters items={data} query={q} setQuery={setQ} cat={cat} setCat={setCat} tag={tag} setTag={setTag} />
      {list.length ? <div className="grid">{list.map((d) => <DocCard key={d.id} d={d} />)}</div> : <div className="empty">Không tìm thấy tài liệu.</div>}
    </div>
  );
}
