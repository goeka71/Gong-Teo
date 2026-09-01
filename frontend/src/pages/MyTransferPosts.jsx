import { useEffect, useState } from 'react';
import './MyTransferPosts.css';


function MyTransferPosts({ onBack, onEdit }) {

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);


  // ==========================
  // 게시글 목록 가져오기
  // ==========================

  const fetchPosts = () => {

    setLoading(true);


    fetch('http://127.0.0.1:8000/api/oneday/posts/')
      .then((response) => {

        if (!response.ok) {
          throw new Error('게시글을 불러오지 못했습니다.');
        }

        return response.json();

      })

      .then((data) => {

        console.log('양도 게시글:', data);

        setPosts(data);

        setLoading(false);

      })

      .catch((error) => {

        console.error(error);

        setLoading(false);

      });

  };


  useEffect(() => {

    fetchPosts();

  }, []);


  // ==========================
  // 게시글 삭제
  // ==========================

  const handleDelete = (id) => {

    const result = window.confirm(
      '정말 이 양도 게시글을 삭제하시겠습니까?'
    );


    if (!result) {
      return;
    }


    fetch(
      `http://127.0.0.1:8000/api/oneday/posts/${id}/`,
      {
        method: 'DELETE',
      }
    )

      .then((response) => {

        if (!response.ok) {
          throw new Error('게시글 삭제에 실패했습니다.');
        }


        // 화면에서도 바로 제거
        setPosts((currentPosts) =>
          currentPosts.filter(
            (post) => post.id !== id
          )
        );


        alert('게시글이 삭제되었습니다.');

      })

      .catch((error) => {

        console.error(error);

        alert('게시글 삭제 중 오류가 발생했습니다.');

      });

  };


  return (

    <div className="my-post-page">

      <div className="my-post-container">


        {/* 헤더 */}

        <div className="my-post-header">

          <button
            className="back-button"
            onClick={onBack}
          >
            ← 게시판으로
          </button>


          <h1>
            내 양도글 관리
          </h1>


          <p>
            내가 작성한 양도 게시글을 관리할 수 있습니다.
          </p>

        </div>


        {/* 로딩 */}

        {loading && (

          <p className="loading-text">
            게시글을 불러오는 중입니다...
          </p>

        )}


        {/* 게시글 없음 */}

        {!loading && posts.length === 0 && (

          <div className="empty-post">

            <h2>
              아직 작성한 양도글이 없습니다.
            </h2>

            <p>
              필요한 날에 운동 프로그램을 양도해보세요!
            </p>

          </div>

        )}


        {/* 게시글 목록 */}

        <div className="my-post-list">

          {posts.map((post) => (

            <div
              className="my-post-card"
              key={post.id}
            >


              {/* 상태 */}

              <div className="my-post-top">

                <span
                  className={`status ${post.status}`}
                >
                  {post.status === 'open'
                    ? '모집중'
                    : '마감'}
                </span>


                <span className="created-date">

                  작성일 · {' '}

                  {new Date(
                    post.created_at
                  ).toLocaleDateString()}

                </span>

              </div>


              {/* 프로그램 */}

              <h2>
                {post.program_name}
              </h2>


              <p>
                📍 {post.facility_name}
              </p>


              <p>
                📅 양도 날짜: {post.transfer_date}
              </p>


              <p>
                🕙 {post.program_time}
              </p>


              {/* 버튼 */}

              <div className="my-post-buttons">


                <button
                  className="edit-button"
                  onClick={() => onEdit(post)}
                >
                  ✏️ 수정
                </button>


                <button
                  className="delete-button"
                  onClick={() => handleDelete(post.id)}
                >
                  🗑 삭제
                </button>


              </div>

            </div>

          ))}

        </div>


      </div>

    </div>

  );
}


export default MyTransferPosts;