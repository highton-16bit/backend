/**
 * 날짜 범위 유효성 검증
 * @returns 에러 메시지 또는 null (유효할 경우)
 */
export function validateDateRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) {
    return '날짜를 입력해주세요'
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '올바른 날짜 형식이 아닙니다'
  }

  if (start > end) {
    return '시작일이 종료일보다 늦을 수 없습니다'
  }

  return null
}

/**
 * 시간 범위 유효성 검증
 * @returns 에러 메시지 또는 null (유효할 경우)
 */
export function validateTimeRange(startTime: string | null, endTime: string | null): string | null {
  // 둘 다 없으면 OK
  if (!startTime && !endTime) return null

  // 하나만 있으면 OK (시작만 또는 끝만)
  if (!startTime || !endTime) return null

  // 시간 형식 검증 (HH:mm)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return '올바른 시간 형식이 아닙니다 (HH:mm)'
  }

  // 시작 시간이 종료 시간보다 늦으면 에러
  if (startTime >= endTime) {
    return '시작 시간이 종료 시간보다 늦을 수 없습니다'
  }

  return null
}

/**
 * 필수 입력 검증
 */
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) {
    return `${fieldName}을(를) 입력해주세요`
  }
  return null
}
