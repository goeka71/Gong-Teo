// FacilityMapLayout / FacilityListPanel 이 같이 쓰는 검색·필터 쿼리 상태의 기본값.
// 컴포넌트 파일에 두면 react-refresh 가 깨져서 별도 파일로 분리했다.
export const DEFAULT_QUERY = {
  keyword: "", // 시설명·주소·인근역 통합 검색어
  region: "", // 주소에서 뽑은 "구" 단위 지역
  sport: "", // 종목명
  amenity: "", // "" | "shower" | "parking"
};
