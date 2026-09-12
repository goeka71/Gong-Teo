// 찜(즐겨찾기) 버튼에 공용으로 쓰는 하트 아이콘.
// 찜 기능 자체는 아직 없어서(백엔드 연동 전) 상세페이지/지도 버튼이
// 이 아이콘을 그대로 가져다 쓰고, filled 로만 찜 여부를 시각적으로 구분한다.
//   filled=false: 테두리만 있는 하트 (찜 안 한 상태)
//   filled=true : 채워진 하트 (찜한 상태)

function HeartIcon({ filled = false, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      aria-hidden="true"
    >
      <path d="M12 21s-6.72-4.35-9.33-8.2C1.02 10.6 1.4 7.3 4.1 5.6c2.2-1.4 4.9-.8 6.4 1.1L12 8.6l1.5-1.9c1.5-1.9 4.2-2.5 6.4-1.1 2.7 1.7 3.08 5 1.43 7.2C18.72 16.65 12 21 12 21z" />
    </svg>
  );
}

export default HeartIcon;
