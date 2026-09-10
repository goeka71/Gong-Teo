import { apiGet } from "./client";

// 원데이 클래스 게시글 전체 조회
export async function getOnedayPosts() {
  return apiGet("/api/oneday/posts/");
}