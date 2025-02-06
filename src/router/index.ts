import { createRouter, createWebHistory } from 'vue-router'
import BudgetView from '../views/BudgetView.vue'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import { storeToRefs } from 'pinia'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const store = useBudgetSpendingsStore()
        const { budgets } = storeToRefs(store)

        return { name: 'budget', params: { budgetId: budgets.value[0].id } }
      },
    },
    {
      path: '/budget/:budgetId(\\d+)?',
      name: 'budget',
      component: BudgetView,
    },
  ],
})

export default router
