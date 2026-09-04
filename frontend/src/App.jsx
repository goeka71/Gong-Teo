import { Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";

import Navbar from "./components/Navbar";
import MainMap from "./main/MainMap";
import FacilityDetail from "./main/FacilityDetail";
import OnedayBoard from "./program/OnedayBoard";
import Login from "./user/Login";

// 모든 페이지 공통 레이아웃: 상단 Navbar + 그 아래 각 페이지 내용(Outlet).
function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}

// "/facility/:id" 어댑터.
// URL 의 :id 를 숫자로 바꿔 FacilityDetail 에 facilityId prop 으로 넘긴다.
// FacilityDetail 담당자는 이 prop 만 받으면 되고 react-router 를 몰라도 된다.
function FacilityDetailRoute() {
  const { id } = useParams();
  return <FacilityDetail facilityId={Number(id)} />;
}

// 주소별 화면 배치. (실제 화면 컴포넌트는 각 담당자가 채운다)
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MainMap />} />
        <Route path="/facility/:id" element={<FacilityDetailRoute />} />
        <Route path="/oneday" element={<OnedayBoard />} />
        <Route path="/login" element={<Login />} />

        {/* 정의되지 않은 주소는 메인으로 되돌린다 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
