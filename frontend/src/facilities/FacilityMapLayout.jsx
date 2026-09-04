// 지도 + 좌측 패널 공유 레이아웃 (와이어프레임 02-A 구조).
// 지도는 여기서 한 번만 마운트되고, 좌측 패널 내용만 <Outlet/>을 통해
// 자식 라우트("/" 목록, "/facility/:id" 상세)에 따라 교체된다.
// -> 마커를 클릭해서 상세로 이동해도 지도가 다시 마운트되지 않는다.

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Map,
  MapTypeControl,
  MarkerClusterer,
  ZoomControl,
  useKakaoLoader,
} from "react-kakao-maps-sdk";
import { getFacilityList } from "../api/facilities";
import FacilityMarker from "./FacilityMarker";
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

  const [facilities, setFacilities] = useState([]);

  // 지도에서 현재 선택(클릭)된 시설 id. 마커 색상을 조건부로 바꾸는 데 쓴다.
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);

  // 레이아웃이 처음 마운트될 때 한 번만 시설 목록을 불러온다.
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
  // 지도 자체는 그대로 유지된 채 좌측 패널(Outlet)만 상세로 바뀐다.
  const handleMarkerClick = (facility) => {
    setSelectedFacilityId(facility.id);
    navigate(`/facility/${facility.id}`);
  };

  return (
    <div className="fml-layout">
      {/* 좌측 패널: 목록/상세 등 자식 라우트 내용이 여기로 들어온다.
          facilities/선택 상태를 넘겨서 목록 패널에서도 재사용할 수 있게 한다. */}
      <div className="fml-panel">
        <Outlet
          context={{ facilities, selectedFacilityId, setSelectedFacilityId }}
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
        )}
      </div>
    </div>
  );
}

export default FacilityMapLayout;
