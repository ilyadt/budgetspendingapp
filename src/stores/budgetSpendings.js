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
      response.data.spendings.forEach((budgetSpendings) => {
        if (resSpendings[budgetSpendings.budgetId] == undefined) {
          resSpendings[budgetSpendings.budgetId] = {}
        }

        for (let i = 0; i < budgetSpendings.spendings.length; i++) {
          if (resSpendings[budgetSpendings.budgetId][budgetSpendings.spendings[i].date] == undefined) {
            resSpendings[budgetSpendings.budgetId][budgetSpendings.spendings[i].date] = []
          }
          resSpendings[budgetSpendings.budgetId][budgetSpendings.spendings[i].date].push(budgetSpendings.spendings[i])
        }
      })

      spendings.value = resSpendings

      lastUpdatedAt.value = Date.now()
    } catch (error) {
      console.error(error)
    }
  }

  return {lastUpdatedAt, budgets, spendings, updateBudgetSpendings}
})




