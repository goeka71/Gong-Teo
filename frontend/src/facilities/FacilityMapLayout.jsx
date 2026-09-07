// 지도 + 좌측 패널 공유 레이아웃 (와이어프레임 02-A 구조).
// 지도는 여기서 한 번만 마운트되고, 좌측 패널 내용만 <Outlet/>을 통해
// 자식 라우트("/" 목록, "/facility/:id" 상세)에 따라 교체된다.
// -> 마커를 클릭해서 상세로 이동해도 지도가 다시 마운트되지 않는다.
//
// 검색/필터 상태도 여기서 관리한다. 지도 마커와 "/" 의 목록 패널이
// 같은 필터링 결과를 같이 봐야 하는데, 그 둘의 공통 조상이 이 레이아웃이기
// 때문이다(FacilityListPanel 은 Outlet 안, 지도는 그 바깥 형제).

import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Circle as KakaoCircle,
  CustomOverlayMap,
  Map as KakaoMap,
  MapTypeControl,
  MarkerClusterer,
  ZoomControl,
  useKakaoLoader,
} from "react-kakao-maps-sdk";
import {
  getFacilityDetailList,
  getFacilityList,
  getFacilitySportList,
  getSportList,
} from "../api/facilities";
import FacilityMarker from "./FacilityMarker";
import { DEFAULT_QUERY } from "./facilityQuery";
import {
  NEARBY_FALLBACK_RADII_M,
  NEARBY_MAX_COUNT,
  NEARBY_RADIUS_M,
  hasValidCoords,
  haversineMeters,
  pickRandomIndex,
  requestCurrentPosition,
} from "./geo";
import "./FacilityMapLayout.css";

// 서울시청 (임의 초기 중심 좌표)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

function FacilityMapLayout() {
  const navigate = useNavigate();

  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
    // 마커 클러스터링을 쓰려면 clusterer 라이브러리를 별도로 로드해야 한다.
    libraries: ["clusterer"],
  });

  // 시설 기본정보(주소/좌표/이름 등). /api/facilities/ 그대로.
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);

  // 종목 필터 선택지용 전체 종목.
  const [sports, setSports] = useState([]);

  // 시설-종목 매핑(FacilitySport). 종목으로 필터링하려면 시설과 합쳐야 한다.
  const [facilitySports, setFacilitySports] = useState([]);

  // 시설 상세정보(FacilityDetail). 실내외/샤워실/주차장 필터에 쓴다.
  const [facilityDetails, setFacilityDetails] = useState([]);

  // 지도에서 현재 선택(클릭)된 시설 id. 마커 색상을 조건부로 바꾸는 데 쓴다.
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);

  // GPS 로 받아온 사용자 현재 위치({lat,lng}) 와 그 상태.
  // status: "loading"(요청 중) | "granted"(성공) | "denied"(권한 거부)
  //         | "unavailable"(미지원/시간초과/실패)
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("loading");

  // "추천 시설" 카드에 띄울 무작위 시설 id. 새로고침 버튼을 누르면 바뀐다.
  const [recommendedId, setRecommendedId] = useState(null);

  // =====================================================
  // 검색어 + 필터를 하나의 쿼리 상태로 관리한다.
  // (백엔드 /api/facilities/ 는 쿼리 파라미터를 지원하지 않아서,
  //  이 쿼리는 서버로 보내지 않고 아래에서 클라이언트 사이드로 직접 필터링한다.)
  // =====================================================
  const [query, setQuery] = useState(DEFAULT_QUERY);

  // 레이아웃이 처음 마운트될 때 한 번만 필요한 데이터를 불러온다.
  // 실패해도 화려한 에러 UI 없이 마커/목록이 비어있는 화면만 보여준다.
  useEffect(() => {
    getFacilityList()
      .then(setFacilities)
      .catch((err) => {
        console.error("시설 목록을 불러오지 못했습니다.", err);
        setFacilities([]);
      })
      .finally(() => setFacilitiesLoading(false));

    getSportList()
      .then(setSports)
      .catch((err) => {
        console.error("종목 목록을 불러오지 못했습니다.", err);
        setSports([]);
      });

    getFacilitySportList()
      .then(setFacilitySports)
      .catch((err) => {
        console.error("시설-종목 매핑을 불러오지 못했습니다.", err);
        setFacilitySports([]);
      });

    getFacilityDetailList()
      .then(setFacilityDetails)
      .catch((err) => {
        console.error("시설 상세정보 목록을 불러오지 못했습니다.", err);
        setFacilityDetails([]);
      });
  }, []);

  // GPS 현재 위치 요청. 성공하면 좌표를, 실패하면 사유를 상태에 반영한다.
  const applyPosition = useCallback((promise) => {
    promise
      .then((coords) => {
        setUserLocation(coords);
        setLocationStatus("granted");
      })
      .catch((err) => {
        setLocationStatus(err.message === "denied" ? "denied" : "unavailable");
      });
  }, []);

  // "위치 허용하고 주변 시설 보기" 버튼용. 다시 로딩 상태로 돌리고 재요청한다.
  const retryLocation = useCallback(() => {
    setLocationStatus("loading");
    applyPosition(requestCurrentPosition());
  }, [applyPosition]);

  // 마운트 시 한 번 자동 요청. (초기 locationStatus 가 이미 "loading" 이라
  //  여기서 상태를 동기적으로 건드리지 않는다.)
  useEffect(() => {
    applyPosition(requestCurrentPosition());
  }, [applyPosition]);

  // =====================================================
  // 시설 목록에는 종목/실내외 정보가 없으므로, id 기준으로 합쳐서
  // 필터링에 필요한 값을 전부 가진 시설 배열을 만든다.
  // =====================================================
  const joinedFacilities = useMemo(() => {
    const sportNameById = new Map(
      sports.map((sport) => [sport.id, sport.sport_name])
    );

    const sportNamesByFacilityId = new Map();
    facilitySports.forEach((facilitySport) => {
      const sportName = sportNameById.get(facilitySport.sport);
      if (!sportName) return;

      const list = sportNamesByFacilityId.get(facilitySport.facility) ?? [];
      list.push(sportName);
      sportNamesByFacilityId.set(facilitySport.facility, list);
    });

    const detailByFacilityId = new Map();
    facilityDetails.forEach((detail) => {
      // 한 시설에 detail 이 여러 개면 첫 번째만 쓴다(FacilityDetail 화면과 동일한 규칙).
      if (!detailByFacilityId.has(detail.facility)) {
        detailByFacilityId.set(detail.facility, detail);
      }
    });

    return facilities.map((facility) => ({
      ...facility,
      sportNames: sportNamesByFacilityId.get(facility.id) ?? [],
      detail: detailByFacilityId.get(facility.id) ?? null,
      // 리뷰 기능 대비 자리. 지금은 리뷰 데이터가 없어 항상 null 이라
      // 카드의 별점 영역이 렌더링되지 않는다. 추후 목록 API 응답에
      // 평균 별점 / 리뷰 수가 실리면 이 두 값만 채우면 된다.
      rating: facility.rating ?? null,
      reviewCount: facility.review_count ?? null,
    }));
  }, [facilities, sports, facilitySports, facilityDetails]);

  // 지역 필터 선택지: 주소에서 "구"로 끝나는 부분만 뽑아 중복 제거.
  const regionOptions = useMemo(() => {
    const regionSet = new Set();

    facilities.forEach((facility) => {
      if (!facility.addr) return;

      const district = facility.addr
        .split(" ")
        .find((part) => part.endsWith("구"));

      if (district) regionSet.add(district);
    });

    return [...regionSet].sort();
  }, [facilities]);

  // 선택된 시설이 있으면 그 좌표를, 없으면 기본 중심 좌표를 지도에 넘긴다.
  // (react-kakao-maps-sdk 의 Map 은 center prop 이 바뀔 때마다 자동으로
  //  map.panTo/setCenter 를 호출해주므로, 여기서는 좌표만 계산해서 넘기면 된다.)
  const mapCenter = useMemo(() => {
    if (selectedFacilityId != null) {
      const selected = joinedFacilities.find(
        (facility) => facility.id === selectedFacilityId
      );
      if (selected) return { lat: selected.latit, lng: selected.longit };
    }

    // 선택된 시설이 없으면 내 위치 → (위치 없으면) 서울시청 순으로.
    if (userLocation) return userLocation;
    return DEFAULT_CENTER;
  }, [joinedFacilities, selectedFacilityId, userLocation]);

  // =====================================================
  // 쿼리 상태를 실제로 적용한 결과. 지도 마커와 목록 패널이 이 배열을 같이 본다.
  // =====================================================
  const filteredFacilities = useMemo(() => {
    const keyword = query.keyword.trim().toLowerCase();

    return joinedFacilities.filter((facility) => {
      if (keyword) {
        const haystack = [facility.facility_name, facility.addr, facility.station]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(keyword)) return false;
      }

      if (query.region && !facility.addr?.includes(query.region)) {
        return false;
      }

      if (query.sport && !facility.sportNames.includes(query.sport)) {
        return false;
      }

      if (query.amenity === "shower" && !facility.detail?.shower) {
        return false;
      }

      if (query.amenity === "parking" && !facility.detail?.parking) {
        return false;
      }

      return true;
    });
  }, [joinedFacilities, query]);

  // 검색어·필터 중 하나라도 걸려 있으면 "탐색(추천/주변) 모드" 대신
  // 검색 결과 목록을 보여준다.
  const hasActiveQuery = Boolean(
    query.keyword || query.region || query.sport || query.amenity
  );

  // =====================================================
  // 내 주변 시설: 유효 좌표 시설에 거리를 붙여 가까운 순으로 정렬하고,
  // 반경 2km 안에서 최대 30곳만. 반경 안에 하나도 없으면 3km→5km 로 넓힌다.
  // =====================================================
  const nearby = useMemo(() => {
    if (!userLocation) return { list: [], radius: NEARBY_RADIUS_M };

    const withDistance = joinedFacilities
      .filter(hasValidCoords)
      .map((facility) => ({
        ...facility,
        distanceM: haversineMeters(userLocation, {
          lat: facility.latit,
          lng: facility.longit,
        }),
      }))
      .sort((a, b) => a.distanceM - b.distanceM);

    for (const radius of [NEARBY_RADIUS_M, ...NEARBY_FALLBACK_RADII_M]) {
      const list = withDistance.filter((facility) => facility.distanceM <= radius);
      if (list.length > 0) {
        return { list: list.slice(0, NEARBY_MAX_COUNT), radius };
      }
    }
    return { list: [], radius: NEARBY_RADIUS_M };
  }, [joinedFacilities, userLocation]);

  // "추천 시설" 후보 풀: 좌표가 유효한 전체 시설.
  // (주변 목록으로 좁히면 GPS 응답 전후로 추천이 한 번 바뀌어 버려서,
  //  풀은 위치와 무관하게 고정한다.)
  const recommendPool = useMemo(
    () => joinedFacilities.filter(hasValidCoords),
    [joinedFacilities]
  );

  // 첫 추천용 난수 시드(마운트 시 한 번만). 데이터 로딩 전이라 이 시점엔
  // 후보 풀이 비어 있어서 인덱스를 못 정하고, 0~1 난수만 잡아둔다.
  const [initialSeed] = useState(() => Math.random());

  // 사용자가 "새로고침" 을 누르면 이 id 로 고정된다. 그 전까지는 시드로 계산.
  const recommendedFacility = useMemo(() => {
    if (recommendPool.length === 0) return null;

    if (recommendedId != null) {
      const picked =
        recommendPool.find((facility) => facility.id === recommendedId) ??
        joinedFacilities.find((facility) => facility.id === recommendedId);
      if (picked) return picked;
    }

    return recommendPool[Math.floor(initialSeed * recommendPool.length)];
  }, [recommendPool, recommendedId, joinedFacilities, initialSeed]);

  // 새로고침: 지금 추천과 겹치지 않는 다른 시설로 교체.
  const refreshRecommendation = useCallback(() => {
    if (recommendPool.length === 0) return;
    const currentIndex = recommendPool.findIndex(
      (facility) => facility.id === recommendedFacility?.id
    );
    const nextIndex = pickRandomIndex(recommendPool.length, currentIndex);
    setRecommendedId(recommendPool[nextIndex].id);
  }, [recommendPool, recommendedFacility]);

  // 지도 마커: 초기(검색·필터 없음 + 위치 확보) 화면에서는 주변 시설만,
  // 그 밖에는 기존처럼 검색·필터 결과 전체를 표시한다.
  const showNearbyOnly = !hasActiveQuery && userLocation != null;
  const mapFacilities = showNearbyOnly ? nearby.list : filteredFacilities;

  // 마커 클릭: 선택 상태를 갱신하고 상세페이지로 SPA 이동(useNavigate).
  // 지도 자체는 그대로 유지된 채 좌측 패널(Outlet)만 상세로 바뀐다.
  const handleMarkerClick = (facility) => {
    setSelectedFacilityId(facility.id);
    navigate(`/facility/${facility.id}`);
  };

  return (
    <div className="fml-layout">
      {/* 좌측 패널: 목록/상세 등 자식 라우트 내용이 여기로 들어온다.
          검색/필터 쿼리와 필터링된 시설 목록을 넘겨서 목록 패널이
          지도와 같은 결과를 그대로 재사용할 수 있게 한다. */}
      <div className="fml-panel">
        <Outlet
          context={{
            facilities: filteredFacilities,
            facilitiesLoading,
            selectedFacilityId,
            setSelectedFacilityId,
            query,
            setQuery,
            sportOptions: sports,
            regionOptions,
            // 위치 기반 초기 화면(추천 시설 + 주변 시설)용.
            locationStatus,
            retryLocation,
            nearbyFacilities: nearby.list,
            nearbyRadius: nearby.radius,
            recommendedFacility,
            refreshRecommendation,
          }}
        />
      </div>

      {/* 우측: 지도. 라우트가 바뀌어도 이 아래는 리렌더링만 되고 재마운트되지 않는다. */}
      <div className="fml-map">
        {error && (
          <p className="fml-map-status">
            지도를 불러오지 못했습니다. VITE_KAKAO_MAP_KEY 설정을 확인해주세요.
          </p>
        )}
        {!error && loading && (
          <p className="fml-map-status">지도를 불러오는 중입니다...</p>
        )}
        {!error && !loading && (
          <KakaoMap
            center={mapCenter}
            isPanto
            level={4}
            className="kakao-map"
          >
            <MapTypeControl position="TOPRIGHT" />
            <ZoomControl position="RIGHT" />

            {/* 내 위치: 파란 점 + (초기 화면일 때) 주변 반경 원. */}
            {userLocation && (
              <>
                <CustomOverlayMap
                  position={userLocation}
                  xAnchor={0.5}
                  yAnchor={0.5}
                >
                  <div className="fml-user-dot" title="내 위치" />
                </CustomOverlayMap>
                {showNearbyOnly && (
                  <KakaoCircle
                    center={userLocation}
                    radius={nearby.radius}
                    strokeWeight={1}
                    strokeColor="#1d4e89"
                    strokeOpacity={0.4}
                    strokeStyle="shortdash"
                    fillColor="#1d4e89"
                    fillOpacity={0.05}
                  />
                )}
              </>
            )}

            {/* 클러스터 옵션은 지정하지 않고 라이브러리 기본값(그리드 60px,
                클릭 시 확대 등)을 그대로 사용한다.
                초기 화면에서는 주변 시설만, 검색·필터 시에는 그 결과를 표시한다. */}
            <MarkerClusterer>
              {mapFacilities.map((facility) => (
                <FacilityMarker
                  key={facility.id}
                  facility={facility}
                  selected={facility.id === selectedFacilityId}
                  onClick={() => handleMarkerClick(facility)}
                />
              ))}
            </MarkerClusterer>
          </KakaoMap>
        )}
      </div>
    </div>
  );
}

export default FacilityMapLayout;
