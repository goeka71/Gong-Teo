// 지도 + 좌측 패널 공유 레이아웃 (와이어프레임 02-A 구조).
// 지도는 여기서 한 번만 마운트되고, 좌측 패널 내용만 <Outlet/>을 통해
// 자식 라우트("/" 목록, "/facility/:id" 상세)에 따라 교체된다.
// -> 마커를 클릭해서 상세로 이동해도 지도가 다시 마운트되지 않는다.
//
// 검색/필터 상태도 여기서 관리한다. 지도 마커와 "/" 의 목록 패널이
// 같은 필터링 결과를 같이 봐야 하는데, 그 둘의 공통 조상이 이 레이아웃이기
// 때문이다(FacilityListPanel 은 Outlet 안, 지도는 그 바깥 형제).

import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
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
          <KakaoMap center={DEFAULT_CENTER} level={4} className="kakao-map">
            <MapTypeControl position="TOPRIGHT" />
            <ZoomControl position="RIGHT" />
            {/* 클러스터 옵션은 지정하지 않고 라이브러리 기본값(그리드 60px,
                클릭 시 확대 등)을 그대로 사용한다.
                검색/필터 결과(filteredFacilities)만 마커로 표시한다. */}
            <MarkerClusterer>
              {filteredFacilities.map((facility) => (
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
