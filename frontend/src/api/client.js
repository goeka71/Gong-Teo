// api/client.js

export const BASE_URL = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("accessToken");

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `API 요청 실패: ${response.status} ${response.statusText} (${path})`
    );
  }

  return response.json();
}

export function apiGet(path) {
  return request(path, {
    method: "GET",
  });
}

export function apiPost(path, data) {
  return request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function apiPut(path, data) {
  return request(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function apiPatch(path, data) {
  return request(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}