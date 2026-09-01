import { useEffect, useState } from 'react';
import './TransferBoard.css';

function TransferBoard({ onWrite, onMyPosts }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/oneday/posts/')
      .then((response) => {
        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }

        return response.json();
      })
      .then((data) => {
        console.log('양도 게시글:', data);
        setPosts(data);
      })
      .catch((error) => {
        console.error('데이터를 가져오는 중 오류 발생:', error);
      });
  }, []);

  return (
    <div className="transfer-board">

      {/* 게시판 헤더 */}
      <div className="board-header">
        <h1>양도 게시판</h1>
        <p>운동 프로그램 양도 정보를 확인하세요!</p>
      </div>

      {/* 게시판 내용 */}
      <div className="board-content">

        {/* 상단 영역 */}
        <div className="board-top">

          <h2>양도 프로그램</h2>

          {/* 버튼 영역 */}
          <div className="board-actions">

            <button
              className="my-post-button"
              onClick={onMyPosts}
            >
              📋 내 양도글 관리
            </button>

            <button
              className="write-button"
              onClick={onWrite}
            >
              + 글쓰기
            </button>

          </div>

        </div>

        {/* 게시글 목록 */}
        <div className="post-list">

          {posts.length === 0 ? (

            <div className="empty-post">
              아직 등록된 양도 게시글이 없습니다.
            </div>

          ) : (

            posts.map((post) => (

              <div
                className="post-card"
                key={post.id}
              >

                {/* 카드 상단 */}
                <div className="card-header">

                  <span
                    className={`status ${
                      post.status === 'open' ? 'open' : 'closed'
                    }`}
                  >
                    {post.status === 'open' ? '모집중' : '마감'}
                  </span>

                  <span className="program-name">
                    {post.program_name}
                  </span>

                </div>

                {/* 카드 정보 */}
                <div className="card-info">

                  <p>
                    📍 {post.facility_name}
                  </p>

                  <p>
                    📅 {post.transfer_date}
                  </p>

                  <p>
                    🕙 {post.program_time}
                  </p>

                </div>

                {/* 카드 하단 */}
                <div className="card-footer">

                  <span>
                    신청 인원 {post.application_count ?? 0}명
                  </span>

                  <button>
                    자세히 보기
                  </button>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}

export default TransferBoard;