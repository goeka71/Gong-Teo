import { NavLink } from "react-router-dom";
import "./Navbar.css";

// 공통 상단바(GNB).
// - 스타일은 styles/global.css 의 .gnb / .gnb-logo / .gnb-link 를 그대로 쓴다.
// - 로고 왼쪽 정렬, 바로 옆에 링크 그룹(메인/원데이/마이페이지).
// - "로그인"은 네비바 맨 오른쪽에 따로 붙인다(.gnb-link--right).
// - NavLink 는 현재 경로와 일치하면 자동으로 active 클래스를 붙여준다.

function Navbar() {
  return (
    <header className="gnb">
      <NavLink to="/" className="gnb-logo">
        양윤서메롱
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/" end className="gnb-link">
          메인
        </NavLink>
        <NavLink to="/oneday" className="gnb-link">
          원데이
        </NavLink>
        <NavLink to="/mypage" className="gnb-link">
          마이페이지
        </NavLink>
      </nav>

      <NavLink to="/login" className="gnb-link gnb-link--right">
        로그인
      </NavLink>
    </header>
  );
}

export default Navbar;
