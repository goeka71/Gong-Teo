// 지도 위에 표시되는 시설 마커.
// CustomOverlayMap 으로 물방울 모양 핀을 직접 그려서 기본 카카오 마커를 대체한다.
// (CustomOverlayMap = 실제 DOM 이라서, MapMarker의 image 옵션과 달리
//  나중에 찜 아이콘 같은 걸 얹기가 쉽다 -> badge prop 으로 자리만 미리 마련해둠)

import { CustomOverlayMap } from "react-kakao-maps-sdk";
import "./FacilityMarker.css";

// 와이어프레임에서 쓰던 색 그대로.
const DEFAULT_COLOR = "#a7b3c2";
const SELECTED_COLOR = "#e2685f";

// 물방울(핀) 모양 SVG path. viewBox 기준 뾰족한 끝이 정확히 (12, 24) 라서
// CustomOverlayMap 의 xAnchor=0.5 / yAnchor=1 과 맞추면 그 끝이 좌표 지점을 가리킨다.
const PIN_PATH =
  "M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z";

function FacilityMarker({ facility, selected = false, onClick, badge = null }) {
  const color = selected ? SELECTED_COLOR : DEFAULT_COLOR;

  return (
    <CustomOverlayMap
      position={{ lat: facility.latit, lng: facility.longit }}
      xAnchor={0.5}
      yAnchor={1}
      clickable
      zIndex={selected ? 2 : 1}
    >
      <div
        className="facility-marker"
        onClick={onClick}
        title={facility.facility_name}
      >
        <svg
          className="facility-marker__pin"
          width="28"
          height="28"
          viewBox="0 0 24 24"
        >
          <path d={PIN_PATH} fill={color} />
          <circle cx="12" cy="9" r="3.5" fill="#fff" />
        </svg>

        {/* 나중에 찜 아이콘 등을 얹을 자리. badge 를 넘기지 않으면 아무것도 렌더링하지 않는다. */}
        {badge && <div className="facility-marker__badge">{badge}</div>}
      </div>
    </CustomOverlayMap>
  );
}

export default FacilityMarker;
