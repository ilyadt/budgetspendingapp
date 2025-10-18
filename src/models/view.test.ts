import { describe, expect, test, vi } from "vitest";
import { PendingSpendingRow } from "./view";
import { fromRUB, Money } from "@/helpers/money";
import * as models from "./models";
import {type Budget} from "./models";


describe('PendingSpendingRow', () => {
  test('setBudget:new', () => {
    const spyGenSpendingID = vi.spyOn(models, 'genSpendingID').mockReturnValue('newID')

    const s = new PendingSpendingRow(
      'id1',
      null,
      null,
      '', // TODO: null ?
      '', // TODO: null ?
      null,
    )

    expect(s.id).toEqual('id1')
    expect(s.budgetId).toEqual(null)
    expect(s.currency).toEqual(null)

    s.setBudget(makeBudget({
      id: 2,
      money: new Money(0, 2, 'RUB'),
    }))

    expect(s.budgetId).toEqual(2)
    expect(s.currency).toEqual('RUB')

    // ID генерируется новый, так как Spending помещается уже внутри другого бюджета
    expect(s.id).eq('newID')

    spyGenSpendingID.mockRestore()
  })

  test('setBudget:update', () => {
    const spyGenSpendingID = vi.spyOn(models, 'genSpendingID').mockReturnValue('newID')

    const s = new PendingSpendingRow(
      'id1',
      1,
      'RUB',
      '<3',
      '14.07',
      null,
    )

    expect(s.id).toEqual('id1')
    expect(s.budgetId).toEqual(1)
    expect(s.currency).toEqual('RUB')

    s.setBudget(makeBudget({
      id: 2,
      money: new Money(0, 2, 'EUR'),
    }))

    expect(s.budgetId).toEqual(2)
    expect(s.currency).toEqual('EUR')

    // ID генерируется новый, так как Spending помещается уже внутри другого бюджета
    expect(s.id).eq('newID')

    spyGenSpendingID.mockRestore()

    // Восстанавливается изначальный бюджет
    s.setBudget(makeBudget({
      id: 1,
      money: new Money(0, 2, 'RUB'),
    }))

    expect(s.id).toEqual('id1') // id остается изначальным
  })
})


function makeBudget(b: Partial<Budget>): Budget {
  return {
    id: b.id ?? 0,
    alias: b.alias ?? '',
    name: b.name ?? '',
    sort: b.sort ?? 0,
    money: b.money ?? fromRUB(0),
    dateFrom: b.dateFrom ?? new Date(0),
    dateTo: b.dateTo ?? new Date(0),
    params: b.params ?? {},
  }
}
