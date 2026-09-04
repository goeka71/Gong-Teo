// api/facilities.js
// 시설(facility) 관련 백엔드 API 호출 함수 모음.
// 컴포넌트에서 fetch 를 직접 쓰지 말고 이 파일의 함수를 import 해서 사용할 것.

import { apiGet } from "./client";

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
