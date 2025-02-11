import { createApp } from 'vue'
import { createPinia, storeToRefs } from 'pinia'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useBudgetSpendingsStore } from './stores/budgetSpendings'
import BudgetView from './views/BudgetView.vue'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

app.use(
  createRouter({
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
  }),
)

app.mount('#app')
