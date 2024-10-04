<script setup>
import DaySpendingTable from '@/components/DaySpendingTable.vue'

const props = defineProps({
  budget: Object
})

let budget = props.budget

const dateStart = new Date(budget.dateFrom);
const dateEnd = new Date(budget.dateTo);
const daysCount = (dateEnd-dateStart) / 1000 / 60 / 60 / 24 + 1

function dateFormat(i) {
  let d = new Date(dateStart.getTime() + (i-1)*24*60*60*1000);
  return d.toISOString().split('T')[0];
}

</script>

<template>
    <!-- Отображение бюджета с тратами -->
  <div>
    <p>
        <b>Бюджет: {{ budget.name }}</b> <br>
        <b>{{ budget.dateFrom }} &mdash; {{ budget.dateTo }}</b>
    </p>
  </div>
  <div v-for="i in daysCount" class="row">
    <p>{{ dateFormat(i) }}</p>
    <DaySpendingTable />
    <p></p>
  </div>
</template>
