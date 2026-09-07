// "/facility/:id/subfacility/:subId" 세부시설 상세 패널.
// 상위 시설 상세(FacilityDetail.jsx)와 같은 자리(FacilityMapLayout 의
// Outlet)에 렌더링되므로 지도는 그대로 유지된 채 좌측 패널만 바뀐다.
//
// 스타일은 FacilityDetail.css 의 .fd-* 클래스를 그대로 재사용하고
// (섹션 제목, 폼, 리뷰 placeholder 톤 등), 이 화면에만 필요한 게시판/투표
// 관련 클래스만 SubFacilityDetailPanel.css 에 .sfd- 접두사로 추가한다.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFacilityDetail,
  getSubFacilityDetailList,
  createSubFacilityDetail,
  agreeSubFacilityDetail,
  disagreeSubFacilityDetail,
} from "../api/facilities";
import "./FacilityDetail.css";
import "./SubFacilityDetailPanel.css";

// 기여 정보 작성 폼. FacilityDetail.jsx 의 FacilityInfoForm 패턴을 따른다
// (열릴 때 빈 값으로 시작, 저장 성공 시 onSaved 로 부모에 새 항목을 전달).
function ContributionForm({ subfacilityId, onSaved, onCancel }) {
  const [form, setForm] = useState({ category: "", contents: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await createSubFacilityDetail({
        subfacility: subfacilityId,
        category: form.category,
        contents: form.contents,
      });
      onSaved(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="fd-edit-form" onSubmit={handleSubmit}>
      {/* 항목명·값이 한 쌍을 이루는 표의 한 행을 채우는 느낌이라
          두 입력칸을 나란히 절반씩 배치한다. */}
      <div className="sfd-form-row">
        <label className="fd-field">
          <span>항목명</span>
          <input
            name="category"
            type="text"
            placeholder="예: 수심, 레인 수"
            value={form.category}
            onChange={handleChange}
            required
          />
        </label>
        <label className="fd-field">
          <span>값</span>
          <input
            name="contents"
            type="text"
            placeholder="예: 1.2m ~ 1.5m, 8레인"
            value={form.contents}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      {error && <p className="fd-form-error">{error}</p>}

      <div className="fd-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "등록 중…" : "등록"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          취소
        </button>
      </div>
    </form>
  );
}

// 기여 정보 표의 한 행. 상위 시설 "시설 정보" 표(.fd-info-row, dt/dd 로 항목당
// 값이 하나)와 생김새는 맞추되, 같은 항목명(예: "수심")이 여러 사용자에게서
// 중복으로 올라올 수 있고 동의/비동의가 붙는다는 점이 다르므로 dl 대신
// div 행으로 구성하고, 항목명은 뱃지로 살짝 구분해준다.
function ContributionRow({ item, onVote }) {
  const [voting, setVoting] = useState(false);

  async function handleVote(direction) {
    if (voting) return;
    setVoting(true);
    try {
      await onVote(item.id, direction);
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="sfd-info-row">
      <span className="sfd-info-label">{item.category}</span>
      <span className="sfd-info-value">{item.contents}</span>
      <div className="sfd-info-votes">
        <button
          type="button"
          className="sfd-vote-btn"
          disabled={voting}
          onClick={() => handleVote("agree")}
        >
          👍 {item.agree_count}
        </button>
        <button
          type="button"
          className="sfd-vote-btn"
          disabled={voting}
          onClick={() => handleVote("disagree")}
        >
          👎 {item.disagree_count}
        </button>
      </div>
    </div>
  );
}

function SubFacilityDetailPanel({ facilityId, subfacilityId }) {
  const navigate = useNavigate();

  // 상단 브레드크럼/제목용: 상위 시설명 + 세부시설명.
  // 별도 "세부시설 단건 조회" 엔드포인트가 없어서, 시설 상세 응답에
  // 이미 포함된 sub_facilities 배열에서 id 로 찾아 쓴다.
  const [facilityName, setFacilityName] = useState("");
  const [subfacilityName, setSubfacilityName] = useState("");

  // 기여 정보(게시판) 목록.
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [facility, contributionList] = await Promise.all([
          getFacilityDetail(facilityId),
          getSubFacilityDetailList(subfacilityId),
        ]);
        if (ignore) return;

        setFacilityName(facility.facility_name ?? "");
        const sub = (facility.sub_facilities ?? []).find(
          (s) => s.id === subfacilityId
        );
        setSubfacilityName(sub?.subfacility_name ?? "");
        setContributions(contributionList);
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
  }, [facilityId, subfacilityId]);

  async function handleVote(id, direction) {
    const updated =
      direction === "agree"
        ? await agreeSubFacilityDetail(id)
        : await disagreeSubFacilityDetail(id);

    setContributions((prev) =>
      prev.map((item) => (item.id === id ? updated : item))
    );
  }

  function handleContributionSaved(created) {
    setContributions((prev) => [created, ...prev]);
    setShowForm(false);
  }

  if (loading) return <p className="fd-status">불러오는 중…</p>;
  if (error) return <p className="fd-status">에러: {error}</p>;

  return (
    <div className="fd-detail">
      {/* 상위 시설 상세로 돌아가는 링크. 지도는 그대로 유지된 채 패널만 바뀐다. */}
      <button
        type="button"
        className="sfd-back-link"
        onClick={() => navigate(`/facility/${facilityId}`)}
      >
        ‹ {facilityName || "시설 상세"}
      </button>

      <h1 className="fd-name">{subfacilityName || "세부시설"}</h1>

      {/* ---------- a) 사용자 기여 정보 게시판 ---------- */}
      <div className="fd-block-head">
        <h2 className="fd-block-title">이용자 정보</h2>
        <button
          type="button"
          className="fd-text-btn fd-text-btn--accent"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "닫기" : "+ 정보 추가"}
        </button>
      </div>

      {showForm && (
        <ContributionForm
          subfacilityId={subfacilityId}
          onSaved={handleContributionSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {contributions.length === 0 ? (
        <p className="sfd-placeholder">
          아직 등록된 정보가 없어요. 첫 정보를 남겨보세요.
        </p>
      ) : (
        <div className="sfd-info-card">
          {contributions.map((item) => (
            <ContributionRow key={item.id} item={item} onVote={handleVote} />
          ))}
        </div>
      )}

      {/* ---------- c) 리뷰 (준비중 — 다른 팀원 담당, 여기서는 자리만) ---------- */}
      <div className="fd-block-head">
        <h2 className="fd-block-title">리뷰</h2>
      </div>
      <p className="fd-status sfd-review-placeholder">리뷰 기능은 준비중입니다.</p>
    </div>
  );
}

export default SubFacilityDetailPanel;
