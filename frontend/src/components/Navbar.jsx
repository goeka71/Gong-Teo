import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import Login from "../user/Login";
import Signup from "../user/Signup";

import {
  getMyInfo,
} from "../api/user";

import "./Navbar.css";


function Navbar() {
  const navigate = useNavigate();

  const [
    authModal,
    setAuthModal,
  ] = useState(null);


  /*
    accessToken이 있고 username도 있으면
    로그인 상태로 판단
  */
  const getCurrentUsername = () => {
    const token =
      localStorage.getItem(
        "accessToken"
      );

    const savedUsername =
      localStorage.getItem(
        "username"
      );

    if (
      token &&
      savedUsername
    ) {
      return savedUsername;
    }

    return null;
  };


  const [
    username,
    setUsername,
  ] = useState(
    getCurrentUsername
  );


  /*
    현재 보유 코인
  */
  const [
    coin,
    setCoin,
  ] = useState(null);


  /*
    로그인한 사용자의
    현재 코인 불러오기
  */
  const loadCoin = async () => {
    const token =
      localStorage.getItem(
        "accessToken"
      );

    if (!token) {
      setCoin(null);
      return;
    }

    try {
      const user =
        await getMyInfo();

      setCoin(
        user.coin ?? 0
      );

    } catch (error) {
      console.error(
        "코인 정보 불러오기 실패:",
        error
      );

      setCoin(null);
    }
  };


  /*
    로그인 상태 다시 확인
  */
  const syncLoginState = () => {
    const currentUsername =
      getCurrentUsername();

    setUsername(
      currentUsername
    );

    if (currentUsername) {
      loadCoin();
    } else {
      setCoin(null);
    }
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
      username + coin 바로 반영
    */
    syncLoginState();
  };


  /*
    처음 Navbar가 열렸을 때
    로그인 상태라면 코인 불러오기
  */
  useEffect(() => {
    if (getCurrentUsername()) {
      loadCoin();
    }
  }, []);


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
        공 [ 터 ]
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
            <>

              {/* 보유 코인 */}
              <div className="navbar-coin">

                <span className="navbar-coin-icon">
                  🪙
                </span>

                <span className="navbar-coin-number">
                  {coin ?? "-"}
                </span>

              </div>


              {/* 사용자 */}
              <button
                type="button"
                className="navbar-profile"
                onClick={() =>
                  navigate(
                    "/mypage"
                  )
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

            </>
          )}

        </div>

      </header>


      {/* 로그인 팝업 */}
      {authModal ===
        "login" && (

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
      {authModal ===
        "signup" && (

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