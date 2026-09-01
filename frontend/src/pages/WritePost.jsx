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


function WritePost({
  onBack,
  onComplete,
  onRegisterProgram
}) {


  // ==========================
  // STATE
  // ==========================

  const [step, setStep] = useState(1);

  const [selectedProgram, setSelectedProgram] = useState(null);

  const [showAddProgram, setShowAddProgram] = useState(false);

  const [showNewProgramForm, setShowNewProgramForm] = useState(false);


  // 새 프로그램 입력 정보
  const [newProgram, setNewProgram] = useState({
    program_name: '',
    facility_name: '',
    program_day: '',
    program_time: '',
  });


  // 수강 시작 시간
  const [startTime, setStartTime] = useState('');


  // 수강 종료 시간
  const [endTime, setEndTime] = useState('');


  // 양도 날짜
  const [selectedDate, setSelectedDate] = useState('');


  // 수강 프로그램 목록
  const [programs, setPrograms] = useState([]);


  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);


  // ==========================
  // 5분 단위 시간 목록 생성
  // ==========================

  const timeOptions = [];

  for (let hour = 6; hour <= 22; hour++) {

    for (let minute = 0; minute < 60; minute += 5) {

      // 22시는 22:00까지만
      if (hour === 22 && minute > 0) {
        break;
      }

      const formattedHour = String(hour).padStart(2, '0');

      const formattedMinute = String(minute).padStart(2, '0');


      timeOptions.push(
        `${formattedHour}:${formattedMinute}`
      );

    }

  }


  // ==========================
  // 요일 선택
  // ==========================

  const handleDayClick = (day) => {

    const currentDays = newProgram.program_day;


    // 이미 선택된 요일이면 제거
    if (currentDays.includes(day)) {

      setNewProgram({
        ...newProgram,
        program_day: currentDays.replace(day, ''),
      });

      return;

    }


    // 선택되지 않은 요일이면 추가
    setNewProgram({
      ...newProgram,
      program_day: currentDays + day,
    });

  };


  // ==========================
  // 프로그램 이름 안전하게 가져오기
  // ==========================

  const getProgramName = (program) => {

    if (!program) {
      return '프로그램 이름 없음';
    }

    return (

      program.program_name ||
      program.name ||
      program.program?.name ||
      '프로그램 이름 없음'

    );

  };


  // ==========================
  // 시설 이름 안전하게 가져오기
  // ==========================

  const getFacilityName = (program) => {

    if (!program) {
      return '';
    }

    return (

      program.facility_name ||
      program.facility?.name ||
      ''

    );

  };


  // ==========================
  // 오늘 날짜
  // ==========================

  const getToday = () => {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      today.getDate()
    ).padStart(2, '0');


    return `${year}-${month}-${day}`;

  };


  // ==========================
  // DB에서 수강 프로그램 가져오기
  // ==========================

  useEffect(() => {

    fetch(
      'http://127.0.0.1:8000/api/oneday/my-programs/'
    )

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
          '🔥 WritePost 내 수강 프로그램 API 데이터:',
          data
        );


        const programList = Array.isArray(data)
          ? data
          : data.results || [];


        console.log(
          '프로그램 이름 확인:',
          programList.map((program) => ({
            id: program.id,
            program_name: program.program_name,
            facility_name: program.facility_name,
            status: program.status,
          }))
        );


        // approved 상태만 사용
        const approvedPrograms = programList.filter(
          (program) =>
            program.status === 'approved'
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


    if (!date) {

      setSelectedDate('');

      return;

    }


    const selectedDay = new Date(
      `${date}T00:00:00`
    ).getDay();


    const dayMap = {

      '일': 0,
      '월': 1,
      '화': 2,
      '수': 3,
      '목': 4,
      '금': 5,
      '토': 6,

    };


    const programDay =
      selectedProgram?.program_day || '';


    const allowedDays = [];


    Object.entries(dayMap).forEach(
      ([dayName, dayNumber]) => {

        if (programDay.includes(dayName)) {

          allowedDays.push(dayNumber);

        }

      }
    );


    if (allowedDays.length === 0) {

      alert(
        '수강 요일 정보를 확인할 수 없어요. 😢\n\n등록된 프로그램 정보를 다시 확인해주세요.'
      );

      setSelectedDate('');

      return;

    }


    if (!allowedDays.includes(selectedDay)) {

      alert(
        `앗, 이 날은 수강일이 아니에요! 🥲\n\n` +
        `수강 요일은 ${programDay}입니다.\n\n` +
        `수강하는 요일에 맞는 날짜를 선택해주세요 😊`
      );

      setSelectedDate('');

      return;

    }


    setSelectedDate(date);

  };


  // ==========================
  // 게시글 생성
  // ==========================

  const handleSubmit = () => {

    if (!selectedProgram || !selectedDate) {

      alert(
        '프로그램과 결석 날짜를 선택해주세요!'
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

          enroll: selectedProgram.id,

          transfer_date: selectedDate,

          status: 'open',

        }),

      }
    )

      .then((response) => {

        if (!response.ok) {

          return response.json()
            .then((data) => {

              console.error(
                '서버 오류:',
                data
              );


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

        setStep(3);

      })


      .catch((error) => {

        console.error(error);

        alert(
          `❌ 게시글 생성 실패\n\n${error.message}`
        );

      });

  };


  // ==========================================
  // 새로운 프로그램 등록 화면
  // ==========================================

  if (showNewProgramForm) {

    return (

      <div className="write-page">

        <div className="write-container">


          <h1>
            새로운 프로그램 등록
          </h1>


          <p className="description">
            새로 개설된 프로그램 정보를 입력해주세요.
          </p>


          <div className="new-program-form">


            {/* 프로그램 이름 */}

            <div className="form-group">

              <label>
                프로그램 이름
              </label>


              <input
                type="text"
                placeholder="예) 초급 수영반"

                value={newProgram.program_name}

                onChange={(e) =>

                  setNewProgram({
                    ...newProgram,
                    program_name: e.target.value,
                  })

                }

              />

            </div>


            {/* 시설 이름 */}

            <div className="form-group">

              <label>
                시설 이름
              </label>


              <input
                type="text"
                placeholder="예) 마포구민체육센터"

                value={newProgram.facility_name}

                onChange={(e) =>

                  setNewProgram({
                    ...newProgram,
                    facility_name: e.target.value,
                  })

                }

              />

            </div>


            {/* 수강 요일 */}

            <div className="form-group">

              <label>
                수강 요일
              </label>


              <div className="day-button-group">

                {['월', '화', '수', '목', '금', '토', '일'].map((day) => (

                  <button

                    key={day}

                    type="button"

                    className={`day-button ${
                      newProgram.program_day.includes(day)
                        ? 'selected'
                        : ''
                    }`}

                    onClick={() => handleDayClick(day)}

                  >

                    {day}

                  </button>

                ))}

              </div>


              {newProgram.program_day && (

                <p className="selected-day-text">

                  선택한 요일:
                  {' '}
                  {newProgram.program_day}

                </p>

              )}

            </div>


            {/* 수강 시간 */}

            <div className="form-group">

              <label>
                수강 시간
              </label>


              <div className="time-select-group">


                {/* 시작 시간 */}

                <div className="time-select-box">

                  <span className="time-label">
                    시작
                  </span>


                  <select

                    value={startTime}

                    onChange={(e) => {

                      const value = e.target.value;

                      setStartTime(value);


                      setNewProgram({
                        ...newProgram,
                        program_time: `${value} ~ ${endTime}`,
                      });

                    }}

                  >

                    <option value="">
                      시간 선택
                    </option>


                    {timeOptions.map((time) => (

                      <option
                        key={time}
                        value={time}
                      >

                        {time}

                      </option>

                    ))}

                  </select>

                </div>


                <span className="time-divider">
                  ~
                </span>


                {/* 종료 시간 */}

                <div className="time-select-box">

                  <span className="time-label">
                    종료
                  </span>


                  <select

                    value={endTime}

                    onChange={(e) => {

                      const value = e.target.value;

                      setEndTime(value);


                      setNewProgram({
                        ...newProgram,
                        program_time: `${startTime} ~ ${value}`,
                      });

                    }}

                  >

                    <option value="">
                      시간 선택
                    </option>


                    {timeOptions.map((time) => (

                      <option
                        key={time}
                        value={time}
                      >

                        {time}

                      </option>

                    ))}

                  </select>

                </div>


              </div>


              {/* 선택 결과 */}

              {startTime && endTime && (

                <div className="selected-time-text">

                  🕙 선택한 수강 시간:

                  <strong>

                    {' '}
                    {startTime} ~ {endTime}

                  </strong>

                </div>

              )}

            </div>


          </div>


          {/* 버튼 */}

          <div className="button-group">


            <button

              className="back-button"

              onClick={() => {

                setShowNewProgramForm(false);

                setShowAddProgram(true);

              }}

            >

              ← 이전

            </button>


            <button

              className="next-button"

              onClick={() => {

                if (
                  !newProgram.program_name ||
                  !newProgram.facility_name ||
                  !newProgram.program_day ||
                  !startTime ||
                  !endTime
                ) {

                  alert(
                    '모든 정보를 입력해주세요!'
                  );

                  return;

                }


                alert(
                  '프로그램 등록 기능은 다음 단계에서 DB와 연결할 예정입니다! 🎉'
                );

              }}

            >

              등록하기

            </button>


          </div>


        </div>

      </div>

    );

  }


  // ==========================================
  // 수강 프로그램 추가 방식 선택
  // ==========================================

  if (showAddProgram) {

    return (

      <div className="write-page">

        <div className="write-container">


          <h1>
            수강중인 프로그램 추가
          </h1>


          <p className="description">
            어떤 방법으로 프로그램을 추가할까요?
          </p>


          <div className="add-program-choice-list">


            {/* 기존 프로그램에서 찾기 */}

            <div

              className="add-program-choice-card"

              onClick={() => {

                alert(
                  '기존 프로그램에서 찾는 기능은 다음 단계에서 연결할 예정입니다! 🔍'
                );

              }}

            >

              <div className="choice-icon">
                🔍
              </div>


              <div className="choice-content">

                <h2>
                  기존 프로그램에서 찾기
                </h2>


                <p>
                  이미 등록된 프로그램을 찾아서
                  <br />
                  나의 수강 프로그램에 추가할 수 있어요.
                </p>

              </div>

            </div>


            {/* 새로운 프로그램 등록 */}

            <div

              className="add-program-choice-card"

              onClick={() => {

                setShowAddProgram(false);

                setShowNewProgramForm(true);

              }}

            >

              <div className="choice-icon">
                ✏️
              </div>


              <div className="choice-content">

                <h2>
                  새로운 프로그램 등록하기
                </h2>


                <p>
                  새로 개설된 프로그램을 직접 등록해서
                  <br />
                  나의 수강 프로그램에 추가할 수 있어요.
                </p>

              </div>

            </div>


          </div>


          <div className="button-group">


            <button

              className="back-button"

              onClick={() => {

                setShowAddProgram(false);

              }}

            >

              ← 돌아가기

            </button>


          </div>


        </div>

      </div>

    );

  }


  // ==========================================
  // STEP 1
  // 프로그램 선택
  // ==========================================

  if (step === 1) {

    return (

      <div className="write-page">

        <div className="write-container">


          <ProgressBar step={step} />


          <h1>
            원데이 양도하기
          </h1>


          <div className="program-title">
            나의 수강중인 프로그램
          </div>


          <div className="program-list">


            {loading && (

              <p className="loading-text">
                수강 프로그램을 불러오는 중입니다...
              </p>

            )}


            {!loading && error && (

              <p className="error-text">
                {error}
              </p>

            )}


            {!loading &&
              !error &&
              programs.length === 0 && (

                <div className="empty-program">

                  <div className="empty-icon">
                    🏃‍♀️
                  </div>


                  <p className="empty-title">
                    아직 등록된 수강 프로그램이 없어요!
                  </p>


                  <p className="empty-description">

                    수강 중인 프로그램을 먼저 등록하면
                    <br />

                    원하는 날짜의 양도글을
                    작성할 수 있어요.

                  </p>


                  <button

                    className="register-program-button"

                    onClick={() => {

                      setShowAddProgram(true);

                    }}

                  >

                    + 수강 프로그램 등록하기

                  </button>

                </div>

              )}


            {/* 실제 프로그램 */}

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


                    {selectedProgram?.id === program.id && (

                      <span className="check">
                        ✓
                      </span>

                    )}


                    <div className="program-name">

                      {getProgramName(program)}

                    </div>


                    {getFacilityName(program) && (

                      <p className="program-facility">

                        📍 {getFacilityName(program)}

                      </p>

                    )}


                    <p className="program-day">

                      📅 {program.program_day}

                    </p>


                    <p className="program-time">

                      🕙 {program.program_time}

                    </p>


                  </div>

                ))

              )}

          </div>


          {/* 수강 프로그램 추가 */}

          <button

            className="add-program-button"

            onClick={() => {

              setShowAddProgram(true);

            }}

          >

            + 수강중인 프로그램 추가하기

          </button>


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

              다음: 날짜 선택 →

            </button>


          </div>


        </div>

      </div>

    );

  }


  // ==========================================
  // STEP 2
  // 결석일 선택
  // ==========================================

  if (step === 2) {

    return (

      <div className="write-page">

        <div className="write-container">


          <ProgressBar step={step} />


          <h1>
            결석일 선택
          </h1>


          <p className="description">

            수강 일정에 맞는 결석 날짜를 선택해주세요.

          </p>


          {/* 수강 일정 */}

          <div className="selected-program-info">


            <div className="schedule-title">

              수강 일정

            </div>


            <div className="selected-program-name">

              {getProgramName(selectedProgram)}

            </div>


            {getFacilityName(selectedProgram) && (

              <p>

                📍 {getFacilityName(selectedProgram)}

              </p>

            )}


            <p>

              📅 수강 요일:
              {' '}
              {selectedProgram.program_day}

            </p>


            <p>

              🕙 수강 시간:
              {' '}
              {selectedProgram.program_time}

            </p>


          </div>


          {/* 날짜 선택 */}

          <div className="date-box">


            <label>

              📅 결석할 날짜

            </label>


            <input

              type="date"

              min={getToday()}

              value={selectedDate}

              onChange={handleDateChange}

            />


          </div>


          <p className="time-notice">

            🕙 양도 시간은 등록된 수강시간

            <strong>

              {' '}
              {selectedProgram.program_time}

            </strong>

            으로 자동 적용됩니다.

          </p>


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

              ← 이전

            </button>


            <button

              className="next-button"

              disabled={!selectedDate}

              onClick={handleSubmit}

            >

              양도 게시글 생성 →

            </button>


          </div>


        </div>

      </div>

    );

  }


  // ==========================================
  // STEP 3
  // 게시 완료
  // ==========================================

  return (

    <div className="write-page">

      <div className="complete-container">


        <ProgressBar step={step} />


        <h1>
          게시 완료! 🎉
        </h1>


        <p className="description">

          양도 게시글이 성공적으로 등록되었어요.

        </p>


        <div className="complete-info">


          <div className="complete-program-name">

            {getProgramName(selectedProgram)}

          </div>


          {getFacilityName(selectedProgram) && (

            <p>

              📍 {getFacilityName(selectedProgram)}

            </p>

          )}


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