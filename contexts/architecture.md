# 시스템 아키텍처 및 데이터 설계 (Architecture)

## 🏗️ 시스템 구성 (Cloud-Native Infrastructure)

### 1. Application Layer (Railway Hosting)
- **Role:** 메인 비즈니스 로직 처리, AI(Gemini) 연동, 이미지 업로드 프록시.
- **Endpoint:** `https://plog-api-production.up.railway.app`
- **Tech Stack:** Kotlin + Ktor + Netty + Kotlin Coroutines.

### 2. Infrastructure Layer (Supabase Managed)
- **Database:** PostgreSQL (Relation-based Travel & Post Data).
- **Storage:** Supabase Storage (Object Storage for Snapshot Photos).

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

## 📡 API 연동 전략
- **Header Auth:** `Authorization: {username}` 헤더를 통해 모든 요청의 유저 식별.
- **Proxy Upload:** 백엔드 `/photos/upload`를 통해 수파베이스 클라우드 스토리지 간접 이용.
