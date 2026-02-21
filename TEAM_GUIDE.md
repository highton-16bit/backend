# 📸 Plog (Photo + Log) - 팀원용 개발 가이드

> **백엔드 개발자로부터의 메시지:** 
> "프론트엔드 개발에만 집중할 수 있도록 모든 인프라(DB, Storage, AI)를 백엔드 API 뒤로 숨겼습니다. 복잡한 수파베이스 SDK나 API Key는 잊고, 아래 가이드에 따라 REST API만 호출하세요! 😉"

---

## 🚀 1. 백엔드 접속 정보
- **Base URL:** `https://plog-api-production.up.railway.app` (Railway 배포 주소)
- **API Documentation (Swagger):** `https://plog-api-production.up.railway.app/docs`
  - 모든 API의 요청(Request)과 응답(Response) 예시를 직접 테스트해 볼 수 있습니다.

---

## 🗺️ 2. 핵심 도메인 구조
1. **Travel (여행 대장):** 하나의 여행 단위 (예: 제주도 3박 4일). 모든 일정과 사진은 여기에 귀속됩니다.
2. **PlanItem (일정):** 여행 내의 상세 일정 (날짜, 시간, 장소, 메모). 캘린더 뷰에 사용하세요.
3. **Photo (사진):** 여행 중 업로드한 사진. `is_joy_mode` 플래그로 조이 모드 여부를 구분합니다.
4. **Post (게시글):** 여행이 끝난 후 공유하는 피드. AI가 자동으로 일정을 요약해 줍니다.

---

## 🖼️ 3. 이미지 업로드 (Easy Upload)
수파베이스 SDK를 쓸 필요가 없습니다. 백엔드가 대신 업로드해 드립니다.
- **Endpoint:** `POST /api/v1/photos/upload` (Multipart Form-Data)
- **Response:** `{"url": "https://supabase-storage-url/image.jpg"}`
- **Tip:** 받은 URL을 DB 저장용 API(`POST /api/v1/travels/{id}/photos`)에 그대로 보내면 됩니다.

---

## 🤖 4. 지능형 AI 기능 (AX)
1. **AI 일정 요약:** 게시글 생성 시 `travel_id`만 보내면 AI가 알아서 감성적인 요약글을 만들어 본문에 넣어줍니다.
2. **스마트 클로닝:** 타인의 게시글 ID를 보내면 AI가 그 글을 분석해서 `Date, Time, Place` 데이터로 변환해 줍니다. (내 달력에 바로 추가 가능!)
3. **AI 통합 검색:** "전주에 있는 힙한 카페 추천해줘"라고 검색하면 DB와 AI 지식을 합쳐서 최고의 답변을 줍니다.

---

## 🔑 5. 인증 (Seamless Login)
- 별도의 회원가입 없이 `POST /api/v1/auth/login`에 `username`만 보내면 유니크한 `userId`가 발급됩니다.
- 이후 모든 API 호출 시 이 `userId`를 쿼리 파라미터나 바디에 넣어주면 됩니다.

---

## 💡 개발 팁
- **더미 데이터:** DB에 이미 고퀄리티 여행 데이터 10개 이상을 넣어뒀습니다. `/api/v1/posts`를 호출해서 바로 피드를 그려보세요.
- **CORS:** 모든 도메인에 대해 CORS가 허용되어 있으므로 로컬 환경에서도 바로 연동 가능합니다.
- **Swagger 활용:** API가 안 된다면 Swagger에서 직접 데이터를 넣고 실행해 보세요. 에러 메시지가 상세히 나옵니다.

**플로그와 함께 멋진 해커톤 결과물을 만들어봅시다! 🚀**
