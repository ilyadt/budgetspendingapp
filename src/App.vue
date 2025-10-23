<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import StatusBar from './components/StatusBar.vue'
import { Facade } from './facade'
import BudgetView from './views/BudgetView.vue'
import CrossBudgetView from './views/CrossBudgetView.vue'
import HomeView from './views/HomeView.vue'

const budgets = Facade.getBudgets()
  .map(b => ({ ...b, sort: b.sort || 1e6 }))
  .sort((a, b) => a.sort - b.sort)
</script>

<template>
  <div class="container">
    <StatusBar />
    <RouterView v-slot="{ route, Component }">
      <template v-if="route.name === 'home'">
        <HomeView :budgets="budgets" />
      </template>
      <template v-else-if="route.name === 'budget'">
        <BudgetView :key="String(route.params.budgetId)" :budget="budgets.find(b => b.id === Number(route.params.budgetId))!"/>
      </template>
      <template v-else-if="route.name === 'cross-budget'">
        <CrossBudgetView :budgets="budgets" />
      </template>
      <template v-else>
        <component :is="Component" />
      </template>
    </RouterView>
  </div>
  <div style="height: 80px"></div>
  <!-- Нижняя навигация -->
  <nav class="navbar navbar-custom fixed-bottom navbar-light bg-light border-top nav-scroll p-0">
    <ul class="nav flex-nowrap">
      <RouterLink :to="{ name: 'home' }" custom v-slot="{ navigate, isActive }">
        <li class="btn-style" style="padding: 0px 5px 0 10px" :class="{ active: isActive }" @click="navigate">
          <a class="nav-link">
            <font-awesome-icon :icon="['fas', 'home']" />
          </a>
        </li>
      </RouterLink>
      <li class="btn-style">
        <RouterLink :to="{ name: 'cross-budget' }" class="nav-link" activeClass="active">
          cross
        </RouterLink>
      </li>
      <li class="btn-style" v-for="budget in budgets" :key="budget.id">
        <RouterLink :to="{ name: 'budget', params: { budgetId: budget.id } }" class="nav-link" activeClass="active">
          {{ budget.alias }}
        </RouterLink>
      </li>
      <li class="nav-item btn-style">
        <RouterLink :to="{ name: 'errors' }" class="nav-link">Errs</RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.navbar-custom {
  height: 70px;
  align-items: start;
}

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
.btn-style {
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

.active {
  background: aqua;
}
</style>
