import { useEffect, useMemo, useState } from "react";

import {
  getMyInfo,
  getMyPrograms,
  getFacilitiesByRegion,
  getSubFacilities,
  getProgramsByFacility,
  getProgramsBySubFacility,
  createMyProgram,
  updateMyInfo,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview as deleteReviewApi,
} from "../api/user";

import "./MyPage.css";


/* =========================
   기본 데이터
========================= */

const REGIONS = [
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
];

const DAYS = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
];

const MY_PAGE_MENUS = [
  {
    key: "programs",
    label: "나의 수강 프로그램 현황",
  },
  {
    key: "register",
    label: "수강 프로그램 등록하기",
  },
  {
    key: "oneday",
    label: "신청한 원데이 클래스",
  },
  {
    key: "reviews",
    label: "내가 쓴 리뷰",
  },
  {
    key: "favorites",
    label: "찜한 시설",
  },
  {
    key: "coins",
    label: "코인 내역",
  },
  {
    key: "settings",
    label: "환경설정",
  },
];


/* =========================
   날짜 관련 함수
========================= */

function formatDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function parseDate(dateString) {
  if (!dateString) {
    return null;
  }

  return new Date(
    `${dateString}T00:00:00`
  );
}


function getProgramDays(programDay) {
  if (!programDay) {
    return [];
  }

  return programDay
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean);
}


function isProgramOnDate(program, date) {
  if (
    !program.start_date ||
    !program.end_date
  ) {
    return false;
  }

  const start =
    parseDate(program.start_date);

  const end =
    parseDate(program.end_date);

  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (
    target < start ||
    target > end
  ) {
    return false;
  }

  const dayName =
    DAYS[target.getDay()];

  const programDays =
    getProgramDays(
      program.program_day
    );

  return programDays.includes(
    dayName
  );
}


/* =========================
   메인 MyPage
========================= */

function MyPage() {
  const [user, setUser] =
    useState(null);

  const [error, setError] =
    useState("");

  const [view, setView] =
    useState("programs");


  /* 수강 프로그램 */

  const [
    myPrograms,
    setMyPrograms,
  ] = useState([]);

  const [
    programsLoading,
    setProgramsLoading,
  ] = useState(true);


  /* 등록 폼 */

  const [region, setRegion] =
    useState("");

  const [
    facilities,
    setFacilities,
  ] = useState([]);

  const [
    facilityId,
    setFacilityId,
  ] = useState("");


  const [
    subFacilities,
    setSubFacilities,
  ] = useState([]);

  const [
    subfacilityId,
    setSubfacilityId,
  ] = useState("");


  const [
    programs,
    setPrograms,
  ] = useState([]);

  const [
    programId,
    setProgramId,
  ] = useState("");


  const [
    isDirectInput,
    setIsDirectInput,
  ] = useState(false);

  const [
    newProgramName,
    setNewProgramName,
  ] = useState("");


  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");


  const [
    startTime,
    setStartTime,
  ] = useState("");

  const [
    endTime,
    setEndTime,
  ] = useState("");


  const [
    selectedDays,
    setSelectedDays,
  ] = useState([]);


  const [
    proofFile,
    setProofFile,
  ] = useState(null);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);


  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  /* =========================
     사용자 정보 불러오기
  ========================= */

  useEffect(() => {
    const loadMyInfo = async () => {
      try {
        const data =
          await getMyInfo();

        setUser(data);
      } catch (err) {
        console.error(err);

        setError(
          "회원 정보를 불러오지 못했습니다."
        );
      }
    };

    loadMyInfo();
  }, []);


  /* =========================
     내 수강 프로그램 조회
  ========================= */

  useEffect(() => {
    const loadMyPrograms =
      async () => {
        try {
          setProgramsLoading(true);

          const data =
            await getMyPrograms();

          setMyPrograms(data);
        } catch (err) {
          console.error(
            "수강 프로그램 조회 실패:",
            err
          );
        } finally {
          setProgramsLoading(false);
        }
      };

    loadMyPrograms();
  }, []);


  /* =========================
     지역 → 시설
  ========================= */

  useEffect(() => {
    if (!region) {
      setFacilities([]);
      setFacilityId("");

      setSubFacilities([]);
      setSubfacilityId("");

      setPrograms([]);
      setProgramId("");

      setIsDirectInput(false);
      setNewProgramName("");

      return;
    }

    const loadFacilities =
      async () => {
        try {
          const data =
            await getFacilitiesByRegion(
              region
            );

          setFacilities(data);

          setFacilityId("");

          setSubFacilities([]);
          setSubfacilityId("");

          setPrograms([]);
          setProgramId("");

          setIsDirectInput(false);
          setNewProgramName("");
        } catch (err) {
          console.error(err);
        }
      };

    loadFacilities();

  }, [region]);


  /* =========================
     시설 → 세부시설
  ========================= */

  useEffect(() => {
    if (!facilityId) {
      setSubFacilities([]);
      setSubfacilityId("");

      setPrograms([]);
      setProgramId("");

      setIsDirectInput(false);
      setNewProgramName("");

      return;
    }

    const loadSubFacilities =
      async () => {
        try {
          const data =
            await getSubFacilities(
              facilityId
            );

          setSubFacilities(data);

          setSubfacilityId("");

          setPrograms([]);
          setProgramId("");

          setIsDirectInput(false);
          setNewProgramName("");


          if (data.length === 0) {
            const programData =
              await getProgramsByFacility(
                facilityId
              );

            setPrograms(programData);
          }
        } catch (err) {
          console.error(err);
        }
      };

    loadSubFacilities();

  }, [facilityId]);


  /* =========================
     세부시설 → 프로그램
  ========================= */

  useEffect(() => {
    if (
      !facilityId ||
      !subfacilityId
    ) {
      return;
    }

    const loadPrograms =
      async () => {
        try {
          const data =
            await getProgramsBySubFacility(
              facilityId,
              subfacilityId
            );

          setPrograms(data);

          setProgramId("");

          setIsDirectInput(false);

          setNewProgramName("");
        } catch (err) {
          console.error(err);
        }
      };

    loadPrograms();

  }, [
    facilityId,
    subfacilityId,
  ]);


  const selectedFacility =
    facilities.find(
      (facility) =>
        String(facility.id) ===
        String(facilityId)
    );


  const selectedSubFacility =
    subFacilities.find(
      (subfacility) =>
        String(subfacility.id) ===
        String(subfacilityId)
    );


  const selectedProgram =
    programs.find(
      (program) =>
        String(program.id) ===
        String(programId)
    );


  const displayProgramName =
    isDirectInput
      ? newProgramName
      : selectedProgram
          ?.program_name || "";


  /* =========================
     요일 선택
  ========================= */

  const toggleDay = (day) => {
    setSelectedDays(
      (current) => {
        if (
          current.includes(day)
        ) {
          return current.filter(
            (item) =>
              item !== day
          );
        }

        return [
          ...current,
          day,
        ];
      }
    );
  };


  /* =========================
     수강증
  ========================= */

  const validateFile = (file) => {
    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setSubmitError(
        "JPG 또는 PNG 파일만 첨부할 수 있습니다."
      );

      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setSubmitError(
        "수강증 파일은 10MB 이하만 첨부할 수 있습니다."
      );

      return;
    }

    setSubmitError("");

    setProofFile(file);
  };


  const handleFileChange =
    (event) => {
      const file =
        event.target.files?.[0];

      validateFile(file);
    };


  const handleDragOver =
    (event) => {
      event.preventDefault();

      setIsDragging(true);
    };


  const handleDragLeave =
    (event) => {
      event.preventDefault();

      setIsDragging(false);
    };


  const handleDrop =
    (event) => {
      event.preventDefault();

      setIsDragging(false);

      const file =
        event.dataTransfer
          .files?.[0];

      validateFile(file);
    };


  /* =========================
     등록 폼 초기화
  ========================= */

  const resetRegisterForm = () => {
    setRegion("");

    setFacilities([]);
    setFacilityId("");

    setSubFacilities([]);
    setSubfacilityId("");

    setPrograms([]);
    setProgramId("");

    setIsDirectInput(false);
    setNewProgramName("");

    setStartDate("");
    setEndDate("");

    setStartTime("");
    setEndTime("");

    setSelectedDays([]);

    setProofFile(null);

    setSubmitError("");
  };


  /* =========================
     프로그램 등록
  ========================= */

  const handleRegister =
    async () => {
      setSubmitError("");


      if (!region) {
        setSubmitError(
          "지역을 선택해주세요."
        );
        return;
      }


      if (!facilityId) {
        setSubmitError(
          "체육시설을 선택해주세요."
        );
        return;
      }


      if (
        subFacilities.length > 0 &&
        !subfacilityId
      ) {
        setSubmitError(
          "세부시설을 선택해주세요."
        );
        return;
      }


      if (
        !isDirectInput &&
        !programId
      ) {
        setSubmitError(
          "프로그램을 선택해주세요."
        );
        return;
      }


      if (
        isDirectInput &&
        !newProgramName.trim()
      ) {
        setSubmitError(
          "프로그램명을 입력해주세요."
        );
        return;
      }


      if (
        !startDate ||
        !endDate
      ) {
        setSubmitError(
          "수강 기간을 입력해주세요."
        );
        return;
      }


      if (
        startDate > endDate
      ) {
        setSubmitError(
          "수강 종료일은 시작일보다 빠를 수 없습니다."
        );
        return;
      }


      if (
        !startTime ||
        !endTime
      ) {
        setSubmitError(
          "수강 시간을 입력해주세요."
        );
        return;
      }


      if (
        selectedDays.length === 0
      ) {
        setSubmitError(
          "수강 요일을 선택해주세요."
        );
        return;
      }


      if (!proofFile) {
        setSubmitError(
          "수강 프로그램 등록을 위해 수강증 인증이 필요합니다."
        );
        return;
      }


      const formData =
        new FormData();


      formData.append(
        "start_date",
        startDate
      );

      formData.append(
        "end_date",
        endDate
      );

      formData.append(
        "program_day",
        selectedDays.join(",")
      );

      formData.append(
        "program_time",
        `${startTime} - ${endTime}`
      );

      formData.append(
        "proof_image",
        proofFile
      );


      if (subfacilityId) {
        formData.append(
          "subfacility",
          subfacilityId
        );
      }


      if (isDirectInput) {
        formData.append(
          "facility",
          facilityId
        );

        formData.append(
          "new_program_name",
          newProgramName.trim()
        );
      } else {
        formData.append(
          "program",
          programId
        );
      }


      try {
        setSubmitting(true);

        const createdProgram =
          await createMyProgram(
            formData
          );

        setMyPrograms(
          (current) => [
            createdProgram,
            ...current,
          ]
        );

        alert(
          "수강 프로그램이 등록되었습니다."
        );

        resetRegisterForm();

        setView("programs");

      } catch (err) {
        console.error(err);

        setSubmitError(
          "프로그램 등록에 실패했습니다. 입력 내용을 확인해주세요."
        );

      } finally {
        setSubmitting(false);
      }
    };


  if (error) {
    return (
      <div className="page">
        <div className="page-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="page">
        <div className="page-container">
          <p>
            회원 정보를 불러오는 중입니다.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="page">

      <div className="page-container">

        <div
          className="mypage-style-02"
        >

          <MyPageSidebar
            view={view}
            setView={setView}
            user={user}
          />


          <main
            className="mypage-style-01"
          >

            {view ===
              "programs" && (

              <ProgramStatusView
                myPrograms={
                  myPrograms
                }

                programsLoading={
                  programsLoading
                }

                onRegisterClick={() =>
                  setView(
                    "register"
                  )
                }
              />
            )}


            {view ===
              "register" && (

              <ProgramRegisterView
                region={region}
                setRegion={setRegion}

                facilities={
                  facilities
                }

                facilityId={
                  facilityId
                }

                setFacilityId={
                  setFacilityId
                }

                subFacilities={
                  subFacilities
                }

                subfacilityId={
                  subfacilityId
                }

                setSubfacilityId={
                  setSubfacilityId
                }

                programs={
                  programs
                }

                programId={
                  programId
                }

                setProgramId={
                  setProgramId
                }

                isDirectInput={
                  isDirectInput
                }

                setIsDirectInput={
                  setIsDirectInput
                }

                newProgramName={
                  newProgramName
                }

                setNewProgramName={
                  setNewProgramName
                }

                startDate={
                  startDate
                }

                setStartDate={
                  setStartDate
                }

                endDate={
                  endDate
                }

                setEndDate={
                  setEndDate
                }

                startTime={
                  startTime
                }

                setStartTime={
                  setStartTime
                }

                endTime={
                  endTime
                }

                setEndTime={
                  setEndTime
                }

                selectedDays={
                  selectedDays
                }

                toggleDay={
                  toggleDay
                }

                proofFile={
                  proofFile
                }

                setProofFile={
                  setProofFile
                }

                isDragging={
                  isDragging
                }

                handleFileChange={
                  handleFileChange
                }

                handleDragOver={
                  handleDragOver
                }

                handleDragLeave={
                  handleDragLeave
                }

                handleDrop={
                  handleDrop
                }

                selectedFacility={
                  selectedFacility
                }

                selectedSubFacility={
                  selectedSubFacility
                }

                displayProgramName={
                  displayProgramName
                }

                submitError={
                  submitError
                }

                submitting={
                  submitting
                }

                handleRegister={
                  handleRegister
                }

                handleCancel={() => {
                  resetRegisterForm();

                  setView(
                    "programs"
                  );
                }}
              />
            )}


            {view ===
              "oneday" && (

              <EmptyMenuView
                title="신청한 원데이 클래스"
                description="신청한 원데이 클래스 내역을 확인할 수 있습니다."
              />
            )}


            {view ===
              "reviews" && (

              <MyReviewsView
                myPrograms={
                  myPrograms
                }

                programsLoading={
                  programsLoading
                }
              />
            )}


            {view ===
              "favorites" && (

              <EmptyMenuView
                title="찜한 시설"
                description="찜한 공공체육시설을 확인할 수 있습니다."
              />
            )}


            {view ===
              "coins" && (

              <EmptyMenuView
                title="코인 내역"
                description="코인 적립 및 사용 내역을 확인할 수 있습니다."
              />
            )}


            {view ===
              "settings" && (

              <SettingsView
                user={user}
                setUser={
                  setUser
                }
              />
            )}

          </main>

        </div>

      </div>

    </div>
  );
}


/* =========================
   왼쪽 메뉴
========================= */

function MyPageSidebar({
  view,
  setView,
  user,
}) {
  return (
    <aside
      className="mypage-sidebar-style-07"
    >

      <div
        className="card mypage-sidebar-style-06"
        
      >

        <div
          className="card-body mypage-sidebar-style-05"
          
        >

          <div
            className="mypage-sidebar-style-04"
          >
            👤
          </div>


          <strong
            className="mypage-sidebar-style-03"
          >
            {user.name ||
              user.username}{" "}
            님
          </strong>


          <span
            className="mypage-sidebar-style-02"
          >
            보유 {user.coin} coin
          </span>

        </div>

      </div>


      <div className="card">

        <div
          className="card-body mypage-sidebar-style-01"
          
        >

          {MY_PAGE_MENUS.map(
            (menu) => {

              const active =
                view ===
                menu.key;


              return (
                <button
                  key={
                    menu.key
                  }

                  type="button"

                  onClick={() =>
                    setView(
                      menu.key
                    )
                  }

                  style={{
                    width: "100%",

                    padding:
                      "13px 15px",

                    border: "none",

                    borderRadius:
                      "9px",

                    background:
                      active
                        ? "#eaf0f7"
                        : "transparent",

                    color:
                      active
                        ? "#1d4e89"
                        : "#374151",

                    fontSize:
                      "14px",

                    fontWeight:
                      active
                        ? "700"
                        : "600",

                    textAlign:
                      "left",

                    cursor:
                      "pointer",
                  }}
                >
                  {menu.label}
                </button>
              );
            }
          )}

        </div>

      </div>

    </aside>
  );
}


/* =========================
   수강 프로그램 현황
========================= */

function ProgramStatusView({
  myPrograms,
  programsLoading,
  onRegisterClick,
}) {
  const today =
    useMemo(
      () => new Date(),
      []
    );


  const [
    calendarDate,
    setCalendarDate,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );


  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
  );


  const calendarDays =
    useMemo(() => {

      const year =
        calendarDate
          .getFullYear();

      const month =
        calendarDate
          .getMonth();


      const firstDay =
        new Date(
          year,
          month,
          1
        );


      const startDay =
        firstDay.getDay();


      const startDate =
        new Date(
          year,
          month,
          1 - startDay
        );


      const dates = [];


      for (
        let i = 0;
        i < 42;
        i += 1
      ) {
        dates.push(
          new Date(
            startDate
              .getFullYear(),

            startDate
              .getMonth(),

            startDate
              .getDate() + i
          )
        );
      }


      return dates;

    }, [calendarDate]);


  const selectedSchedules =
    useMemo(() => {

      return myPrograms.filter(
        (program) =>
          isProgramOnDate(
            program,
            selectedDate
          )
      );

    }, [
      myPrograms,
      selectedDate,
    ]);


  const getSchedulesForDate =
    (date) => {

      return myPrograms.filter(
        (program) =>
          isProgramOnDate(
            program,
            date
          )
      );
    };


  const moveMonth =
    (amount) => {

      const nextMonth =
        new Date(
          calendarDate
            .getFullYear(),

          calendarDate
            .getMonth() +
            amount,

          1
        );


      setCalendarDate(
        nextMonth
      );


      setSelectedDate(
        new Date(
          nextMonth
            .getFullYear(),

          nextMonth
            .getMonth(),

          1
        )
      );
    };


  const goToday = () => {
    const now =
      new Date();

    setCalendarDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );

    setSelectedDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
    );
  };


  const selectedDateText =
    `${selectedDate.getMonth() + 1}.${selectedDate.getDate()}(${DAYS[selectedDate.getDay()]})`;


  return (
    <>

      <div
        className="page-header program-status-style-24"

        
      >

        <div>
          <h1 className="page-title">
            나의 수강 프로그램 현황
          </h1>

          <p className="page-description">
            등록한 프로그램의 수강 일정과 현황을 확인할 수 있습니다.
          </p>
        </div>


        <button
          type="button"

          className="btn btn-primary btn-primary-shadow"

          onClick={
            onRegisterClick
          }
        >
          + 수강 프로그램 등록
        </button>

      </div>


      <div
        className="program-status-style-23"
      >

        <div className="card">

          <div className="card-body">

            <div
              className="program-status-style-22"
            >

              <button
                type="button"

                onClick={() =>
                  moveMonth(-1)
                }

                style={{
                  border: "none",
                  background:
                    "transparent",
                  cursor:
                    "pointer",
                  fontSize:
                    "22px",
                }}
              >
                ‹
              </button>


              <div
                className="program-status-style-21"
              >

                <h2
                  className="program-status-style-20"
                >
                  {calendarDate.getFullYear()}년{" "}
                  {calendarDate.getMonth() + 1}월
                </h2>


                <button
                  type="button"

                  className="btn btn-outline program-status-style-19"

                  

                  onClick={
                    goToday
                  }
                >
                  오늘
                </button>

              </div>


              <button
                type="button"

                onClick={() =>
                  moveMonth(1)
                }

                style={{
                  border: "none",
                  background:
                    "transparent",
                  cursor:
                    "pointer",
                  fontSize:
                    "22px",
                }}
              >
                ›
              </button>

            </div>


            <div
              className="program-status-style-18"
            >

              {DAYS.map(
                (day, index) => (

                  <div
                    key={day}

                    style={{
                      padding:
                        "10px 4px",

                      textAlign:
                        "center",

                      fontSize:
                        "12px",

                      fontWeight:
                        "700",

                      color:
                        index === 0
                          ? "#df5555"
                          : index === 6
                          ? "#4878c9"
                          : "#666",

                      background:
                        "#fafbfc",

                      borderRight:
                        "1px solid #e8ebef",

                      borderBottom:
                        "1px solid #e8ebef",
                    }}
                  >
                    {day}
                  </div>
                )
              )}


              {calendarDays.map(
                (date) => {

                  const dateKey =
                    formatDateKey(
                      date
                    );


                  const selectedKey =
                    formatDateKey(
                      selectedDate
                    );


                  const todayKey =
                    formatDateKey(
                      today
                    );


                  const isCurrentMonth =
                    date.getMonth() ===
                    calendarDate.getMonth();


                  const schedules =
                    getSchedulesForDate(
                      date
                    );


                  const isSelected =
                    dateKey ===
                    selectedKey;


                  const isToday =
                    dateKey ===
                    todayKey;


                  return (
                    <button
                      key={dateKey}

                      type="button"

                      onClick={() =>
                        setSelectedDate(
                          new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate()
                          )
                        )
                      }

                      style={{
                        minHeight:
                          "95px",

                        padding:
                          "8px",

                        border:
                          "none",

                        borderRight:
                          "1px solid #e8ebef",

                        borderBottom:
                          "1px solid #e8ebef",

                        background:
                          isSelected
                            ? "#f3f7fc"
                            : "#fff",

                        textAlign:
                          "left",

                        cursor:
                          "pointer",
                      }}
                    >

                      <span
                        style={{
                          width:
                            "25px",

                          height:
                            "25px",

                          borderRadius:
                            "50%",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          marginBottom:
                            "6px",

                          fontSize:
                            "12px",

                          background:
                            isToday
                              ? "#1d4e89"
                              : "transparent",

                          color:
                            isToday
                              ? "#fff"
                              : isCurrentMonth
                              ? "#333"
                              : "#b7bdc7",
                        }}
                      >
                        {
                          date.getDate()
                        }
                      </span>


                      {schedules
                        .slice(0, 2)
                        .map(
                          (program) => (

                            <div
                              key={
                                program.id
                              }

                              className="program-status-style-17"
                            >
                              {
                                program.program_name
                              }
                            </div>
                          )
                        )}

                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>


        <div className="card">

          <div className="card-body">

            <span
              className="program-status-style-16"
            >
              선택한 날짜
            </span>


            <h2
              className="program-status-style-15"
            >
              {
                selectedDateText
              }{" "}
              일정
            </h2>


            {programsLoading ? (

              <p>
                일정을 불러오는 중입니다.
              </p>

            ) : selectedSchedules.length ===
              0 ? (

              <div
                className="program-status-style-14"
              >

                <div
                  className="program-status-style-13"
                >
                  🗓️
                </div>

                <p>
                  등록된 일정이 없습니다.
                </p>

              </div>

            ) : (

              <div
                className="program-status-style-12"
              >

                {selectedSchedules.map(
                  (program) => (

                    <div
                      key={
                        program.id
                      }

                      className="program-status-style-11"
                    >

                      <strong>
                        {
                          program.program_name
                        }
                      </strong>


                      <div
                        className="program-status-style-10"
                      >

                        <div>
                          {
                            program.facility_name
                          }
                        </div>


                        {program.subfacility_name && (

                          <div>
                            {
                              program.subfacility_name
                            }
                          </div>
                        )}


                        <div
                          className="program-status-style-09"
                        >
                          {
                            program.program_time ||
                            "-"
                          }
                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

      </div>


      <div className="card">

        <div className="card-body">

          <h2
            className="program-status-style-08"
          >
            등록한 수강 프로그램
          </h2>


          <p
            className="program-status-style-07"
          >
            총 {myPrograms.length}개의 프로그램
          </p>


          {!programsLoading &&
            myPrograms.length ===
              0 && (

              <div
                className="program-status-style-06"
              >
                등록된 수강 프로그램이 없습니다.
              </div>
            )}


          {!programsLoading &&
            myPrograms.length >
              0 && (

              <div
                className="program-status-style-05"
              >

                {myPrograms.map(
                  (program) => {

                    const status =
                      getStatusInfo(
                        program.status
                      );


                    return (
                      <div
                        key={
                          program.id
                        }

                        className="program-status-style-04"
                      >

                        <div
                          className="program-status-style-03"
                        >

                          <div>

                            <strong>
                              {
                                program.program_name
                              }
                            </strong>


                            <p
                              className="program-status-style-02"
                            >
                              {
                                program.facility_name
                              }
                            </p>

                          </div>


                          <span
                            style={{
                              padding:
                                "5px 9px",

                              borderRadius:
                                "20px",

                              background:
                                status.background,

                              color:
                                status.color,

                              fontSize:
                                "12px",

                              fontWeight:
                                "700",

                              height:
                                "fit-content",
                            }}
                          >
                            {
                              status.text
                            }
                          </span>

                        </div>


                        <div
                          className="program-status-style-01"
                        >

                          <ProgramInfoRow
                            label="요일"

                            value={
                              program.program_day
                                ? program.program_day
                                    .split(",")
                                    .join(" · ")
                                : "-"
                            }
                          />


                          <ProgramInfoRow
                            label="시간"

                            value={
                              program.program_time ||
                              "-"
                            }
                          />


                          <ProgramInfoRow
                            label="기간"

                            value={
                              program.start_date &&
                              program.end_date
                                ? `${program.start_date} ~ ${program.end_date}`
                                : "-"
                            }
                          />

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

        </div>

      </div>

    </>
  );
}


function getStatusInfo(status) {
  if (
    status ===
    "approved"
  ) {
    return {
      text:
        "진행중",
      background:
        "#eaf7ef",
      color:
        "#218653",
    };
  }


  if (
    status ===
    "rejected"
  ) {
    return {
      text:
        "반려",
      background:
        "#fff0f0",
      color:
        "#c63c3c",
    };
  }


  return {
    text:
      "승인대기",
    background:
      "#fff6df",
    color:
      "#a46b00",
  };
}


function ProgramInfoRow({
  label,
  value,
}) {
  return (
    <div
      className="program-info-style-02"
    >

      <span
        className="program-info-style-01"
      >
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================
   내가 쓴 리뷰
========================= */

function MyReviewsView({
  myPrograms,
  programsLoading,
}) {
  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(true);

  const [
    sortType,
    setSortType,
  ] = useState("latest");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    reviewMode,
    setReviewMode,
  ] = useState("write");

  const [
    editingReview,
    setEditingReview,
  ] = useState(null);

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);


  /*
  Review 모델에는 program FK가 없기 때문에
  facility / subfacility 기준으로
  내가 등록한 수강 프로그램과 다시 연결해서
  프로그램명을 화면에 표시한다.
  */
  const normalizeReview = (
    review,
    fallback = {}
  ) => {
    const preferredProgram =
      fallback.myProgramId
        ? myPrograms.find(
            (program) =>
              String(program.id) ===
              String(
                fallback.myProgramId
              )
          )
        : null;

    const matchedProgram =
      preferredProgram ||
      myPrograms.find(
        (program) => {
          const sameFacility =
            String(
              program.facility_id
            ) ===
            String(
              review.facility
            );

          const reviewSubfacility =
            review.subfacility ?? "";

          const programSubfacility =
            program.subfacility ?? "";

          const sameSubfacility =
            String(
              programSubfacility
            ) ===
            String(
              reviewSubfacility
            );

          return (
            sameFacility &&
            sameSubfacility
          );
        }
      );

    const createdAt =
      review.created_at
        ? new Date(
            review.created_at
          )
        : new Date();

    const date =
      `${createdAt.getFullYear()}.${String(
        createdAt.getMonth() + 1
      ).padStart(2, "0")}.${String(
        createdAt.getDate()
      ).padStart(2, "0")}`;

    return {
      id:
        review.id,

      myProgramId:
        matchedProgram?.id ||
        fallback.myProgramId ||
        "",

      programId:
        matchedProgram?.program ||
        fallback.programId ||
        "",

      programName:
        matchedProgram?.program_name ||
        fallback.programName ||
        "",

      facilityId:
        review.facility,

      facilityName:
        review.facility_name ||
        fallback.facilityName ||
        "",

      subfacilityId:
        review.subfacility,

      subfacilityName:
        review.subfacility_name ||
        fallback.subfacilityName ||
        "",

      rating:
        review.rating,

      content:
        review.content,

      createdAt:
        review.created_at
          ? new Date(
              review.created_at
            ).getTime()
          : Date.now(),

      date,

      /*
      현재 Review 모델에는
      이미지 필드가 없기 때문에
      사진은 DB 저장 불가.
      */
      image:
        fallback.image ||
        "",
    };
  };


  /* =========================
     DB에서 내가 쓴 리뷰 조회
  ========================= */

  useEffect(() => {
    if (programsLoading) {
      return;
    }

    const loadReviews =
      async () => {
        try {
          setReviewsLoading(
            true
          );

          const data =
            await getMyReviews();

          const normalized =
            data.map(
              (review) =>
                normalizeReview(
                  review
                )
            );

          setReviews(
            normalized
          );

        } catch (err) {
          console.error(
            "리뷰 조회 실패:",
            err
          );

        } finally {
          setReviewsLoading(
            false
          );
        }
      };

    loadReviews();

  }, [
    programsLoading,
    myPrograms,
  ]);


  const sortedReviews =
    [...reviews].sort(
      (a, b) => {
        if (
          sortType ===
          "rating"
        ) {
          return (
            b.rating -
            a.rating
          );
        }

        return (
          b.createdAt -
          a.createdAt
        );
      }
    );


  const openWrite =
    () => {
      setReviewMode(
        "write"
      );

      setEditingReview(
        null
      );

      setModalOpen(true);
    };


  const openEdit =
    (review) => {
      setReviewMode(
        "edit"
      );

      setEditingReview(
        review
      );

      setModalOpen(true);
    };


  /* =========================
     리뷰 작성 / 수정
  ========================= */

  const saveReview =
    async (data) => {
      try {
        const requestData = {
          facility:
            Number(
              data.facilityId
            ),

          subfacility:
            data.subfacilityId
              ? Number(
                  data.subfacilityId
                )
              : null,

          rating:
            Number(
              data.rating
            ),

          content:
            data.content,
        };


        if (
          reviewMode ===
          "write"
        ) {
          const created =
            await createReview(
              requestData
            );

          const normalized =
            normalizeReview(
              created,
              data
            );

          setReviews(
            (current) => [
              normalized,
              ...current,
            ]
          );

        } else {
          const updated =
            await updateReview(
              editingReview.id,
              requestData
            );

          const normalized =
            normalizeReview(
              updated,
              data
            );

          setReviews(
            (current) =>
              current.map(
                (item) =>
                  item.id ===
                  editingReview.id
                    ? normalized
                    : item
              )
          );
        }


        setModalOpen(false);

        setEditingReview(null);

      } catch (err) {
        console.error(
          "리뷰 저장 실패:",
          err
        );

        alert(
          "리뷰 저장에 실패했습니다. 입력 내용을 확인해주세요."
        );
      }
    };


  /* =========================
     리뷰 삭제
  ========================= */

  const handleDeleteReview =
    async () => {
      if (!deleteTarget) {
        return;
      }

      try {
        await deleteReviewApi(
          deleteTarget.id
        );

        setReviews(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                deleteTarget.id
            )
        );

        setDeleteTarget(
          null
        );

      } catch (err) {
        console.error(
          "리뷰 삭제 실패:",
          err
        );

        alert(
          "리뷰 삭제에 실패했습니다."
        );
      }
    };


  return (
    <>
      <div
        className="my-reviews-style-14"
      >
        <div
          className="my-reviews-style-13"
        >
          <h1
            className="my-reviews-style-12"
          >
            내가 쓴 리뷰
          </h1>

          <span
            className="my-reviews-style-11"
          >
            {reviews.length}개
          </span>
        </div>


        <div
          className="my-reviews-style-10"
        >
          <SortButton
            active={
              sortType ===
              "latest"
            }
            onClick={() =>
              setSortType(
                "latest"
              )
            }
          >
            최신순
          </SortButton>

          <SortButton
            active={
              sortType ===
              "rating"
            }
            onClick={() =>
              setSortType(
                "rating"
              )
            }
          >
            별점순
          </SortButton>
        </div>
      </div>


      {programsLoading ||
      reviewsLoading ? (
        <div
          className="card my-reviews-style-09"
          
        >
          리뷰를 불러오는 중입니다.
        </div>
      ) : reviews.length ===
        0 ? (
        <div
          className="card my-reviews-style-08"
          
        >
          <div
            className="my-reviews-style-07"
          >
            ⭐
          </div>

          <strong
            className="my-reviews-style-06"
          >
            아직 작성한 리뷰가 없습니다.
          </strong>

          <p
            className="my-reviews-style-05"
          >
            내가 등록한 수강 프로그램에 리뷰를 남겨보세요.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            disabled={
              myPrograms.length === 0
            }
            onClick={
              openWrite
            }
          >
            리뷰 쓰기
          </button>

          {myPrograms.length ===
            0 && (
            <p
              className="my-reviews-style-04"
            >
              리뷰 작성 전 수강 프로그램을 먼저 등록해주세요.
            </p>
          )}
        </div>
      ) : (
        <div
          className="my-reviews-style-03"
        >
          {sortedReviews.map(
            (review) => (
              <ReviewCard
                key={
                  review.id
                }
                review={
                  review
                }
                onEdit={() =>
                  openEdit(
                    review
                  )
                }
                onDelete={() =>
                  setDeleteTarget(
                    review
                  )
                }
              />
            )
          )}
        </div>
      )}


      {reviews.length >
        0 && (
        <div
          className="my-reviews-style-02"
        >
          <span
            className="my-reviews-style-01"
          >
            내가 등록한 수강 프로그램에 리뷰를 남겨보세요.
          </span>

          <button
            type="button"
            className="btn btn-primary"
            disabled={
              myPrograms.length ===
              0
            }
            onClick={
              openWrite
            }
          >
            리뷰 쓰기
          </button>
        </div>
      )}


      {modalOpen && (
        <ReviewFormModal
          mode={
            reviewMode
          }
          review={
            editingReview
          }
          myPrograms={
            myPrograms
          }
          onClose={() => {
            setModalOpen(
              false
            );

            setEditingReview(
              null
            );
          }}
          onSave={
            saveReview
          }
        />
      )}


      {deleteTarget && (
        <ReviewDeleteModal
          review={
            deleteTarget
          }
          onCancel={() =>
            setDeleteTarget(
              null
            )
          }
          onDelete={
            handleDeleteReview
          }
        />
      )}
    </>
  );
}

/* =========================
   리뷰 카드
========================= */

function ReviewCard({
  review,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className="review-card-style-13"
    >

      <div
        className="review-card-style-12"
      >

        {review.image ? (

          <img
            src={
              review.image
            }

            alt={
              review.facilityName
            }

            className="review-card-style-11"
          />

        ) : (

          <div
            className="review-card-style-10"
          >
            🏃
          </div>
        )}

      </div>


      <div>

        <div
          className="review-card-style-09"
        >

          <strong>
            {
              review.facilityName
            }
          </strong>


          {review.subfacilityName && (

            <span
              className="review-card-style-08"
            >
              {
                review.subfacilityName
              }
            </span>
          )}

        </div>


        <div
          className="review-card-style-07"
        >
          {
            review.programName
          }
        </div>


        <div
          className="review-card-style-06"
        >

          <ReviewStars
            rating={
              review.rating
            }
          />


          <span
            className="review-card-style-05"
          >
            {review.date}
          </span>

        </div>


        <p
          className="review-card-style-04"
        >
          {
            review.content
          }
        </p>

      </div>


      <div
        className="review-card-style-03"
      >

        <button
          type="button"

          onClick={
            onEdit
          }

          className="review-card-style-02"
        >
          수정
        </button>


        <button
          type="button"

          onClick={
            onDelete
          }

          className="review-card-style-01"
        >
          삭제
        </button>

      </div>

    </div>
  );
}


/* =========================
   리뷰 작성 / 수정창
========================= */

function ReviewFormModal({
  mode,
  review,
  myPrograms,
  onClose,
  onSave,
}) {
  const [
    myProgramId,
    setMyProgramId,
  ] = useState(
    review?.myProgramId
      ? String(
          review.myProgramId
        )
      : ""
  );


  const [
    rating,
    setRating,
  ] = useState(
    review?.rating ||
    0
  );


  const [
    hoverRating,
    setHoverRating,
  ] = useState(0);


  const [
    content,
    setContent,
  ] = useState(
    review?.content ||
    ""
  );


  const [
    image,
    setImage,
  ] = useState(
    review?.image ||
    ""
  );


  const [
    imagePreview,
    setImagePreview,
  ] = useState(
    review?.image ||
    ""
  );


  const [
    formError,
    setFormError,
  ] = useState("");


  const selectedMyProgram =
    myPrograms.find(
      (program) =>
        String(program.id) ===
        String(myProgramId)
    );


  const handleImageChange =
    (event) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      if (
        ![
          "image/jpeg",
          "image/png",
        ].includes(
          file.type
        )
      ) {
        setFormError(
          "JPG 또는 PNG 이미지만 첨부할 수 있습니다."
        );

        return;
      }


      if (
        file.size >
        10 * 1024 * 1024
      ) {
        setFormError(
          "이미지는 10MB 이하만 첨부할 수 있습니다."
        );

        return;
      }


      const url =
        URL.createObjectURL(
          file
        );


      setImage(url);

      setImagePreview(url);

      setFormError("");
    };


  const handleSubmit =
    () => {

      if (!selectedMyProgram) {
        setFormError(
          "수강 프로그램을 선택해주세요."
        );

        return;
      }


      if (
        rating === 0
      ) {
        setFormError(
          "별점을 선택해주세요."
        );

        return;
      }


      if (
        !content.trim()
      ) {
        setFormError(
          "리뷰 내용을 입력해주세요."
        );

        return;
      }


      onSave({
        myProgramId:
          selectedMyProgram.id,

        programId:
          selectedMyProgram.program,

        programName:
          selectedMyProgram.program_name,

        facilityId:
          selectedMyProgram.facility_id,

        facilityName:
          selectedMyProgram.facility_name,

        subfacilityId:
          selectedMyProgram.subfacility,

        subfacilityName:
          selectedMyProgram.subfacility_name ||
          "",

        rating,

        content:
          content.trim(),

        image,
      });
    };


  return (
    <div
      className="review-form-modal-style-18"
    >

      <div
        className="review-form-modal-style-17"
      >

        <div
          className="review-form-modal-style-16"
        >

          <div>

            <h2
              className="review-form-modal-style-15"
            >
              {mode ===
              "write"
                ? "리뷰 쓰기"
                : "리뷰 수정"}
            </h2>


            <p
              className="review-form-modal-style-14"
            >
              내가 등록한 수강 프로그램에 대한 후기를 남겨주세요.
            </p>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            className="review-form-modal-style-13"
          >
            ×
          </button>

        </div>


        <div
          className="review-form-modal-style-12"
        >

          <div className="form-group">

            <label className="form-label">
              수강 프로그램
            </label>


            <select
              className="select"

              value={
                myProgramId
              }

              onChange={(
                event
              ) => {
                setMyProgramId(
                  event.target.value
                );

                setFormError(
                  ""
                );
              }}
            >

              <option value="">
                리뷰를 작성할 프로그램을 선택해주세요
              </option>


              {myPrograms.map(
                (program) => (

                  <option
                    key={
                      program.id
                    }

                    value={
                      program.id
                    }
                  >
                    {program.facility_name}
                    {" · "}
                    {program.program_name}

                    {program.subfacility_name
                      ? ` · ${program.subfacility_name}`
                      : ""}
                  </option>
                )
              )}

            </select>

          </div>


          {selectedMyProgram && (

            <div
              className="review-form-modal-style-11"
            >

              <ReviewProgramRow
                label="시설"
                value={
                  selectedMyProgram.facility_name
                }
              />


              <ReviewProgramRow
                label="세부시설"
                value={
                  selectedMyProgram.subfacility_name ||
                  "없음"
                }
              />


              <ReviewProgramRow
                label="프로그램"
                value={
                  selectedMyProgram.program_name
                }
              />


              <ReviewProgramRow
                label="요일"
                value={
                  selectedMyProgram.program_day
                    ? selectedMyProgram.program_day
                        .split(",")
                        .join(" · ")
                    : "-"
                }
              />


              <ReviewProgramRow
                label="시간"
                value={
                  selectedMyProgram.program_time ||
                  "-"
                }
              />

            </div>
          )}


          <div className="form-group">

            <label className="form-label">
              별점
            </label>


            <div
              className="review-form-modal-style-10"
            >

              {[1, 2, 3, 4, 5].map(
                (star) => {

                  const active =
                    star <=
                    (
                      hoverRating ||
                      rating
                    );


                  return (
                    <button
                      key={
                        star
                      }

                      type="button"

                      onMouseEnter={() =>
                        setHoverRating(
                          star
                        )
                      }

                      onMouseLeave={() =>
                        setHoverRating(
                          0
                        )
                      }

                      onClick={() =>
                        setRating(
                          star
                        )
                      }

                      style={{
                        border:
                          "none",

                        background:
                          "transparent",

                        cursor:
                          "pointer",

                        fontSize:
                          "31px",

                        padding:
                          0,

                        color:
                          active
                            ? "#ffa526"
                            : "#d9dee6",
                      }}
                    >
                      ★
                    </button>
                  );
                }
              )}

            </div>

          </div>


          <div className="form-group">

            <label className="form-label">
              리뷰 내용
            </label>


            <textarea
              className="textarea"

              value={
                content
              }

              maxLength={
                500
              }

              placeholder="시설이나 프로그램을 이용하면서 좋았던 점이나 아쉬웠던 점을 자유롭게 작성해주세요."

              onChange={(
                event
              ) =>
                setContent(
                  event.target.value
                )
              }

              style={{
                minHeight:
                  "140px",

                resize:
                  "vertical",
              }}
            />


            <div
              className="review-form-modal-style-09"
            >
              {content.length} / 500
            </div>

          </div>


          <div className="form-group">

            <label className="form-label">
              사진
            </label>


            {imagePreview ? (

              <div
                className="review-form-modal-style-08"
              >

                <img
                  src={
                    imagePreview
                  }

                  alt="리뷰"

                  className="review-form-modal-style-07"
                />


                <button
                  type="button"

                  onClick={() => {
                    setImage("");

                    setImagePreview(
                      ""
                    );
                  }}

                  style={{
                    position:
                      "absolute",

                    top:
                      "-8px",

                    right:
                      "-8px",

                    width:
                      "25px",

                    height:
                      "25px",

                    border:
                      "none",

                    borderRadius:
                      "50%",

                    background:
                      "#333",

                    color:
                      "#fff",

                    cursor:
                      "pointer",
                  }}
                >
                  ×
                </button>

              </div>

            ) : (

              <label
                className="review-form-modal-style-06"
              >

                <input
                  type="file"

                  accept=".jpg,.jpeg,.png"

                  className="review-form-modal-style-05"

                  onChange={
                    handleImageChange
                  }
                />


                <span
                  className="review-form-modal-style-04"
                >
                  +
                </span>


                <span
                  className="review-form-modal-style-03"
                >
                  사진 추가
                </span>

              </label>
            )}

          </div>


          {formError && (

            <div
              className="review-form-modal-style-02"
            >
              {formError}
            </div>
          )}

        </div>


        <div
          className="review-form-modal-style-01"
        >

          <button
            type="button"

            className="btn btn-outline"

            onClick={
              onClose
            }
          >
            취소
          </button>


          <button
            type="button"

            className="btn btn-primary"

            onClick={
              handleSubmit
            }
          >
            {mode ===
            "write"
              ? "리뷰 등록"
              : "수정 완료"}
          </button>

        </div>

      </div>

    </div>
  );
}


function ReviewProgramRow({
  label,
  value,
}) {
  return (
    <div
      className="review-program-row-style-02"
    >

      <span
        className="review-program-row-style-01"
      >
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =========================
   리뷰 삭제
========================= */

function ReviewDeleteModal({
  review,
  onCancel,
  onDelete,
}) {
  return (
    <div
      className="review-delete-modal-style-06"
    >

      <div
        className="review-delete-modal-style-05"
      >

        <h2
          className="review-delete-modal-style-04"
        >
          리뷰를 삭제할까요?
        </h2>


        <p
          className="review-delete-modal-style-03"
        >
          <strong>
            {
              review.facilityName
            }
          </strong>
          의{" "}
          <strong>
            {
              review.programName
            }
          </strong>
          에 작성한 리뷰가 삭제됩니다.
        </p>


        <div
          className="review-delete-modal-style-02"
        >

          <button
            type="button"

            className="btn btn-outline"

            onClick={
              onCancel
            }
          >
            취소
          </button>


          <button
            type="button"

            onClick={
              onDelete
            }

            className="review-delete-modal-style-01"
          >
            삭제하기
          </button>

        </div>

      </div>

    </div>
  );
}


function SortButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"

      onClick={
        onClick
      }

      style={{
        padding:
          "9px 17px",

        borderRadius:
          "22px",

        border:
          active
            ? "1px solid #1d4e89"
            : "1px solid #dce2ea",

        background:
          active
            ? "#1d4e89"
            : "#fff",

        color:
          active
            ? "#fff"
            : "#4b5563",

        cursor:
          "pointer",

        fontWeight:
          "700",
      }}
    >
      {children}
    </button>
  );
}


function ReviewStars({
  rating,
}) {
  return (
    <div
      className="review-stars-style-01"
    >

      {[1, 2, 3, 4, 5].map(
        (star) => (

          <span
            key={
              star
            }

            style={{
              color:
                star <= rating
                  ? "#ffa526"
                  : "#d9dee6",

              fontSize:
                "15px",
            }}
          >
            ★
          </span>
        )
      )}

    </div>
  );
}


/* =========================
   프로그램 등록 화면
========================= */

function ProgramRegisterView({
  region,
  setRegion,

  facilities,
  facilityId,
  setFacilityId,

  subFacilities,
  subfacilityId,
  setSubfacilityId,

  programs,
  programId,
  setProgramId,

  isDirectInput,
  setIsDirectInput,

  newProgramName,
  setNewProgramName,

  startDate,
  setStartDate,

  endDate,
  setEndDate,

  startTime,
  setStartTime,

  endTime,
  setEndTime,

  selectedDays,
  toggleDay,

  proofFile,
  setProofFile,

  isDragging,

  handleFileChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,

  selectedFacility,
  selectedSubFacility,
  displayProgramName,

  submitError,
  submitting,

  handleRegister,
  handleCancel,
}) {
  return (
    <>

      <div className="page-header">

        <h1 className="page-title">
          수강 프로그램 등록
        </h1>


        <p className="page-description">
          현재 수강 중인 정기 프로그램을 등록합니다.
        </p>

      </div>


      <div
        className="program-register-style-13"
      >

        <div className="card">

          <div className="card-body">

            <div className="form-group">

              <label className="form-label">
                지역 (구)
              </label>


              <select
                className="select"

                value={
                  region
                }

                onChange={(
                  event
                ) =>
                  setRegion(
                    event.target.value
                  )
                }
              >

                <option value="">
                  지역을 선택해주세요
                </option>


                {REGIONS.map(
                  (item) => (

                    <option
                      key={
                        item
                      }

                      value={
                        item
                      }
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="form-group">

              <label className="form-label">
                시설
              </label>


              <select
                className="select"

                value={
                  facilityId
                }

                disabled={
                  !region
                }

                onChange={(
                  event
                ) =>
                  setFacilityId(
                    event.target.value
                  )
                }
              >

                <option value="">
                  시설을 선택해주세요
                </option>


                {facilities.map(
                  (facility) => (

                    <option
                      key={
                        facility.id
                      }

                      value={
                        facility.id
                      }
                    >
                      {
                        facility.facility_name
                      }
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="form-group">

              <label className="form-label">
                세부시설
              </label>


              {facilityId &&
              subFacilities.length ===
                0 ? (

                <div
                  className="input program-register-style-12"

                  
                >
                  세부시설이 없는 시설입니다.
                </div>

              ) : (

                <select
                  className="select"

                  value={
                    subfacilityId
                  }

                  disabled={
                    !facilityId
                  }

                  onChange={(
                    event
                  ) =>
                    setSubfacilityId(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    세부시설을 선택해주세요
                  </option>


                  {subFacilities.map(
                    (
                      subfacility
                    ) => (

                      <option
                        key={
                          subfacility.id
                        }

                        value={
                          subfacility.id
                        }
                      >
                        {
                          subfacility.subfacility_name
                        }
                      </option>
                    )
                  )}

                </select>
              )}

            </div>


            <div className="form-group">

              <label className="form-label">
                프로그램명
              </label>


              <select
                className="select"

                value={
                  isDirectInput
                    ? "__direct__"
                    : programId
                }

                disabled={
                  !facilityId ||
                  (
                    subFacilities.length >
                      0 &&
                    !subfacilityId
                  )
                }

                onChange={(
                  event
                ) => {

                  const value =
                    event.target.value;


                  if (
                    value ===
                    "__direct__"
                  ) {
                    setProgramId("");

                    setIsDirectInput(
                      true
                    );

                    return;
                  }


                  setIsDirectInput(
                    false
                  );

                  setNewProgramName(
                    ""
                  );

                  setProgramId(
                    value
                  );
                }}
              >

                <option value="">
                  프로그램을 선택해주세요
                </option>


                {programs.map(
                  (program) => (

                    <option
                      key={
                        program.id
                      }

                      value={
                        program.id
                      }
                    >
                      {
                        program.program_name
                      }
                    </option>
                  )
                )}


                <option value="__direct__">
                  + 목록에 없어요 · 직접 입력
                </option>

              </select>


              {isDirectInput && (

                <input
                  className="input program-register-style-01"

                  type="text"

                  

                  placeholder="프로그램명을 직접 입력해주세요"

                  value={
                    newProgramName
                  }

                  onChange={(
                    event
                  ) =>
                    setNewProgramName(
                      event.target.value
                    )
                  }
                />
              )}

            </div>


            <div className="form-group">

              <label className="form-label">
                수강 기간
              </label>


              <div
                className="program-register-style-11"
              >

                <input
                  className="input"

                  type="date"

                  value={
                    startDate
                  }

                  onChange={(
                    event
                  ) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                />


                <span
                  className="program-register-style-10"
                >
                  ~
                </span>


                <input
                  className="input"

                  type="date"

                  value={
                    endDate
                  }

                  onChange={(
                    event
                  ) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            <div className="form-group">

              <label className="form-label">
                수강 시간
              </label>


              <div
                className="program-register-style-11"
              >

                <input
                  className="input"

                  type="time"

                  value={
                    startTime
                  }

                  onChange={(
                    event
                  ) =>
                    setStartTime(
                      event.target.value
                    )
                  }
                />


                <span
                  className="program-register-style-10"
                >
                  ~
                </span>


                <input
                  className="input"

                  type="time"

                  value={
                    endTime
                  }

                  onChange={(
                    event
                  ) =>
                    setEndTime(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            <div className="form-group">

              <label className="form-label">
                수강 요일
              </label>


              <div
                className="program-register-style-09"
              >

                {DAYS.map(
                  (day) => {

                    const selected =
                      selectedDays.includes(
                        day
                      );


                    return (
                      <button
                        key={
                          day
                        }

                        type="button"

                        className={
                          selected
                            ? "btn btn-primary"
                            : "btn btn-secondary"
                        }

                        onClick={() =>
                          toggleDay(
                            day
                          )
                        }
                      >
                        {day}
                      </button>
                    );
                  }
                )}

              </div>

            </div>


            <div className="form-group">

              <label className="form-label">
                수강증 인증 <span className="program-register-style-08">*</span>
              </label>

              <p
                className="program-register-style-07"
              >
                수강 프로그램 등록을 위해 반드시 수강증을 첨부해주세요.
              </p>


              <label
                onDragOver={
                  handleDragOver
                }

                onDragLeave={
                  handleDragLeave
                }

                onDrop={
                  handleDrop
                }

                style={{
                  minHeight:
                    "145px",

                  border:
                    isDragging
                      ? "2px solid #1d4e89"
                      : "1px dashed #b8c7da",

                  borderRadius:
                    "12px",

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  cursor:
                    "pointer",
                }}
              >

                <input
                  type="file"

                  accept=".jpg,.jpeg,.png"

                  onChange={
                    handleFileChange
                  }

                  className="program-register-style-06"
                />


                <strong>
                  {proofFile
                    ? proofFile.name
                    : "파일 선택 또는 드래그"}
                </strong>


                <span
                  className="program-register-style-05"
                >
                  JPG, PNG · 10MB 이하
                </span>


                {proofFile && (

                  <button
                    type="button"

                    className="btn btn-outline program-register-style-01"

                    

                    onClick={(
                      event
                    ) => {

                      event.preventDefault();

                      event.stopPropagation();

                      setProofFile(
                        null
                      );
                    }}
                  >
                    첨부 취소
                  </button>
                )}

              </label>

            </div>

          </div>

        </div>


        <div
          className="card program-register-style-04"

          
        >

          <div className="card-body">

            <h2
              className="program-register-style-03"
            >
              등록 내용 확인
            </h2>


            <SummaryRow
              label="지역"
              value={
                region ||
                "-"
              }
            />


            <SummaryRow
              label="시설"
              value={
                selectedFacility
                  ?.facility_name ||
                "-"
              }
            />


            <SummaryRow
              label="세부시설"
              value={
                selectedSubFacility
                  ?.subfacility_name ||
                (
                  facilityId &&
                  subFacilities.length ===
                    0
                    ? "없음"
                    : "-"
                )
              }
            />


            <SummaryRow
              label="프로그램"
              value={
                displayProgramName ||
                "-"
              }
            />


            <SummaryRow
              label="기간"
              value={
                startDate &&
                endDate
                  ? `${startDate} ~ ${endDate}`
                  : "-"
              }
            />


            <SummaryRow
              label="요일"
              value={
                selectedDays.length
                  ? selectedDays.join(
                      " · "
                    )
                  : "-"
              }
            />


            <SummaryRow
              label="시간"
              value={
                startTime &&
                endTime
                  ? `${startTime} - ${endTime}`
                  : "-"
              }
            />


            <SummaryRow
              label="수강증"
              value={
                proofFile
                  ? proofFile.name
                  : "미첨부"
              }
            />


            {submitError && (

              <p
                className="program-register-style-02"
              >
                {submitError}
              </p>
            )}


            <button
              type="button"

              className="btn btn-primary btn-block"

              disabled={
                submitting
              }

              onClick={
                handleRegister
              }
            >
              {submitting
                ? "등록 중..."
                : "프로그램 등록하기"}
            </button>


            <button
              type="button"

              className="btn btn-outline btn-block program-register-style-01"

              

              onClick={
                handleCancel
              }
            >
              취소
            </button>

          </div>

        </div>

      </div>

    </>
  );
}


/* =========================
   준비중 메뉴
========================= */

function EmptyMenuView({
  title,
  description,
}) {
  return (
    <>

      <div className="page-header">

        <h1 className="page-title">
          {title}
        </h1>


        <p className="page-description">
          {description}
        </p>

      </div>


      <div className="card">

        <div className="card-body">

          <p
            className="empty-menu-style-01"
          >
            준비 중입니다.
          </p>

        </div>

      </div>

    </>
  );
}


/* =========================
   환경설정
========================= */

function SettingsView({
  user,
  setUser,
}) {
  const [form, setForm] =
    useState({
      name: user.name || "",
      birth: user.birth || "",
      phone: user.phone || "",
    });

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [
    settingError,
    setSettingError,
  ] = useState("");

  /*
    null     : 확인창 닫힘
    logout   : 로그아웃 확인창
    withdraw : 회원 탈퇴 확인창
  */
  const [confirmAction, setConfirmAction] =
    useState(null);

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,
          [name]: value,
        })
      );

      setMessage("");
      setSettingError("");
    };

  const handleSave =
    async () => {
      try {
        setSaving(true);
        setMessage("");
        setSettingError("");

        const updatedUser =
          await updateMyInfo({
            name: form.name,
            birth:
              form.birth || null,
            phone: form.phone,
          });
setUser(updatedUser);

        setMessage(
          "회원정보가 수정되었습니다."
        );
      } catch (err) {
        console.error(err);

        setSettingError(
          "회원정보 수정에 실패했습니다."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================
     실제 로그아웃 처리
  ========================= */
  const handleLogout = () => {
    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "refreshToken"
    );

    localStorage.removeItem(
      "username"
    );

    /* Navbar에 로그인 상태 변경 알림 */
    window.dispatchEvent(
      new Event("auth-change")
    );

    setConfirmAction(null);

    /* 로그아웃 후 메인으로 이동 */
    window.location.href = "/";
  };

  /* =========================
     회원 탈퇴 최종 처리

     현재 프로젝트에는 회원 탈퇴 API가
     아직 연결되어 있지 않으므로
     확인창까지만 구현한다.
  ========================= */
  const handleWithdraw = () => {
    setConfirmAction(null);

    alert(
      "회원 탈퇴 API는 아직 연결되지 않았습니다. 백엔드 탈퇴 API 연결 후 이 위치에서 실제 탈퇴 요청을 보내면 됩니다."
    );
  };

  return (
    <>
      {/* 상단 제목 */}
      <div
        className="settings-view-style-13"
      >
        <h1
          className="settings-view-style-12"
        >
          환경설정
        </h1>

        <p
          className="settings-view-style-11"
        >
          계정 정보와 로그인 설정을 관리할 수 있습니다.
        </p>
      </div>


      {/* =====================
          기본 정보
      ===================== */}
      <section
        className="settings-view-style-10"
      >
        <div
          className="settings-view-style-09"
        >
          <h2
            className="settings-view-style-08"
          >
            기본 정보
          </h2>

          <p
            className="settings-view-style-07"
          >
            서비스에서 사용하는 회원 정보를 관리합니다.
          </p>
        </div>


        <SettingFormRow
          label="아이디"
          description="로그인에 사용하는 아이디입니다."
        >
          <input
            className="input settings-view-style-06"
            value={user.username}
            disabled
          />
        </SettingFormRow>


        <SettingFormRow
          label="이메일"
          description="가입 시 등록한 이메일 주소입니다."
        >
          <input
            className="input settings-view-style-06"
            value={
              user.email || ""
            }
            disabled
          />
        </SettingFormRow>


        <SettingFormRow
          label="이름"
          description="서비스에 표시되는 이름입니다."
        >
          <input
            className="input settings-view-style-05"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
        </SettingFormRow>


        <SettingFormRow
          label="생년월일"
          description="회원님의 생년월일입니다."
        >
          <input
            className="input settings-view-style-05"
            type="date"
            name="birth"
            value={form.birth}
            onChange={handleChange}
          />
        </SettingFormRow>


        <SettingFormRow
          label="전화번호"
          description="연락 가능한 전화번호입니다."
        >
          <input
            className="input settings-view-style-05"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
        </SettingFormRow>


        {message && (
          <p
            className="settings-view-style-04"
          >
            {message}
          </p>
        )}


        {settingError && (
          <p
            className="settings-view-style-03"
          >
            {settingError}
          </p>
        )}


        <div
          className="settings-view-style-02"
        >
          <button
            type="button"
            className="btn btn-primary settings-view-style-01"
            disabled={saving}
            onClick={handleSave}
          >
            {saving
              ? "저장 중..."
              : "변경사항 저장"}
          </button>
        </div>
      </section>


      {/* =====================
          비밀번호 / 보안
      ===================== */}
      <SettingsSection title="보안">
        <SettingsActionRow
          title="비밀번호"
          description="주기적으로 비밀번호를 변경하면 계정을 더욱 안전하게 보호할 수 있습니다."
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              alert(
                "비밀번호 변경 기능은 추후 연결됩니다."
              )
            }
          >
            변경
          </button>
        </SettingsActionRow>
      </SettingsSection>


      <SettingsSection title="계정">
        <SettingsActionRow
          title="로그아웃"
          description="현재 기기에서 로그인된 계정을 로그아웃합니다."
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setConfirmAction("logout")
            }
          >
            로그아웃
          </button>
        </SettingsActionRow>

        <SettingsActionRow
          title="회원 탈퇴"
          description="탈퇴 후 회원 정보는 복구할 수 없습니다."
          danger
        >
          <button
            type="button"
            className="settings-danger-button"
            onClick={() =>
              setConfirmAction("withdraw")
            }
          >
            회원 탈퇴
          </button>
        </SettingsActionRow>
      </SettingsSection>


      {/* =====================
          로그아웃 확인 팝업
      ===================== */}
      {confirmAction === "logout" && (
        <ConfirmModal
          title="로그아웃하시겠습니까?"
          message="현재 계정에서 로그아웃됩니다. 다시 이용하려면 로그인이 필요합니다."
          confirmText="로그아웃"
          onCancel={() =>
            setConfirmAction(null)
          }
          onConfirm={handleLogout}
        />
      )}


      {/* =====================
          회원 탈퇴 확인 팝업
      ===================== */}
      {confirmAction === "withdraw" && (
        <ConfirmModal
          title="정말 회원 탈퇴하시겠습니까?"
          message="탈퇴 후에는 회원 정보를 복구할 수 없습니다. 계속 진행하시겠습니까?"
          confirmText="탈퇴하기"
          danger
          onCancel={() =>
            setConfirmAction(null)
          }
          onConfirm={handleWithdraw}
        />
      )}
    </>
  );
}


/* =========================
   확인 팝업
========================= */
function ConfirmModal({
  title,
  message,
  confirmText,
  danger = false,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="confirm-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div
          className={
            danger
              ? "confirm-icon confirm-icon--danger"
              : "confirm-icon"
          }
        >
          {danger ? "!" : "?"}
        </div>

        <h3
          id="confirm-modal-title"
          className="confirm-title"
        >
          {title}
        </h3>

        <p className="confirm-message">
          {message}
        </p>

        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-cancel-button"
            onClick={onCancel}
          >
            취소
          </button>

          <button
            type="button"
            className={
              danger
                ? "confirm-danger-button"
                : "confirm-primary-button"
            }
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


/* =========================
   기본 정보 한 줄
========================= */

function SettingFormRow({
  label,
  description,
  children,
}) {
  return (
    <div
      className="settings-form-row-style-04"
    >
      <div>
        <strong
          className="settings-form-row-style-03"
        >
          {label}
        </strong>

        {description && (
          <span
            className="settings-form-row-style-02"
          >
            {description}
          </span>
        )}
      </div>

      <div
        className="settings-form-row-style-01"
      >
        {children}
      </div>
    </div>
  );
}


/* =========================
   환경설정 섹션
========================= */
function SettingsSection({
  title,
  children,
}) {
  return (
    <section
      className="settings-section-style-03"
    >
      {/* 카테고리명 */}
      <div
        className="settings-section-style-02"
      >
        <span
          className="settings-section-style-01"
        >
          {title}
        </span>
      </div>

      {children}
    </section>
  );
}

/* =========================
   환경설정 액션 한 줄
========================= */
function SettingsActionRow({
  title,
  description,
  children,
  danger = false,
}) {
  return (
    <div
      className="settings-action-row-style-02"
    >
      <div>
        <strong
          style={{
            display: "block",
            fontSize: "17px",
            fontWeight: "700",
            color: danger
              ? "#b42318"
              : "#202632",
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </strong>

        <span
          style={{
            display: "block",
            marginTop: "7px",

            fontSize: "13px",
            lineHeight: "1.55",

            color: danger
              ? "#b77a75"
              : "#8b95a1",
          }}
        >
          {description}
        </span>
      </div>

      <div
        className="settings-action-row-style-01"
      >
        {children}
      </div>
    </div>
  );
}


/* =========================
   등록 요약 한 줄
   ========================= */
function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="summary-row">
      <strong className="summary-row-label">
        {label}
      </strong>

      <span className="summary-row-value">
        {value}
      </span>
    </div>
  );
}

export default MyPage;