import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useStorage } from '@vueuse/core'

export const useBudgetSpendingsStore = defineStore('budgetSpendings', () => {
  const lastUpdatedAt = ref(useStorage('lastUpdatedAt', 0))
  const budgets = ref(useStorage('budgets', []))
  const spendings = ref(useStorage('spendings', {}))

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
        let budgetId = budgetSpendings.budgetId;

        // Init with empty array (for push method to work)
        resSpendings[budgetId] = resSpendings[budgetId] || [];

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

  return {lastUpdatedAt, budgets, spendings, updateBudgetSpendings}
})




