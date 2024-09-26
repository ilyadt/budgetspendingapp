<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import { storeToRefs } from 'pinia'

const store = useBudgetSpendingsStore()

const { budgets } = storeToRefs(store)

</script>

<template>
  <RouterView />

  <!-- Нижняя навигация -->
  <div class="container">
    <div class="row">
      <nav>
        <RouterLink v-for="budget in budgets" to="/">{{ budget.alias }}</RouterLink>
      </nav>
    </div>
  </div>
</template>
