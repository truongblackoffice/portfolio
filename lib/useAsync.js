"use client";
import { useEffect, useState } from "react";

// SWR Cache giúp hiển thị dữ liệu tức thì (0ms) khi chuyển qua lại giữa các trang
const swrCache = new Map();

export default function useAsync(loader, deps = [], cacheKey = null) {
  const [data, setData] = useState(() => (cacheKey && swrCache.has(cacheKey) ? swrCache.get(cacheKey) : null));
  const [loading, setLoading] = useState(() => (cacheKey && swrCache.has(cacheKey) ? false : true));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!cacheKey || !swrCache.has(cacheKey)) {
      setLoading(true);
    }
    loader()
      .then((d) => {
        if (!alive) return;
        if (cacheKey) swrCache.set(cacheKey, d);
        setData(d);
      })
      .catch(console.error)
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, reload: () => setTick((t) => t + 1) };
}
