import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client";
import "./OnedayRegister.css";

// ==========================================
// 현재 수강 중인 프로그램 API
// ==========================================
// ⚠️ 백엔드 실제 주소가 다르면 이 부분만 수정
const MY_PROGRAM_API = "/api/oneday/my-programs/";


// ==========================================
// 날짜 포맷
// ==========================================
function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}


// ==========================================
// 화면용 날짜 포맷
// ==========================================
function formatDisplayDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${month}.${day}`;
}


// ==========================================
// 프로그램 아이콘
// ==========================================
function getSportIcon(programName = "") {
  const name = programName.toLowerCase();

  if (name.includes("수영")) return "🏊";
  if (name.includes("헬스")) return "🏋️";
  if (name.includes("피트니스")) return "🏋️";
  if (name.includes("요가")) return "🧘";
  if (name.includes("필라테스")) return "🤸";
  if (name.includes("축구")) return "⚽";
  if (name.includes("풋살")) return "🥅";
  if (name.includes("농구")) return "🏀";
  if (name.includes("배드민턴")) return "🏸";
  if (name.includes("테니스")) return "🎾";
  if (name.includes("탁구")) return "🏓";
  if (name.includes("볼링")) return "🎳";
  if (name.includes("골프")) return "⛳";
  if (name.includes("댄스")) return "💃";
  if (name.includes("복싱")) return "🥊";
  if (name.includes("클라이밍")) return "🧗";
  if (name.includes("러닝")) return "🏃";

  return "🏃";
}


// ==========================================
// API 프로그램 데이터 정리
// ==========================================
// 백엔드 필드명이 조금 달라도 최대한 대응
function normalizeProgram(program) {
  return {
    enrollId:
      program.enroll_id ??
      program.id ??
      program.enrollment_id,

    programName:
      program.program_name ??
      program.name ??
      program.program?.program_name ??
      "프로그램명 없음",

    facilityName:
      program.facility_name ??
      program.facility?.facility_name ??
      program.facility ??
      "시설 정보 없음",

    programTime:
      program.program_time ??
      program.time ??
      program.schedule ??
      "",

    programDays:
      program.program_days ??
      program.days ??
      program.weekdays ??
      null,

    rawData: program,
  };
}


// ==========================================
// 메인 컴포넌트
// ==========================================
function OnedayRegister({ onBack }) {

  // ==========================================
  // 현재 수강 프로그램
  // ==========================================
  const [programs, setPrograms] = useState([]);

  const [programLoading, setProgramLoading] =
    useState(true);

  const [programError, setProgramError] =
    useState("");


  // ==========================================
  // 선택된 프로그램
  // ==========================================
  const [selectedProgramId, setSelectedProgramId] =
    useState(null);


  // ==========================================
  // 선택된 결석일
  // ==========================================
  const [selectedDates, setSelectedDates] =
    useState([]);


  // ==========================================
  // 현재 달력 월
  // ==========================================
  const [currentMonth, setCurrentMonth] =
    useState(() => {

      const today = new Date();

      return new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    });


  // ==========================================
  // 현재 수강 프로그램 불러오기
  // ==========================================
  useEffect(() => {

    async function fetchPrograms() {

      try {

        setProgramLoading(true);
        setProgramError("");

        const data =
          await apiGet(MY_PROGRAM_API);


        console.log(
          "현재 수강 프로그램:",
          data
        );


        // API가 배열이 아닌 경우도 대응
        const programList =
          Array.isArray(data)
            ? data
            : data.results ??
              data.programs ??
              data.data ??
              [];


        const normalizedPrograms =
          programList.map(normalizeProgram);


        setPrograms(normalizedPrograms);


        // 첫 번째 프로그램 자동 선택
        if (normalizedPrograms.length > 0) {

          setSelectedProgramId(
            normalizedPrograms[0].enrollId
          );

        }

      } catch (error) {

        console.error(
          "수강 프로그램 불러오기 실패:",
          error
        );

        setProgramError(
          "현재 수강 중인 프로그램을 불러오지 못했습니다."
        );

      } finally {

        setProgramLoading(false);

      }

    }

    fetchPrograms();

  }, []);


  // ==========================================
  // 선택된 프로그램 찾기
  // ==========================================
  const selectedProgram = useMemo(() => {

    return programs.find(
      (program) =>
        String(program.enrollId) ===
        String(selectedProgramId)
    );

  }, [
    programs,
    selectedProgramId,
  ]);


  // ==========================================
  // 프로그램 변경 시 선택 날짜 초기화
  // ==========================================
  function handleProgramSelect(programId) {

    setSelectedProgramId(programId);

    // 프로그램이 바뀌면 날짜 선택 초기화
    setSelectedDates([]);

  }


  // ==========================================
  // 이전 달
  // ==========================================
  function handlePreviousMonth() {

    setCurrentMonth((prev) => {

      return new Date(
        prev.getFullYear(),
        prev.getMonth() - 1,
        1
      );

    });

  }


  // ==========================================
  // 다음 달
  // ==========================================
  function handleNextMonth() {

    setCurrentMonth((prev) => {

      return new Date(
        prev.getFullYear(),
        prev.getMonth() + 1,
        1
      );

    });

  }


  // ==========================================
  // 달력 데이터 만들기
  // ==========================================
  const calendarData = useMemo(() => {

    const year =
      currentMonth.getFullYear();

    const month =
      currentMonth.getMonth();


    // 해당 달 첫 번째 요일
    const firstDay =
      new Date(year, month, 1).getDay();


    // 해당 달 마지막 날짜
    const lastDate =
      new Date(year, month + 1, 0).getDate();


    const days = [];


    // 앞쪽 빈칸
    for (
      let i = 0;
      i < firstDay;
      i++
    ) {

      days.push(null);

    }


    // 실제 날짜
    for (
      let day = 1;
      day <= lastDate;
      day++
    ) {

      const date =
        new Date(year, month, day);


      days.push({
        day,
        dateString: formatDate(date),
      });

    }


    return days;

  }, [currentMonth]);


  // ==========================================
  // 날짜 선택
  // ==========================================
  function handleDateSelect(dateString) {

    setSelectedDates((prev) => {

      // 이미 선택되어 있으면 제거
      if (prev.includes(dateString)) {

        return prev.filter(
          (date) => date !== dateString
        );

      }


      // 선택되어 있지 않으면 추가
      return [
        ...prev,
        dateString,
      ].sort();

    });

  }


  // ==========================================
  // 선택 날짜 문자열
  // ==========================================
  const selectedDateText =
    selectedDates.length === 0
      ? "선택한 날짜 없음"
      : selectedDates
          .map(formatDisplayDate)
          .join(", ");


  // ==========================================
  // 양도 글 등록
  // ==========================================
  function handleRegister() {

    if (!selectedProgram) {

      alert(
        "양도할 수강 프로그램을 선택해주세요."
      );

      return;

    }


    if (selectedDates.length === 0) {

      alert(
        "결석일을 선택해주세요."
      );

      return;

    }


    // ======================================
    // 현재는 UI 단계
    // 실제 POST API 연결은 나중에
    // ======================================

    console.log("양도 글 등록 데이터");

    console.log({
      enroll_id:
        selectedProgram.enrollId,

      transfer_dates:
        selectedDates,

      status:
        "open",
    });


    alert(
      "양도 글 등록이 완료되었습니다!"
    );


    if (onBack) {

      onBack();

    }

  }


  return (

    <main className="oneday-register-page">


      {/* ======================================
          뒤로가기
      ====================================== */}

      <button
        className="register-back-button"
        onClick={onBack}
      >
        ← 원데이 클래스로 돌아가기
      </button>


      {/* ======================================
          헤더
      ====================================== */}

      <div className="register-page-header">

        <div className="register-breadcrumb">
          원데이 클래스 · 양도 글쓰기
        </div>


        <h1>
          결석일 양도 글쓰기
        </h1>


        <p>
          현재 수강 중인 프로그램에서
          결석할 날짜를 선택해주세요.
        </p>

      </div>


      {/* ======================================
          전체 레이아웃
      ====================================== */}

      <div className="register-layout">


        {/* ======================================
            왼쪽
        ====================================== */}

        <section className="register-main-card">


          {/* ==================================
              수강 프로그램
          ================================== */}

          <div className="register-section-header">

            <h2>
              양도할 수강 프로그램
            </h2>

          </div>


          {/* 로딩 */}

          {programLoading && (

            <div className="program-state-message">

              수강 중인 프로그램을 불러오는 중입니다...

            </div>

          )}


          {/* 에러 */}

          {!programLoading &&
            programError && (

              <div className="program-state-message error">

                {programError}

              </div>

            )}


          {/* 프로그램 없음 */}

          {!programLoading &&
            !programError &&
            programs.length === 0 && (

              <div className="program-state-message">

                현재 등록된 수강 프로그램이 없습니다.

              </div>

            )}


          {/* 프로그램 목록 */}

          {!programLoading &&
            !programError &&
            programs.length > 0 && (

              <div className="program-list">

                {programs.map((program) => (

                  <button
                    key={program.enrollId}
                    type="button"
                    className={
                      String(selectedProgramId) ===
                      String(program.enrollId)
                        ? "program-card selected"
                        : "program-card"
                    }
                    onClick={() =>
                      handleProgramSelect(
                        program.enrollId
                      )
                    }
                  >

                    <div className="program-card-top">

                      <strong>
                        {program.programName}
                      </strong>

                      <span className="verified-badge">
                        수강 중
                      </span>

                    </div>


                    <p>

                      {program.facilityName}

                      {program.programTime &&
                        ` · ${program.programTime}`}

                    </p>

                  </button>

                ))}

              </div>

            )}


          {/* ==================================
              결석일 선택
          ================================== */}

          <div className="calendar-section">


            <div className="calendar-title-row">


              <div className="calendar-title-left">

                <strong>
                  결석일 선택
                </strong>

                <span>
                  양도할 날짜를 선택해주세요
                </span>

              </div>


              {/* 월 이동 */}

              <div className="calendar-navigation">


                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={handlePreviousMonth}
                >
                  ‹
                </button>


                <strong>
                  {currentMonth.getFullYear()}년{" "}
                  {currentMonth.getMonth() + 1}월
                </strong>


                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={handleNextMonth}
                >
                  ›
                </button>

              </div>

            </div>


            {/* ==================================
                달력
            ================================== */}

            <div className="calendar">


              {/* 요일 */}

              <div className="calendar-weekdays">

                <span>일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span>토</span>

              </div>


              {/* 날짜 */}

              <div className="calendar-days">

                {calendarData.map(
                  (item, index) => {

                    // 빈 공간

                    if (!item) {

                      return (
                        <div
                          key={`empty-${index}`}
                          className="calendar-empty"
                        />
                      );

                    }


                    const isSelected =
                      selectedDates.includes(
                        item.dateString
                      );


                    return (

                      <button
                        key={item.dateString}
                        type="button"
                        className={
                          isSelected
                            ? "calendar-day selected"
                            : "calendar-day"
                        }
                        onClick={() =>
                          handleDateSelect(
                            item.dateString
                          )
                        }
                      >

                        {item.day}

                      </button>

                    );

                  }
                )}

              </div>

            </div>


            {/* 선택된 날짜 */}

            <div className="selected-date-info">

              <span>
                선택한 결석일
              </span>

              <strong>
                {selectedDateText}
              </strong>

            </div>

          </div>

        </section>


        {/* ======================================
            오른쪽 양도 조건
        ====================================== */}

        <aside className="register-sidebar">


          <section className="transfer-condition-card">


            <h2>
              양도 조건
            </h2>


            {/* 조건 */}

            <div className="condition-list">


              <div className="condition-row">

                <span>
                  선택한 결석일
                </span>

                <strong>

                  {selectedDates.length}일

                  {selectedDates.length > 0 &&
                    ` (${selectedDateText})`}

                </strong>

              </div>


              <div className="condition-row">

                <span>
                  신청자 차감 코인
                </span>

                <strong>
                  1 coin / 1회
                </strong>

              </div>


              <div className="condition-row reward">

                <span>
                  양도 시 획득 코인
                </span>

                <strong>
                  +2 coin
                </strong>

              </div>

            </div>


            <div className="condition-line" />


            {/* ==================================
                미리보기
            ================================== */}

            <div className="preview-title">
              원데이 목록 노출 미리보기
            </div>


            <div className="oneday-preview-card">


              <div className="preview-top">


                <div className="preview-icon">

                  {getSportIcon(
                    selectedProgram?.programName
                  )}

                </div>


                <span className="preview-status">
                  신청 가능
                </span>

              </div>


              <h3>

                {selectedProgram
                  ? selectedProgram.programName
                  : "프로그램을 선택해주세요"}

              </h3>


              <p className="preview-facility">

                {selectedProgram
                  ? selectedProgram.facilityName
                  : "시설 정보"}

              </p>


              <p className="preview-date">

                {selectedDates.length > 0
                  ? selectedDateText
                  : "날짜를 선택해주세요"}

                {selectedProgram?.programTime &&
                  ` · ${selectedProgram.programTime}`}

              </p>


              <div className="preview-bottom">

                <strong>
                  -1 coin
                </strong>


                <button type="button">
                  신청
                </button>

              </div>

            </div>


            {/* ==================================
                안내
            ================================== */}

            <div className="register-notice">

              신청자가 확정되면
              코인이 지급됩니다.

              <br />

              수업일 24시간 이내에는
              양도 글을 삭제할 수 없습니다.

            </div>


            {/* ==================================
                등록 버튼
            ================================== */}

            <button
              className="transfer-register-button"
              onClick={handleRegister}
            >
              양도 글 등록
            </button>

          </section>

        </aside>

      </div>

    </main>

  );

}

export default OnedayRegister;