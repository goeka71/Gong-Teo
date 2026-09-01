import { useState } from 'react';
import './EditPost.css';


function EditPost({ post, onBack, onComplete }) {

  // ==========================
  // 수정할 날짜
  // ==========================

  const [transferDate, setTransferDate] = useState(
    post.transfer_date
  );


  // ==========================
  // 모집 상태
  // ==========================

  const [status, setStatus] = useState(
    post.status
  );


  // ==========================
  // 요일 변환
  //
  // JavaScript:
  // 일요일 = 0
  // 월요일 = 1
  // 화요일 = 2
  // 수요일 = 3
  // 목요일 = 4
  // 금요일 = 5
  // 토요일 = 6
  // ==========================

  const dayMap = {
    '일': 0,
    '월': 1,
    '화': 2,
    '수': 3,
    '목': 4,
    '금': 5,
    '토': 6,
  };


  // ==========================
  // 프로그램 수강 요일 분석
  //
  // 예시:
  // "월수금" → [1, 3, 5]
  // "화목" → [2, 4]
  // "월,수,금" → [1, 3, 5]
  // "월요일 수요일 금요일" → [1, 3, 5]
  // ==========================

  const getAllowedDays = (programDay) => {

    if (!programDay) {
      return [];
    }


    const text = String(programDay).trim();


    const allowedDays = [];


    // 월수금 같은 형태에서
    // 각 요일 글자를 하나씩 확인
    Object.keys(dayMap).forEach((day) => {

      if (text.includes(day)) {

        allowedDays.push(dayMap[day]);

      }

    });


    // 중복 제거
    return [...new Set(allowedDays)];

  };


  // ==========================
  // 날짜 변경
  // ==========================

  const handleDateChange = (e) => {

    const selectedDate = e.target.value;


    // 날짜 선택 취소
    if (!selectedDate) {

      setTransferDate('');

      return;

    }


    // 선택한 날짜의 요일
    const selectedDay = new Date(
      `${selectedDate}T00:00:00`
    ).getDay();


    // 프로그램 수강 요일
    const programDay = post.program_day;


    // ==========================
    // 프로그램 요일 확인
    // ==========================

    if (!programDay) {

      console.error(
        'program_day 데이터가 없습니다:',
        post
      );


      alert(
        '앗, 프로그램 수강 요일 정보를 불러오지 못했어요 🥲\n잠시 후 다시 시도해주세요!'
      );


      return;

    }


    // ==========================
    // 선택 가능한 요일 목록 만들기
    // ==========================

    const allowedDays =
      getAllowedDays(programDay);


    // 요일 정보를 분석하지 못한 경우
    if (allowedDays.length === 0) {

      console.error(
        '알 수 없는 프로그램 요일:',
        programDay
      );


      alert(
        '앗! 프로그램 수강 요일 정보를 확인하지 못했어요 🥲\n다시 한 번 확인해주세요!'
      );


      return;

    }


    // ==========================
    // ❌ 수강하지 않는 요일 선택
    // ==========================

    if (!allowedDays.includes(selectedDay)) {

      alert(
        `앗! 이 프로그램은 ${programDay}에 진행돼요 😊\n` +
        `수강 요일에 맞는 날짜를 선택해주세요!`
      );


      return;

    }


    // ==========================
    // ✅ 수강 요일과 일치
    // ==========================

    setTransferDate(selectedDate);

  };


  // ==========================
  // 게시글 수정
  // ==========================

  const handleSubmit = () => {

    if (!transferDate) {

      alert(
        '양도할 날짜를 선택해주세요 😊'
      );

      return;

    }


    fetch(
      `http://127.0.0.1:8000/api/oneday/posts/${post.id}/`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          transfer_date: transferDate,
          status: status,
        }),
      }
    )

      .then((response) => {

        if (!response.ok) {
          throw new Error(
            '게시글 수정에 실패했습니다.'
          );
        }

        return response.json();

      })

      .then((data) => {

        console.log(
          '수정 성공:',
          data
        );


        alert(
          '양도글이 수정되었어요! 😊'
        );


        onComplete();

      })

      .catch((error) => {

        console.error(error);


        alert(
          '앗! 게시글을 수정하는 중 문제가 생겼어요 🥲\n다시 한 번 시도해주세요!'
        );

      });

  };


  return (

    <div className="edit-post-page">

      <div className="edit-post-container">


        {/* ==========================
            헤더
        ========================== */}

        <div className="edit-post-header">

          <button
            className="back-button"
            onClick={onBack}
          >
            ← 돌아가기
          </button>


          <h1>
            양도글 수정
          </h1>


          <p>
            양도 날짜와 모집 상태를 수정할 수 있습니다.
          </p>

        </div>


        {/* ==========================
            프로그램 정보
        ========================== */}

        <div className="program-info-box">

          <h2>
            {post.program_name}
          </h2>


          <p>
            📍 {post.facility_name}
          </p>


          <p>
            📅 수강 요일: {post.program_day}
          </p>


          <p>
            🕙 {post.program_time}
          </p>

        </div>


        {/* ==========================
            날짜 선택
        ========================== */}

        <div className="edit-form-group">

          <label>
            📅 양도 날짜
          </label>


          <input
            type="date"
            value={transferDate}
            onChange={handleDateChange}
          />


          <small>
            💡 수강 요일에 해당하는 날짜만 선택할 수 있어요!
          </small>

        </div>


        {/* ==========================
            상태 선택
        ========================== */}

        <div className="edit-form-group">

          <label>
            모집 상태
          </label>


          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >

            <option value="open">
              모집중
            </option>


            <option value="closed">
              모집 마감
            </option>

          </select>

        </div>


        {/* ==========================
            버튼
        ========================== */}

        <div className="edit-button-group">

          <button
            className="cancel-edit-button"
            onClick={onBack}
          >
            취소
          </button>


          <button
            className="save-edit-button"
            onClick={handleSubmit}
          >
            💾 수정 저장
          </button>

        </div>


      </div>

    </div>

  );

}


export default EditPost;