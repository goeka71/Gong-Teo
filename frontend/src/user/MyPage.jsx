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
} from "../api/user";


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


      const data = {
        start_date:
          startDate,

        end_date:
          endDate,

        program_day:
          selectedDays.join(","),

        program_time:
          `${startTime} - ${endTime}`,
      };


      if (subfacilityId) {
        data.subfacility =
          Number(
            subfacilityId
          );
      }


      if (isDirectInput) {
        data.facility =
          Number(
            facilityId
          );

        data.new_program_name =
          newProgramName.trim();
      } else {
        data.program =
          Number(
            programId
          );
      }


      try {
        setSubmitting(true);

        const createdProgram =
          await createMyProgram(
            data
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
          style={{
            display: "flex",
            gap: "36px",
            alignItems:
              "flex-start",
          }}
        >

          <MyPageSidebar
            view={view}
            setView={setView}
            user={user}
          />


          <main
            style={{
              flex: 1,
              minWidth: 0,
            }}
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
      style={{
        width: "235px",
        flexShrink: 0,
      }}
    >

      <div
        className="card"
        style={{
          marginBottom: "16px",
        }}
      >

        <div
          className="card-body"
          style={{
            textAlign: "center",
            padding: "24px 18px",
          }}
        >

          <div
            style={{
              width: "64px",
              height: "64px",

              margin:
                "0 auto 13px",

              borderRadius:
                "50%",

              background:
                "#edf2f7",

              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",

              fontSize: "25px",
            }}
          >
            👤
          </div>


          <strong
            style={{
              display: "block",
              fontSize: "16px",
              marginBottom: "12px",
            }}
          >
            {user.name ||
              user.username}{" "}
            님
          </strong>


          <span
            style={{
              display:
                "inline-block",

              padding:
                "7px 13px",

              borderRadius:
                "20px",

              background:
                "#fff3d6",

              color:
                "#8a6200",

              fontSize:
                "13px",

              fontWeight:
                "700",
            }}
          >
            보유 {user.coin} coin
          </span>

        </div>

      </div>


      <div className="card">

        <div
          className="card-body"
          style={{
            padding: "10px",
          }}
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
        className="page-header"

        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap: "20px",
        }}
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
        style={{
          display: "grid",

          gridTemplateColumns:
            "minmax(0, 1.8fr) minmax(260px, 0.7fr)",

          gap: "20px",

          marginBottom:
            "22px",
        }}
      >

        <div className="card">

          <div className="card-body">

            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                marginBottom:
                  "22px",
              }}
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
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "21px",
                  }}
                >
                  {calendarDate.getFullYear()}년{" "}
                  {calendarDate.getMonth() + 1}월
                </h2>


                <button
                  type="button"

                  className="btn btn-outline"

                  style={{
                    padding:
                      "5px 10px",

                    fontSize:
                      "12px",
                  }}

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
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(7, 1fr)",

                borderTop:
                  "1px solid #e8ebef",

                borderLeft:
                  "1px solid #e8ebef",
              }}
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

                              style={{
                                marginBottom:
                                  "4px",

                                padding:
                                  "4px 5px",

                                borderRadius:
                                  "5px",

                                background:
                                  "#eaf2fb",

                                color:
                                  "#1d4e89",

                                fontSize:
                                  "10px",

                                fontWeight:
                                  "600",

                                overflow:
                                  "hidden",

                                textOverflow:
                                  "ellipsis",

                                whiteSpace:
                                  "nowrap",
                              }}
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
              style={{
                color: "#777",
                fontSize:
                  "12px",
              }}
            >
              선택한 날짜
            </span>


            <h2
              style={{
                margin:
                  "5px 0 16px",

                fontSize:
                  "21px",
              }}
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
                style={{
                  padding:
                    "45px 10px",

                  textAlign:
                    "center",

                  color:
                    "#999",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "28px",
                  }}
                >
                  🗓️
                </div>

                <p>
                  등록된 일정이 없습니다.
                </p>

              </div>

            ) : (

              <div
                style={{
                  display:
                    "grid",

                  gap:
                    "12px",
                }}
              >

                {selectedSchedules.map(
                  (program) => (

                    <div
                      key={
                        program.id
                      }

                      style={{
                        padding:
                          "14px",

                        borderRadius:
                          "10px",

                        background:
                          "#f7f9fc",

                        border:
                          "1px solid #e7ebf0",
                      }}
                    >

                      <strong>
                        {
                          program.program_name
                        }
                      </strong>


                      <div
                        style={{
                          marginTop:
                            "7px",

                          color:
                            "#687386",

                          fontSize:
                            "12px",

                          lineHeight:
                            "1.7",
                        }}
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
                          style={{
                            marginTop:
                              "4px",

                            color:
                              "#1d4e89",

                            fontWeight:
                              "700",
                          }}
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
            style={{
              margin:
                "0 0 6px",

              fontSize:
                "20px",
            }}
          >
            등록한 수강 프로그램
          </h2>


          <p
            style={{
              margin:
                "0 0 20px",

              color:
                "#777",

              fontSize:
                "13px",
            }}
          >
            총 {myPrograms.length}개의 프로그램
          </p>


          {!programsLoading &&
            myPrograms.length ===
              0 && (

              <div
                style={{
                  padding:
                    "50px 20px",

                  textAlign:
                    "center",

                  color:
                    "#777",
                }}
              >
                등록된 수강 프로그램이 없습니다.
              </div>
            )}


          {!programsLoading &&
            myPrograms.length >
              0 && (

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",

                  gap:
                    "14px",
                }}
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

                        style={{
                          border:
                            "1px solid #e1e6ed",

                          borderRadius:
                            "12px",

                          padding:
                            "18px",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            gap:
                              "12px",
                          }}
                        >

                          <div>

                            <strong>
                              {
                                program.program_name
                              }
                            </strong>


                            <p
                              style={{
                                margin:
                                  "7px 0 0",

                                color:
                                  "#687386",

                                fontSize:
                                  "13px",
                              }}
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
                          style={{
                            marginTop:
                              "16px",

                            display:
                              "grid",

                            gap:
                              "8px",
                          }}
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
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "55px 1fr",

        gap:
          "10px",

        fontSize:
          "13px",
      }}
    >

      <span
        style={{
          color:
            "#777",
        }}
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


  const saveReview =
    (data) => {

      if (
        reviewMode ===
        "write"
      ) {

        const now =
          new Date();


        const newReview = {
          ...data,

          id:
            Date.now(),

          createdAt:
            Date.now(),

          date:
            `${now.getFullYear()}.${String(
              now.getMonth() + 1
            ).padStart(2, "0")}.${String(
              now.getDate()
            ).padStart(2, "0")}`,
        };


        setReviews(
          (current) => [
            newReview,
            ...current,
          ]
        );

      } else {

        setReviews(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                editingReview.id
                  ? {
                      ...item,
                      ...data,
                    }
                  : item
            )
        );
      }


      setModalOpen(false);

      setEditingReview(null);
    };


  const deleteReview =
    () => {

      if (!deleteTarget) {
        return;
      }


      setReviews(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              deleteTarget.id
          )
      );


      setDeleteTarget(null);
    };


  return (
    <>

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap:
            "20px",

          marginBottom:
            "22px",
        }}
      >

        <div
          style={{
            display:
              "flex",

            alignItems:
              "baseline",

            gap:
              "8px",
          }}
        >

          <h1
            style={{
              margin:
                0,

              fontSize:
                "27px",

              color:
                "#111827",
            }}
          >
            내가 쓴 리뷰
          </h1>


          <span
            style={{
              color:
                "#8a95a6",

              fontSize:
                "15px",

              fontWeight:
                "600",
            }}
          >
            {reviews.length}개
          </span>

        </div>


        <div
          style={{
            display:
              "flex",

            gap:
              "8px",
          }}
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


      {programsLoading ? (

        <div
          className="card"

          style={{
            padding:
              "60px",

            textAlign:
              "center",

            color:
              "#777",
          }}
        >
          수강 프로그램을 불러오는 중입니다.
        </div>

      ) : reviews.length ===
        0 ? (

        <div
          className="card"

          style={{
            padding:
              "70px 20px",

            textAlign:
              "center",
          }}
        >

          <div
            style={{
              fontSize:
                "36px",

              marginBottom:
                "13px",
            }}
          >
            ⭐
          </div>


          <strong
            style={{
              fontSize:
                "17px",
            }}
          >
            아직 작성한 리뷰가 없습니다.
          </strong>


          <p
            style={{
              color:
                "#8a95a6",

              fontSize:
                "14px",

              margin:
                "8px 0 20px",
            }}
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
              style={{
                color:
                  "#999",

                fontSize:
                  "12px",

                marginTop:
                  "12px",
              }}
            >
              리뷰 작성 전 수강 프로그램을 먼저 등록해주세요.
            </p>
          )}

        </div>

      ) : (

        <div
          style={{
            display:
              "grid",

            gap:
              "18px",
          }}
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
          style={{
            marginTop:
              "22px",

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            padding:
              "22px 24px",

            border:
              "1px solid #e3e8ef",

            borderRadius:
              "14px",

            background:
              "#f8fafc",
          }}
        >

          <span
            style={{
              color:
                "#687386",

              fontSize:
                "14px",
            }}
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
            deleteReview
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
      style={{
        border:
          "1px solid #e3e8ef",

        borderRadius:
          "15px",

        background:
          "#fff",

        padding:
          "20px",

        display:
          "grid",

        gridTemplateColumns:
          "88px minmax(0, 1fr) 70px",

        gap:
          "20px",
      }}
    >

      <div
        style={{
          width:
            "88px",

          height:
            "88px",

          borderRadius:
            "10px",

          overflow:
            "hidden",

          background:
            "#eef1f5",
        }}
      >

        {review.image ? (

          <img
            src={
              review.image
            }

            alt={
              review.facilityName
            }

            style={{
              width:
                "100%",

              height:
                "100%",

              objectFit:
                "cover",
            }}
          />

        ) : (

          <div
            style={{
              width:
                "100%",

              height:
                "100%",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              fontSize:
                "25px",
            }}
          >
            🏃
          </div>
        )}

      </div>


      <div>

        <div
          style={{
            display:
              "flex",

            gap:
              "9px",

            alignItems:
              "center",

            flexWrap:
              "wrap",
          }}
        >

          <strong>
            {
              review.facilityName
            }
          </strong>


          {review.subfacilityName && (

            <span
              style={{
                color:
                  "#8c96a5",

                fontSize:
                  "12px",
              }}
            >
              {
                review.subfacilityName
              }
            </span>
          )}

        </div>


        <div
          style={{
            marginTop:
              "5px",

            color:
              "#1d4e89",

            fontSize:
              "12px",

            fontWeight:
              "700",
          }}
        >
          {
            review.programName
          }
        </div>


        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "10px",

            marginTop:
              "7px",
          }}
        >

          <ReviewStars
            rating={
              review.rating
            }
          />


          <span
            style={{
              color:
                "#9aa3b1",

              fontSize:
                "12px",
            }}
          >
            {review.date}
          </span>

        </div>


        <p
          style={{
            margin:
              "10px 0 0",

            color:
              "#637083",

            fontSize:
              "14px",

            lineHeight:
              "1.7",
          }}
        >
          {
            review.content
          }
        </p>

      </div>


      <div
        style={{
          display:
            "grid",

          gap:
            "9px",

          alignContent:
            "start",
        }}
      >

        <button
          type="button"

          onClick={
            onEdit
          }

          style={{
            padding:
              "8px",

            border:
              "1px solid #cbd6e5",

            borderRadius:
              "8px",

            background:
              "#fff",

            color:
              "#234f83",

            cursor:
              "pointer",

            fontWeight:
              "700",
          }}
        >
          수정
        </button>


        <button
          type="button"

          onClick={
            onDelete
          }

          style={{
            padding:
              "8px",

            border:
              "1px solid #f0caca",

            borderRadius:
              "8px",

            background:
              "#fff",

            color:
              "#df4747",

            cursor:
              "pointer",

            fontWeight:
              "700",
          }}
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
      style={{
        position:
          "fixed",

        inset:
          0,

        zIndex:
          9999,

        background:
          "rgba(15,23,42,0.45)",

        display:
          "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        padding:
          "30px",
      }}
    >

      <div
        style={{
          width:
            "100%",

          maxWidth:
            "620px",

          maxHeight:
            "90vh",

          overflowY:
            "auto",

          background:
            "#fff",

          borderRadius:
            "18px",

          boxShadow:
            "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >

        <div
          style={{
            padding:
              "22px 25px",

            borderBottom:
              "1px solid #e8ecf1",

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",
          }}
        >

          <div>

            <h2
              style={{
                margin:
                  0,
              }}
            >
              {mode ===
              "write"
                ? "리뷰 쓰기"
                : "리뷰 수정"}
            </h2>


            <p
              style={{
                margin:
                  "6px 0 0",

                color:
                  "#8490a1",

                fontSize:
                  "13px",
              }}
            >
              내가 등록한 수강 프로그램에 대한 후기를 남겨주세요.
            </p>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            style={{
              border:
                "none",

              width:
                "34px",

              height:
                "34px",

              borderRadius:
                "50%",

              cursor:
                "pointer",

              fontSize:
                "19px",
            }}
          >
            ×
          </button>

        </div>


        <div
          style={{
            padding:
              "25px",
          }}
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
              style={{
                marginBottom:
                  "22px",

                padding:
                  "15px",

                background:
                  "#f7f9fc",

                border:
                  "1px solid #e3e8ef",

                borderRadius:
                  "10px",
              }}
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
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "6px",
              }}
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
              style={{
                textAlign:
                  "right",

                color:
                  "#999",

                fontSize:
                  "11px",

                marginTop:
                  "5px",
              }}
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
                style={{
                  position:
                    "relative",

                  width:
                    "130px",

                  height:
                    "130px",
                }}
              >

                <img
                  src={
                    imagePreview
                  }

                  alt="리뷰"

                  style={{
                    width:
                      "100%",

                    height:
                      "100%",

                    objectFit:
                      "cover",

                    borderRadius:
                      "12px",
                  }}
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
                style={{
                  width:
                    "130px",

                  height:
                    "130px",

                  border:
                    "1px dashed #c5cfdb",

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

                  color:
                    "#8290a2",

                  background:
                    "#fafbfc",
                }}
              >

                <input
                  type="file"

                  accept=".jpg,.jpeg,.png"

                  style={{
                    display:
                      "none",
                  }}

                  onChange={
                    handleImageChange
                  }
                />


                <span
                  style={{
                    fontSize:
                      "27px",
                  }}
                >
                  +
                </span>


                <span
                  style={{
                    fontSize:
                      "12px",
                  }}
                >
                  사진 추가
                </span>

              </label>
            )}

          </div>


          {formError && (

            <div
              style={{
                padding:
                  "11px",

                background:
                  "#fff2f2",

                color:
                  "#c62828",

                borderRadius:
                  "8px",

                fontSize:
                  "13px",
              }}
            >
              {formError}
            </div>
          )}

        </div>


        <div
          style={{
            padding:
              "18px 25px",

            borderTop:
              "1px solid #eee",

            display:
              "flex",

            justifyContent:
              "flex-end",

            gap:
              "9px",
          }}
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
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "75px 1fr",

        gap:
          "10px",

        padding:
          "5px 0",

        fontSize:
          "12px",
      }}
    >

      <span
        style={{
          color:
            "#8a95a6",
        }}
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
      style={{
        position:
          "fixed",

        inset:
          0,

        zIndex:
          10000,

        background:
          "rgba(15,23,42,0.45)",

        display:
          "flex",

        justifyContent:
          "center",

        alignItems:
          "center",
      }}
    >

      <div
        style={{
          width:
            "410px",

          padding:
            "28px",

          borderRadius:
            "16px",

          background:
            "#fff",
        }}
      >

        <h2
          style={{
            margin:
              "0 0 10px",
          }}
        >
          리뷰를 삭제할까요?
        </h2>


        <p
          style={{
            color:
              "#687386",

            lineHeight:
              "1.6",
          }}
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
          style={{
            display:
              "flex",

            justifyContent:
              "flex-end",

            gap:
              "9px",

            marginTop:
              "25px",
          }}
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

            style={{
              padding:
                "9px 17px",

              border:
                "none",

              borderRadius:
                "8px",

              background:
                "#dc3f3f",

              color:
                "#fff",

              cursor:
                "pointer",

              fontWeight:
                "700",
            }}
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
      style={{
        display:
          "flex",

        gap:
          "1px",
      }}
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
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "minmax(0, 1.7fr) minmax(280px, 0.8fr)",

          gap:
            "24px",

          alignItems:
            "start",
        }}
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
                  className="input"

                  style={{
                    background:
                      "#f7f8fa",

                    color:
                      "#777",
                  }}
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
                  className="input"

                  type="text"

                  style={{
                    marginTop:
                      "10px",
                  }}

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
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "1fr 30px 1fr",

                  alignItems:
                    "center",

                  gap:
                    "8px",
                }}
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
                  style={{
                    textAlign:
                      "center",
                  }}
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
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "1fr 30px 1fr",

                  alignItems:
                    "center",

                  gap:
                    "8px",
                }}
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
                  style={{
                    textAlign:
                      "center",
                  }}
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
                style={{
                  display:
                    "flex",

                  gap:
                    "8px",

                  flexWrap:
                    "wrap",
                }}
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
                수강증 인증
              </label>


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

                  style={{
                    display:
                      "none",
                  }}
                />


                <strong>
                  {proofFile
                    ? proofFile.name
                    : "파일 선택 또는 드래그"}
                </strong>


                <span
                  style={{
                    marginTop:
                      "7px",

                    color:
                      "#888",

                    fontSize:
                      "12px",
                  }}
                >
                  JPG, PNG · 10MB 이하
                </span>


                {proofFile && (

                  <button
                    type="button"

                    className="btn btn-outline"

                    style={{
                      marginTop:
                        "10px",
                    }}

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
          className="card"

          style={{
            position:
              "sticky",

            top:
              "88px",
          }}
        >

          <div className="card-body">

            <h2
              style={{
                margin:
                  "0 0 18px",
              }}
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
                style={{
                  color:
                    "#c62828",

                  background:
                    "#fff3f3",

                  padding:
                    "10px",

                  borderRadius:
                    "8px",

                  fontSize:
                    "13px",
                }}
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

              className="btn btn-outline btn-block"

              style={{
                marginTop:
                  "10px",
              }}

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
            style={{
              margin:
                0,

              color:
                "#777",
            }}
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
  const [
    form,
    setForm,
  ] = useState({
    name:
      user.name || "",

    birth:
      user.birth || "",

    phone:
      user.phone || "",
  });


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    settingError,
    setSettingError,
  ] = useState("");


  const handleChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setForm(
        (current) => ({
          ...current,
          [name]:
            value,
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
            name:
              form.name,

            birth:
              form.birth ||
              null,

            phone:
              form.phone,
          });


        setUser(
          updatedUser
        );


        setMessage(
          "회원정보가 수정되었습니다."
        );

      } catch (err) {

        console.error(
          err
        );


        setSettingError(
          "회원정보 수정에 실패했습니다."
        );

      } finally {

        setSaving(false);
      }
    };


  const handleLogout =
    () => {

      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem(
        "refreshToken"
      );


      window.location.href =
        "/login";
    };


  return (
    <>

      <div className="page-header">

        <h1 className="page-title">
          환경설정
        </h1>


        <p className="page-description">
          계정 정보와 로그인 설정을 관리할 수 있습니다.
        </p>

      </div>


      <div className="card">

        <div className="card-body">

          <h2>
            기본 정보
          </h2>


          <SettingFormRow
            label="아이디"
          >
            <input
              className="input"

              value={
                user.username
              }

              disabled
            />
          </SettingFormRow>


          <SettingFormRow
            label="이메일"
          >
            <input
              className="input"

              value={
                user.email ||
                ""
              }

              disabled
            />
          </SettingFormRow>


          <SettingFormRow
            label="이름"
          >
            <input
              className="input"

              name="name"

              value={
                form.name
              }

              onChange={
                handleChange
              }
            />
          </SettingFormRow>


          <SettingFormRow
            label="생년월일"
          >
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
          </SettingFormRow>


          <SettingFormRow
            label="전화번호"
          >
            <input
              className="input"

              name="phone"

              value={
                form.phone
              }

              onChange={
                handleChange
              }
            />
          </SettingFormRow>


          {message && (

            <p
              style={{
                color:
                  "#218653",
              }}
            >
              {message}
            </p>
          )}


          {settingError && (

            <p
              style={{
                color:
                  "#c62828",
              }}
            >
              {
                settingError
              }
            </p>
          )}


          <div
            style={{
              marginTop:
                "20px",

              textAlign:
                "right",
            }}
          >

            <button
              type="button"

              className="btn btn-primary"

              disabled={
                saving
              }

              onClick={
                handleSave
              }
            >
              {saving
                ? "저장 중..."
                : "변경사항 저장"}
            </button>

          </div>

        </div>

      </div>


      <div
        className="card"

        style={{
          marginTop:
            "20px",
        }}
      >

        <div className="card-body">

          <h2>
            비밀번호 및 보안
          </h2>


          <button
            type="button"

            className="btn btn-outline"

            onClick={() =>
              alert(
                "비밀번호 변경 기능은 추후 연결됩니다."
              )
            }
          >
            비밀번호 변경
          </button>

        </div>

      </div>


      <div
        className="card"

        style={{
          marginTop:
            "20px",
        }}
      >

        <div className="card-body">

          <h2>
            로그인 관리
          </h2>


          <button
            type="button"

            className="btn btn-outline"

            onClick={
              handleLogout
            }
          >
            로그아웃
          </button>

        </div>

      </div>


      <div
        className="card"

        style={{
          marginTop:
            "20px",
        }}
      >

        <div className="card-body">

          <h2
            style={{
              color:
                "#b42318",
            }}
          >
            회원 탈퇴
          </h2>


          <button
            type="button"

            className="btn btn-outline"

            style={{
              color:
                "#b42318",
            }}

            onClick={() =>
              alert(
                "회원 탈퇴 기능은 추후 연결됩니다."
              )
            }
          >
            회원 탈퇴
          </button>

        </div>

      </div>

    </>
  );
}


function SettingFormRow({
  label,
  children,
}) {
  return (
    <div
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "160px 1fr",

        gap:
          "20px",

        alignItems:
          "center",

        padding:
          "15px 0",

        borderBottom:
          "1px solid #eee",
      }}
    >

      <strong>
        {label}
      </strong>


      <div>
        {children}
      </div>

    </div>
  );
}


function SummaryRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "80px 1fr",

        gap:
          "10px",

        padding:
          "11px 0",

        borderBottom:
          "1px solid #eee",

        fontSize:
          "13px",
      }}
    >

      <strong>
        {label}
      </strong>


      <span
        style={{
          color:
            "#555",

          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </span>

    </div>
  );
}


export default MyPage;