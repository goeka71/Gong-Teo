"""로그인 지연 완화용 비밀번호 해셔.

배경: Django 6.1 기본 해셔(PBKDF2, 150만회 반복)는 로컬(맥) 기준으로도
check_password 1회에 ~300ms가 걸리고, 배포 환경(Render 무료 플랜)의
제한된 CPU에서는 이게 그대로 로그인 API 전체 응답 시간(4~5초)이 된다.
(로그인 API는 DB 조회 1번 + 비밀번호 해시 검증 1번이 전부라, 해시 검증이
거의 모든 시간을 차지한다.)

Argon2 로 바꾸되, Django 기본 파라미터(memory_cost=102400KiB, parallelism=8)는
"코어 여러 개가 동시에 도는 상황"을 가정한 값이라 Render 무료 플랜처럼 CPU가
공유/제한된 환경(코어 수를 장담할 수 없음)에서는 병렬성 이득을 못 보고 오히려
느려질 수 있다. 그래서 parallelism=1(코어 1개만 있다고 가정)을 쓰고,
memory_cost/time_cost 는 OWASP Password Storage Cheat Sheet 가 Argon2id 의
최소 권장값으로 제시하는 조합(m=19456 KiB, t=2, p=1)을 그대로 가져다 쓴다
(임의로 낮춘 값이 아니라 업계에서 통용되는 하한선).

로컬 실측(check_password 1회): 이 설정 ~18ms vs 기존 PBKDF2 ~300ms.
"""

from django.contrib.auth.hashers import Argon2PasswordHasher


class FastArgon2PasswordHasher(Argon2PasswordHasher):
    time_cost = 2
    memory_cost = 19456  # 19 MiB
    parallelism = 1
