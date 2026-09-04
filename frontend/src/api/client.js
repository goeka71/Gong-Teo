// api/client.js
// 백엔드(Django) API 호출의 공통 로직을 모아둔 파일.
// 다른 api/*.js 파일들은 여기 있는 apiGet / apiPost / apiPut 을 가져다 쓴다.

// Django 개발 서버 주소. 배포 시에는 이 값만 바꾸면 된다.
export const BASE_URL = "http://127.0.0.1:8000";

// 모든 요청이 거쳐가는 내부 공통 함수.
// path 예: "/api/facilities/"  (BASE_URL 뒤에 그대로 붙는다)
// options: fetch 의 두 번째 인자 (method, headers, body 등)
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);

  // response.ok 가 false (400~500번대 응답) 이면 에러를 던진다.
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText} (${path})`);
  }

  // 성공하면 JSON 으로 변환해서 반환.
  return response.json();
}

// GET 요청 공통 함수.
export function apiGet(path) {
  return request(path, { method: "GET" });
}

// POST 요청 공통 함수. (아직 실제로 쓰는 곳은 없지만 구조만 미리 잡아둠)
// data: 서버로 보낼 객체. JSON 문자열로 변환해서 보낸다.
export function apiPost(path, data) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// PUT 요청 공통 함수. (POST 와 동일한 패턴, 수정용)
export function apiPut(path, data) {
  return request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
