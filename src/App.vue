<script setup>
import { RouterLink, RouterView } from 'vue-router'
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
