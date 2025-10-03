import { test, describe, beforeEach, afterEach, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { Fetcher, Uploader } from '@/api'
import { Storage, VersionStatus, type SpendingVersion } from '@/storage'
import { useStatusStore } from './stores/status'
import { useConflictVersionStore } from './stores/conflictVersions'
import type {
  ApiBudget,
  ApiSpending,
  ApiSpendingEvent,
  ApiUpdateSpendingsErrorsResponse,
  Spending,
} from './models/models'
import { fromRUB } from './helpers/money'
import * as uuid from 'uuid'

describe('fetcher', () => {
  beforeEach(() => {
    clearLocalStorageByPrefix(Fetcher._lsFetcherPrefix)
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

    const exp: ApiBudget[] = [
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

describe('updater', () => {
  beforeEach(() => {
    clearLocalStorageByPrefix(Uploader._lsEventsKey)
    setActivePinia(createPinia())
  })

  afterEach(() => {
    // 'fetch' restored back
    vi.unstubAllGlobals()
    vi.useRealTimers()

    useConflictVersionStore().$reset()
  })

  test('uploader:create', async () => {
    vi.mock('uuid', () => ({
      v4: vi.fn(() => 'mocked-uuid'),
    }))

    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async (): Promise<ApiUpdateSpendingsErrorsResponse> => ({
        success: ['mocked-uuid'],
        errors: [],
      }),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse)),
    )

    const promise = Uploader.createSpending(1, {
      id: 'sp1',
      version: 'ver1',
      date: new Date('2025-10-03'),
      sort: 100,
      money: fromRUB(1000),
      description: 'любовь',
      createdAt: new Date('2025-10-03T09:54:44.020Z'),
      updatedAt: new Date('2025-10-03T10:54:44.020Z'),
    })

    const events = Uploader.getEvents()
    expect(events).length(1)

    const ev = events[0]

    const exp: ApiSpendingEvent = {
      eventId: 'mocked-uuid',
      type: 'create',
      budgetId: 1,
      spendingId: 'sp1',
      newVersion: 'ver1',
      createData: {
        date: '2025-10-03',
        sort: 100,
        money: { amount: 1000_00, fraction: 2, currency: 'RUB' },
        description: 'любовь',
        createdAt: '2025-10-03T09:54:44.020Z',
        updatedAt: '2025-10-03T10:54:44.020Z',
      },
    }

    expect(ev).toEqual(exp)

    await promise

    // status
    const status = useStatusStore()
    expect(status.statusUpdateSpendings).toEqual('ok')

    // удаляются из внутреннего стора
    expect(Uploader.getEvents()).length(0)
  })

  test('uploader:update', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spyUuid = vi.spyOn(uuid, 'v4' as any).mockReturnValue('event_id_uuid_v4')
    const revokedVersions = [
      {
        spendingId: 'sp1',
        version: 'ver2',
        status: VersionStatus.Pending,
        date: '2025-10-03',
        description: 'dyson',
        money: fromRUB(20_000),
        sort: 777,
        updatedAt: '2025-10-03T12:22:22.023Z',
      },
      {
        // третья версия была сверху, поэтому она тоже становится revoked
        spendingId: 'sp1',
        version: 'ver3',
        status: VersionStatus.Pending,
        date: '2025-10-03',
        description: 'dyson sypersonic',
        money: fromRUB(20_000),
        sort: 777,
        updatedAt: '2025-10-03T12:31:22.023Z',
      },
    ]
    const spyRevokeConflictVersion = vi
      .spyOn(Storage, 'revokeConflictVersion')
      .mockReturnValue(revokedVersions)

    vi.stubGlobal(
      'fetch',
      vi.fn(() => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async (): Promise<ApiUpdateSpendingsErrorsResponse> => ({
          success: [],
          errors: [{ eventId: 'event_id_uuid_v4', number: 0, error: '' }],
        }),
      })),
    )

    const conflictVersions = useConflictVersionStore()

    conflictVersions.$reset()

    ////////////////

    const promise = Uploader.updateSpending(22, {
      id: 'sp1',
      version: 'ver2',
      parentVersion: 'ver1',
      date: new Date('2025-10-03'),
      sort: 777,
      money: fromRUB(20_000),
      description: 'dyson',
      createdAt: new Date('2025-10-02T12:22:22.023Z'),
      updatedAt: new Date('2025-10-03T12:22:22.023Z'),
    })

    const expEvents: ApiSpendingEvent[] = [
      {
        eventId: 'event_id_uuid_v4',
        type: 'update',
        budgetId: 22,
        spendingId: 'sp1',
        newVersion: 'ver2',
        updateData: {
          prevVersion: 'ver1',
          date: '2025-10-03',
          sort: 777,
          money: { amount: 20_000_00, fraction: 2, currency: 'RUB' },
          description: 'dyson',
          updatedAt: '2025-10-03T12:22:22.023Z',
        },
      },
    ]

    expect(Uploader.getEvents()).toEqual(expEvents)

    await promise

    // Все события удалились
    expect(Uploader.getEvents()).toEqual([])

    // Из storage забрались конфликтные версии
    expect(spyRevokeConflictVersion).toHaveBeenCalledTimes(1)
    expect(spyRevokeConflictVersion).toHaveBeenCalledWith(22, 'sp1', 'ver2')

    // Отправились в ConflictVersions
    expect(conflictVersions.conflictVersions).toEqual(revokedVersions)

    ////////////////

    vi.unstubAllGlobals()
    spyRevokeConflictVersion.mockRestore()
    spyUuid.mockRestore()
  })

  test('uploader:delete', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spyUuid = vi.spyOn(uuid, 'v4' as any).mockReturnValue('event_id_uuid_v4')
    const spyStorageNotifyApplied = vi.spyOn(Storage, 'setStatusApplied')

    vi.stubGlobal(
      'fetch',
      vi.fn(() => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async (): Promise<ApiUpdateSpendingsErrorsResponse> => ({
          success: ['event_id_uuid_v4'],
          errors: [],
        }),
      })),
    )

    ////////////////

    const promise = Uploader.deleteSpending(22, {
      id: 'sp1',
      version: 'ver2',
      parentVersion: 'ver1',
      date: new Date('2025-10-03'), // TODO: remove
      sort: 777, // TODO: remove
      money: fromRUB(20_000), // TODO: remove
      description: 'dyson', // TODO: remove
      createdAt: new Date('2025-10-02T12:22:22.023Z'), // TODO: remove
      updatedAt: new Date('2025-10-03T12:22:22.023Z'),
    })

    const expEvents: ApiSpendingEvent[] = [
      {
        eventId: 'event_id_uuid_v4',
        type: 'delete',
        budgetId: 22,
        spendingId: 'sp1',
        newVersion: 'ver2',
        deleteData: {
          prevVersion: 'ver1',
          updatedAt: '2025-10-03T12:22:22.023Z',
        },
      },
    ]

    expect(Uploader.getEvents()).toEqual(expEvents)

    await promise

    // Все события удалились
    expect(Uploader.getEvents()).toEqual([])

    // В storage пришло уведомление о примененной версии
    expect(spyStorageNotifyApplied).toHaveBeenCalledTimes(1)
    expect(spyStorageNotifyApplied).toHaveBeenCalledWith(22, 'sp1', 'ver2')

    ////////////////

    vi.unstubAllGlobals()
    spyStorageNotifyApplied.mockRestore()
    spyUuid.mockRestore()
  })

  test('uploader:loadEvents', async () => {
    {
      const t = Uploader.init()
      clearInterval(t)
      expect(Uploader.getEvents()).length(0)
    }

    {
      Uploader.saveEvents([
        {
          eventId: 'ev1',
          type: 'create',
          budgetId: 0,
          spendingId: '',
          newVersion: '',
        },
        {
          eventId: 'ev2',
          type: 'create',
          budgetId: 0,
          spendingId: '',
          newVersion: '',
        },
      ])

      {
        // сразу после save они доступны
        const events = Uploader.getEvents()
        expect(events).length(2)
        expect(events[0]!.eventId).toEqual('ev1')
        expect(events[1]!.eventId).toEqual('ev2')
      }

      Uploader._events = []

      const t = Uploader.init()
      clearInterval(t)

      {
        // после load (которая в init) загружаются все события в память из стора
        const events = Uploader.getEvents()
        expect(events).length(2)
        expect(events[0]!.eventId).toEqual('ev1')
        expect(events[1]!.eventId).toEqual('ev2')
      }
    }
  })

  test('uploader:sendEvents', async () => {
    const ev1 = makeApiSpendingEvent({ eventId: 'ev1' })
    const ev2 = makeApiSpendingEvent({ eventId: 'ev2' })
    const ev3 = makeApiSpendingEvent({ eventId: 'ev3' })

    const events = [ev1, ev2, ev3]

    const mockResponse: Partial<Response> = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async (): Promise<ApiUpdateSpendingsErrorsResponse> => ({
        success: ['ev1', 'ev2'],
        errors: [{ eventId: 'ev3', number: 0, error: '' }],
      }),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => mockResponse),
    )

    const status = useStatusStore()

    status.setUpdateSpendingStatus('')
    expect(status.statusUpdateSpendings).toEqual('')

    const { success, conflict } = await Uploader.sendEvents(events)

    expect(status.statusUpdateSpendings).toEqual('ok')

    expect(success).toEqual([ev1, ev2])
    expect(conflict).toEqual([ev3])
  })

  test('uploader:sendEvents:statusNot200', async () => {
    const mockResponse: Partial<Response> = {
      ok: true,
      status: 400,
      headers: new Headers(),
      json: async () => ({}),
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(() => mockResponse),
    )

    const status = useStatusStore()
    status.setUpdateSpendingStatus('')

    const { success, conflict } = await Uploader.sendEvents([])

    expect(status.statusUpdateSpendings).toEqual('Error status: 400')

    expect(success).toEqual([])
    expect(conflict).toEqual([])
  })

  test('uploader:sendEvents:fetchError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('timeout'))),
    )

    const status = useStatusStore()
    status.setUpdateSpendingStatus('')

    const { success, conflict } = await Uploader.sendEvents([])

    expect(status.statusUpdateSpendings).toEqual('Error timeout')

    expect(success).toEqual([])
    expect(conflict).toEqual([])
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

// type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

function makeApiSpendingEvent(e: Partial<ApiSpendingEvent>): ApiSpendingEvent {
  return {
    eventId: e.eventId ?? '',
    type: e.type ?? 'create',
    budgetId: e.budgetId ?? 0,
    spendingId: e.spendingId ?? '',
    newVersion: e.newVersion ?? '',
    createData: e.createData ?? undefined,
    updateData: e.updateData ?? undefined,
    deleteData: e.deleteData ?? undefined,
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

function makeBudget(id: number): ApiBudget {
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
