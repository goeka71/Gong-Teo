import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/user";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login({
        username,
        password,
      });

      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);

      navigate("/");
    } catch (error) {
      console.error(error);
      setError("아이디 또는 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">로그인</h1>
            <p className="page-description">
              아이디와 비밀번호를 입력해주세요.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="flex-column">
              <div className="form-group">
                <label className="form-label">아이디</label>
                <input
                  className="input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력해주세요"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">비밀번호</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요"
                  required
                />
              </div>

              {error && <p>{error}</p>}

              <button
  type="submit"
  className="btn btn-primary btn-primary-shadow btn-block"
  style={{ marginTop: "12px" }}
>
  로그인
</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;