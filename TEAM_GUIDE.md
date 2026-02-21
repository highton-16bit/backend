# 📸 Plog (Photo + Log) 도메인 명세서

본 문서는 **Plog** 서비스의 핵심 엔티티와 데이터 간의 관계를 정의한다. 모든 데이터는 `Authorization` 헤더의 `username`을 기반으로 식별된다.

---

## 1. 여행 (Travel) & 일정 (PlanItem)
*   **여행 (Travel):** 서비스의 최상위 데이터 단위로, 일정과 사진의 부모 엔티티이다.
*   **일정 (PlanItem):** 여행 기간 내에 발생하는 상세 계획 데이터이다.
    *   **필드:** 날짜(Date), 시작시간(StartTime), 종료시간(EndTime), 장소명(PlaceName), 메모(Memo).

## 2. 스냅샷 (Snapshot)
*   **정의:** 여행 중 특정 시점에 기록된 실시간 이미지 리소스이다.
*   **필드:** 이미지 URL(ImageUrl), 스냅샷 여부(isSnapshot: true).

## 3. 게시글 (Post) & 텍스트 변환 (Flattening)
*   **정의:** 완료된 여행을 기반으로 생성되는 소셜 공유 단위이다.
*   **텍스트 변환 (Flattening):** 게시글 생성 시, 해당 여행의 모든 `PlanItem` 데이터를 아래와 같은 정적 텍스트 리스트로 변환하여 `ContentSummary`에 저장한다. (AI 미사용)
    *   *예시:* "2026-02-02 일정: - 16:00 ~ 17:00 : 비행기 탑승"

## 4. 스마트 클로닝 (Smart Clone - AI 파싱)
*   **동작:** 특정 게시글의 `ContentSummary`(텍스트 리스트)를 **AI(Gemini)**가 분석한다.
*   **AI 역할:** 텍스트를 `planItems: [ {date, startTime, endTime, placeName, memo} ]` 형식의 구조화된 JSON 데이터로 파싱하여 반환한다.
*   **활용:** 사용자는 이 데이터를 기반으로 새로운 여행 일정을 즉시 생성할 수 있다.

---

## 5. 데이터 흐름도
1.  **여행 생성:** `Travel` 엔티티 생성.
2.  **계획 수립:** `Travel` ID 하위에 N개의 `PlanItem` 등록.
3.  **기록 수집:** `Travel` ID 하위에 사진 등록 (실시간은 `isSnapshot: true`).
4.  **피드 공유:** `Travel` 일정을 텍스트로 변환(Flattening)하여 `Post` 생성.
5.  **정보 재활용:** 타인의 `Post` 텍스트를 AI로 분석(Smart Clone)하여 내 일정 데이터로 추출.
