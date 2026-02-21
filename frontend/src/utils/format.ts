/**
 * 날짜 포맷팅 (YYYY-MM-DD → MM/DD)
 */
export function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return dateStr
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD → YYYY년 MM월 DD일)
 */
export function formatDateKorean(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[0]}년 ${parseInt(parts[1])}월 ${parseInt(parts[2])}일`
  }
  return dateStr
}

/**
 * 상대 시간 포맷팅
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return formatDateShort(dateStr)
}
