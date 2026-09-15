import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  getFacilityDetail,
  getFacilityReviewPreview,
  updateFacilityDetail,
} from "../api/facilities";
import HeartIcon from "./HeartIcon";
import "./FacilityDetail.css";

// 시설 상세 화면.
// props.facilityId: 보여줄 시설 id. 없으면 1번.
//
// "정보 추가·수정" 기능은 아직 API가 없어서 UI 자리만 잡아둔다.
// 리뷰는 getFacilityReviewPreview(평균 별점 + 개수 + 최근 3개)로 연결됨.
// 전체 리뷰 조회/작성 화면은 다음 단계(/facility/:id/reviews)에서 채운다.

// DB의 website 값에 스킴이 없거나("gssi.or.kr") 콜론이 빠진 채
// 저장된 경우가 있다("http//life.gangnam.go.kr"). 이걸 그대로 <a href>에
// 쓰면 절대경로가 아니라 상대경로로 해석돼 "/facility/gssi.or.kr" 같은
// 엉뚱한 주소로 이동해버리므로, 스킴이 없으면 https:// 를 붙여준다.
function withProtocol(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const stripped = url.replace(/^https?:?\/*/i, "");
  return `https://${stripped}`;
}

// 역/정류장에서의 도보 시간은 DB에 '초' 단위로 저장돼 있다.
// 60으로 나눈 몫이 1 이상이면 "도보 N분", 몫이 0이면 "도보 N초"로 표시한다.
function walkText(seconds) {
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `도보 ${minutes}분` : `도보 ${seconds}초`;
}

// 별점(0~5)을 ★/☆ 문자열로 표시하는 작은 헬퍼
function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <span className="fd-stars" aria-label={`별점 ${rating}점`}>
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

// 시설 정보 카드의 한 줄 (항목명 - 값). 값이 없으면 "—"
function InfoRow({ label, children }) {
  const empty =
    children === null ||
    children === undefined ||
    children === "" ||
    children === false;
  return (
    <div className="fd-info-row">
      <dt>{label}</dt>
      <dd>{empty ? "—" : children}</dd>
    </div>
  );
}

// 시설 정보(FacilityDetail) 추가·수정 폼.
// api/facilities.js 의 updateFacilityDetail(PATCH) 로 전송한다.
//   facilityId : 대상 시설 id
//   initial    : 현재 저장돼 있는 detail 값 (없으면 빈 객체)
//   onSaved    : 저장 성공 시 호출 (부모가 폼 닫기 + 정보 재조회)
//   onCancel   : 취소/닫기
function FacilityInfoForm({ facilityId, initial, onSaved, onCancel }) {
  // 폼이 열릴 때(이 컴포넌트가 새로 mount 될 때) 현재 값으로 입력칸을 채운다.
  const [form, setForm] = useState({
    op_hour: initial.op_hour ?? "",
    in_out: initial.in_out ?? "",
    phone: initial.phone ?? "",
    website: initial.website ?? "",
    fee: initial.fee ?? "",
    shower: Boolean(initial.shower),
    parking: Boolean(initial.parking),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 입력칸 하나가 바뀌면 form 에서 해당 키만 갱신.
  // 체크박스는 checked, 나머지는 value 를 쓴다.
  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault(); // 폼 기본 제출(페이지 새로고침) 막기
    setSaving(true);
    setError(null);
    try {
      await updateFacilityDetail(facilityId, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="fd-edit-form" onSubmit={handleSubmit}>
      <label className="fd-field">
        <span>운영시간</span>
        <input
          name="op_hour"
          type="text"
          value={form.op_hour}
          onChange={handleChange}
        />
      </label>
      <label className="fd-field">
        <span>실내/야외</span>
        <input
          name="in_out"
          type="text"
          value={form.in_out}
          onChange={handleChange}
        />
      </label>
      <label className="fd-field">
        <span>전화번호</span>
        <input
          name="phone"
          type="text"
          value={form.phone}
          onChange={handleChange}
        />
      </label>
      <label className="fd-field">
        <span>홈페이지 URL</span>
        <input
          name="website"
          type="text"
          value={form.website}
          onChange={handleChange}
        />
      </label>
      <label className="fd-field">
        <span>이용료(1회)</span>
        <input
          name="fee"
          type="text"
          value={form.fee}
          onChange={handleChange}
        />
      </label>
      <label className="fd-field fd-field--check">
        <input
          name="shower"
          type="checkbox"
          checked={form.shower}
          onChange={handleChange}
        />
        <span>샤워실 있음</span>
      </label>
      <label className="fd-field fd-field--check">
        <input
          name="parking"
          type="checkbox"
          checked={form.parking}
          onChange={handleChange}
        />
        <span>주차장 있음</span>
      </label>

      {error && <p className="fd-form-error">{error}</p>}

      <div className="fd-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          취소
        </button>
      </div>
    </form>
  );
}

function FacilityDetail({ facilityId = 1 }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null); // API 응답(JSON)
  const [loading, setLoading] = useState(true); // 불러오는 중인가
  const [error, setError] = useState(null); // 에러 메시지
  const [reloadKey, setReloadKey] = useState(0); // 저장 후 정보를 다시 불러오는 트리거
  const [editing, setEditing] = useState(false); // 수정 폼 열림 여부
  const [saveOk, setSaveOk] = useState(false); // "저장됐습니다" 표시 여부

  // 리뷰 미리보기(평균 별점 + 개수 + 최근 3개). 시설 기본정보와는 별개
  // API라 로딩 실패해도 나머지 상세정보 렌더링을 막지 않는다.
  const [reviewPreview, setReviewPreview] = useState(null);
  const [reviewPreviewLoading, setReviewPreviewLoading] = useState(true);

  // 찜 여부/토글은 부모(FacilityMapLayout)가 들고 있는 공용 상태를 그대로 쓴다.
  // 지도 쪽 "찜한 시설만 보기" 토글과 같은 값을 봐야 하기 때문(찜 API 는 아직 없음).
  const { wishedIds, toggleWish } = useOutletContext();
  const wished = wishedIds.has(facilityId);

  // facilityId 가 바뀔 때마다 API를 다시 호출한다.
  // ignore 플래그: 응답이 늦게 왔을 때 이미 사라졌거나 바뀐 화면에
  //   setState 하지 않도록 막는 정리(cleanup) 패턴.
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const json = await getFacilityDetail(facilityId);
        if (!ignore) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [facilityId, reloadKey]);

  // 리뷰 미리보기도 facilityId 가 바뀔 때마다 따로 불러온다.
  useEffect(() => {
    let ignore = false;

    async function loadReviewPreview() {
      try {
        setReviewPreviewLoading(true);
        const json = await getFacilityReviewPreview(facilityId);
        if (!ignore) {
          setReviewPreview(json);
        }
      } catch (err) {
        console.error("리뷰 미리보기 조회 실패:", err);
        if (!ignore) {
          setReviewPreview(null);
        }
      } finally {
        if (!ignore) setReviewPreviewLoading(false);
      }
    }

    loadReviewPreview();
    return () => {
      ignore = true;
    };
  }, [facilityId]);

  if (loading) return <p className="fd-status">불러오는 중…</p>;
  if (error) return <p className="fd-status">에러: {error}</p>;
  if (!data) return null;

  // details 는 배열이라 첫 번째 항목을 사용한다. 없으면 빈 객체.
  const detail = data.details?.[0] ?? {};
  const subs = data.sub_facilities ?? [];

  return (
    // 상세 정보 패널. 지도는 이제 FacilityMapLayout 이 담당하므로
    // 여기서는 패널 내용만 렌더링한다(래핑하는 페이지/지도 영역 없음).
    // "/" 는 목록이 아니라 검색/필터 패널이라 "목록으로" 버튼은 두지 않는다.
    <div className="fd-detail">
      {/* 뒤로가기: "메인"(GNB) 클릭과 같은 화면(목록/검색 패널, "/")으로 이동 */}
      <button
        type="button"
        className="fd-back-btn"
        onClick={() => navigate("/")}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span>메인으로</span>
      </button>

      {/* ---------- 상단: 이미지 + 기본정보 ---------- */}
      <div className="fd-top">
        {/* 1. 시설 이미지 (없으면 회색 placeholder) */}
        {data.image ? (
          <div className="fd-hero">
            <img src={data.image} alt={data.facility_name} />
          </div>
        ) : (
          <div className="fd-hero fd-hero--empty">이미지 준비 중</div>
        )}

        <div className="fd-basic">
          <div className="fd-name-row">
            <h1 className="fd-name">{data.facility_name}</h1>

            {/* 찜 기능은 아직 없어서(백엔드 연동 전) 화면에서만 토글되는 버튼. */}
            <button
              type="button"
              className={"fd-wish-btn" + (wished ? " fd-wish-btn--active" : "")}
              onClick={() => toggleWish(facilityId)}
              aria-pressed={wished}
            >
              <HeartIcon filled={wished} size={16} />
              <span>{wished ? "찜한 시설" : "시설 찜하기"}</span>
            </button>
          </div>

          {data.addr && <p className="fd-addr">{data.addr}</p>}

          <ul className="fd-access">
            {data.station && (
              <li>
                <span className="fd-access-icon" aria-hidden="true">
                  🚇
                </span>
                <span>
                  {data.station}
                  {data.station_wt != null && ` · ${walkText(data.station_wt)}`}
                </span>
              </li>
            )}
            {data.bus && (
              <li>
                <span className="fd-access-icon" aria-hidden="true">
                  🚌
                </span>
                <span>
                  {data.bus}
                  {data.bus_wt != null && ` · ${walkText(data.bus_wt)}`}
                </span>
              </li>
            )}
          </ul>

          {/* 2. 세부시설 바로가기 — 세부시설이 없으면 섹션 전체를 렌더하지 않음 */}
          {subs.length > 0 && (
            <div className="fd-section">
              <p className="fd-section-label">세부시설 바로가기</p>
              <div className="fd-shortcuts">
                {subs.map((s) => (
                  <button
                    type="button"
                    className="fd-shortcut-btn"
                    key={s.id}
                    onClick={() =>
                      navigate(`/facility/${facilityId}/subfacility/${s.id}`)
                    }
                  >
                    {s.subfacility_name}
                    <span className="fd-chevron" aria-hidden="true">
                      ›
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- 하단: 시설 정보 + 리뷰 (PC에서 2열) ---------- */}
      <div className="fd-bottom">
        {/* 3. 시설 정보 카드 */}
        <section>
          <div className="fd-block-head">
            <h2 className="fd-block-title">시설 정보</h2>
            <button
              type="button"
              className="fd-text-btn"
              onClick={() => {
                setSaveOk(false);
                setEditing((v) => !v);
              }}
            >
              {editing ? "닫기" : "✎ 정보 추가·수정"}
            </button>
          </div>

          {saveOk && <p className="fd-form-ok">저장됐습니다</p>}

          {editing && (
            <FacilityInfoForm
              facilityId={facilityId}
              initial={detail}
              onCancel={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                setSaveOk(true);
                setReloadKey((k) => k + 1); // 기존 GET 을 다시 호출 → 카드 갱신
              }}
            />
          )}

          <dl className="fd-info-card">
            <InfoRow label="운영시간">{detail.op_hour}</InfoRow>
            <InfoRow label="실내/야외">{detail.in_out}</InfoRow>
            <InfoRow label="전화번호">{detail.phone}</InfoRow>
            <InfoRow label="홈페이지">
              {detail.website && (
                <a
                  href={withProtocol(detail.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {detail.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </InfoRow>
            <InfoRow label="이용료(1회)">{detail.fee}</InfoRow>
            <InfoRow label="샤워실">
              {detail.shower ? "있음" : "없음"}
            </InfoRow>
            <InfoRow label="주차장">
              {detail.parking ? "있음" : "없음"}
            </InfoRow>
          </dl>
        </section>

        {/* 4. 리뷰 영역 */}
        <section>
          <div className="fd-block-head">
            <h2 className="fd-block-title">
              리뷰{" "}
              {reviewPreview && reviewPreview.review_count > 0 && (
                <span className="fd-rating">
                  <Stars rating={reviewPreview.average_rating} />{" "}
                  {reviewPreview.average_rating} ({reviewPreview.review_count})
                </span>
              )}
            </h2>
            <button
              type="button"
              className="fd-text-btn fd-review-write-btn"
              onClick={() => navigate(`/facility/${facilityId}/reviews`)}
            >
              리뷰 작성
            </button>
          </div>

          {reviewPreviewLoading ? (
            <p className="fd-review-empty">리뷰를 불러오는 중…</p>
          ) : !reviewPreview || reviewPreview.review_count === 0 ? (
            <p className="fd-review-empty">아직 등록된 리뷰가 없어요.</p>
          ) : (
            <div className="fd-review-list">
              {reviewPreview.reviews.map((r) => (
                <div className="fd-review-card" key={r.id}>
                  <div className="fd-review-top">
                    <span className="fd-review-name">{r.user_name}</span>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="fd-review-body">{r.content}</p>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="fd-review-more"
            onClick={() => navigate(`/facility/${facilityId}/reviews`)}
          >
            리뷰 {reviewPreview?.review_count ?? 0}개 전체보기 ›
          </button>
        </section>
      </div>
    </div>
  );
}

export default FacilityDetail;
