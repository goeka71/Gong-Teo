// api/user.js
// 회원(user) 관련 백엔드 API 호출 함수 모음.
//
// 담당: 윤서
// 백엔드 라우트는 config/urls.py 기준 "/api/users/" 아래에 있다.
//   예) /api/users/  , /api/users/coin-history/
// 로그인/마이페이지 관련 엔드포인트는 백엔드에 아직 없으니 추가되면 연결할 것.
// client.js 의 apiGet / apiPost 를 가져다 쓰면 된다. (facilities.js 참고)

// import { apiGet, apiPost } from "./client";

// 로그인. (자리만 만들어 둠 - 윤서가 채울 예정)
// credentials 예: { username, password }
// 예: return apiPost("/api/users/login/", credentials);
export function login(credentials) {
  void credentials; // 파라미터 형태만 표시용 (윤서가 실제 구현 시 사용)
  throw new Error("login: 아직 구현되지 않았습니다 (윤서 담당)");
}

// 마이페이지 정보 조회. (자리만 만들어 둠 - 윤서가 채울 예정)
export function getMyPage() {
  throw new Error("getMyPage: 아직 구현되지 않았습니다 (윤서 담당)");
}
