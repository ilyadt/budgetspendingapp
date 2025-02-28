<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import StatusBar from './components/StatusBar.vue'

const { budgets } = useBudgetSpendingsStore()

import { computed, ref, watch } from 'vue'

const route = useRoute()

const budgetId = computed(() => {
  return route.params.budgetId
})

const componentKey = ref(0)

watch(budgetId, () => {
  componentKey.value += 1 // Changing the key forces the component to recreate
})
</script>

<template>
  <StatusBar />
  <div class="container">
    <RouterView :key="componentKey" :budgetId="budgetId" />
  </div>
  <div style="height: 80px"></div>
  <!-- Нижняя навигация -->
  <nav
    class="navbar border-top fixed-bottom navbar-dark bg-light"
    style="padding-left: 25px; padding-right: 25px"
  >
    <RouterLink
      v-for="budget in budgets"
      :key="budget.id"
      :to="{ name: 'budget', params: { budgetId: budget.id } }"
      >{{ budget.alias }}</RouterLink
    >
  </nav>
</template>
