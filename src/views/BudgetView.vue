<script setup>
import DaySpendingTable from '@/components/DaySpendingTable.vue'
import { dateFormat, dateFormatFromString, dateISO } from '@/helpers/date'

const props = defineProps({
  budget: Object,
  spendings: Object,
})

let budget = props.budget

const dateStart = new Date(budget.dateFrom);
const dateEnd = new Date(budget.dateTo);
const daysCount = (dateEnd-dateStart) / 1000 / 60 / 60 / 24 + 1

function getDate(i) {
  return new Date(dateStart.getTime() + (i-1)*24*60*60*1000);
}

</script>

<template>
    <!-- Отображение бюджета с тратами -->
  <div>
    <p>
        <b>Бюджет: {{ budget.name }}</b> <br>
        <b>{{ dateFormatFromString(budget.dateFrom) }} &mdash; {{ dateFormatFromString(budget.dateTo) }}</b>
    </p>
  </div>
  <div v-for="i in daysCount" :set="date = getDate(i)" class="row">
    <p style="padding-left: 0; margin-bottom: 0;"><i>{{ dateFormat(date) }}</i></p>
    <DaySpendingTable :daySpendings="props.spendings[dateISO(date)]"/>
  </div>
</template>
