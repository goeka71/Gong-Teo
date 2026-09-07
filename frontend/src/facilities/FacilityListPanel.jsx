// "/" 인덱스 라우트(FacilityMapLayout 의 기본 자식) 패널.
// 검색창 + 필터칩으로 시설을 좁혀서, 그 결과를 지도 마커와 같이 보고
// 아래에 요약 카드 목록으로도 보여준다.
//
// 검색/필터 상태(query)와 필터링된 시설 목록은 부모인 FacilityMapLayout이
// 관리하고, 여기서는 useOutletContext 로 받아서 쓰기만 한다
// (지도 마커도 같은 목록을 봐야 하므로 상태를 이 컴포넌트에 두면 안 된다).

import { useNavigate, useOutletContext } from "react-router-dom";
import { BASE_URL } from "../api/client";
import { DEFAULT_QUERY } from "./facilityQuery";
import "./FacilityListPanel.css";

// 편의시설 필터 선택지. value 는 FacilityDetail 모델의 boolean 필드명과 맞춘다.
const AMENITY_OPTIONS = [
  { value: "", label: "편의시설 전체" },
  { value: "shower", label: "샤워실" },
  { value: "parking", label: "주차장" },
];

// Django MEDIA 상대경로("/media/...")를 절대주소로 바꿔준다.
// (FacilitySerializer 가 request context 없이 만들어져서 image 값이
//  상대경로로 오기 때문 - FacilityDetail 카드와 같은 문제를 여기서도 막는다.)
function resolveImageUrl(image) {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return `${BASE_URL}${image}`;
}

// 역/정류장에서의 도보 시간은 DB에 '초' 단위로 저장돼 있다(FacilityDetail.jsx 와 동일한 규칙).
// 60으로 나눈 몫이 1 이상이면 "도보 N분", 몫이 0이면 "도보 N초"로 표시한다.
function walkText(seconds) {
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `도보 ${minutes}분` : `도보 ${seconds}초`;
}

function FacilityListPanel() {
  const navigate = useNavigate();

  const {
    facilities,
    facilitiesLoading,
    selectedFacilityId,
    setSelectedFacilityId,
    query,
    setQuery,
    sportOptions,
    regionOptions,
  } = useOutletContext();

  // 종목 선택지는 sport_name 기준으로 중복 없이.
  const sportNames = [...new Set(sportOptions.map((sport) => sport.sport_name))];

  const hasActiveFilter =
    query.keyword || query.region || query.sport || query.amenity;

  function handleKeywordChange(event) {
    const keyword = event.target.value;
    setQuery((prev) => ({ ...prev, keyword }));
  }

  function handleRegionChange(event) {
    const region = event.target.value;
    setQuery((prev) => ({ ...prev, region }));
  }

  function handleSportChange(event) {
    const sport = event.target.value;
    setQuery((prev) => ({ ...prev, sport }));
  }

  function handleAmenityChange(event) {
    const amenity = event.target.value;
    setQuery((prev) => ({ ...prev, amenity }));
  }

  function handleReset() {
    setQuery(DEFAULT_QUERY);
  }

  function handleCardClick(facility) {
    setSelectedFacilityId(facility.id);
    navigate(`/facility/${facility.id}`);
  }

  return (
    <div className="flp-panel">
      <h1 className="flp-title">주변 시설 찾기</h1>

      {/* 검색: 시설명·주소·인근역 통합 검색. 타이핑하는 즉시 반영되고,
          Enter 를 눌러도(폼 submit) 새로고침 없이 그대로 유지된다. */}
      <form
        className="flp-search"
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          type="text"
          className="flp-search-input"
          placeholder="시설명, 지역, 종목을 검색해보세요"
          value={query.keyword}
          onChange={handleKeywordChange}
        />
        <button type="submit" className="flp-search-btn">
          검색
        </button>
      </form>

      {/* 필터 칩: 종목 / 지역 / 편의시설. 칩처럼 보이지만 실제로는
          select라서 옵션이 많아져도 새 UI 없이 그대로 늘어난다. */}
      <div className="flp-filters">
        <select
          className={
            "flp-filter-chip" + (query.sport ? " flp-filter-chip--active" : "")
          }
          value={query.sport}
          onChange={handleSportChange}
        >
          <option value="">종목 전체</option>
          {sportNames.map((sportName) => (
            <option key={sportName} value={sportName}>
              {sportName}
            </option>
          ))}
        </select>

        <select
          className={
            "flp-filter-chip" + (query.region ? " flp-filter-chip--active" : "")
          }
          value={query.region}
          onChange={handleRegionChange}
        >
          <option value="">지역 전체</option>
          {regionOptions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        <select
          className={
            "flp-filter-chip" +
            (query.amenity ? " flp-filter-chip--active" : "")
          }
          value={query.amenity}
          onChange={handleAmenityChange}
        >
          {AMENITY_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasActiveFilter && (
          <button
            type="button"
            className="flp-reset-btn"
            onClick={handleReset}
          >
            ↻ 초기화
          </button>
        )}
      </div>

      {/* 결과 요약 */}
      {!facilitiesLoading && (
        <p className="flp-result-count">
          총 <strong>{facilities.length}</strong>개의 시설을 찾았어요.
        </p>
      )}

      {/* 결과 카드 목록 */}
      {facilitiesLoading && (
        <p className="flp-placeholder">시설 정보를 불러오는 중입니다...</p>
      )}

      {!facilitiesLoading && facilities.length === 0 && (
        <p className="flp-placeholder">
          조건에 맞는 시설이 없어요. 다른 검색어나 필터를 사용해보세요.
        </p>
      )}

      {!facilitiesLoading && facilities.length > 0 && (
        <ul className="flp-card-list">
          {facilities.map((facility) => {
            const imageUrl = resolveImageUrl(facility.image);
            const selected = facility.id === selectedFacilityId;

            return (
              <li key={facility.id}>
                <button
                  type="button"
                  className={
                    "flp-card" + (selected ? " flp-card--selected" : "")
                  }
                  onClick={() => handleCardClick(facility)}
                >
                  <div className="flp-card-thumb">
                    {imageUrl ? (
                      <img src={imageUrl} alt={facility.facility_name} />
                    ) : (
                      <span>SPORTS</span>
                    )}
                  </div>

                  <div className="flp-card-body">
                    <p className="flp-card-name">{facility.facility_name}</p>
                    <p className="flp-card-addr">{facility.addr}</p>

                    {facility.sportNames.length > 0 && (
                      <div className="flp-card-tags">
                        {facility.sportNames.slice(0, 4).map((sportName) => (
                          <span className="flp-card-tag" key={sportName}>
                            {sportName}
                          </span>
                        ))}
                      </div>
                    )}

                    {facility.station && (
                      <p className="flp-card-station">
                        🚇 {facility.station}
                        {facility.station_wt != null &&
                          ` · ${walkText(facility.station_wt)}`}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default FacilityListPanel;
