<script setup lang="ts">
import { Facade } from '@/facade'
import { dateFormat, dateISO, dateRange } from '@/helpers/date'
import { moneyToString, minus, moneyFormat, from } from '@/helpers/money'
import { genSpendingID, genVersion, type Budget, type Spending } from '@/models/models'
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

const { dateFrom, dateTo } = spendings.reduce((acc, curr) => {
  return {
    dateFrom: curr.date < acc.dateFrom ? curr.date : acc.dateFrom,
    dateTo: curr.date > acc.dateTo ? curr.date : acc.dateTo
  }
}, { dateFrom: budget.dateFrom, dateTo: budget.dateTo })

const tbls = ref<SpendingGroups>(makeTables(budget,[dateFrom, dateTo]))

interface TopForm {
  date: string,
  amount: number|null,
  description: string,
}

const topForm = ref<TopForm>({
  date: '',
  amount: null,
  description: ''
})

function saveTopForm(now: Date) {
  if (!topForm.value.date || !topForm.value.amount || !topForm.value.description) {
    alert('Заполните все поля')
    return
  }

  const sendData: Spending = {
    id: genSpendingID(),
    version: genVersion(null),
    date: new Date(topForm.value.date),
    sort: now.getTime(),
    money: from(topForm.value.amount, budget.money.currency),
    description: topForm.value.description,
    createdAt: now,
    updatedAt: now,
    receiptGroupId: 0,
  }

  Facade.createSpending(budget.id, sendData)

  // clear form
  topForm.value = {
    date: '',
    amount: null,
    description: ''
  }

  // After DOM update
  setTimeout(() => {
    alert('Сохранено!')
  }, 0)

  // костылик
  location.reload()
}

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
  <div class="d-flex align-items-center gap-1 mb-5">
    <input
      type="date"
      class="form-control form-control-sm p-1"
      placeholder="дата"
      style="width: 16ch;"
      v-model="topForm.date"
    />
    <input
      type="number"
      class="form-control form-control-sm no-spinner text-end p-1"
      placeholder="сумма"
      style="width: 10ch;"
      v-model="topForm.amount"
    />
    <input
      type="text"
      class="form-control form-control-sm flex-grow-1 p-1"
      placeholder="описание"
      v-model="topForm.description"
    />
    <button class="btn btn-warning btn-sm" @click="saveTopForm(new Date())">
      <font-awesome-icon :icon="['fas', 'floppy-disk']" />
    </button>
  </div>
  <SpendingTable v-for="(tbl, date) of tbls" :key="date" :table="tbl" :budgets-map="{}"/>
</template>

<style lang="css" scoped>
  /* Chrome, Safari, Edge */
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  .no-spinner {
    -moz-appearance: textfield;
  }
</style>
