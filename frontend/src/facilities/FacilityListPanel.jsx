// "/" 인덱스 라우트(FacilityMapLayout 의 기본 자식) 패널.
// 원래는 시설 전체 목록을 보여줬지만, 이 자리에는 나중에 검색/필터링
// 기능이 들어갈 예정이라 지금은 목록 대신 그 틀(뼈대)만 잡아둔다.
// 입력/버튼은 전부 disabled 상태 — 실제 검색·필터 동작은 다음 단계에서 연결.

import "./FacilityListPanel.css";

function FacilityListPanel() {
  return (
    <div className="flp-panel">
      <h1 className="flp-title">주변 시설 찾기</h1>

      {/* TODO: 검색 기능 연결 (지금은 틀만) */}
      <div className="flp-search">
        <input
          type="text"
          className="flp-search-input"
          placeholder="시설명으로 검색"
          disabled
        />
        <button type="button" className="flp-search-btn" disabled>
          검색
        </button>
      </div>

      {/* TODO: 필터 기능 연결 (지금은 틀만) */}
      <div className="flp-filters">
        <button type="button" className="flp-filter-chip" disabled>
          종목
        </button>
        <button type="button" className="flp-filter-chip" disabled>
          지역
        </button>
        <button type="button" className="flp-filter-chip" disabled>
          편의시설
        </button>
      </div>

      <p className="flp-placeholder">검색·필터링 준비 중입니다.</p>
    </div>
  );
}

export default FacilityListPanel;
