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
const PEEK_VH = 20;

const TAP_THRESHOLD_PX = 6;


function FacilityBottomSheet({
  resetKey,
  children,
}) {

  const [
    expanded,
    setExpanded,
  ] = useState(false);


  const sheetRef =
    useRef(null);

  const bodyRef =
    useRef(null);

  const dragRef =
    useRef(null);


  const location =
    useLocation();


  /* =========================================================
     모바일 Navbar 표시 / 숨김

     Navbar 숨기는 경우:

     1. 주변시설 찾기 바텀시트를 크게 펼친 경우
     2. /facility/... 시설 상세 화면에 들어간 경우
     ========================================================= */

  useEffect(() => {

    const media =
      window.matchMedia(
        "(max-aspect-ratio: 1 / 1)"
      );


    const syncNavbar =
      () => {

        const isMobile =
          media.matches;


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


        document.body
          .classList
          .toggle(
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

      document.body
        .classList
        .remove(
          "mobile-hide-gnb"
        );
    };

  }, [
    expanded,
    location.pathname,
  ]);


  /* =========================================================
     화면이 바뀌면 바텀시트 다시 접기
     ========================================================= */

  const [
    prevResetKey,
    setPrevResetKey,
  ] = useState(
    resetKey
  );


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
     새로운 시설 / 화면으로 바뀌면
     내부 스크롤 맨 위로
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
     최대 이동 거리
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

      moved:
        false,
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

      drag.moved =
        true;
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


    dragRef.current =
      null;


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

    if (
      !drag.moved
    ) {

      if (
        expanded
      ) {

        collapse();

      } else {

        setExpanded(
          true
        );
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


    /*
      절반 이상 올렸으면 펼침

      아니면 다시 접기
    */

    if (
      finalTranslate <
      drag.maxTranslate / 2
    ) {

      setExpanded(
        true
      );

    } else {

      collapse();
    }
  }


  /* =========================================================
     화면
     ========================================================= */

  return (

    <div
      ref={
        sheetRef
      }

      className={
        "fml-panel fbs-sheet" +
        (
          expanded
            ? " fbs-sheet--expanded"
            : ""
        )
      }
    >

      {/* ===============================
          바텀시트 드래그 손잡이
         =============================== */}

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

        tabIndex={
          0
        }

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


            if (
              expanded
            ) {

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


      {/* ===============================
          주변시설 / 시설상세 내용
         =============================== */}

      <div
        className="fbs-body"

        ref={
          bodyRef
        }
      >

        {children}

      </div>

    </div>
  );
}


export default FacilityBottomSheet;