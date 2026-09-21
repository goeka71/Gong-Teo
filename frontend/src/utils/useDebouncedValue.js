import { useEffect, useState } from "react";

// value 가 delay(ms) 동안 더 바뀌지 않으면 그 값을 돌려준다.
// 검색창처럼 입력할 때마다 요청이 나가지 않게 하려고 쓴다.
//
//   const [query, setQuery] = useState("");
//   const debouncedQuery = useDebouncedValue(query, 300);
//   useEffect(() => { ...debouncedQuery 로 조회... }, [debouncedQuery]);
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
