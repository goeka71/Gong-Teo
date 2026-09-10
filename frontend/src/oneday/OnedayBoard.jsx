import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client";
import OnedayDetail from "./OnedayDetail";
import OnedayRegister from "./OnedayRegister";
import "./OnedayBoard.css";

const POSTS_API = "/api/oneday/posts/";

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
  const [timeFilter, setTimeFilter] = useState("");
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
  // 등록 화면 열기
  // -----------------------------------------
  const handleOpenRegister = () => {
    console.log("🔥 원데이 등록 버튼 클릭됨");

    setSelectedPost(null);
    setShowRegister(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -----------------------------------------
  // 등록 화면 닫기
  // -----------------------------------------
  const handleCloseRegister = () => {
    setShowRegister(false);
    setSelectedPost(null);

    // 등록 후 게시판으로 돌아오면 최신 글 다시 불러오기
    fetchPosts();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -----------------------------------------
  // 상세 화면 열기
  // -----------------------------------------
  const handleOpenDetail = (post) => {
    setShowRegister(false);
    setSelectedPost(post);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -----------------------------------------
  // 상세 화면 닫기
  // -----------------------------------------
  const handleCloseDetail = () => {
    setSelectedPost(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
      lat1 === null ||
      lng1 === null ||
      lat2 === null ||
      lng2 === null ||
      lat1 === undefined ||
      lng1 === undefined ||
      lat2 === undefined ||
      lng2 === undefined
    ) {
      return null;
    }

    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // -----------------------------------------
  // 지역 추출
  // -----------------------------------------
  const getRegion = (address = "") => {
    if (!address) return "";

    const match = address.match(
      /서울특별시\s+([가-힣]+구)|서울\s+([가-힣]+구)/
    );

    if (!match) return "";

    return match[1] || match[2] || "";
  };

  // -----------------------------------------
  // 게시글 필터링
  // -----------------------------------------
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // 검색어
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

    // 지역
    if (region !== "전체") {
      result = result.filter((post) => {
        return getRegion(post.facility_addr) === region;
      });
    }

    // 날짜
    if (dateFilter) {
      result = result.filter((post) => {
        return post.transfer_date === dateFilter;
      });
    }

    // 시간
    if (timeFilter) {
      result = result.filter((post) => {
        const time = String(post.program_time || "");
        return time.includes(timeFilter);
      });
    }

    // 모집중만
    if (openOnly) {
      result = result.filter((post) => post.status === "open");
    }

    // 정렬
    if (sortType === "latest") {
      result.sort((a, b) => {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
    }

    if (sortType === "date") {
      result.sort((a, b) => {
        return (
          new Date(a.transfer_date || 0).getTime() -
          new Date(b.transfer_date || 0).getTime()
        );
      });
    }

    if (sortType === "distance" && userLocation) {
      result.sort((a, b) => {
        const distanceA = getDistance(
          userLocation.lat,
          userLocation.lng,
          Number(a.latit),
          Number(a.longit)
        );

        const distanceB = getDistance(
          userLocation.lat,
          userLocation.lng,
          Number(b.latit),
          Number(b.longit)
        );

        if (distanceA === null) return 1;
        if (distanceB === null) return -1;

        return distanceA - distanceB;
      });
    }

    return result;
  }, [
    posts,
    search,
    region,
    dateFilter,
    timeFilter,
    openOnly,
    sortType,
    userLocation,
  ]);

  // -----------------------------------------
  // 페이지네이션
  // -----------------------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  );

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
  // 날짜 포맷
  // -----------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return `${date.getFullYear()}.${String(
      date.getMonth() + 1
    ).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  // -----------------------------------------
  // 거리 표시
  // -----------------------------------------
  const getDistanceText = (post) => {
    if (!userLocation) return null;

    const distance = getDistance(
      userLocation.lat,
      userLocation.lng,
      Number(post.latit),
      Number(post.longit)
    );

    if (distance === null) return null;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }

    return `${distance.toFixed(1)}km`;
  };

  // ==========================================================
  // 화면 전환
  // ==========================================================

  // 등록 화면
  if (showRegister) {
    return (
      <OnedayRegister
        onBack={handleCloseRegister}
      />
    );
  }

  // 상세 화면
  if (selectedPost) {
    return (
      <OnedayDetail
        post={selectedPost}
        onBack={handleCloseDetail}
      />
    );
  }

  // ==========================================================
  // 게시판
  // ==========================================================

  return (
    <div className="oneday-page">
      <div className="oneday-container">

        {/* =========================
            상단 제목
        ========================= */}
        <div className="oneday-header">
          <div>
            <div className="oneday-breadcrumb">
              원데이 클래스
            </div>

            <h1>원데이 클래스</h1>

            <p>
              다른 수강생이 양도한 결석일을 하루 이용해보세요.
            </p>
          </div>

          {/* ★ 핵심 버튼 */}
          <button
            type="button"
            className="register-button"
            onClick={handleOpenRegister}
            style={{
              position: "relative",
              zIndex: 100,
              pointerEvents: "auto",
              cursor: "pointer",
            }}
          >
            + 원데이 등록하기
          </button>
        </div>

        {/* =========================
            검색 / 필터
        ========================= */}
        <div className="oneday-filter-section">

          <div className="oneday-search">
            <input
              type="text"
              placeholder="프로그램명 또는 시설명을 검색해보세요"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="oneday-filter-row">

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
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

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="">전체 시간</option>
              <option value="06:">06시대</option>
              <option value="07:">07시대</option>
              <option value="08:">08시대</option>
              <option value="09:">09시대</option>
              <option value="10:">10시대</option>
              <option value="11:">11시대</option>
              <option value="12:">12시대</option>
              <option value="13:">13시대</option>
              <option value="14:">14시대</option>
              <option value="15:">15시대</option>
              <option value="16:">16시대</option>
              <option value="17:">17시대</option>
              <option value="18:">18시대</option>
              <option value="19:">19시대</option>
              <option value="20:">20시대</option>
              <option value="21:">21시대</option>
            </select>

            <label className="oneday-check">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
              />
              모집중만 보기
            </label>

          </div>

          <div className="oneday-sort-row">

            <button
              type="button"
              onClick={() => setSortType("latest")}
              className={sortType === "latest" ? "active" : ""}
            >
              최신순
            </button>

            <button
              type="button"
              onClick={() => setSortType("date")}
              className={sortType === "date" ? "active" : ""}
            >
              날짜순
            </button>

            <button
              type="button"
              onClick={() => {
                if (!userLocation) {
                  handleGetLocation();
                }

                setSortType("distance");
              }}
              className={sortType === "distance" ? "active" : ""}
            >
              가까운순
            </button>

            <span className="oneday-result-count">
              총 {filteredPosts.length}개
            </span>
          </div>
        </div>

        {/* =========================
            로딩
        ========================= */}
        {loading && (
          <div className="oneday-empty">
            <p>원데이 게시글을 불러오는 중입니다...</p>
          </div>
        )}

        {/* =========================
            에러
        ========================= */}
        {!loading && error && (
          <div className="oneday-empty">
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchPosts}
            >
              다시 불러오기
            </button>
          </div>
        )}

        {/* =========================
            게시글 없음
        ========================= */}
        {!loading &&
          !error &&
          filteredPosts.length === 0 && (
            <div className="oneday-empty">
              <div className="oneday-empty-icon">
                📋
              </div>

              <h2>등록된 원데이 글이 없습니다.</h2>

              <p>
                원하는 양도 글이 없다면 직접 원데이 글을 등록해보세요.
              </p>

              <button
                type="button"
                onClick={handleOpenRegister}
              >
                + 원데이 등록하기
              </button>
            </div>
          )}

        {/* =========================
            게시글
        ========================= */}
        {!loading &&
          !error &&
          paginatedPosts.length > 0 && (
            <>
              <div className="oneday-post-grid">

                {paginatedPosts.map((post) => {
                  const distanceText = getDistanceText(post);

                  return (
                    <button
                      type="button"
                      className="oneday-post-card"
                      key={post.id}
                      onClick={() => handleOpenDetail(post)}
                    >
                      <div className="post-card-top">

                        <span
                          className={
                            post.status === "open"
                              ? "post-status open"
                              : "post-status closed"
                          }
                        >
                          {post.status === "open"
                            ? "신청 가능"
                            : "마감"}
                        </span>

                        <span className="post-date">
                          {formatDate(post.transfer_date)}
                        </span>
                      </div>

                      <div className="post-card-body">

                        <div className="post-program-name">
                          {post.program_name || "프로그램명 없음"}
                        </div>

                        <div className="post-facility-name">
                          {post.facility_name || "시설 정보 없음"}
                        </div>

                        <div className="post-address">
                          {post.facility_addr || "주소 정보 없음"}
                        </div>

                        <div className="post-info-row">

                          <span>
                            📅 {post.program_day || "요일 정보 없음"}
                          </span>

                          <span>
                            ⏰ {post.program_time || "시간 정보 없음"}
                          </span>

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
                              📍 {distanceText}
                            </span>
                          )}

                        </div>
                      </div>

                      <div className="post-card-bottom">

                        <span className="coin-text">
                          -1 coin
                        </span>

                        <span className="apply-text">
                          신청하기 →
                        </span>

                      </div>
                    </button>
                  );
                })}

              </div>

              {/* =========================
                  페이지네이션
              ========================= */}
              {totalPages > 1 && (
                <div className="oneday-pagination">

                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.max(1, prev - 1)
                      )
                    }
                  >
                    ‹
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={
                        currentPage === page
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCurrentPage(page)
                      }
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(totalPages, prev + 1)
                      )
                    }
                  >
                    ›
                  </button>

                </div>
              )}
            </>
          )}

      </div>
    </div>
  );
}

export default OnedayBoard;