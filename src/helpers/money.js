export function moneyToString(money) {
  return money.amount / (10 ** money.fraction)
}

export function minus(m1, m2) {
  if (m1.currency != m2.currency) {
    throw new Error('currencies do not match');
  }
  let res = Object.assign({}, m1)

  res.amount -= m2.amount

  return res
}
