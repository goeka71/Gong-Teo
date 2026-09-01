import { useState } from 'react';

import TransferBoard from './pages/TransferBoard';
import WritePost from './pages/WritePost';
import MyTransferPosts from './pages/MyTransferPosts';
import EditPost from './pages/EditPost';

import './App.css';


function App() {

  // 현재 페이지
  const [page, setPage] = useState('board');

  // 현재 수정 중인 게시글
  const [selectedPost, setSelectedPost] = useState(null);


  // ==========================
  // 글쓰기 페이지
  // ==========================

  if (page === 'write') {

    return (
      <WritePost
        onBack={() => setPage('board')}
        onComplete={() => setPage('board')}
      />
    );

  }


  // ==========================
  // 내 양도글 관리
  // ==========================

  if (page === 'myposts') {

    return (
      <MyTransferPosts
        onBack={() => setPage('board')}

        onEdit={(post) => {

          // 수정할 게시글 저장
          setSelectedPost(post);

          // 수정 페이지로 이동
          setPage('edit');

        }}
      />
    );

  }


  // ==========================
  // 게시글 수정
  // ==========================

  if (page === 'edit' && selectedPost) {

    return (
      <EditPost
        post={selectedPost}

        // 취소 → 내 양도글 관리
        onBack={() => setPage('myposts')}

        // 수정 완료 → 내 양도글 관리
        onComplete={() => setPage('myposts')}
      />
    );

  }


  // ==========================
  // 양도 게시판
  // ==========================

  return (
    <TransferBoard

      // 글쓰기
      onWrite={() => setPage('write')}

      // 내 양도글 관리
      onMyPosts={() => setPage('myposts')}

    />
  );

}


export default App;