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
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 입력 다시 하면 해당 필드 에러는 지워주기
    setFieldErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (form.password !== form.passwordConfirm) {
      setFieldErrors({ passwordConfirm: "비밀번호가 일치하지 않습니다." });
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
      console.error("회원가입 에러:", error.data || error.message || error);

      const data = error.data;

      if (data && typeof data === "object") {
        // DRF serializer 에러: {username: ["이미 사용중입니다."], password: ["너무 짧습니다."]} 형태
        const newFieldErrors = {};
        Object.entries(data).forEach(([field, msgs]) => {
          newFieldErrors[field] = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
        });
        setFieldErrors(newFieldErrors);

        // serializer가 아닌 non_field_errors나 detail 같은 공통 에러는 상단에 표시
        if (data.detail) setError(data.detail);
        if (data.non_field_errors) {
          setError(Array.isArray(data.non_field_errors) ? data.non_field_errors.join(" ") : data.non_field_errors);
        }
      } else if (typeof data === "string" && data.trim()) {
        setError(data);
      } else {
        // 응답 본문이 없는 경우 (서버 미실행, 네트워크 오류 등)
        setError(
          "회원가입 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."
        );
      }
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
                {fieldErrors.username && (
                  <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
                    {fieldErrors.username}
                  </p>
                )}
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
                {fieldErrors.password && (
                  <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
                    {fieldErrors.password}
                  </p>
                )}
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
                {fieldErrors.passwordConfirm && (
                  <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
                    {fieldErrors.passwordConfirm}
                  </p>
                )}
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
                {fieldErrors.email && (
                  <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
                    {fieldErrors.email}
                  </p>
                )}
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
                {fieldErrors.name && (
                  <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
                    {fieldErrors.name}
                  </p>
                )}
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
                {fieldErrors.birth && (
                  <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
                    {fieldErrors.birth}
                  </p>
                )}
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
                {fieldErrors.phone && (
                  <p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              {error && <p style={{ color: "red" }}>{error}</p>}

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