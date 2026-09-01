// =========================================================
// 세부시설 상세 화면
//
// 예:
// 북아현 문화체육센터
//   ↓
// 수영장
//
// SubFacilityDetail의 category + contents 정보를
// 화면에 보여주는 컴포넌트
// =========================================================

function SubFacilityDetail({
  subFacility,
  facility,
  onBack
}) {
  // =====================================================
  // 세부시설 상세정보 배열
  //
  // 예:
  //
  // [
  //   {
  //     category: "수심/레인",
  //     contents: "25m 6레인"
  //   },
  //   {
  //     category: "자유수영",
  //     contents: "성인 4,000원"
  //   }
  // ]
  //
  // 데이터가 아직 없으면 []
  // =====================================================
  const detailItems =
    subFacility.details || []


  return (
    <div className="sub-detail-page">

      {/* =================================================
          상위 시설 상세화면으로 돌아가기
      ================================================= */}
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← {facility.facility_name}
      </button>


      {/* =================================================
          세부시설 상단
      ================================================= */}
      <section className="sub-detail-hero">

        <p className="sub-detail-parent">
          {facility.facility_name}
        </p>


        <h1>
          {subFacility.subfacility_name}
        </h1>


        <p className="sub-detail-description">
          세부시설 이용 정보를 확인해보세요.
        </p>

      </section>


      {/* =================================================
          세부시설 정보
      ================================================= */}
      <section className="sub-detail-section">

        <div className="sub-detail-title">

          <div>

            <h2>
              이용 정보
            </h2>

            <p>
              등록된 세부시설 상세정보입니다.
            </p>

          </div>

        </div>


        {/* =================================================
            SubFacilityDetail 데이터가 있는 경우
        ================================================= */}
        {detailItems.length > 0 ? (

          <div className="sub-detail-info-list">

            {detailItems.map((detailItem) => (

              <div
                key={detailItem.id}
                className="sub-detail-info-item"
              >

                {/* 카테고리 */}
                <span>
                  {detailItem.category}
                </span>


                {/* 실제 내용 */}
                <p>
                  {detailItem.contents}
                </p>

              </div>

            ))}

          </div>

        ) : (

          // =================================================
          // DB에 SubFacilityDetail 데이터가 없는 경우
          //
          // API 연결 자체는 정상이고
          // 아직 DB에 정보가 없다는 의미
          // =================================================
          <div className="sub-detail-empty">

            <h3>
              아직 등록된 상세정보가 없어요.
            </h3>

            <p>
              이용시간, 이용료, 시설규격 등의 정보가
              등록되면 이곳에서 확인할 수 있어요.
            </p>

          </div>

        )}

      </section>


      {/* =================================================
          나중에 사용자 제보 기능을 붙일 자리
      ================================================= */}
      <section className="user-info-section">

        <div>

          <p className="user-info-label">
            USER CONTRIBUTED
          </p>

          <h2>
            이 시설에 대해 알고 있는 정보가 있나요?
          </h2>

          <p>
            운영시간이나 이용료 등 실제 이용정보를
            사용자들이 함께 채울 수 있도록 만들 예정이에요.
          </p>

        </div>


        {/* 아직 기능은 연결하지 않음 */}
        <button
          type="button"
          disabled
        >
          정보 추가 준비중
        </button>

      </section>

    </div>
  )
}


export default SubFacilityDetail