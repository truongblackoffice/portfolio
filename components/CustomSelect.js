"use client";
import { useState, useRef, useEffect } from "react";

/**
 * CustomSelect - Dropdown menu phong cách Glassmorphism hiện đại
 * Thay thế cho thẻ <select> native thô kệch của trình duyệt
 * 
 * @param {string|number} value - Giá trị được chọn
 * @param {Function} onChange - Callback khi chọn giá trị (val) => void
 * @param {Array<{value: string, label: string, icon?: string}|string>} options - Danh sách các tùy chọn
 * @param {string} placeholder - Nhãn hiển thị khi chưa chọn hoặc giá trị rỗng
 * @param {string} icon - Biểu tượng hiển thị ở đầu nút chọn
 * @param {object} style - Inline style cho container
 * @param {string} className - Class CSS mở rộng
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Chọn một mục...",
  icon = null,
  style = {},
  className = "",
  id,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Chuẩn hóa options thành dạng { value, label, icon }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : "",
        label: opt.label || opt.value || "",
        icon: opt.icon || null,
      };
    }
    return { value: opt, label: String(opt), icon: null };
  });

  // Tìm option hiện tại
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const currentLabel = selectedOption ? selectedOption.label : placeholder;
  const currentIcon = selectedOption?.icon || icon;

  // Đóng khi click ngoài dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Điều khiển bằng bàn phím
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleSelect = (val) => {
    if (onChange) {
      // Giả lập event target value để tương thích cả dạng e.target.value và val trực tiếp
      onChange(val);
    }
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${open ? "open" : ""} ${className}`}
      style={{ position: "relative", minWidth: 180, ...style }}
      id={id}
    >
      {/* Nút trigger dropdown */}
      <button
        type="button"
        className={`custom-select-trigger ${open ? "is-active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "11px 16px",
          borderRadius: 14,
          background: open ? "hsla(262 90% 68% / .14)" : "hsla(0 0% 100% / .06)",
          border: `1px solid ${open ? "var(--primary)" : "var(--glass-border)"}`,
          color: "var(--text)",
          fontSize: ".9rem",
          cursor: "pointer",
          transition: "all .2s ease",
          boxShadow: open ? "0 0 0 3px hsla(262 90% 68% / .25)" : "none",
          outline: "none",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
          {currentIcon && (
            <span style={{ fontSize: "1.05rem", flexShrink: 0, display: "inline-flex", alignItems: "center" }}>
              {currentIcon}
            </span>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: selectedOption && selectedOption.value !== "" ? 600 : 400 }}>
            {currentLabel}
          </span>
        </div>

        {/* Chevron icon xoay mượt */}
        <div
          style={{
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            width: 20,
            height: 20,
            transition: "transform .22s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: open ? "var(--accent)" : "var(--muted)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Menu thả xuống Glassmorphism */}
      {open && (
        <div
          className="custom-select-menu"
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 150,
            background: "var(--surface, #121626)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid var(--glass-border)",
            borderRadius: 14,
            padding: "6px",
            boxShadow: "0 18px 45px rgba(0, 0, 0, .6), 0 0 0 1px hsla(262 90% 68% / .15)",
            maxHeight: 280,
            overflowY: "auto",
            animation: "select-dropdown-in .18s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {normalizedOptions.map((opt, index) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={index}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`custom-select-item ${isSelected ? "selected" : ""}`}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: isSelected ? "hsla(262 90% 68% / .22)" : "transparent",
                  border: "none",
                  color: isSelected ? "#fff" : "var(--text)",
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: ".88rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background .15s, color .15s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "hsla(262 90% 68% / .12)";
                    e.currentTarget.style.color = "var(--accent)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text)";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {opt.icon && (
                    <span style={{ fontSize: "1rem", flexShrink: 0, display: "inline-flex", alignItems: "center" }}>
                      {opt.icon}
                    </span>
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {opt.label}
                  </span>
                </div>

                {isSelected && (
                  <span style={{ color: "var(--accent)", fontSize: ".85rem", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}

          {normalizedOptions.length === 0 && (
            <div style={{ padding: "12px", textAlign: "center", color: "var(--muted)", fontSize: ".82rem" }}>
              Không có tùy chọn nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}
