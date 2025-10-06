/* eslint-disable  @typescript-eslint/no-explicit-any */

import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import createClient from 'openapi-fetch'
import type { paths } from '../schemas'
import type { ApiBudget, ApiSpending, OldSpendingEvent } from '@/models/models'

import { useStatusStore } from '@/stores/status'
import { useSpendingEventsStore } from './spendingEvents'
import { watch } from 'vue'
import * as Sentry from '@sentry/vue'

export const useBudgetSpendingsStore = defineStore('budgetSpendings', () => {
  const status = useStatusStore()
  const events = useSpendingEventsStore().events

  const lastUpdatedAt = useStorage<number>('lastUpdatedAt', 0)
  const budgets = useStorage<ApiBudget[]>('budgets', [])
  const spendings = useStorage<Record<string, Array<ApiSpending>>>('spendings', {})

  const client = createClient<paths>({ baseUrl: import.meta.env.VITE_SERVER_URL })

  // Update state async on startup
  void updateBudgetSpendings()

  // Применяем локальные изменения к стору(серверным данным)
  applySpendingChangeEvents(events)

  // Watch new event added to array / array changed
  watch(events, (newVal) => {
    applySpendingChangeEvents(newVal)
  })

  setInterval(function () {
    void updateBudgetSpendings()
  }, 60 * 1000)

  async function updateBudgetSpendings() {
    try {
      const { data, response } = await client.GET('/budgets/spendings', {
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) {
        throw response.status
      }
      console.log(data)

      status.setGetSpendingStatus('ok')

      budgets.value = data!.budgets

      const resSpendings: Record<string, Array<ApiSpending>> = {}

      data!.spendings.forEach((budgetSpendings) => {
        const budgetId = budgetSpendings.budgetId

        // Init with empty array (for push method to work)
        resSpendings[budgetId] = resSpendings[budgetId] || []

        for (let i = 0; i < budgetSpendings.spendings.length; i++) {
          resSpendings[budgetId].push(budgetSpendings.spendings[i]!)
        }
      })

      spendings.value = resSpendings

      lastUpdatedAt.value = Date.now()
    } catch (error: any) {
      status.setGetSpendingStatus(error.name + ' ' + error.message)
      console.error(error)
      Sentry.captureException(error)
    }
  }

  function applySpendingChangeEvents(events: OldSpendingEvent[]) {
    for (const event of events) {
      applySpendingChangeEvent(event)
    }
  }

  function applySpendingChangeEvent(ev: OldSpendingEvent) {
    // бюджет больше неактуален, удален
    if (!spendings.value[ev.budgetId]) {
      return
    }

    if (ev.type == 'update') {
      for (const [i, sp] of spendings.value[ev.budgetId]!.entries()) {
        if (sp.id == ev.spendingId) {
          spendings.value[ev.budgetId]![i] = applySpendingUpdateEvent(sp, ev)
        }
      }
    }

    if (ev.type == 'create') {
      // Case of PendingEventNotDeleted yet (updated, status=applied)
      let spExists = false
      for (const sp of spendings.value[ev.budgetId]!) {
        if (sp.id == ev.spendingId) {
          spExists = true
        }
      }
      if (spExists) {
        return
      }

      const sp: ApiSpending = {
        id: ev.spendingId,
        date: ev.createData!.date,
        sort: ev.createData!.sort,
        money: ev.createData!.money,
        description: ev.createData!.description,
        createdAt: ev.createData!.createdAt,
        updatedAt: ev.createData!.updatedAt,
        version: ev.newVersion,
        versions: [ev.newVersion],
      }

      spendings.value[ev.budgetId]!.push(sp)
    }

    if (ev.type == 'delete') {
      for (const [i, sp] of spendings.value[ev.budgetId]!.entries()) {
        if (sp.id == ev.spendingId) {
          spendings.value[ev.budgetId]!.splice(i, 1) // delete 1-element from i position
        }
      }
    }
  }

  function applySpendingUpdateEvent(sp: ApiSpending, ev: OldSpendingEvent): ApiSpending {
    const res = Object.assign({}, sp)

    // Применен на беке, но возможно обновление записи уехало далеко за это обновление
    if (sp.version != ev.updateData!.prevVersion && ev.status == 'applied') {
      return res
    }

    if (sp.version != ev.updateData!.prevVersion && ev.status != 'applied') {
      // новое состояние на беке не соответствует изменениям
      // логируем
      // возвращаем неизмененное состояние (пока что)
      // Ожидается, что при отправке запроса на бек будет ошибка несовместимости обновления
      // Возможно тут сразу нужно отправлять такое сообщение в ошибки
      //
      // TODO: при изменении(добавлении события / очистки) происходит полное применение всех событий к текущему состоянию
      // что может вызывать ошибки двойного применения события
      console.error(ev)
      Sentry.captureException(
        'event cannot be applied: ' + JSON.stringify(ev) + '. Spending: ' + JSON.stringify(sp),
      )

      return res
    }

    //  В остальных случаях возможно применить
    res.version = ev.newVersion
    res.money = ev.updateData!.money
    res.description = ev.updateData!.description

    return res
  }

  return { lastUpdatedAt, budgets, spendings, updateBudgetSpendings }
})
