"use client";
import Link from "next/link";
import { getUserAttempts, fmtDate } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { formatDuration } from "@/lib/quiz";

const MODE = { practice: "Ôn tập", exam: "Thi thử" };

export default function QuizHistory({ uid }) {
  const { data, loading } = useAsync(() => getUserAttempts(uid), [uid]);

  if (!data && loading) return <div className="empty">Đang tải lịch sử...</div>;
  const list = data || [];
  if (!list.length) {
    return (
      <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)", textAlign: "center" }}>
        <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>🧠</div>
        <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Chưa có lượt làm bài nào</h2>
        <p className="muted" style={{ marginBottom: 18 }}>Kết quả Ôn tập và Thi thử của bạn sẽ được lưu ở đây.</p>
        <Link href="/quiz" className="btn btn-primary btn-sm">Bắt đầu ôn tập</Link>
      </div>
    );
  }

  const avg = Math.round(list.reduce((s, a) => s + (a.percent || 0), 0) / list.length);
  const best = Math.max(...list.map((a) => a.percent || 0));

  return (
    <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
      <h2 style={{ fontSize: "1.3rem", marginBottom: 14 }}>Lịch sử ôn tập</h2>
      <div className="stats" style={{ marginBottom: 20 }}>
        <div className="stat glass"><b>{list.length}</b><span className="muted">Lượt làm</span></div>
        <div className="stat glass"><b>{avg}%</b><span className="muted">Điểm trung bình</span></div>
        <div className="stat glass"><b>{best}%</b><span className="muted">Điểm cao nhất</span></div>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {list.map((a) => (
          <div className="row glass" key={a.id} style={{ margin: 0 }}>
            <div style={{ minWidth: 0 }}>
              <b>{a.quizTitle || "Bộ đề đã xóa"}</b>
              <div className="muted" style={{ fontSize: ".8rem" }}>
                {MODE[a.mode] || a.mode} · Đúng {a.correctCount}/{a.total} · ⏱ {formatDuration(a.durationSec)} · {fmtDate(a.createdAt)}
              </div>
            </div>
            <div className="actions" style={{ alignItems: "center" }}>
              <span className={`badge ${a.percent >= 50 ? "" : "draft"}`} style={{ fontSize: ".85rem" }}>{a.percent}%</span>
              {a.quizId && <Link href={`/quiz/${a.quizId}`} className="btn btn-ghost btn-sm">Làm lại</Link>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
