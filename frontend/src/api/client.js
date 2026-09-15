// api/client.js

export const BASE_URL = "http://127.0.0.1:8000";

function fetchWithToken(path, options, token) {
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

async function request(path, options = {}) {
  const token = localStorage.getItem("accessToken");

  let response = await fetchWithToken(path, options, token);

  // 로그인이 필요 없는 공개 API에도 예전에 로그인했을 때 남은 만료/무효
  // accessToken이 매번 실려 나가면서, 백엔드가 permission 체크 전에
  // 401을 던져 전부 실패해버리는 문제가 있었다.
  // -> 401이면 무효 토큰을 지우고 헤더 없이 한 번만 다시 시도한다.
  //    (재시도도 401이면 그 요청 자체가 로그인을 요구하는 것이므로 그대로 던진다.)
  if (response.status === 401 && token) {
    localStorage.removeItem("accessToken");
    window.dispatchEvent(new Event("auth-change"));
    response = await fetchWithToken(path, options, null);
  }

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