// api/facilities.js
// 시설(facility) 관련 백엔드 API 호출 함수 모음.
// 컴포넌트에서 fetch 를 직접 쓰지 말고 이 파일의 함수를 import 해서 사용할 것.

import { apiGet, apiPatch, apiPost } from "./client";

// 시설 목록 조회.
// GET /api/facilities/
//
// 주의: 이 엔드포인트는 검색/필터 쿼리 파라미터를 지원하지 않는다
// (백엔드 facility_list 뷰가 Facility.objects.all() 을 그대로 반환).
// 검색·필터는 아래 목록들을 같이 불러와 프론트에서 직접 처리한다.
export function getFacilityList() {
  return apiGet("/api/facilities/");
}

// 전체 종목 목록. 필터 칩의 "종목" 선택지로 쓴다.
// GET /api/facilities/sports/
export function getSportList() {
  return apiGet("/api/facilities/sports/");
}

// 시설-종목 매핑. 시설 목록 응답에는 종목이 들어있지 않아서, 종목으로
// 필터링하려면 이 매핑을 따로 불러와 facility.id 기준으로 합쳐야 한다.
// GET /api/facilities/facility-sports/
export function getFacilitySportList() {
  return apiGet("/api/facilities/facility-sports/");
}

// 시설 상세정보(FacilityDetail) 목록. 실내외/샤워실/주차장 여부처럼
// 시설 목록 응답에 없는 필터 조건이 여기 들어있다.
// GET /api/facilities/details/
export function getFacilityDetailList() {
  return apiGet("/api/facilities/details/");
}

// 시설 상세 조회. (기본정보 + FacilityDetail + 세부시설 + 종목)
// GET /api/facilities/${id}/
export function getFacilityDetail(id) {
  return apiGet(`/api/facilities/${id}/`);
}

// 시설 세부정보(FacilityDetail) 추가·수정 (upsert, 시설당 1개).
// PATCH /api/facilities/${id}/detail/
// data 예: { op_hour, in_out, phone, website, fee, shower, parking }
// 응답: 갱신된 detail 객체 (없던 경우 새로 생성 후 201)
export function updateFacilityDetail(id, data) {
  return apiPatch(`/api/facilities/${id}/detail/`, data);
}

// 세부시설(SubFacility) 기여 정보 목록. subfacilityId 기준으로 필터링해서 받는다.
// GET /api/facilities/subfacility-details/?subfacility=${subfacilityId}
export function getSubFacilityDetailList(subfacilityId) {
  return apiGet(`/api/facilities/subfacility-details/?subfacility=${subfacilityId}`);
}

// 세부시설 기여 정보 작성. 로그인 없이 작성 가능 - 작성자 필드 없음.
// POST /api/facilities/subfacility-details/
// data 예: { subfacility, category, contents }
export function createSubFacilityDetail(data) {
  return apiPost("/api/facilities/subfacility-details/", data);
}

// 세부시설 기여 정보 동의. 중복 방지 없이 agree_count 를 +1 한다.
// POST /api/facilities/subfacility-details/${id}/agree/
export function agreeSubFacilityDetail(id) {
  return apiPost(`/api/facilities/subfacility-details/${id}/agree/`);
}

// 세부시설 기여 정보 비동의. 중복 방지 없이 disagree_count 를 +1 한다.
// POST /api/facilities/subfacility-details/${id}/disagree/
export function disagreeSubFacilityDetail(id) {
  return apiPost(`/api/facilities/subfacility-details/${id}/disagree/`);
}
