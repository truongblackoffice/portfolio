"use client";
import { getProfile } from "@/lib/db";
import { seedProfile } from "@/lib/seed";
import useAsync from "@/lib/useAsync";

export default function About() {
  const { data: p } = useAsync(getProfile, [], "about_profile", seedProfile);
  const profile = p || seedProfile;
  const s = profile.socials || {};
  const experience = profile.experience || [];
  const skills = profile.skills || [];

  return (
    <div className="container section">
      <h1 className="gradient-text" style={{ fontSize: "2.6rem", marginBottom: 12 }}>Giới thiệu</h1>
      <p className="muted" style={{ maxWidth: 700, marginBottom: 40 }}>
        {p.bio || "Thông tin giới thiệu cá nhân có thể được cập nhật trong trang Quản trị."}
      </p>

      <div className="about-grid">
        <div>
          <h2 style={{ marginBottom: 20 }}>Kinh nghiệm</h2>
          {experience.length > 0 ? (
            <div className="timeline">
              {experience.map((e, i) => (
                <div className="item glass reveal" key={i}>
                  <div className="muted" style={{ fontSize: ".8rem" }}>{e.period}</div>
                  <h3>{e.role} · <span className="gradient-text">{e.place}</span></h3>
                  <p className="muted">{e.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontStyle: "italic" }}>Chưa có thông tin kinh nghiệm (thêm tại Quản trị &gt; Hồ sơ).</div>
          )}
        </div>

        <div>
          <h2 style={{ marginBottom: 20 }}>Kỹ năng</h2>
          {skills.length > 0 ? (
            <div className="chips" style={{ marginBottom: 36 }}>
              {skills.map((k) => <span className="chip" key={k}>{k}</span>)}
            </div>
          ) : (
            <div className="muted" style={{ marginBottom: 36, fontStyle: "italic" }}>Chưa có danh sách kỹ năng (thêm tại Quản trị &gt; Hồ sơ).</div>
          )}

          <h2 style={{ marginBottom: 20 }}>Kết nối</h2>
          <div className="chips">
            {s.github && <a className="btn btn-ghost btn-sm" href={s.github} target="_blank" rel="noreferrer">GitHub</a>}
            {s.linkedin && <a className="btn btn-ghost btn-sm" href={s.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
            {s.facebook && <a className="btn btn-ghost btn-sm" href={s.facebook} target="_blank" rel="noreferrer">Facebook</a>}
            {s.email && <a className="btn btn-ghost btn-sm" href={`mailto:${s.email}`}>Email: {s.email}</a>}
            {!s.github && !s.linkedin && !s.facebook && !s.email && (
              <span className="muted">Chưa có liên kết mạng xã hội.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
