import createClient from 'openapi-fetch'
import type { paths } from './models/oaschema'
import { BudgetSpendingsStore } from '@/stores/budgetSpendings'
import { useStatusStore } from '@/stores/status'
import * as Sentry from '@sentry/vue'
import { useConflictVersionStore } from '@/stores/conflictVersions'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import type { Spending, ApiSpendingEvent, DelSpending, ApiUploadError } from './models/models'

function createApiClient() {
  return createClient<paths>({ baseUrl: import.meta.env.VITE_SERVER_URL })
}

// Получение бюджетов и расходов по ним
export const Fetcher = {
  _lsFetcherPrefix: 'fetcher',
  get _lsFetcherUpdatedAt() {
    return this._lsFetcherPrefix + ':lastUpdatedAt'
  },

  async initAndStart() {
    // Startup fetch data (no-blocking)
    const task = this.fetchAndStore()

    // Blocks on first run
    if (!this.isInitialized()) {
      await task
    }

    // Every 60 seconds
    setInterval(() => this.fetchAndStore(), 60 * 1000)
  },

  async fetchAndStore() {
    const client = createApiClient()
    const status = useStatusStore()
    const conflictVersions = useConflictVersionStore()

    try {
      const { data, response } = await client.GET('/budgets/spendings', {
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      status.setGetSpendingStatus('ok')

      BudgetSpendingsStore.storeBudgetsFromRemote(data!.budgets)

      for (const apiSpsByBudget of data!.spendings) {
        const revoked = BudgetSpendingsStore.storeSpendingsFromRemote(apiSpsByBudget.budgetId, apiSpsByBudget.spendings)

        conflictVersions.add(...revoked)
      }

      this.setUpdatedAt(Date.now())
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))

      status.setGetSpendingStatus(err.name + ' ' + err.message)

      Sentry.captureException(error)
    }
  },

  isInitialized(): boolean {
    return this.getUpdatedAt() !== 0
  },

  getUpdatedAt(): number {
    const val = localStorage.getItem(this._lsFetcherUpdatedAt)
    return val ? Number(val) : 0
  },

  setUpdatedAt(t: number) {
    localStorage.setItem(this._lsFetcherUpdatedAt, String(t))
  },
}

export const Uploader = {
  _lsEventsKey: 'updater:events',
  _events: [] as ApiSpendingEvent[],

  init(): ReturnType<typeof setInterval> {
    this.loadEvents()

    const task = async () => {
      const events = this.getEvents()

      if (events.length == 0) {
        return
      }

      await this.processEvents(events)
    }

    // Initially run
    task()

    const intervalId = setInterval(task, 30_000)

    return intervalId
  },

  createSpending(bid: number, newSp: Spending): Promise<void> {
    const ev: ApiSpendingEvent = {
      eventId: uuidv4(),
      type: 'create',
      newVersion: newSp.version,
      budgetId: bid,
      spendingId: newSp.id,
      createData: {
        date: format(newSp.date, 'yyyy-MM-dd'),
        description: newSp.description,
        money: newSp.money,
        sort: newSp.sort,
        createdAt: newSp.createdAt.toISOString(),
        updatedAt: newSp.updatedAt.toISOString(),
      },
    }

    return this.saveAndProcess(ev)
  },

  updateSpending(bid: number, upd: Spending) {
    const ev: ApiSpendingEvent = {
      eventId: uuidv4(),
      type: 'update',
      newVersion: upd.version,
      budgetId: bid,
      spendingId: upd.id,
      updateData: {
        prevVersion: upd.prevVersion!,
        date: format(upd.date, 'yyyy-MM-dd'),
        sort: upd.sort,
        money: upd.money,
        description: upd.description,
        updatedAt: upd.updatedAt.toISOString(),
      },
    }

    return this.saveAndProcess(ev)
  },

  deleteSpending(bid: number, del: DelSpending) {
    const ev: ApiSpendingEvent = {
      eventId: uuidv4(),
      type: 'delete',
      newVersion: del.version,
      budgetId: bid,
      spendingId: del.id,
      deleteData: {
        prevVersion: del.prevVersion!,
        updatedAt: del.updatedAt.toISOString(),
      },
    }

    return this.saveAndProcess(ev)
  },

  async sendEvents(events: ApiSpendingEvent[]): Promise<{ success: ApiSpendingEvent[]; conflict: ApiSpendingEvent[], errors: ApiUploadError[] }> {
    const client = createApiClient()
    const statusStore = useStatusStore()

    try {
      const { response, data } = await client.POST('/budgets/spendings/bulk', {
        body: {
          updates: events,
        },
        signal: AbortSignal.timeout(10_000),
      })

      if (response.status != 200) {
        throw new Error('status: ' + response.status)
      }

      statusStore.setUpdateSpendingStatus('ok')

      const successIds = data?.success ?? []
      const conflictIds = data?.errors.map(e => e.eventId) ?? []

      return {
        success: events.filter(e => successIds.includes(e.eventId)),
        conflict: events.filter(e => conflictIds.includes(e.eventId)),
        errors: data?.errors ?? [],
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      statusStore.setUpdateSpendingStatus(err.name + ' ' + err.message)
      Sentry.captureException(error)
    }

    return { success: [], conflict: [], errors: [] }
  },

  async saveAndProcess(ev: ApiSpendingEvent) {
   const events = this.addEvent(ev)

    return this.processEvents(events)
  },

  async processEvents(events: ApiSpendingEvent[]) {
    const { success, conflict, errors } = await this.sendEvents(events)

    // Помечаем все события во внешнем Storage
    const storage = BudgetSpendingsStore
    const conflictVersion = useConflictVersionStore()

    for (const ev of success) {
      storage.setStatusApplied(ev.budgetId, ev.spendingId, ev.newVersion)
    }

    for (const ev of conflict) {
      const conflictedVers = storage.revokeConflictVersion(ev.budgetId, ev.spendingId, ev.newVersion)

      for (const c of conflictedVers) {
        c.reason = errors.find(e => e.eventId == ev.eventId)?.error ?? null
        conflictVersion.add(c)
      }
    }

    // Удаляем все success и conflict из внутренних events
    this.deleteEvents([...success, ...conflict])
  },

  loadEvents(): void {
    this._events = JSON.parse(localStorage.getItem(this._lsEventsKey) || '[]')
    useStatusStore().setPendingEvents(this._events.length)
  },

  getEvents(): ApiSpendingEvent[] {
    return this._events
  },

  deleteEvents(del: ApiSpendingEvent[]) {
    const idsToDelete = new Set(del.map(e => e.eventId));
    this._events = this._events.filter(e => !idsToDelete.has(e.eventId));

    localStorage.setItem(this._lsEventsKey, JSON.stringify(this._events))
    useStatusStore().setPendingEvents(this._events.length)
  },

  addEvent(e: ApiSpendingEvent): ApiSpendingEvent[] {
    this._events.push(e)

    localStorage.setItem(this._lsEventsKey, JSON.stringify(this._events))
    useStatusStore().setPendingEvents(this._events.length)

    return this._events
  },
}
