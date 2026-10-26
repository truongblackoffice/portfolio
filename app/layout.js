import { Suspense } from "react";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SiteProvider } from "@/lib/SiteContext";
import ScrollToTop from "@/components/ScrollToTop";
import ConsoleProtector from "@/components/ConsoleProtector";
import ToastContainer from "@/components/Toast";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata = {
  metadataBase: new URL("https://manhtruong.io.vn"),
  title: {
    default: "Nguyễn Mạnh Trường | Portfolio & Kho kiến thức",
    template: "%s | Nguyễn Mạnh Trường",
  },
  description: "Trang cá nhân, blog chia sẻ kiến thức công nghệ, lập trình và thư viện tài liệu trực tuyến của Nguyễn Mạnh Trường.",
  keywords: ["Nguyễn Mạnh Trường", "Portfolio", "Lập trình viên", "Full-stack Developer", "Next.js", "Blog công nghệ", "Tài liệu lập trình"],
  authors: [{ name: "Nguyễn Mạnh Trường" }],
  creator: "Nguyễn Mạnh Trường",
  openGraph: {
    title: "Nguyễn Mạnh Trường | Portfolio & Kho kiến thức",
    description: "Trang cá nhân, blog chia sẻ kiến thức công nghệ và thư viện tài liệu trực tuyến.",
    url: "https://manhtruong.io.vn",
    siteName: "Nguyễn Mạnh Trường",
    images: [
      {
        url: "/avatar.jpg",
        width: 800,
        height: 800,
        alt: "Nguyễn Mạnh Trường",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nguyễn Mạnh Trường | Portfolio & Kho kiến thức",
    description: "Trang cá nhân, blog chia sẻ kiến thức công nghệ và thư viện tài liệu trực tuyến.",
    images: ["/avatar.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://manhtruong.io.vn/#website",
      "url": "https://manhtruong.io.vn",
      "name": "Nguyễn Mạnh Trường - Portfolio & Kho kiến thức",
      "description": "Trang cá nhân, blog chia sẻ kiến thức công nghệ, lập trình và thư viện tài liệu trực tuyến.",
      "inLanguage": "vi-VN",
    },
    {
      "@type": "Person",
      "@id": "https://manhtruong.io.vn/#person",
      "name": "Nguyễn Mạnh Trường",
      "url": "https://manhtruong.io.vn",
      "image": "https://manhtruong.io.vn/avatar.jpg",
      "jobTitle": "Full-stack Developer",
      "description": "Lập trình viên Full-stack chuyên về Next.js, React, Node.js và Firebase.",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
        <SiteProvider>
          <ConsoleProtector />
          <Suspense fallback={null}><Navbar /></Suspense>
          <main><Suspense fallback={<div className="empty">Đang tải...</div>}>{children}</Suspense></main>
          <Footer />
          <ScrollToTop />
          <ToastContainer />
        </SiteProvider>
      </body>
    </html>
  );
}
