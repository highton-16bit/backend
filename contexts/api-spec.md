# Plog API Specification

## Database Schema

### 1. Users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| username | TEXT | UNIQUE |
| created_at | DATETIME | DEFAULT NOW |

### 2. Travels
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK -> Users |
| title | TEXT | NOT NULL |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL |
| region_name | TEXT | NULLABLE |
| is_public | BOOLEAN | DEFAULT false |
| created_at | DATETIME | DEFAULT NOW |

### 3. TravelPlanItems
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| travel_id | UUID | FK -> Travels (CASCADE) |
| date | DATE | NOT NULL |
| start_time | TEXT | NULLABLE (HH:mm) |
| end_time | TEXT | NULLABLE (HH:mm) |
| memo | TEXT | NULLABLE |
| order_index | INT | DEFAULT 0 |

### 4. TravelPhotos
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| travel_id | UUID | FK -> Travels |
| image_url | TEXT | NOT NULL |
| is_snapshot | BOOLEAN | DEFAULT false |
| latitude | DOUBLE | NULLABLE |
| longitude | DOUBLE | NULLABLE |
| captured_at | DATETIME | NULLABLE |
| created_at | DATETIME | DEFAULT NOW |

### 5. Posts
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| travel_id | UUID | FK -> Travels |
| user_id | UUID | FK -> Users |
| title | TEXT | NOT NULL |
| content_summary | TEXT | NULLABLE (AI generated) |
| like_count | INT | DEFAULT 0 |
| clone_count | INT | DEFAULT 0 |
| created_at | DATETIME | DEFAULT NOW |

### 6. PostLikes
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | PK, FK -> Users |
| post_id | UUID | PK, FK -> Posts (CASCADE) |

### 7. Bookmarks
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | PK, FK -> Users |
| post_id | UUID | PK, FK -> Posts (CASCADE) |
| created_at | DATETIME | DEFAULT NOW |

### 8. PostPhotoMappings
| Column | Type | Constraints |
|--------|------|-------------|
| post_id | UUID | PK, FK -> Posts (CASCADE) |
| photo_id | UUID | PK, FK -> TravelPhotos |

---

## API Endpoints

### Auth
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /auth | 회원가입/로그인 (username 기반) | - |

### Travels
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /travels | 내 여행 목록 | Required |
| GET | /travels/active | 현재 진행 중인 여행 | Required |
| GET | /travels/{id} | 여행 상세 | - |
| POST | /travels | 여행 생성 | Required |
| DELETE | /travels/{id} | 여행 삭제 | Required |
| GET | /travels/{id}/plans | 일정 목록 | - |
| POST | /travels/{id}/plans | 일정 추가 | Required |
| PATCH | /travels/{id}/plans/{planId} | 일정 수정 | Required |
| DELETE | /travels/{id}/plans/{planId} | 일정 삭제 | Required |

### Posts
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /posts | 피드 조회 (전체) | - |
| GET | /posts/{id} | 게시글 상세 | - |
| POST | /posts | 게시글 생성 (AI 요약) | Required |
| POST | /posts/{id}/like | 좋아요 토글 | Required |
| POST | /posts/{id}/bookmark | 북마크 토글 | Required |
| GET | /posts/bookmarks | 북마크 목록 | Required |

### Photos
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /photos/upload | 사진 업로드 (multipart) | - |
| GET | /travels/{id}/photos | 여행 사진 목록 | - |
| POST | /travels/{id}/photos | 사진 메타데이터 등록 | - |

### Search
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /search?q= | AI 검색 | - |
| POST | /search/clone/{postId} | 일정 클론 | Required |

---

## Tech Stack
- **Language**: Kotlin 1.9.22
- **Framework**: Ktor 2.3.7
- **ORM**: Exposed 0.45.0
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase S3
- **AI**: Google Gemini 1.5 Flash
