import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client";
import "./OnedayBoard.css";


// ==========================================
// 주소에서 지역(구) 추출
// ==========================================
function getRegion(address) {
  if (!address) return "";

  const match = address.match(/([가-힣]+구)/);

  if (match) {
    return match[1];
  }

  return "";
}


// ==========================================
// 프로그램 시간 → 시간대 변환
// ==========================================
function getTimeCategory(programTime) {
  if (!programTime) return "";

  const match = programTime.match(/(\d{1,2})\s*:/);

  if (!match) return "";

  const hour = Number(match[1]);

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "evening";
}


// ==========================================
// 날짜 표시 형식
// ==========================================
function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();

  const week = ["일", "월", "화", "수", "목", "금", "토"];

  return `${month}.${day}(${week[date.getDay()]})`;
}


// ==========================================
// 두 GPS 좌표 사이 거리 계산
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


// ==========================================
// 거리 표시
// ==========================================
function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return "";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }

  return `${distanceKm.toFixed(1)}km`;
}


// ==========================================
// 종목별 아이콘
// ==========================================
function getSportIcon(programName = "") {
  const name = programName.toLowerCase();

  if (name.includes("수영")) return "🏊";
  if (name.includes("헬스") || name.includes("피트니스")) return "🏋️";
  if (name.includes("요가")) return "🧘";
  if (name.includes("필라테스")) return "🤸";
  if (name.includes("축구")) return "⚽";
  if (name.includes("풋살")) return "🥅";
  if (name.includes("농구")) return "🏀";
  if (name.includes("배드민턴")) return "🏸";
  if (name.includes("테니스")) return "🎾";
  if (name.includes("탁구")) return "🏓";
  if (name.includes("볼링")) return "🎳";
  if (name.includes("골프")) return "⛳";
  if (name.includes("댄스")) return "💃";
  if (name.includes("복싱")) return "🥊";
  if (name.includes("태권도")) return "🥋";
  if (name.includes("검도")) return "🥋";
  if (name.includes("클라이밍")) return "🧗";
  if (name.includes("러닝") || name.includes("달리기")) return "🏃";
  if (name.includes("스케이트")) return "⛸️";

  const defaultIcons = [
    "🏃",
    "🎯",
    "🌟",
    "💪",
    "🔥",
    "🎽",
    "🏆",
  ];

  const index =
    programName.length % defaultIcons.length;

  return defaultIcons[index];
}


// ==========================================
// 메인 컴포넌트
// ==========================================
function OnedayBoard() {


  // ==========================================
  // API 데이터
  // ==========================================
  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ==========================================
  // 필터 상태
  // ==========================================
  const [searchKeyword, setSearchKeyword] =
    useState("");

  const [selectedRegion, setSelectedRegion] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [onlyOpen, setOnlyOpen] =
    useState(false);


  // ==========================================
  // GPS / 정렬
  // ==========================================
  const [userLocation, setUserLocation] =
    useState(null);

  const [sortType, setSortType] =
    useState("latest");


  // ==========================================
  // 페이지네이션
  // ==========================================
  const POSTS_PER_PAGE = 6;

  const [currentPage, setCurrentPage] =
    useState(1);


  // ==========================================
  // API 데이터 가져오기
  // ==========================================
  useEffect(() => {

    async function fetchPosts() {

      try {

        setLoading(true);

        const data =
          await apiGet("/api/oneday/posts/");

        console.log(
          "원데이 게시글 API 데이터:",
          data
        );

        setPosts(data);

      } catch (err) {

        console.error(err);

        setError(
          "원데이 게시글을 불러오지 못했습니다. Django 서버가 실행 중인지 확인해주세요."
        );

      } finally {

        setLoading(false);

      }

    }

    fetchPosts();

  }, []);


  // ==========================================
  // 필터 변경 시 페이지 1로 이동
  // ==========================================
  useEffect(() => {

    setCurrentPage(1);

  }, [
    searchKeyword,
    selectedRegion,
    selectedDate,
    selectedTime,
    onlyOpen,
    sortType,
  ]);


  // ==========================================
  // 지역 목록 자동 생성
  // ==========================================
  const regions = useMemo(() => {

    const regionSet = new Set();

    posts.forEach((post) => {

      const region =
        getRegion(post.facility_addr);

      if (region) {
        regionSet.add(region);
      }

    });

    return [...regionSet].sort();

  }, [posts]);


  // ==========================================
  // 필터 적용
  // ==========================================
  const filteredPosts = useMemo(() => {

    return posts.filter((post) => {

      // 검색
      const keyword =
        searchKeyword.trim().toLowerCase();

      const programName =
        (post.program_name || "").toLowerCase();

      const facilityName =
        (post.facility_name || "").toLowerCase();

      const searchMatch =
        !keyword ||
        programName.includes(keyword) ||
        facilityName.includes(keyword);


      // 지역
      const postRegion =
        getRegion(post.facility_addr);

      const regionMatch =
        !selectedRegion ||
        postRegion === selectedRegion;


      // 날짜
      const dateMatch =
        !selectedDate ||
        post.transfer_date === selectedDate;


      // 시간대
      const postTimeCategory =
        getTimeCategory(post.program_time);

      const timeMatch =
        !selectedTime ||
        postTimeCategory === selectedTime;


      // 신청 가능
      const openMatch =
        !onlyOpen ||
        post.status === "open";


      return (
        searchMatch &&
        regionMatch &&
        dateMatch &&
        timeMatch &&
        openMatch
      );

    });

  }, [
    posts,
    searchKeyword,
    selectedRegion,
    selectedDate,
    selectedTime,
    onlyOpen,
  ]);


  // ==========================================
  // 사용자 위치 기준 거리 계산
  // ==========================================
  const postsWithDistance = useMemo(() => {

    return filteredPosts.map((post) => {

      if (!userLocation) {

        return {
          ...post,
          distance: null,
        };

      }


      if (
        post.latit === null ||
        post.latit === undefined ||
        post.longit === null ||
        post.longit === undefined
      ) {

        return {
          ...post,
          distance: null,
        };

      }


      const distance =
        calculateDistance(
          userLocation.lat,
          userLocation.lng,
          Number(post.latit),
          Number(post.longit)
        );


      return {
        ...post,
        distance,
      };

    });

  }, [
    filteredPosts,
    userLocation,
  ]);


  // ==========================================
  // 정렬
  // ==========================================
  const sortedPosts = useMemo(() => {

    const result =
      [...postsWithDistance];


    // 최신 등록순
    if (sortType === "latest") {

      return result.sort((a, b) => {

        return (
          new Date(b.created_at) -
          new Date(a.created_at)
        );

      });

    }


    // 날짜 빠른순
    if (sortType === "date") {

      return result.sort((a, b) => {

        return (
          new Date(a.transfer_date) -
          new Date(b.transfer_date)
        );

      });

    }


    // GPS 거리순
    if (sortType === "gps") {

      return result.sort((a, b) => {

        if (
          a.distance === null &&
          b.distance === null
        ) {
          return 0;
        }

        if (a.distance === null) {
          return 1;
        }

        if (b.distance === null) {
          return -1;
        }

        return a.distance - b.distance;

      });

    }


    return result;

  }, [
    postsWithDistance,
    sortType,
  ]);


  // ==========================================
  // 전체 페이지 수
  // ==========================================
  const totalPages =
    Math.ceil(
      sortedPosts.length /
      POSTS_PER_PAGE
    );


  // ==========================================
  // 현재 페이지 게시글
  // ==========================================
  const currentPosts = useMemo(() => {

    const startIndex =
      (currentPage - 1) *
      POSTS_PER_PAGE;

    const endIndex =
      startIndex +
      POSTS_PER_PAGE;

    return sortedPosts.slice(
      startIndex,
      endIndex
    );

  }, [
    sortedPosts,
    currentPage,
  ]);


  // ==========================================
  // 필터 초기화
  // ==========================================
  function resetFilters() {

    setSearchKeyword("");
    setSelectedRegion("");
    setSelectedDate("");
    setSelectedTime("");
    setOnlyOpen(false);

    setCurrentPage(1);

  }


  // ==========================================
  // GPS 정렬
  // ==========================================
  function handleGpsSort() {

    if (!navigator.geolocation) {

      alert(
        "이 브라우저에서는 위치 정보를 사용할 수 없습니다."
      );

      return;

    }


    navigator.geolocation.getCurrentPosition(

      (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;


        console.log(
          "현재 위치:",
          latitude,
          longitude
        );


        setUserLocation({
          lat: latitude,
          lng: longitude,
        });


        setSortType("gps");


        setCurrentPage(1);

      },


      (error) => {

        console.error(
          "위치 정보 오류:",
          error
        );


        alert(
          "현재 위치를 가져올 수 없습니다. 브라우저에서 위치 권한을 허용해주세요."
        );

      }

    );

  }


  // ==========================================
  // 게시글 조회
  // ==========================================
  function handleViewPost(post) {

    console.log(
      "선택한 게시글:",
      post
    );

  }


  return (

    <main className="oneday-page">


      {/* ======================================
          왼쪽 필터
      ====================================== */}
      <aside className="oneday-filter">

        <h2>필터</h2>


        {/* 검색 */}
        <div className="filter-section">

          <label className="filter-label">
            검색
          </label>


          <div className="search-box">

            <span className="search-icon">
              🔍
            </span>


            <input
              type="text"
              placeholder="프로그램명 또는 기관명 검색"
              value={searchKeyword}
              onChange={(e) =>
                setSearchKeyword(
                  e.target.value
                )
              }
            />

          </div>

        </div>


        <div className="filter-line" />


        {/* 지역 */}
        <div className="filter-section">

          <label className="filter-label">
            지역
          </label>


          <select
            className="region-select"
            value={selectedRegion}
            onChange={(e) =>
              setSelectedRegion(
                e.target.value
              )
            }
          >

            <option value="">
              전체 지역
            </option>


            {regions.map((region) => (

              <option
                key={region}
                value={region}
              >
                {region}
              </option>

            ))}

          </select>

        </div>


        <div className="filter-line" />


        {/* 날짜 */}
        <div className="filter-section">

          <label className="filter-label">
            양도 날짜
          </label>


          <input
            className="date-input"
            type="date"
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(
                e.target.value
              )
            }
          />

        </div>


        <div className="filter-line" />


        {/* 시간대 */}
        <div className="filter-section">

          <label className="filter-label">
            시간대
          </label>


          <div className="time-buttons">

            <button
              className={
                selectedTime === "morning"
                  ? "time-button active"
                  : "time-button"
              }
              onClick={() =>
                setSelectedTime(
                  selectedTime === "morning"
                    ? ""
                    : "morning"
                )
              }
            >
              아침
            </button>


            <button
              className={
                selectedTime === "afternoon"
                  ? "time-button active"
                  : "time-button"
              }
              onClick={() =>
                setSelectedTime(
                  selectedTime === "afternoon"
                    ? ""
                    : "afternoon"
                )
              }
            >
              점심
            </button>


            <button
              className={
                selectedTime === "evening"
                  ? "time-button active"
                  : "time-button"
              }
              onClick={() =>
                setSelectedTime(
                  selectedTime === "evening"
                    ? ""
                    : "evening"
                )
              }
            >
              저녁
            </button>

          </div>

        </div>


        <div className="filter-line" />


        {/* 신청 가능 */}
        <div className="open-filter">

          <span>
            신청 가능만 보기
          </span>


          <button
            className={
              onlyOpen
                ? "toggle-button active"
                : "toggle-button"
            }
            onClick={() =>
              setOnlyOpen(!onlyOpen)
            }
          >
            <span className="toggle-circle" />
          </button>

        </div>


        {/* 필터 초기화 */}
        <button
          className="reset-button"
          onClick={resetFilters}
        >
          필터 초기화
        </button>


        {/* ======================================
            양도 안내 카드
        ====================================== */}
        <div className="transfer-guide">

          <div className="transfer-guide-icon">
            💡
          </div>


          <div className="transfer-guide-content">

            <h3>
              양도는 어떻게 되나요?
            </h3>


            <p>
              등록한 정기 수강 프로그램의
              결석일을 양도하면,
              신청자가 확정될 때 코인이 지급됩니다.
            </p>

          </div>

        </div>


      </aside>


      {/* ======================================
          오른쪽 콘텐츠
      ====================================== */}
      <section className="oneday-content">


        {/* 제목 */}
        <div className="oneday-header">

          <div>

            <div className="title-row">

              <h1>
                원데이 클래스
              </h1>


              <span className="post-count">
                {sortedPosts.length}개
              </span>

            </div>


            <p>
              결석하는 날의 자리를 양도하고
              새로운 운동을 경험해보세요.
            </p>

          </div>


          <button className="register-button">
            + 원데이 등록하기
          </button>

        </div>


        {/* ======================================
            정렬
        ====================================== */}
        <div className="sort-row">

          <span className="sort-label">
            정렬
          </span>


          <div className="sort-buttons">


            <button
              className={
                sortType === "gps"
                  ? "sort-button active"
                  : "sort-button"
              }
              onClick={handleGpsSort}
            >
              현재위치(GPS)순
            </button>


            <button
              className={
                sortType === "latest"
                  ? "sort-button active"
                  : "sort-button"
              }
              onClick={() =>
                setSortType("latest")
              }
            >
              최신등록순
            </button>


            <button
              className={
                sortType === "date"
                  ? "sort-button active"
                  : "sort-button"
              }
              onClick={() =>
                setSortType("date")
              }
            >
              날짜 빠른순
            </button>

          </div>

        </div>


        {/* 로딩 */}
        {loading && (

          <div className="state-message">
            게시글을 불러오는 중입니다...
          </div>

        )}


        {/* 에러 */}
        {error && (

          <div className="state-message error">
            {error}
          </div>

        )}


        {/* 게시글 없음 */}
        {!loading &&
          !error &&
          sortedPosts.length === 0 && (

            <div className="state-message">
              조건에 맞는 원데이 클래스가 없습니다.
            </div>

          )}


        {/* ======================================
            카드 목록
        ====================================== */}
        {!loading &&
          !error &&
          currentPosts.length > 0 && (

            <div className="oneday-grid">

              {currentPosts.map((post) => {

                const isOpen =
                  post.status === "open";


                const sportIcon =
                  getSportIcon(
                    post.program_name
                  );


                return (

                  <article
                    className="oneday-card"
                    key={post.id}
                  >


                    {/* 카드 상단 */}
                    <div className="card-top">

                      <div className="sport-icon">
                        {sportIcon}
                      </div>


                      <span
                        className={
                          isOpen
                            ? "status-badge open"
                            : "status-badge closed"
                        }
                      >
                        {isOpen
                          ? "신청 가능"
                          : "마감"}
                      </span>

                    </div>


                    {/* 프로그램명 */}
                    <h3>
                      {post.program_name ||
                        "프로그램명 없음"}
                    </h3>


                    {/* 시설명 */}
                    <p className="facility-name">

                      {post.facility_name ||
                        "기관 정보 없음"}

                    </p>


                    {/* 날짜 + 시간 */}
                    <p className="program-info">

                      {formatDate(
                        post.transfer_date
                      )}

                      {post.program_time &&
                        ` · ${post.program_time}`}

                    </p>


                    {/* 가까운 역 */}
                    {post.station && (

                      <p className="station-info">

                        🚇 {post.station}

                        {post.station_wt !== null &&
                          post.station_wt !== undefined &&
                          ` · 도보 ${post.station_wt}분`}

                      </p>

                    )}


                    {/* GPS 거리 */}
                    {post.distance !== null &&
                      post.distance !== undefined && (

                        <p className="distance-info">

                          📍 현재 위치에서{" "}

                          {formatDistance(
                            post.distance
                          )}

                        </p>

                      )}


                    {/* 카드 하단 */}
                    <div className="card-bottom">

                      <strong>
                        -1 coin
                      </strong>


                      <button
                        className="view-button"
                        onClick={() =>
                          handleViewPost(post)
                        }
                      >
                        조회
                      </button>

                    </div>

                  </article>

                );

              })}

            </div>

          )}


        {/* ======================================
            실제 페이지네이션
            페이지가 2개 이상일 때만 표시
        ====================================== */}
        {!loading &&
          !error &&
          totalPages > 1 && (

            <div className="pagination">


              {/* 페이지 번호 */}
              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (

                <button
                  key={page}
                  className={
                    currentPage === page
                      ? "page-button active"
                      : "page-button"
                  }
                  onClick={() => {

                    setCurrentPage(page);

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });

                  }}
                >
                  {page}
                </button>

              ))}


              {/* 다음 페이지 */}
              {currentPage < totalPages && (

                <button
                  className="page-button next"
                  onClick={() => {

                    setCurrentPage(
                      currentPage + 1
                    );

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });

                  }}
                >
                  ›
                </button>

              )}

            </div>

          )}


      </section>

    </main>

  );

}


export default OnedayBoard;