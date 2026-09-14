import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFacilityDetail,
  getFacilityReviewPreview,
  getFacilityReviews,
} from "../api/facilities";
import { getProgramsByFacility, createReview } from "../api/user";
import { BASE_URL } from "../api/client";
import "./FacilityDetail.css";
import "./FacilityReviewsPanel.css";

// "/facility/:id/reviews" 화면 — 시설 단위 리뷰 전체보기.
//
// 세부시설 전용 필터링/카테고리 고정(세부시설 상세페이지에서 진입할 때
// 필요한 것)은 다음 단계 범위라 여기서는 하지 않는다. 이 화면은 항상
// 시설 전체 리뷰를 다루고, 카테고리/세부시설/사진유무는 사용자가 직접
// 고르는 필터일 뿐이다.

// Django MEDIA 상대경로("/media/...")를 절대주소로 바꿔준다.
// (FacilityListPanel.resolveImageUrl / MyPage.resolveReviewImageUrl 과 동일한 문제.)
function resolveReviewImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${BASE_URL}${image}`;
}

// Navbar 와 동일한 방식(accessToken + username)으로 로그인 여부만 가볍게 확인한다.
function isLoggedIn() {
  return Boolean(
    localStorage.getItem("accessToken") && localStorage.getItem("username")
  );
}

// DRF 검증 에러({field: [msg, ...]} 또는 {detail: msg}) 에서 사람이 읽을
// 메시지 하나를 뽑아낸다.
function extractErrorMessage(err) {
  const data = err?.data;
  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const value = data[firstKey];
      return Array.isArray(value) ? value[0] : String(value);
    }
  }
  return err?.message || "리뷰 저장에 실패했습니다.";
}

function Stars({ rating }) {
  const full = Math.round(rating || 0);
  return (
    <span className="frp-stars" aria-label={`별점 ${rating}점`}>
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function reviewCategoryLabel(review) {
  return review.program ? `프로그램 · ${review.program_name}` : "시설 리뷰";
}

const CATEGORY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "facility", label: "시설 리뷰" },
  { value: "program", label: "프로그램 리뷰" },
];

function FacilityReviewsPanel({ facilityId }) {
  const navigate = useNavigate();

  // 시설 이름 + 세부시설 목록(작성 폼용). getFacilityDetail 응답에
  // sub_facilities 가 이미 포함돼 있어서 따로 조회하지 않는다.
  const [facility, setFacility] = useState(null);
  const [programs, setPrograms] = useState([]);

  // 평균 별점 + 전체 개수. 목록 필터와 무관하게 항상 "전체" 기준이라
  // 목록용 조회와는 별도로 관리한다.
  const [preview, setPreview] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const [category, setCategory] = useState(""); // "" | "facility" | "program"
  const [hasPhotoOnly, setHasPhotoOnly] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" | "photos"

  const [writeOpen, setWriteOpen] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // 작성 성공 후 목록/통계 재조회 트리거

  // 사진 모아보기 탭에서는 사진유무 토글과 무관하게 항상 사진 있는 것만 본다.
  const effectiveHasPhoto = viewMode === "photos" ? true : hasPhotoOnly;

  // 시설 기본정보(이름, 세부시설 목록) + 프로그램 목록(작성 폼 선택지)
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [detail, programList] = await Promise.all([
          getFacilityDetail(facilityId),
          getProgramsByFacility(facilityId),
        ]);
        if (!ignore) {
          setFacility(detail);
          setPrograms(programList);
        }
      } catch (err) {
        console.error("시설 정보 조회 실패:", err);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [facilityId]);

  // 평균 별점 + 전체 개수
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await getFacilityReviewPreview(facilityId);
        if (!ignore) setPreview(data);
      } catch (err) {
        console.error("리뷰 통계 조회 실패:", err);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [facilityId, reloadKey]);

  // 실제 리뷰 목록 (카테고리/사진유무 필터 반영)
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setReviewsLoading(true);
        const data = await getFacilityReviews(facilityId, {
          category: category || undefined,
          hasPhoto: effectiveHasPhoto,
        });
        if (!ignore) {
          setReviews(data);
          setReviewsError(null);
        }
      } catch (err) {
        if (!ignore) setReviewsError(err.message);
      } finally {
        if (!ignore) setReviewsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [facilityId, category, effectiveHasPhoto, reloadKey]);

  const subFacilities = facility?.sub_facilities ?? [];

  function handleWriteClick() {
    if (!isLoggedIn()) {
      setLoginRequired(true);
      return;
    }
    setLoginRequired(false);
    setWriteOpen(true);
  }

  return (
    <div className="fd-detail">
      <button
        type="button"
        className="fd-back-btn"
        onClick={() => navigate(`/facility/${facilityId}`)}
      >
        ‹ 시설로 돌아가기
      </button>

      <div className="frp-header">
        <div>
          <h1 className="frp-title">
            {facility?.facility_name ?? "시설"} 리뷰
          </h1>
          {preview && preview.review_count > 0 && (
            <p className="frp-summary">
              <Stars rating={preview.average_rating} /> {preview.average_rating}{" "}
              ({preview.review_count})
            </p>
          )}
        </div>

        <button type="button" className="frp-write-btn" onClick={handleWriteClick}>
          리뷰 작성
        </button>
      </div>

      {loginRequired && (
        <p className="frp-login-hint">
          리뷰를 작성하려면 로그인이 필요합니다.{" "}
          <button type="button" onClick={() => navigate("/login")}>
            로그인하러 가기
          </button>
        </p>
      )}

      {/* 목록형 ↔ 사진 그리드형. 카테고리 필터는 두 탭이 공유하고,
          "사진 있는 리뷰만" 토글은 목록 탭에서만 노출한다
          (사진 탭은 항상 사진 있는 것만 보는 탭이라 토글이 무의미). */}
      <div className="frp-tabs">
        <button
          type="button"
          className={"frp-tab" + (viewMode === "list" ? " frp-tab--active" : "")}
          onClick={() => setViewMode("list")}
        >
          목록
        </button>
        <button
          type="button"
          className={"frp-tab" + (viewMode === "photos" ? " frp-tab--active" : "")}
          onClick={() => setViewMode("photos")}
        >
          사진 모아보기
        </button>
      </div>

      <div className="frp-filters">
        <div className="frp-filter-group">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={
                "frp-filter-chip" +
                (category === opt.value ? " frp-filter-chip--active" : "")
              }
              onClick={() => setCategory(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {viewMode === "list" && (
          <label className="frp-photo-toggle">
            <input
              type="checkbox"
              checked={hasPhotoOnly}
              onChange={(e) => setHasPhotoOnly(e.target.checked)}
            />
            사진 있는 리뷰만
          </label>
        )}
      </div>

      {reviewsLoading ? (
        <p className="frp-status">불러오는 중…</p>
      ) : reviewsError ? (
        <p className="frp-status">에러: {reviewsError}</p>
      ) : reviews.length === 0 ? (
        <p className="frp-status">
          {viewMode === "photos"
            ? "사진이 첨부된 리뷰가 아직 없어요."
            : "해당하는 리뷰가 없어요."}
        </p>
      ) : viewMode === "photos" ? (
        <div className="frp-photo-grid">
          {reviews.map((r) => (
            <div className="frp-photo-cell" key={r.id}>
              <img src={resolveReviewImageUrl(r.image)} alt={r.content} />
              <div className="frp-photo-caption">
                <span>{r.user_name}</span>
                <Stars rating={r.rating} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="frp-list">
          {reviews.map((r) => (
            <div className="frp-review-card" key={r.id}>
              <div className="frp-review-top">
                <span className="frp-review-name">{r.user_name}</span>
                <Stars rating={r.rating} />
              </div>
              <div className="frp-review-meta">
                <span>{reviewCategoryLabel(r)}</span>
                {r.subfacility_name && <span> · {r.subfacility_name}</span>}
                {r.created_at && <span> · {r.created_at.slice(0, 10)}</span>}
              </div>
              <p className="frp-review-body">{r.content}</p>
              {r.image && (
                <img
                  className="frp-review-image"
                  src={resolveReviewImageUrl(r.image)}
                  alt="리뷰 사진"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {writeOpen && (
        <ReviewWriteModal
          facilityId={facilityId}
          programs={programs}
          subFacilities={subFacilities}
          onClose={() => setWriteOpen(false)}
          onSaved={() => {
            setWriteOpen(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

// 리뷰 작성 모달.
//   facilityId   : 고정 대상 시설 (route 의 :id)
//   programs     : 이 시설의 Program 목록 (카테고리=프로그램일 때 선택지)
//   subFacilities: 이 시설의 세부시설 목록 (있으면 선택, "시설 전체"도 가능)
function ReviewWriteModal({ facilityId, programs, subFacilities, onClose, onSaved }) {
  const [category, setCategory] = useState("facility"); // "facility" | "program"
  const [programId, setProgramId] = useState("");
  const [subfacilityId, setSubfacilityId] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("JPG 또는 PNG 이미지만 첨부할 수 있습니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("이미지는 10MB 이하만 첨부할 수 있습니다.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (rating === 0) {
      setError("별점을 선택해주세요.");
      return;
    }
    if (!content.trim()) {
      setError("리뷰 내용을 입력해주세요.");
      return;
    }
    if (category === "program" && !programId) {
      setError("리뷰를 작성할 프로그램을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("facility", facilityId);
    if (subfacilityId) formData.append("subfacility", subfacilityId);
    if (category === "program" && programId) formData.append("program", programId);
    formData.append("rating", rating);
    formData.append("content", content.trim());
    if (imageFile) formData.append("image", imageFile);

    try {
      setSubmitting(true);
      setError("");
      await createReview(formData);
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="frp-modal-backdrop" onClick={onClose}>
      <div className="frp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="frp-modal-head">
          <h2>리뷰 쓰기</h2>
          <button type="button" className="frp-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="frp-form" onSubmit={handleSubmit}>
          <div className="frp-form-group">
            <span className="frp-form-label">카테고리</span>
            <div className="frp-radio-row">
              <label>
                <input
                  type="radio"
                  name="review-category"
                  checked={category === "facility"}
                  onChange={() => setCategory("facility")}
                />
                시설 리뷰
              </label>
              <label>
                <input
                  type="radio"
                  name="review-category"
                  checked={category === "program"}
                  onChange={() => setCategory("program")}
                />
                프로그램 리뷰
              </label>
            </div>
          </div>

          {category === "program" && (
            <div className="frp-form-group">
              <span className="frp-form-label">프로그램</span>
              {programs.length === 0 ? (
                <p className="frp-form-hint">등록된 프로그램이 없습니다.</p>
              ) : (
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                >
                  <option value="">프로그램을 선택해주세요</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.program_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {subFacilities.length > 0 && (
            <div className="frp-form-group">
              <span className="frp-form-label">세부시설</span>
              <select
                value={subfacilityId}
                onChange={(e) => setSubfacilityId(e.target.value)}
              >
                <option value="">시설 전체</option>
                {subFacilities.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subfacility_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="frp-form-group">
            <span className="frp-form-label">별점</span>
            <div className="frp-rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="frp-star-btn"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  {star <= (hoverRating || rating) ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>

          <div className="frp-form-group">
            <span className="frp-form-label">내용</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>

          <div className="frp-form-group">
            <span className="frp-form-label">사진</span>
            {imagePreview ? (
              <div className="frp-image-preview">
                <img src={imagePreview} alt="첨부 사진 미리보기" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="frp-image-input-label">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleImageChange}
                />
                + 사진 추가
              </label>
            )}
          </div>

          {error && <p className="frp-form-error">{error}</p>}

          <div className="frp-form-actions">
            <button type="button" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "등록 중…" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FacilityReviewsPanel;
