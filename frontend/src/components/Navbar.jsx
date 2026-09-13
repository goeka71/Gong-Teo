import { useEffect, useState } from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import Login from "../user/Login";
import Signup from "../user/Signup";

import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [authModal, setAuthModal] =
    useState(null);

  /*
    accessToken이 있고 username도 있으면
    로그인 상태로 판단
  */
  const getCurrentUsername = () => {
    const token =
      localStorage.getItem("accessToken");

    const savedUsername =
      localStorage.getItem("username");

    if (token && savedUsername) {
      return savedUsername;
    }

    return null;
  };

  const [username, setUsername] =
    useState(getCurrentUsername);

  /*
    로그인 상태 다시 확인
  */
  const syncLoginState = () => {
    setUsername(
      getCurrentUsername()
    );
  };

  const openLogin = () => {
    setAuthModal("login");
  };

  const openSignup = () => {
    setAuthModal("signup");
  };

  const closeAuthModal = () => {
    setAuthModal(null);

    /*
      로그인 성공했다면
      여기서 username이 바로 반영됨
    */
    syncLoginState();
  };

  /*
    다른 곳에서 로그인/로그아웃 상태가
    변경되는 경우도 감지
  */
  useEffect(() => {
    const handleAuthChange = () => {
      syncLoginState();
    };

    window.addEventListener(
      "storage",
      handleAuthChange
    );

    window.addEventListener(
      "auth-change",
      handleAuthChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleAuthChange
      );

      window.removeEventListener(
        "auth-change",
        handleAuthChange
      );
    };
  }, []);

  return (
    <>
      <header className="gnb">

        {/* 로고 */}
        <NavLink
          to="/"
          className="gnb-logo"
        >
          양윤서메롱
        </NavLink>


        {/* 가운데 메뉴 */}
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


        {/* 오른쪽 영역 */}
        <div className="gnb-right">

          {/* 로그인 전 */}
          {!username && (
            <button
              type="button"
              className="gnb-login-button"
              onClick={openLogin}
            >
              로그인
            </button>
          )}


          {/* 로그인 후 */}
          {username && (
            <button
              type="button"
              className="navbar-profile"
              onClick={() =>
                navigate("/mypage")
              }
            >
              <span className="navbar-profile-avatar">
                {username
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <span className="navbar-profile-name">
                {username}
              </span>
            </button>
          )}

        </div>

      </header>


      {/* 로그인 팝업 */}
      {authModal === "login" && (
        <Login
          onClose={
            closeAuthModal
          }
          onSwitchToSignup={
            openSignup
          }
        />
      )}


      {/* 회원가입 팝업 */}
      {authModal === "signup" && (
        <Signup
          onClose={
            closeAuthModal
          }
          onSwitchToLogin={
            openLogin
          }
        />
      )}

    </>
  );
}

export default Navbar;