// 업로드 이미지(리뷰 사진, 수강증) 용량 제한.
// 백엔드(users/serializers.py 의 MAX_IMAGE_SIZE)와 같은 값을 유지할 것.
export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// 예: imageTooLargeMessage("이미지는", file)
//  -> "이미지는 5MB 이하만 첨부할 수 있습니다. (현재 6.2MB)"
export function imageTooLargeMessage(subject, file) {
  // 한도를 살짝 넘는 파일이 "5.0MB" 로 보이지 않도록 소수 첫째 자리에서 올림
  const sizeMb = Math.ceil((file.size / (1024 * 1024)) * 10) / 10;
  return `${subject} ${MAX_IMAGE_MB}MB 이하만 첨부할 수 있습니다. (현재 ${sizeMb.toFixed(1)}MB)`;
}
