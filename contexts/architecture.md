# 시스템 아키텍처 및 데이터 설계 (Architecture)

## 🏗️ 시스템 구성 (Cloud-Native Infrastructure)

### 1. Application Layer (Railway Hosting)
- **Role:** 메인 비즈니스 로직 처리, AI(Gemini) 연동, 이미지 업로드 프록시.
- **Endpoint:** `https://plog-api-production.up.railway.app` (예시)
- **Tech Stack:** Kotlin + Ktor + Netty + Kotlin Coroutines.

### 2. Infrastructure Layer (Supabase Managed)
- **Database:** PostgreSQL (Relation-based Travel & Post Data).
- **Storage:** Supabase Storage (Object Storage for Trip Photos).
- **Auth:** Supabase Auth (Seamless Identity Service).

## 🗄️ 데이터베이스 설계 (ERD)

### Travels (여행 대장)
- `id` (UUID, PK), `user_id` (UUID), `title` (TEXT), `start_date` (DATE), `end_date` (DATE), `region_name` (TEXT), `is_public` (BOOL).

### TravelPlanItems (상세 일정)
- `id` (UUID, PK), `travel_id` (UUID, FK), `date` (DATE), `time` (TEXT), `place_name` (TEXT), `memo` (TEXT), `order_index` (INT).

### Posts (게시글)
- `id` (UUID, PK), `travel_id` (UUID, FK), `user_id` (UUID), `title` (TEXT), `content_summary` (AI Generated Text), `like_count` (INT).

## 📡 프론트엔드 협업 전략 (Zero-Config Strategy)
- **이미지 업로드:** Frontend ➡️ Plog API (`POST /api/v1/photos`) ➡️ Backend ➡️ Supabase Storage ➡️ Frontend (URL 반환).
- **인증:** Frontend ➡️ Plog API (`POST /api/v1/auth/login`) ➡️ UUID/Token 반환.
- **결과:** 프론트엔드 팀원은 수파베이스 API Key나 SDK를 몰라도 되며, 오직 Plog API만 사용하여 개발 가능.
