import { test, expect, describe, beforeEach, vi } from 'vitest'

import type { Budget, Spending as ApiSpending } from '@/models/models'
import { Storage, VersionStatus, type Spending, _test } from './storage'
import { fromRUB } from './helpers/money'

describe('storage_test', () => {
  beforeEach(() => {
    clearLocalStorageByPrefix(_test.lsPrefix)
  })

  test('get_budgets:empty', () => {
    expect(Storage.getBudgets()).toEqual([])
  })

  test('get_budgets:invalid_store', () => {
    localStorage.setItem(_test.lsBudgetsKey(), 'invalid json')
    expect(() => Storage.getBudgets()).toThrow()
  })

  test('update_budgets_from_remote:init', () => {
    Storage.storeBudgetsFromRemote([
      {
        id: 2,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: '{}',
      },
      {
        id: 1,
        alias: 'b1',
        name: 'на учебу',
        sort: 1,
        money: fromRUB(50_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-10-01',
        params: '{}', // TODO: api json format
      },
    ])

    // Так же тут проверяется сортировка:
    // при сохранении в стор все бюджеты сортируются по ID
    // @test get_budgets:not_empty
    expect(Storage.getBudgets()).toEqual([
      {
        id: 1,
        alias: 'b1',
        name: 'на учебу',
        sort: 1,
        money: fromRUB(50_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-10-01', // TODO: dateTo -> Date()
        params: '{}', // TODO: api json format
      },
      {
        id: 2,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: '{}',
      },
    ])
  })

  test('update_budgets_from_remote:delete_other_spendings', () => {
    Storage.storeBudgetsFromRemote([
      {
        id: 3,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: '{}',
      },
      {
        id: 2,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: '{}',
      },
    ])

    // Эмулируем траты по бюджетам
    localStorage.setItem(_test.lsSpendingsKey(2), 'some value2')
    localStorage.setItem(_test.lsSpendingsKey(3), 'some value3')

    Storage.storeBudgetsFromRemote([
      {
        id: 2,
        alias: 'coffee',
        name: 'на кофе',
        sort: 2,
        money: fromRUB(5_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-09-31',
        params: '{}',
      },
      {
        id: 1,
        alias: 'b1',
        name: 'на учебу',
        sort: 1,
        money: fromRUB(50_000),
        dateFrom: '2025-09-01',
        dateTo: '2025-10-01',
        params: '{}', // TODO: api json format
      },
    ])

    // удаляются траты по бюджетам, которых нет в списке
    expect(localStorage.getItem(_test.lsSpendingsKey(3))).toBeNull()

    // остаются все те, которые есть
    expect(localStorage.getItem(_test.lsSpendingsKey(2))).toEqual('some value2')
  })

  test('spendings_by_budget_id:empty,invalid_store', () => {
    expect(Storage.spendingsByBudgetId(555)).toEqual([])

    localStorage.setItem(_test.lsSpendingsKey(555), 'invalid value')
    expect(() => Storage.spendingsByBudgetId(555)).toThrow(SyntaxError)
  })

  test('spendings_by_budget_ids', () => {
    expect(Storage.spendingsByBudgetIds([])).toEqual([])

    Storage.storeBudgetsFromRemote([
      makeBudget(1),
      makeBudget(2),
    ])

    Storage.storeSpendingsFromRemote(1, [
      makeApiSpending({id: 'sp11'}),
      makeApiSpending({id: 'sp12'}),
    ])

    Storage.storeSpendingsFromRemote(2, [
      makeApiSpending({id: 'sp21'}),
      makeApiSpending({id: 'sp22'}),
    ])

    const res = Storage.spendingsByBudgetIds([1, 2])

    expect(res).length(4)

    expect(eq({id: 'sp11'}, res[0]!)).toBe(true)
    expect(eq({id: 'sp12'}, res[1]!)).toBe(true)
    expect(eq({id: 'sp21'}, res[2]!)).toBe(true)
    expect(eq({id: 'sp22'}, res[3]!)).toBe(true)
  })

  test(Storage.storeSpendingsFromRemote.name, () => {
    // Невозможно записать расходы в несуществующий бюджет
    expect(() => Storage.storeSpendingsFromRemote(1, [])).toThrow('not existing budget')

    Storage.storeBudgetsFromRemote([makeBudget(1)])

    {
      const errors = Storage.storeSpendingsFromRemote(1, [
        {
          id: 'sp1',
          date: '2025-09-03',
          sort: 34,
          money: fromRUB(134_00),
          description: 'круассан',
          createdAt: '2025-09-03T15:23:22Z',
          updatedAt: '2025-09-03T15:23:22Z',
          version: '32kl4j3',
        },
      ])

      expect(errors).toEqual([])

      const sps = Storage.spendingsByBudgetId(1)

      expect(sps).toEqual([
        {
          id: 'sp1',
          date: new Date('2025-09-03'),
          sort: 34,
          money: fromRUB(134_00),
          description: 'круассан',
          createdAt: new Date('2025-09-03T15:23:22Z'),
          updatedAt: new Date('2025-09-03T15:23:22Z'),
          version: '32kl4j3',
        },
      ])
    }

    // Сохранение в правильном порядке (sp.id ASC)
    {
      const errors = Storage.storeSpendingsFromRemote(1, [
        {
          id: 'sp2',
          date: '2025-09-04',
          sort: 1,
          money: fromRUB(150_00),
          description: 'шоколадка',
          createdAt: '2025-09-04T10:00:00Z',
          updatedAt: '2025-09-04T10:00:00Z',
          version: 'ver1',
        },
        {
          id: 'sp1',
          date: '2025-09-03',
          sort: 35,
          money: fromRUB(134_00),
          description: 'круассан',
          createdAt: '2025-09-03T15:23:22Z',
          updatedAt: '2025-09-03T15:23:22Z',
          version: 'ver2',
        },
      ])

      expect(errors).toEqual([])
      const sps = Storage.spendingsByBudgetId(1)

      // Проверяем так же сортировку
      expect(sps).toEqual([
        {
          id: 'sp1',
          date: new Date('2025-09-03'),
          sort: 35,
          money: fromRUB(134_00),
          description: 'круассан',
          createdAt: new Date('2025-09-03T15:23:22Z'),
          updatedAt: new Date('2025-09-03T15:23:22Z'),
          version: 'ver2',
        },
        {
          id: 'sp2',
          date: new Date('2025-09-04'),
          sort: 1,
          money: fromRUB(150_00),
          description: 'шоколадка',
          createdAt: new Date('2025-09-04T10:00:00Z'),
          updatedAt: new Date('2025-09-04T10:00:00Z'),
          version: 'ver1',
        },
      ])
    }
  })

  test(Storage.storeSpendingsFromRemote.name + ':new_remote_ver', () => {
    Storage.storeBudgetsFromRemote([makeBudget(1)])

    Storage.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver1' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
      makeApiSpending({ id: 'sp3', version: 'ver1' }),
    ])

    const revoked = Storage.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver2' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
      makeApiSpending({ id: 'sp3', version: 'ver1' }),
      makeApiSpending({ id: 'sp4', version: 'ver1' }),
    ])

    // Перетирание с remote без pending
    expect(revoked).length(0)

    const sps = Storage.spendingsByBudgetId(1)

    expect(sps).length(4)

    expect(sps[0]!.id).toEqual('sp1')
    expect(sps[0]!.version).toEqual('ver2')
  })

  test(Storage.storeSpendingsFromRemote.name + ':local_only', () => {
    Storage.storeBudgetsFromRemote([makeBudget(1)])

    // Status pending
    Storage.createSpending(
      1,
      makeSpending({
        id: 'spX',
        version: 'ver1',
      }),
    )

    Storage.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver1' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
    ])

    const sps = Storage.spendingsByBudgetId(1)

    expect(sps).toEqual([
      makeSpending({ id: 'sp1', version: 'ver1' }),
      makeSpending({ id: 'sp2', version: 'ver1' }),
      makeSpending({ id: 'spX', version: 'ver1' }),
    ])

    vi.useFakeTimers()

    // Время статуса Applied
    const dApplied = new Date('2025-09-25T12:00:00Z')

    vi.setSystemTime(dApplied)

    Storage.setStatusApplied(1, 'spX', 'ver1') // Applied

    // Прошло небольшое время
    vi.advanceTimersByTime(5 * 1000)

    Storage.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver1' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
    ])

    // Applied может быть еще не отдается для read, задерживаем статус
    expect(sps).toEqual([
      makeSpending({ id: 'sp1', version: 'ver1' }),
      makeSpending({ id: 'sp2', version: 'ver1' }),
      makeSpending({ id: 'spX', version: 'ver1' }),
    ])

    // Через какое-то продолжительное время после applied.
    vi.advanceTimersByTime(1 * 60 * 60 * 1000)

    // Опять 2 записи, что означает, что он уже точно удалился с сервера после применения
    const revoked = Storage.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver1' }),
      makeApiSpending({ id: 'sp2', version: 'ver1' }),
    ])
    expect(revoked).toEqual([])

    const sps2 = Storage.spendingsByBudgetId(1)

    expect(sps2).length(2)
    expect(eq({ id: 'sp1', version: 'ver1' }, sps2[0]!)).toBe(true)
    expect(eq({ id: 'sp2', version: 'ver1' }, sps2[1]!)).toBe(true)

    vi.useRealTimers()
  })

  // pending -> applied -> inDB
  test(Storage.storeSpendingsFromRemote.name + ':applied', () => {
    const getValue = () => localStorage.getItem(_test.lsSpendingsKey(1)) || '';

    Storage.storeBudgetsFromRemote([makeBudget(1)])

    Storage.createSpending(1, makeSpending({id: 'spX', version: 'ver1'}))

    expect(getValue()).toContain(VersionStatus.Pending);

    Storage.setStatusApplied(1, 'spX', 'ver1')

    expect(getValue()).toContain(VersionStatus.Applied);

    const revoked = Storage.storeSpendingsFromRemote(1, [
      makeApiSpending({id: 'spX', version: 'ver1'})
    ])

    expect(revoked).toEqual([])

    expect(getValue()).toContain(VersionStatus.InDb);
  })

  test(Storage.storeSpendingsFromRemote.name + ':local_conflict', () => {
    Storage.storeBudgetsFromRemote([makeBudget(1)])

    Storage.storeSpendingsFromRemote(1, [makeApiSpending({ id: 'sp1', version: 'ver1' })])

    Storage.updateSpending(1, makeSpending({ id: 'sp1', version: 'ver2', parentVersion: 'ver1' }))
    Storage.updateSpending(1, makeSpending({ id: 'sp1', version: 'ver3', parentVersion: 'ver2' }))

    const revoked = Storage.storeSpendingsFromRemote(1, [
      makeApiSpending({ id: 'sp1', version: 'ver4' }),
    ])

    // Перетирание локальных изменений
    expect(revoked).length(2)

    expect(revoked[0]!.spendingId).toEqual('sp1')
    expect(revoked[0]!.version).toEqual('ver2')

    expect(revoked[1]!.spendingId).toEqual('sp1')
    expect(revoked[1]!.version).toEqual('ver3')

    const sps = Storage.spendingsByBudgetId(1)

    expect(sps).length(1)

    expect(sps[0]!.id).toEqual('sp1')
    expect(sps[0]!.version).toEqual('ver4')
  })

  test(Storage.createSpending, () => {
    const sp1 = {
      id: 'sp1',
      version: 'ver1',
      date: new Date('2025-09-12'),
      sort: 3,
      money: fromRUB(12312_00),
      description: 'что-то',
      createdAt: new Date('2025-09-12T23:22:00Z'),
      updatedAt: new Date('2025-09-12T23:22:00Z'),
    }

    // Не можем создать в несуществующем бюджете
    expect(() => Storage.createSpending(1, sp1)).toThrow('not existing budget')

    Storage.storeBudgetsFromRemote([makeBudget(1)])

    Storage.createSpending(1, sp1)

    const sps = Storage.spendingsByBudgetId(1)

    expect(sps).toEqual([sp1])

    expect(() => Storage.createSpending(1, makeSpending({ id: 'sp1' }))).toThrow(
      'spending already exists',
    )

    {
      const sp0 = makeSpending({ id: 'sp0' })

      Storage.createSpending(1, sp0)

      const sps = Storage.spendingsByBudgetId(1)

      expect(sps).length(2)

      expect(sps[0]).toEqual(sp0)
      expect(sps[1]).toEqual(sp1)
    }
  })

  test(Storage.updateSpending, () => {
    expect(() => Storage.updateSpending(1, makeSpending({ id: 'xxxx' }))).toThrow(
      'not existing budget',
    )

    Storage.storeBudgetsFromRemote([makeBudget(1)])

    expect(() => Storage.updateSpending(1, makeSpending({ id: 'xxxx' }))).toThrow(
      'spending not found',
    )

    const sp: Spending = {
      id: 'wqerdop',
      version: 'ver1',
      date: new Date('2025-09-12'),
      sort: 3,
      money: fromRUB(12312_00),
      description: 'что-то',
      createdAt: new Date('2025-09-12T23:22:00Z'),
      updatedAt: new Date('2025-09-12T23:22:00Z'),
    }

    const sp2: Spending = {
      id: 'wqerdop',
      version: 'ver2',
      date: new Date('2025-09-12'),
      sort: 3,
      money: fromRUB(12312_00),
      description: 'что-то',
      createdAt: new Date('2025-09-12T23:22:00Z'),
      updatedAt: new Date('2025-09-12T23:22:00Z'),
    }

    Storage.createSpending(1, sp)

    expect(() => Storage.updateSpending(1, sp2)).toThrow('invalid parent version')

    sp2.parentVersion = sp.version

    Storage.updateSpending(1, sp2)

    const sps = Storage.spendingsByBudgetId(1)

    expect(sps).toEqual([
      {
        id: 'wqerdop',
        version: 'ver2',
        date: new Date('2025-09-12'),
        sort: 3,
        money: fromRUB(12312_00),
        description: 'что-то',
        createdAt: new Date('2025-09-12T23:22:00Z'),
        updatedAt: new Date('2025-09-12T23:22:00Z'),
      },
    ])

    // TODO: check deleted throw error on update
  })

  test(Storage.deleteSpending, () => {
    expect(() => Storage.deleteSpending(1, makeSpending({ id: 'xxxx' }))).toThrow(
      'not existing budget',
    )

    Storage.storeBudgetsFromRemote([makeBudget(1)])

    expect(() => Storage.deleteSpending(1, makeSpending({ id: 'xxxx' }))).toThrow(
      'spending not found',
    )

    const sp: Spending = {
      id: 'id1',
      version: 'ver1',
      date: new Date('2025-09-12'),
      sort: 3,
      money: fromRUB(12312_00),
      description: 'что-то',
      createdAt: new Date('2025-09-12T23:22:00Z'),
      updatedAt: new Date('2025-09-12T23:22:00Z'),
    }

    Storage.createSpending(1, sp)

    const spDel = makeSpending({
      id: 'id1',
      version: 'ver2',
      updatedAt: new Date('2025-09-12T23:22:00Z'),
    })

    expect(() => Storage.deleteSpending(1, spDel)).toThrow('parent version is invalid')

    spDel.parentVersion = 'ver1'

    Storage.deleteSpending(1, spDel)

    expect(() => Storage.deleteSpending(1, makeSpending({ id: 'id1' }))).toThrow(
      'spending cannot be changed',
    )
    expect(() => Storage.updateSpending(1, makeSpending({ id: 'id1' }))).toThrow(
      'spending cannot be changed',
    )

    expect(Storage.spendingsByBudgetId(1)).toEqual([])
  })

  test('set_spending_version_applied', () => {
    // Метод синхронизационный, поэтому не отправляем ошибок в случае, если в сторе этого значения уже нет
    expect(() => Storage.setStatusApplied(1, 'sp1', 'ver1')).not.toThrow()

    Storage.storeBudgetsFromRemote([makeBudget(1)])

    Storage.createSpending(1, makeSpending({ id: 'sp1', version: 'ver1' }))

    let storeValue = localStorage.getItem(_test.lsSpendingsKey(1)) || ''

    expect(storeValue.includes(VersionStatus.Pending)).toEqual(true)
    expect(storeValue.includes(VersionStatus.Applied)).toEqual(false)

    Storage.setStatusApplied(1, 'sp1', 'ver1')

    storeValue = localStorage.getItem(_test.lsSpendingsKey(1)) || ''

    expect(storeValue.includes(VersionStatus.Applied)).toEqual(true)
  })

  test('revoke_conflict_version', () => {
    expect(Storage.revokeConflictVersion(1, 'sp1', 'ver1')).toEqual([])

    Storage.storeBudgetsFromRemote([makeBudget(1)])

    Storage.createSpending(1, makeSpending({ id: 'sp1', version: 'ver1' }))

    expect(Storage.spendingsByBudgetId(1)).length(1)

    const revoked = Storage.revokeConflictVersion(1, 'sp1', 'ver1')

    expect(Storage.spendingsByBudgetId(1)).length(0)

    expect(revoked).length(1)

    expect(eq({ spendingId: 'sp1', version: 'ver1' }, revoked[0]!)).toBe(true)

    expect(Storage.revokeConflictVersion(1, 'sp1', 'ver1')).toEqual([])
  })
})

function makeBudget(id: number): Budget {
  return {
    id: id,
    alias: '',
    name: '',
    sort: 0,
    money: {
      amount: 0,
      fraction: 0,
      currency: '',
    },
    dateFrom: '',
    dateTo: '',
    params: '',
  }
}

function makeSpending(sp: Partial<Spending> = {}): Spending {
  return {
    id: sp.id ?? '',
    version: sp.version ?? '',
    parentVersion: sp.parentVersion ?? undefined,
    date: sp.date ?? new Date(0),
    sort: sp.sort ?? 0,
    money: sp.money ?? fromRUB(0),
    description: sp.description ?? '',
    createdAt: sp.createdAt ?? new Date(0),
    updatedAt: sp.updatedAt ?? new Date(0),
  }
}

function makeApiSpending(sp: Partial<ApiSpending> = {}): ApiSpending {
  return {
    id: sp.id ?? '',
    date: sp.date ?? '',
    sort: sp.sort ?? 0,
    money: sp.money ?? fromRUB(0),
    description: sp.description ?? '',
    createdAt: sp.createdAt ?? '',
    updatedAt: sp.updatedAt ?? '',
    version: sp.version ?? '',
  }
}

function clearLocalStorageByPrefix(prefix: string) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      localStorage.removeItem(key)
    }
  }
}

function eq<T extends object>(partial: Partial<T>, full: T): boolean {
  return (Object.keys(partial) as Array<keyof T>).every((key) => {
    return full[key] === partial[key]
  })
}
