import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api/user";

function Signup() {
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

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await signup({
        username: form.username,
        password: form.password,
        email: form.email,
        name: form.name,
        birth: form.birth || null,
        phone: form.phone,
      });

      alert("회원가입이 완료되었습니다.");
      navigate("/login");
    } catch (error) {
      console.error(error);
      setError("회원가입에 실패했습니다. 입력 정보를 확인해주세요.");
    }
  };

  return (
    <div className="page">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">회원가입</h1>
            <p className="page-description">
              체육ON에서 사용할 회원 정보를 입력해주세요.
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
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="아이디를 입력해주세요"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">비밀번호</label>
                <input
                  className="input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="비밀번호를 입력해주세요"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">비밀번호 확인</label>
                <input
                  className="input"
                  type="password"
                  name="passwordConfirm"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력해주세요"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">이메일</label>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">이름</label>
                <input
                  className="input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="이름을 입력해주세요"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">생년월일</label>
                <input
                  className="input"
                  type="date"
                  name="birth"
                  value={form.birth}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">전화번호</label>
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                />
              </div>

              {error && <p>{error}</p>}

              <button
                type="submit"
                className="btn btn-primary btn-primary-shadow btn-block"
                style={{ marginTop: "12px" }}
              >
                회원가입
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;