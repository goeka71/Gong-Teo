// api/facilities.js
// 시설(facility) 관련 백엔드 API 호출 함수 모음.
// 컴포넌트에서 fetch 를 직접 쓰지 말고 이 파일의 함수를 import 해서 사용할 것.

import { apiGet, apiPatch } from "./client";

// 시설 목록 조회.
// GET /api/facilities/
export function getFacilityList() {
  return apiGet("/api/facilities/");
}

// 시설 상세 조회. (기본정보 + FacilityDetail + 세부시설 + 종목)
// GET /api/facilities/${id}/
export function getFacilityDetail(id) {
  return apiGet(`/api/facilities/${id}/`);
}

// 시설 정보(FacilityDetail) 일부 수정.
// PATCH /api/facilities/${id}/detail/
// 주의: 2026-09-04 기준 백엔드에 이 detail 수정 라우트가 아직 없다.
//       상세화면의 "정보 추가·수정" 폼과 연결될 예정.
export function updateFacilityDetail(id, data) {
  return apiPatch(`/api/facilities/${id}/detail/`, data);
}
