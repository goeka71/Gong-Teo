import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendPasswordResetCode,
  resetPassword,
} from "../api/user";
import "./PasswordReset.css";

function PasswordReset() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const extractErrorMessage = (error, fallback) => {
    const data = error?.data;

    if (data && typeof data === "object") {
      const firstValue = Object.values(data)[0];

      if (Array.isArray(firstValue)) {
        return firstValue[0];
      }

      if (typeof firstValue === "string") {
        return firstValue;
      }
    }

    return fallback;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();

    setSendError("");

    if (!email.trim()) {
      setSendError("이메일을 입력해주세요.");
      return;
    }

    try {
      setSendingCode(true);

      await sendPasswordResetCode(email.trim());

      setCodeSent(true);
    } catch (error) {
      console.error("인증번호 발송 오류:", error);

      setSendError(
        extractErrorMessage(
          error,
          "인증번호 발송에 실패했습니다."
        )
      );
    } finally {
      setSendingCode(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setResetError("");

    if (!code.trim() || !newPassword) {
      setResetError("인증번호와 새 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setResetting(true);

      await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      setResetDone(true);
    } catch (error) {
      console.error("비밀번호 변경 오류:", error);

      setResetError(
        extractErrorMessage(
          error,
          "비밀번호 변경에 실패했습니다."
        )
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="page password-reset-page">
      <div className="card password-reset-card">
        <div className="card-body">
          <h1 className="password-reset-title">아이디/비밀번호 변경</h1>

          <p className="password-reset-description">
            가입하신 이메일로 인증번호를 받아
            <br />
            비밀번호를 재설정할 수 있습니다.
          </p>

          {resetDone ? (
            <>
              <div className="password-reset-success">
                비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.
              </div>

              <div className="password-reset-footer">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => navigate("/login")}
                >
                  로그인하러 가기
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 1단계: 이메일 입력 + 인증번호 받기 */}
              <form
                className="password-reset-form"
                onSubmit={handleSendCode}
              >
                <div className="form-group">
                  <label className="form-label">이메일</label>

                  <div className="password-reset-inline-group">
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setSendError("");
                      }}
                      placeholder="가입 시 등록한 이메일"
                      autoComplete="email"
                      required
                    />

                    <button
                      type="submit"
                      className="btn btn-outline"
                      disabled={sendingCode}
                    >
                      {sendingCode
                        ? "발송 중..."
                        : codeSent
                        ? "다시 받기"
                        : "인증번호 받기"}
                    </button>
                  </div>
                </div>

                {sendError && (
                  <div className="password-reset-error">{sendError}</div>
                )}

                {codeSent && !sendError && (
                  <div className="password-reset-success">
                    인증번호가 이메일로 발송되었습니다. (5분 이내 입력)
                    <br />
                    메일이 안 보이면 스팸함을 확인해주세요.
                  </div>
                )}
              </form>

              {/* 2단계: 인증번호 + 새 비밀번호 입력 */}
              {codeSent && (
                <form
                  className="password-reset-form"
                  style={{ marginTop: "18px" }}
                  onSubmit={handleResetPassword}
                >
                  <div className="form-group">
                    <label className="form-label">인증번호</label>

                    <input
                      className="input"
                      type="text"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setResetError("");
                      }}
                      placeholder="6자리 인증번호"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">새 비밀번호</label>

                    <input
                      className="input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setResetError("");
                      }}
                      placeholder="새 비밀번호"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  {resetError && (
                    <div className="password-reset-error">{resetError}</div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={resetting}
                  >
                    {resetting ? "변경 중..." : "비밀번호 변경"}
                  </button>
                </form>
              )}

              <div className="password-reset-footer">
                <button
                  type="button"
                  className="password-reset-link-button"
                  onClick={() => navigate("/login")}
                >
                  로그인으로 돌아가기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
