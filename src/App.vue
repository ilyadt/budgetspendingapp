<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import { storeToRefs } from 'pinia'

const store = useBudgetSpendingsStore()
const { spendings } = store
const { budgets } = storeToRefs(store)

console.log(budgets)
const spendingsByBudget = spendings[budgets.value[0].id]

console.log(spendingsByBudget)
</script>

<template>
  <div class="container">
    <RouterView :budget="budgets[0]" :spendings="spendingsByBudget" />
  </div>
  <!-- Нижняя навигация -->
  <nav class="navbar border-top fixed-bottom navbar-dark bg-light">
    <RouterLink v-for="budget in budgets" :key="budget.id" to="/">{{ budget.alias }}</RouterLink>
  </nav>
</template>
