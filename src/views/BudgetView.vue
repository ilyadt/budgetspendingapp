<script setup lang="ts">
import DaySpendingTable from '../components/DaySpendingTable.vue'
import { dateFormatFromString, dateISO, dateISOFromString } from '@/helpers/date'
import { moneyToString, minus } from '@/helpers/money'
import type { Spending } from '@/models/models'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import { computed } from 'vue'

const props = defineProps({
  budgetId: { type: String, required: true },
})

const { budgets, spendings } = useBudgetSpendingsStore()

const budget = computed(() => {
  return budgets.filter((b) => String(b.id) == props.budgetId)[0]
})

const daysCount = computed(() => {
  const fromMs = new Date(budget.value.dateFrom)
  const toMs = new Date(budget.value.dateTo)

  return (toMs.getTime() - fromMs.getTime()) / 1000 / 60 / 60 / 24 + 1
})

function getDate(i: number): Date {
  return new Date(new Date(budget.value.dateFrom).getTime() + (i - 1) * 24 * 60 * 60 * 1000)
}

const moneyLeft = computed(() => {
  let moneyLeft = budget.value.money

  for (const sp of spendings[budget.value.id] || []) {
    moneyLeft = minus(moneyLeft, sp.money)
  }

  return moneyLeft
})

const spendingsByDate = computed(() => {
  const res: Record<string, Array<Spending>> = {}

  for (const sp of spendings[budget.value.id] || []) {
    if (res[dateISOFromString(sp.date)] == undefined) {
      res[dateISOFromString(sp.date)] = []
    }

    res[dateISOFromString(sp.date)].push(sp)
  }

  return res
})
</script>

<template>
  <!-- Отображение бюджета с тратами -->
  <div>
    <p>
      <b>Бюджет #{{ budget.id }}: {{ budget.name }}</b> <br />
      <b
        >{{ dateFormatFromString(budget.dateFrom) }} &mdash;
        {{ dateFormatFromString(budget.dateTo) }}</b
      ><br />
      <b>{{ moneyToString(moneyLeft) }} {{ moneyLeft.currency }}</b> (из
      <b>{{ moneyToString(budget.money) }} {{ budget.money.currency }}</b
      >)
    </p>
  </div>
  <div v-for="i in daysCount" :key="i" class="row">
    <DaySpendingTable
      :budget="budget"
      :date="getDate(i)"
      :daySpendings="spendingsByDate[dateISO(getDate(i))] || []"
    />
  </div>
</template>
