// ⚠️ 임시 상태 — main 에 그대로 병합 금지.
// feature/facility-detail 브랜치에서 시설 상세 API 데이터를 눈으로 확인하려고
// App.jsx 를 시설 상세 화면 하나만 렌더하도록 최소화해 둔 것.
// 원래 이 파일은 3명이 공유하는 진입점이며, 다음 단계에서 팀이 react-router 를
// 도입해 목록 / 상세 / 원데이 화면을 나눌 때 함께 정리해야 한다.
import FacilityDetail from './FacilityDetail'

function App() {
  return <FacilityDetail facilityId={100} />
}

export default App
