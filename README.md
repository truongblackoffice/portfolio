# Nguyễn Mạnh Trường - Portfolio, Knowledge Hub & Interactive Quiz Platform

Trang web hồ sơ cá nhân, kho chia sẻ kiến thức, tài liệu trực tuyến và nền tảng ôn thi trắc nghiệm thông minh tích hợp AI, được xây dựng với công nghệ hiện đại: **Next.js 16 (App Router & Turbopack)**, **Firebase Auth & Firestore**, **Supabase Storage**, và **Google Gemini AI**.

---

## 🚀 Tính năng nổi bật

### 1. 🧠 Nền tảng Ôn tập & Thi trắc nghiệm trực tuyến (Quiz Platform)
- **3 chế độ làm bài chuyên nghiệp:**
  - 🎯 **Ôn tập (Practice):** Làm bài không giới hạn, kiểm tra kết quả và xem giải thích chi tiết ngay từng câu, tự động lưu nháp khi đang làm bài.
  - ⏱️ **Thi thử (Exam):** Giới hạn thời gian đếm ngược, tự động nộp bài khi hết giờ, chấm điểm khi hoàn thành. Giới hạn lượt thi/giờ chống spam.
  - 📖 **Xem lời giải (Study Mode):** Xem danh sách toàn bộ câu hỏi, đáp án chuẩn và giải thích mà không cần làm bài. Hỗ trợ tìm kiếm từ khóa câu hỏi tức thì.
- **Đa dạng dạng câu hỏi:** Trắc nghiệm 1 đáp án (Single choice), nhiều đáp án (Multiple choice), Đúng/Sai (True/False).
- **Thuật toán thông minh:**
  - Xáo trộn ngẫu nhiên câu hỏi và các phương án (Fisher–Yates shuffle).
  - Tự động bốc ngẫu nhiên số lượng câu hỏi thi thử và ôn tập theo đúng cấu hình của Quản trị viên (`examQuestionCount`, `practiceQuestionCount`).
- **Vinh danh & Chứng chỉ:**
  - 🏆 **Bảng xếp hạng (Leaderboard):** Xếp hạng học viên theo điểm số cao nhất và thời gian nộp bài nhanh nhất.
  - 📜 **Cấp chứng chỉ (Certificate):** Tự động tạo và tải chứng chỉ hoàn thành xuất sắc dưới định dạng hình ảnh chuẩn nét.
  - 📊 **Lịch sử học tập:** Học viên theo dõi lịch sử làm bài, điểm số và số lần ôn luyện tại trang cá nhân (`/profile`).

### 2. 🤖 Trợ lý AI tạo đề thi thông minh (AI Quiz Generator)
- Tích hợp **Google Gemini AI** (`gemini-2.0-flash` / `gemini-2.5-flash` với cơ chế dự phòng Fallback tự động).
- **Tự động phân tích tài liệu đa định dạng:**
  - 📄 Tệp Word (`.docx`)
  - 📊 Tệp PowerPoint (`.pptx`)
  - 📕 Tệp PDF (`.pdf`)
  - 📝 Tệp văn bản thuần / Markdown (`.txt`, `.md`)
- **Tạo ngân hàng đề thi lớn:** Hỗ trợ tạo đến **200 câu hỏi** theo cơ chế chia đợt (Batching) thông minh, tránh giới hạn token.
- **Tùy biến linh hoạt:** Chọn mức độ khó (Dễ, Trung bình, Khó, Tổng hợp), số lượng câu, xem trước kết quả trực quan và nhập ngay vào ngân hàng đề thi chỉ với 1 cú click.

### 3. 🛡️ Trung tâm Bảo mật & Bảo vệ Website (Web Protection Center)
Quản trị viên toàn quyền bật/tắt linh hoạt các lớp bảo vệ trực tiếp từ trang Admin:
- **Quản lý Đăng ký thành viên (`disableRegistration`):** Bật/tắt chức năng đăng ký tài khoản mới; chặn cả biểu mẫu email và đăng ký mới qua Google Sign-In; hiển thị lời nhắn tùy chỉnh. Thành viên cũ vẫn đăng nhập bình thường.
- **Bảo vệ Console & DevTools:**
  - Chặn & làm sạch Console định kỳ (`blockConsole`).
  - Chặn phím tắt mở DevTools: F12, Ctrl+Shift+I/J/C/K (`blockDevTools`).
  - Chặn xem mã nguồn Ctrl+U và lưu trang Ctrl+S (`blockViewSource`).
  - Bẫy đóng băng Debugger loop chống dịch ngược (`antiDebugger`).
- **Bảo vệ Bản quyền nội dung:**
  - Chặn menu chuột phải (`blockContextMenu`).
  - Chặn sao chép văn bản Ctrl+C (`blockCopyText`).
  - Chặn bôi đen nội dung `user-select: none` (`blockSelectText`, trừ các ô input/textarea).
- **Đặc quyền Quản trị viên (Admin Bypass):** Tự động gỡ bỏ mọi rào cản khi Admin đăng nhập để thoải mái F12, xem console và gỡ lỗi.
- **Thiết lập nhanh theo Presets:** Cung cấp sẵn 3 cấu hình: *Tiêu chuẩn (Khuyên dùng)*, *Bảo vệ tối đa*, và *Tắt bảo vệ (Dev Mode)*.

### 4. ✍️ Blog Kỹ thuật & Kho tài liệu học tập
- **Blog & Bài viết:** Trình bày chuẩn typography, hỗ trợ Markdown, công thức, khối mã nguồn (Syntax highlighting), chuyên mục và thẻ tags.
- **Hệ thống bình luận tương tác:** Bình luận bài viết theo thời gian thực cho thành viên đã đăng nhập.
- **Kho tài liệu:** Chia sẻ file tài liệu lập trình (PDF, Word, Zip, Slide...) kèm thông tin phiên bản, dung lượng và đường dẫn tải xuống.
- **Thanh chia sẻ xã hội (ShareBar):** 1-click chia sẻ bài viết lên Facebook, LinkedIn, Twitter/X, Telegram hoặc sao chép link.

### 5. 👥 Hệ thống Thành viên & Phân quyền chi tiết (Granular RBAC)
- **Phương thức xác thực:** Đăng nhập an toàn qua Email/Mật khẩu hoặc Google Auth (Firebase Authentication).
- **Trang cá nhân:** Quản lý thông tin, đổi mật khẩu, xem thống kê lượt thi và chứng chỉ đã đạt được.
- **Phân quyền người dùng tới từng tính năng:**
  - Phân quyền theo vai trò (`admin`, `editor`, `member`).
  - Tùy biến cấp quyền riêng lẻ từng tính năng cho từng tài khoản mà không cần nâng cấp quyền Admin tối cao.
  - Khóa / Mở khóa tài khoản thành viên chỉ với 1 click.

### 6. ⚙️ Trung tâm Quản trị toàn diện (Admin CMS - 12 Phân hệ)
1. 📊 **Tổng quan & Thống kê:** Thống kê số lượng bài viết, tài liệu, đề thi, người dùng và biểu đồ tương tác.
2. ✍️ **Quản lý Bài viết:** Trình soạn thảo Markdown chia đôi màn hình trực quan (Live Split-screen Preview).
3. 📁 **Quản lý Tài liệu:** Đăng tải và phân phối tài liệu học tập.
4. 🏷️ **Quản lý Danh mục:** Tùy biến danh mục với icon, mã màu và mô tả riêng.
5. 🧠 **Ngân hàng Trắc nghiệm:** Soạn thảo đề thi, quản lý câu hỏi, cấu hình số câu làm bài, tỷ lệ đậu và tích hợp AI.
6. 🖼️ **Thư viện Media:** Quản lý tệp tải lên Supabase Storage với tính năng 1-click copy link ảnh.
7. 👤 **Hồ sơ cá nhân:** Chỉnh sửa thông tin giới thiệu, thẻ kỹ năng, dòng thời gian học vấn/kinh nghiệm.
8. 🎨 **Giao diện & Banner:** Tùy biến thương hiệu, Logo, Favicon, màu chủ đạo (Primary & Accent color), thanh thông báo đỉnh trang (Top Banner).
9. 🛡️ **Bảo mật & Bảo vệ:** Bật/tắt các công tắc an toàn, khóa đăng ký, chặn console, chặn copy.
10. 👥 **Quản lý tài khoản & Phân quyền:** Quản lý thành viên, gán quyền chi tiết, chặn tài khoản vi phạm.
11. 📩 **Hòm thư liên hệ:** Tiếp nhận và trả lời thư từ độc giả qua email trực tiếp.
12. 💾 **Sao lưu & Khôi phục:** Xuất toàn bộ cơ sở dữ liệu thành file JSON và khôi phục hệ thống 1-click.

---

## 🛠️ Công nghệ sử dụng

| Lĩnh vực | Công nghệ |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Styling** | Vanilla Modern CSS (Glassmorphism, Dark/Light Mode, Responsive Design) |
| **Cơ sở dữ liệu & Xác thực** | [Google Firebase](https://firebase.google.com/) (Auth, Cloud Firestore) |
| **Lưu trữ tệp tin (Storage)** | [Supabase Storage](https://supabase.com/storage) |
| **Trí tuệ nhân tạo (AI)** | [Google Gemini API](https://ai.google.dev/) (`gemini-2.0-flash` / `gemini-2.5-flash`) |
| **Xử lý tài liệu** | `mammoth` (Word .docx), `pdfjs-dist` (PDF), `jszip` (PowerPoint .pptx) |
| **Triển khai (Deployment)** | [Vercel](https://vercel.com/) |

---

## ⚡ Tối ưu hóa hiệu năng & SEO

- **Tự động lưu trữ Font cục bộ (Next.js Self-Hosted Fonts):** Nhúng sẵn font `Inter` và `Outfit` dạng WOFF2 lúc build, loại bỏ `@import` chặn render.
- **Bộ nhớ đệm SWR In-Memory (0ms Page Switch):** Chuyển trang mượt mà ngay tức thì, không bị giật lag hay hiển thị trạng thái chờ tải lại dữ liệu.
- **Không làm nghẽn tải trang vì Auth (`Promise.race`):** Đọc nội dung công khai ngay tức thì mà không phải chờ Firebase Auth handshake.
- **Truy vấn Firestore tối ưu (`limit(1)`):** Tối ưu truy vấn bài viết theo slug, tiết kiệm băng thông và giảm thiểu độ trễ.
- **Chuẩn SEO chuyên sâu:**
  - Tự động sinh `sitemap.xml` và `robots.txt`.
  - Khai báo Schema.org JSON-LD (Person & WebSite).
  - OpenGraph và Twitter Card tối ưu cho chia sẻ mạng xã hội.

---

## 📦 Cài đặt & Chạy cục bộ

### 1. Yêu cầu hệ thống
- Node.js 18.18.0 hoặc mới hơn.
- Trình quản lý gói `npm` hoặc `pnpm`.

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo tệp `.env.local` từ mẫu `.env.local.example` và điền các khóa cấu hình:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Supabase Storage (Upload Media)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Google Gemini API (AI Quiz Generator)
GEMINI_API_KEY=your_gemini_api_key

# Admin Email (Tài khoản Super Admin)
NEXT_PUBLIC_ADMIN_EMAIL=your_email@gmail.com
```

### 4. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt để trải nghiệm website.

### 5. Kiểm tra mã nguồn & Đóng gói sản phẩm
```bash
# Kiểm tra lint
npm run lint

# Build bản sản xuất
npm run build
```

---

## 📄 Bản quyền & Tác giả

- **Tác giả:** Nguyễn Mạnh Trường
- **Website:** [https://manhtruong.io.vn](https://manhtruong.io.vn)
- **Giấy phép:** Được phát triển phục vụ học tập, chia sẻ kiến thức và nghiên cứu công nghệ.
