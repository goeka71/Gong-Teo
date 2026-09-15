// api/client.js

export const BASE_URL = "http://127.0.0.1:8000";

export function saveTokens(access, refresh) {
  if (access) localStorage.setItem("accessToken", access);
  if (refresh) localStorage.setItem("refreshToken", refresh);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");

  // Navbar 등에 로그인 상태 변경을 알린다.
  window.dispatchEvent(new Event("auth-change"));
}

// access token 이 만료됐을 때 refresh token 으로 새로 발급받는다.
// (SIMPLE_JWT 기본 설정상 access token 수명이 5분으로 짧아서, 로그인한 채로
//  몇 분만 지나도 만료되어 이 갱신 없이는 이후 모든 요청이 401로 실패한다.)
// 실패하면(리프레시 토큰이 없거나 만료) 로그인 정보를 지우고 null 을 반환한다.
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/users/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();

    if (!data.access) {
      clearTokens();
      return null;
    }

    saveTokens(data.access, data.refresh);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

function buildHeaders(baseHeaders, token) {
  const headers = { ...(baseHeaders || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(path, options = {}) {
  const token = localStorage.getItem("accessToken");

  let response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, token),
  });

  // access token 이 만료/무효해서 401 이 온 경우, 보냈던 토큰이 있었다면
  // 한 번 갱신해서 재시도한다.
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: buildHeaders(options.headers, newToken),
      });
    } else {
      // refresh 마저 실패했다는 건(리프레시 토큰이 없거나 만료) 이 세션이
      // 완전히 죽었다는 뜻이다. clearTokens() 는 refreshAccessToken() 안에서
      // 이미 호출됐다. 로그인이 필요 없는 공개 API(시설 목록 등)는 원래
      // 토큰 없이도 되는 요청이니, 죽은 토큰 없이 한 번 더 시도한다.
      // 그래도 401이면 그 요청 자체가 로그인을 요구하는 것이므로 그대로 던진다.
      response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: buildHeaders(options.headers, null),
      });
    }
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
