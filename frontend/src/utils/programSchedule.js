// 프로그램(Program) 행의 요일/시간 문자열을 수강 프로그램 등록 폼에서 쓰는 값으로
// 바꿔 주는 유틸. (ProgramRegisterModal.jsx, MyPage.jsx 가 같이 쓴다)
//
// program.csv 의 program_day / program_time 은 사람이 입력한 값이라 표기가 제각각이다.
//   요일: "월수금"(대부분), "요일월수금"("요일" 접두어가 붙은 것), ""(없음)
//   시간: "19:00~19:50", "19:00-19:50"(대부분), ""(없음), "3837.50%" 같은 깨진 값
// 확실히 해석되는 경우에만 값을 돌려주고, 아니면 빈 값을 돌려준다.
// (잘못 채우는 것보다 사용자가 직접 입력하게 두는 편이 낫다.)

const DAY_CHARS = "일월화수목금토";

// 요일 글자 사이에 올 수 있는 구분자. 그 외의 글자가 섞여 있으면 해석하지 않는다.
const DAY_SEPARATOR = /[\s,/·]/;

// "HH:MM~HH:MM" 또는 "HH:MM-HH:MM". 공백은 허용한다.
const TIME_RANGE = /^\s*(\d{1,2}):(\d{2})\s*[~\-–]\s*(\d{1,2}):(\d{2})\s*$/;

const NO_DAY_TEXT = "요일 정보 없음";
const NO_TIME_TEXT = "시간 정보 없음";

// "월수금" -> ["월", "수", "금"]. 적힌 순서를 유지하고 중복은 뺀다.
// 해석할 수 없으면 [] 를 돌려준다.
export function parseProgramDays(value) {
  if (typeof value !== "string") return [];

  // "요일월수금" 처럼 앞에 붙은 "요일" 은 먼저 뗀다.
  // 안 떼면 그 안의 "일" 이 일요일로 읽힌다. ("요일토" -> ["일", "토"] 가 되는 오류)
  const text = value.trim().replace(/^요일/, "");

  const days = [];

  for (const char of text) {
    if (DAY_SEPARATOR.test(char)) continue;

    // "토요일", "평일" 처럼 요일 글자가 아닌 것이 섞여 있으면 통째로 해석하지 않는다.
    if (!DAY_CHARS.includes(char)) return [];

    if (!days.includes(char)) days.push(char);
  }

  return days;
}

// "19:00~19:50" -> { start: "19:00", end: "19:50" }.
// <input type="time"> 에 그대로 넣을 수 있게 "HH:MM" 으로 맞춘다.
// 해석할 수 없거나 시/분 범위를 벗어나면(예: "18:80~22:00") null 을 돌려준다.
export function parseProgramTime(value) {
  if (typeof value !== "string") return null;

  const match = TIME_RANGE.exec(value);

  if (!match) return null;

  const [startHour, startMinute, endHour, endMinute] = match
    .slice(1)
    .map(Number);

  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59) {
    return null;
  }

  const pad = (number) => String(number).padStart(2, "0");

  return {
    start: `${pad(startHour)}:${pad(startMinute)}`,
    end: `${pad(endHour)}:${pad(endMinute)}`,
  };
}

// 프로그램 한 건에서 등록 폼에 채울 값을 뽑는다. 못 채우는 값은 "" / [] 로 둔다.
//   { days: ["월", "수", "금"], startTime: "19:00", endTime: "19:50" }
export function getProgramSchedule(program) {
  const days = parseProgramDays(program?.program_day);
  const time = parseProgramTime(program?.program_time);

  return {
    days,
    startTime: time ? time.start : "",
    endTime: time ? time.end : "",
  };
}

// 드롭다운에 보여줄 라벨. 같은 이름의 프로그램을 요일/시간으로 구분할 수 있게 한다.
//   "다이어트댄스 · 월수금 · 19:00~19:50"
//   "자율탁구3 · 화목 · 시간 정보 없음"
export function formatProgramLabel(program) {
  const { days, startTime, endTime } = getProgramSchedule(program);

  const dayText = days.length > 0 ? days.join("") : NO_DAY_TEXT;
  const timeText = startTime ? `${startTime}~${endTime}` : NO_TIME_TEXT;

  return `${program?.program_name ?? ""} · ${dayText} · ${timeText}`;
}

function sameDays(a, b) {
  return a.length === b.length && a.every((day, index) => day === b[index]);
}

// 프로그램을 바꿀 때 폼의 요일/시간을 어떻게 바꿀지 계산한다.
//   current         : 지금 폼에 들어 있는 { days, startTime, endTime }
//   previousProgram : 바꾸기 전에 선택돼 있던 프로그램 (없으면 null)
//   nextProgram     : 새로 선택한 프로그램 (선택 해제/직접 입력/시설 변경이면 null)
//
// - 새 프로그램에 값이 있으면 그 값으로 덮어쓴다.
// - 새 프로그램에 값이 없으면, 지금 값이 이전 프로그램에서 자동으로 채워진 그대로일
//   때만 비운다. (다른 프로그램의 요일/시간이 남아 있으면 오해를 부른다)
//   사용자가 직접 입력하거나 고친 값은 지우지 않는다.
export function applyProgramSchedule(current, previousProgram, nextProgram) {
  const previous = getProgramSchedule(previousProgram);
  const next = getProgramSchedule(nextProgram);

  return {
    days:
      next.days.length > 0
        ? next.days
        : sameDays(current.days, previous.days)
          ? []
          : current.days,
    startTime:
      next.startTime !== ""
        ? next.startTime
        : current.startTime === previous.startTime
          ? ""
          : current.startTime,
    endTime:
      next.endTime !== ""
        ? next.endTime
        : current.endTime === previous.endTime
          ? ""
          : current.endTime,
  };
}

// 프로그램을 골랐을 때 폼 아래에 보여줄 안내 문구. 선택한 프로그램이 없으면 "".
// 시간 정보가 없는 프로그램이 많아서, 자동으로 채워졌는지/직접 입력해야 하는지를
// 알려준다.
export function describeProgramSchedulePrefill(program) {
  if (!program) return "";

  const { days, startTime } = getProgramSchedule(program);

  const filled = [];
  const missing = [];

  (days.length > 0 ? filled : missing).push("요일");
  (startTime ? filled : missing).push("시간");

  if (missing.length === 0) {
    return "선택한 프로그램의 요일·시간을 채웠어요. 실제 수강 정보와 다르면 수정해주세요.";
  }

  if (filled.length === 0) {
    return "이 프로그램에는 요일·시간 정보가 없어요. 아래에서 직접 입력해주세요.";
  }

  return `선택한 프로그램의 ${filled[0]}을 채웠어요. ${missing[0]} 정보는 없어서 직접 입력해주세요.`;
}
