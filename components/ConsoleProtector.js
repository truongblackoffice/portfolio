"use client";
import { useEffect } from "react";

export default function ConsoleProtector() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Chặn phím tắt mở DevTools & xem mã nguồn
    const handleKeyDown = (e) => {
      // F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K (DevTools, Console, Inspect)
      if (e.shiftKey && isModifier) {
        const k = e.key.toUpperCase();
        if (k === "I" || k === "J" || k === "C" || k === "K") {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+U (Xem nguồn trang), Ctrl+S (Lưu trang)
      if (isModifier) {
        const k = e.key.toUpperCase();
        if (k === "U" || k === "S") {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // 2. Chặn chuột phải (Context Menu) chống Inspect Element
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 3. Chặn bắt lỗi toàn cục không văng ra console
    const handleError = (e) => {
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation();
      }
      return true;
    };

    const handleUnhandledRejection = (e) => {
      e.preventDefault();
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation();
      }
      return true;
    };

    // 4. Vô hiệu hóa và bảo vệ Console
    const noop = () => {};
    const methods = [
      "log", "debug", "info", "warn", "error",
      "table", "trace", "dir", "dirxml", "group",
      "groupCollapsed", "groupEnd", "time", "timeEnd",
      "timeLog", "count", "assert"
    ];

    try {
      if (window.console && typeof window.console.clear === "function") {
        window.console.clear();
        window.console.log(
          "%c⛔ DỪNG LẠI! %c\nMọi hành vi can thiệp hoặc tác động vào Console website này đều bị chặn và giám sát để bảo vệ an toàn dữ liệu.",
          "color:#ef4444;font-size:24px;font-weight:bold;-webkit-text-stroke:1px #7f1d1d;",
          "color:#fca5a5;font-size:14px;font-weight:normal;"
        );
      }
    } catch {}

    methods.forEach((m) => {
      try {
        Object.defineProperty(window.console, m, {
          value: noop,
          writable: false,
          configurable: false,
        });
      } catch {
        try { window.console[m] = noop; } catch {}
      }
    });

    // Định kỳ dọn sạch console nếu có bất kỳ tác động nào cố gắng hiển thị
    const intervalId = setInterval(() => {
      try {
        if (window.console && typeof window.console.clear === "function") {
          window.console.clear();
        }
      } catch {}
    }, 2000);

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
    };
  }, []);

  return null;
}
