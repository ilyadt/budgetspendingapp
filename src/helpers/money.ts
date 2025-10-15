import type { ApiMoney } from '@/models/models'

export class Money {
  constructor(
    public amount: number,
    public fraction: number,
    public currency: Currency,
  ) {}

  public static fromApiMoney(m: ApiMoney): Money {
    return new Money(m.amount, m.fraction, m.currency as Currency)
  }

  public toString(): string {
    return moneyToString(this)
  }

  public format(): number {
    return moneyFormat(this)
  }
}

export function moneyToString(money: Money): string {
  return String(moneyFormat(money))
}

export function moneyFormat(money: Money): number {
  return money.amount / 10 ** money.fraction
}

export function moneyToStringWithCurrency(money: Money): string {
  return moneyToString(money) + ' ' + money.currency
}

export function minus(m1: Money, m2: Money): Money {
  if (m1.currency != m2.currency) {
    throw new Error('currencies do not match')
  }
  const res = Object.assign({}, m1)

  res.amount -= m2.amount

  return res
}

export function fromRUB(amount: number): Money {
  return from(amount, 'RUB')
}

export type Currency = 'RUB' | 'EUR'

const currencies: Currency[] = ['RUB', 'EUR']

const fractions: Record<Currency, number> = {
  RUB: 2,
  EUR: 2,
}

export function from(amount: number, cur: Currency): Money {
  if (!currencies.includes(cur)) {
    throw new Error('invalid currency: ' + cur)
  }

  const fraction = fractions[cur]
  if (fraction == null) {
    throw new Error('fraction value not defined for currency: ' + cur)
  }

  const scaled = Math.floor(amount * 10 ** fraction)

  return new Money(scaled, fraction, cur)
}
