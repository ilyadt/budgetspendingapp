<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'

const store = useBudgetSpendingsStore()
const { budgets } = store

</script>

<template>
  <div class="container">
    <RouterView :budget="budgets[0]" />
  </div>
  <!-- Нижняя навигация -->
  <nav class="navbar border-top fixed-bottom navbar-dark bg-light">
    <RouterLink v-for="budget in budgets" to="/">{{ budget.alias }}</RouterLink>
  </nav>

</template>
