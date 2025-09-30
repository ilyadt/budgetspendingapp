import createClient from 'openapi-fetch'
import type { paths } from './schemas'
import { Storage } from '@/storage'
import { useStatusStore } from '@/stores/status'
import * as Sentry from '@sentry/vue'
import { useConflictVersionStore } from '@/stores/conflictVersions'

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
    setInterval(this.fetchAndStore, 60 * 1000)
  },

  async fetchAndStore() {
    const client = createClient<paths>({ baseUrl: import.meta.env.VITE_SERVER_URL })
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

      Storage.storeBudgetsFromRemote(data!.budgets)

      for (const apiSpsByBudget of data!.spendings) {
        const revoked = Storage.storeSpendingsFromRemote(
          apiSpsByBudget.budgetId,
          apiSpsByBudget.spendings,
        )

        conflictVersions.add(...revoked)
      }

      this.setUpdatedAt(Date.now())
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))

      status.setGetSpendingStatus(err.name + ' ' + err.message)

      console.error(error)

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
