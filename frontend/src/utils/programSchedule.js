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
