import { useEffect, useRef, useState } from "react";
import "./OnedayDetail.css";


// ==========================================
// 날짜 표시
// ==========================================
function formatDate(dateString) {

  if (!dateString) {
    return "정보 없음";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();

  const week = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
  ];

  return `${month}월 ${day}일 (${week[date.getDay()]})`;

}


// ==========================================
// 종목 아이콘
// ==========================================
function getSportIcon(programName = "") {

  const name = programName.toLowerCase();

  if (name.includes("수영")) return "🏊";
  if (name.includes("헬스")) return "🏋️";
  if (name.includes("피트니스")) return "🏋️";
  if (name.includes("요가")) return "🧘";
  if (name.includes("필라테스")) return "🤸";
  if (name.includes("축구")) return "⚽";
  if (name.includes("농구")) return "🏀";
  if (name.includes("배드민턴")) return "🏸";
  if (name.includes("테니스")) return "🎾";
  if (name.includes("탁구")) return "🏓";
  if (name.includes("골프")) return "⛳";
  if (name.includes("복싱")) return "🥊";
  if (name.includes("클라이밍")) return "🧗";

  return "🏃";

}


// ==========================================
// 카카오맵 SDK 불러오기
// ==========================================
function loadKakaoMapScript() {

  return new Promise((resolve, reject) => {

    if (
      window.kakao &&
      window.kakao.maps
    ) {

      window.kakao.maps.load(() => {
        resolve(window.kakao);
      });

      return;

    }


    const existingScript =
      document.getElementById("kakao-map-script");


    if (existingScript) {

      existingScript.addEventListener(
        "load",
        () => {

          if (
            window.kakao &&
            window.kakao.maps
          ) {

            window.kakao.maps.load(() => {
              resolve(window.kakao);
            });

          }

        }
      );

      return;

    }


    const kakaoMapKey =
      import.meta.env.VITE_KAKAO_MAP_KEY;


    if (!kakaoMapKey) {

      reject(
        new Error(
          "VITE_KAKAO_MAP_KEY가 설정되지 않았습니다."
        )
      );

      return;

    }


    const script =
      document.createElement("script");


    script.id = "kakao-map-script";


    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false`;


    script.async = true;


    script.onload = () => {

      if (
        window.kakao &&
        window.kakao.maps
      ) {

        window.kakao.maps.load(() => {

          resolve(window.kakao);

        });

      } else {

        reject(
          new Error(
            "카카오맵 SDK를 불러오지 못했습니다."
          )
        );

      }

    };


    script.onerror = () => {

      reject(
        new Error(
          "카카오맵 스크립트 로딩에 실패했습니다."
        )
      );

    };


    document.head.appendChild(script);

  });

}


// ==========================================
// 원데이 상세 페이지
// ==========================================
function OnedayDetail({ post, onBack }) {

  const mapRef = useRef(null);


  // 지도 오류
  const [mapError, setMapError] =
    useState("");


  // 신청 모달 열기/닫기
  const [isApplyModalOpen, setIsApplyModalOpen] =
    useState(false);


  // 확인 체크박스
  const [isConfirmed, setIsConfirmed] =
    useState(false);


  // ==========================================
  // 카카오맵 연결
  // ==========================================
  useEffect(() => {

    async function createMap() {

      if (
        post.latit === null ||
        post.latit === undefined ||
        post.longit === null ||
        post.longit === undefined
      ) {

        setMapError(
          "시설 좌표 정보가 없습니다."
        );

        return;

      }


      if (!mapRef.current) {
        return;
      }


      try {

        const kakao =
          await loadKakaoMapScript();


        const latitude =
          Number(post.latit);

        const longitude =
          Number(post.longit);


        if (
          Number.isNaN(latitude) ||
          Number.isNaN(longitude)
        ) {

          setMapError(
            "올바른 좌표 정보가 아닙니다."
          );

          return;

        }


        const position =
          new kakao.maps.LatLng(
            latitude,
            longitude
          );


        const options = {

          center: position,

          level: 3,

        };


        const map =
          new kakao.maps.Map(
            mapRef.current,
            options
          );


        const marker =
          new kakao.maps.Marker({

            position,

          });


        marker.setMap(map);


        const infoWindow =
          new kakao.maps.InfoWindow({

            content: `
              <div style="
                padding:8px 12px;
                font-size:13px;
                white-space:nowrap;
              ">
                ${post.facility_name || "시설 위치"}
              </div>
            `,

          });


        infoWindow.open(
          map,
          marker
        );


        setMapError("");


      } catch (error) {

        console.error(
          "카카오맵 오류:",
          error
        );


        setMapError(
          error.message ||
          "지도를 불러오지 못했습니다."
        );

      }

    }


    createMap();

  }, [
    post.latit,
    post.longit,
    post.facility_name,
  ]);


  // ==========================================
  // 카카오맵 검색
  // ==========================================
  function openKakaoMap() {

    const query =
      post.facility_addr ||
      post.facility_name ||
      "";


    if (!query) {

      alert(
        "시설 위치 정보가 없습니다."
      );

      return;

    }


    const url =
      `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;


    window.open(
      url,
      "_blank"
    );

  }


  // ==========================================
  // 신청 모달 열기
  // ==========================================
  function openApplyModal() {

    setIsConfirmed(false);

    setIsApplyModalOpen(true);

  }


  // ==========================================
  // 신청 모달 닫기
  // ==========================================
  function closeApplyModal() {

    setIsApplyModalOpen(false);

    setIsConfirmed(false);

  }


  // ==========================================
  // 신청 확정
  // ==========================================
  function handleApplyConfirm() {

    if (!isConfirmed) {
      return;
    }


    alert(
      "원데이 신청이 완료되었습니다!"
    );


    closeApplyModal();

  }


  const isOpen =
    post.status === "open";


  return (

    <main className="oneday-detail-page">


      {/* ======================
          뒤로가기
      ====================== */}
      <button
        className="back-button"
        onClick={onBack}
      >
        ← 원데이 목록으로
      </button>


      {/* ======================
          상단 메인 정보
      ====================== */}
      <section className="detail-hero">


        <div className="detail-hero-left">


          <div className="detail-icon">

            {getSportIcon(post.program_name)}

          </div>


          <div className="detail-title-area">


            <div className="detail-badge-row">

              <span
                className={
                  isOpen
                    ? "detail-status open"
                    : "detail-status closed"
                }
              >
                {isOpen
                  ? "신청 가능"
                  : "마감"}
              </span>

            </div>


            <h1>

              {post.program_name ||
                "프로그램명 없음"}

            </h1>


            <p>

              {post.facility_name ||
                "시설 정보 없음"}

            </p>

          </div>

        </div>


        <div className="detail-coin">

          <span>
            양도 비용
          </span>

          <strong>
            -1 coin
          </strong>

        </div>

      </section>


      {/* ======================
          전체 콘텐츠
      ====================== */}
      <div className="detail-layout">


        {/* ======================
            왼쪽 내용
        ====================== */}
        <section className="detail-main">


          {/* 프로그램 정보 */}
          <div className="detail-card">


            <h2>
              프로그램 정보
            </h2>


            <div className="detail-info-grid">


              <div className="detail-info-item">

                <span className="info-icon">
                  📅
                </span>

                <div>

                  <span className="info-label">
                    양도 날짜
                  </span>

                  <strong>
                    {formatDate(post.transfer_date)}
                  </strong>

                </div>

              </div>


              <div className="detail-info-item">

                <span className="info-icon">
                  🕒
                </span>

                <div>

                  <span className="info-label">
                    프로그램 시간
                  </span>

                  <strong>
                    {post.program_time ||
                      "시간 정보 없음"}
                  </strong>

                </div>

              </div>


              <div className="detail-info-item">

                <span className="info-icon">
                  🏃
                </span>

                <div>

                  <span className="info-label">
                    프로그램 요일
                  </span>

                  <strong>
                    {post.program_day ||
                      "정보 없음"}
                  </strong>

                </div>

              </div>


              <div className="detail-info-item">

                <span className="info-icon">
                  🏢
                </span>

                <div>

                  <span className="info-label">
                    이용 시설
                  </span>

                  <strong>
                    {post.facility_name ||
                      "시설 정보 없음"}
                  </strong>

                </div>

              </div>

            </div>

          </div>


          {/* 시설 정보 */}
          <div className="detail-card">


            <h2>
              시설 정보
            </h2>


            <div className="facility-detail-list">


              <div className="facility-detail-item">

                <span>🏢</span>

                <div>

                  <strong>
                    시설명
                  </strong>

                  <p>
                    {post.facility_name ||
                      "정보 없음"}
                  </p>

                </div>

              </div>


              <div className="facility-detail-item">

                <span>📍</span>

                <div>

                  <strong>
                    주소
                  </strong>

                  <p>
                    {post.facility_addr ||
                      "주소 정보 없음"}
                  </p>

                </div>

              </div>


              {post.station && (

                <div className="facility-detail-item">

                  <span>🚇</span>

                  <div>

                    <strong>
                      가까운 지하철역
                    </strong>

                    <p>

                      {post.station}

                      {post.station_wt !== null &&
                        post.station_wt !== undefined &&
                        ` · 도보 ${post.station_wt}분`}

                    </p>

                  </div>

                </div>

              )}


              {post.bus && (

                <div className="facility-detail-item">

                  <span>🚌</span>

                  <div>

                    <strong>
                      가까운 버스정류장
                    </strong>

                    <p>

                      {post.bus}

                      {post.bus_wt !== null &&
                        post.bus_wt !== undefined &&
                        ` · 도보 ${post.bus_wt}분`}

                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>


          {/* 오시는 길 */}
          <div className="detail-card">


            <div className="map-title-row">


              <div>

                <h2>
                  오시는 길
                </h2>

                <p>
                  시설 위치를 지도에서 확인하세요.
                </p>

              </div>


              <button
                className="map-open-button"
                onClick={openKakaoMap}
              >
                카카오맵에서 보기 ↗
              </button>

            </div>


            <div
              className="kakao-map"
              ref={mapRef}
            />


            {mapError && (

              <div className="map-empty">

                📍

                <p>
                  {mapError}
                </p>

              </div>

            )}


            {post.facility_addr && (

              <p className="map-address">

                📍 {post.facility_addr}

              </p>

            )}

          </div>

        </section>


        {/* ======================
            오른쪽 신청 카드
        ====================== */}
        <aside className="detail-sidebar">


          <div className="apply-card">


            <h3>
              이 원데이 클래스에
              신청할까요?
            </h3>


            <p>
              신청 후 양도가 확정되면
              프로그램을 이용할 수 있어요.
            </p>


            <div className="apply-price">

              <span>
                필요한 코인
              </span>

              <strong>
                1 coin
              </strong>

            </div>


            <button
              className="apply-button"
              disabled={!isOpen}
              onClick={openApplyModal}
            >

              {isOpen
                ? "원데이 신청하기"
                : "현재 마감되었습니다"}

            </button>


            <span className="apply-notice">

              신청 전 양도 조건을
              확인해주세요.

            </span>

          </div>


          <div className="detail-guide">

            <span>
              💡
            </span>

            <div>

              <strong>
                원데이 양도란?
              </strong>

              <p>
                정기 프로그램을 이용하지 못하는 날,
                다른 사람에게 자리를 양도하는 기능입니다.
              </p>

            </div>

          </div>

        </aside>

      </div>


      {/* ======================
          신청 확인 모달
      ====================== */}
      {isApplyModalOpen && (

        <div
          className="apply-modal-overlay"
          onClick={closeApplyModal}
        >


          <div
            className="apply-modal"
            onClick={(event) => event.stopPropagation()}
          >


            {/* 모달 헤더 */}
            <div className="apply-modal-header">


              <h2>
                신청 확인
              </h2>


              <button
                className="apply-modal-close"
                onClick={closeApplyModal}
                aria-label="닫기"
              >
                ✕
              </button>

            </div>


            {/* 신청 정보 */}
            <div className="apply-confirm-info">


              <div className="apply-confirm-row">

                <span>
                  프로그램
                </span>

                <strong>
                  {post.program_name ||
                    "정보 없음"}
                </strong>

              </div>


              <div className="apply-confirm-row">

                <span>
                  장소
                </span>

                <strong>
                  {post.facility_name ||
                    "정보 없음"}
                </strong>

              </div>


              <div className="apply-confirm-row">

                <span>
                  날짜
                </span>

                <strong>
                  {formatDate(post.transfer_date)}
                </strong>

              </div>


              <div className="apply-confirm-row">

                <span>
                  시간
                </span>

                <strong>
                  {post.program_time ||
                    "시간 정보 없음"}
                </strong>

              </div>


              <div className="apply-confirm-row coin-row">

                <span>
                  차감 코인
                </span>

                <strong>
                  1 coin
                </strong>

              </div>

            </div>


            {/* 확인 체크 */}
            <label className="apply-confirm-check">


              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(event) =>
                  setIsConfirmed(
                    event.target.checked
                  )
                }
              />


              <span>
                위 내용을 모두 확인했습니다.
              </span>

            </label>


            {/* 버튼 */}
            <div className="apply-modal-buttons">


              <button
                className="apply-cancel-button"
                onClick={closeApplyModal}
              >
                취소
              </button>


              <button
                className={
                  isConfirmed
                    ? "apply-confirm-button active"
                    : "apply-confirm-button"
                }
                disabled={!isConfirmed}
                onClick={handleApplyConfirm}
              >
                신청 확정
              </button>

            </div>

          </div>

        </div>

      )}

    </main>

  );

}


export default OnedayDetail;