"use client";
import { useEffect, useState, useRef } from "react";

// SWR In-Memory Cache
const memCache = new Map();

function getCached(key, initialFallback = null) {
  if (!key) return initialFallback;
  if (memCache.has(key)) return memCache.get(key);
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("swr_" + key);
      if (stored) {
        const parsed = JSON.parse(stored);
        memCache.set(key, parsed);
        return parsed;
      }
    } catch {}
  }
  return initialFallback;
}

export function setCached(key, data) {
  if (!key) return;
  memCache.set(key, data);
  if (typeof window !== "undefined") {
    try {
      setTimeout(() => {
        try {
          localStorage.setItem("swr_" + key, JSON.stringify(data));
        } catch {}
      }, 0);
    } catch {}
  }
}

export function clearCached(key) {
  if (key) {
    memCache.delete(key);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("swr_" + key);
      } catch {}
    }
  } else {
    memCache.clear();
    if (typeof window !== "undefined") {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("swr_"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
  }
}

/**
 * useAsync hook với cơ chế SWR 2 tầng (Memory + LocalStorage):
 * 1. Hiển thị dữ liệu tức thì (0ms) từ cache ngay khi render lần đầu
 * 2. Tự động cập nhật ngầm (revalidate) từ server/Firestore
 * 3. Hỗ trợ initialData dự phòng cho lần đầu ghé thăm (Cold Start)
 */
export default function useAsync(loader, deps = [], cacheKey = null, initialData = null) {
  const [data, setData] = useState(() => getCached(cacheKey, initialData));
  const [loading, setLoading] = useState(() => !getCached(cacheKey, initialData));
  const [tick, setTick] = useState(0);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let alive = true;
    const hasData = Boolean(getCached(cacheKey, initialData));
    if (!hasData) {
      setLoading(true);
    }

    loaderRef.current()
      .then((res) => {
        if (!alive) return;
        if (cacheKey) setCached(cacheKey, res);
        setData(res);
      })
      .catch((err) => {
        console.error("useAsync error:", err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, reload: () => setTick((t) => t + 1) };
}
