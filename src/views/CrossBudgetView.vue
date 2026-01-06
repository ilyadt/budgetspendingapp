<script setup lang="ts">
import SpendingTable from '@/components/SpendingTable.vue'
import { Facade } from '@/facade'
import { dateFormat, dateISO, dateRange, DateCheck, dayName } from '@/helpers/date'
import { from, moneyFormat } from '@/helpers/money'
import { type Budget, type BudgetWithLeft } from '@/models/models'
import { SpendingRow, Table } from '@/models/view'
import { computed, nextTick, onMounted, ref } from 'vue'
const { isToday, isFuture } = DateCheck(new Date())

const props = defineProps<{
  budgets: Budget[]
}>()

const budgets = props.budgets

const { dateFrom, dateTo } = budgets.reduce(
  (acc, { dateFrom: df, dateTo: dt }) => {
    return {
      dateFrom: df < acc.dateFrom ? df : acc.dateFrom,
      dateTo: dt > acc.dateTo ? dt : acc.dateTo,
    }
  },
  { dateFrom: new Date(8640000000000000), dateTo: new Date(-8640000000000000) },
)

type SpendingGroups = Record<string, Table>

function makeTables(bids: number[], [dateFrom, dateTo]: [Date, Date]): SpendingGroups {
  const tables: Record<string, Table> = {}

  // init
  for (const date of dateRange(dateFrom, dateTo)) {
    tables[dateISO(date)] = new Table(date, [])
  }

  // fill
  for (const bid of bids) {
    const spendings = Facade.spendingsByBudgetId(bid)

    for (const s of spendings) {
      tables[dateISO(s.date)]?.addRow(
        new SpendingRow(
          s.id,
          bid,
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

const tables = ref(makeTables(budgets.map(b => b.id), [dateFrom, dateTo]))

const budgetMap = computed<Record<number, BudgetWithLeft>>(() => {
  const spentByBid: Record<number, number> = {}

  Object.values(tables.value).forEach(daySpendings => {
    daySpendings.rows.forEach(sp => {
      if (sp.budgetId != null) {
        spentByBid[sp.budgetId] = (spentByBid[sp.budgetId] ?? 0) + sp.amountFull
      }
    })
  })

  return Object.fromEntries(
    budgets.map(b => {
      const spent = from(spentByBid[b.id] ?? 0, b.money.currency)
      return [b.id, { ...b, left: b.money.minus(spent) }]
    }),
  )
})

const dateRefs: Record<string, Element> = {}

onMounted(() => {
  nextTick(() => {
    const targetDate = new Date()
    const el = dateRefs[dateISO(targetDate)]

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
})
</script>

<template>
  <div :key="date" v-for="(table, date) in tables" class="row">
    <div :ref="el => dateRefs[date] = el as Element">
      <p style="padding-left: 0; margin-bottom: 0">
        <template v-if="isToday(new Date(date))">
          <b>
            <i>{{ dateFormat(table.date) }} ({{ dayName(table.date) }})</i>
          </b>
        </template>
        <template v-else-if="isFuture(table.date)">
          <i style="opacity: 40%">{{ dateFormat(table.date) }} ({{ dayName(table.date) }})</i>
        </template>
        <template v-else>
          <i>{{ dateFormat(table.date) }} ({{ dayName(table.date) }})</i>
        </template>
      </p>
      <SpendingTable :table="table" :budgets-map="budgetMap" />
    </div>
  </div>
</template>
