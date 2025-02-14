import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import createClient from 'openapi-fetch'
import type { paths } from '../schemas'
import type { Budget, Spending } from '@/models/models'

export const useBudgetSpendingsStore = defineStore('budgetSpendings', () => {
  const lastUpdatedAt = useStorage<number>('lastUpdatedAt', 0)
  const budgets = useStorage<Budget[]>('budgets', [])
  const spendings = useStorage<Record<string, Array<Spending>>>('spendings', {})

  const client = createClient<paths>({ baseUrl: 'https://budgetd.mdm' })

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
    } catch (error) {
      console.error(error)
    }
  }

  return { lastUpdatedAt, budgets, spendings, updateBudgetSpendings }
})
