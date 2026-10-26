"use client";
import {
  collection, getDocs, getDoc, doc, setDoc, addDoc, deleteDoc, query, where, updateDoc, increment, limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, updateProfile, updatePassword, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, deleteUser,
} from "firebase/auth";
import { auth, db, storage, isFirebaseConfigured } from "./firebase";
import { supabase, SUPABASE_BUCKET } from "./supabase";
import { seedProfile, seedPosts, seedDocuments } from "./seed";
import { toast } from "./toast";

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
const seeds = { posts: seedPosts, documents: seedDocuments, messages: [], quizzes: [], quizTopics: [], quizAttempts: [] };
// Bộ sưu tập có cờ "đã đăng" và "chỉ thành viên" (rules yêu cầu truy vấn của khách phải ràng buộc cả hai)
const PUBLISHABLE = ["posts", "quizzes"];
const GATED = ["posts", "documents", "quizzes"];

// Bộ đệm bộ nhớ (In-memory Cache 30s) giúp chuyển trang tức thì (0ms)
const queryCache = new Map();
const inFlightQueries = new Map();
const CACHE_TTL = 30000;

export function clearQueryCache() {
  queryCache.clear();
  inFlightQueries.clear();
  profileCache = null;
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

  // Tránh bắn nhiều query trùng lặp cùng lúc khi nhiều component cùng gọi
  if (inFlightQueries.has(cacheKey)) {
    return inFlightQueries.get(cacheKey);
  }

  const p = (async () => {
    let items;
    if (isDemo) items = lsGet(col, seeds[col] || []);
    else {
      const base = collection(db, col);
      await ensureAuthReady();
      const signedIn = Boolean(auth.currentUser);
      const cs = [];
      if (publicOnly && PUBLISHABLE.includes(col)) cs.push(where("published", "==", true));
      // Khách chưa đăng nhập chỉ được lấy nội dung công khai (rules yêu cầu truy vấn phải ràng buộc)
      if (!signedIn && GATED.includes(col)) cs.push(where("membersOnly", "==", false));
      const snap = await getDocs(cs.length ? query(base, ...cs) : base);
      items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Hợp nhất các bài viết / tài liệu mẫu (seeds) nếu chưa có trên Firestore
      if (seeds[col] && seeds[col].length > 0) {
        const existingSlugs = new Set(items.map((i) => i.slug || i.id));
        for (const s of seeds[col]) {
          if (!existingSlugs.has(s.slug || s.id)) {
            if (!publicOnly || s.published) {
              items.push(s);
            }
          }
        }
      }
    }
    const sorted = items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    queryCache.set(cacheKey, { items: sorted, time: Date.now() });
    return sorted;
  })().finally(() => {
    inFlightQueries.delete(cacheKey);
  });

  inFlightQueries.set(cacheKey, p);
  return p;
}

export async function getItem(col, id) {
  if (isDemo) {
    const items = await listItems(col, PUBLISHABLE.includes(col));
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
  const items = await listItems(col, PUBLISHABLE.includes(col));
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

let profileCache = null;
let profileCacheTime = 0;
let profilePromise = null;

export async function getProfile() {
  const now = Date.now();
  if (profileCache && now - profileCacheTime < CACHE_TTL) {
    return profileCache;
  }
  if (profilePromise) return profilePromise;

  profilePromise = (async () => {
    let fallback = seedProfile;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_profile");
        if (cached) fallback = JSON.parse(cached);
      } catch {}
    }
    if (isDemo) {
      const res = lsGet("profile", fallback);
      profileCache = res;
      profileCacheTime = Date.now();
      return res;
    }
    try {
      const s = await getDoc(doc(db, "profile", "main"));
      if (s.exists()) {
        const data = s.data();
        if (typeof window !== "undefined") {
          try { localStorage.setItem("cached_profile", JSON.stringify(data)); } catch {}
        }
        profileCache = data;
        profileCacheTime = Date.now();
        return data;
      }
    } catch (e) {
      console.error("getProfile error:", e);
    }
    profileCache = fallback;
    profileCacheTime = Date.now();
    return fallback;
  })().finally(() => {
    profilePromise = null;
  });

  return profilePromise;
}

export async function saveProfile(p) {
  profileCache = p;
  profileCacheTime = Date.now();
  if (typeof window !== "undefined") {
    try { localStorage.setItem("cached_profile", JSON.stringify(p)); } catch {}
  }
  if (isDemo) return lsSet("profile", p);
  await setDoc(doc(db, "profile", "main"), p);
}

export async function uploadFile(file) {
  if (isDemo) throw new Error("Chế độ demo chưa hỗ trợ upload, hãy dùng liên kết.");

  const isImage = file.type?.startsWith("image/");
  const maxMb = isImage ? 5 : 25;
  if (file.size > maxMb * 1024 * 1024) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      isImage
        ? `Ảnh tải lên quá lớn (${sizeMb}MB). Vui lòng chọn ảnh dưới 5MB để tối ưu tốc độ tải.`
        : `Tệp tải lên quá lớn (${sizeMb}MB). Dung lượng tối đa cho phép là ${maxMb}MB.`
    );
  }

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
  try {
    const prof = await getProfile();
    if (prof?.site?.security?.disableRegistration) {
      throw new Error(prof?.site?.security?.registrationCloseMessage || "Chức năng đăng ký tài khoản mới hiện đang tạm đóng.");
    }
  } catch (err) {
    if (err.message && (err.message.includes("đăng ký") || err.message.includes("tạm đóng"))) throw err;
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
}

export async function loginWithGoogle() {
  if (isDemo) throw new Error("Chế độ demo chưa hỗ trợ Google.");
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  const additional = getAdditionalUserInfo(cred);
  if (additional?.isNewUser && !isAdminUser(cred.user)) {
    try {
      const prof = await getProfile();
      if (prof?.site?.security?.disableRegistration) {
        await deleteUser(cred.user).catch(() => signOut(auth));
        await signOut(auth);
        throw new Error(prof?.site?.security?.registrationCloseMessage || "Chức năng đăng ký tài khoản mới hiện đang tạm đóng.");
      }
    } catch (err) {
      await signOut(auth).catch(() => {});
      throw err;
    }
  }
}

export async function updateUserProfile({ displayName, photoURL, bio }) {
  if (isDemo) return;
  if (!auth.currentUser) throw new Error("Bạn chưa đăng nhập.");
  const updateData = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (photoURL !== undefined) updateData.photoURL = photoURL;
  if (Object.keys(updateData).length > 0) {
    await updateProfile(auth.currentUser, updateData);
  }
  const userRef = doc(db, "users", auth.currentUser.uid);
  await setDoc(userRef, {
    ...(displayName !== undefined ? { displayName } : {}),
    ...(photoURL !== undefined ? { photoURL } : {}),
    ...(bio !== undefined ? { bio } : {}),
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function changeUserPassword(newPassword) {
  if (isDemo) throw new Error("Chế độ demo không hỗ trợ đổi mật khẩu.");
  if (!auth.currentUser) throw new Error("Bạn chưa đăng nhập.");
  await updatePassword(auth.currentUser, newPassword);
}

/* Lịch sử ôn tập trắc nghiệm: chỉ lưu cho thành viên đã đăng nhập, lỗi ghi không làm hỏng màn hình kết quả */
export async function saveAttempt(attempt) {
  const user = auth?.currentUser;
  const uid = user?.uid || (isDemo && localStorage.getItem(LS + "admin") ? "demo" : null);
  if (!uid) return null;
  const userName = user?.displayName || user?.email?.split("@")[0] || (uid === "demo" ? "Admin Demo" : "Thành viên");
  const userPhoto = user?.photoURL || "";
  const data = { ...attempt, uid, userName, userPhoto, createdAt: Date.now() };
  try {
    if (isDemo) {
      const all = lsGet("quizAttempts", []);
      data.id = "a" + Date.now();
      all.push(data);
      lsSet("quizAttempts", all);
      return data;
    }
    const r = await addDoc(collection(db, "quizAttempts"), data);
    return { id: r.id, ...data };
  } catch (e) {
    console.warn("Không lưu được lịch sử làm bài:", e.message);
    return null;
  }
}

export async function getQuizLeaderboard(quizId, max = 10) {
  if (!quizId) return [];
  try {
    let list = [];
    if (isDemo) {
      list = lsGet("quizAttempts", []).filter((a) => a.quizId === quizId && a.mode === "exam");
    } else {
      const snap = await getDocs(
        query(
          collection(db, "quizAttempts"),
          where("quizId", "==", quizId),
          where("mode", "==", "exam")
        )
      );
      list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    // Sắp xếp: Tỷ lệ đúng (%) cao nhất, nếu bằng nhau thì thời gian làm bài (durationSec) ít nhất
    list.sort((a, b) => {
      if ((b.percent ?? 0) !== (a.percent ?? 0)) return (b.percent ?? 0) - (a.percent ?? 0);
      return (a.durationSec ?? 999999) - (b.durationSec ?? 999999);
    });
    // Lọc lấy kết quả cao nhất của mỗi người dùng
    const seen = new Set();
    const unique = [];
    for (const item of list) {
      const key = item.uid || item.userName;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
      if (unique.length >= max) break;
    }
    return unique;
  } catch (e) {
    console.error("getQuizLeaderboard error:", e);
    return [];
  }
}

export async function getUserAttempts(uid) {
  if (!uid) return [];
  try {
    let list;
    if (isDemo) list = lsGet("quizAttempts", []).filter((a) => a.uid === uid);
    else {
      const snap = await getDocs(query(collection(db, "quizAttempts"), where("uid", "==", uid)));
      list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e) {
    console.error("getUserAttempts error:", e);
    return [];
  }
}

export async function sendUserPasswordReset(email) {
  if (isDemo) throw new Error("Chế độ demo không hỗ trợ gửi email.");
  await sendPasswordResetEmail(auth, email || auth.currentUser?.email);
}

export async function getUserData(uid) {
  if (!uid || isDemo) return null;
  try {
    const r = doc(db, "users", uid);
    const snap = await getDoc(r);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("getUserData error:", e);
    return null;
  }
}

export async function getUserComments(uid) {
  if (!uid || isDemo) return [];
  try {
    const q = query(collection(db, "comments"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (e) {
    console.error("getUserComments error:", e);
    return [];
  }
}

const OBF_EMAIL = typeof atob === "function" ? atob("cGNyb25ndmFuZ0BnbWFpbC5jb20=") : "";
export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || OBF_EMAIL).trim();
export const isAdminUser = (u) =>
  Boolean(u && u.email && ADMIN_EMAIL && u.email.toLowerCase() === (isDemo ? DEMO_EMAIL : ADMIN_EMAIL).toLowerCase());

export const ROLES = { admin: "Quản trị viên", editor: "Biên tập viên", member: "Thành viên" };

// Danh sách các tính năng có thể phân quyền
export const ADMIN_FEATURES = [
  { id: "dash", name: "Tổng quan & Thống kê", icon: "📊", desc: "Xem lượt truy cập, biểu đồ và số liệu tổng quan" },
  { id: "posts", name: "Quản lý Bài viết", icon: "✍️", desc: "Soạn thảo, chỉnh sửa, xuất bản bài viết" },
  { id: "documents", name: "Quản lý Tài liệu", icon: "📁", desc: "Đăng tải và chia sẻ kho tài liệu" },
  { id: "categories", name: "Quản lý Danh mục", icon: "🏷️", desc: "Tạo và cấu hình danh mục chủ đề" },
  { id: "quizzes", name: "Ôn tập & Trắc nghiệm", icon: "🧠", desc: "Soạn đề thi, ngân hàng câu hỏi và chủ đề ôn tập" },
  { id: "media", name: "Thư viện Media", icon: "🖼️", desc: "Quản lý hình ảnh và tệp tải lên" },
  { id: "profile", name: "Hồ sơ cá nhân", icon: "👤", desc: "Chỉnh sửa thông tin tác giả website" },
  { id: "appearance", name: "Giao diện & Banner", icon: "🎨", desc: "Tùy biến thương hiệu, màu sắc, top banner" },
  { id: "security", name: "Bảo mật & Bảo vệ Web", icon: "🛡️", desc: "Cấu hình chống copy, chặn F12, chặn console, khóa đăng ký" },
  { id: "users", name: "Quản lý tài khoản & Phân quyền", icon: "👥", desc: "Phân quyền và quản lý tài khoản người dùng" },
  { id: "messages", name: "Hòm thư liên hệ", icon: "📩", desc: "Đọc và phản hồi tin nhắn từ độc giả" },
  { id: "backup", name: "Sao lưu & Khôi phục", icon: "💾", desc: "Xuất dữ liệu và phục hồi cơ sở dữ liệu" },
];

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: ADMIN_FEATURES.map((f) => f.id),
  editor: ["dash", "posts", "documents", "categories", "quizzes", "media"],
  member: [],
};

export function getDefaultPermissions(role) {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

export const roleOf = (u) => {
  if (!u) return null;
  if (isAdminUser(u)) return "admin";
  return u.appRole || u.role || "member";
};

export function hasPermission(user, featureId) {
  if (!user) return false;
  if (isAdminUser(user)) return true; // Super Admin email luôn có toàn quyền
  const role = roleOf(user);
  if (role === "admin" && (!user.permissions || user.permissions.length === 0)) return true;
  const perms = Array.isArray(user.permissions) ? user.permissions : getDefaultPermissions(role);
  return perms.includes(featureId);
}

export const canEdit = (u) => {
  if (!u) return false;
  if (isAdminUser(u)) return true;
  const role = roleOf(u);
  if (role === "admin" || role === "editor") return true;
  if (Array.isArray(u.permissions) && u.permissions.length > 0) return true;
  return false;
};

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

/* Đồng bộ tài khoản Auth vào collection `users` (client SDK không liệt kê được Auth). Trả về vai trò và permissions, hoặc null nếu tài khoản bị khóa. */
async function syncUser(u) {
  const isAdm = isAdminUser(u);
  let role = isAdm ? "admin" : "member";
  let permissions = null;
  try {
    const r = doc(db, "users", u.uid);
    const snap = await getDoc(r);
    const now = Date.now();
    if (snap.exists()) {
      if (snap.data().disabled) return null;
      role = isAdm ? "admin" : (snap.data().role || "member");
      permissions = snap.data().permissions || null;
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
  return { role, permissions };
}

export function watchAuth(cb) {
  if (isDemo) {
    const fn = () => cb(localStorage.getItem(LS + "admin") ? { email: DEMO_EMAIL, appRole: "admin", permissions: DEFAULT_ROLE_PERMISSIONS.admin } : null);
    fn();
    window.addEventListener("auth-change", fn);
    return () => window.removeEventListener("auth-change", fn);
  }
  return onAuthStateChanged(auth, async (u) => {
    if (u) {
      const info = await syncUser(u);
      if (info === null) {
        await signOut(auth);
        toast.error("Tài khoản của bạn đã bị khóa bởi Quản trị viên.");
        return cb(null);
      }
      u.appRole = info.role;
      u.permissions = info.permissions;
    }
    cb(u);
  });
}

export const fmtDate = (t) =>
  new Date(t || Date.now()).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
