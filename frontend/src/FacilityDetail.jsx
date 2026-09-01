import { useEffect, useState } from "react";
import { API_BASE } from "./api";

// 시설 상세 화면 (스타일 없음 / 데이터 표시 확인용)
// props.facilityId: 보여줄 시설 id. 없으면 1번.
function FacilityDetail({ facilityId = 1 }) {
  const [data, setData] = useState(null); // API 응답(JSON)
  const [loading, setLoading] = useState(true); // 불러오는 중인가
  const [error, setError] = useState(null); // 에러 메시지

  // facilityId 가 바뀔 때마다 API를 다시 호출한다.
  // ignore 플래그: 응답이 늦게 왔을 때 이미 사라졌거나 바뀐 화면에
  //   setState 하지 않도록 막는 정리(cleanup) 패턴.
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/facilities/${facilityId}/`);
        if (!res.ok) {
          throw new Error(`요청 실패 (HTTP ${res.status})`);
        }
        const json = await res.json();
        if (!ignore) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [facilityId]);

  if (loading) return <p>불러오는 중…</p>;
  if (error) return <p>에러: {error}</p>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.facility_name}</h1>

      <h2>기본정보</h2>
      <ul>
        <li>주소: {data.addr}</li>
        <li>
          가까운 역: {data.station || "-"}
          {data.station_wt != null && ` (도보 ${data.station_wt}분)`}
        </li>
        <li>
          가까운 정류장: {data.bus || "-"}
          {data.bus_wt != null && ` (도보 ${data.bus_wt}분)`}
        </li>
        <li>
          위경도: {data.latit}, {data.longit}
        </li>
      </ul>

      <h2>상세정보 (details)</h2>
      {data.details.length === 0 ? (
        <p>등록된 상세정보 없음</p>
      ) : (
        data.details.map((d) => (
          <ul key={d.id}>
            <li>전화번호: {d.phone || "-"}</li>
            <li>운영시간: {d.op_hour || "-"}</li>
            <li>이용료: {d.fee || "-"}</li>
            <li>실내외: {d.in_out || "-"}</li>
            <li>샤워실: {d.shower ? "있음" : "없음"}</li>
            <li>주차장: {d.parking ? "있음" : "없음"}</li>
          </ul>
        ))
      )}

      <h2>세부시설 (sub_facilities)</h2>
      {data.sub_facilities.length === 0 ? (
        <p>등록된 세부시설 없음</p>
      ) : (
        <ul>
          {data.sub_facilities.map((s) => (
            <li key={s.id}>{s.subfacility_name}</li>
          ))}
        </ul>
      )}

      <h2>종목 (sports)</h2>
      {data.sports.length === 0 ? (
        <p>등록된 종목 없음</p>
      ) : (
        <ul>
          {data.sports.map((sp) => (
            <li key={sp.id}>{sp.sport_name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FacilityDetail;
