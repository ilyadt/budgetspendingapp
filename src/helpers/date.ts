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
