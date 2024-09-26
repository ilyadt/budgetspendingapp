import { defineStore } from 'pinia'
import axios from 'axios'
import { useStorage } from '@vueuse/core'

export const useBudgetSpendingsStore = defineStore('budgetSpendings', () => {
  const lastUpdatedAt = useStorage('lastUpdatedAt', 0)
  const budgets = useStorage('budgets', [])
  const spendings = useStorage('spendings', {})

  if (lastUpdatedAt.value < (Date.now() - 1 * 60 * 1000)) {
    updateBudgetSpendings()
  }

  setInterval(function() {
    updateBudgetSpendings()
  }, 60 * 1000)

  async function updateBudgetSpendings() {
    try {
      const response = await axios.get('http://localhost:3333/budgets/spendings')
      console.log(response.data)

      budgets.value = response.data.budgets

      let resSpendings= {}
      response.data.spendings.forEach((spending) => {
        resSpendings[spending.budgetId] = spending
      })

      spendings.value = resSpendings

      lastUpdatedAt.value = Date.now()
    } catch (error) {
      console.error(error)
    }
  }

  return {lastUpdatedAt, budgets, spendings, updateBudgetSpendings}
})




