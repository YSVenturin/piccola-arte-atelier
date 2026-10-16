import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error("VITE_API_BASE_URL was not defined.");
}

const options = {
  baseURL,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
};

export const api = axios.create(options);

const csrfClient = axios.create(options);

const unauthorizedListeners = new Set<() => void>();

export function onAdminUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener);

  return () => {
    unauthorizedListeners.delete(listener);
  };
}

api.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase() ?? "GET";

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const { data } = await csrfClient.get<{
      headerName: string;
      token: string;
    }>("/auth/csrf", {
      signal: config.signal,
    });

    config.headers.set(data.headerName, data.token);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.url?.startsWith("/admin/")
    ) {
      unauthorizedListeners.forEach((listener) => listener());
    }

    return Promise.reject(error);
  },
);