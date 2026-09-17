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
// 세부시설 상세(SubFacilityDetailPanel)의 "리뷰" 섹션도 이 컴포넌트를 그대로
// 재사용한다. subfacilityId prop 이 있으면(=세부시설 상세에서 쓰는 경우):
//   - 목록이 그 세부시설로만 자동 필터링되고(사용자가 필터를 만질 필요 없음)
//   - 작성 폼은 세부시설이 고정돼서 카테고리(시설/프로그램)·세부시설 선택
//     UI 자체가 뜨지 않고
//   - 페이지 전용 크롬(뒤로가기 버튼, 큰 제목, 별점 요약)은 생략하고 대신
//     SubFacilityDetailPanel 의 다른 섹션("이용자 정보")과 톤을 맞춘 가벼운
//     섹션 헤더로 렌더링된다(호스트가 이미 .fd-detail 래퍼와 뒤로가기
//     버튼을 갖고 있으므로).
// subfacilityId 가 없으면(기존 "/facility/:id/reviews" 경로) 예전 그대로
// 동작한다 — 아래 로직은 전부 그 기본 경로를 안 건드리도록 짜여 있다.

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
  if (!review.program) return "시설 리뷰";
  const prefix = review.is_oneday ? "(원데이) " : "";
  return `프로그램 · ${prefix}${review.program_name}`;
}

// "2026-09-16T10:30:00" -> "2026-09-16 10:30" (작성일시 표시용).
function formatDateTime(isoString) {
  if (!isoString) return "";
  return isoString.replace("T", " ").slice(0, 16);
}

const CATEGORY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "facility", label: "시설 리뷰" },
  { value: "program", label: "프로그램 리뷰" },
];

function FacilityReviewsPanel({ facilityId, subfacilityId = null }) {
  const navigate = useNavigate();
  const isScoped = subfacilityId != null;

  // 시설 이름 + 세부시설 목록(작성 폼용). getFacilityDetail 응답에
  // sub_facilities 가 이미 포함돼 있어서 따로 조회하지 않는다.
  // 세부시설 고정 모드(isScoped)에서는 제목/프로그램 선택 UI 자체를 안 쓰므로
  // 조회하지 않는다 — 호스트(SubFacilityDetailPanel)가 이미 같은 정보를
  // 따로 갖고 있어 중복 요청이 된다.
  const [facility, setFacility] = useState(null);
  const [programs, setPrograms] = useState([]);

  // 평균 별점 + 전체 개수. 시설 전체 기준 엔드포인트라 세부시설 단위로는
  // 못 쪼개서, 세부시설 고정 모드에서는 조회하지 않는다.
  const [preview, setPreview] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  // 상단 사진 미리보기 캐로셀 + "더보기" 앨범용. 카테고리 필터와 무관하게
  // 항상 이 시설(또는 세부시설)의 사진 있는 리뷰 전체를 따로 들고 있는다.
  const [photoReviews, setPhotoReviews] = useState([]);
  const [photoReviewsLoading, setPhotoReviewsLoading] = useState(true);

  const [category, setCategory] = useState(""); // "" | "facility" | "program"
  // "더보기" 를 누르면 캐로셀+피드 대신 사진 앨범(그리드) 화면으로 전환된다.
  const [showPhotoGrid, setShowPhotoGrid] = useState(false);

  const [writeOpen, setWriteOpen] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // 작성 성공 후 목록/통계 재조회 트리거

  // 시설 기본정보(이름, 세부시설 목록) + 프로그램 목록(작성 폼 선택지)
  useEffect(() => {
    if (isScoped) return;

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
  }, [facilityId, isScoped]);

  // 평균 별점 + 전체 개수
  useEffect(() => {
    if (isScoped) return;

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
  }, [facilityId, reloadKey, isScoped]);

  // 리뷰 피드 (카테고리/세부시설 필터 반영)
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setReviewsLoading(true);
        const data = await getFacilityReviews(facilityId, {
          category: category || undefined,
          subfacility: subfacilityId || undefined,
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
  }, [facilityId, subfacilityId, category, reloadKey]);

  // 사진 미리보기 캐로셀 + 앨범용. 카테고리 필터와 무관하게 항상 전체를 본다.
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setPhotoReviewsLoading(true);
        const data = await getFacilityReviews(facilityId, {
          hasPhoto: true,
          subfacility: subfacilityId || undefined,
        });
        if (!ignore) setPhotoReviews(data);
      } catch (err) {
        console.error("사진 리뷰 조회 실패:", err);
        if (!ignore) setPhotoReviews([]);
      } finally {
        if (!ignore) setPhotoReviewsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [facilityId, subfacilityId, reloadKey]);

  const subFacilities = facility?.sub_facilities ?? [];

  function handleWriteClick() {
    if (!isLoggedIn()) {
      setLoginRequired(true);
      return;
    }
    setLoginRequired(false);
    setWriteOpen(true);
  }

  const header = isScoped ? (
    // 세부시설 상세 안에 끼워 넣는 섹션이므로, 위의 "이용자 정보" 섹션과
    // 같은 톤(.fd-block-head/.fd-block-title/.fd-text-btn)으로 맞춘다.
    <div className="fd-block-head">
      <h2 className="fd-block-title">리뷰</h2>
      <button
        type="button"
        className="fd-text-btn frp-write-btn--text"
        onClick={handleWriteClick}
      >
        + 리뷰 작성
      </button>
    </div>
  ) : (
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
  );

  const body = (
    <>
      {header}

      {loginRequired && (
        <p className="frp-login-hint">
          리뷰를 작성하려면 로그인이 필요합니다.{" "}
          <button type="button" onClick={() => navigate("/login")}>
            로그인하러 가기
          </button>
        </p>
      )}

      {showPhotoGrid ? (
        // "더보기" 로 들어온 사진 앨범 화면. 카테고리 필터와 무관하게
        // photoReviews(이 시설/세부시설의 사진 있는 리뷰 전체)를 그대로 보여준다.
        <>
          <button
            type="button"
            className="frp-photo-grid-back"
            onClick={() => setShowPhotoGrid(false)}
          >
            ‹ 목록으로
          </button>

          {photoReviewsLoading ? (
            <p className="frp-status">불러오는 중…</p>
          ) : photoReviews.length === 0 ? (
            <p className="frp-status">사진이 첨부된 리뷰가 아직 없어요.</p>
          ) : (
            <div className="frp-photo-grid">
              {photoReviews.map((r) => (
                <div className="frp-photo-cell" key={r.id}>
                  <img src={resolveReviewImageUrl(r.image)} alt={r.content} />
                  <div className="frp-photo-caption">
                    <span>{r.user_name}</span>
                    <Stars rating={r.rating} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* 사진 있는 리뷰 미리보기 — 가로 스크롤 앨범. 5개 넘으면 끝에
              "더보기" 를 붙여서 누르면 위 사진 앨범(그리드) 화면으로 전환. */}
          {!photoReviewsLoading && photoReviews.length > 0 && (
            <div className="frp-photo-strip">
              {photoReviews.slice(0, 5).map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className="frp-photo-strip-item"
                  onClick={() => setShowPhotoGrid(true)}
                >
                  <img src={resolveReviewImageUrl(r.image)} alt={r.content} />
                </button>
              ))}

              {photoReviews.length > 5 && (
                <button
                  type="button"
                  className="frp-photo-strip-more"
                  onClick={() => setShowPhotoGrid(true)}
                >
                  <span className="frp-photo-strip-more-count">
                    +{photoReviews.length - 5}
                  </span>
                  더보기
                </button>
              )}
            </div>
          )}

          {/* 카테고리 필터 — 아래 리뷰 피드에만 적용된다(위 사진 미리보기는
              항상 전체 기준). 마이페이지 "내가 쓴 리뷰"의 필터 버튼과 같은
              모양(.frp-sort-btn)으로 맞췄다. */}
          <div className="frp-filters">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={
                  "frp-sort-btn" +
                  (category === opt.value ? " frp-sort-btn--active" : "")
                }
                onClick={() => setCategory(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 리뷰 피드 — 카드(테두리/그림자) 대신 옅은 구분선으로만 나눈다. */}
          {reviewsLoading ? (
            <p className="frp-status">불러오는 중…</p>
          ) : reviewsError ? (
            <p className="frp-status">에러: {reviewsError}</p>
          ) : reviews.length === 0 ? (
            <p className="frp-status">해당하는 리뷰가 없어요.</p>
          ) : (
            <div className="frp-feed">
              {reviews.map((r) => (
                <div className="frp-feed-item" key={r.id}>
                  <div className="frp-review-top">
                    <span className="frp-review-name">{r.user_name}</span>
                    <Stars rating={r.rating} />
                  </div>
                  <div className="frp-review-meta">
                    <span>{reviewCategoryLabel(r)}</span>
                    {!isScoped && r.subfacility_name && (
                      <span> · {r.subfacility_name}</span>
                    )}
                    {r.created_at && <span> · {formatDateTime(r.created_at)}</span>}
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
        </>
      )}

      {writeOpen && (
        <ReviewWriteModal
          facilityId={facilityId}
          programs={programs}
          subFacilities={subFacilities}
          fixedSubfacilityId={subfacilityId}
          onClose={() => setWriteOpen(false)}
          onSaved={() => {
            setWriteOpen(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </>
  );

  if (isScoped) {
    return body;
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

      {body}
    </div>
  );
}

// 리뷰 작성 모달.
//   facilityId        : 고정 대상 시설 (route 의 :id)
//   programs           : 이 시설의 Program 목록 (카테고리=프로그램일 때 선택지)
//   subFacilities       : 이 시설의 세부시설 목록 (있으면 선택, "시설 전체"도 가능)
//   fixedSubfacilityId : 세부시설 상세에서 열렸을 때만 전달됨. 있으면 세부시설이
//                        이미 정해진 채로 시작하고, 카테고리(시설/프로그램)·
//                        세부시설 선택 UI 자체를 숨긴다.
function ReviewWriteModal({
  facilityId,
  programs,
  subFacilities,
  fixedSubfacilityId = null,
  onClose,
  onSaved,
}) {
  const [category, setCategory] = useState("facility"); // "facility" | "program"
  const [programId, setProgramId] = useState("");
  const [subfacilityId, setSubfacilityId] = useState(fixedSubfacilityId ?? "");
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
    if (!fixedSubfacilityId && category === "program" && !programId) {
      setError("리뷰를 작성할 프로그램을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("facility", facilityId);
    if (subfacilityId) formData.append("subfacility", subfacilityId);
    if (!fixedSubfacilityId && category === "program" && programId) {
      formData.append("program", programId);
    }
    formData.append("rating", rating);
    formData.append("content", content.trim());
    if (imageFile) formData.append("image", imageFile);

    try {
      setSubmitting(true);
      setError("");
      await createReview(formData);

      // 리뷰 작성으로 변경된 코인을 Navbar에 즉시 반영
      window.dispatchEvent(new Event("auth-change"));

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
          {fixedSubfacilityId ? (
            <p className="frp-form-hint">이 세부시설에 대한 리뷰로 등록됩니다.</p>
          ) : (
            <>
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
            </>
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
