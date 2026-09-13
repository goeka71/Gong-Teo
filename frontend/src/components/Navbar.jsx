import { useState } from "react";
import { NavLink } from "react-router-dom";

import Login from "../user/Login";
import Signup from "../user/Signup";

import "./Navbar.css";

function Navbar() {
  const [authModal, setAuthModal] =
    useState(null);

  const openLogin = () => {
    setAuthModal("login");
  };

  const openSignup = () => {
    setAuthModal("signup");
  };

  const closeAuthModal = () => {
    setAuthModal(null);
  };

  return (
    <>
      <header className="gnb">
        <NavLink
          to="/"
          className="gnb-logo"
        >
          양윤서메롱
        </NavLink>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className="gnb-link"
          >
            메인
          </NavLink>

          <NavLink
            to="/oneday"
            className="gnb-link"
          >
            원데이
          </NavLink>

          <NavLink
            to="/mypage"
            className="gnb-link"
          >
            마이페이지
          </NavLink>
        </nav>

        {/* 기존 NavLink 대신 버튼 */}
        <button
          type="button"
          className="gnb-link gnb-link--right"
          onClick={openLogin}
          style={{
            border: "none",
            background: "transparent",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          로그인
        </button>
      </header>

      {/* 로그인 팝업 */}
      {authModal === "login" && (
        <Login
          onClose={closeAuthModal}
          onSwitchToSignup={
            openSignup
          }
        />
      )}

      {/* 회원가입 팝업 */}
      {authModal === "signup" && (
        <Signup
          onClose={closeAuthModal}
          onSwitchToLogin={
            openLogin
          }
        />
      )}
    </>
  );
}

export default Navbar;