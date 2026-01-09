import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import BudgetView from './views/BudgetView.vue'
import CrossBudgetView from './views/CrossBudgetView.vue'
import ErrorsView from './views/ErrorsView.vue'
import HomeView from './views/HomeView.vue'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { Fetcher, Uploader } from './api'

import 'bootstrap/dist/css/bootstrap.min.css'

import * as Sentry from '@sentry/vue'

// Font Awesome
import { library, type IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faSync, faCheck, faXmark, faHome, faReceipt } from '@fortawesome/free-solid-svg-icons'

const faGripDotsVertical: IconDefinition = {
    prefix: 'fas',
    iconName: 'grip-dots-vertical',
    icon: [
      320,
      512,
      [],
      "e411",
      "M96 32H32C14.33 32 0 46.33 0 64v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zM288 32h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32z",
    ]
};

library.add(faSync, faCheck, faXmark, faHome, faReceipt, faGripDotsVertical)

const app = createApp(App)

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
})

// Register FontAwesomeIcon component
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
app.component('font-awesome-icon', FontAwesomeIcon)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)

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
      {
        path: '/cross-budget',
        name: 'cross-budget',
        component: CrossBudgetView,
      },
    ],
  }),
)

await Fetcher.initAndStart()
Uploader.init()

app.mount('#app')
