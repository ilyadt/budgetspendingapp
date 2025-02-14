import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import BudgetView from './views/BudgetView.vue'

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import HomeView from './views/HomeView.vue'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

app.use(
  createRouter({
    // Используется HashHistory, потому что статический сервер не использует url-rewrite-rules
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        name: "home",
        component: HomeView,
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
