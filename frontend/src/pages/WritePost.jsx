import { useEffect, useState } from 'react';
import './WritePost.css';


function ProgressBar({ step }) {

  const progress = (step / 3) * 100;

  return (

    <div className="progress-wrapper">

      <div className="progress-info">

        <span className={step >= 1 ? 'active-step' : ''}>
          1. 프로그램 선택
        </span>

        <span className={step >= 2 ? 'active-step' : ''}>
          2. 날짜 선택
        </span>

        <span className={step >= 3 ? 'active-step' : ''}>
          3. 게시 완료
        </span>

      </div>


      <div className="progress-bar">

        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />

      </div>

    </div>

  );
}


function WritePost({ onBack, onComplete }) {


  // ==========================
  // STATE
  // ==========================

  // 현재 단계
  const [step, setStep] = useState(1);

  // 선택한 프로그램
  const [selectedProgram, setSelectedProgram] = useState(null);

  // 선택한 날짜
  const [selectedDate, setSelectedDate] = useState('');

  // DB에서 가져온 프로그램 목록
  const [programs, setPrograms] = useState([]);

  // 로딩 상태
  const [loading, setLoading] = useState(true);

  // 에러 상태
  const [error, setError] = useState(null);


  // ==========================
  // DB에서 수강 프로그램 가져오기
  // ==========================

  useEffect(() => {

    fetch('http://127.0.0.1:8000/api/oneday/my-programs/')

      .then((response) => {

        if (!response.ok) {
          throw new Error(
            '수강 프로그램을 불러오지 못했습니다.'
          );
        }

        return response.json();

      })

      .then((data) => {

        console.log(
          '내 수강 프로그램:',
          data
        );

        // 승인된 프로그램만 사용
        const approvedPrograms = data.filter(
          (program) => program.status === 'approved'
        );

        setPrograms(approvedPrograms);

        setLoading(false);

      })

      .catch((error) => {

        console.error(error);

        setError(
          '수강 프로그램을 불러오는 중 오류가 발생했습니다.'
        );

        setLoading(false);

      });

  }, []);


  // ==========================
  // 날짜 변경 + 요일 검사
  // ==========================

  const handleDateChange = (e) => {

    const date = e.target.value;


    // 날짜를 지웠을 때
    if (!date) {

      setSelectedDate('');

      return;

    }


    /*
      JavaScript getDay()

      일 = 0
      월 = 1
      화 = 2
      수 = 3
      목 = 4
      금 = 5
      토 = 6
    */

    const selectedDay = new Date(
      `${date}T00:00:00`
    ).getDay();


    const dayMap = {

      "월": 1,
      "화": 2,
      "수": 3,
      "목": 4,
      "금": 5,
      "토": 6,
      "일": 0,

    };


    // 내가 수강 가능한 요일
    const allowedDays = [];


    Object.entries(dayMap).forEach(
      ([dayName, dayNumber]) => {

        if (
          selectedProgram.program_day.includes(dayName)
        ) {

          allowedDays.push(dayNumber);

        }

      }
    );


    // 선택한 날짜가 수강 요일이 아니라면
    if (!allowedDays.includes(selectedDay)) {

      alert(
        `❌ 선택한 날짜는 수강 요일이 아닙니다.\n\n수강 요일: ${selectedProgram.program_day}`
      );


      // 날짜 선택 취소
      setSelectedDate('');

      return;

    }


    // 정상적인 수강 요일
    setSelectedDate(date);

  };


  // ==========================
  // 게시글 생성
  // ==========================

  const handleSubmit = () => {

    if (!selectedProgram || !selectedDate) {

      alert(
        '프로그램과 날짜를 선택해주세요!'
      );

      return;

    }


    fetch(
      'http://127.0.0.1:8000/api/oneday/posts/',
      {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },


        body: JSON.stringify({

          // 선택한 MyProgram ID
          enroll: selectedProgram.id,

          // 양도 날짜
          transfer_date: selectedDate,

          // 모집 상태
          status: 'open',

        }),

      }
    )

      .then((response) => {


        // Django에서 오류를 보냈을 때
        if (!response.ok) {

          return response.json()
            .then((data) => {

              console.error(
                '서버 오류:',
                data
              );


              // Django가 보내준 오류 메시지
              const message =
                data.transfer_date?.[0]
                || '게시글 생성에 실패했습니다.';


              throw new Error(message);

            });

        }


        return response.json();

      })

      .then((data) => {

        console.log(
          '게시글 생성 성공:',
          data
        );


        // STEP 3으로 이동
        setStep(3);

      })

      .catch((error) => {

        console.error(error);

        alert(
          `❌ 게시글 생성 실패\n\n${error.message}`
        );

      });

  };


  // ==========================
  // STEP 1
  // 프로그램 선택
  // ==========================

  if (step === 1) {

    return (

      <div className="write-page">

        <div className="write-container">


          <ProgressBar step={step} />


          <h1>
            원데이 양도하기
          </h1>


          <div className="program-title">
            나의 수강중인 프로그램 보기
          </div>


          <div className="program-list">


            {/* 로딩 */}

            {loading && (

              <p className="loading-text">
                수강 프로그램을 불러오는 중입니다...
              </p>

            )}


            {/* 오류 */}

            {!loading && error && (

              <p className="error-text">
                {error}
              </p>

            )}


            {/* 프로그램 없음 */}

            {!loading &&
              !error &&
              programs.length === 0 && (

              <div className="empty-program">

                <p className="empty-title">
                  😢 등록된 수강 프로그램이 없습니다.
                </p>


                <p>
                  양도 게시글을 작성하려면<br />
                  먼저 수강 프로그램을 등록해주세요.
                </p>


                <button
                  className="register-program-button"
                  onClick={() => {

                    alert(
                      '수강 프로그램 등록 기능은 다음 단계에서 연결할 예정입니다.'
                    );

                  }}
                >
                  + 수강 프로그램 등록하기
                </button>

              </div>

            )}


            {/* 실제 DB 프로그램 */}

            {!loading &&
              !error &&
              programs.length > 0 && (

              programs.map((program) => (

                <div

                  key={program.id}

                  className={`program-card ${
                    selectedProgram?.id === program.id
                      ? 'selected'
                      : ''
                  }`}


                  onClick={() =>
                    setSelectedProgram(program)
                  }

                >


                  {/* 선택 체크 */}

                  {selectedProgram?.id === program.id && (

                    <span className="check">
                      ✓
                    </span>

                  )}


                  {/* 프로그램 이름 */}

                  <strong>

                    {program.program_name}

                  </strong>


                  {/* 시설 */}

                  <p>

                    📍 {program.facility_name}

                  </p>


                  {/* 수강 요일 */}

                  <p>

                    📅 {program.program_day}

                  </p>


                  {/* 수강 시간 */}

                  <p className="program-time">

                    🕙 {program.program_time}

                  </p>


                </div>

              ))

            )}

          </div>


          <div className="button-group">


            <button
              className="back-button"
              onClick={onBack}
            >

              취소

            </button>


            <button

              className="next-button"

              disabled={!selectedProgram}

              onClick={() => setStep(2)}

            >

              다음: 날짜 선택

            </button>


          </div>


        </div>

      </div>

    );

  }


  // ==========================
  // STEP 2
  // 날짜 선택
  // ==========================

  if (step === 2) {

    return (

      <div className="write-page">

        <div className="write-container">


          <ProgressBar step={step} />


          <h1>
            결석일 선택
          </h1>


          <p className="description">

            등록된 수강 요일에 맞는 날짜를 선택해주세요.

          </p>


          {/* 선택한 프로그램 */}

          <div className="selected-program-info">


            <h2>

              {selectedProgram.program_name}

            </h2>


            <p>

              📍 {selectedProgram.facility_name}

            </p>


            <p>

              📅 수강 요일: {selectedProgram.program_day}

            </p>


            <p>

              🕙 {selectedProgram.program_time}

            </p>


          </div>


          {/* 날짜 */}

          <div className="date-box">


            <label>

              결석할 날짜

            </label>


            <input

              type="date"

              value={selectedDate}

              onChange={handleDateChange}

            />


          </div>


          <p className="notice">

            ⚠️ 등록된 수강 요일에 해당하는 날짜만
            양도할 수 있습니다.

          </p>


          <div className="button-group">


            <button

              className="back-button"

              onClick={() => {

                setSelectedDate('');

                setStep(1);

              }}

            >

              이전

            </button>


            <button

              className="next-button"

              disabled={!selectedDate}

              onClick={handleSubmit}

            >

              양도 게시글 생성

            </button>


          </div>


        </div>

      </div>

    );

  }


  // ==========================
  // STEP 3
  // 게시 완료
  // ==========================

  return (

    <div className="write-page">

      <div className="complete-container">


        <ProgressBar step={step} />


        <h1>
          게시 완료! 🎉
        </h1>


        <hr />


        <div className="complete-info">


          <p>

            <strong>

              {selectedProgram.program_name}

            </strong>

          </p>


          <p>

            📍 {selectedProgram.facility_name}

          </p>


          <p>

            📅 {selectedDate}

          </p>


          <p>

            🕙 {selectedProgram.program_time}

          </p>


        </div>


        <p className="coin-text">

          +1 coin 예정

        </p>


        <button

          className="next-button complete-button"

          onClick={onComplete}

        >

          게시판으로 돌아가기

        </button>


      </div>

    </div>

  );

}


export default WritePost;