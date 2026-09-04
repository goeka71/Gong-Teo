import { useEffect, useState } from "react";
import { getFacilityDetail, updateFacilityDetail } from "../api/facilities";
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
  const [data, setData] = useState(null); // API 응답(JSON)
  const [loading, setLoading] = useState(true); // 불러오는 중인가
  const [error, setError] = useState(null); // 에러 메시지
  const [reloadKey, setReloadKey] = useState(0); // 저장 후 정보를 다시 불러오는 트리거
  const [editing, setEditing] = useState(false); // 수정 폼 열림 여부
  const [saveOk, setSaveOk] = useState(false); // "저장됐습니다" 표시 여부

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
          <h1 className="fd-name">{data.facility_name}</h1>

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
