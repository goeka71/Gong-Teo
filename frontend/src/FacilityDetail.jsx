import { useEffect, useState } from "react";
import { API_BASE } from "./api";
import "./FacilityDetail.css";

// 시설 상세 화면.
// props.facilityId: 보여줄 시설 id. 없으면 1번.
//
// 리뷰 데이터와 "정보 추가·수정" 기능은 아직 API가 없어서 UI 자리만 잡아둔다.
// (아래 MOCK_REVIEWS / MOCK_RATING 은 임시 목업. 실제 연결 시 교체 예정)

// TODO: 리뷰 API 연결되면 이 목업을 실제 응답으로 교체
const MOCK_RATING = { avg: 4.6, count: 32 };
const MOCK_REVIEWS = [
  { id: 1, name: "지호", rating: 5, content: "시설이 깨끗하고 주차가 편해요." },
  { id: 2, name: "민아", rating: 4, content: "샤워실이 조금 좁지만 이용하기 좋아요." },
];

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

function FacilityDetail({ facilityId = 1 }) {
  const [data, setData] = useState(null); // API 응답(JSON)
  const [loading, setLoading] = useState(true); // 불러오는 중인가
  const [error, setError] = useState(null); // 에러 메시지

  // facilityId 가 바뀔 때마다 API를 다시 호출한다.
  // ignore 플래그: 응답이 늦게 왔을 때 이미 사라졌거나 바뀐 화면에
  //   setState 하지 않도록 막는 정리(cleanup) 패턴.
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/facilities/${facilityId}/`);
        if (!res.ok) {
          throw new Error(`요청 실패 (HTTP ${res.status})`);
        }
        const json = await res.json();
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
  }, [facilityId]);

  if (loading) return <p className="fd-status">불러오는 중…</p>;
  if (error) return <p className="fd-status">에러: {error}</p>;
  if (!data) return null;

  // details 는 배열이라 첫 번째 항목을 사용한다. 없으면 빈 객체.
  const detail = data.details?.[0] ?? {};
  const subs = data.sub_facilities ?? [];

  return (
    <div className="fd-page">
      {/* ---------- 상단: 이미지 + 기본정보 (PC에서 2열) ---------- */}
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
          <h1 className="fd-name">{data.facility_name}</h1>

          <ul className="fd-access">
            {data.station && (
              <li>
                <span className="fd-access-icon" aria-hidden="true">
                  🚇
                </span>
                <span>
                  {data.station}
                  {data.station_wt != null && ` · 도보 ${data.station_wt}분`}
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
                  {data.bus_wt != null && ` · 도보 ${data.bus_wt}분`}
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
                    // TODO: 세부시설 상세로 이동 (라우터 도입 후 연결)
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
              // TODO: 정보 추가·수정 기능 (아직 구현 안 함, 자리만)
            >
              ✎ 정보 추가·수정
            </button>
          </div>

          <dl className="fd-info-card">
            <InfoRow label="운영시간">{detail.op_hour}</InfoRow>
            <InfoRow label="실내/야외">{detail.in_out}</InfoRow>
            <InfoRow label="전화번호">{detail.phone}</InfoRow>
            <InfoRow label="홈페이지">
              {detail.website && (
                <a href={detail.website} target="_blank" rel="noreferrer">
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

        {/* 4. 리뷰 영역 — UI 자리만 (실제 데이터/작성 기능 없음) */}
        <section>
          <div className="fd-block-head">
            <h2 className="fd-block-title">
              리뷰{" "}
              <span className="fd-rating">
                <Stars rating={MOCK_RATING.avg} /> {MOCK_RATING.avg} (
                {MOCK_RATING.count})
              </span>
            </h2>
            <button
              type="button"
              className="fd-text-btn fd-text-btn--accent"
              // TODO: 리뷰 작성 기능
            >
              리뷰 작성
            </button>
          </div>

          <div className="fd-review-list">
            {MOCK_REVIEWS.map((r) => (
              <div className="fd-review-card" key={r.id}>
                <div className="fd-review-top">
                  <span className="fd-review-name">{r.name}</span>
                  <Stars rating={r.rating} />
                </div>
                <p className="fd-review-body">{r.content}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="fd-review-more"
            // TODO: 리뷰 전체보기
          >
            리뷰 {MOCK_RATING.count}개 전체보기 ›
          </button>
        </section>
      </div>
    </div>
  );
}

export default FacilityDetail;
