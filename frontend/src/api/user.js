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


/*
=========================================
비밀번호 재설정
=========================================
*/

async function postJsonWithErrors(
  path,
  data
) {
  const response =
    await fetch(
      `${BASE_URL}${path}`,
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
        "요청에 실패했습니다."
      );

    error.data =
      result;

    throw error;
  }

  return result;
}


export function sendPasswordResetCode(
  email
) {
  return postJsonWithErrors(
    "/api/users/password/send-code/",
    { email }
  );
}


export function resetPassword({
  email,
  code,
  newPassword,
}) {
  return postJsonWithErrors(
    "/api/users/password/reset/",
    {
      email,
      code,
      new_password: newPassword,
    }
  );
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


export function withdrawMyAccount() {
  return authenticatedRequest(
    "/api/users/me/",
    {
      method: "DELETE",
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
코인 내역
=========================================
*/

export function getCoinHistory() {
  return authenticatedRequest(
    "/api/users/coin-history/",
    {
      method: "GET",
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


// data 는 FormData. 사진(File)을 포함해 multipart/form-data 로 보낸다
// (Content-Type 헤더는 지정하지 않아야 브라우저가 boundary 를 자동으로 채운다).
export function createReview(
  formData
) {
  return authenticatedRequest(
    "/api/users/my-reviews/",
    {
      method: "POST",
      body: formData,
    }
  );
}


export function updateReview(
  reviewId,
  formData
) {
  return authenticatedRequest(
    `/api/users/my-reviews/${reviewId}/`,
    {
      method: "PATCH",
      body: formData,
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


// 프로그램 API 페이지당 조회 개수.
// facilities/views.py 의 ProgramPagination.page_size 와 같은 값.
export const PROGRAM_PAGE_SIZE = 50;


// 프로그램명 검색어(q)는 있을 때만 붙인다.
// 서버에서는 program_name__icontains 로 검색한다.
function programSearchParam(q) {
  const query = (q || "").trim();

  return query
    ? `&q=${encodeURIComponent(query)}`
    : "";
}


// 특정 시설의 프로그램 조회
// page 값을 넘기면 2페이지, 3페이지도 조회할 수 있다.
//
// 반환 형태:
// {
//   count: 전체 결과 개수,
//   next: 다음 페이지 URL 또는 null,
//   previous: 이전 페이지 URL 또는 null,
//   results: 프로그램 배열
// }
export function getProgramsByFacility(
  facilityId,
  q = "",
  page = 1
) {
  return apiGet(
    `/api/facilities/programs/?facility=${facilityId}` +
    `&page=${page}` +
    programSearchParam(q)
  );
}


// 특정 시설 + 세부시설의 프로그램 조회
export function getProgramsBySubFacility(
  facilityId,
  subfacilityId,
  q = "",
  page = 1
) {
  return apiGet(
    `/api/facilities/programs/?facility=${facilityId}` +
    `&subfacility=${subfacilityId}` +
    `&page=${page}` +
    programSearchParam(q)
  );
}


// 페이지네이션 응답에서 실제 프로그램 배열만 꺼낼 때 사용.
// 혹시 이전 배열 형식 응답이 들어와도 깨지지 않도록 처리한다.
export function getProgramResults(
  data
) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results ?? [];
}





export function logout() {
  clearTokens();
}