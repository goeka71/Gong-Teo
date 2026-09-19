// 모바일 전용 바텀시트 껍데기.
//
// FacilityMapLayout 이 지도 위에 상세류 라우트(시설 상세 / 세부시설 상세 /
// 리뷰) 의 Outlet 내용을 감쌀 때 쓴다.
//
// 기존 바텀시트의 peek / expanded / drag 기능은 그대로 유지하고,
// 모바일에서 내부 내용을 스크롤할 때 상단 Navbar도
// 일반 본문처럼 자연스럽게 위로 사라지도록 처리한다.

import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./FacilityBottomSheet.css";


// FacilityBottomSheet.css 의
// --fbs-peek / height(92vh) 값과 맞춰서 사용
const FULL_VH = 92;
const PEEK_VH = 42;

const TAP_THRESHOLD_PX = 6;


function FacilityBottomSheet({
  resetKey,
  children,
}) {
  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const sheetRef = useRef(null);

  const bodyRef = useRef(null);

  const dragRef = useRef(null);


  /* =========================================================
     Navbar 원래 위치로 복구
  ========================================================= */

  function resetNavbarPosition() {
    const navbar =
      document.querySelector(
        ".gnb"
      );

    if (!navbar) {
      return;
    }

    navbar.style.transform = "";
  }


  /* =========================================================
     바텀시트 내부 스크롤 시
     Navbar도 함께 위로 이동
  ========================================================= */

  function handleBodyScroll(event) {
    const navbar =
      document.querySelector(
        ".gnb"
      );

    if (!navbar) {
      return;
    }

    /*
      PC에서는 Navbar를 건드리지 않는다.
      세로형 모바일 화면에서만 적용.
    */
    const isMobile =
      window.matchMedia(
        "(max-aspect-ratio: 1 / 1)"
      ).matches;

    if (!isMobile) {
      navbar.style.transform = "";
      return;
    }


    const scrollTop =
      event.currentTarget.scrollTop;

    const navbarHeight =
      navbar.offsetHeight;


    /*
      Navbar 높이만큼 스크롤하면
      화면 위로 완전히 사라진다.

      다시 맨 위로 올라오면
      transform 값도 0이 되면서
      Navbar가 다시 나타난다.
    */
    const moveAmount =
      Math.min(
        scrollTop,
        navbarHeight
      );


    navbar.style.transform =
      `translateY(-${moveAmount}px)`;
  }


  /* =========================================================
     새로운 시설 화면으로 이동
  ========================================================= */

  const [
    prevResetKey,
    setPrevResetKey,
  ] = useState(resetKey);


  if (
    resetKey !==
    prevResetKey
  ) {
    setPrevResetKey(
      resetKey
    );

    setExpanded(false);
  }


  /*
    새 시설 / 세부시설 / 리뷰로 이동하면
    내부 스크롤을 맨 위로 되돌리고
    Navbar도 다시 보여준다.
  */
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    resetNavbarPosition();

  }, [resetKey]);


  /*
    다른 페이지로 이동해서
    FacilityBottomSheet가 사라질 경우에도
    Navbar 위치를 반드시 원래대로 복구한다.
  */
  useEffect(() => {
    return () => {
      resetNavbarPosition();
    };
  }, []);


  /* =========================================================
     바텀시트 접기
  ========================================================= */

  function collapse() {
    setExpanded(false);

    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    resetNavbarPosition();
  }


  /* =========================================================
     최대 드래그 거리 계산
  ========================================================= */

  function currentMaxTranslatePx() {
    return (
      window.innerHeight *
      (
        FULL_VH -
        PEEK_VH
      )
    ) / 100;
  }


  /* =========================================================
     드래그 시작
  ========================================================= */

  function handlePointerDown(
    event
  ) {
    const sheet =
      sheetRef.current;

    if (!sheet) {
      return;
    }


    dragRef.current = {
      startY:
        event.clientY,

      startTranslate:
        expanded
          ? 0
          : currentMaxTranslatePx(),

      maxTranslate:
        currentMaxTranslatePx(),

      moved: false,
    };


    sheet.classList.add(
      "fbs-sheet--dragging"
    );


    event.currentTarget
      .setPointerCapture?.(
        event.pointerId
      );
  }


  /* =========================================================
     드래그 중
  ========================================================= */

  function handlePointerMove(
    event
  ) {
    const drag =
      dragRef.current;

    const sheet =
      sheetRef.current;


    if (
      !drag ||
      !sheet
    ) {
      return;
    }


    const delta =
      event.clientY -
      drag.startY;


    if (
      Math.abs(delta) >
      TAP_THRESHOLD_PX
    ) {
      drag.moved = true;
    }


    const next =
      Math.min(
        Math.max(
          drag.startTranslate +
            delta,
          0
        ),

        drag.maxTranslate
      );


    sheet.style.transform =
      `translateY(${next}px)`;
  }


  /* =========================================================
     드래그 종료
  ========================================================= */

  function endDrag(
    event
  ) {
    const drag =
      dragRef.current;

    const sheet =
      sheetRef.current;


    dragRef.current = null;


    if (
      !drag ||
      !sheet
    ) {
      return;
    }


    sheet.classList.remove(
      "fbs-sheet--dragging"
    );


    sheet.style.transform =
      "";


    /*
      거의 움직이지 않았다면
      드래그가 아니라 탭으로 판단
    */
    if (!drag.moved) {
      if (expanded) {
        collapse();
      } else {
        setExpanded(true);
      }

      return;
    }


    const delta =
      event.clientY -
      drag.startY;


    const finalTranslate =
      Math.min(
        Math.max(
          drag.startTranslate +
            delta,
          0
        ),

        drag.maxTranslate
      );


    if (
      finalTranslate <
      drag.maxTranslate / 2
    ) {
      setExpanded(true);
    } else {
      collapse();
    }
  }


  /* =========================================================
     화면
  ========================================================= */

  return (
    <div
      ref={sheetRef}

      className={
        "fml-panel fbs-sheet" +
        (
          expanded
            ? " fbs-sheet--expanded"
            : ""
        )
      }
    >

      {/* 기존 바텀시트 손잡이 유지 */}
      <div
        className="fbs-handle"

        onPointerDown={
          handlePointerDown
        }

        onPointerMove={
          handlePointerMove
        }

        onPointerUp={
          endDrag
        }

        onPointerCancel={
          endDrag
        }

        role="button"

        tabIndex={0}

        aria-label={
          expanded
            ? "간단히 보기"
            : "자세히 보기"
        }

        onKeyDown={(
          event
        ) => {
          if (
            event.key ===
              "Enter" ||
            event.key ===
              " "
          ) {
            event.preventDefault();

            if (expanded) {
              collapse();
            } else {
              setExpanded(
                true
              );
            }
          }
        }}
      >
        <span
          className="fbs-handle-bar"
          aria-hidden="true"
        />
      </div>


      {/* 기존 주변시설/시설상세 등 모든 내용 유지 */}
      <div
        className="fbs-body"

        ref={bodyRef}

        onScroll={
          handleBodyScroll
        }
      >
        {children}
      </div>

    </div>
  );
}


export default FacilityBottomSheet;