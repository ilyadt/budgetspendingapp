<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import StatusBar from './components/StatusBar.vue'

const { budgets } = useBudgetSpendingsStore()

import { ref, watch } from 'vue'

const route = useRoute()
const componentKey = ref(0)
watch(route, () => {
  componentKey.value += 1 // Changing the key forces the component to recreate
})
</script>

<template>
  <StatusBar />
  <div class="container">
    <RouterView :key="componentKey" />
  </div>
  <div style="height: 80px"></div>
  <!-- Нижняя навигация -->
  <nav class="navbar fixed-bottom navbar-light bg-light border-top nav-scroll pe-0">
    <ul class="nav flex-nowrap">
      <li class="nav-item" v-for="budget in budgets" :key="budget.id">
        <RouterLink
          :to="{ name: 'budget', params: { budgetId: budget.id } }"
          class="nav-link btn-style"
        >
          {{ budget.alias }}
        </RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink :to="{ name: 'errors' }" class="nav-link btn-style">Errs</RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style>
/* Fixed width items */
.nav-item {
  flex: 0 0 50px; /* Don't grow, don't shrink, fixed base width */
}

.nav-link {
  display: flex;
  /* justify-content: center; */
  align-items: center;
  height: 40px; /* Fixed height */
  text-align: center;
  padding: 8px 4px !important;
}

/* Scroll container */
.nav-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Hide scrollbar */
.nav-scroll::-webkit-scrollbar {
  display: none;
}

/* Custom button styling */
.nav-link.btn-style {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  /* border-radius: 8px; */
  /* margin: 0 0px; */
  /* padding: 12px 20px; */
  color: #212529;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link.btn-style.active {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
