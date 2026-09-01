import { useEffect, useState } from 'react'
import './App.css'

// 시설 상세 화면
import FacilityDetail from './FacilityDetail'

// 세부시설 상세 화면
import SubFacilityDetail from './SubFacilityDetail'


function App() {
  // =====================================================
  // 검색 / 필터 결과 시설 목록
  // =====================================================
  const [facilities, setFacilities] = useState([])


  // =====================================================
  // 전체 시설 데이터
  //
  // 지역 목록을 만들 때 사용
  // =====================================================
  const [allFacilities, setAllFacilities] = useState([])


  // =====================================================
  // DB에 저장된 전체 종목
  // =====================================================
  const [sports, setSports] = useState([])


  // =====================================================
  // 검색 관련 state
  // =====================================================
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')


  // =====================================================
  // 필터 관련 state
  // =====================================================
  const [region, setRegion] = useState('')
  const [sport, setSport] = useState('')
  const [inOut, setInOut] = useState('')


  // =====================================================
  // 현재 선택한 상위 시설
  //
  // null → 시설 목록 화면
  // 값 있음 → 시설 상세 화면
  // =====================================================
  const [selectedFacility, setSelectedFacility] = useState(null)


  // =====================================================
  // 현재 선택한 세부시설
  //
  // null → 세부시설 상세 화면 아님
  // 값 있음 → 세부시설 상세 화면
  // =====================================================
  const [selectedSubFacility, setSelectedSubFacility] = useState(null)


  // =====================================================
  // 로딩 / 오류
  // =====================================================
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  // =====================================================
  // 처음 실행될 때
  //
  // 전체 시설 + 종목 데이터 가져오기
  // =====================================================
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // 전체 시설
        const facilityResponse = await fetch(
          'http://127.0.0.1:8000/api/facilities/'
        )

        if (!facilityResponse.ok) {
          throw new Error('전체 시설 데이터를 불러오지 못했습니다.')
        }

        const facilityData = await facilityResponse.json()

        setAllFacilities(facilityData)


        // 전체 종목
        const sportResponse = await fetch(
          'http://127.0.0.1:8000/api/facilities/sports/'
        )

        if (!sportResponse.ok) {
          throw new Error('종목 데이터를 불러오지 못했습니다.')
        }

        const sportData = await sportResponse.json()

        setSports(sportData)

      } catch (err) {
        setError(err.message)
      }
    }

    fetchFilterData()
  }, [])


  // =====================================================
  // 주소에서 지역 "구" 추출
  // =====================================================
  const regions = [
    ...new Set(
      allFacilities
        .map((facility) => {
          if (!facility.addr) {
            return null
          }

          const addressParts = facility.addr.split(' ')

          const district = addressParts.find((part) =>
            part.endsWith('구')
          )

          return district || null
        })

        .filter(Boolean)
    )
  ].sort()


  // =====================================================
  // 검색 / 필터가 바뀌면 시설 목록 다시 가져오기
  // =====================================================
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true)
        setError(null)


        const params = new URLSearchParams()


        // 검색어
        if (searchQuery) {
          params.append('q', searchQuery)
        }


        // 지역
        if (region) {
          params.append('region', region)
        }


        // 종목
        if (sport) {
          params.append('sport', sport)
        }


        // 실내 / 실외
        if (inOut) {
          params.append('in_out', inOut)
        }


        const queryString = params.toString()


        const url = queryString
          ? `http://127.0.0.1:8000/api/facilities/?${queryString}`
          : 'http://127.0.0.1:8000/api/facilities/'


        const response = await fetch(url)


        if (!response.ok) {
          throw new Error('시설 데이터를 불러오지 못했습니다.')
        }


        const data = await response.json()

        setFacilities(data)

      } catch (err) {
        setError(err.message)

      } finally {
        setLoading(false)
      }
    }


    fetchFacilities()

  }, [searchQuery, region, sport, inOut])


  // =====================================================
  // 검색
  // =====================================================
  const handleSearch = () => {
    setSearchQuery(searchInput.trim())
  }


  // =====================================================
  // Enter 검색
  // =====================================================
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }


  // =====================================================
  // 검색 / 필터 초기화
  // =====================================================
  const handleReset = () => {
    setSearchInput('')
    setSearchQuery('')
    setRegion('')
    setSport('')
    setInOut('')
  }


  // =====================================================
  // 시설 상세 보기
  // =====================================================
  const handleFacilityClick = async (facilityId) => {
    try {
      setLoading(true)
      setError(null)


      const response = await fetch(
        `http://127.0.0.1:8000/api/facilities/${facilityId}/`
      )


      if (!response.ok) {
        throw new Error(
          '시설 상세정보를 불러오지 못했습니다.'
        )
      }


      const data = await response.json()


      setSelectedFacility(data)

      // 다른 세부시설이 선택되어 있으면 초기화
      setSelectedSubFacility(null)


      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })

    } catch (err) {
      setError(err.message)

    } finally {
      setLoading(false)
    }
  }


  // =====================================================
  // 세부시설 상세 보기
  //
  // 예:
  // 수영장 버튼 클릭
  // ↓
  // /api/facilities/subfacilities/3/
  // =====================================================
  const handleSubFacilityClick = async (subFacilityId) => {
    try {
      setLoading(true)
      setError(null)


      const response = await fetch(
        `http://127.0.0.1:8000/api/facilities/subfacilities/${subFacilityId}/`
      )


      if (!response.ok) {
        throw new Error(
          '세부시설 상세정보를 불러오지 못했습니다.'
        )
      }


      const data = await response.json()


      // 선택한 세부시설 저장
      setSelectedSubFacility(data)


      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })

    } catch (err) {
      setError(err.message)

    } finally {
      setLoading(false)
    }
  }


  // =====================================================
  // 시설 상세 → 목록으로
  // =====================================================
  const handleBackToList = () => {
    setSelectedFacility(null)
    setSelectedSubFacility(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }


  // =====================================================
  // 세부시설 상세 → 시설 상세로
  // =====================================================
  const handleBackToFacility = () => {
    setSelectedSubFacility(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }


  // =====================================================
  // Django 이미지 주소 처리
  // =====================================================
  const getImageUrl = (image) => {
    if (!image) {
      return null
    }

    if (image.startsWith('http')) {
      return image
    }

    return `http://127.0.0.1:8000${image}`
  }


  // =====================================================
  // 세부시설이 선택되어 있다면
  // 세부시설 상세화면 표시
  // =====================================================
  if (selectedSubFacility && selectedFacility) {
    return (
      <SubFacilityDetail
        subFacility={selectedSubFacility}

        // 상위 시설 정보도 전달
        facility={selectedFacility}

        // 뒤로가기 함수
        onBack={handleBackToFacility}
      />
    )
  }


  // =====================================================
  // 시설이 선택되어 있다면
  // 시설 상세화면 표시
  // =====================================================
  if (selectedFacility) {
    return (
      <FacilityDetail
        facility={selectedFacility}

        // 시설 목록으로 돌아가기
        onBack={handleBackToList}

        // 세부시설 클릭 함수 전달
        onSubFacilityClick={handleSubFacilityClick}
      />
    )
  }


  return (
    <div className="app">

      {/* =================================================
          상단 헤더
      ================================================= */}
      <header className="header">

        <div className="header-inner">

          {/* 로고 */}
          <div className="logo-area">

            <span className="logo-mark">
              G
            </span>

            <span className="logo-text">
              공터
            </span>

          </div>


          {/* 메뉴 */}
          <nav className="nav">

            <button type="button">
              시설 찾기
            </button>

            <button type="button">
              프로그램
            </button>

            <button type="button">
              커뮤니티
            </button>

          </nav>

        </div>

      </header>


      {/* =================================================
          메인 화면
      ================================================= */}
      <main className="main">

        {/* ===============================================
            소개 영역
        =============================================== */}
        <section className="intro">

          <p className="intro-label">
            PUBLIC SPORTS FACILITY
          </p>

          <h1>
            나에게 맞는 체육시설을
            <br />
            찾아보세요
          </h1>

          <p className="intro-description">
            지역과 종목을 선택해 원하는 공공체육시설을
            빠르게 찾아볼 수 있어요.
          </p>

        </section>


        {/* ===============================================
            검색 + 필터
        =============================================== */}
        <section className="search-section">

          {/* 검색창 */}
          <div className="search-box">

            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"

              value={searchInput}

              onChange={(event) => {
                setSearchInput(event.target.value)
              }}

              onKeyDown={handleKeyDown}

              placeholder="시설명, 지역, 종목을 검색해보세요"
            />

            <button
              type="button"
              className="search-button"
              onClick={handleSearch}
            >
              검색
            </button>

          </div>


          {/* 필터 */}
          <div className="filter-area">

            {/* 지역 */}
            <div className="filter-group">

              <span className="filter-label">
                지역
              </span>

              <select
                value={region}

                onChange={(event) => {
                  setRegion(event.target.value)
                }}
              >

                <option value="">
                  전체 지역
                </option>

                {regions.map((regionName) => (
                  <option
                    key={regionName}
                    value={regionName}
                  >
                    {regionName}
                  </option>
                ))}

              </select>

            </div>


            {/* 종목 */}
            <div className="filter-group">

              <span className="filter-label">
                종목
              </span>

              <select
                value={sport}

                onChange={(event) => {
                  setSport(event.target.value)
                }}
              >

                <option value="">
                  전체 종목
                </option>

                {sports.map((sportItem) => (
                  <option
                    key={sportItem.id}
                    value={sportItem.sport_name}
                  >
                    {sportItem.sport_name}
                  </option>
                ))}

              </select>

            </div>


            {/* 실내외 */}
            <div className="filter-group">

              <span className="filter-label">
                공간
              </span>

              <select
                value={inOut}

                onChange={(event) => {
                  setInOut(event.target.value)
                }}
              >

                <option value="">
                  실내 · 실외 전체
                </option>

                <option value="실내">
                  실내
                </option>

                <option value="실외">
                  실외
                </option>

              </select>

            </div>


            {/* 초기화 */}
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
            >
              ↻ 초기화
            </button>

          </div>

        </section>


        {/* =================================================
            검색 결과
        ================================================= */}
        <section className="result-section">

          <div className="result-header">

            <div>

              <h2>
                시설 찾기
              </h2>

              {!loading && !error && (
                <p>
                  총 <strong>{facilities.length}</strong>개의 시설을
                  찾았어요.
                </p>
              )}

            </div>


            {/* 현재 선택 조건 */}
            <div className="selected-filters">

              {searchQuery && (
                <span>
                  검색 · {searchQuery}
                </span>
              )}

              {region && (
                <span>
                  {region}
                </span>
              )}

              {sport && (
                <span>
                  {sport}
                </span>
              )}

              {inOut && (
                <span>
                  {inOut}
                </span>
              )}

            </div>

          </div>


          {/* 로딩 */}
          {loading && (
            <div className="message-box">
              시설 정보를 불러오는 중입니다...
            </div>
          )}


          {/* 오류 */}
          {error && (
            <div className="message-box error">
              오류: {error}
            </div>
          )}


          {/* 결과 없음 */}
          {!loading &&
            !error &&
            facilities.length === 0 && (

              <div className="message-box">

                <h3>
                  조건에 맞는 시설이 없어요.
                </h3>

                <p>
                  다른 검색어나 필터를 사용해보세요.
                </p>

              </div>
            )}


          {/* 시설 카드 */}
          {!loading &&
            !error &&
            facilities.length > 0 && (

              <div className="facility-grid">

                {facilities.map((facility) => {

                  // 첫 번째 시설 상세정보
                  const detail =
                    facility.details &&
                    facility.details.length > 0
                      ? facility.details[0]
                      : null


                  const imageUrl =
                    getImageUrl(facility.image)


                  return (
                    <article
                      key={facility.id}
                      className="facility-card"
                    >

                      {/* 이미지 */}
                      <div className="facility-image">

                        {imageUrl ? (

                          <img
                            src={imageUrl}
                            alt={facility.facility_name}
                          />

                        ) : (

                          <div className="image-placeholder">

                            <span>
                              SPORTS
                            </span>

                            <p>
                              공공체육시설
                            </p>

                          </div>
                        )}


                        {/* 실내외 */}
                        {detail?.in_out && (
                          <span className="indoor-badge">
                            {detail.in_out}
                          </span>
                        )}

                      </div>


                      {/* 카드 내용 */}
                      <div className="facility-content">

                        <h3>
                          {facility.facility_name}
                        </h3>


                        <p className="address">
                          {facility.addr}
                        </p>


                        {/* 종목 */}
                        <div className="sport-tags">

                          {facility.sports &&
                          facility.sports.length > 0 ? (

                            facility.sports
                              .slice(0, 4)
                              .map((sportName) => (

                                <span
                                  key={sportName}
                                  className="sport-tag"
                                >
                                  {sportName}
                                </span>

                              ))

                          ) : (

                            <span className="sport-tag empty">
                              종목 정보 없음
                            </span>

                          )}

                        </div>


                        {/* 교통정보 */}
                        <div className="transport">

                          {facility.station ? (

                            <p>
                              가까운 역&nbsp;

                              <strong>
                                {facility.station}
                              </strong>

                              {facility.station_wt != null &&
                                ` · 도보 ${facility.station_wt}분`}
                            </p>

                          ) : (

                            <p>
                              지하철 정보 없음
                            </p>

                          )}

                        </div>


                        {/* 시설 상세 이동 */}
                        <button
                          type="button"
                          className="detail-button"

                          onClick={() => {
                            handleFacilityClick(facility.id)
                          }}
                        >
                          시설 자세히 보기

                          <span>
                            →
                          </span>
                        </button>

                      </div>

                    </article>
                  )
                })}

              </div>
            )}

        </section>

      </main>

    </div>
  )
}


export default App