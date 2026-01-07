<script setup lang="ts">
import { Facade } from '@/facade'
import { dateFormat, dateISO, dateRange } from '@/helpers/date'
import { moneyToString, minus, moneyFormat } from '@/helpers/money'
import type { Budget } from '@/models/models'
import { computed, ref } from 'vue'
import { SpendingRow, Table } from '@/models/view'
import SpendingTable from '@/components/SpendingTable.vue'

const props = defineProps<{
  budget: Budget
}>()

const budget = props.budget
const spendings = Facade.spendingsByBudgetId(budget.id)

// TODO: redirect if budget not found

const moneyLeft = computed(() => {
  let moneyLeft = budget.money

  for (const sp of spendings) {
    moneyLeft = minus(moneyLeft, sp.money)
  }

  return moneyLeft
})

type SpendingGroups = Record<string, Table>

function makeTables(budgets: Budget[]|Budget, [dateFrom, dateTo]: [Date, Date]): SpendingGroups {
  const tables: Record<string, Table> = {}

  const forOneBudget = !Array.isArray(budgets)

  // init
  for (const date of dateRange(dateFrom, dateTo)) {
    const tbl = new Table(date, [])

    if (forOneBudget) (
      tbl.setBudget(budgets)
    )

    tables[dateISO(date)] = tbl
  }

  // fill
  const budgetsArr: Budget[] = forOneBudget ? [budgets] : budgets
  for (const b of budgetsArr) {
    const spendings = Facade.spendingsByBudgetId(b.id)

    for (const s of spendings) {
      tables[dateISO(s.date)]?.addRow(
        new SpendingRow(
          s.id,
          b.id,
          s.money.currency,
          s.version,
          s.date,
          s.sort,
          moneyFormat(s.money),
          s.description,
          s.createdAt,
          s.updatedAt,
          s.receiptGroupId,
        ),
      )
    }
  }

  // Sort
  for (const tbl of Object.values(tables)) {
    tbl.sort()
  }

  return tables
}

const tbls = ref<SpendingGroups>(makeTables(budget,[budget.dateFrom, budget.dateTo]))

</script>

<template>
  <!-- Отображение бюджета с тратами -->
  <div>
    <p>
      <b>Бюджет #{{ budget!.id }}: {{ budget!.name }}</b> <br />
      <b
        >{{ dateFormat(budget!.dateFrom) }} &mdash;
        {{ dateFormat(budget!.dateTo) }}</b
      ><br />
      <b>{{ moneyToString(moneyLeft) }} {{ moneyLeft.currency }}</b> (из
      <b>{{ moneyToString(budget!.money) }} {{ budget!.money.currency }}</b
      >)
    </p>
    <p v-if="budget?.description" style="white-space: pre">{{ budget!.description }}</p>
  </div>
  <div v-for="(tbl, date) of tbls" :key="date" class="row">
    <SpendingTable :table="tbl" :budgets-map="{}"/>
  </div>
</template>
