<script setup lang="ts">
import DaySpendingTable from '../components/DaySpendingTable.vue'
import { dateFormat, dateFormatFromString, dateISO, dateISOFromString } from '@/helpers/date'
import { moneyToString, minus } from '@/helpers/money'
import type { Spending } from '@/models/models'
import { toRaw, computed } from 'vue'

const props = defineProps({
  budget: { type: Object, required: true },
  spendings: { type: Array<Spending>, required: true },
})

const daysCount = computed(() => {
  return (
    (new Date(props.budget.dateTo).getMilliseconds() -
      new Date(props.budget.dateFrom).getMilliseconds()) /
      1000 /
      60 /
      60 /
      24 +
    1
  )
})

function getDate(i: number): Date {
  return new Date(new Date(props.budget.dateFrom).getTime() + (i - 1) * 24 * 60 * 60 * 1000)
}

let moneyLeft = props.budget.money

const spendingsByDate: Record<string, Array<Spending>> = {}

for (const sp of toRaw(props.spendings)) {
  moneyLeft = minus(moneyLeft, sp.money)

  if (spendingsByDate[dateISOFromString(sp.date)] == undefined) {
    spendingsByDate[dateISOFromString(sp.date)] = []
  }

  spendingsByDate[dateISOFromString(sp.date)].push(sp)
}

const budgetComp = computed(() => {
  return props.budget
})
</script>

<template>
  <!-- Отображение бюджета с тратами -->
  <div>
    <p>
      <b>Бюджет: {{ budget.name }}</b> <br />
      <b
        >{{ dateFormatFromString(budgetComp.dateFrom) }} &mdash;
        {{ dateFormatFromString(budgetComp.dateTo) }}</b
      ><br />
      <b>{{ moneyToString(moneyLeft) }} {{ moneyLeft.currency }}</b> (из
      <b>{{ moneyToString(budgetComp.money) }} {{ budgetComp.money.currency }}</b
      >)
    </p>
  </div>
  <div v-for="i in daysCount" :key="i" class="row">
    <p style="padding-left: 0; margin-bottom: 0">
      <i>{{ dateFormat(getDate(i)) }}</i>
    </p>
    <DaySpendingTable :daySpendings="spendingsByDate[dateISO(getDate(i))]" />
  </div>
</template>
