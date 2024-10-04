export function moneyToString(money) {
  return money.amount / (10 ** money.fraction)
}
