import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  signup,
  login,
} from "../api/user";


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


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;


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
          form.username,

        password:
          form.password,

        email:
          form.email,

        name:
          form.name,

        birth:
          form.birth || null,

        phone:
          form.phone,
      });


      /*
      =========================
      2. 회원가입 직후 자동 로그인
      =========================
      */

      await login({
        username:
          form.username,

        password:
          form.password,
      });


      /*
      user.js의 login()에서
      accessToken / refreshToken을
      localStorage에 자동 저장함
      */


      alert(
        "회원가입이 완료되었습니다."
      );


      /*
      =========================
      3. 바로 마이페이지 이동
      =========================
      */

      navigate("/mypage");


    } catch (error) {
      console.error(
        "회원가입 오류:",
        error
      );


      setError(
        "회원가입에 실패했습니다. 아이디 중복 여부와 입력 정보를 확인해주세요."
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
              회원가입
            </h1>


            <p className="page-description">
              체육ON에서 사용할 회원 정보를 입력해주세요.
            </p>

          </div>

        </div>


        <div className="card">

          <div className="card-body">

            <form
              onSubmit={
                handleSubmit
              }

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

                  name="username"

                  value={
                    form.username
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="아이디를 입력해주세요"

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

                  name="password"

                  value={
                    form.password
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="비밀번호를 입력해주세요"

                  required
                />

              </div>


              {/* 비밀번호 확인 */}

              <div className="form-group">

                <label className="form-label">
                  비밀번호 확인
                </label>


                <input
                  className="input"

                  type="password"

                  name="passwordConfirm"

                  value={
                    form.passwordConfirm
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="비밀번호를 다시 입력해주세요"

                  required
                />

              </div>


              {/* 이메일 */}

              <div className="form-group">

                <label className="form-label">
                  이메일
                </label>


                <input
                  className="input"

                  type="email"

                  name="email"

                  value={
                    form.email
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="example@email.com"

                  required
                />

              </div>


              {/* 이름 */}

              <div className="form-group">

                <label className="form-label">
                  이름
                </label>


                <input
                  className="input"

                  type="text"

                  name="name"

                  value={
                    form.name
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="이름을 입력해주세요"

                  required
                />

              </div>


              {/* 생년월일 */}

              <div className="form-group">

                <label className="form-label">
                  생년월일
                </label>


                <input
                  className="input"

                  type="date"

                  name="birth"

                  value={
                    form.birth
                  }

                  onChange={
                    handleChange
                  }
                />

              </div>


              {/* 전화번호 */}

              <div className="form-group">

                <label className="form-label">
                  전화번호
                </label>


                <input
                  className="input"

                  type="tel"

                  name="phone"

                  value={
                    form.phone
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="010-1234-5678"
                />

              </div>


              {/* 에러 메시지 */}

              {error && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "11px 13px",

                    borderRadius: "8px",

                    background:
                      "#fff3f3",

                    color:
                      "#c62828",

                    fontSize:
                      "13px",
                  }}
                >
                  {error}
                </div>
              )}


              {/* 회원가입 버튼 */}

              <button
                type="submit"

                className="btn btn-primary btn-primary-shadow btn-block"

                disabled={
                  submitting
                }

                style={{
                  marginTop:
                    "12px",
                }}
              >
                {submitting
                  ? "회원가입 중..."
                  : "회원가입"}
              </button>


              {/* 로그인 이동 */}

              <div
                style={{
                  marginTop: "18px",

                  textAlign: "center",

                  fontSize: "13px",

                  color: "#687386",
                }}
              >
                이미 계정이 있으신가요?{" "}

                <button
                  type="button"

                  onClick={() =>
                    navigate(
                      "/login"
                    )
                  }

                  style={{
                    border: "none",

                    background:
                      "transparent",

                    color:
                      "#1d4e89",

                    fontWeight:
                      "700",

                    cursor:
                      "pointer",

                    padding: 0,
                  }}
                >
                  로그인
                </button>
              </div>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}


export default Signup;