import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/user";
import "./Auth.css";

function Login({
  onClose,
  onSwitchToSignup,
}) {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const closeModal = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/");
    }
  };

  const switchToSignup = () => {
    if (onSwitchToSignup) {
      onSwitchToSignup();
    } else {
      navigate("/signup");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setSubmitting(true);

      await login({
        username: username.trim(),
        password,
      });

      // 상단 프로필 표시 등에 사용할 수 있도록 저장
      localStorage.setItem(
        "username",
        username.trim()
      );

      /*
        Navbar에서 모달로 열린 경우:
        현재 페이지는 그대로 두고 팝업만 닫음
      */
      if (onClose) {
        onClose();
      } else {
        /*
          혹시 /login 주소로 직접 들어온 경우
        */
        navigate("/");
      }
    } catch (error) {
      console.error(
        "로그인 오류:",
        error
      );

      setError(
        "아이디 또는 비밀번호를 확인해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        className="auth-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        {/* 닫기 */}
        <button
          type="button"
          className="auth-close-button"
          onClick={closeModal}
          aria-label="로그인 창 닫기"
        >
          ×
        </button>

        {/* 로고 */}
        <h1 className="auth-logo">
          체육ON
        </h1>

        <p className="auth-description">
          이 기능을 이용하기 위해서는
          <br />
          로그인이 필요합니다.
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          {/* 아이디 */}
          <input
            className="auth-input"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(
                e.target.value
              );
              setError("");
            }}
            placeholder="아이디"
            autoComplete="username"
            required
          />

          {/* 비밀번호 */}
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(
                e.target.value
              );
              setError("");
            }}
            placeholder="비밀번호"
            autoComplete="current-password"
            required
          />

          {/* 오류 */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* 로그인 */}
          <button
            type="submit"
            className="auth-primary-button"
            disabled={submitting}
          >
            {submitting
              ? "로그인 중..."
              : "로그인"}
          </button>
        </form>

        {/* 링크 */}
        <div className="auth-links">
          <button
            type="button"
            className="auth-text-button"
            onClick={switchToSignup}
          >
            회원가입
          </button>

          <span className="auth-link-divider">
            |
          </span>

          <button
            type="button"
            className="auth-text-button"
            onClick={() => {
              alert(
                "비밀번호 찾기 기능은 준비 중입니다."
              );
            }}
          >
            비밀번호 찾기
          </button>
        </div>

        <div className="auth-separator" />

        {/* 그냥 둘러보기 */}
        <button
          type="button"
          className="auth-outline-button"
          onClick={closeModal}
        >
          둘러보기로 계속하기
        </button>
      </div>
    </div>
  );
}

export default Login;