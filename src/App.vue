<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import { storeToRefs } from 'pinia'
import type { Budget } from './models/models'
import StatusBar from './components/StatusBar.vue'

const store = useBudgetSpendingsStore()
const { spendings } = store
const { budgets } = storeToRefs(store)

let budget: Budget = {
  id: 0,
  alias: '',
  name: '',
  money: {
    amount: 0,
    fraction: 0,
    currency: '',
  },
  dateFrom: '',
  dateTo: '',
}

if (budgets.value.length > 0) {
  budget = budgets.value[0]
}


const spendingsByBudget = spendings[budget.id] || []
</script>

<template>
  <StatusBar />
  <div class="container">
    <RouterView :budget="budget" :spendings="spendingsByBudget" />
  </div>
  <div style="height: 80px;"></div>
  <!-- Нижняя навигация -->
  <nav class="navbar border-top fixed-bottom navbar-dark bg-light" style="padding-left: 20px; padding-right: 20px;">
    <RouterLink
      v-for="budget in budgets"
      :key="budget.id"
      :to="{ name: 'budget', params: { budgetId: budget.id } }"
      >{{ budget.alias }}</RouterLink
    >
  </nav>
</template>
