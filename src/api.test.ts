import { test, describe, beforeEach, afterEach, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Fetcher, _test } from '@/api'
import { Storage, VersionStatus, type Spending, type SpendingVersion } from '@/storage'
import { useStatusStore } from './stores/status'
import { useConflictVersionStore } from './stores/conflictVersions'
import type { Budget, Spending as ApiSpending } from './models/models'
import { fromRUB } from './helpers/money'

describe('fetcher', () => {
  beforeEach(() => {
    clearLocalStorageByPrefix(_test.lsFetcherPrefix)
    setActivePinia(createPinia())
  })

  afterEach(() => {
    // 'fetch' restored back
    vi.unstubAllGlobals()
    vi.useRealTimers()

    useConflictVersionStore().$reset()
  })

  test('fetch_and_store:initial', () => {
    expect(Fetcher.isInitialized()).toBe(false)
    expect(Fetcher.getUpdatedAt()).toBe(0)
  })

  test('fetch_and_store', async () => {
    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => JSON.parse(jsonResponse),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse)),
    )

    vi.useFakeTimers()
    vi.setSystemTime(777)

    await Fetcher.fetchAndStore()

    const status = useStatusStore()
    expect(status.statusGetSpendings).toBe('ok')

    expect(Fetcher.isInitialized()).toBe(true)
    expect(Fetcher.getUpdatedAt()).toBe(777)

    const conflictVersionsStore = useConflictVersionStore()
    expect(conflictVersionsStore.conflictVersions).toEqual([])

    const exp: Budget[] = [
      {
        id: 23,
        alias: 'drinks',
        name: 'напитки',
        description: 'postmorten',
        sort: 1,
        money: fromRUB(8_000),
        dateFrom: '2025-05-01',
        dateTo: '2025-05-31',
        params: { perDay: true },
      },
      {
        id: 25,
        alias: 'food',
        name: 'еда',
        description: 'postmorten',
        sort: 3,
        money: fromRUB(20_000),
        dateFrom: '2025-05-01',
        dateTo: '2025-05-31',
        params: {},
      },
    ]
    expect(Storage.getBudgets()).toEqual(exp)

    expect(Storage.spendingsByBudgetId(1)).toEqual([])

    const expSpB23: Spending[] = [
      {
        id: 'nHSPMxURHX',
        version: 'JZRm7',
        date: new Date('2025-05-01'),
        sort: 101,
        money: fromRUB(85),
        description: 'кофе',
        createdAt: new Date(1759154425085),
        updatedAt: new Date(1759154543304),
      },
    ]

    expect(Storage.spendingsByBudgetId(23)).toEqual(expSpB23)
    expect(Storage.spendingsByBudgetId(25)).length(2)
  })

  test('fetch_and_store:conflict', async () => {
    Storage.storeBudgetsFromRemote([makeBudget(23)])
    Storage.storeSpendingsFromRemote(23, [
      makeApiSpending({
        id: 'nHSPMxURHX',
        version: 'ver_server_1', // первая версия серверная
        date: '2025-05-01',
        description: 'кофе',
        money: { amount: 8500, currency: 'RUB', fraction: 2 },
        createdAt: '2025-09-29T14:00:25.085Z',
        updatedAt: '2025-09-29T14:02:23.304Z',
        sort: 101,
      }),
    ])

    Storage.updateSpending(23, {
      id: 'nHSPMxURHX',
      version: 'pending_2', // версия локальная
      parentVersion: 'ver_server_1',
      date: new Date('2025-05-01'),
      description: 'кофе',
      createdAt: new Date('2025-09-29T14:00:25.085Z'),
      updatedAt: new Date('2025-09-29T15:02:23.304Z'),
      money: fromRUB(90), // изменил цену
      sort: 101,
    })

    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => JSON.parse(jsonResponse),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse)),
    )

    vi.useFakeTimers()
    vi.setSystemTime(777)

    await Fetcher.fetchAndStore()

    const conflictVersionsStore = useConflictVersionStore()

    const expConflicted: SpendingVersion[] = [
      {
        version: 'pending_2',
        // TODO: budgetID
        spendingId: 'nHSPMxURHX',
        date: '2025-05-01T00:00:00.000Z', // TODO: удалить часть с Time
        description: 'кофе',
        status: VersionStatus.Pending, // TODO remove it
        sort: 101,
        money: fromRUB(90),
        updatedAt: '2025-09-29T15:02:23.304Z',
      },
    ]

    expect(conflictVersionsStore.conflictVersions).toEqual(expConflicted)
  })
})

function clearLocalStorageByPrefix(prefix: string) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      localStorage.removeItem(key)
    }
  }
}

const jsonResponse = `
{
  "budgets": [
    {
      "id": 23,
        "alias": "drinks",
        "dateFrom": "2025-05-01",
        "dateTo": "2025-05-31",
        "description": "postmorten",
        "money": {"amount": 800000, "currency": "RUB", "fraction": 2},
        "name": "напитки",
        "params": {"perDay": true},
        "sort": 1
    },
    {
      "id": 25,
        "alias": "food",
        "dateFrom": "2025-05-01",
        "dateTo": "2025-05-31",
        "description": "postmorten",
        "money": {"amount": 2000000, "currency": "RUB", "fraction": 2},
        "name": "еда",
        "params": {},
        "sort": 3
    }
  ],
  "spendings": [
    {
        "budgetId": 23,
        "spendings": [
          {
              "createdAt": "2025-09-29T14:00:25.085Z",
              "date": "2025-05-01",
              "description": "кофе",
              "id": "nHSPMxURHX",
              "money":{ "amount": 8500, "currency": "RUB", "fraction": 2 },
              "sort": 101,
              "updatedAt": "2025-09-29T14:02:23.304Z",
              "version": "JZRm7"
          }
        ]
    },
    {
        "budgetId": 25,
        "spendings": [
        {
            "createdAt": "2025-09-29T14:00:25+00:00Z",
            "date": "2025-05-02",
            "description": "продукты",
            "id": "rLcmfSokY0",
            "money": {"amount": 17900, "currency": "RUB", "fraction": 2 },
            "sort": 102,
            "updatedAt": "1970-01-01T00:00:00.016Z",
            "version": "YX3lO"
        },
        {
            "createdAt": "1970-01-01T00:00:00.016Z",
            "date": "2025-05-02",
            "description": "еда",
            "id": "Rs4dRJOYD2",
            "money": { "amount": 3300, "currency": "RUB", "fraction": 2
            },
            "sort": 103,
            "updatedAt": "1970-01-01T00:00:00.016Z",
            "version": "hIBHc"
        }
        ]
    }
  ]
}
`

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
    params: {},
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
