import request, { setToken, clearToken } from "./api";

export async function login(email, password) {
  const res = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (res?.success && res.data?.token) {
    setToken(res.data.token);
    return res.data;
  }

  throw new Error(res?.message || "Login failed");
}

export async function fetchMe() {
  const res = await request("/auth/me");
  return res?.data?.user || null;
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // ignore network errors on logout
  }
  clearToken();
}