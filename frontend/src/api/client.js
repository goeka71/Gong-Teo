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
    // 응답 본문(대부분 DRF serializer 에러 JSON)을 최대한 살려서 넘긴다.
    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      // 본문이 비어있거나 JSON이 아닌 경우 무시
    }

    const error = new Error(
      `API 요청 실패: ${response.status} ${response.statusText} (${path})`
    );
    error.status = response.status;
    error.data = data;

    throw error;
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