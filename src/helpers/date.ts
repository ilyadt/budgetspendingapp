// https://stackoverflow.com/a/2998822/15347300
function pad(num: number, size: number): string {
  const s = '00' + num
  return s.substring(s.length - size)
}

export function dateFormat(d: Date): string {
  return pad(d.getDate(), 2) + '.' + pad(d.getMonth() + 1, 2) + '.' + d.getFullYear()
}

export function dateFormatFromString(dStr: string): string {
  const d = new Date(dStr)

  return dateFormat(d)
}

export function dateISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export function dateISOFromString(dStr: string): string {
  const d = new Date(dStr)

  return dateISO(d)
}

declare global {
  interface Date {
    lessThanSecondsAgo(seconds: number): boolean
    moreThanSecondsAgo(seconds: number): boolean
  }
}

Date.prototype.lessThanSecondsAgo = function (seconds: number): boolean {
  const now = new Date()
  const diffMs = now.getTime() - this.getTime()
  return diffMs <= seconds * 1000
}

Date.prototype.moreThanSecondsAgo = function (seconds: number): boolean {
  const now = new Date()
  const diffMs = now.getTime() - this.getTime()
  return diffMs > seconds * 1000
}

export function dateRange(dateFrom: Date, dateTo: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(dateFrom)

  while (current <= dateTo) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1) // Increment by 1 day
  }

  return dates
}

export function dayName(d: Date): string {
  const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

  return dayNames[d.getDay()]!
}

export function DateCheck(base: Date) {
  return {
    isToday: (d: Date) => base.toDateString() === d.toDateString(),
    isFuture: (d: Date) => d.getTime() > base.getTime(),
  }
}
