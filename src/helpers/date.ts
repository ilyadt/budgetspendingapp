// https://stackoverflow.com/a/2998822/15347300
function pad(num: number, size: number): string {
  const s = '00' + num
  return s.substring(s.length - size)
}

export function dateFormat(d: Date): string {
  return pad(d.getDate(), 2) + '.' + pad(d.getMonth() + 1, 2) + '.' + d.getFullYear()
}

export function dateISO(d: Date): string {
  return d.toISOString().split('T')[0]!
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
