import { NavLink } from "react-router-dom";
import "./Navbar.css";

// 공통 상단바(GNB).
// - 스타일은 styles/global.css 의 .gnb / .gnb-logo / .gnb-link 를 그대로 쓴다.
// - 로고 "체육ON" 왼쪽 정렬, 바로 옆에 링크 그룹(gap 은 Navbar.css 에서 지정).
// - NavLink 는 현재 경로와 일치하면 자동으로 active 클래스를 붙여준다.

function Navbar() {
  return (
    <header className="gnb">
      <NavLink to="/" className="gnb-logo">
        체육ON
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/" end className="gnb-link">
          메인
        </NavLink>
        <NavLink to="/oneday" className="gnb-link">
          원데이
        </NavLink>
        <NavLink to="/login" className="gnb-link">
          로그인
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
