import { Suspense } from "react";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SiteProvider } from "@/lib/SiteContext";
import ScrollToTop from "@/components/ScrollToTop";
import ConsoleProtector from "@/components/ConsoleProtector";

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
    locale: "vi_VN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(typeof window==='undefined')return;window.addEventListener('error',function(e){e.preventDefault&&e.preventDefault();e.stopImmediatePropagation&&e.stopImmediatePropagation();return true;},true);window.addEventListener('unhandledrejection',function(e){e.preventDefault&&e.preventDefault();e.stopImmediatePropagation&&e.stopImmediatePropagation();return true;},true);document.addEventListener('keydown',function(e){if(e.key==='F12'||e.keyCode===123){e.preventDefault();e.stopPropagation();return false;}var m=e.ctrlKey||e.metaKey;if(e.shiftKey&&m&&['I','i','J','j','C','c','K','k'].indexOf(e.key)>-1){e.preventDefault();e.stopPropagation();return false;}if(m&&['U','u','S','s'].indexOf(e.key)>-1){e.preventDefault();e.stopPropagation();return false;}},true);document.addEventListener('contextmenu',function(e){e.preventDefault();return false;},true);var n=function(){};['log','debug','info','warn','error','table','trace','dir'].forEach(function(k){try{window.console[k]=n;}catch(x){}});if(window.console&&window.console.clear){try{window.console.clear();}catch(x){}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
        <SiteProvider>
          <ConsoleProtector />
          <Suspense fallback={null}><Navbar /></Suspense>
          <main><Suspense fallback={<div className="empty">Đang tải...</div>}>{children}</Suspense></main>
          <Footer />
          <ScrollToTop />
        </SiteProvider>
      </body>
    </html>
  );
}
