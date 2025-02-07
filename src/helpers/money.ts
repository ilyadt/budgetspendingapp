export class Money {
  constructor(
    public amount: number,
    public fraction: number,
    public currency: string,
  ) {}
}

export function moneyToString(money: Money): string {
  return String(moneyFormat(money))
}

export function moneyFormat(money: Money): number {
  return money.amount / 10 ** money.fraction
}

export function minus(m1: Money, m2: Money): Money {
  if (m1.currency != m2.currency) {
    throw new Error('currencies do not match')
  }
  const res = Object.assign({}, m1)

  res.amount -= m2.amount

  return res
}
