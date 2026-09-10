import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/user";


function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setSubmitting(true);

      /*
      =========================
      로그인
      =========================

      user.js의 login()에서

      1. 로그인 API 요청
      2. accessToken 저장
      3. refreshToken 저장

      까지 처리함.
      */

      await login({
        username: username.trim(),
        password: password,
      });


      /*
      =========================
      로그인 성공
      =========================
      */

      navigate("/");


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
    <div className="page">

      <div className="page-container">

        <div className="page-header">

          <div>

            <h1 className="page-title">
              로그인
            </h1>

            <p className="page-description">
              아이디와 비밀번호를 입력해주세요.
            </p>

          </div>

        </div>


        <div className="card">

          <div className="card-body">

            <form
              onSubmit={handleSubmit}
              className="flex-column"
            >

              {/* 아이디 */}

              <div className="form-group">

                <label className="form-label">
                  아이디
                </label>

                <input
                  className="input"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="아이디를 입력해주세요"
                  autoComplete="username"
                  required
                />

              </div>


              {/* 비밀번호 */}

              <div className="form-group">

                <label className="form-label">
                  비밀번호
                </label>

                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="비밀번호를 입력해주세요"
                  autoComplete="current-password"
                  required
                />

              </div>


              {/* 로그인 실패 메시지 */}

              {error && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "#fff1f1",
                    color: "#d32f2f",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {error}
                </div>
              )}


              {/* 로그인 버튼 */}

              <button
                type="submit"
                className="btn btn-primary btn-primary-shadow btn-block"
                disabled={submitting}
                style={{
                  marginTop: "12px",
                }}
              >
                {submitting
                  ? "로그인 중..."
                  : "로그인"}
              </button>


              {/* 회원가입 이동 */}

              <div
                style={{
                  marginTop: "18px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#687386",
                }}
              >
                아직 계정이 없으신가요?{" "}

                <button
                  type="button"
                  onClick={() =>
                    navigate("/signup")
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#1d4e89",
                    fontWeight: "700",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  회원가입
                </button>

              </div>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}


export default Login;