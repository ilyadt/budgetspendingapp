import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import BudgetView from './views/BudgetView.vue'
import ErrorsView from './views/ErrorsView.vue'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import HomeView from './views/HomeView.vue'

import * as Sentry from "@sentry/vue";

// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSync, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
library.add(faSync, faCheck, faXmark)

const app = createApp(App)

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
});

// Register FontAwesomeIcon component
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())

app.use(
  createRouter({
    // Используется HashHistory, потому что статический сервер не использует url-rewrite-rules
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomeView,
      },
      {
        path: '/budget/:budgetId(\\d+)?',
        name: 'budget',
        component: BudgetView,
      },
      {
        path: '/errors',
        name: 'errors',
        component: ErrorsView,
      },
    ],
  }),
)

app.mount('#app')
