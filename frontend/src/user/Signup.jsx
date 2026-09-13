import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  signup,
  login,
} from "../api/user";

import "./Auth.css";

function Signup({
  onClose,
  onSwitchToLogin,
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    email: "",
    name: "",
    birth: "",
    phone: "",
  });

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

  const switchToLogin = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      navigate("/login");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (
      form.password !==
      form.passwordConfirm
    ) {
      setError(
        "비밀번호가 일치하지 않습니다."
      );
      return;
    }

    try {
      setSubmitting(true);

      /*
      =========================
      1. 회원가입
      =========================
      */

      await signup({
        username:
          form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        name: form.name.trim(),
        birth:
          form.birth || null,
        phone: form.phone.trim(),
      });

      /*
      =========================
      2. 자동 로그인
      =========================
      */

      await login({
        username:
          form.username.trim(),
        password: form.password,
      });

      localStorage.setItem(
        "username",
        form.username.trim()
      );

      alert(
        "회원가입이 완료되었습니다."
      );

      /*
        팝업으로 열린 경우:
        페이지 이동 없이 팝업 닫기
      */
      if (onClose) {
        onClose();
      } else {
        navigate("/mypage");
      }
    } catch (error) {
      console.error(
        "회원가입 또는 자동 로그인 오류:",
        error
      );

      console.error(
        "서버 응답:",
        error?.data
      );

      if (error?.data?.username) {
        setError(
          "이미 사용 중인 아이디입니다."
        );
      } else if (
        error?.data?.email
      ) {
        setError(
          error.data.email[0] ||
            "이메일을 확인해주세요."
        );
      } else if (
        error?.data?.password
      ) {
        setError(
          error.data.password[0] ||
            "비밀번호를 확인해주세요."
        );
      } else if (
        error?.data?.name
      ) {
        setError(
          error.data.name[0] ||
            "이름을 확인해주세요."
        );
      } else if (
        error?.data?.birth
      ) {
        setError(
          error.data.birth[0] ||
            "생년월일을 확인해주세요."
        );
      } else if (
        error?.data?.phone
      ) {
        setError(
          error.data.phone[0] ||
            "전화번호를 확인해주세요."
        );
      } else if (
        error?.message ===
        "로그인 정보가 일치하지 않습니다."
      ) {
        setError(
          "회원가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 로그인해주세요."
        );
      } else {
        setError(
          error?.message ||
            "회원가입에 실패했습니다. 입력 정보를 확인해주세요."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-overlay"
      onMouseDown={(e) => {
        if (
          e.target ===
          e.currentTarget
        ) {
          closeModal();
        }
      }}
    >
      <div
        className="auth-modal auth-modal--signup"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        {/* 닫기 */}
        <button
          type="button"
          className="auth-close-button"
          onClick={closeModal}
          aria-label="회원가입 창 닫기"
        >
          ×
        </button>

        <h1 className="auth-logo">
          체육ON
        </h1>

        <p className="auth-description">
          체육ON 회원가입
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <div className="auth-field">
            <label className="auth-label">
              아이디
            </label>

            <input
              className="auth-input"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="아이디를 입력해주세요"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              비밀번호
            </label>

            <input
              className="auth-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력해주세요"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              비밀번호 확인
            </label>

            <input
              className="auth-input"
              type="password"
              name="passwordConfirm"
              value={
                form.passwordConfirm
              }
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력해주세요"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              이메일
            </label>

            <input
              className="auth-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              이름
            </label>

            <input
              className="auth-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력해주세요"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              생년월일
            </label>

            <input
              className="auth-input"
              type="date"
              name="birth"
              value={form.birth}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              전화번호
            </label>

            <input
              className="auth-input"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
            />
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-primary-button"
            disabled={submitting}
          >
            {submitting
              ? "회원가입 중..."
              : "회원가입"}
          </button>
        </form>

        <div className="auth-login-guide">
          이미 계정이 있으신가요?

          <button
            type="button"
            className="auth-login-link"
            onClick={switchToLogin}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;