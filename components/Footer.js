"use client";
import { useSite } from "@/lib/SiteContext";

export default function Footer() {
  const { site } = useSite();
  return (
    <footer className="footer">
      <div className="container">© {site.footerText}</div>
    </footer>
  );
}
