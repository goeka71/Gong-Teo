// 모바일 전용 바텀시트 껍데기.
//
// FacilityMapLayout 이 지도 위에 상세류 라우트(시설 상세 / 세부시설 상세 /
// 리뷰) 의 Outlet 내용을 감쌀 때 쓴다. FacilityDetail.jsx 등 안쪽 컴포넌트는
// 이 컴포넌트를 전혀 모르고, 그냥 평소처럼 렌더링될 뿐이다 — "간단한 정보"
// (peek 상태에서 보이는 부분)와 "더 많은 정보"(expanded 상태에서 스크롤로
// 보이는 나머지)는 각 컴포넌트가 이미 위→아래로 쌓아둔 순서를 그대로
// 이용한다(예: FacilityDetail 은 이름/이미지/접근성 정보가 위, 시설정보·
// 리뷰가 아래).
//
// PC(데스크톱 미디어쿼리)에서는 이 컴포넌트가 렌더하는 마크업이 그냥
// ".fml-panel" 한 겹으로만 보여서 기존 좌측 패널과 스타일이 완전히
// 동일하다 — 바텀시트 전용 스타일(FacilityBottomSheet.css)은 전부 모바일
// 전용 미디어쿼리 안에서만 적용된다.

import { useEffect, useRef, useState } from "react";
import "./FacilityBottomSheet.css";

// FacilityBottomSheet.css 의 --fbs-peek / height(92vh) 값과 맞춰서 쓴다.
const FULL_VH = 92;
const PEEK_VH = 42;
const TAP_THRESHOLD_PX = 6; // 이보다 적게 움직이면 드래그가 아니라 탭(펼침/접힘 토글)으로 취급.

function FacilityBottomSheet({ resetKey, children }) {
  const [expanded, setExpanded] = useState(false);
  const sheetRef = useRef(null);
  const bodyRef = useRef(null);
  const dragRef = useRef(null);

  // 새 시설/세부시설/리뷰 화면으로 바뀔 때마다 "간단한 정보"부터 다시
  // 보여준다 (예: 시설 A 를 펼쳐본 채로 시설 B 마커를 눌러도 B 는 다시
  // peek 부터). 이펙트 대신 렌더 중 상태 조정 패턴을 쓴다 — resetKey 가
  // 바뀐 걸 렌더링 중에 감지해서 그 자리에서 바로 접어버리면, 이펙트를
  // 거치며 한 프레임 더 펼쳐진 채로 보였다가 접히는 깜빡임이 없다.
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setExpanded(false);
  }

  // 새 화면으로 바뀌었을 때는 내부 스크롤 위치도 맨 위로 되돌린다(DOM 동기화라
  // 렌더 중이 아니라 이펙트에서 처리). 위 state 조정과 분리해두는 이유는,
  // 스크롤 위치는 React state 가 아니라 DOM 이 들고 있는 값이기 때문이다.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [resetKey]);

  // expanded=false(접힘)로 돌아갈 때 내부 스크롤을 맨 위로 되돌린다.
  // 안 그러면 리뷰 등 아래쪽까지 스크롤해서 보던 중 접었을 때, peek 에
  // "간단한 정보"(이름/이미지) 대신 스크롤돼 있던 중간 지점이 잘려 보인다.
  function collapse() {
    setExpanded(false);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }

  function currentMaxTranslatePx() {
    return (window.innerHeight * (FULL_VH - PEEK_VH)) / 100;
  }

  function handlePointerDown(event) {
    const sheet = sheetRef.current;
    if (!sheet) return;

    dragRef.current = {
      startY: event.clientY,
      startTranslate: expanded ? 0 : currentMaxTranslatePx(),
      maxTranslate: currentMaxTranslatePx(),
      moved: false,
    };

    sheet.classList.add("fbs-sheet--dragging");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    const sheet = sheetRef.current;
    if (!drag || !sheet) return;

    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > TAP_THRESHOLD_PX) drag.moved = true;

    const next = Math.min(Math.max(drag.startTranslate + delta, 0), drag.maxTranslate);
    sheet.style.transform = `translateY(${next}px)`;
  }

  function endDrag(event) {
    const drag = dragRef.current;
    const sheet = sheetRef.current;
    dragRef.current = null;
    if (!drag || !sheet) return;

    sheet.classList.remove("fbs-sheet--dragging");
    sheet.style.transform = "";

    if (!drag.moved) {
      // 움직임이 거의 없었으면 드래그가 아니라 탭 — 상태를 토글한다.
      if (expanded) collapse();
      else setExpanded(true);
      return;
    }

    const delta = event.clientY - drag.startY;
    const finalTranslate = Math.min(
      Math.max(drag.startTranslate + delta, 0),
      drag.maxTranslate
    );
    if (finalTranslate < drag.maxTranslate / 2) setExpanded(true);
    else collapse();
  }

  return (
    <div
      ref={sheetRef}
      className={"fml-panel fbs-sheet" + (expanded ? " fbs-sheet--expanded" : "")}
    >
      <div
        className="fbs-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="button"
        tabIndex={0}
        aria-label={expanded ? "간단히 보기" : "자세히 보기"}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (expanded) collapse();
            else setExpanded(true);
          }
        }}
      >
        <span className="fbs-handle-bar" aria-hidden="true" />
      </div>
      <div className="fbs-body" ref={bodyRef}>
        {children}
      </div>
    </div>
  );
}

export default FacilityBottomSheet;
