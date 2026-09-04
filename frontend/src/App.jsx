import { Routes, Route, Outlet, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import MainMap from "./facilities/MainMap";
import FacilityDetail from "./facilities/FacilityDetail";
import OnedayBoard from "./oneday/OnedayBoard";
import Login from "./user/Login";

// 공통 레이아웃: 모든 화면 위에 상단바(Navbar)를 두고,
// 그 아래(Outlet)에 현재 경로에 해당하는 화면을 끼워 넣는다.
function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

// "/facility/:id" 경로 전용 래퍼.
// URL 의 :id 를 꺼내 FacilityDetail 에 facilityId prop 으로 전달한다.
// (FacilityDetail 자체는 facilityId 를 prop 으로 받는 구조를 유지)
function FacilityDetailRoute() {
  const { id } = useParams();
  return <FacilityDetail facilityId={Number(id)} />;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MainMap />} />
        <Route path="/facility/:id" element={<FacilityDetailRoute />} />
        <Route path="/oneday" element={<OnedayBoard />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}

export default App;
