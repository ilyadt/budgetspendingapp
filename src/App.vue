<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ApiApi, ApiClient } from './api/src/index.js';

let client = new ApiClient('http://localhost:3333')
let api = new ApiApi(client)

api.getBudgetsWithSpendings()

</script>

<template>
  <RouterView />

  <!-- Нижняя навигация -->
  <div class="container">
    <div class="row">
      <nav>
        <RouterLink to="/">Б1-кофе</RouterLink>
        <RouterLink to="/">Б2-кофе</RouterLink>
        <RouterLink to="/">Б3-кофе</RouterLink>
        <RouterLink to="/errors">Errors</RouterLink>
      </nav>
    </div>
  </div>
</template>
