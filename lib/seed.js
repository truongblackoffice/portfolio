export const seedProfile = {
  name: "Nguyễn Mạnh Trường",
  title: "Lập trình viên & Người chia sẻ kiến thức",
  bio: "Chào mừng bạn đến với trang web cá nhân và không gian chia sẻ kiến thức của mình.",
  skills: [],
  experience: [],
  socials: { github: "", linkedin: "", email: "" },
  site: {
    logoText: "<ManhTruong/>",
    siteName: "Nguyễn Mạnh Trường",
    tagline: "Hồ sơ cá nhân & Kho kiến thức",
  },
};

export const seedPosts = [
  {
    id: "antigravity-desktop-mac-guide",
    title: "Hướng Dẫn Cài Đặt Google Antigravity Desktop & Mac Chi Tiết Từ A Đến Z",
    slug: "huong-dan-cai-dat-google-antigravity-desktop-mac",
    excerpt: "Cẩm nang hướng dẫn từng bước tải về, cài đặt Google Antigravity Desktop trên macOS & Windows, xử lý cảnh báo bảo mật Gatekeeper, thiết lập Workspace và khai thác sức mạnh AI Agent từ Google DeepMind.",
    category: "Hướng dẫn",
    tags: ["Antigravity", "macOS", "Windows", "AI Agent", "Developer Tools", "Google DeepMind"],
    cover: "/images/blog/antigravity-cover.jpg",
    author: "Mạnh Trường (ADMIN)",
    readTime: "8 phút đọc",
    views: 86,
    membersOnly: false,
    published: true,
    createdAt: 1792558200000,
    content: `## 🚀 Giới Thiệu Google Antigravity Desktop 2.0

**Google Antigravity** là nền tảng phát triển phần mềm AI-First đột phá được phát triển bởi đội ngũ **Google DeepMind (Advanced Agentic Coding)**. Không chỉ đơn thuần là một công cụ hỗ trợ gợi ý code thông thường (như GitHub Copilot), Antigravity là một **Autonomous AI Pair Programmer** (Lập trình viên AI tự hành) có khả năng:

- 🧠 **Tự lập kế hoạch (Autonomous Planning):** Phân tích toàn bộ kiến trúc dự án và xây dựng lộ trình giải quyết bài toán phức tạp.
- 💻 **Thao tác Terminal & Hệ thống:** Tự động chạy lệnh cài đặt thư viện, build, kiểm thử, phân tích lỗi (diagnostics) và sửa lỗi trong môi trường sandbox an toàn.
- 🌐 **Tự động hóa trình duyệt (Browser Testing):** Trực tiếp mở trình duyệt web, tương tác với giao diện người dùng, kiểm tra DOM và ghi lại video kiểm thử.
- 🔌 **Hỗ trợ Model Context Protocol (MCP):** Mở rộng năng lực kết nối với cơ sở dữ liệu, tài liệu API, Cloud và hàng loạt dịch vụ ngoại vi.

![Giao diện tổng quan Google Antigravity Desktop](/images/blog/antigravity-cover.jpg)

Phiên bản **Antigravity Desktop 2.0** hoạt động độc lập (standalone desktop application) với giao diện trực quan, khung trò chuyện song song, quản lý nhiều Workspace cùng hệ thống giám sát tiến trình Agent chuyên sâu.

---

## 💻 Yêu Cầu Hệ Thống Khuyến Nghị

Trước khi tiến hành cài đặt, hãy đảm bảo thiết bị của bạn đáp ứng các tiêu chuẩn sau:

| Hệ điều hành | Phiên bản tối thiểu | Chip xử lý (CPU) | RAM khuyến nghị | Bộ nhớ trống |
| :--- | :--- | :--- | :--- | :--- |
| **macOS** | macOS Monterey (12.0+) | Apple Silicon (M1/M2/M3/M4) hoặc Intel 64-bit | 16 GB RAM (Tối thiểu 8 GB) | 5 GB SSD |
| **Windows** | Windows 10/11 (64-bit) | Intel Core i5/i7 thế hệ 10+ hoặc AMD Ryzen 5+ | 16 GB RAM (Tối thiểu 8 GB) | 5 GB SSD |
| **Linux** | Ubuntu 22.04 LTS / Debian 12 | x86_64 / ARM64 | 16 GB RAM | 5 GB SSD |

> 💡 **Khuyến nghị:** Đối với người dùng Mac, máy tính trang bị chip Apple Silicon (M-series) sẽ đem lại tốc độ phản hồi nhanh gấp 2.5 lần nhờ tận dụng bộ xử lý Neural Engine tối ưu hóa riêng cho các tác vụ AI.

---

## 📥 Bước 1: Tải Bản Cài Đặt Antigravity Chính Thức

Truy cập vào trang chủ chính thức của nền tảng tại địa chỉ:  
🔗 **[https://antigravity.google/download](https://antigravity.google/download)**

Tại mục tải xuống, bạn lựa chọn gói cài đặt phù hợp với thiết bị:
- **macOS (Apple Silicon - M1/M2/M3/M4):** Chọn tệp \`Antigravity-darwin-arm64.dmg\`.
- **macOS (Intel Core):** Chọn tệp \`Antigravity-darwin-x64.dmg\`.
- **Windows:** Chọn tệp \`Antigravity-Setup-win-x64.exe\`.

---

## 🍎 Bước 2: Hướng Dẫn Cài Đặt Trên macOS

Sau khi tải xong tệp \`.dmg\`:

1. Nhấp đúp vào tệp vừa tải về (ví dụ: \`Antigravity-darwin-arm64.dmg\`) để mở ổ đĩa ảo.
2. Cửa sổ cài đặt macOS sẽ xuất hiện với biểu tượng ứng dụng Antigravity và thư mục Applications.
3. Dùng chuột **kéo và thả (Drag & Drop)** biểu tượng **Antigravity.app** vào thư mục **Applications**.

![Kéo thả Antigravity vào Applications](/images/blog/antigravity-mac-install.jpg)

4. Chờ trong giây lát để hệ thống sao chép tệp nhị phân vào máy. Sau đó, bạn có thể nhấp chuột phải vào biểu tượng ổ đĩa trên Desktop/Finder và chọn **Eject** để tháo bộ cài.

---

## 🛡️ Bước 3: Xử Lý Cảnh Báo Bảo Mật Gatekeeper Trên macOS

Do Antigravity là ứng dụng phát triển công nghệ tiên tiến được tải trực tiếp ngoài Mac App Store, cơ chế bảo mật nghiêm ngặt **Gatekeeper** của macOS có thể hiển thị thông báo:
> *"Antigravity" was blocked from use because it is not from an identified developer.*  
> *(Ứng dụng bị chặn vì chưa được xác thực nhà phát triển App Store)*

Đừng lo lắng, bạn có thể cấp quyền khởi chạy rất dễ dàng theo 1 trong 2 cách sau:

### Cách 1: Xác nhận qua Cài đặt hệ thống (Khuyên dùng)
1. Mở menu Apple  ở góc trên bên trái màn hình ➔ Chọn **System Settings (Cài đặt hệ thống)**.
2. Tìm và chọn mục **Privacy & Security (Quyền riêng tư & Bảo mật)** ở danh sách bên trái.
3. Cuộn xuống phần **Security (Bảo mật)**, bạn sẽ thấy dòng thông báo ứng dụng Antigravity vừa bị chặn.
4. Bấm vào nút màu xanh **Open Anyway (Vẫn mở)**.

![Cấp quyền Open Anyway trong Privacy & Security](/images/blog/antigravity-mac-security.jpg)

5. Nhập mật khẩu máy Mac hoặc chạm vân tay Touch ID để xác nhận. Hộp thoại sẽ hỏi lại lần cuối, bạn chỉ cần chọn **Open** là ứng dụng sẽ khởi động ngay lập tức.

### Cách 2: Gỡ cờ cách ly (Quarantine) qua Terminal
Nếu bạn quen thuộc với dòng lệnh, hãy mở ứng dụng **Terminal** trên Mac và chạy lệnh sau:

\`\`\`bash
xattr -cr /Applications/Antigravity.app
\`\`\`

Lệnh trên sẽ xóa hoàn toàn thuộc tính kiểm soát cách ly của macOS, giúp Antigravity khởi động mượt mà mà không bao giờ hỏi lại.

---

## 🪟 Bước 4: Hướng Dẫn Cài Đặt Trên Windows

Đối với người dùng Windows:

1. Chạy tệp tin cài đặt \`Antigravity-Setup-win-x64.exe\`.
2. Nếu xuất hiện màn hình bảo vệ **Windows Protected Your PC (SmartScreen)**:
   - Bấm vào dòng chữ **More info** (Xem thêm thông tin).
   - Chọn **Run anyway** (Vẫn chạy).
3. Trình cài đặt sẽ tự động hoàn tất thiết lập và thêm lối tắt Antigravity ngoài màn hình Desktop.
4. *(Tùy chọn CLI)*: Mở PowerShell và kiểm tra công cụ dòng lệnh bằng cách gõ:
   \`\`\`powershell
   agy --version
   \`\`\`

---

## ⚙️ Bước 5: Khởi Động & Thiết Lập Workspace Đầu Tiên

Khi mở ứng dụng Antigravity Desktop lần đầu, bảng hướng dẫn thiết lập **Setup Your Workspace & Agent** sẽ xuất hiện:

![Thiết lập Workspace và cấu hình Agent trong Antigravity](/images/blog/antigravity-workspace-setup.jpg)

Các bước cấu hình cơ bản:
1. **Lựa chọn Mô hình AI (Gemini Model):**
   - **Gemini 2.0 Flash:** Tốc độ phản hồi cực nhanh, phù hợp cho việc gõ code, tìm kiếm lỗi và các tác vụ lặp lại thường ngày.
   - **Gemini 2.0 Pro:** Khả năng suy luận đa tầng chuyên sâu, lý tưởng cho việc tái cấu trúc hệ thống lớn (refactoring), thiết kế kiến trúc và giải quyết các bài toán logic phức tạp.
2. **Chọn thư mục dự án (Workspace Root Selection):**
   - Nhấn **Browse** và trỏ đến thư mục chứa mã nguồn dự án của bạn (ví dụ: \`d:\\web\` hoặc \`/Users/yourname/projects/my-app\`).
3. **Cấp quyền thực thi cho Agent (Agent Permissions):**
   - **Auto-execution Policy:** Cho phép Agent tự động chạy các lệnh an toàn (như git status, npm run, build test).
   - **Sandbox Mode (Môi trường cách ly):** Khuyến khích kích hoạt **ON** để đảm bảo Agent chỉ thao tác trong phạm vi dự án, không tác động đến các tệp nhạy cảm bên ngoài hệ thống.

Nhấn **Continue ➔** để bắt đầu bước vào không gian lập trình AI!

---

## ⌨️ Phím Tắt & Thao Tác Quyền Năng Cho Lập Trình Viên

Để đạt năng suất tối đa x10 lần khi lập trình cùng Antigravity, bạn hãy ghi nhớ các phím tắt thần thánh sau:

| Thao tác | Phím tắt macOS | Phím tắt Windows/Linux | Chức năng |
| :--- | :--- | :--- | :--- |
| **Antigravity Tab** | <kbd>Tab</kbd> | <kbd>Tab</kbd> | Tự động hoàn thành mã nguồn thông minh (Autocomplete & Supercomplete). |
| **Inline Code Command** | <kbd>⌘ + I</kbd> | <kbd>Ctrl + I</kbd> | Mở thanh lệnh AI ngay tại dòng code để tái cấu trúc, viết hàm hoặc fix bug. |
| **Mở Chat Agent** | <kbd>⌘ + L</kbd> | <kbd>Ctrl + L</kbd> | Bật/tắt thanh trò chuyện cặp đôi lập trình cùng AI. |
| **Gắn ngữ cảnh (@)** | <kbd>@</kbd> | <kbd>@</kbd> | Gõ \`@\` để đính kèm file, thư mục, rules hoặc terminal vào câu lệnh. |
| **Gọi lệnh nhanh (/)** | <kbd>/</kbd> | <kbd>/</kbd> | Gõ \`/\` để dùng các workflow chuyên biệt: \`/plan\`, \`/goal\`, \`/schedule\`. |

---

## 🎯 Tổng Kết

Việc làm chủ công cụ lập trình AI thế hệ mới như **Google Antigravity Desktop** trên macOS và Windows sẽ mở ra một kỷ nguyên mới trong phong cách làm việc của bạn: biến những ý tưởng phức tạp thành sản phẩm hoàn thiện chỉ trong vài phút thay vì hàng giờ lập trình thủ công.

Chúc các bạn cài đặt thành công và có những trải nghiệm thăng hoa cùng Antigravity! Nếu gặp bất kỳ vướng mắc nào trong quá trình cài đặt, đừng ngần ngại để lại bình luận ở phía dưới bài viết để được hỗ trợ giải đáp nhé.`
  },
  {
    id: "openai-codex-cli-guide",
    title: "OpenAI Codex Là Gì? Hướng Dẫn Cài Đặt Và Sử Dụng Codex CLI Từ Cơ Bản",
    slug: "huong-dan-cai-dat-su-dung-openai-codex-cli",
    excerpt: "Tìm hiểu Codex — trợ lý lập trình AI của OpenAI chạy ngay trong terminal: cách cài đặt trên macOS, Linux, Windows, đăng nhập bằng tài khoản ChatGPT, các chế độ phê duyệt & sandbox, file AGENTS.md và cấu hình cơ bản.",
    category: "Hướng dẫn",
    tags: ["Codex", "OpenAI", "AI Agent", "CLI", "Developer Tools"],
    cover: "",
    author: "Mạnh Trường (ADMIN)",
    readTime: "6 phút đọc",
    views: 0,
    membersOnly: false,
    published: true,
    createdAt: 1792559000000,
    content: `## 🤖 Codex là gì?

**Codex** là bộ công cụ lập trình AI (coding agent) của **OpenAI**. Thay vì chỉ gợi ý từng dòng code, Codex có thể đọc hiểu cả dự án, chỉnh sửa nhiều file, chạy lệnh trong terminal và kiểm tra kết quả theo yêu cầu bằng ngôn ngữ tự nhiên.

Hiện Codex có nhiều hình thức sử dụng, bạn chọn tùy thói quen làm việc:

| Hình thức | Dùng ở đâu | Phù hợp khi |
| :--- | :--- | :--- |
| **Codex CLI** | Terminal trên máy của bạn | Thích làm việc bằng dòng lệnh, muốn agent chạy cục bộ |
| **Codex trong IDE** | VS Code, Cursor, Windsurf | Muốn dùng ngay trong trình soạn thảo quen thuộc |
| **Codex App** | Ứng dụng desktop (chạy \`codex app\`) | Muốn giao diện đồ họa thay vì terminal |
| **Codex Web** | Trình duyệt tại chatgpt.com/codex | Muốn agent chạy trên đám mây, không cần cài đặt |

Bài này tập trung vào **Codex CLI** — bản mã nguồn mở, chạy cục bộ trên máy bạn.

---

## 📥 Cài đặt Codex CLI

Theo README chính thức của dự án (github.com/openai/codex), bạn cài bằng một trong các cách sau.

### macOS / Linux

\`\`\`bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
\`\`\`

### Windows (PowerShell)

\`\`\`powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
\`\`\`

### Cài qua npm hoặc Homebrew

Nếu bạn đã quen với các trình quản lý gói:

\`\`\`bash
# npm (cần Node.js)
npm install -g @openai/codex

# Homebrew (macOS)
brew install --cask codex
\`\`\`

> 💡 **Lưu ý:** Các lệnh cài đặt có thể thay đổi theo từng phiên bản. Nếu lệnh nào không chạy, hãy đối chiếu với README mới nhất tại trang GitHub của dự án.

Sau khi cài xong, kiểm tra bằng:

\`\`\`bash
codex --version
\`\`\`

---

## 🔐 Đăng nhập lần đầu

Mở terminal, di chuyển vào thư mục dự án của bạn rồi chạy:

\`\`\`bash
cd duong-dan/den/du-an
codex
\`\`\`

Lần chạy đầu tiên, Codex sẽ yêu cầu xác thực. Bạn có hai hướng chính:

1. **Đăng nhập bằng ChatGPT (Sign in with ChatGPT):** dùng chung gói ChatGPT bạn đang có. Đây là cách đơn giản nhất cho người dùng cá nhân.
2. **Dùng OpenAI API key:** phù hợp khi bạn muốn tính phí theo lượng dùng hoặc tích hợp vào script/CI.

> ⚠️ **Bảo mật:** Tuyệt đối không commit API key lên Git. Hãy lưu trong biến môi trường hoặc file cấu hình nằm ngoài kho mã nguồn.

---

## 🛡️ Sandbox và chế độ phê duyệt

Vì agent có thể chạy lệnh và sửa file, Codex có hai lớp kiểm soát an toàn mà bạn nên hiểu rõ:

### 1. Sandbox — agent được chạm vào đâu?
- **read-only:** chỉ được đọc, không được sửa.
- **workspace-write:** được sửa file trong thư mục dự án (thường là mặc định an toàn).
- **danger-full-access:** không giới hạn — chỉ dùng khi bạn thật sự hiểu rủi ro.

### 2. Approval — khi nào agent phải hỏi bạn?
- Chế độ **chặt**: hỏi xác nhận gần như mọi thao tác chạy lệnh hoặc sửa file.
- Chế độ **hỏi khi cần**: chỉ hỏi với thao tác có tác động lớn.
- Chế độ **không hỏi**: tự động thực thi — chỉ nên dùng trong môi trường tách biệt, đáng tin cậy.

Tên gọi chính xác của từng chế độ có thể khác nhau giữa các phiên bản, hãy chạy \`codex --help\` để xem danh sách tùy chọn hiện hành.

> 🔒 **Khuyến nghị:** Khi mới làm quen, hãy giữ sandbox ở mức ghi trong workspace và để Codex hỏi trước khi chạy lệnh quan trọng. Sau khi quen mới nới lỏng dần.

---

## 📝 AGENTS.md — "README dành cho AI"

**AGENTS.md** là file hướng dẫn đặt ở thư mục gốc dự án để nói cho agent biết cách làm việc với codebase của bạn. Codex tự động đọc file này.

Ví dụ nội dung:

\`\`\`markdown
# Hướng dẫn cho agent

## Lệnh thường dùng
- Cài đặt: npm install
- Chạy dev: npm run dev
- Kiểm tra build: npm run build

## Quy ước code
- Dùng JavaScript, không thêm TypeScript.
- Không hardcode email hay khóa bí mật trong file được Git theo dõi.
- Giữ nguyên các comment không liên quan đến thay đổi.
\`\`\`

Bạn có thể đặt thêm AGENTS.md trong các thư mục con để áp dụng quy tắc riêng cho từng phần của dự án.

---

## ⚙️ Cấu hình với config.toml

Cấu hình cá nhân của Codex nằm trong file \`config.toml\` ở thư mục cấu hình của người dùng (thường là \`~/.codex/config.toml\`). Tại đây bạn có thể thiết lập:

- Mô hình mặc định và mức độ suy luận.
- Mức sandbox và chế độ phê duyệt mặc định.
- Kết nối **MCP server** (Model Context Protocol) để mở rộng khả năng cho agent, ví dụ truy cập cơ sở dữ liệu hay tài liệu ngoài.

---

## 🚀 Một vài cách dùng thực tế

Sau khi vào phiên làm việc, bạn chỉ cần mô tả yêu cầu bằng tiếng Việt hoặc tiếng Anh:

\`\`\`text
Đọc cấu trúc dự án và giải thích cho tôi luồng đăng nhập.
\`\`\`

\`\`\`text
Thêm trang /contact với form gửi tin nhắn, rồi chạy build để kiểm tra lỗi.
\`\`\`

\`\`\`text
Tìm và sửa lỗi khiến trang bài viết bị hiển thị trống khi chưa đăng nhập.
\`\`\`

**Mẹo để có kết quả tốt hơn:**
1. Mô tả mục tiêu rõ ràng và giới hạn phạm vi thay đổi.
2. Cho agent biết cách kiểm tra (ví dụ: "chạy npm run build sau khi sửa").
3. Luôn xem lại diff trước khi commit — agent có thể sai.
4. Dùng Git: commit trước khi giao việc lớn để dễ hoàn tác.

---

## 🎯 Tổng kết

Codex CLI giúp bạn giao các tác vụ lập trình lặp đi lặp lại cho AI ngay trong terminal, trong khi vẫn kiểm soát được quyền hạn nhờ sandbox và cơ chế phê duyệt. Hãy bắt đầu từ một dự án nhỏ, đặt sẵn AGENTS.md và tăng dần mức tự động khi bạn đã tin tưởng cách agent làm việc.

Tài liệu tham khảo chính thức: kho mã nguồn **github.com/openai/codex** và trang **developers.openai.com/codex**.`
  }
];

export const seedDocuments = [];

