import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client";
import "./OnedayRegister.css";

const MY_PROGRAM_API = "/api/oneday/my-programs/";
const POSTS_API = "/api/oneday/posts/";

// --------------------------------------------------
// 날짜 유틸
// --------------------------------------------------

const pad = (number) => String(number).padStart(2, "0");

const formatDate = (date) => {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
};

const formatDateKorean = (dateString) => {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
};

const getDayName = (date) => {
  const days = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
  ];

  return days[date.getDay()];
};

// --------------------------------------------------
// 프로그램 데이터 정규화
// --------------------------------------------------

const normalizeProgram = (program) => {
  return {
    enrollId:
      program.enroll_id ??
      program.enrollment_id ??
      program.id,

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

    facilityAddress:
      program.facility_addr ??
      program.address ??
      program.facility?.addr ??
      "",

    startDate:
      program.start_date ??
      program.startDate ??
      "",

    endDate:
      program.end_date ??
      program.endDate ??
      "",

    programDays:
      program.program_day ??
      program.program_days ??
      program.days ??
      program.weekdays ??
      "",

    programTime:
      program.program_time ??
      program.programTime ??
      program.time ??
      program.schedule ??
      "",

    status:
      program.status ??
      "",
  };
};

// --------------------------------------------------
// 요일 문자열 → 숫자 배열
// --------------------------------------------------

const parseWeekdays = (value) => {
  if (!value) return [];

  const text = String(value);

  const result = [];

  if (text.includes("일")) result.push(0);
  if (text.includes("월")) result.push(1);
  if (text.includes("화")) result.push(2);
  if (text.includes("수")) result.push(3);
  if (text.includes("목")) result.push(4);
  if (text.includes("금")) result.push(5);
  if (text.includes("토")) result.push(6);

  return result;
};

// --------------------------------------------------
// 날짜가 기간 안에 있는지
// --------------------------------------------------

const isWithinProgramPeriod = (dateString, program) => {
  if (!program?.startDate || !program?.endDate) {
    return true;
  }

  return (
    dateString >= program.startDate &&
    dateString <= program.endDate
  );
};

// --------------------------------------------------
// 메인 컴포넌트
// --------------------------------------------------

function OnedayRegister({ onBack }) {
  // ----------------------------------------------
  // 프로그램
  // ----------------------------------------------
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programError, setProgramError] = useState("");

  const [selectedProgramId, setSelectedProgramId] =
    useState(null);

  // ----------------------------------------------
  // 달력
  // ----------------------------------------------
  const today = new Date();

  const [calendarDate, setCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // ----------------------------------------------
  // 선택 날짜
  // ----------------------------------------------
  const [selectedDates, setSelectedDates] = useState([]);

  // ----------------------------------------------
  // 등록 상태
  // ----------------------------------------------
  const [registering, setRegistering] = useState(false);

  // ----------------------------------------------
  // 현재 선택 프로그램
  // ----------------------------------------------
  const selectedProgram = useMemo(() => {
    return (
      programs.find(
        (program) =>
          String(program.enrollId) ===
          String(selectedProgramId)
      ) || null
    );
  }, [programs, selectedProgramId]);

  // ==================================================
  // 수강 프로그램 가져오기
  // ==================================================

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoadingPrograms(true);
        setProgramError("");

        const data = await apiGet(MY_PROGRAM_API);

        const rawPrograms = Array.isArray(data)
          ? data
          : [];

        const normalizedPrograms =
          rawPrograms
            .map(normalizeProgram)
            .filter(
              (program) =>
                program.enrollId !== null &&
                program.enrollId !== undefined
            );

        setPrograms(normalizedPrograms);

        // 첫 번째 프로그램 자동 선택
        if (normalizedPrograms.length > 0) {
          setSelectedProgramId(
            normalizedPrograms[0].enrollId
          );
        }
      } catch (error) {
        console.error(
          "수강 프로그램 조회 실패:",
          error
        );

        setProgramError(
          "수강 프로그램을 불러오지 못했습니다."
        );

        setPrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, []);

  // ==================================================
  // 프로그램 변경
  // ==================================================

  const handleProgramSelect = (program) => {
    setSelectedProgramId(program.enrollId);

    // 프로그램이 바뀌면 기존 선택 날짜 제거
    setSelectedDates([]);
  };

  // ==================================================
  // 달력 이동
  // ==================================================

  const handlePrevMonth = () => {
    setCalendarDate(
      new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() - 1,
        1
      )
    );
  };

  const handleNextMonth = () => {
    setCalendarDate(
      new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + 1,
        1
      )
    );
  };

  // ==================================================
  // 달력 날짜 생성
  // ==================================================

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    // 첫 주 빈칸
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // 날짜
    for (
      let day = 1;
      day <= lastDay.getDate();
      day++
    ) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [calendarDate]);

  // ==================================================
  // 날짜 선택
  // ==================================================

  const handleDateSelect = (date) => {
    if (!date) return;

    if (!selectedProgram) {
      alert("먼저 양도할 수강 프로그램을 선택해주세요.");
      return;
    }

    const dateString = formatDate(date);

    // ----------------------------------------------
    // 1. 수강기간 확인
    // ----------------------------------------------

    if (
      !isWithinProgramPeriod(
        dateString,
        selectedProgram
      )
    ) {
      alert(
        `수강기간(${selectedProgram.startDate} ~ ${selectedProgram.endDate}) 안의 날짜만 선택할 수 있습니다.`
      );
      return;
    }

    // ----------------------------------------------
    // 2. 수강요일 확인
    // ----------------------------------------------

    const weekdays = parseWeekdays(
      selectedProgram.programDays
    );

    if (
      weekdays.length > 0 &&
      !weekdays.includes(date.getDay())
    ) {
      alert(
        `이 프로그램은 ${selectedProgram.programDays}에 수업이 있습니다.\n수업 요일에 해당하는 날짜만 선택할 수 있습니다.`
      );
      return;
    }

    // ----------------------------------------------
    // 3. 이미 선택되어 있으면 제거
    // ----------------------------------------------

    setSelectedDates((prev) => {
      if (prev.includes(dateString)) {
        return prev.filter(
          (item) => item !== dateString
        );
      }

      // --------------------------------------------
      // 4. 새로운 날짜 추가
      // --------------------------------------------

      return [...prev, dateString].sort();
    });
  };

  // ==================================================
  // 날짜 선택 여부
  // ==================================================

  const isSelected = (date) => {
    if (!date) return false;

    return selectedDates.includes(
      formatDate(date)
    );
  };

  // ==================================================
  // 날짜 비활성화 여부
  // ==================================================

  const isDateDisabled = (date) => {
    if (!date || !selectedProgram) {
      return false;
    }

    const dateString = formatDate(date);

    // 수강기간
    if (
      selectedProgram.startDate &&
      dateString < selectedProgram.startDate
    ) {
      return true;
    }

    if (
      selectedProgram.endDate &&
      dateString > selectedProgram.endDate
    ) {
      return true;
    }

    // 수강요일
    const weekdays = parseWeekdays(
      selectedProgram.programDays
    );

    if (
      weekdays.length > 0 &&
      !weekdays.includes(date.getDay())
    ) {
      return true;
    }

    return false;
  };

  // ==================================================
  // 선택 날짜 삭제
  // ==================================================

  const handleRemoveDate = (dateString) => {
    setSelectedDates((prev) =>
      prev.filter((date) => date !== dateString)
    );
  };

  // ==================================================
  // 미리보기
  // ==================================================

  const previewProgramName =
    selectedProgram?.programName ||
    "수강 프로그램을 선택해주세요.";

  const previewFacilityName =
    selectedProgram?.facilityName ||
    "시설 정보 없음";

  // ==================================================
  // 원데이 글 등록
  // ==================================================

  const handleRegister = async () => {
    if (!selectedProgram) {
      alert("양도할 수강 프로그램을 선택해주세요.");
      return;
    }

    if (selectedDates.length === 0) {
      alert("양도할 결석일을 하나 이상 선택해주세요.");
      return;
    }

    try {
      setRegistering(true);

      /*
       * OnedayPost DB 구조상 transfer_date가 하나이므로
       * 여러 날짜를 선택하면 날짜별로 게시글을 하나씩 생성한다.
       */

      for (const date of selectedDates) {
        const response = await fetch(POSTS_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enroll: selectedProgram.enrollId,
            transfer_date: date,
            status: "open",
          }),
        });

        if (!response.ok) {
          let message =
            "원데이 글 등록에 실패했습니다.";

          try {
            const data = await response.json();

            if (data?.detail) {
              message = data.detail;
            } else if (data) {
              message = JSON.stringify(data);
            }
          } catch {
            // JSON 응답이 아니면 기본 메시지 사용
          }

          throw new Error(message);
        }
      }

      alert(
        `${selectedDates.length}개의 양도 글이 등록되었습니다!`
      );

      // 등록 화면 초기화
      setSelectedDates([]);

      // 게시판으로 돌아가기
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error(
        "원데이 글 등록 실패:",
        error
      );

      alert(
        error.message ||
          "원데이 글 등록 중 오류가 발생했습니다."
      );
    } finally {
      setRegistering(false);
    }
  };

  // ==================================================
  // 렌더링
  // ==================================================

  return (
    <div className="oneday-register-page">

      {/* ==========================================
          상단
      ========================================== */}
      <div className="register-top">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← 원데이 클래스
        </button>

        <div className="register-title-area">

          <div className="register-breadcrumb">
            원데이 클래스 · 양도 글쓰기
          </div>

          <h1>결석일 양도 글쓰기</h1>

          <p>
            현재 수강 중인 프로그램에서 결석할 날짜를
            선택해주세요.
          </p>

        </div>
      </div>

      {/* ==========================================
          메인 2컬럼
      ========================================== */}
      <div className="register-layout">

        {/* ========================================
            LEFT
        ======================================== */}
        <div className="register-main">

          {/* ----------------------------------------
              수강 프로그램
          ---------------------------------------- */}
          <section className="register-card">

            <div className="section-heading-row">

              <div>
                <h2>양도할 수강 프로그램</h2>

                <p>
                  현재 수강 중인 프로그램만 양도할 수 있습니다.
                </p>
              </div>

              <button
                type="button"
                className="add-program-button"
                onClick={() => {
                  alert(
                    "수강 프로그램 등록 기능은 마이페이지에서 연결할 예정입니다."
                  );
                }}
              >
                + 수강 프로그램 등록하기
              </button>

            </div>

            {/* 프로그램 로딩 */}
            {loadingPrograms && (
              <div className="program-empty">
                <div className="program-empty-icon">
                  ⏳
                </div>

                <strong>
                  수강 프로그램을 불러오는 중입니다.
                </strong>
              </div>
            )}

            {/* 프로그램 에러 */}
            {!loadingPrograms &&
              programError && (
                <div className="program-empty">
                  <div className="program-empty-icon">
                    ⚠️
                  </div>

                  <strong>
                    {programError}
                  </strong>

                  <p>
                    잠시 후 다시 시도해주세요.
                  </p>
                </div>
              )}

            {/* 프로그램 없음 */}
            {!loadingPrograms &&
              !programError &&
              programs.length === 0 && (
                <div className="program-empty">

                  <div className="program-empty-icon">
                    📋
                  </div>

                  <strong>
                    등록된 수강 프로그램이 없습니다.
                  </strong>

                  <p>
                    원데이 양도를 이용하려면 먼저
                    수강 프로그램을 등록해주세요.
                  </p>

                  <button
                    type="button"
                    className="empty-register-button"
                    onClick={() => {
                      alert(
                        "수강 프로그램 등록 기능은 마이페이지에서 연결할 예정입니다."
                      );
                    }}
                  >
                    수강 프로그램 등록하기
                  </button>

                </div>
              )}

            {/* 프로그램 목록 */}
            {!loadingPrograms &&
              !programError &&
              programs.length > 0 && (
                <div className="program-list">

                  {programs.map((program) => {
                    const selected =
                      String(program.enrollId) ===
                      String(selectedProgramId);

                    return (
                      <button
                        type="button"
                        key={program.enrollId}
                        className={`program-item ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleProgramSelect(program)
                        }
                      >

                        <div className="program-item-check">
                          {selected ? "✓" : ""}
                        </div>

                        <div className="program-item-content">

                          <strong>
                            {program.programName}
                          </strong>

                          <span>
                            {program.facilityName}
                          </span>

                          {program.facilityAddress && (
                            <small>
                              {program.facilityAddress}
                            </small>
                          )}

                          <div className="program-meta">

                            {program.programDays && (
                              <span>
                                📅{" "}
                                {program.programDays}
                              </span>
                            )}

                            {program.programTime && (
                              <span>
                                ⏰{" "}
                                {program.programTime}
                              </span>
                            )}

                          </div>

                          {program.startDate &&
                            program.endDate && (
                              <div className="program-period">
                                수강기간{" "}
                                {program.startDate} ~{" "}
                                {program.endDate}
                              </div>
                            )}

                        </div>
                      </button>
                    );
                  })}

                </div>
              )}

          </section>

          {/* ----------------------------------------
              결석일 선택
          ---------------------------------------- */}
          <section className="register-card">

            <div className="calendar-heading">

              <div>
                <h2>결석일 선택</h2>

                <p>
                  양도할 날짜를 선택해주세요.
                </p>
              </div>

              <div className="calendar-navigation">

                <button
                  type="button"
                  onClick={handlePrevMonth}
                >
                  ‹
                </button>

                <strong>
                  {calendarDate.getFullYear()}년{" "}
                  {calendarDate.getMonth() + 1}월
                </strong>

                <button
                  type="button"
                  onClick={handleNextMonth}
                >
                  ›
                </button>

              </div>
            </div>

            {/* 선택 프로그램 정보 */}
            {selectedProgram && (
              <div className="calendar-program-info">

                <span>
                  선택 프로그램
                </span>

                <strong>
                  {selectedProgram.programName}
                </strong>

                <span>
                  {selectedProgram.programDays ||
                    "요일 정보 없음"}
                </span>

              </div>
            )}

            {/* 달력 */}
            <div className="calendar">

              <div className="calendar-weekdays">

                {[
                  "일",
                  "월",
                  "화",
                  "수",
                  "목",
                  "금",
                  "토",
                ].map((day) => (
                  <div key={day}>
                    {day}
                  </div>
                ))}

              </div>

              <div className="calendar-grid">

                {calendarDays.map(
                  (date, index) => {

                    if (!date) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="calendar-day empty"
                        />
                      );
                    }

                    const selected =
                      isSelected(date);

                    const disabled =
                      isDateDisabled(date);

                    return (
                      <button
                        type="button"
                        key={formatDate(date)}
                        className={`calendar-day ${
                          selected
                            ? "selected"
                            : ""
                        } ${
                          disabled
                            ? "disabled"
                            : ""
                        }`}
                        disabled={disabled}
                        onClick={() =>
                          handleDateSelect(date)
                        }
                      >
                        <span>
                          {date.getDate()}
                        </span>
                      </button>
                    );
                  }
                )}

              </div>
            </div>

            {/* 선택 날짜 */}
            <div className="selected-date-box">

              <div>
                <strong>
                  선택한 결석일
                </strong>

                <span>
                  {selectedDates.length}일
                </span>
              </div>

              {selectedDates.length === 0 ? (
                <p className="no-selected-date">
                  선택한 날짜 없음
                </p>
              ) : (
                <div className="selected-date-list">

                  {selectedDates.map(
                    (date) => (
                      <button
                        type="button"
                        key={date}
                        onClick={() =>
                          handleRemoveDate(date)
                        }
                      >
                        {formatDateKorean(
                          date
                        )}{" "}
                        ({getDayName(
                          new Date(
                            `${date}T00:00:00`
                          )
                        )})
                        ×
                      </button>
                    )
                  )}

                </div>
              )}

            </div>

          </section>

        </div>

        {/* ========================================
            RIGHT
        ======================================== */}
        <aside className="register-sidebar">

          <section className="condition-card">

            <h2>양도 조건</h2>

            <div className="condition-list">

              <div className="condition-row">
                <span>
                  선택한 결석일
                </span>

                <strong>
                  {selectedDates.length}일
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

              <div className="condition-row">
                <span>
                  양도 시 획득 코인
                </span>

                <strong className="coin-reward">
                  +2 coin
                </strong>
              </div>

            </div>

            {/* --------------------------------------
                미리보기
            -------------------------------------- */}
            <div className="preview-section">

              <h3>
                원데이 목록 노출 미리보기
              </h3>

              <div className="preview-card">

                <div className="preview-top">

                  <span className="preview-icon">
                    🏃
                  </span>

                  <span className="preview-status">
                    신청 가능
                  </span>

                </div>

                <strong>
                  {previewProgramName}
                </strong>

                <span className="preview-facility">
                  {previewFacilityName}
                </span>

                <div className="preview-divider" />

                <div className="preview-date">

                  <span>
                    양도 날짜
                  </span>

                  <strong>
                    {selectedDates.length > 0
                      ? selectedDates
                          .map(
                            formatDateKorean
                          )
                          .join(", ")
                      : "날짜를 선택해주세요."}
                  </strong>

                </div>

                <div className="preview-bottom">

                  <span>
                    -1 coin
                  </span>

                  <button
                    type="button"
                    disabled
                  >
                    신청
                  </button>

                </div>

              </div>

            </div>

            {/* --------------------------------------
                안내
            -------------------------------------- */}
            <div className="register-notice">

              <p>
                신청자가 확정되면 코인이 지급됩니다.
              </p>

              <p>
                수업일 24시간 이내에는 양도 글을
                삭제할 수 없습니다.
              </p>

            </div>

            {/* --------------------------------------
                등록
            -------------------------------------- */}
            <button
              type="button"
              className="submit-register-button"
              disabled={
                registering ||
                !selectedProgram ||
                selectedDates.length === 0
              }
              onClick={handleRegister}
            >
              {registering
                ? "등록 중..."
                : "양도 글 등록"}
            </button>

          </section>

        </aside>
      </div>
    </div>
  );
}

export default OnedayRegister;