// =========================================================
// 시설 상세 화면
//
// 상위 시설에 대한 상세정보를 보여주고
// 세부시설 버튼을 클릭하면
// App.jsx에서 세부시설 API를 호출하게 함
// =========================================================

function FacilityDetail({
  facility,
  onBack,
  onSubFacilityClick
}) {
  // =====================================================
  // FacilityDetail 데이터
  //
  // ForeignKey 관계라 배열로 넘어오므로
  // 첫 번째 정보를 사용
  // =====================================================
  const detail =
    facility.details &&
    facility.details.length > 0
      ? facility.details[0]
      : null


  // =====================================================
  // 시설 이미지 주소 처리
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


  const imageUrl = getImageUrl(facility.image)


  return (
    <div className="detail-page">

      {/* =================================================
          목록으로
      ================================================= */}
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← 시설 목록으로
      </button>


      {/* =================================================
          상단 시설 정보
      ================================================= */}
      <section className="detail-hero">

        {/* 이미지 */}
        <div className="detail-image">

          {imageUrl ? (

            <img
              src={imageUrl}
              alt={facility.facility_name}
            />

          ) : (

            <div className="detail-image-placeholder">

              <span>
                SPORTS FACILITY
              </span>

              <p>
                공공체육시설
              </p>

            </div>

          )}

        </div>


        {/* 기본정보 */}
        <div className="detail-summary">

          <p className="detail-category">
            PUBLIC SPORTS FACILITY
          </p>


          <h1>
            {facility.facility_name}
          </h1>


          <p className="detail-address">
            {facility.addr}
          </p>


          {/* 종목 */}
          <div className="detail-sports">

            {facility.sports &&
            facility.sports.length > 0 ? (

              facility.sports.map((sportName) => (

                <span key={sportName}>
                  {sportName}
                </span>

              ))

            ) : (

              <span>
                종목 정보 없음
              </span>

            )}

          </div>

        </div>

      </section>


      {/* =================================================
          상세 본문
      ================================================= */}
      <div className="detail-layout">

        {/* 왼쪽 */}
        <div className="detail-main">

          {/* ===============================================
              이용정보
          =============================================== */}
          <section className="detail-section">

            <h2>
              이용 정보
            </h2>


            <div className="info-grid">

              <div className="info-item">

                <span className="info-label">
                  운영시간
                </span>

                <strong>
                  {detail?.op_hour || '정보 없음'}
                </strong>

              </div>


              <div className="info-item">

                <span className="info-label">
                  공간
                </span>

                <strong>
                  {detail?.in_out || '정보 없음'}
                </strong>

              </div>


              <div className="info-item">

                <span className="info-label">
                  이용료
                </span>

                <strong>
                  {detail?.fee || '정보 없음'}
                </strong>

              </div>


              <div className="info-item">

                <span className="info-label">
                  전화번호
                </span>

                <strong>
                  {detail?.phone || '정보 없음'}
                </strong>

              </div>


              <div className="info-item">

                <span className="info-label">
                  샤워실
                </span>

                <strong>
                  {detail
                    ? detail.shower
                      ? '있음'
                      : '없음'
                    : '정보 없음'}
                </strong>

              </div>


              <div className="info-item">

                <span className="info-label">
                  주차장
                </span>

                <strong>
                  {detail
                    ? detail.parking
                      ? '있음'
                      : '없음'
                    : '정보 없음'}
                </strong>

              </div>

            </div>


            {/* 홈페이지 */}
            {detail?.website && (

              <a
                className="website-button"
                href={detail.website}
                target="_blank"
                rel="noreferrer"
              >
                시설 홈페이지 바로가기 ↗
              </a>

            )}

          </section>


          {/* ===============================================
              세부시설
          =============================================== */}
          <section className="detail-section">

            <div className="section-title-row">

              <h2>
                세부시설
              </h2>

              <p>
                이용하고 싶은 시설을 선택해보세요.
              </p>

            </div>


            {facility.sub_facilities &&
            facility.sub_facilities.length > 0 ? (

              <div className="subfacility-list">

                {facility.sub_facilities.map(
                  (subFacility) => (

                    <button
                      key={subFacility.id}
                      type="button"
                      className="subfacility-button"

                      // =================================================
                      // 이제 실제로 클릭 가능
                      //
                      // 클릭한 세부시설의 id를 App.jsx로 전달
                      // =================================================
                      onClick={() => {
                        onSubFacilityClick(
                          subFacility.id
                        )
                      }}
                    >

                      <span>
                        {subFacility.subfacility_name}
                      </span>

                      <span>
                        →
                      </span>

                    </button>

                  )
                )}

              </div>

            ) : (

              <div className="empty-information">
                등록된 세부시설 정보가 없습니다.
              </div>

            )}

          </section>

        </div>


        {/* =================================================
            오른쪽 교통정보
        ================================================= */}
        <aside className="transport-card">

          <h2>
            오시는 길
          </h2>


          <div className="transport-detail">

            <span>
              주소
            </span>

            <p>
              {facility.addr}
            </p>

          </div>


          <div className="transport-detail">

            <span>
              가까운 역
            </span>

            <p>
              {facility.station || '정보 없음'}

              {facility.station &&
                facility.station_wt != null &&
                ` · 도보 ${facility.station_wt}분`}
            </p>

          </div>


          <div className="transport-detail">

            <span>
              가까운 정류장
            </span>

            <p>
              {facility.bus || '정보 없음'}

              {facility.bus &&
                facility.bus_wt != null &&
                ` · 도보 ${facility.bus_wt}분`}
            </p>

          </div>

        </aside>

      </div>

    </div>
  )
}


export default FacilityDetail