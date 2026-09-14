import { useNavigate } from "react-router-dom";

// "/facility/:id/reviews" 화면. 지금은 자리만 잡아둔 placeholder.
//
// 다음 단계(4단계)에서 이 안에 아래 내용을 채울 예정:
// - getFacilityReviews(facilityId, options) 로 전체 리뷰 목록
//   (카테고리/세부시설/사진유무 필터)
// - 리뷰 작성 폼 (지금 FacilityDetail 의 "리뷰 작성"/"전체보기" 버튼이
//   여기로 이동시켜준다)
function FacilityReviewsPanel({ facilityId }) {
  const navigate = useNavigate();

  return (
    <div className="fd-detail">
      <button
        type="button"
        className="fd-back-btn"
        onClick={() => navigate(`/facility/${facilityId}`)}
      >
        ‹ 시설로 돌아가기
      </button>
      <p className="fd-status">리뷰 전체보기 화면은 준비 중입니다.</p>
    </div>
  );
}

export default FacilityReviewsPanel;
