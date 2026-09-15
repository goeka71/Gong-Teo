import {
  useEffect,
  useState,
} from "react";

import {
  getCoinHistory,
} from "../api/user";

import "./CoinHistory.css";


function CoinHistory() {
  const [
    coinData,
    setCoinData,
  ] = useState({
    coin: 0,
    histories: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================
     코인 내역 불러오기
  ========================= */

  useEffect(() => {
    const loadCoinHistory =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getCoinHistory();

          setCoinData({
            coin:
              data.coin ?? 0,

            histories:
              data.histories ?? [],
          });

        } catch (err) {
          console.error(
            "코인 내역 조회 실패:",
            err
          );

          setError(
            "코인 내역을 불러오지 못했습니다."
          );

        } finally {
          setLoading(false);
        }
      };

    loadCoinHistory();
  }, []);


  /* =========================
     거래 설명에서 +/- 추출

     예)
     회원가입 축하 코인 (+5)
     프로그램 양도받기 (-1)
  ========================= */

  const parseDescription = (
    coinDesc
  ) => {
    const text =
      coinDesc ||
      "코인 이용";

    const match =
      text.match(
        /\(([+-]\d+)\)\s*$/
      );

    if (!match) {
      return {
        description: text,
        change: null,
      };
    }

    return {
      description:
        text
          .replace(
            /\s*\([+-]\d+\)\s*$/,
            ""
          )
          .trim(),

      change:
        Number(match[1]),
    };
  };


  /* =========================
     날짜 표시
  ========================= */

  const formatDate = (
    dateString
  ) => {
    if (!dateString) {
      return "";
    }

    const date =
      new Date(dateString);

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    const hour =
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      );

    const minute =
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      );

    return (
      `${year}.${month}.${day} ` +
      `${hour}:${minute}`
    );
  };


  /* =========================
     로딩
  ========================= */

  if (loading) {
    return (
      <div className="coin-page">

        <h1 className="coin-title">
          코인 내역
        </h1>

        <div className="coin-message">
          코인 내역을 불러오는 중입니다.
        </div>

      </div>
    );
  }


  /* =========================
     오류
  ========================= */

  if (error) {
    return (
      <div className="coin-page">

        <h1 className="coin-title">
          코인 내역
        </h1>

        <div className="coin-message coin-error">
          {error}
        </div>

      </div>
    );
  }


  return (
    <div className="coin-page">

      {/* 제목 */}

      <div className="coin-page-header">

        <div>
          <h1 className="coin-title">
            코인 내역
          </h1>

          <p className="coin-subtitle">
            코인 적립 및 사용 내역을
            확인할 수 있습니다.
          </p>
        </div>

      </div>


      {/* =====================
          보유 코인
      ===================== */}

      <section className="coin-balance-card">

        <div className="coin-balance-left">

          <span className="coin-balance-label">
            현재 보유 코인
          </span>

          <div className="coin-balance">

            <span className="coin-icon">
              🪙
            </span>

            <strong>
              {coinData.coin}
            </strong>

            <span className="coin-unit">
              coin
            </span>

          </div>

        </div>


        <div className="coin-guide">

  <span className="coin-guide-icon">
    i
  </span>

  <div>
    <strong>
      코인 이용 안내
    </strong>

    <p>
      프로그램 양도받기 성공 시 1코인이 차감되며,
      프로그램 양도 성공 시 2코인이 적립됩니다.
    </p>
  </div>

</div>
      </section>


      {/* =====================
          이용 내역
      ===================== */}

      <section className="coin-history-section">

        <div className="coin-history-header">

          <h2>
            코인 이용 내역
          </h2>

          <span className="coin-history-count">
            {coinData.histories.length}건
          </span>

        </div>


        {/* 내역 없음 */}

        {coinData.histories.length ===
        0 ? (

          <div className="coin-empty">

            <div className="coin-empty-icon">
              🪙
            </div>

            <strong>
              아직 코인 내역이 없습니다.
            </strong>

            <p>
              코인을 적립하거나 사용하면
              이곳에 내역이 표시됩니다.
            </p>

          </div>

        ) : (

          /* 내역 있음 */

          <div className="coin-history-list">

            {coinData.histories.map(
              (history) => {

                const parsed =
                  parseDescription(
                    history.coin_desc
                  );

                return (
                  <div
                    key={history.id}
                    className="coin-history-item"
                  >

                    {/* 왼쪽 */}

                    <div className="coin-history-info">

                      <strong className="coin-history-description">
                        {parsed.description}
                      </strong>

                      <span className="coin-history-date">
                        {formatDate(
                          history.created_at
                        )}
                      </span>

                    </div>


                    {/* 오른쪽 */}

                    <div className="coin-history-result">

                      {parsed.change !==
                        null && (

                        <strong
                          className={
                            parsed.change > 0
                              ? "coin-change coin-change-plus"
                              : "coin-change coin-change-minus"
                          }
                        >
                          {parsed.change > 0
                            ? "+"
                            : ""}

                          {parsed.change}
                          {" "}
                          coin
                        </strong>

                      )}


                      <span className="coin-after-balance">
                        잔액{" "}
                        {history.coin_res}
                        {" "}
                        coin
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>

    </div>
  );
}


export default CoinHistory;