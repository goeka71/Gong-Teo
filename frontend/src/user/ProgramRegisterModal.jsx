import { useEffect, useState } from "react";

import {
  getFacilitiesByRegion,
  getSubFacilities,
  getProgramsByFacility,
  getProgramsBySubFacility,
  createMyProgram,
} from "../api/user";

import { extractServerMessage } from "../api/client";

import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
  imageTooLargeMessage,
} from "../utils/upload";

import "./ProgramRegisterModal.css";

// 마이페이지의 "수강 프로그램 등록하기"와 같은 입력 항목을
// 팝업(모달)으로 띄우기 위한 컴포넌트.
// 마이페이지 밖(예: 원데이 결석일 양도 글쓰기 화면)에서도
// 그 자리에서 바로 프로그램을 등록할 수 있도록 상태를 자체적으로 들고 있다.

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

function SummaryRow({ label, value }) {
  return (
    <div className="prm-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// onClose: 모달 닫기(취소/오버레이 클릭)
// onSaved: 등록 성공 시 호출. 새로 생성된 프로그램 객체를 인자로 받는다.
function ProgramRegisterModal({ onClose, onSaved }) {
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

  // ----------------------------------------------
  // 지역 → 시설
  // ----------------------------------------------
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

  // ----------------------------------------------
  // 시설 → 세부시설
  // ----------------------------------------------
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
          const programData = await getProgramsByFacility(facilityId);
          setPrograms(programData);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadSubFacilities();
  }, [facilityId]);

  // ----------------------------------------------
  // 세부시설 → 프로그램
  // ----------------------------------------------
  useEffect(() => {
    if (!facilityId || !subfacilityId) {
      return;
    }

    const loadPrograms = async () => {
      try {
        const data = await getProgramsBySubFacility(facilityId, subfacilityId);
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
    (facility) => String(facility.id) === String(facilityId)
  );

  const selectedSubFacility = subFacilities.find(
    (subfacility) => String(subfacility.id) === String(subfacilityId)
  );

  const selectedProgram = programs.find(
    (program) => String(program.id) === String(programId)
  );

  const displayProgramName = isDirectInput
    ? newProgramName
    : selectedProgram?.program_name || "";

  const toggleDay = (day) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    );
  };

  // ----------------------------------------------
  // 수강증 파일
  // ----------------------------------------------
  // 통과하면 true, 거부하면 false (거부된 파일은 state 에 저장하지 않는다)
  const validateFile = (file) => {
    if (!file) return true;

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setSubmitError("JPG 또는 PNG 파일만 첨부할 수 있습니다.");
      return false;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setSubmitError(imageTooLargeMessage("수강증 파일은", file));
      return false;
    }

    setSubmitError("");
    setProofFile(file);
    return true;
  };

  const handleFileChange = (event) => {
    // 거부된 파일이 input 에 남아 있으면 같은 파일을 다시 골라도 change 가
    // 발생하지 않으므로 비워 준다.
    if (!validateFile(event.target.files?.[0])) {
      event.target.value = "";
    }
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
    validateFile(event.dataTransfer.files?.[0]);
  };

  // ----------------------------------------------
  // 등록
  // ----------------------------------------------
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

    if (subFacilities.length > 0 && !subfacilityId) {
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
      setSubmitError("수강 종료일은 시작일보다 빠를 수 없습니다.");
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

    if (!proofFile) {
      setSubmitError("수강 프로그램 등록을 위해 수강증 인증이 필요합니다.");
      return;
    }

    const formData = new FormData();

    formData.append("start_date", startDate);
    formData.append("end_date", endDate);
    formData.append("program_day", selectedDays.join(","));
    formData.append("program_time", `${startTime} - ${endTime}`);
    formData.append("proof_image", proofFile);

    if (subfacilityId) {
      formData.append("subfacility", subfacilityId);
    }

    if (isDirectInput) {
      formData.append("facility", facilityId);
      formData.append("new_program_name", newProgramName.trim());
    } else {
      formData.append("program", programId);
    }

    try {
      setSubmitting(true);

      const createdProgram = await createMyProgram(formData);

      alert(
        "수강 프로그램이 등록되었습니다. 승인 후 원데이 양도에 사용할 수 있습니다."
      );

      if (onSaved) {
        onSaved(createdProgram);
      }
    } catch (err) {
      console.error(err);
      // 서버가 준 사유(예: 수강증 용량 초과)가 있으면 그걸 보여준다.
      setSubmitError(
        extractServerMessage(err?.data) ||
          "프로그램 등록에 실패했습니다. 입력 내용을 확인해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="prm-overlay" onClick={onClose}>
      <div
        className="prm-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="prm-header">
          <div>
            <h2>수강 프로그램 등록</h2>
            <p>현재 수강 중인 정기 프로그램을 등록합니다.</p>
          </div>

          <button type="button" className="prm-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="prm-body">
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">지역 (구)</label>

                <select
                  className="select"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                >
                  <option value="">지역을 선택해주세요</option>

                  {REGIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">시설</label>

                <select
                  className="select"
                  value={facilityId}
                  disabled={!region}
                  onChange={(event) => setFacilityId(event.target.value)}
                >
                  <option value="">시설을 선택해주세요</option>

                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.facility_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">세부시설</label>

                {facilityId && subFacilities.length === 0 ? (
                  <div className="input prm-static-input">
                    세부시설이 없는 시설입니다.
                  </div>
                ) : (
                  <select
                    className="select"
                    value={subfacilityId}
                    disabled={!facilityId}
                    onChange={(event) => setSubfacilityId(event.target.value)}
                  >
                    <option value="">세부시설을 선택해주세요</option>

                    {subFacilities.map((subfacility) => (
                      <option key={subfacility.id} value={subfacility.id}>
                        {subfacility.subfacility_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">프로그램명</label>

                <select
                  className="select"
                  value={isDirectInput ? "__direct__" : programId}
                  disabled={
                    !facilityId ||
                    (subFacilities.length > 0 && !subfacilityId)
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
                  <option value="">프로그램을 선택해주세요</option>

                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.program_name}
                    </option>
                  ))}

                  <option value="__direct__">
                    + 목록에 없어요 · 직접 입력
                  </option>
                </select>

                {isDirectInput && (
                  <input
                    className="input prm-direct-input"
                    type="text"
                    placeholder="프로그램명을 직접 입력해주세요"
                    value={newProgramName}
                    onChange={(event) => setNewProgramName(event.target.value)}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">수강 기간</label>

                <div className="prm-range-row">
                  <input
                    className="input"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />

                  <span className="prm-range-sep">~</span>

                  <input
                    className="input"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">수강 시간</label>

                <div className="prm-range-row">
                  <input
                    className="input"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />

                  <span className="prm-range-sep">~</span>

                  <input
                    className="input"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">수강 요일</label>

                <div className="prm-day-row">
                  {DAYS.map((day) => {
                    const selected = selectedDays.includes(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        className={
                          selected ? "btn btn-primary" : "btn btn-secondary"
                        }
                        onClick={() => toggleDay(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  수강증 인증 <span className="prm-required">*</span>
                </label>

                <p className="prm-help-text">
                  수강 프로그램 등록을 위해 반드시 수강증을 첨부해주세요.
                </p>

                <label
                  className={`prm-dropzone ${isDragging ? "dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="prm-file-input"
                  />

                  <strong>
                    {proofFile ? proofFile.name : "파일 선택 또는 드래그"}
                  </strong>

                  <span className="prm-help-text">JPG, PNG · {MAX_IMAGE_MB}MB 이하</span>

                  {proofFile && (
                    <button
                      type="button"
                      className="btn btn-outline prm-cancel-file"
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

          <div className="card prm-summary-card">
            <div className="card-body">
              <h2 className="prm-summary-title">등록 내용 확인</h2>

              <SummaryRow label="지역" value={region || "-"} />

              <SummaryRow
                label="시설"
                value={selectedFacility?.facility_name || "-"}
              />

              <SummaryRow
                label="세부시설"
                value={
                  selectedSubFacility?.subfacility_name ||
                  (facilityId && subFacilities.length === 0 ? "없음" : "-")
                }
              />

              <SummaryRow label="프로그램" value={displayProgramName || "-"} />

              <SummaryRow
                label="기간"
                value={
                  startDate && endDate ? `${startDate} ~ ${endDate}` : "-"
                }
              />

              <SummaryRow
                label="요일"
                value={selectedDays.length ? selectedDays.join(" · ") : "-"}
              />

              <SummaryRow
                label="시간"
                value={
                  startTime && endTime ? `${startTime} - ${endTime}` : "-"
                }
              />

              <SummaryRow
                label="수강증"
                value={proofFile ? proofFile.name : "미첨부"}
              />

              {submitError && (
                <p className="prm-submit-error">{submitError}</p>
              )}

              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={submitting}
                onClick={handleRegister}
              >
                {submitting ? "등록 중..." : "프로그램 등록하기"}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-block prm-cancel-button"
                onClick={onClose}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgramRegisterModal;
