// 도보 시간은 DB에 '초' 단위로 저장돼 있다. 이를 "N분 M초" 형태로 변환한다.
export function formatWalkTime(seconds) {
  if (seconds === null || seconds === undefined) return "";

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes > 0 && secs > 0) return `${minutes}분 ${secs}초`;
  if (minutes > 0) return `${minutes}분`;
  return `${secs}초`;
}
