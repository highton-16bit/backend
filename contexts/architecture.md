# 시스템 아키텍처 및 데이터 설계 (Architecture)

## 🏗️ 시스템 구성 (Cloud-Native Infrastructure)

### 1. Application Layer (Railway Hosting)
- **Role:** 메인 비즈니스 로직 처리, AI(Gemini) 연동, S3 기반 이미지 업로드 프록시.
- **Endpoint:** `https://16bit-api-production.up.railway.app` (Port: 8080)
- **Tech Stack:** Kotlin + Ktor + Netty + Kotlin Coroutines.

### 2. Infrastructure Layer (Supabase Managed)
- **Database:** PostgreSQL (Relation-based Travel & Post Data).
- **Storage:** Supabase S3 Compatible Storage (`ap-southeast-1`).

## 🗄️ 데이터베이스 설계 (Exposed ORM)

### 1. Users (유저)
- `id` (UUID), `username` (Unique TEXT)

### 2. Travels (여행 대장)
- `id` (UUID), `userId` (FK), `title`, `startDate`, `endDate`, `regionName`, `isPublic`

### 3. TravelPlanItems (상세 일정)
- `id`, `travelId` (FK), `date`, `startTime`, `endTime`, `memo`, `orderIndex`

### 4. TravelPhotos (사진)
- `id`, `travelId` (FK), `imageUrl`, `isSnapshot` (Boolean)

### 5. Posts (게시글)
- `id`, `travelId` (FK), `userId` (FK), `title`, `contentSummary` (Static Text), `likeCount`, `cloneCount`

### 6. PostLikes & Bookmarks (소셜)
- 유저별 좋아요 및 북마크 토글 상태 저장.

### 7. PostPhotoMappings (게시글-사진 매핑)
- 게시글 작성 시 선택된 사진들과의 다대다 매핑.

## 📡 API 연동 전략
- **Header Auth:** `Authorization: {username}` 헤더를 통해 모든 요청의 유저 식별.
- **S3 Proxy Upload:** 백엔드 `/photos/upload`를 통해 S3 호환 프로토콜로 수파베이스 버킷에 파일 업로드.
- **AI AX:** Gemini 1.5 Flash를 활용한 일정 요약(Flattening) 및 스마트 클로닝.
