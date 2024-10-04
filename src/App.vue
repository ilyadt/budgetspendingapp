<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import { storeToRefs } from 'pinia'

const store = useBudgetSpendingsStore()

const { budgets } = storeToRefs(store)

</script>

<template>
  <div class="container">
    <RouterView />
  </div>
  <!-- Нижняя навигация -->
  <nav class="navbar border-top fixed-bottom navbar-dark">
    <RouterLink v-for="budget in budgets" to="/">{{ budget.alias }}</RouterLink>
  </nav>

</template>
