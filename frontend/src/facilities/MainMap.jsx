// 메인 화면(지도 기반).
// 카카오맵 SDK를 로드하고 화면 대부분을 채우는 기본 지도만 띄운다.
// 마커/시설 데이터 연동은 다음 단계에서 진행한다.

import { Map, MapTypeControl, ZoomControl, useKakaoLoader } from "react-kakao-maps-sdk";
import "./MainMap.css";

// 서울시청 (임의 초기 중심 좌표)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

function MainMap() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
  });

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
      </Map>
    </div>
  );
}

export default MainMap;
