<script setup lang="ts">
import { minus, Money, moneyToString } from '@/helpers/money'
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings'
import { moneyToStringWithCurrency, moneyFormat } from '@/helpers/money'
import { dateFormat } from '@/helpers/date'
import type { Budget } from '@/models/models.ts'

const { budgets, spendings } = useBudgetSpendingsStore()

interface TemplateBudget {
  id: number
  name: string
  dateFrom: Date
  dateTo: Date
  amount: Money
  description?: string
  amountSpent: Money
  showPerDay?: boolean // Отображать расход в день
}

const templateBudgets: TemplateBudget[] = []

budgets.sort((a: Budget, b: Budget) => {
  let aSort = a.sort
  if (aSort == 0) {
    aSort = 1e6
  }

  let bSort = b.sort
  if (bSort == 0) {
    bSort = 1e6
  }

  return aSort - bSort
})

for (const b of budgets) {
  const sps = spendings[b.id] || []

  let spentAmount = 0

  for (const sp of sps) {
    spentAmount += sp.money.amount
  }

  const params = JSON.parse(b.params)

  templateBudgets.push({
    id: b.id,
    name: b.name,
    dateFrom: new Date(b.dateFrom),
    dateTo: new Date(b.dateTo),
    amount: b.money,
    description: b.description,
    amountSpent: {
      amount: spentAmount,
      fraction: b.money.fraction,
      currency: b.money.currency,
    },
    showPerDay: params["perDay"]
  })
}

const now: Date = new Date()
const dayInMs = 1000 * 60 * 60 * 24

function daysLeft(dateTo: Date): number {
  const left = Math.floor(dateTo.getTime() / dayInMs) - Math.floor(now.getTime() / dayInMs) + 1

  if (left < 0) {
    return 0
  }

  return left
}

function percentAmount(b: TemplateBudget): number {
  return Math.floor((b.amountSpent.amount / b.amount.amount) * 100)
}

function percentDays(b: TemplateBudget): number {
  const result = Math.floor(
    ((Math.floor(now.getTime() / dayInMs) - Math.floor(b.dateFrom.getTime() / dayInMs)) /
      (Math.floor(b.dateTo.getTime() / dayInMs) - Math.floor(b.dateFrom.getTime() / dayInMs) + 1)) *
      100,
  )

  if (result > 100) {
    return 100
  }

  return result
}
</script>

<template>
  <h1>Love you so much &hearts;</h1>
  <div
    v-for="b in templateBudgets"
    v-bind:key="b.id"
    :style="{ borderTop: 'outset', marginTop: '5px', opacity: b.dateTo > now ? 1 : 0.5 }"
  >
    <h4 style="margin-bottom: 0">{{ b.name }} #{{ b.id }}</h4>
    <p style="margin-bottom: 0">{{ dateFormat(b.dateFrom) }}-{{ dateFormat(b.dateTo) }}</p>
    <p style="margin-bottom: 2px">{{ moneyToStringWithCurrency(b.amount) }}</p>
    <p style="white-space: pre; font-size: 0.6rem; margin-bottom: 0; font-style: italic">
      {{ b.description }}
    </p>
    <div class="row">
      <div class="col-5" style="font-size: 0.7rem">
        <b>{{ moneyToString(minus(b.amount, b.amountSpent)) }}</b> {{ b.amount.currency }} left.
        Money:
        <br />
        <b>{{ daysLeft(b.dateTo) }}</b> days left. Days:
        <br />
        <p v-if="b.showPerDay">
          <b>{{ Math.floor(moneyFormat(minus(b.amount, b.amountSpent)) / daysLeft(b.dateTo)) }}</b>
          {{ b.amount.currency }}/Day left
        </p>
      </div>
      <div class="dual-progress-container col-6">
        <div class="progress">
          <div
            class="progress-bar bg-success"
            role="progressbar"
            :style="{ width: percentAmount(b) + '%' }"
          >
            <span v-if="percentAmount(b) >= 50">{{ percentAmount(b) }} %</span>
          </div>
          <span v-if="percentAmount(b) < 50">{{ percentAmount(b) }} %</span>
        </div>
        <div class="progress">
          <div class="progress-bar" role="progressbar" :style="{ width: percentDays(b) + '%' }">
            <span v-if="percentDays(b) >= 50">{{ percentDays(b) }} %</span>
          </div>
          <span v-if="percentDays(b) < 50">{{ percentDays(b) }} %</span>
        </div>
      </div>
    </div>
  </div>
</template>
