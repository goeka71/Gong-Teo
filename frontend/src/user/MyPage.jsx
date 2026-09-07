import { useEffect, useState } from "react";

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

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const MY_PAGE_MENUS = [
  { key: "programs", label: "나의 수강 프로그램 현황" },
  { key: "register", label: "수강 프로그램 등록하기" },
  { key: "oneday", label: "신청한 원데이 클래스" },
  { key: "reviews", label: "내가 쓴 리뷰" },
  { key: "favorites", label: "찜한 시설" },
  { key: "coins", label: "코인 내역" },
  { key: "settings", label: "환경설정" },
];


function MyPage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const [view, setView] = useState("programs");

  const [myPrograms, setMyPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);

  const [region, setRegion] = useState("");

  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState("");

  const [subFacilities, setSubFacilities] = useState([]);
  const [subfacilityId, setSubfacilityId] = useState("");

  const [programs, setPrograms] = useState([]);
  const [programId, setProgramId] = useState("");

  const [isDirectInput, setIsDirectInput] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [selectedDays, setSelectedDays] = useState([]);

  const [proofFile, setProofFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const loadMyInfo = async () => {
      try {
        const data = await getMyInfo();
        setUser(data);
      } catch (err) {
        console.error(err);
        setError("회원 정보를 불러오지 못했습니다.");
      }
    };

    loadMyInfo();
  }, []);


  useEffect(() => {
    const loadMyPrograms = async () => {
      try {
        setProgramsLoading(true);

        const data = await getMyPrograms();
        setMyPrograms(data);
      } catch (err) {
        console.error("수강 프로그램 조회 실패:", err);
      } finally {
        setProgramsLoading(false);
      }
    };

    loadMyPrograms();
  }, []);


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

    const loadFacilities = async () => {
      try {
        const data = await getFacilitiesByRegion(region);

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

    const loadSubFacilities = async () => {
      try {
        const data = await getSubFacilities(facilityId);

        setSubFacilities(data);
        setSubfacilityId("");

        setPrograms([]);
        setProgramId("");

        setIsDirectInput(false);
        setNewProgramName("");

        if (data.length === 0) {
          const programData =
            await getProgramsByFacility(facilityId);

          setPrograms(programData);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadSubFacilities();
  }, [facilityId]);


  useEffect(() => {
    if (!facilityId || !subfacilityId) {
      return;
    }

    const loadPrograms = async () => {
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
  }, [facilityId, subfacilityId]);


  const selectedFacility = facilities.find(
    (facility) =>
      String(facility.id) === String(facilityId)
  );

  const selectedSubFacility = subFacilities.find(
    (subfacility) =>
      String(subfacility.id) === String(subfacilityId)
  );

  const selectedProgram = programs.find(
    (program) =>
      String(program.id) === String(programId)
  );

  const displayProgramName = isDirectInput
    ? newProgramName
    : selectedProgram?.program_name || "";


  const toggleDay = (day) => {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.filter((item) => item !== day);
      }

      return [...current, day];
    });
  };


  const validateFile = (file) => {
    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSubmitError(
        "JPG 또는 PNG 파일만 첨부할 수 있습니다."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSubmitError(
        "수강증 파일은 10MB 이하만 첨부할 수 있습니다."
      );
      return;
    }

    setSubmitError("");
    setProofFile(file);
  };


  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    validateFile(file);
  };


  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    validateFile(file);
  };


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


  const handleRegister = async () => {
    setSubmitError("");

    if (!region) {
      setSubmitError("지역을 선택해주세요.");
      return;
    }

    if (!facilityId) {
      setSubmitError("체육시설을 선택해주세요.");
      return;
    }

    if (
      subFacilities.length > 0 &&
      !subfacilityId
    ) {
      setSubmitError("세부시설을 선택해주세요.");
      return;
    }

    if (!isDirectInput && !programId) {
      setSubmitError("프로그램을 선택해주세요.");
      return;
    }

    if (isDirectInput && !newProgramName.trim()) {
      setSubmitError("프로그램명을 입력해주세요.");
      return;
    }

    if (!startDate || !endDate) {
      setSubmitError("수강 기간을 입력해주세요.");
      return;
    }

    if (startDate > endDate) {
      setSubmitError(
        "수강 종료일은 시작일보다 빠를 수 없습니다."
      );
      return;
    }

    if (!startTime || !endTime) {
      setSubmitError("수강 시간을 입력해주세요.");
      return;
    }

    if (selectedDays.length === 0) {
      setSubmitError("수강 요일을 선택해주세요.");
      return;
    }

    const data = {
      subfacility: subfacilityId
        ? Number(subfacilityId)
        : null,

      start_date: startDate,
      end_date: endDate,

      program_day: selectedDays.join(","),

      program_time:
        `${startTime} - ${endTime}`,
    };

    if (isDirectInput) {
      data.facility = Number(facilityId);
      data.new_program_name =
        newProgramName.trim();
    } else {
      data.program = Number(programId);
    }

    try {
      setSubmitting(true);

      const createdProgram =
        await createMyProgram(data);

      setMyPrograms((current) => [
        createdProgram,
        ...current,
      ]);

      alert("수강 프로그램이 등록되었습니다.");

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
          <p>회원 정보를 불러오는 중입니다.</p>
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
            alignItems: "flex-start",
          }}
        >

          <MyPageSidebar
            view={view}
            setView={setView}
          />


          <main
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >

            {view === "programs" && (
              <ProgramStatusView
                user={user}
                myPrograms={myPrograms}
                programsLoading={programsLoading}
                onRegisterClick={() =>
                  setView("register")
                }
              />
            )}


            {view === "register" && (
              <ProgramRegisterView
                region={region}
                setRegion={setRegion}

                facilities={facilities}
                facilityId={facilityId}
                setFacilityId={setFacilityId}

                subFacilities={subFacilities}
                subfacilityId={subfacilityId}
                setSubfacilityId={setSubfacilityId}

                programs={programs}
                programId={programId}
                setProgramId={setProgramId}

                isDirectInput={isDirectInput}
                setIsDirectInput={setIsDirectInput}

                newProgramName={newProgramName}
                setNewProgramName={setNewProgramName}

                startDate={startDate}
                setStartDate={setStartDate}

                endDate={endDate}
                setEndDate={setEndDate}

                startTime={startTime}
                setStartTime={setStartTime}

                endTime={endTime}
                setEndTime={setEndTime}

                selectedDays={selectedDays}
                toggleDay={toggleDay}

                proofFile={proofFile}
                setProofFile={setProofFile}

                isDragging={isDragging}

                handleFileChange={handleFileChange}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}

                selectedFacility={selectedFacility}
                selectedSubFacility={selectedSubFacility}
                displayProgramName={displayProgramName}

                submitError={submitError}
                submitting={submitting}

                handleRegister={handleRegister}

                handleCancel={() => {
                  resetRegisterForm();
                  setView("programs");
                }}
              />
            )}


            {view === "oneday" && (
              <EmptyMenuView
                title="신청한 원데이 클래스"
                description="신청한 원데이 클래스 내역을 확인할 수 있습니다."
              />
            )}

            {view === "reviews" && (
              <EmptyMenuView
                title="내가 쓴 리뷰"
                description="내가 작성한 리뷰를 확인할 수 있습니다."
              />
            )}

            {view === "favorites" && (
              <EmptyMenuView
                title="찜한 시설"
                description="찜한 공공체육시설을 확인할 수 있습니다."
              />
            )}

            {view === "coins" && (
              <EmptyMenuView
                title="코인 내역"
                description="코인 적립 및 사용 내역을 확인할 수 있습니다."
              />
            )}

            {view === "settings" && (
              <SettingsView
                user={user}
                setUser={setUser}
              />
            )}

          </main>
        </div>
      </div>
    </div>
  );
}


function MyPageSidebar({
  view,
  setView,
}) {
  return (
    <aside
      style={{
        width: "230px",
        flexShrink: 0,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "22px",
          fontSize: "24px",
        }}
      >
        마이페이지
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {MY_PAGE_MENUS.map((menu) => {
          const active = view === menu.key;

          return (
            <button
              key={menu.key}
              type="button"
              onClick={() =>
                setView(menu.key)
              }
              style={{
                width: "100%",
                padding: "13px 14px",

                border: "none",
                borderRadius: "9px",

                textAlign: "left",
                cursor: "pointer",

                fontSize: "14px",
                fontWeight:
                  active ? "700" : "500",

                background:
                  active
                    ? "#edf4fc"
                    : "transparent",

                color:
                  active
                    ? "#1d4e89"
                    : "#333",
              }}
            >
              {menu.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}


function ProgramStatusView({
  user,
  myPrograms,
  programsLoading,
  onRegisterClick,
}) {
  const getStatusInfo = (status) => {
    switch (status) {
      case "approved":
        return {
          text: "진행중",
          background: "#eaf7ef",
          color: "#218653",
        };

      case "rejected":
        return {
          text: "반려",
          background: "#fff0f0",
          color: "#c63c3c",
        };

      default:
        return {
          text: "승인대기",
          background: "#fff6df",
          color: "#a46b00",
        };
    }
  };


  return (
    <>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div>
          <h1 className="page-title">
            나의 수강 프로그램 현황
          </h1>

          <p className="page-description">
            등록한 수강 프로그램을 확인하고 관리할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-primary-shadow"
          onClick={onRegisterClick}
        >
          + 수강 프로그램 등록
        </button>
      </div>


      <div
        className="card"
        style={{
          marginBottom: "22px",
        }}
      >
        <div className="card-body">

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                background: "#edf2f7",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                fontSize: "22px",
              }}
            >
              👤
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "17px",
                  marginBottom: "6px",
                }}
              >
                {user.name || user.username} 님
              </strong>

              <span
                style={{
                  display: "inline-block",

                  padding: "5px 10px",
                  borderRadius: "20px",

                  background: "#fff3d6",
                  color: "#8a6200",

                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                보유 {user.coin} coin
              </span>
            </div>
          </div>

        </div>
      </div>


      <div className="card">
        <div className="card-body">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                }}
              >
                등록한 수강 프로그램
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                총 {myPrograms.length}개의 프로그램
              </p>
            </div>
          </div>


          {programsLoading && (
            <div
              style={{
                padding: "50px 20px",
                textAlign: "center",
                color: "#777",
              }}
            >
              수강 프로그램을 불러오는 중입니다.
            </div>
          )}


          {!programsLoading &&
            myPrograms.length === 0 && (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",

                  border: "1px dashed #d5dde7",
                  borderRadius: "12px",
                  background: "#fafbfd",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    marginBottom: "12px",
                  }}
                >
                  📋
                </div>

                <strong>
                  등록된 수강 프로그램이 없습니다.
                </strong>

                <p
                  style={{
                    margin: "8px 0 18px",
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  현재 수강 중인 프로그램을 등록해보세요.
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRegisterClick}
                >
                  + 수강 프로그램 등록
                </button>
              </div>
            )}


          {!programsLoading &&
            myPrograms.length > 0 && (
              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",

                  gap: "14px",
                }}
              >
                {myPrograms.map((program) => {
                  const statusInfo =
                    getStatusInfo(program.status);

                  return (
                    <div
                      key={program.id}
                      style={{
                        border: "1px solid #e1e6ed",
                        borderRadius: "12px",

                        padding: "18px",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              display: "block",
                              fontSize: "17px",
                              color: "#17233c",
                            }}
                          >
                            {program.program_name}
                          </strong>

                          <p
                            style={{
                              margin: "7px 0 0",
                              color: "#687386",
                              fontSize: "13px",
                            }}
                          >
                            {program.facility_name}
                          </p>
                        </div>

                        <span
                          style={{
                            flexShrink: 0,

                            padding: "5px 9px",
                            borderRadius: "20px",

                            background:
                              statusInfo.background,

                            color:
                              statusInfo.color,

                            fontSize: "12px",
                            fontWeight: "700",
                          }}
                        >
                          {statusInfo.text}
                        </span>
                      </div>


                      {program.subfacility_name && (
                        <div
                          style={{
                            marginTop: "15px",
                            paddingTop: "13px",
                            borderTop: "1px solid #eee",
                          }}
                        >
                          <span
                            style={{
                              color: "#777",
                              fontSize: "13px",
                            }}
                          >
                            세부시설
                          </span>

                          <strong
                            style={{
                              marginLeft: "10px",
                              fontSize: "13px",
                            }}
                          >
                            {program.subfacility_name}
                          </strong>
                        </div>
                      )}


                      <div
                        style={{
                          marginTop: "14px",
                          display: "grid",
                          gap: "9px",
                        }}
                      >
                        <ProgramInfoRow
                          label="수강 요일"
                          value={
                            program.program_day
                              ? program.program_day
                                  .split(",")
                                  .join(" · ")
                              : "-"
                          }
                        />

                        <ProgramInfoRow
                          label="수강 시간"
                          value={
                            program.program_time || "-"
                          }
                        />

                        <ProgramInfoRow
                          label="수강 기간"
                          value={
                            program.start_date &&
                            program.end_date
                              ? `${program.start_date} ~ ${program.end_date}`
                              : "-"
                          }
                        />
                      </div>


                      <div
                        style={{
                          marginTop: "15px",
                          paddingTop: "13px",
                          borderTop: "1px solid #eee",
                          fontSize: "13px",
                        }}
                      >
                        <span
                          style={{
                            color: "#777",
                          }}
                        >
                          수강증
                        </span>

                        <span
                          style={{
                            marginLeft: "10px",

                            color:
                              program.proof_image
                                ? "#218653"
                                : "#999",

                            fontWeight: "600",
                          }}
                        >
                          {program.proof_image
                            ? "첨부됨"
                            : "미첨부"}
                        </span>
                      </div>


                      {program.status === "rejected" &&
                        program.reject_reason && (
                          <div
                            style={{
                              marginTop: "14px",
                              padding: "11px",
                              borderRadius: "8px",

                              background: "#fff4f4",
                              color: "#a93030",

                              fontSize: "13px",
                            }}
                          >
                            반려 사유:{" "}
                            {program.reject_reason}
                          </div>
                        )}

                    </div>
                  );
                })}
              </div>
            )}

        </div>
      </div>
    </>
  );
}


function ProgramInfoRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "75px 1fr",
        gap: "10px",
        fontSize: "13px",
      }}
    >
      <span
        style={{
          color: "#777",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#374151",
          fontWeight: "600",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


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
        <div>
          <h1 className="page-title">
            수강 프로그램 등록
          </h1>

          <p className="page-description">
            현재 수강 중인 정기 프로그램을 등록합니다.
            등록된 프로그램은 마이페이지에서 관리할 수 있습니다.
          </p>
        </div>
      </div>


      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "minmax(0, 1.7fr) minmax(280px, 0.8fr)",

          gap: "24px",

          alignItems: "start",
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
                value={region}
                onChange={(event) =>
                  setRegion(event.target.value)
                }
              >
                <option value="">
                  지역을 선택해주세요
                </option>

                {REGIONS.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>


            <div className="form-group">
              <label className="form-label">
                시설
              </label>

              <select
                className="select"
                value={facilityId}
                disabled={!region}
                onChange={(event) =>
                  setFacilityId(event.target.value)
                }
              >
                <option value="">
                  시설을 선택해주세요
                </option>

                {facilities.map((facility) => (
                  <option
                    key={facility.id}
                    value={facility.id}
                  >
                    {facility.facility_name}
                  </option>
                ))}
              </select>

              {region && (
                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#777",
                    fontSize: "13px",
                  }}
                >
                  {facilities.length}개의 시설이 검색되었습니다.
                </p>
              )}
            </div>


            <div className="form-group">
              <label className="form-label">
                세부시설
              </label>

              {facilityId &&
              subFacilities.length === 0 ? (
                <div
                  className="input"
                  style={{
                    display: "flex",
                    alignItems: "center",

                    color: "#777",
                    background: "#f7f8fa",
                  }}
                >
                  세부시설이 없는 시설입니다.
                </div>
              ) : (
                <select
                  className="select"
                  value={subfacilityId}
                  disabled={!facilityId}
                  onChange={(event) =>
                    setSubfacilityId(event.target.value)
                  }
                >
                  <option value="">
                    세부시설을 선택해주세요
                  </option>

                  {subFacilities.map((subfacility) => (
                    <option
                      key={subfacility.id}
                      value={subfacility.id}
                    >
                      {subfacility.subfacility_name}
                    </option>
                  ))}
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
                    subFacilities.length > 0 &&
                    !subfacilityId
                  )
                }
                onChange={(event) => {
                  const value = event.target.value;

                  if (value === "__direct__") {
                    setProgramId("");
                    setIsDirectInput(true);
                    return;
                  }

                  setIsDirectInput(false);
                  setNewProgramName("");
                  setProgramId(value);
                }}
              >
                <option value="">
                  프로그램을 선택해주세요
                </option>

                {programs.map((program) => (
                  <option
                    key={program.id}
                    value={program.id}
                  >
                    {program.program_name}

                    {program.program_day
                      ? ` · ${program.program_day}`
                      : ""}

                    {program.program_time
                      ? ` · ${program.program_time}`
                      : ""}
                  </option>
                ))}

                <option value="__direct__">
                  + 목록에 없어요 · 직접 입력
                </option>
              </select>


              {isDirectInput && (
                <input
                  className="input"
                  type="text"

                  style={{
                    marginTop: "10px",
                  }}

                  placeholder="프로그램명을 직접 입력해주세요"

                  value={newProgramName}

                  onChange={(event) =>
                    setNewProgramName(event.target.value)
                  }
                />
              )}


              <p
                style={{
                  margin: "8px 0 0",
                  color: "#777",
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
              >
                프로그램이 목록에 없다면
                ‘목록에 없어요 · 직접 입력’을 선택해주세요.
              </p>
            </div>


            <div
              className="form-group"
              style={{
                marginTop: "26px",
              }}
            >
              <label className="form-label">
                수강 기간
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 28px 1fr",

                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  className="input"
                  type="date"

                  value={startDate}

                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                />

                <span
                  style={{
                    textAlign: "center",
                    color: "#777",
                  }}
                >
                  ~
                </span>

                <input
                  className="input"
                  type="date"

                  value={endDate}

                  onChange={(event) =>
                    setEndDate(event.target.value)
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
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 28px 1fr",

                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  className="input"
                  type="time"

                  value={startTime}

                  onChange={(event) =>
                    setStartTime(event.target.value)
                  }
                />

                <span
                  style={{
                    textAlign: "center",
                    color: "#777",
                  }}
                >
                  ~
                </span>

                <input
                  className="input"
                  type="time"

                  value={endTime}

                  onChange={(event) =>
                    setEndTime(event.target.value)
                  }
                />
              </div>
            </div>


            <div
              className="form-group"
              style={{
                marginTop: "24px",
              }}
            >
              <label className="form-label">
                수강 요일
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {DAYS.map((day) => {
                  const selected =
                    selectedDays.includes(day);

                  return (
                    <button
                      key={day}
                      type="button"

                      className={
                        selected
                          ? "btn btn-primary"
                          : "btn btn-secondary"
                      }

                      style={{
                        minWidth: "48px",
                      }}

                      onClick={() =>
                        toggleDay(day)
                      }
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>


            <div
              className="form-group"
              style={{
                marginTop: "28px",
              }}
            >
              <label className="form-label">
                수강증 인증
              </label>

              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}

                style={{
                  minHeight: "150px",

                  border: isDragging
                    ? "2px solid #1d4e89"
                    : "1px dashed #b8c7da",

                  borderRadius: "12px",

                  display: "flex",
                  flexDirection: "column",

                  alignItems: "center",
                  justifyContent: "center",

                  padding: "22px",
                  cursor: "pointer",

                  textAlign: "center",

                  background: isDragging
                    ? "#f3f7fc"
                    : "#fff",
                }}
              >
                <input
                  type="file"

                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"

                  onChange={handleFileChange}

                  style={{
                    display: "none",
                  }}
                />

                <div
                  style={{
                    fontSize: "28px",
                    marginBottom: "8px",
                    color: "#1d4e89",
                  }}
                >
                  ↑
                </div>

                <strong
                  style={{
                    color: "#1d4e89",
                  }}
                >
                  {proofFile
                    ? proofFile.name
                    : "파일 선택 또는 드래그"}
                </strong>

                <span
                  style={{
                    marginTop: "7px",
                    color: "#888",
                    fontSize: "13px",
                  }}
                >
                  영수증 · 수강증 사진
                  (JPG, PNG, 10MB 이하)
                </span>


                {proofFile && (
                  <button
                    type="button"

                    className="btn btn-outline"

                    style={{
                      marginTop: "14px",
                    }}

                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      setProofFile(null);
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
            position: "sticky",
            top: "88px",
          }}
        >
          <div className="card-body">

            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "20px",
              }}
            >
              등록 내용 확인
            </h2>

            <p
              style={{
                margin: "0 0 20px",
                color: "#777",
                fontSize: "13px",
              }}
            >
              입력한 내용을 다시 한번 확인해주세요.
            </p>


            <SummaryRow
              label="지역"
              value={region || "-"}
            />

            <SummaryRow
              label="시설"
              value={
                selectedFacility?.facility_name || "-"
              }
            />

            <SummaryRow
              label="세부시설"
              value={
                selectedSubFacility?.subfacility_name ||
                (
                  facilityId &&
                  subFacilities.length === 0
                    ? "없음"
                    : "-"
                )
              }
            />

            <SummaryRow
              label="프로그램"
              value={displayProgramName || "-"}
            />

            <SummaryRow
              label="수강 기간"
              value={
                startDate && endDate
                  ? `${startDate} ~ ${endDate}`
                  : "-"
              }
            />

            <SummaryRow
              label="요일 · 시간"
              value={
                selectedDays.length > 0 &&
                startTime &&
                endTime
                  ? `${selectedDays.join(
                      " · "
                    )} / ${startTime} - ${endTime}`
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
                  margin: "16px 0 0",

                  padding: "11px 12px",
                  borderRadius: "8px",

                  background: "#fff3f3",
                  color: "#c62828",

                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
              >
                {submitError}
              </p>
            )}


            <button
              type="button"

              className="btn btn-primary btn-primary-shadow btn-block"

              style={{
                marginTop: "24px",
              }}

              disabled={submitting}

              onClick={handleRegister}
            >
              {submitting
                ? "등록 중..."
                : "프로그램 등록하기"}
            </button>


            <button
              type="button"

              className="btn btn-outline btn-block"

              style={{
                marginTop: "10px",
              }}

              onClick={handleCancel}
            >
              취소
            </button>

          </div>
        </div>
      </div>


      <div
        className="card"
        style={{
          marginTop: "24px",
        }}
      >
        <div className="card-body">

          <strong>
            결석일을 양도하려면?
          </strong>

          <p
            style={{
              marginBottom: 0,
              color: "#666",
              lineHeight: "1.6",
            }}
          >
            프로그램 등록을 마친 뒤
            원데이 클래스의 양도 글쓰기에서
            결석일을 선택해 양도 글을 올릴 수 있습니다.
          </p>

        </div>
      </div>
    </>
  );
}


function EmptyMenuView({
  title,
  description,
}) {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {title}
          </h1>

          <p className="page-description">
            {description}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            준비 중입니다.
          </p>
        </div>
      </div>
    </>
  );
}


function SettingsView({
  user,
  setUser,
}) {
  const [form, setForm] = useState({
    name: user.name || "",
    birth: user.birth || "",
    phone: user.phone || "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [settingError, setSettingError] = useState("");


  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setSettingError("");
  };


  const handleSave = async () => {
    try {
      setSaving(true);
      setSettingError("");
      setMessage("");

      const updatedUser =
        await updateMyInfo({
          name: form.name,
          birth: form.birth || null,
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


  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    window.location.href = "/login";
  };


  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            환경설정
          </h1>

          <p className="page-description">
            계정 정보와 로그인 설정을 관리할 수 있습니다.
          </p>
        </div>
      </div>


      <div className="card">
        <div className="card-body">

          <div
            style={{
              marginBottom: "26px",
            }}
          >
            <h2
              style={{
                margin: "0 0 7px",
                fontSize: "19px",
              }}
            >
              기본 정보
            </h2>

            <p
              style={{
                margin: 0,
                color: "#777",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              서비스에서 사용하는 회원 정보를 확인하고 수정할 수 있습니다.
            </p>
          </div>


          <SettingFormRow
            label="아이디"
            description="아이디는 변경할 수 없습니다."
          >
            <input
              className="input"
              type="text"
              value={user.username}
              disabled

              style={{
                background: "#f5f6f8",
                color: "#777",
              }}
            />
          </SettingFormRow>


          <SettingFormRow
            label="이메일"
            description="가입 시 등록한 이메일입니다."
          >
            <input
              className="input"
              type="email"
              value={user.email || ""}
              disabled

              style={{
                background: "#f5f6f8",
                color: "#777",
              }}
            />
          </SettingFormRow>


          <SettingFormRow label="이름">
            <input
              className="input"
              type="text"
              name="name"

              value={form.name}
              onChange={handleChange}

              placeholder="이름을 입력해주세요"
            />
          </SettingFormRow>


          <SettingFormRow label="생년월일">
            <input
              className="input"
              type="date"
              name="birth"

              value={form.birth}
              onChange={handleChange}
            />
          </SettingFormRow>


          <SettingFormRow
            label="전화번호"
            description="연락 가능한 전화번호를 입력해주세요."
          >
            <input
              className="input"
              type="tel"
              name="phone"

              value={form.phone}
              onChange={handleChange}

              placeholder="010-0000-0000"
            />
          </SettingFormRow>


          {message && (
            <div
              style={{
                marginTop: "18px",

                padding: "11px 14px",
                borderRadius: "8px",

                background: "#edf8f1",
                color: "#218653",

                fontSize: "13px",
              }}
            >
              {message}
            </div>
          )}


          {settingError && (
            <div
              style={{
                marginTop: "18px",

                padding: "11px 14px",
                borderRadius: "8px",

                background: "#fff3f3",
                color: "#c62828",

                fontSize: "13px",
              }}
            >
              {settingError}
            </div>
          )}


          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "24px",
            }}
          >
            <button
              type="button"

              className="btn btn-primary btn-primary-shadow"

              disabled={saving}

              onClick={handleSave}
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
          marginTop: "20px",
        }}
      >
        <div className="card-body">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "30px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 7px",
                  fontSize: "19px",
                }}
              >
                비밀번호 및 보안
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#777",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                안전한 계정 사용을 위해 비밀번호를 관리할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline"

              onClick={() => {
                alert(
                  "비밀번호 변경 기능은 추후 연결됩니다."
                );
              }}
            >
              비밀번호 변경
            </button>
          </div>

        </div>
      </div>


      <div
        className="card"
        style={{
          marginTop: "20px",
        }}
      >
        <div className="card-body">

          <h2
            style={{
              margin: "0 0 7px",
              fontSize: "19px",
            }}
          >
            로그인 관리
          </h2>

          <p
            style={{
              margin: "0 0 22px",
              color: "#777",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            현재 계정의 로그인 상태를 관리할 수 있습니다.
          </p>


          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",

              gap: "20px",

              padding: "16px 0",
              borderTop: "1px solid #eee",
            }}
          >
            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "14px",
                  marginBottom: "4px",
                }}
              >
                로그아웃
              </strong>

              <span
                style={{
                  color: "#777",
                  fontSize: "12px",
                }}
              >
                현재 브라우저에서 로그아웃합니다.
              </span>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>

        </div>
      </div>


      <div
        className="card"
        style={{
          marginTop: "20px",
        }}
      >
        <div className="card-body">

          <h2
            style={{
              margin: "0 0 7px",
              fontSize: "19px",
              color: "#b42318",
            }}
          >
            회원 탈퇴
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              color: "#777",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            회원 탈퇴 시 계정과 관련된 정보가 삭제될 수 있으며,
            탈퇴 후에는 복구가 어려울 수 있습니다.
          </p>


          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-outline"

              style={{
                color: "#b42318",
                borderColor: "#efc5c2",
              }}

              onClick={() => {
                alert(
                  "회원 탈퇴 기능은 추후 연결됩니다."
                );
              }}
            >
              회원 탈퇴
            </button>
          </div>

        </div>
      </div>
    </>
  );
}


function SettingFormRow({
  label,
  description,
  children,
}) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns:
          "170px minmax(0, 1fr)",

        gap: "24px",

        padding: "16px 0",

        borderBottom:
          "1px solid #eee",

        alignItems: "center",
      }}
    >
      <div>
        <strong
          style={{
            display: "block",

            fontSize: "14px",

            marginBottom:
              description ? "5px" : 0,
          }}
        >
          {label}
        </strong>

        {description && (
          <span
            style={{
              display: "block",

              color: "#888",

              fontSize: "11px",
              lineHeight: "1.5",
            }}
          >
            {description}
          </span>
        )}
      </div>

      <div
        style={{
          maxWidth: "500px",
        }}
      >
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
        display: "grid",

        gridTemplateColumns:
          "82px minmax(0, 1fr)",

        gap: "10px",

        padding: "11px 0",

        borderBottom:
          "1px solid #eee",

        fontSize: "13px",
      }}
    >
      <strong>{label}</strong>

      <span
        style={{
          minWidth: 0,
          overflowWrap: "anywhere",
          color: "#555",
        }}
      >
        {value}
      </span>
    </div>
  );
}


export default MyPage;