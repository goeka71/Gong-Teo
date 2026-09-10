import {
  apiGet,
  apiPost,
  apiPatch,
} from "./client";


// =========================================================
// 회원가입
// =========================================================
export function signup(data) {
  return apiPost("/api/users/signup/", data);
}


// =========================================================
// 로그인
// =========================================================
export function login(data) {
  return apiPost("/api/users/login/", data);
}


// =========================================================
// 내 정보
// =========================================================
export function getMyInfo() {
  return apiGet("/api/users/me/");
}


// =========================================================
// 내 정보 수정
// =========================================================
export function updateMyInfo(data) {
  return apiPatch("/api/users/me/", data);
}


// =========================================================
// JWT Access Token 재발급
// =========================================================
export function refreshAccessToken(refresh) {
  return apiPost("/api/users/token/refresh/", {
    refresh,
  });
}


// =========================================================
// 나의 수강 프로그램 조회
// =========================================================
export function getMyPrograms() {
  return apiGet("/api/users/my-programs/");
}


// =========================================================
// 나의 수강 프로그램 등록
// 이미지 없는 JSON 등록용
// =========================================================
export function createMyProgram(data) {
  return apiPost("/api/users/my-programs/", data);
}


// =========================================================
// 수강 프로그램 등록 화면용 시설 조회
// =========================================================

// 지역에 해당하는 시설
export function getFacilitiesByRegion(region) {
  return apiGet(
    `/api/facilities/?region=${encodeURIComponent(region)}`
  );
}


// 선택한 시설의 세부시설
export function getSubFacilities(facilityId) {
  return apiGet(
    `/api/facilities/subfacilities/?facility=${facilityId}`
  );
}


// 선택한 시설의 프로그램
export function getProgramsByFacility(facilityId) {
  return apiGet(
    `/api/facilities/programs/?facility=${facilityId}`
  );
}


// 선택한 시설 + 세부시설의 프로그램
export function getProgramsBySubFacility(
  facilityId,
  subfacilityId
) {
  return apiGet(
    `/api/facilities/programs/?facility=${facilityId}&subfacility=${subfacilityId}`
  );
}