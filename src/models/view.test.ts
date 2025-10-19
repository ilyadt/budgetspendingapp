import { describe, expect, test, vi } from "vitest";
import { PendingSpendingRow, SpendingRow, type SaveData } from "./view";
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

  test('save', () => {
    vi.stubGlobal('alert', vi.fn());

    const spMock = new (vi.fn(() => ({
      saveChanges: vi.fn(),
    }))) as unknown as SpendingRow

    const s = new PendingSpendingRow(
      'id1',
      null,
      null,
      '', // TODO: null ?
      '', // TODO: null ?
      spMock,
    )

    s.save(new Date())

    expect(alert).toHaveBeenCalledWith('пустая сумма');
    expect(spMock.saveChanges).toBeCalledTimes(0)

    vi.clearAllMocks()
    s.amountFull = '1'
    s.save(new Date())

    expect(alert).toHaveBeenCalledWith('пустое описание');
    expect(spMock.saveChanges).toBeCalledTimes(0)

    vi.clearAllMocks()
    s.amountFull = '1'
    s.description = 'чай'
    s.save(new Date())

    expect(alert).toHaveBeenCalledWith('не выбран бюджет');
    expect(spMock.saveChanges).toBeCalledTimes(0)

    vi.clearAllMocks()
    const spyGenSpendingID = vi.spyOn(models, 'genSpendingID').mockReturnValue('spending22')
    const spyGenVersionID = vi.spyOn(models, 'genVersion').mockReturnValue('version11')

    s.amountFull = '110.50'
    s.description = 'чай'
    s.setBudget(makeBudget({id: 1, money: fromRUB(0)}))
    const dt = new Date()
    s.save(dt)

    expect(alert).not.toBeCalled()
    expect(spMock.saveChanges).toBeCalledTimes(1)
    expect(spMock.saveChanges).toBeCalledWith({
      id: 'spending22',
      dt: dt,
      version: 'version11',
      budgetId: 1,
      currency: 'RUB',
      description: 'чай',
      amountFull: 110.50
    } as SaveData)

    spyGenVersionID.mockRestore()
    spyGenSpendingID.mockRestore()
    vi.unstubAllGlobals()
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
