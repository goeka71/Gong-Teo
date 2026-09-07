// 위치(GPS) · 거리 계산 관련 순수 유틸. React 의존성 없음.
// FacilityMapLayout 이 "내 주변 시설" 을 계산할 때 쓴다.

// 주변 시설 기준 반경(m).
// DB 의 위경도로 밀도를 분석한 결과, 서울 어디서든 반경 2km 면
// 결과가 30곳을 거의 넘지 않으면서(최악 ~25곳) 목록도 비지 않는다(중앙값 ~11곳).
export const NEARBY_RADIUS_M = 2000;

// 반경 안에 시설이 하나도 없을 때(외곽 등) 단계적으로 넓혀볼 확장 반경.
export const NEARBY_FALLBACK_RADII_M = [3000, 5000];

// 목록이 너무 길어지지 않도록 하는 하드캡. 도심에서 반경 안에 20곳 넘게
// 잡히는 경우를 대비한다.
export const NEARBY_MAX_COUNT = 30;

// 브라우저 Geolocation 으로 현재 위치를 한 번 받아온다.
// - HTTPS 또는 localhost 에서만 동작한다(그 외 환경에서는 error 콜백이 호출됨).
// - 권한 거부는 "denied", 그 밖의 실패(미지원/시간초과/불가)는 "unavailable" 로
//   구분해서 reject 한다.
export function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        // 원본 에러를 콘솔에 남겨서 실패 원인(권한/OS 위치서비스/타임아웃)을 구분한다.
        console.warn(
          `[geo] 위치 조회 실패 (code ${error.code}): ${error.message}`
        );
        reject(new Error(error.code === 1 ? "denied" : "unavailable"));
      },
      {
        enableHighAccuracy: false, // 도시 단위엔 저정밀로 충분(속도·배터리 유리)
        timeout: 15000, // macOS/Chrome 첫 측위가 느릴 때가 있어 넉넉하게
        maximumAge: 600000, // 10분 이내 캐시된 위치는 그대로 재사용
      }
    );
  });
}

// 좌표가 실제로 쓸 수 있는 값인지. DB 에 위경도가 0 으로 들어온 시설이 섞여 있어서
// 거리 계산 / 주변 목록에서 걸러내야 한다.
export function hasValidCoords(facility) {
  return (
    typeof facility?.latit === "number" &&
    typeof facility?.longit === "number" &&
    facility.latit !== 0 &&
    facility.longit !== 0
  );
}

// 두 좌표 사이 대원 거리(m). Haversine 공식.
export function haversineMeters(a, b) {
  const R = 6371000; // 지구 반경(m)
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

// 미터 거리를 "약 1.2km" / "약 300m" 형태 문자열로.
export function formatDistance(meters) {
  if (meters == null) return "";
  if (meters < 1000) return `약 ${Math.round(meters / 10) * 10}m`;
  return `약 ${(meters / 1000).toFixed(1)}km`;
}

// 0 ~ (length-1) 중 하나를 무작위로. exclude 와 같은 값은 피한다
// (length <= 1 이면 어쩔 수 없이 그 값이 나올 수 있다).
export function pickRandomIndex(length, exclude = -1) {
  if (length <= 0) return -1;
  if (length === 1) return 0;

  let index = Math.floor(Math.random() * length);
  while (index === exclude) {
    index = Math.floor(Math.random() * length);
  }
  return index;
}
