import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client";
import OnedayDetail from "./OnedayDetail";
import OnedayRegister from "./OnedayRegister";
import "./OnedayBoard.css";

const POSTS_API = "/api/oneday/posts/";

const TIME_BUCKETS = {
  morning: { label: "아침", hours: [5, 6, 7, 8, 9, 10] },
  lunch: { label: "점심", hours: [11, 12, 13, 14] },
  evening: { label: "저녁", hours: [15, 16, 17, 18, 19, 20, 21, 22] },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 종목 구분 (facilities.Sport 테이블의 48개 종목명을 기준으로,
// 게시글의 프로그램명 / 체육센터명에 종목명이 포함되는지로 판별)
const SPORT_CATEGORIES = [
  { label: "골프", icon: "⛳" },
  { label: "배드민턴", icon: "🏸" },
  { label: "탁구", icon: "🏓" },
  { label: "헬스", icon: "🏋️" },
  { label: "댄스", icon: "💃" },
  { label: "발레", icon: "🩰" },
  { label: "댄스스포츠", icon: "💃" },
  { label: "에어로빅", icon: "🤸" },
  { label: "요가", icon: "🧘" },
  { label: "줌바", icon: "💃" },
  { label: "필라테스", icon: "🤸" },
  { label: "라인댄스", icon: "💃" },
  { label: "한국무용", icon: "💃" },
  { label: "국선도", icon: "🥋" },
  { label: "기구필라테스", icon: "🤸" },
  { label: "농구", icon: "🏀" },
  { label: "풋살", icon: "⚽" },
  { label: "수영", icon: "🏊" },
  { label: "아쿠아로빅", icon: "🏊" },
  { label: "검도", icon: "🥋" },
  { label: "서킷트레이닝", icon: "🏋️" },
  { label: "스쿼시", icon: "🎾" },
  { label: "스피닝", icon: "🚴" },
  { label: "바른자세운동", icon: "🧍" },
  { label: "피트니스", icon: "🏋️" },
  { label: "인라인", icon: "🛼" },
  { label: "방송댄스", icon: "💃" },
  { label: "번지피트니스", icon: "🤸" },
  { label: "트램폴린", icon: "🤸" },
  { label: "라켓볼", icon: "🎾" },
  { label: "줄넘기", icon: "🏃" },
  { label: "순환운동", icon: "🔁" },
  { label: "타바타", icon: "⏱️" },
  { label: "사교댄스", icon: "💃" },
  { label: "당구", icon: "🎱" },
  { label: "PT", icon: "🏋️" },
  { label: "리듬체조", icon: "🎀" },
  { label: "축구", icon: "⚽" },
  { label: "배구", icon: "🏐" },
  { label: "밸리댄스", icon: "💃" },
  { label: "펜싱", icon: "🤺" },
  { label: "피클볼", icon: "🏓" },
  { label: "바디펌프", icon: "🏋️" },
  { label: "점핑", icon: "🤸" },
  { label: "테니스", icon: "🎾" },
  { label: "역도", icon: "🏋️" },
  { label: "롤러스키", icon: "🎿" },
  { label: "클라이밍", icon: "🧗" },
];

// "댄스스포츠"가 "댄스"로, "번지피트니스"가 "피트니스"로 먼저 걸리지 않도록
// 종목명이 긴 것부터 매칭한다.
const SPORT_MATCH_ORDER = [...SPORT_CATEGORIES].sort(
  (a, b) => b.label.length - a.label.length
);

const ETC_SPORT_CATEGORY = { label: "기타", icon: "🏅" };

function OnedayBoard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 화면 전환
  const [showRegister, setShowRegister] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // 검색 / 필터
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("전체");
  const [dateFilter, setDateFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState(""); // "", "morning", "lunch", "evening"
  const [openOnly, setOpenOnly] = useState(false);

  // 정렬
  const [sortType, setSortType] = useState("latest");

  // 위치
  const [userLocation, setUserLocation] = useState(null);

  // 페이지
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 6;

  // -----------------------------------------
  // 게시글 가져오기
  // -----------------------------------------
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet(POSTS_API);

      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("원데이 게시글 조회 실패:", err);
      setError("원데이 게시글을 불러오지 못했습니다.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // -----------------------------------------
  // 등록 화면 열기 / 닫기
  // -----------------------------------------
  const handleOpenRegister = () => {
    setSelectedPost(null);
    setShowRegister(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseRegister = () => {
    setShowRegister(false);
    setSelectedPost(null);
    fetchPosts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -----------------------------------------
  // 상세 화면 열기 / 닫기
  // -----------------------------------------
  const handleOpenDetail = (post) => {
    setShowRegister(false);
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseDetail = () => {
    setSelectedPost(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -----------------------------------------
  // 원데이 신청 성공 → 게시글 상태 반영
  // -----------------------------------------
  const handleApplySuccess = (updatedPost) => {
    setSelectedPost(updatedPost);
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  // -----------------------------------------
  // GPS 위치 가져오기
  // -----------------------------------------
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        alert("현재 위치를 가져오지 못했습니다.");
      }
    );
  };

  // -----------------------------------------
  // 거리 계산
  // -----------------------------------------
  const getDistance = (lat1, lng1, lat2, lng2) => {
    if (
      lat1 === null || lng1 === null || lat2 === null || lng2 === null ||
      lat1 === undefined || lng1 === undefined ||
      lat2 === undefined || lng2 === undefined
    ) {
      return null;
    }

    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // -----------------------------------------
  // 지역 추출
  // -----------------------------------------
  const getRegion = (address = "") => {
    if (!address) return "";
    const match = address.match(/서울특별시\s+([가-힣]+구)|서울\s+([가-힣]+구)/);
    if (!match) return "";
    return match[1] || match[2] || "";
  };

  // -----------------------------------------
  // 시간대 판별
  // -----------------------------------------
  const getStartHour = (timeString = "") => {
    const match = String(timeString).match(/^(\d{1,2}):/);
    if (!match) return null;
    return parseInt(match[1], 10);
  };

  // -----------------------------------------
  // 종목 구분 (프로그램명 + 체육센터명 기반 키워드 매칭)
  // -----------------------------------------
  const getSportCategory = (post) => {
    const text = `${post.program_name || ""} ${post.facility_name || ""}`;

    return (
      SPORT_MATCH_ORDER.find((category) => text.includes(category.label)) ||
      ETC_SPORT_CATEGORY
    );
  };

  const getSportIcon = (programName = "") =>
    getSportCategory({ program_name: programName }).icon;

  // -----------------------------------------
  // 양도 날짜 + 수업 시작 시간 (신청완료 글 노출 종료 시점 계산용)
  // -----------------------------------------
  const getTransferDateTime = (post) => {
    if (!post.transfer_date) return null;

    const date = new Date(`${post.transfer_date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;

    const hour = getStartHour(post.program_time);

    if (hour !== null) {
      date.setHours(hour, 0, 0, 0);
    } else {
      // 수업 시간 정보가 없으면 그 날 자정이 지나야 사라지도록 처리
      date.setHours(23, 59, 59, 999);
    }

    return date;
  };

  // -----------------------------------------
  // 필터 초기화
  // -----------------------------------------
  const handleResetFilters = () => {
    setSearch("");
    setRegion("전체");
    setDateFilter("");
    setTimeFilter("");
    setOpenOnly(false);
  };

  // -----------------------------------------
  // 게시글 필터링
  // -----------------------------------------
  const filteredPosts = useMemo(() => {
    const now = new Date();

    // 신청완료(closed) 글은 양도 날짜의 수업 시작 시간이 지나면 목록에서 사라진다.
    let result = posts.filter((post) => {
      if (post.status !== "closed") return true;

      const transferDateTime = getTransferDateTime(post);
      if (!transferDateTime) return true;

      return transferDateTime > now;
    });

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();
      result = result.filter((post) => {
        const programName = String(post.program_name || "").toLowerCase();
        const facilityName = String(post.facility_name || "").toLowerCase();
        const address = String(post.facility_addr || "").toLowerCase();
        return (
          programName.includes(keyword) ||
          facilityName.includes(keyword) ||
          address.includes(keyword)
        );
      });
    }

    if (region !== "전체") {
      result = result.filter((post) => getRegion(post.facility_addr) === region);
    }

    if (dateFilter) {
      result = result.filter((post) => post.transfer_date === dateFilter);
    }

    if (timeFilter) {
      const bucketHours = TIME_BUCKETS[timeFilter]?.hours || [];
      result = result.filter((post) => {
        const hour = getStartHour(post.program_time);
        if (hour === null) return false;
        return bucketHours.includes(hour);
      });
    }

    if (openOnly) {
      result = result.filter((post) => post.status === "open");
    }

    if (sortType === "latest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    if (sortType === "date") {
      result.sort(
        (a, b) =>
          new Date(a.transfer_date || 0).getTime() -
          new Date(b.transfer_date || 0).getTime()
      );
    }

    if (sortType === "distance" && userLocation) {
      result.sort((a, b) => {
        const distanceA = getDistance(
          userLocation.lat, userLocation.lng,
          Number(a.latit), Number(a.longit)
        );
        const distanceB = getDistance(
          userLocation.lat, userLocation.lng,
          Number(b.latit), Number(b.longit)
        );

        if (distanceA === null) return 1;
        if (distanceB === null) return -1;

        return distanceA - distanceB;
      });
    }

    return result;
  }, [posts, search, region, dateFilter, timeFilter, openOnly, sortType, userLocation]);

  // -----------------------------------------
  // 이번달 가장 많이 양도 글이 올라온 종목
  // -----------------------------------------
  const topSportThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const countByLabel = new Map();

    posts.forEach((post) => {
      const createdAt = post.created_at ? new Date(post.created_at) : null;

      if (
        !createdAt ||
        createdAt.getFullYear() !== year ||
        createdAt.getMonth() !== month
      ) {
        return;
      }

      const category = getSportCategory(post);
      countByLabel.set(
        category.label,
        (countByLabel.get(category.label) || 0) + 1
      );
    });

    let top = null;

    countByLabel.forEach((count, label) => {
      if (!top || count > top.count) {
        const category =
          SPORT_CATEGORIES.find((item) => item.label === label) ||
          ETC_SPORT_CATEGORY;

        top = { label, count, icon: category.icon };
      }
    });

    return top;
  }, [posts]);

  // -----------------------------------------
  // 페이지네이션
  // -----------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, region, dateFilter, timeFilter, openOnly, sortType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // -----------------------------------------
  // 날짜(요일 포함) 포맷
  // -----------------------------------------
  const formatDateWithDay = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = WEEKDAYS[date.getDay()];

    return `${month}.${String(day).padStart(2, "0")}(${weekday})`;
  };

  // -----------------------------------------
  // 거리 표시
  // -----------------------------------------
  const getDistanceText = (post) => {
    if (!userLocation) return null;

    const distance = getDistance(
      userLocation.lat, userLocation.lng,
      Number(post.latit), Number(post.longit)
    );

    if (distance === null) return null;
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  // ==========================================================
  // 화면 전환
  // ==========================================================
  if (showRegister) {
    return <OnedayRegister onBack={handleCloseRegister} />;
  }

  if (selectedPost) {
    return (
      <OnedayDetail
        post={selectedPost}
        onBack={handleCloseDetail}
        onApplySuccess={handleApplySuccess}
      />
    );
  }

  // ==========================================================
  // 게시판
  // ==========================================================
  return (
    <div className="oneday-page">
      <div className="oneday-layout">

        {/* =========================
            왼쪽 필터 사이드바
        ========================= */}
        <aside className="oneday-sidebar">
          <h2 className="sidebar-title">필터</h2>

          <div className="filter-group">
            <label className="filter-label">검색</label>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="프로그램명 또는 기관명 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">지역</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="전체">전체 지역</option>
              <option value="강남구">강남구</option>
              <option value="강동구">강동구</option>
              <option value="강북구">강북구</option>
              <option value="강서구">강서구</option>
              <option value="관악구">관악구</option>
              <option value="광진구">광진구</option>
              <option value="구로구">구로구</option>
              <option value="금천구">금천구</option>
              <option value="노원구">노원구</option>
              <option value="도봉구">도봉구</option>
              <option value="동대문구">동대문구</option>
              <option value="동작구">동작구</option>
              <option value="마포구">마포구</option>
              <option value="서대문구">서대문구</option>
              <option value="서초구">서초구</option>
              <option value="성동구">성동구</option>
              <option value="성북구">성북구</option>
              <option value="송파구">송파구</option>
              <option value="양천구">양천구</option>
              <option value="영등포구">영등포구</option>
              <option value="용산구">용산구</option>
              <option value="은평구">은평구</option>
              <option value="종로구">종로구</option>
              <option value="중구">중구</option>
              <option value="중랑구">중랑구</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">양도 날짜</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">시간대</label>
            <div className="time-bucket-row">
              {Object.entries(TIME_BUCKETS).map(([key, bucket]) => (
                <button
                  type="button"
                  key={key}
                  className={timeFilter === key ? "time-bucket active" : "time-bucket"}
                  onClick={() =>
                    setTimeFilter((prev) => (prev === key ? "" : key))
                  }
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group toggle-group">
            <span className="filter-label">신청 가능만 보기</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>

          <button
            type="button"
            className="reset-button"
            onClick={handleResetFilters}
          >
            필터 초기화
          </button>

          <div className="oneday-info-box">
            <h3>양도는 어떻게 되나요?</h3>
            <p>
              등록한 정기 수강 프로그램의 결석일을 양도하면, 신청자가 확정될
              때 코인이 지급됩니다.
            </p>
          </div>
        </aside>

        {/* =========================
            오른쪽 메인 콘텐츠
        ========================= */}
        <main className="oneday-main">

          <div className="oneday-header">
            <div>
              <h1>
                원데이 클래스
                <span className="oneday-count">{filteredPosts.length}개</span>
              </h1>
              <p>결석하는 날의 자리를 양도하고 새로운 운동을 경험해보세요.</p>
            </div>

            <div className="header-actions">
              <button
                type="button"
                className="refresh-button"
                onClick={fetchPosts}
                disabled={loading}
              >
                <span className={loading ? "refresh-icon spinning" : "refresh-icon"}>
                  ⟳
                </span>
                새로고침
              </button>

              <button
                type="button"
                className="register-button"
                onClick={handleOpenRegister}
              >
                + 원데이 등록하기
              </button>
            </div>
          </div>

          {topSportThisMonth && (
            <div className="oneday-stat-bar">
              <span className="stat-bar-icon">{topSportThisMonth.icon}</span>
              <div className="stat-bar-text">
                <span className="stat-bar-label">이번달 유행하는 종목</span>
                <span className="stat-bar-value">
                  {topSportThisMonth.label}
                  <span className="stat-count">{topSportThisMonth.count}건</span>
                </span>
              </div>
            </div>
          )}

          <div className="oneday-sort-row">
            <span className="sort-label">정렬</span>

            <div className="sort-buttons">
              <button
                type="button"
                onClick={() => {
                  if (!userLocation) handleGetLocation();
                  setSortType("distance");
                }}
                className={sortType === "distance" ? "active" : ""}
              >
                현재위치(GPS)순
              </button>

              <button
                type="button"
                onClick={() => setSortType("latest")}
                className={sortType === "latest" ? "active" : ""}
              >
                최신등록순
              </button>

              <button
                type="button"
                onClick={() => setSortType("date")}
                className={sortType === "date" ? "active" : ""}
              >
                날짜 빠른순
              </button>
            </div>
          </div>

          {loading && (
            <div className="oneday-empty">
              <p>원데이 게시글을 불러오는 중입니다...</p>
            </div>
          )}

          {!loading && error && (
            <div className="oneday-empty">
              <p>{error}</p>
              <button type="button" onClick={fetchPosts}>
                다시 불러오기
              </button>
            </div>
          )}

          {!loading && !error && filteredPosts.length === 0 && (
            <div className="oneday-empty">
              <div className="oneday-empty-icon">📋</div>
              <h2>등록된 원데이 글이 없습니다.</h2>
              <p>원하는 양도 글이 없다면 직접 원데이 글을 등록해보세요.</p>
              <button type="button" onClick={handleOpenRegister}>
                + 원데이 등록하기
              </button>
            </div>
          )}

          {!loading && !error && paginatedPosts.length > 0 && (
            <>
              <div className="oneday-post-grid">
                {paginatedPosts.map((post) => {
                  const distanceText = getDistanceText(post);

                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      className="oneday-post-card"
                      key={post.id}
                      onClick={() => handleOpenDetail(post)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleOpenDetail(post);
                      }}
                    >
                      <div className="post-card-top">
                        <span className="post-icon">
                          {getSportIcon(post.program_name)}
                        </span>

                        <span
                          className={
                            post.status === "open"
                              ? "post-status open"
                              : "post-status closed"
                          }
                        >
                          {post.status === "open" ? "신청 가능" : "신청 마감"}
                        </span>
                      </div>

                      <div className="post-card-body">
                        <div className="post-program-name">
                          {post.program_name || "프로그램명 없음"}
                        </div>

                        <div className="post-facility-name">
                          {post.facility_name || "시설 정보 없음"}
                        </div>

                        <div className="post-datetime">
                          {formatDateWithDay(post.transfer_date)} ·{" "}
                          {post.program_time || "시간 미정"}
                        </div>

                        <div className="post-location-row">
                          {post.station && (
                            <span>
                              🚇 {post.station}
                              {post.station_wt != null
                                ? ` · 도보 ${post.station_wt}분`
                                : ""}
                            </span>
                          )}

                          {post.bus && (
                            <span>
                              🚌 {post.bus}
                              {post.bus_wt != null
                                ? ` · 도보 ${post.bus_wt}분`
                                : ""}
                            </span>
                          )}

                          {distanceText && (
                            <span className="distance-text">
                              📍 현재 위치에서 {distanceText}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="post-card-bottom">
                        <span className="coin-text">-1 coin</span>
                        <span className="view-button">조회</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="oneday-pagination">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                    (page) => (
                      <button
                        type="button"
                        key={page}
                        className={currentPage === page ? "active" : ""}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default OnedayBoard;