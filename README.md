# Nguyễn Mạnh Trường - Portfolio & Knowledge Hub

Trang web hồ sơ cá nhân và kho chia sẻ kiến thức, tài liệu trực tuyến được xây dựng với **Next.js 16 (App Router)**, **Firebase Auth & Firestore**, và **Supabase Storage**.

## 🚀 Tính năng nổi bật

- **Trang chủ & Giới thiệu:** Hồ sơ chuyên nghiệp, danh sách kỹ năng, dòng thời gian kinh nghiệm và học vấn.
- **Bài viết & Blog:** Đọc và chia sẻ bài viết kỹ thuật, hỗ trợ Markdown, phân loại theo chuyên mục, thẻ tags.
- **Kho tài liệu:** Lưu trữ và chia sẻ file tài liệu (PDF, Word, Zip, v.v.) với phiên bản và đường dẫn tải về.
- **Hệ thống xác thực:** Đăng nhập & Đăng ký bằng Email/Mật khẩu hoặc Google Auth (Firebase).
- **Phân quyền người dùng (RBAC):** Admin, Editor, Member, Khách truy cập; hỗ trợ khóa/mở khóa tài khoản.
- **Trung tâm quản trị (Admin CMS):**
  - Trình soạn thảo bài viết chia đôi màn hình (Split-screen Live Markdown Preview).
  - Trình quản lý tài liệu xem trước thẻ (DocCard Preview).
  - Quản lý danh mục bài viết & tài liệu trực quan (icon, mã màu, mô tả).
  - Thư viện hình ảnh & media với tính năng 1-click copy link.
  - Quản lý hồ sơ cá nhân (thẻ kỹ năng, kinh nghiệm) không cần chạm vào code.
  - Tùy biến giao diện (Branding, màu sắc, thanh thông báo banner trên đỉnh trang).
  - Sao lưu và phục hồi dữ liệu 1-click qua file JSON.

## 🛠️ Công nghệ sử dụng

- **Frontend:** Next.js 16 (Turbopack, Vanilla CSS Glassmorphism).
- **Cơ sở dữ liệu & Xác thực:** Google Firebase (Auth, Cloud Firestore).
- **Lưu trữ tệp tin:** Supabase Storage.
- **Triển khai:** Vercel.

## ⚡ Tối ưu hóa hiệu năng & Tốc độ

Các giải pháp tối ưu chuyên sâu đã được tích hợp trực tiếp vào dự án:

- **Tự động lưu trữ Font cục bộ (Next.js Self-Hosted Fonts):**
  - Xóa bỏ hoàn toàn `@import` chặn render trong CSS.
  - Sử dụng cơ chế tối ưu hóa font của Next.js (`next/font/google` cho Inter & Outfit) được nén chuẩn WOFF2 và nhúng sẵn vào mã nguồn lúc build. Trang web hiển thị chữ ngay lập tức, không tốn thêm bất kỳ round-trip nào để tải từ Google Fonts bên ngoài.

- **Cơ chế SWR In-Memory Cache (Chuyển trang tức thì 0ms):**
  - Tích hợp bộ nhớ đệm in-memory (TTL 30s) trong hook `useAsync` và [lib/db.js](file:///d:/web/lib/db.js).
  - Khi người xem chuyển qua lại giữa các mục (Trang chủ, Bài viết, Tài liệu, Giới thiệu), nội dung hiện lên ngay lập tức (0ms) mà không bị nhấp nháy hoặc hiển thị lại thông báo "Đang tải...".

- **Không làm nghẽn tải trang vì Auth:**
  - Thiết lập cơ chế `Promise.race` tối đa 200ms cho việc kiểm tra phiên đăng nhập Firebase Auth.
  - Khách đọc bài viết sẽ nhận được dữ liệu công khai ngay tức thì mà không phải chờ Firebase Auth handshake xong.

- **Truy vấn tối ưu trực tiếp theo Slug (`limit(1)`):**
  - Tối ưu hóa truy vấn chi tiết bài viết, chỉ lấy duy nhất 1 document khớp với slug bằng lệnh `query(..., limit(1))` thay vì tải toàn bộ collection như trước đây, giúp tiết kiệm băng thông và giảm tối đa độ trễ từ Firestore.

## 📦 Chạy cục bộ

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để trải nghiệm.

