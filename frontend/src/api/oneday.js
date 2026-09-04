// api/oneday.js
// 원데이(oneday) 관련 백엔드 API 호출 함수 모음.
//
// 담당: 지희
// 백엔드 라우트는 config/urls.py 기준 "/api/oneday/" 아래에 있다.
//   예) /api/oneday/posts/  , /api/oneday/applications/  , /api/oneday/my-programs/
// client.js 의 apiGet / apiPost 를 가져다 쓰면 된다. (facilities.js 참고)

// import { apiGet, apiPost } from "./client";

// 원데이 목록 조회. (자리만 만들어 둠 - 지희가 채울 예정)
// 예: return apiGet("/api/oneday/posts/");
export function getOnedayList() {
  throw new Error("getOnedayList: 아직 구현되지 않았습니다 (지희 담당)");
}

// 원데이 상세 조회. (자리만 만들어 둠 - 지희가 채울 예정)
export function getOnedayDetail(id) {
  throw new Error(`getOnedayDetail(${id}): 아직 구현되지 않았습니다 (지희 담당)`);
}
