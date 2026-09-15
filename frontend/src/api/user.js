import {
  BASE_URL,
  apiGet,
  apiPost,
  saveTokens,
  clearTokens,
  refreshAccessToken,
} from "./client";

export { clearTokens, refreshAccessToken };


export async function signup(
  data
) {
  const response =
    await fetch(
      `${BASE_URL}/api/users/signup/`,
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

  const result =
    await response.json();

  if (!response.ok) {
    const error =
      new Error(
        "회원가입에 실패했습니다."
      );

    error.data =
      result;

    throw error;
  }

  return result;
}


export async function login(
  data
) {
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



async function authenticatedRequest(
  path,
  options = {}
) {
  let accessToken =
    localStorage.getItem(
      "accessToken"
    );

  const makeRequest = (
    token
  ) => {
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

  if (
    response.status === 401
  ) {
    accessToken =
      await refreshAccessToken();

    if (!accessToken) {
      throw new Error(
        "로그인이 만료되었습니다."
      );
    }

    response =
      await makeRequest(
        accessToken
      );
  }

  if (!response.ok) {
    let errorData = {};

    try {
      errorData =
        await response.json();
    } catch {
      // JSON 응답이 아니면 무시
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


export function getMyPrograms() {
  return authenticatedRequest(
    "/api/users/my-programs/",
    {
      method: "GET",
    }
  );
}


export function createMyProgram(
  formData
) {
  return authenticatedRequest(
    "/api/users/my-programs/",
    {
      method: "POST",
      body:
        formData,
    }
  );
}


/*
=========================================
내가 쓴 리뷰
=========================================
*/

export function getMyReviews() {
  return authenticatedRequest(
    "/api/users/my-reviews/",
    {
      method: "GET",
    }
  );
}


export function createReview(
  data
) {
  return authenticatedRequest(
    "/api/users/my-reviews/",
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


export function updateReview(
  reviewId,
  data
) {
  return authenticatedRequest(
    `/api/users/my-reviews/${reviewId}/`,
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


export function deleteReview(
  reviewId
) {
  return authenticatedRequest(
    `/api/users/my-reviews/${reviewId}/`,
    {
      method: "DELETE",
    }
  );
}


/*
=========================================
시설 관련 조회
=========================================
*/

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


export function logout() {
  clearTokens();
}