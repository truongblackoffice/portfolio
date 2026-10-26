"use client";
import { useEffect, useState, useRef } from "react";
import { useSite, defaultSecurity } from "@/lib/SiteContext";
import { watchAuth, isAdminUser } from "@/lib/db";
import { toast } from "@/lib/toast";

// Lưu bản sao console gốc để có thể khôi phục hoàn hảo khi tắt tính năng hoặc khi Admin truy cập
const originalConsole = {
  log: typeof window !== "undefined" ? window.console?.log?.bind(window.console) : null,
  debug: typeof window !== "undefined" ? window.console?.debug?.bind(window.console) : null,
  info: typeof window !== "undefined" ? window.console?.info?.bind(window.console) : null,
  warn: typeof window !== "undefined" ? window.console?.warn?.bind(window.console) : null,
  error: typeof window !== "undefined" ? window.console?.error?.bind(window.console) : null,
  table: typeof window !== "undefined" ? window.console?.table?.bind(window.console) : null,
  trace: typeof window !== "undefined" ? window.console?.trace?.bind(window.console) : null,
  dir: typeof window !== "undefined" ? window.console?.dir?.bind(window.console) : null,
  clear: typeof window !== "undefined" ? window.console?.clear?.bind(window.console) : null,
};

export default function ConsoleProtector() {
  const { site } = useSite();
  const [user, setUser] = useState(undefined);
  const lastNotifyTime = useRef(0);

  useEffect(() => {
    return watchAuth((u) => setUser(u || null));
  }, []);

  const sec = site?.security || defaultSecurity;
  const isAdm = Boolean(user && (isAdminUser(user) || user.appRole === "admin" || user.role === "admin"));
  const shouldBypass = Boolean(sec.adminBypass && isAdm);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Hàm hiển thị cảnh báo với debounce để tránh spam toast
    const warnUser = (msg) => {
      if (!sec.notifyOnViolation) return;
      const now = Date.now();
      if (now - lastNotifyTime.current > 3500) {
        lastNotifyTime.current = now;
        toast.warning(msg);
      }
    };

    // Nếu người dùng là Quản trị viên và đang bật chế độ Admin Bypass:
    // Khôi phục lại console bình thường và không áp dụng bất kỳ rào cản nào
    if (shouldBypass) {
      Object.keys(originalConsole).forEach((m) => {
        if (originalConsole[m] && window.console) {
          try {
            window.console[m] = originalConsole[m];
          } catch {}
        }
      });
      document.body.classList.remove("sec-no-select");
      return;
    }

    // 1. CHẶN PHÍM TẮT DEVTOOLS & XEM NGUỒN
    const handleKeyDown = (e) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const k = (e.key || "").toUpperCase();

      // F12
      if (sec.blockDevTools && (e.key === "F12" || e.keyCode === 123)) {
        e.preventDefault();
        e.stopPropagation();
        warnUser("⚠️ Phím tắt mở DevTools đã bị vô hiệu hóa.");
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K
      if (sec.blockDevTools && e.shiftKey && isModifier) {
        if (["I", "J", "C", "K"].includes(k)) {
          e.preventDefault();
          e.stopPropagation();
          warnUser("⚠️ Phím tắt kiểm tra mã nguồn (Inspect) đã bị khóa.");
          return false;
        }
      }

      // Ctrl+U (Xem nguồn trang), Ctrl+S (Lưu trang)
      if (sec.blockViewSource && isModifier && !e.shiftKey) {
        if (k === "U") {
          e.preventDefault();
          e.stopPropagation();
          warnUser("⚠️ Chức năng xem nguồn trang (View-Source) đã bị khóa.");
          return false;
        }
        if (k === "S") {
          e.preventDefault();
          e.stopPropagation();
          warnUser("⚠️ Chức năng lưu trang web đã bị khóa.");
          return false;
        }
      }
    };

    // 2. CHẶN CHUỘT PHẢI
    const handleContextMenu = (e) => {
      if (!sec.blockContextMenu) return;
      // Cho phép chuột phải trong các ô nhập liệu input / textarea nếu cần
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      e.preventDefault();
      e.stopPropagation();
      warnUser("⚠️ Menu chuột phải đã bị vô hiệu hóa.");
      return false;
    };

    // 3. CHẶN COPY / CUT
    const handleCopy = (e) => {
      if (!sec.blockCopyText) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      e.preventDefault();
      warnUser("⚠️ Chức năng sao chép nội dung đã bị vô hiệu hóa để bảo vệ bản quyền.");
      return false;
    };

    // 4. CHẶN BÔI ĐEN VĂN BẢN
    const handleSelectStart = (e) => {
      if (!sec.blockSelectText) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
      e.preventDefault();
      return false;
    };

    if (sec.blockSelectText) {
      document.body.classList.add("sec-no-select");
    } else {
      document.body.classList.remove("sec-no-select");
    }

    // 5. CHẶN & LÀM SẠCH CONSOLE
    let intervalId = null;
    const noop = () => {};
    const methods = [
      "log", "debug", "info", "warn", "error",
      "table", "trace", "dir", "dirxml", "group",
      "groupCollapsed", "groupEnd", "time", "timeEnd",
      "timeLog", "count", "assert"
    ];

    if (sec.blockConsole) {
      try {
        if (window.console && typeof window.console.clear === "function") {
          window.console.clear();
          if (originalConsole.log) {
            originalConsole.log(
              "%c⛔ DỪNG LẠI! %c\nMọi hành vi can thiệp hoặc tác động vào Console website này đều bị chặn và giám sát để bảo vệ an toàn dữ liệu.",
              "color:#ef4444;font-size:24px;font-weight:bold;-webkit-text-stroke:1px #7f1d1d;",
              "color:#fca5a5;font-size:14px;font-weight:normal;"
            );
          }
        }
      } catch {}

      methods.forEach((m) => {
        try {
          Object.defineProperty(window.console, m, {
            value: noop,
            writable: true,
            configurable: true,
          });
        } catch {
          try { window.console[m] = noop; } catch {}
        }
      });

      intervalId = setInterval(() => {
        try {
          if (window.console && typeof window.console.clear === "function") {
            window.console.clear();
          }
        } catch {}
      }, 2500);
    } else {
      // Khôi phục console
      Object.keys(originalConsole).forEach((m) => {
        if (originalConsole[m] && window.console) {
          try {
            window.console[m] = originalConsole[m];
          } catch {}
        }
      });
    }

    // 6. BẪY DEBUGGER
    let debuggerIntervalId = null;
    if (sec.antiDebugger) {
      debuggerIntervalId = setInterval(() => {
        try {
          const fn = Function("debugger");
          fn();
        } catch {}
      }, 1000);
    }

    // Gắn các trình lắng nghe sự kiện
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("copy", handleCopy, true);
    window.addEventListener("cut", handleCopy, true);
    window.addEventListener("selectstart", handleSelectStart, true);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (debuggerIntervalId) clearInterval(debuggerIntervalId);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("copy", handleCopy, true);
      window.removeEventListener("cut", handleCopy, true);
      window.removeEventListener("selectstart", handleSelectStart, true);
      document.body.classList.remove("sec-no-select");

      // Khôi phục lại console khi unmount
      Object.keys(originalConsole).forEach((m) => {
        if (originalConsole[m] && window.console) {
          try {
            window.console[m] = originalConsole[m];
          } catch {}
        }
      });
    };
  }, [
    sec.blockConsole,
    sec.blockDevTools,
    sec.blockViewSource,
    sec.blockContextMenu,
    sec.blockCopyText,
    sec.blockSelectText,
    sec.antiDebugger,
    sec.notifyOnViolation,
    shouldBypass,
  ]);

  return (
    <style jsx global>{`
      body.sec-no-select {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      body.sec-no-select input,
      body.sec-no-select textarea,
      body.sec-no-select [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `}</style>
  );
}
