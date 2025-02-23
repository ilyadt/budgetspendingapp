import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import createClient from 'openapi-fetch'
import type { paths } from '../schemas'
import type {
  Budget,
  Spending,
  SpendingCreateEvent,
  SpendingDeleteEvent,
  SpendingUpdateEvent,
} from '@/models/models'

import { useStatusStore } from '@/stores/status'
import { getEventsUploaderInstance } from '@/services/eventsUploader'

export const useBudgetSpendingsStore = defineStore('budgetSpendings', () => {
  const status = useStatusStore()
  const eventsUploader = getEventsUploaderInstance()

  const lastUpdatedAt = useStorage<number>('lastUpdatedAt', 0)
  const budgets = useStorage<Budget[]>('budgets', [])
  const spendings = useStorage<Record<string, Array<Spending>>>('spendings', {})

  const client = createClient<paths>({ baseUrl: 'https://budgetd.mdm' })

  // Если не было первой загрузки, то ждем окончания первой загрузки данных
  // if (lastUpdatedAt.value == 0) {
  //   await updateBudgetSpendings()
  // }

  // Применяем локальные изменения к стору(серверным данным)
  applySpendingChangeEvents()

  if (lastUpdatedAt.value < Date.now() - 1 * 60 * 1000) {
    updateBudgetSpendings()
  }

  setInterval(function () {
    updateBudgetSpendings()
  }, 60 * 1000)

  async function updateBudgetSpendings() {
    try {
      const { data, error } = await client.GET('/budgets/spendings')
      console.log(data)

      if (error) {
        throw error
      }

      status.setGetSpendingStatus('ok')

      budgets.value = data.budgets

      const resSpendings: Record<string, Array<Spending>> = {}

      data.spendings.forEach((budgetSpendings) => {
        const budgetId = budgetSpendings.budgetId

        // Init with empty array (for push method to work)
        resSpendings[budgetId] = resSpendings[budgetId] || []

        for (let i = 0; i < budgetSpendings.spendings.length; i++) {
          resSpendings[budgetId].push(budgetSpendings.spendings[i])
        }
      })

      spendings.value = resSpendings

      lastUpdatedAt.value = Date.now()
    } catch (error: unknown) {
      if (error instanceof Error) {
        status.setGetSpendingStatus(error.message)
      }
      console.error(error)
    }
  }

  function applySpendingChangeEvents() {
    const pendingEvents = eventsUploader.getAllEvents()

    for (const pendingEvent of pendingEvents) {
      if (pendingEvent.type == 'update') {
        const ev = pendingEvent as SpendingUpdateEvent

        for (const [i, sp] of spendings.value[ev.budgetId].entries()) {
          if (sp.id == ev.spendingId) {
            spendings.value[ev.budgetId][i] = applySpendingUpdateEvent(sp, ev)
          }
        }
      }

      if (pendingEvent.type == 'create') {
        const ev = pendingEvent as SpendingCreateEvent

        // Case of PendingEventNotDeleted yet (updated, status=applied)
        let spExists = false
        for (const sp of spendings.value[ev.budgetId]) {
          if (sp.id == ev.spendingId) {
            spExists = true
          }
        }
        if (spExists) {
          continue
        }

        const sp: Spending = {
          id: ev.spendingId,
          date: ev.date,
          sort: ev.sort,
          money: ev.money,
          description: ev.description,
          createdAt: ev.createdAt,
          updatedAt: ev.updatedAt,
          version: ev.newVersion,
        }

        spendings.value[ev.budgetId].push(sp)
      }

      if (pendingEvent.type == 'delete') {
        const ev = pendingEvent as SpendingDeleteEvent

        for (const [i, sp] of spendings.value[ev.budgetId].entries()) {
          if (sp.id == ev.spendingId) {
            spendings.value[ev.budgetId].splice(i, 1) // delete 1-element from i position
          }
        }
      }
    }
  }

  function applySpendingUpdateEvent(sp: Spending, ev: SpendingUpdateEvent): Spending {
    const res = Object.assign({}, sp)

    // Применен на беке, но возможно обновление записи уехало далеко за это обновление
    if (sp.version != ev.prevVersion && ev.status == 'applied') {
      return res
    }

    if (sp.version != ev.prevVersion && ev.status != 'applied') {
      // новое состояние на беке не соответствует изменениям
      // логируем
      // возвращаем неизмененное состояние (пока что)
      // Ожидается, что при отправке запроса на бек будет ошибка несовместимости обновления
      // Возможно тут сразу нужно отправлять такое сообщение в ошибки
      console.error(ev)

      return res
    }

    //  В остальных случаях возможно применить
    res.version = ev.newVersion
    res.money = ev.money
    res.description = ev.description

    return res
  }

  return { lastUpdatedAt, budgets, spendings, updateBudgetSpendings }
})
