<script setup lang="ts">
import DaySpendingTable from '../components/DaySpendingTable.vue'
import { dateFormatFromString, dateISO, dateISOFromString } from '@/helpers/date'
import { moneyToString, minus } from '@/helpers/money'
import type { Spending } from '@/models/models'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const budgetId = route.params.budgetId

const { budgets, spendings } = useBudgetSpendingsStore()

const budg = budgets.find((b) => String(b.id) == budgetId)

// TODO: redirect if budget not found

const budget = computed(() => {
  return budg
})

const daysCount = computed(() => {
  const fromMs = new Date(budget.value!.dateFrom)
  const toMs = new Date(budget.value!.dateTo)

  return (toMs.getTime() - fromMs.getTime()) / 1000 / 60 / 60 / 24 + 1
})

function getDate(i: number): Date {
  return new Date(new Date(budget.value!.dateFrom).getTime() + (i - 1) * 24 * 60 * 60 * 1000)
}

const moneyLeft = computed(() => {
  let moneyLeft = budget.value!.money

  for (const sp of spendings[budget.value!.id] || []) {
    moneyLeft = minus(moneyLeft, sp.money)
  }

  return moneyLeft
})

const spendingsByDate = computed(() => {
  const res: Record<string, Array<Spending>> = {}

  for (const sp of spendings[budget.value!.id] || []) {
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
      <b>Бюджет #{{ budget!.id }}: {{ budget!.name }}</b> <br />
      <b
        >{{ dateFormatFromString(budget!.dateFrom) }} &mdash;
        {{ dateFormatFromString(budget!.dateTo) }}</b
      ><br />
      <b>{{ moneyToString(moneyLeft) }} {{ moneyLeft.currency }}</b> (из
      <b>{{ moneyToString(budget!.money) }} {{ budget!.money.currency }}</b
      >)
    </p>
    <p v-if="budget?.description" style="white-space: pre;"> {{ budget!.description }}</p>
  </div>
  <div v-for="i in daysCount" :key="i" class="row">
    <DaySpendingTable
      :budget="budget!"
      :date="getDate(i)"
      :daySpendings="spendingsByDate[dateISO(getDate(i))] || []"
    />
  </div>
</template>
