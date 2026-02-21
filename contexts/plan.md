# 개발 로드맵 및 현황 (Plan)

## 📅 해커톤 마일스톤 (Milestones)

### 🟢 Phase 1: 기반 구축 (Setup)
- [x] Ktor 프로젝트 초기화 및 폴더 구조 생성.
- [x] Railway 배포용 Dockerfile 및 Gradle 빌드 설정.
- [x] Supabase PostgreSQL DB 연동 및 테이블 스키마 생성.

### 🟡 Phase 2: 핵심 도메인 (Core Domain)
- [x] `Travel` 생성/조회/목록 API (진행중/종료/예정 필터링).
- [x] `TravelPlanItem` (캘린더 일정) CRUD API.
- [ ] **Next Step:** `TravelPhoto` 업로드 프록시 API (Supabase Storage 연동).

### 🟠 Phase 3: 소셜 및 공유 (Social & AI Summary)
- [ ] `Post` 생성 및 피드 조회 API.
- [ ] Gemini AI 기반 여행 일정 요약(Flat) 기능 통합.
- [ ] 게시글 좋아요 및 스크랩(클로닝) 기능.

### 🔴 Phase 4: 지능형 검색 및 배포 (AI & Deployment)
- [ ] Gemini AI 기반 통합 검색 엔드포인트 구현.
- [ ] 스마트 클로닝(AI Parsing) 기능 (텍스트 -> 일정 변환).
- [ ] Railway 최종 배포 및 Swagger 문서 공개.

---

## 🚦 현재 진행 상황 (Current Status)
- [x] 프로젝트 기획 및 도메인 확정 (Plog).
- [x] 컨텍스트 파일 작성 및 아키텍처 수립.
- [x] Ktor 프로젝트 기반 코드 및 도메인 엔티티 작성 완료.
- [ ] **Next Step:** Railway 배포 및 수파베이스 스토리지 업로드 로직 테스트.
