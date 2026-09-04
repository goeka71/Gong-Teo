// [임시 stub] 시설 상세화면 - 팀원이 작업 예정 (또는 폐기 브랜치에서 회수 예정).
// 라우터 연결 확인용 빈 화면. 담당자가 통째로 교체하면 됨.
//
// 라우트 계약: App.jsx 의 /facility/:id 어댑터가 URL 의 id 를
//   facilityId prop (숫자) 으로 넘겨준다.  예) <FacilityDetail facilityId={12} />
function FacilityDetail({ facilityId }) {
  return (
    <div className="page">
      <div className="page-container">
        <h1 className="page-title">시설 상세화면 준비중</h1>
        <p className="page-description">facilityId: {facilityId}</p>
      </div>
    </div>
  );
}

export default FacilityDetail;
