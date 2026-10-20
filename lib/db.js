"use client";
import {
  collection, getDocs, getDoc, doc, setDoc, addDoc, deleteDoc, query, where, updateDoc, increment, limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup,
} from "firebase/auth";
import { auth, db, storage, isFirebaseConfigured } from "./firebase";
import { supabase, SUPABASE_BUCKET } from "./supabase";
import { seedProfile, seedPosts, seedDocuments } from "./seed";

/* Chế độ demo (chưa cấu hình Firebase): dữ liệu lưu trong localStorage. */
export const isDemo = !isFirebaseConfigured;
export const DEMO_EMAIL = "admin@demo.local";
export const DEMO_PASSWORD = "admin123";

const LS = "site:";
function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(LS + key);
    if (v) return JSON.parse(v);
  } catch {}
  localStorage.setItem(LS + key, JSON.stringify(fallback));
  return fallback;
}
const lsSet = (key, v) => localStorage.setItem(LS + key, JSON.stringify(v));
const seeds = { posts: seedPosts, documents: seedDocuments, messages: [] };

// Bộ đệm bộ nhớ (In-memory Cache 30s) giúp chuyển trang tức thì (0ms)
const queryCache = new Map();
const CACHE_TTL = 30000;

export function clearQueryCache() {
  queryCache.clear();
}

// Kiểm tra Auth nhanh không làm nghẽn trang web đối với khách đọc bài
let authReadyPromise = null;
function ensureAuthReady() {
  if (auth?.currentUser) return Promise.resolve();
  if (!authReadyPromise && auth?.authStateReady) {
    authReadyPromise = Promise.race([
      auth.authStateReady(),
      new Promise((resolve) => setTimeout(resolve, 200)),
    ]);
  }
  return authReadyPromise || Promise.resolve();
}

/* publicOnly: chỉ lấy bài đã đăng (cần cho khách chưa đăng nhập theo rules) */
export async function listItems(col, publicOnly = false) {
  const cacheKey = `${col}:${publicOnly}`;
  const now = Date.now();
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (now - cached.time < CACHE_TTL) {
      return cached.items;
    }
  }

  let items;
  if (isDemo) items = lsGet(col, seeds[col] || []);
  else {
    const base = collection(db, col);
    await ensureAuthReady();
    const signedIn = Boolean(auth.currentUser);
    const cs = [];
    if (publicOnly && col === "posts") cs.push(where("published", "==", true));
    // Khách chưa đăng nhập chỉ được lấy nội dung công khai (rules yêu cầu truy vấn phải ràng buộc)
    if (!signedIn && (col === "posts" || col === "documents")) cs.push(where("membersOnly", "==", false));
    const snap = await getDocs(cs.length ? query(base, ...cs) : base);
    items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const sorted = items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  queryCache.set(cacheKey, { items: sorted, time: now });
  return sorted;
}

export async function getItem(col, id) {
  if (isDemo) {
    const items = await listItems(col, col === "posts");
    return items.find((i) => i.id === id || i.slug === id) || null;
  }
  try {
    // 1. Nếu là posts, tìm nhanh trực tiếp theo slug (chỉ lấy đúng 1 bản ghi)
    if (col === "posts") {
      const q = query(collection(db, "posts"), where("slug", "==", id), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    }
    // 2. Tìm theo ID tài liệu
    const docSnap = await getDoc(doc(db, col, id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch {}

  // 3. Dự phòng tìm trong danh sách
  const items = await listItems(col, col === "posts");
  return items.find((i) => i.id === id || i.slug === id) || null;
}

export async function saveItem(col, item) {
  clearQueryCache();
  const data = { ...item, createdAt: item.createdAt || Date.now() };
  if (isDemo) {
    const items = lsGet(col, seeds[col] || []);
    if (!data.id) data.id = "i" + Date.now();
    const idx = items.findIndex((i) => i.id === data.id);
    if (idx >= 0) items[idx] = data; else items.push(data);
    lsSet(col, items);
    return data;
  }
  const { id, ...rest } = data;
  if (id) await setDoc(doc(db, col, id), rest);
  else { const r = await addDoc(collection(db, col), rest); data.id = r.id; }
  return data;
}

export async function removeItem(col, id) {
  clearQueryCache();
  if (isDemo) {
    lsSet(col, lsGet(col, seeds[col] || []).filter((i) => i.id !== id));
    return;
  }
  await deleteDoc(doc(db, col, id));
}

export async function incrementPostViews(postId) {
  if (!postId || isDemo) return;
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      views: increment(1),
    });
  } catch (e) {
    // Không làm phiền độc giả nếu có lỗi kết nối
    console.warn("Could not increment views:", e.message);
  }
}

export async function listComments(postId) {
  if (!postId) return [];
  if (isDemo) {
    const all = lsGet("comments", []);
    return all.filter((c) => c.postId === postId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  try {
    const q = query(collection(db, "comments"), where("postId", "==", postId));
    const snap = await getDocs(q);
    const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return comments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e) {
    console.error("Error listing comments:", e);
    return [];
  }
}

export async function addComment(commentData) {
  const data = {
    ...commentData,
    createdAt: Date.now(),
  };
  if (isDemo) {
    const all = lsGet("comments", []);
    data.id = "c" + Date.now();
    all.push(data);
    lsSet("comments", all);
    return data;
  }
  const ref = await addDoc(collection(db, "comments"), data);
  return { id: ref.id, ...data };
}

export async function removeComment(commentId) {
  if (isDemo) {
    const all = lsGet("comments", []);
    lsSet("comments", all.filter((c) => c.id !== commentId));
    return;
  }
  await deleteDoc(doc(db, "comments", commentId));
}

export async function getProfile() {
  let fallback = seedProfile;
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("cached_profile");
      if (cached) fallback = JSON.parse(cached);
    } catch {}
  }
  if (isDemo) return lsGet("profile", fallback);
  try {
    const s = await getDoc(doc(db, "profile", "main"));
    if (s.exists()) {
      const data = s.data();
      if (typeof window !== "undefined") {
        try { localStorage.setItem("cached_profile", JSON.stringify(data)); } catch {}
      }
      return data;
    }
  } catch (e) {
    console.error("getProfile error:", e);
  }
  return fallback;
}

export async function saveProfile(p) {
  if (typeof window !== "undefined") {
    try { localStorage.setItem("cached_profile", JSON.stringify(p)); } catch {}
  }
  if (isDemo) return lsSet("profile", p);
  await setDoc(doc(db, "profile", "main"), p);
}

export async function uploadFile(file) {
  if (isDemo) throw new Error("Chế độ demo chưa hỗ trợ upload, hãy dùng liên kết.");

  // 1. Tải lên Supabase Storage nếu đã cấu hình
  if (supabase) {
    const ext = file.name.split(".").pop();
    const cleanBase = slugify(file.name.replace(/\.[^/.]+$/, "")) || "file";
    const path = `${Date.now()}-${cleanBase}.${ext}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) throw new Error(`Lỗi tải lên Supabase: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  // 2. Dự phòng Firebase Storage nếu có
  try {
    const r = ref(storage, `documents/${Date.now()}-${file.name}`);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  } catch (err) {
    throw new Error(
      "Firebase Storage yêu cầu gói trả phí (Blaze). Hãy thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào .env.local để dùng Supabase Storage miễn phí 100%, hoặc dán URL ảnh trực tiếp."
    );
  }
}

/* Xác thực */
export async function login(email, password) {
  if (isDemo) {
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem(LS + "admin", "1");
      window.dispatchEvent(new Event("auth-change"));
      return;
    }
    throw new Error("Sai thông tin đăng nhập demo.");
  }
  await signInWithEmailAndPassword(auth, email, password);
}

export async function register(name, email, password) {
  if (isDemo) throw new Error("Chế độ demo chưa hỗ trợ đăng ký.");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
}

export async function loginWithGoogle() {
  if (isDemo) throw new Error("Chế độ demo chưa hỗ trợ Google.");
  await signInWithPopup(auth, new GoogleAuthProvider());
}

const OBF_EMAIL = typeof atob === "function" ? atob("cGNyb25ndmFuZ0BnbWFpbC5jb20=") : "";
export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || OBF_EMAIL).trim();
export const isAdminUser = (u) =>
  Boolean(u && u.email && ADMIN_EMAIL && u.email.toLowerCase() === (isDemo ? DEMO_EMAIL : ADMIN_EMAIL).toLowerCase());

export const ROLES = { admin: "Admin", editor: "Biên tập viên", member: "Thành viên" };
export const roleOf = (u) => (!u ? null : (isAdminUser(u) || u.appRole === "admin") ? "admin" : u.appRole || "member");
export const canEdit = (u) => ["admin", "editor"].includes(roleOf(u));

/* Gán membersOnly=false cho nội dung cũ (cần để truy vấn của khách thỏa rules) */
export async function migrateAccess() {
  if (isDemo) return;
  for (const col of ["posts", "documents"]) {
    const snap = await getDocs(collection(db, col));
    for (const d of snap.docs) {
      if (typeof d.data().membersOnly !== "boolean") await setDoc(d.ref, { membersOnly: false }, { merge: true });
    }
  }
}

export function authMessage(e) {
  const m = {
    "auth/email-already-in-use": "Email này đã được đăng ký.",
    "auth/weak-password": "Mật khẩu quá yếu (tối thiểu 6 ký tự).",
    "auth/invalid-credential": "Sai email hoặc mật khẩu.",
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập Google.",
    "auth/operation-not-allowed": "Phương thức này chưa được bật trong Firebase Authentication.",
    "auth/unauthorized-domain": "Tên miền chưa được thêm vào Authorized domains.",
  };
  return m[e?.code] || e?.message || "Có lỗi xảy ra.";
}

export async function logout() {
  if (isDemo) {
    localStorage.removeItem(LS + "admin");
    window.dispatchEvent(new Event("auth-change"));
    return;
  }
  await signOut(auth);
}

/* Đồng bộ tài khoản Auth vào collection `users` (client SDK không liệt kê được Auth). Trả về vai trò, hoặc null nếu tài khoản bị khóa. */
async function syncUser(u) {
  const isAdm = isAdminUser(u);
  let role = isAdm ? "admin" : "member";
  try {
    const r = doc(db, "users", u.uid);
    const snap = await getDoc(r);
    const now = Date.now();
    if (snap.exists()) {
      if (snap.data().disabled) return null;
      role = isAdm ? "admin" : (snap.data().role || "member");
      await setDoc(r, {
        email: u.email || "",
        displayName: u.displayName || "",
        photoURL: u.photoURL || "",
        lastLogin: now,
        ...(isAdm ? { role: "admin" } : {}),
      }, { merge: true });
    } else {
      await setDoc(r, {
        email: u.email || "", displayName: u.displayName || "", photoURL: u.photoURL || "",
        provider: u.providerData?.[0]?.providerId || "password", disabled: false, role, createdAt: now, lastLogin: now,
      });
    }
  } catch (e) { console.error("syncUser", e); }
  return role;
}

export function watchAuth(cb) {
  if (isDemo) {
    const fn = () => cb(localStorage.getItem(LS + "admin") ? { email: DEMO_EMAIL } : null);
    fn();
    window.addEventListener("auth-change", fn);
    return () => window.removeEventListener("auth-change", fn);
  }
  return onAuthStateChanged(auth, async (u) => {
    if (u) {
      const role = await syncUser(u);
      if (role === null) {
        await signOut(auth);
        alert("Tài khoản của bạn đã bị khóa.");
        return cb(null);
      }
      u.appRole = role;
    }
    cb(u);
  });
}

export const fmtDate = (t) =>
  new Date(t || Date.now()).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
