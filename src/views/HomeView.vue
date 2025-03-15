<script setup lang="ts">
import { minus, Money, moneyToString } from '@/helpers/money';
import { useBudgetSpendingsStore } from '@/stores/budgetSpendings';
import { moneyToStringWithCurrency, moneyFormat } from '@/helpers/money'
import { dateFormat } from '@/helpers/date'

const { budgets, spendings } = useBudgetSpendingsStore()

interface TemplateBudget {
 id: number,
 name: string,
 dateFrom: Date,
 dateTo: Date,
 amount: Money,
 description?: string,
 amountSpent: Money,
}

const templateBudgets: TemplateBudget[] = [];

for (const b of budgets) {
  const sps = spendings[b.id] || []

  let spentAmount = 0

  for (const sp of sps) {
    spentAmount += sp.money.amount
  }

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
    }
  })
}


const now: Date = new Date((new Date).toDateString())
const dayInMs = 1000*60*60*24

function daysLeft(dateTo: Date): number {
  return Math.floor((dateTo.getTime() - now.getTime()) / dayInMs) + 1
}

function percentAmount(b: TemplateBudget): number {
  return Math.floor(b.amountSpent.amount / b.amount.amount * 100)
}

function percentDays(b: TemplateBudget): number {
  return Math.floor((now.getTime() - b.dateFrom.getTime()) / (b.dateTo.getTime() - b.dateFrom.getTime() + dayInMs) * 100)
}

</script>

<template>
  <h1>Love you so much &hearts;</h1>
  <div v-for="b in templateBudgets" v-bind:key="b.id" style="border-top: outset; margin-top: 5px;">
    <h4 style="margin-bottom: 0;">{{ b.name }} #{{ b.id }}</h4>
    <p  style="margin-bottom: 0px;">{{ dateFormat(b.dateFrom) }}-{{  dateFormat(b.dateTo) }}</p>
    <p  style="margin-bottom: 2px;">{{ moneyToStringWithCurrency(b.amount) }}</p>
    <p style="white-space:pre;font-size: 0.6rem;margin-bottom: 0;font-style: italic;">{{ b.description }}</p>
    <div class="row">
      <div class="col-5" style="font-size: 0.7rem;">
        <b>{{ moneyToString(minus(b.amount, b.amountSpent)) }}</b> {{ b.amount.currency }} left. Money:
        <br>
        <b>{{ daysLeft(b.dateTo) }}</b> days left. Days:
        <br>
        <b>{{ Math.floor(moneyFormat(minus(b.amount, b.amountSpent))/daysLeft(b.dateTo)) }}</b> {{ b.amount.currency }}/Day left
      </div>
      <div class="dual-progress-container col-6">
        <div class="progress">
          <div
              class="progress-bar bg-success"
              role="progressbar"
              :style="{width: percentAmount(b) + '%'}">
              <span v-if="percentAmount(b) >= 50">{{ percentAmount(b) }} %</span>
          </div>
          <span v-if="percentAmount(b) < 50">{{ percentAmount(b) }} %</span>
        </div>
        <div class="progress">
          <div
              class="progress-bar"
              role="progressbar"
              :style="{width: percentDays(b) + '%'}">
              <span v-if="percentDays(b) >= 50">{{ percentDays(b) }} %</span>
          </div>
          <span v-if="percentDays(b) < 50">{{ percentDays(b) }} %</span>
        </div>
      </div>
    </div>
  </div>
</template>
