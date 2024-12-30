<script setup>
import DaySpendingTable from '@/components/DaySpendingTable.vue'
import { dateFormat, dateFormatFromString, dateISO, dateISOFromString } from '@/helpers/date'
import { moneyToString, minus } from '@/helpers/money'
import { toRaw } from 'vue'

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

let moneyLeft = budget.money;

let spendingsByDate = {};

for (const sp of toRaw(props.spendings)) {
  moneyLeft = minus(moneyLeft, sp.money);

  if (spendingsByDate[dateISOFromString(sp.date)] == undefined) {
    spendingsByDate[dateISOFromString(sp.date)] = []
  }

  spendingsByDate[dateISOFromString(sp.date)].push(sp)
}

</script>

<template>
    <!-- Отображение бюджета с тратами -->
  <div>
    <p>
        <b>Бюджет: {{ budget.name }}</b> <br>
        <b>{{ dateFormatFromString(props.budget.dateFrom) }} &mdash; {{ dateFormatFromString(props.budget.dateTo) }}</b><br>
        <b>{{ moneyToString(moneyLeft) }} {{ moneyLeft.currency }}</b> (из <b>{{ moneyToString(budget.money) }} {{ budget.money.currency }}</b>)
    </p>
  </div>
  <div v-for="i in daysCount" :set="date = getDate(i)" class="row">
    <p style="padding-left: 0; margin-bottom: 0;"><i>{{ dateFormat(date) }}</i></p>
    <DaySpendingTable :daySpendings="spendingsByDate[dateISO(date)]"/>
  </div>
</template>
