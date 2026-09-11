import { apiGet, apiPost } from "./client";

// 원데이 클래스 게시글 전체 조회
export async function getOnedayPosts() {
  return apiGet("/api/oneday/posts/");
}

// 원데이 클래스 게시글(결석일 양도 글) 등록
export async function createOnedayPost(data) {
  return apiPost("/api/oneday/posts/", data);
}

// 원데이 신청하기 (신청과 동시에 게시글이 마감 처리된다)
export async function applyOnedayPost(postId) {
  return apiPost("/api/oneday/applications/", { post: postId });
}