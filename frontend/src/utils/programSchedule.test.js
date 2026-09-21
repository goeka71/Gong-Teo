// 실행: npm test  (Node 내장 테스트 러너 사용, 별도 의존성 없음)
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  applyProgramSchedule,
  describeProgramSchedulePrefill,
  formatProgramLabel,
  getProgramSchedule,
  parseProgramDays,
  parseProgramTime,
} from "./programSchedule.js";

describe("parseProgramDays", () => {
  test("요일 글자만 있는 값은 글자별로 나눈다", () => {
    assert.deepEqual(parseProgramDays("월수금"), ["월", "수", "금"]);
    assert.deepEqual(parseProgramDays("토"), ["토"]);
  });

  test("적힌 순서를 유지한다 (일요일이 뒤에 와도 앞으로 옮기지 않는다)", () => {
    assert.deepEqual(parseProgramDays("화수목금토일"), [
      "화", "수", "목", "금", "토", "일",
    ]);
  });

  test('앞에 붙은 "요일" 접두어를 떼고 해석한다', () => {
    assert.deepEqual(parseProgramDays("요일월수금"), ["월", "수", "금"]);
    assert.deepEqual(parseProgramDays("요일화목"), ["화", "목"]);
  });

  test('"요일" 안의 "일" 을 일요일로 읽지 않는다', () => {
    assert.deepEqual(parseProgramDays("요일토"), ["토"]);
    assert.deepEqual(parseProgramDays("요일금"), ["금"]);
  });

  test('"요일" 뒤의 진짜 일요일은 살린다', () => {
    assert.deepEqual(parseProgramDays("요일일"), ["일"]);
  });

  test("쉼표/공백/슬래시 구분자를 허용한다", () => {
    assert.deepEqual(parseProgramDays("월,수,금"), ["월", "수", "금"]);
    assert.deepEqual(parseProgramDays("월 수 금"), ["월", "수", "금"]);
    assert.deepEqual(parseProgramDays(" 월/수 "), ["월", "수"]);
  });

  test("중복은 뺀다", () => {
    assert.deepEqual(parseProgramDays("월월수"), ["월", "수"]);
  });

  test("비어 있거나 문자열이 아니면 빈 배열", () => {
    assert.deepEqual(parseProgramDays(""), []);
    assert.deepEqual(parseProgramDays("   "), []);
    assert.deepEqual(parseProgramDays(null), []);
    assert.deepEqual(parseProgramDays(undefined), []);
    assert.deepEqual(parseProgramDays(123), []);
  });

  test("요일 글자가 아닌 것이 섞여 있으면 해석하지 않는다", () => {
    assert.deepEqual(parseProgramDays("토요일"), []);
    assert.deepEqual(parseProgramDays("평일"), []);
    assert.deepEqual(parseProgramDays("월수(격주)"), []);
  });
});

describe("parseProgramTime", () => {
  test("~ 와 - 구분자를 모두 해석한다", () => {
    assert.deepEqual(parseProgramTime("19:00~19:50"), {
      start: "19:00",
      end: "19:50",
    });
    assert.deepEqual(parseProgramTime("19:00-19:50"), {
      start: "19:00",
      end: "19:50",
    });
  });

  test("앞뒤/구분자 주변 공백을 허용한다", () => {
    assert.deepEqual(parseProgramTime(" 09:00 ~ 09:50 "), {
      start: "09:00",
      end: "09:50",
    });
  });

  test("한 자리 시각은 두 자리로 맞춘다 (time input 형식)", () => {
    assert.deepEqual(parseProgramTime("9:00~9:50"), {
      start: "09:00",
      end: "09:50",
    });
  });

  test("비어 있으면 null", () => {
    assert.equal(parseProgramTime(""), null);
    assert.equal(parseProgramTime(null), null);
    assert.equal(parseProgramTime(undefined), null);
    assert.equal(parseProgramTime(1950), null);
  });

  test("program.csv 에 실제로 있는 깨진 값은 null", () => {
    for (const broken of [
      "3837.50%",
      "101283.30%",
      "120%",
      "109:30~11:2",
      "1.209:30~13",
      "12:00~13",
    ]) {
      assert.equal(parseProgramTime(broken), null, broken);
    }
  });

  test("시/분 범위를 벗어나면 null", () => {
    assert.equal(parseProgramTime("18:80~22:00"), null);
    assert.equal(parseProgramTime("24:00~25:00"), null);
    assert.equal(parseProgramTime("10:00~10:60"), null);
  });
});

describe("getProgramSchedule", () => {
  test("요일과 시간을 폼에 채울 값으로 돌려준다", () => {
    assert.deepEqual(
      getProgramSchedule({ program_day: "월수금", program_time: "19:00~19:50" }),
      { days: ["월", "수", "금"], startTime: "19:00", endTime: "19:50" }
    );
  });

  test("시간이 깨져 있어도 요일은 채운다", () => {
    assert.deepEqual(
      getProgramSchedule({ program_day: "화목", program_time: "3837.50%" }),
      { days: ["화", "목"], startTime: "", endTime: "" }
    );
  });

  test("정보가 없으면 빈 값", () => {
    const empty = { days: [], startTime: "", endTime: "" };
    assert.deepEqual(getProgramSchedule({ program_day: "", program_time: "" }), empty);
    assert.deepEqual(getProgramSchedule({}), empty);
    assert.deepEqual(getProgramSchedule(null), empty);
    assert.deepEqual(getProgramSchedule(undefined), empty);
  });
});

describe("formatProgramLabel", () => {
  test("이름 · 요일 · 시간", () => {
    assert.equal(
      formatProgramLabel({
        program_name: "다이어트댄스",
        program_day: "월수금",
        program_time: "19:00~19:50",
      }),
      "다이어트댄스 · 월수금 · 19:00~19:50"
    );
  });

  test("- 구분자와 요일 접두어는 정리해서 보여준다", () => {
    assert.equal(
      formatProgramLabel({
        program_name: "수영",
        program_day: "요일화목",
        program_time: "09:00-09:50",
      }),
      "수영 · 화목 · 09:00~09:50"
    );
  });

  test("시간이 없거나 깨져 있으면 원문 대신 안내 문구를 보여준다", () => {
    assert.equal(
      formatProgramLabel({
        program_name: "자율탁구3",
        program_day: "화목",
        program_time: "",
      }),
      "자율탁구3 · 화목 · 시간 정보 없음"
    );
    assert.equal(
      formatProgramLabel({
        program_name: "자율탁구3",
        program_day: "화목",
        program_time: "3837.50%",
      }),
      "자율탁구3 · 화목 · 시간 정보 없음"
    );
  });

  test("요일이 없으면 안내 문구를 보여준다", () => {
    assert.equal(
      formatProgramLabel({
        program_name: "자유수영",
        program_day: "",
        program_time: "06:00~21:50",
      }),
      "자유수영 · 요일 정보 없음 · 06:00~21:50"
    );
  });

  test("요일과 시간이 모두 같은 이름이라도 라벨로 구분된다", () => {
    const base = { program_name: "수영", program_day: "월수" };
    assert.notEqual(
      formatProgramLabel({ ...base, program_time: "09:00~09:50" }),
      formatProgramLabel({ ...base, program_time: "10:00~10:50" })
    );
  });

  test("프로그램이 없어도 오류 없이 동작한다", () => {
    assert.equal(formatProgramLabel(null), " · 요일 정보 없음 · 시간 정보 없음");
  });
});

describe("applyProgramSchedule", () => {
  const empty = { days: [], startTime: "", endTime: "" };
  const programA = { program_day: "월수", program_time: "09:00~09:50" };
  const programB = { program_day: "화목", program_time: "19:00~19:50" };
  const noInfo = { program_day: "", program_time: "" };
  const dayOnly = { program_day: "토", program_time: "" };

  test("처음 프로그램을 고르면 그 값으로 채운다", () => {
    assert.deepEqual(applyProgramSchedule(empty, null, programA), {
      days: ["월", "수"],
      startTime: "09:00",
      endTime: "09:50",
    });
  });

  test("다른 프로그램으로 바꾸면 새 값으로 덮어쓴다", () => {
    const current = { days: ["월", "수"], startTime: "09:00", endTime: "09:50" };
    assert.deepEqual(applyProgramSchedule(current, programA, programB), {
      days: ["화", "목"],
      startTime: "19:00",
      endTime: "19:50",
    });
  });

  test("사용자가 고친 값도 새 프로그램에 값이 있으면 덮어쓴다", () => {
    const edited = { days: ["금"], startTime: "07:00", endTime: "08:00" };
    assert.deepEqual(applyProgramSchedule(edited, programA, programB), {
      days: ["화", "목"],
      startTime: "19:00",
      endTime: "19:50",
    });
  });

  test("정보 없는 프로그램으로 바꾸면 자동으로 채워졌던 값은 비운다", () => {
    const current = { days: ["월", "수"], startTime: "09:00", endTime: "09:50" };
    assert.deepEqual(applyProgramSchedule(current, programA, noInfo), empty);
  });

  test("정보 없는 프로그램으로 바꿔도 사용자가 고친 값은 지우지 않는다", () => {
    const edited = { days: ["금"], startTime: "07:00", endTime: "08:00" };
    assert.deepEqual(applyProgramSchedule(edited, programA, noInfo), edited);
  });

  test("정보 없는 프로그램을 처음 고를 때 미리 입력한 값은 유지한다", () => {
    const typed = { days: ["금"], startTime: "07:00", endTime: "08:00" };
    assert.deepEqual(applyProgramSchedule(typed, null, noInfo), typed);
  });

  test("요일/시간은 각각 따로 판단한다", () => {
    // 이전 프로그램은 요일·시간이 다 있었고, 사용자는 시간만 고쳤다.
    const current = { days: ["월", "수"], startTime: "10:00", endTime: "11:00" };
    assert.deepEqual(applyProgramSchedule(current, programA, dayOnly), {
      days: ["토"],
      startTime: "10:00",
      endTime: "11:00",
    });
  });

  test("선택 해제/직접 입력(nextProgram=null)이면 자동 채움 값만 비운다", () => {
    const auto = { days: ["화", "목"], startTime: "19:00", endTime: "19:50" };
    assert.deepEqual(applyProgramSchedule(auto, programB, null), empty);

    // 요일은 programB 가 채운 그대로(→ 비움), 시간은 사용자가 고침(→ 유지)
    const edited = { days: ["화", "목"], startTime: "20:00", endTime: "20:50" };
    assert.deepEqual(applyProgramSchedule(edited, programB, null), {
      days: [],
      startTime: "20:00",
      endTime: "20:50",
    });
  });

  test("입력을 바꾸지 않고 새 객체를 돌려준다", () => {
    const current = { days: ["월", "수"], startTime: "09:00", endTime: "09:50" };
    const snapshot = JSON.parse(JSON.stringify(current));
    applyProgramSchedule(current, programA, programB);
    assert.deepEqual(current, snapshot);
  });
});

describe("describeProgramSchedulePrefill", () => {
  test("선택한 프로그램이 없으면 빈 문자열", () => {
    assert.equal(describeProgramSchedulePrefill(null), "");
    assert.equal(describeProgramSchedulePrefill(undefined), "");
  });

  test("요일·시간이 모두 채워지면 수정 안내", () => {
    assert.match(
      describeProgramSchedulePrefill({
        program_day: "월수",
        program_time: "09:00~09:50",
      }),
      /채웠어요.*수정/
    );
  });

  test("둘 다 없으면 직접 입력 안내", () => {
    assert.match(
      describeProgramSchedulePrefill({ program_day: "", program_time: "" }),
      /요일·시간 정보가 없어요/
    );
  });

  test("한쪽만 없으면 무엇이 채워졌고 무엇이 비었는지 알려준다", () => {
    assert.equal(
      describeProgramSchedulePrefill({ program_day: "토", program_time: "" }),
      "선택한 프로그램의 요일을 채웠어요. 시간 정보는 없어서 직접 입력해주세요."
    );
    assert.equal(
      describeProgramSchedulePrefill({
        program_day: "",
        program_time: "09:00~09:50",
      }),
      "선택한 프로그램의 시간을 채웠어요. 요일 정보는 없어서 직접 입력해주세요."
    );
  });

  test("깨진 시간 값은 없는 것으로 본다", () => {
    assert.match(
      describeProgramSchedulePrefill({
        program_day: "화목",
        program_time: "3837.50%",
      }),
      /시간 정보는 없어서/
    );
  });
});
