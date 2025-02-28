<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import StatusBar from './components/StatusBar.vue'

const { budgets } = useBudgetSpendingsStore()

import {ref, watch } from 'vue'

const route = useRoute()
const componentKey = ref(0)
watch(route, () => {
  componentKey.value += 1 // Changing the key forces the component to recreate
})

</script>

<template>
  <StatusBar />
  <div class="container">
    <RouterView :key="componentKey"/>
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
      >{{ budget.alias }}</RouterLink>
    <RouterLink :to="{name:'errors'}">Errs</RouterLink>
  </nav>
</template>
