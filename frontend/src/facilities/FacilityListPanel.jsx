// "/" 인덱스 라우트(FacilityMapLayout 의 기본 자식) 패널.
//
// 검색어·필터가 비어 있는 "초기 화면"에서는
//   1) 추천 시설 (랜덤 1곳, 큰 카드 + 새로고침 버튼)
//   2) 내 주변 공공 체육시설 N곳 (GPS 기반, 가까운 순)
// 을 보여주고, 검색어나 필터가 하나라도 걸리면 기존처럼
// "검색 결과 카드 목록" 으로 전환한다.
//
// 검색/필터 상태(query)·필터링 결과·위치 관련 값은 모두 부모인
// FacilityMapLayout 이 관리하고, 여기서는 useOutletContext 로 받아 쓰기만 한다
// (지도 마커도 같은 값들을 봐야 하므로 상태를 이 컴포넌트에 두면 안 된다).

import { useNavigate, useOutletContext } from "react-router-dom";
import { BASE_URL } from "../api/client";
import { DEFAULT_QUERY } from "./facilityQuery";
import { formatDistance } from "./geo";
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

// 별점·리뷰 수 표시. 리뷰 기능이 아직 없어서 지금은 rating 이 항상 null →
// 아무것도 렌더링하지 않는다. 추후 목록 API 에 평균 별점/리뷰 수가 실리면
// 이 컴포넌트가 자동으로 채워진다(카드 마크업은 그대로 유지).
function FacilityRating({ rating, reviewCount }) {
  if (rating == null) return null;
  return (
    <p className="flp-rating">
      <span className="flp-rating-star">★ {rating.toFixed(1)}</span>
      {reviewCount != null && (
        <span className="flp-rating-count">리뷰 {reviewCount}</span>
      )}
    </p>
  );
}

function FacilityCardTags({ sportNames, limit = 4 }) {
  if (!sportNames || sportNames.length === 0) return null;
  return (
    <div className="flp-card-tags">
      {sportNames.slice(0, limit).map((sportName) => (
        <span className="flp-card-tag" key={sportName}>
          {sportName}
        </span>
      ))}
    </div>
  );
}

function FacilityStation({ station, stationWt }) {
  if (!station) return null;
  return (
    <span className="flp-card-station">
      🚇 {station}
      {stationWt != null && ` · ${walkText(stationWt)}`}
    </span>
  );
}

// 검색 결과 / 주변 시설 목록에 쓰는 한 줄 카드.
function FacilityCard({ facility, selected, onClick }) {
  const imageUrl = resolveImageUrl(facility.image);

  return (
    <li>
      <button
        type="button"
        className={"flp-card" + (selected ? " flp-card--selected" : "")}
        onClick={onClick}
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

          <FacilityRating
            rating={facility.rating}
            reviewCount={facility.reviewCount}
          />

          <FacilityCardTags sportNames={facility.sportNames} />

          <p className="flp-card-meta">
            {facility.distanceM != null && (
              <span className="flp-card-distance">
                {formatDistance(facility.distanceM)}
              </span>
            )}
            <FacilityStation
              station={facility.station}
              stationWt={facility.station_wt}
            />
          </p>
        </div>
      </button>
    </li>
  );
}

// 초기 화면 상단의 "추천 시설" 큰 카드.
function RecommendedFacilityCard({ facility, onRefresh, onSelect }) {
  return (
    <section className="flp-reco">
      <div className="flp-reco-header">
        <h2 className="flp-section-title">추천 시설</h2>
        <button
          type="button"
          className="flp-reco-refresh"
          onClick={onRefresh}
          disabled={!facility}
        >
          ↻ 추천 시설 새로고침
        </button>
      </div>

      {!facility ? (
        <p className="flp-placeholder">추천할 시설을 준비하고 있어요...</p>
      ) : (
        <button
          type="button"
          className="flp-reco-card"
          onClick={() => onSelect(facility)}
        >
          <div className="flp-reco-thumb">
            {resolveImageUrl(facility.image) ? (
              <img
                src={resolveImageUrl(facility.image)}
                alt={facility.facility_name}
              />
            ) : (
              <span>SPORTS</span>
            )}
          </div>

          <div className="flp-reco-body">
            <p className="flp-reco-name">{facility.facility_name}</p>
            <p className="flp-reco-addr">{facility.addr}</p>

            <FacilityRating
              rating={facility.rating}
              reviewCount={facility.reviewCount}
            />

            <FacilityCardTags sportNames={facility.sportNames} limit={5} />

            <p className="flp-card-meta">
              <FacilityStation
                station={facility.station}
                stationWt={facility.station_wt}
              />
            </p>
          </div>
        </button>
      )}
    </section>
  );
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
    locationStatus,
    retryLocation,
    nearbyFacilities,
    nearbyRadius,
    recommendedFacility,
    refreshRecommendation,
  } = useOutletContext();

  // 종목 선택지는 sport_name 기준으로 중복 없이.
  const sportNames = [...new Set(sportOptions.map((sport) => sport.sport_name))];

  const hasActiveFilter =
    query.keyword || query.region || query.sport || query.amenity;

  // 검색·필터가 없을 때만 "추천 + 주변" 탐색 화면을 보여준다.
  const discoveryMode = !hasActiveFilter;
  const nearbyReady =
    discoveryMode &&
    locationStatus === "granted" &&
    nearbyFacilities.length > 0;
  const nearbyLoading = discoveryMode && locationStatus === "loading";
  const nearbyBlocked =
    discoveryMode &&
    (locationStatus === "denied" || locationStatus === "unavailable");
  const nearbyEmpty =
    discoveryMode &&
    locationStatus === "granted" &&
    nearbyFacilities.length === 0;

  // 주변 목록을 못 띄우는 상황(권한 거부 / 반경 내 0곳)이면 기존 전체 목록으로 폴백.
  const showFullList = !discoveryMode || nearbyBlocked || nearbyEmpty;

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

      {/* ---------- 초기(탐색) 화면: 추천 시설 + 주변 시설 ---------- */}
      {discoveryMode && (
        <RecommendedFacilityCard
          facility={recommendedFacility}
          onRefresh={refreshRecommendation}
          onSelect={handleCardClick}
        />
      )}

      {nearbyLoading && (
        <p className="flp-placeholder">
          현재 위치로 주변 시설을 찾고 있어요...
        </p>
      )}

      {nearbyBlocked && (
        <div className="flp-location-cta">
          <p className="flp-location-cta-text">
            위치 권한을 허용하면 내 주변 공공 체육시설을 모아 볼 수 있어요.
          </p>
          <button
            type="button"
            className="flp-location-cta-btn"
            onClick={retryLocation}
          >
            위치 허용하고 주변 시설 보기
          </button>
        </div>
      )}

      {nearbyEmpty && (
        <p className="flp-result-count">
          현재 위치 반경 {Math.round(nearbyRadius / 1000)}km 안에는 등록된 시설이
          없어요. 전체 시설을 보여드릴게요.
        </p>
      )}

      {nearbyReady && (
        <section className="flp-nearby">
          <h2 className="flp-section-title">
            주변 공공 체육시설{" "}
            <span className="flp-section-count">
              {nearbyFacilities.length}곳
            </span>
          </h2>
          <ul className="flp-card-list">
            {nearbyFacilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                selected={facility.id === selectedFacilityId}
                onClick={() => handleCardClick(facility)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* ---------- 검색 결과 목록 (검색·필터 중 / 위치 폴백) ---------- */}
      {showFullList && (
        <>
          {!facilitiesLoading && (
            <p className="flp-result-count">
              총 <strong>{facilities.length}</strong>개의 시설을 찾았어요.
            </p>
          )}

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
              {facilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  selected={facility.id === selectedFacilityId}
                  onClick={() => handleCardClick(facility)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default FacilityListPanel;
