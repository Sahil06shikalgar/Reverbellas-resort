const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error(
    "VITE_API_URL is not set. Set VITE_API_URL to the deployed backend " +
    "(e.g. https://riverbells-backend.up.railway.app/api) on the Vercel frontend and redeploy."
  );
}

const TOKEN_KEY = "riverbells_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const url = `${API_URL}${endpoint}`;

  let response;

  try {
    response = await fetch(url, {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (networkError) {
    console.error(`[API] Network error ${options.method || "GET"} ${url}`, {
      requestUrl: url,
      reason: networkError.message || "Failed to fetch",
    });
    const error = new Error(
      `Network error reaching ${url}. Check your connection and the API URL.`
    );
    error.status = 0;
    error.requestUrl = url;
    throw error;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error(`[API] ${options.method || "GET"} ${url} -> ${response.status}`, {
      requestUrl: url,
      status: response.status,
      apiError: data?.message || "",
      code: data?.code || "",
    });
    const error = new Error(
      data?.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.code = data?.code || "";
    error.requestUrl = url;
    throw error;
  }

  return data;
};

export const query = (endpoint) => request(endpoint);
export const mutate = (endpoint, method, body) =>
  request(endpoint, { method, body: JSON.stringify(body) });

export default request;