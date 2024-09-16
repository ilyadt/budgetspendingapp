<script setup>
import DaySpendingTable from '@/components/DaySpendingTable.vue'
</script>

<template>
    <!-- Отображение бюджета с тратами -->
  <div>
    <p>
        <b>Бюджет: На развлечения</b> <br>
        <b>22.08-02.09.24</b>
    </p>
  </div>
  <div class="row">
    <p>13.09.24</p>
    <DaySpendingTable />
    <p></p>
  </div>
  <div class="row">
    <p>14.09.24</p>
    <DaySpendingTable />
    <p></p>
  </div>
</template>
