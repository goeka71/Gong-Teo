// 메인 화면(지도 기반).
// 카카오맵 SDK를 로드하고, 시설 목록 API 결과를 커스텀 마커로 표시한다.
// 마커 클릭 시 해당 시설 상세페이지(/facility/:id)로 이동한다.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Map,
  MapTypeControl,
  MarkerClusterer,
  ZoomControl,
  useKakaoLoader,
} from "react-kakao-maps-sdk";
import { getFacilityList } from "../api/facilities";
import FacilityMarker from "./FacilityMarker";
import "./MainMap.css";

// 서울시청 (임의 초기 중심 좌표)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

function MainMap() {
  const navigate = useNavigate();

  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
    // 마커 클러스터링을 쓰려면 clusterer 라이브러리를 별도로 로드해야 한다.
    libraries: ["clusterer"],
  });

  const [facilities, setFacilities] = useState([]);

  // 지도에서 현재 선택(클릭)된 시설 id. 마커 색상을 조건부로 바꾸는 데 쓴다.
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);

  // 마운트 시 시설 목록을 불러온다.
  // 실패해도 화려한 에러 UI 없이 마커 없는 지도만 보여준다.
  useEffect(() => {
    getFacilityList()
      .then(setFacilities)
      .catch((err) => {
        console.error("시설 목록을 불러오지 못했습니다.", err);
        setFacilities([]);
      });
  }, []);

  // 마커 클릭: 선택 상태를 갱신하고 상세페이지로 SPA 이동(useNavigate).
  const handleMarkerClick = (facility) => {
    setSelectedFacilityId(facility.id);
    navigate(`/facility/${facility.id}`);
  };

  if (error) {
    return (
      <div className="page map-page">
        <p className="page-description">
          지도를 불러오지 못했습니다. VITE_KAKAO_MAP_KEY 설정을 확인해주세요.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page map-page">
        <p className="page-description">지도를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="map-page">
      <Map center={DEFAULT_CENTER} level={4} className="kakao-map">
        <MapTypeControl position="TOPRIGHT" />
        <ZoomControl position="RIGHT" />
        {/* 클러스터 옵션은 지정하지 않고 라이브러리 기본값(그리드 60px,
            클릭 시 확대 등)을 그대로 사용한다. */}
        <MarkerClusterer>
          {facilities.map((facility) => (
            <FacilityMarker
              key={facility.id}
              facility={facility}
              selected={facility.id === selectedFacilityId}
              onClick={() => handleMarkerClick(facility)}
            />
          ))}
        </MarkerClusterer>
      </Map>
    </div>
  );
}

export default MainMap;
