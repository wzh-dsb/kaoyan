// 统一用东八区本地日期字符串 'YYYY-MM-DD',避免服务器时区差异
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function todayStr(): string {
  return fmt.format(new Date())
}

/** 计算距今还有多少天(目标日 - 今天,不含目标日当天) */
export function daysLeft(date: Date): number {
  const target = new Date(date)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((targetDay.getTime() - today.getTime()) / 86_400_000)
}

const DAY_MS = 86_400_000

function dateStrToTs(s: string): number {
  return new Date(s + 'T00:00:00+08:00').getTime()
}

/** 日期字符串加 n 天 */
export function addDaysStr(s: string, n: number): string {
  return fmt.format(new Date(dateStrToTs(s) + n * DAY_MS))
}

/** 本周周一(东八区),周一为一周起点 */
export function thisWeekStart(): string {
  const today = new Date(todayStr() + 'T00:00:00+08:00')
  const dow = (today.getDay() + 6) % 7 // 周一=0
  return fmt.format(new Date(today.getTime() - dow * DAY_MS))
}

/** 一周 7 天日期字符串数组(周一起) */
export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i))
}

/** 日期字符串比较:今天为 0,未来为正,过去为负(按东八区日界) */
export function diffDays(a: string, b: string): number {
  return Math.round((dateStrToTs(a) - dateStrToTs(b)) / DAY_MS)
}

const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export function weekdayName(s: string): string {
  const ts = dateStrToTs(s)
  return WEEKDAY_NAMES[(new Date(ts).getDay() + 6) % 7]
}
