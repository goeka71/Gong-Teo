import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

// 모든 페이지 상단에 공통으로 보이는 네비게이션 바(GNB).
// App.jsx 의 Layout 안에서 한 번만 렌더된다.
//
// 스타일은 styles/global.css 의 .gnb / .gnb-logo / .gnb-link 클래스를 그대로 쓴다.
// NavLink 는 현재 URL 과 to 가 일치하면 자동으로 "active" 를 붙여
// global.css 의 .gnb-link.active (파란 밑줄) 가 적용된다.

// 링크 하나의 className 계산 (활성 시 "gnb-link active")
function linkClass({ isActive }) {
  return isActive ? "gnb-link active" : "gnb-link";
}

function Navbar() {
  return (
    <nav className="gnb">
      {/* 로고: 누르면 메인으로 */}
      <Link to="/" className="gnb-logo">
        체육ON
      </Link>

      <div className="gnb-nav">
        {/* end: "/" 는 정확히 일치할 때만 활성 (다른 경로에서 계속 켜지지 않게) */}
        <NavLink to="/" end className={linkClass}>
          메인
        </NavLink>
        <NavLink to="/oneday" className={linkClass}>
          원데이
        </NavLink>
        <NavLink to="/login" className={linkClass}>
          로그인
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
