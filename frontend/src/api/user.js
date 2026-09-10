import {
  BASE_URL,
  apiGet,
  apiPost,
  apiPatch,
} from "./client";


/* =========================
   토큰 저장 / 삭제
========================= */

function saveTokens(access, refresh = null) {
  if (access) {
    localStorage.setItem(
      "accessToken",
      access
    );
  }

  if (refresh) {
    localStorage.setItem(
      "refreshToken",
      refresh
    );
  }
}


export function clearTokens() {
  localStorage.removeItem(
    "accessToken"
  );

  localStorage.removeItem(
    "refreshToken"
  );
}


/* =========================
   회원가입
========================= */

export function signup(data) {
  return apiPost(
    "/api/users/signup/",
    data
  );
}


/* =========================
   로그인
========================= */

export async function login(data) {
  const result =
    await apiPost(
      "/api/users/login/",
      data
    );

  saveTokens(
    result.access,
    result.refresh
  );

  return result;
}


/* =========================
   refresh token으로
   access token 재발급
========================= */

export async function refreshAccessToken() {
  const refreshToken =
    localStorage.getItem(
      "refreshToken"
    );

  if (!refreshToken) {
    clearTokens();

    throw new Error(
      "refresh token이 없습니다."
    );
  }

  const response =
    await fetch(
      `${BASE_URL}/api/users/token/refresh/`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          refresh:
            refreshToken,
        }),
      }
    );


  if (!response.ok) {
    clearTokens();

    throw new Error(
      "refresh token이 만료되었습니다."
    );
  }


  const data =
    await response.json();


  if (!data.access) {
    clearTokens();

    throw new Error(
      "새 access token을 발급받지 못했습니다."
    );
  }


  saveTokens(
    data.access,
    data.refresh || null
  );


  return data.access;
}


/* =========================
   인증이 필요한 요청 공통 처리

   1. 현재 access token으로 요청
   2. 401이면 refresh
   3. 새 access token으로 재요청
========================= */

async function authenticatedRequest(
  path,
  options = {}
) {
  let accessToken =
    localStorage.getItem(
      "accessToken"
    );


  const makeRequest =
    (token) => {
      const headers = {
        ...(options.headers || {}),
      };


      if (token) {
        headers.Authorization =
          `Bearer ${token}`;
      }


      return fetch(
        `${BASE_URL}${path}`,
        {
          ...options,
          headers,
        }
      );
    };


  let response =
    await makeRequest(
      accessToken
    );


  /* access token 만료 */
  if (response.status === 401) {
    try {
      accessToken =
        await refreshAccessToken();


      response =
        await makeRequest(
          accessToken
        );

    } catch (error) {
      console.error(
        "토큰 갱신 실패:",
        error
      );

      clearTokens();

      throw new Error(
        "로그인이 만료되었습니다."
      );
    }
  }


  if (!response.ok) {
    let errorData = {};

    try {
      errorData =
        await response.json();
    } catch {
      // JSON 응답이 아니어도 무시
    }


    const error =
      new Error(
        errorData.detail ||
        `API 요청 실패: ${response.status}`
      );


    error.status =
      response.status;

    error.data =
      errorData;


    throw error;
  }


  if (
    response.status === 204
  ) {
    return null;
  }


  return response.json();
}


/* =========================
   내 정보
========================= */

export function getMyInfo() {
  return authenticatedRequest(
    "/api/users/me/",
    {
      method: "GET",
    }
  );
}


export function updateMyInfo(
  data
) {
  return authenticatedRequest(
    "/api/users/me/",
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          data
        ),
    }
  );
}


/* =========================
   내 수강 프로그램
========================= */

export function getMyPrograms() {
  return authenticatedRequest(
    "/api/users/my-programs/",
    {
      method: "GET",
    }
  );
}


export function createMyProgram(
  data
) {
  return authenticatedRequest(
    "/api/users/my-programs/",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          data
        ),
    }
  );
}


/* =========================
   시설 관련 조회
   인증 필요 없음
========================= */

export function getFacilitiesByRegion(
  region
) {
  return apiGet(
    `/api/facilities/?region=${encodeURIComponent(
      region
    )}`
  );
}


export function getSubFacilities(
  facilityId
) {
  return apiGet(
    `/api/facilities/subfacilities/?facility=${facilityId}`
  );
}


export function getProgramsByFacility(
  facilityId
) {
  return apiGet(
    `/api/facilities/programs/?facility=${facilityId}`
  );
}


export function getProgramsBySubFacility(
  facilityId,
  subfacilityId
) {
  return apiGet(
    `/api/facilities/programs/?facility=${facilityId}&subfacility=${subfacilityId}`
  );
}


/* =========================
   로그아웃
========================= */

export function logout() {
  clearTokens();
}