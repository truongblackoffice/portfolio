"use client";

const listeners = new Set();

function emitToast(t) {
  listeners.forEach((fn) => {
    try { fn(t); } catch {}
  });
}

export const toast = {
  success(message, duration = 3000) {
    emitToast({ id: Math.random().toString(36).slice(2), type: "success", message, duration });
  },
  error(message, duration = 4000) {
    emitToast({ id: Math.random().toString(36).slice(2), type: "error", message, duration });
  },
  info(message, duration = 3000) {
    emitToast({ id: Math.random().toString(36).slice(2), type: "info", message, duration });
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
