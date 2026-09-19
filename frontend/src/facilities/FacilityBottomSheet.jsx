import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import "./FacilityBottomSheet.css";


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

  const location = useLocation();


  /* =========================================================
     모바일 Navbar 표시 / 숨김
  ========================================================= */

  useEffect(() => {
    const media = window.matchMedia(
      "(max-aspect-ratio: 1 / 1)"
    );

    const syncNavbar = () => {
      const isMobile =
        media.matches;

      /*
        1. 바텀시트를 크게 펼쳤을 때
        2. 시설 상세 화면에 들어갔을 때

        모바일 Navbar 숨김
      */
      const isFacilityDetail =
        location.pathname.startsWith(
          "/facility/"
        );

      const shouldHide =
        isMobile &&
        (
          expanded ||
          isFacilityDetail
        );


      document.body.classList.toggle(
        "mobile-hide-gnb",
        shouldHide
      );
    };


    syncNavbar();


    media.addEventListener?.(
      "change",
      syncNavbar
    );


    return () => {
      media.removeEventListener?.(
        "change",
        syncNavbar
      );

      document.body.classList.remove(
        "mobile-hide-gnb"
      );
    };

  }, [
    expanded,
    location.pathname,
  ]);


  /* =========================================================
     resetKey 변경
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


  /* =========================================================
     새 화면 이동 시 스크롤 초기화
  ========================================================= */

  useEffect(() => {
    if (
      bodyRef.current
    ) {
      bodyRef.current.scrollTop =
        0;
    }
  }, [resetKey]);


  /* =========================================================
     접기
  ========================================================= */

  function collapse() {
    setExpanded(false);

    if (
      bodyRef.current
    ) {
      bodyRef.current.scrollTop =
        0;
    }
  }


  /* =========================================================
     최대 이동거리
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
      움직임이 거의 없었다면
      드래그가 아니라 탭
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


      <div
        className="fbs-body"
        ref={bodyRef}
      >
        {children}
      </div>

    </div>
  );
}


export default FacilityBottomSheet;