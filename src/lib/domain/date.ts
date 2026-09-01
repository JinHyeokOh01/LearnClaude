/**
 * 날짜 유틸 (design §6.3 / AC-5.11)
 * - 날짜 키 생성: 사용자 로컬 타임존 기준 YYYY-MM-DD
 * - 날짜 산술: UTC 기준으로 계산해 DST 영향을 제거
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 로컬 타임존 기준 YYYY-MM-DD */
export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** key(YYYY-MM-DD)의 하루 전 날짜 키. 산술은 UTC로 수행. */
export function previousDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) - 86_400_000;
  const dt = new Date(t);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

/** a가 b보다 이전(과거)인지. 문자열 비교로 충분(ISO YYYY-MM-DD). */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}
