<script setup lang="ts">
import { Facade } from '@/facade'
import { dateFormat, dateISO, dateRange } from '@/helpers/date'
import { moneyFormat } from '@/helpers/money'
import type { Budget } from '@/models/models'
import { DateCheck, dayName, genSpendingID, genVersion, SpendingRow } from '@/models/view'
import { ref } from 'vue'
const { isToday, isFuture } = DateCheck()

const budgets = Facade.getBudgets()
const budgetMap: Record<number, Budget> = Object.fromEntries(budgets.map(b => [b.id, b]))

const { dateFrom, dateTo } = budgets.reduce(
  (acc, { dateFrom: df, dateTo: dt }) => {
    return {
      dateFrom: df < acc.dateFrom ? df : acc.dateFrom,
      dateTo: dt > acc.dateTo ? dt : acc.dateTo,
    }
  },
  { dateFrom: new Date(8640000000000000), dateTo: new Date(-8640000000000000) },
)

type SpendingGroups = Record<string, SpendingRow[]>

function groupSpendings(bids: number[]): SpendingGroups {
  const groups: SpendingGroups = {}

  for (const bid of bids) {
    const spendings = Facade.spendingsByBudgetId(bid)

    for (const s of spendings) {
      ;(groups[dateISO(s.date)] ??= []).push(
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
          null,
          destroy,
        ),
      )
    }
  }

  // Сортируем
  for (const key in groups) {
    // сначала по id для стабильности при одинаковом sort
    groups[key]!.sort((a, b) => (a.id > b.id ? 1 : -1))

    // потом по sort
    groups[key]!.sort((a, b) => a.sort - b.sort)
  }

  return groups
}

function destroy(sp: SpendingRow) {
  const date = dateISO(sp.date)

  groupedSpendings.value = {
    ...groupedSpendings.value,
    [date]: groupedSpendings.value[date]!.filter(d => d.id !== sp.id),
  }
}

function addSpending(date: Date): void {
  const sp = new SpendingRow(
      genSpendingID(),
      null,
      null,
      null,
      date,
      Date.now(),
      0,
      '',
      null,
      null,
      null,
      destroy,
  )

  sp.toPending()

  ;(groupedSpendings.value[dateISO(date)] ??= []).push(sp)
}

const groupedSpendings = ref(groupSpendings(budgets.map(b => b.id)))
</script>

<template v-if="budgets.length > 0">
  <div :key="dateISO(date)" v-for="date in dateRange(dateFrom, dateTo)" class="row">
    <div class="table-responsive" style="max-width: 100vw; overflow-x: auto">
      <p style="padding-left: 0; margin-bottom: 0">
        <template v-if="isToday(date)">
          <b>
            <i>{{ dateFormat(date) }} ({{ dayName(date) }})</i>
          </b>
        </template>
        <template v-else-if="isFuture(date)">
          <i style="opacity: 40%">{{ dateFormat(date) }} ({{ dayName(date) }})</i>
        </template>
        <template v-else>
          <i>{{ dateFormat(date) }} ({{ dayName(date) }})</i>
        </template>
      </p>
      <table
        class="table table-bordered table-sm align-middle"
        :style="{ tableLayout: 'fixed', minWidth: '350px', opacity: isToday(date) ? '100%' : '50%' }"
      >
        <colgroup>
          <col style="width: 50px" />
          <col style="width: 160px" />
          <col style="width: 50px" />
          <col style="width: 55px" />
        </colgroup>
        <tbody>
          <tr v-for="sp of groupedSpendings[dateISO(date)]" :key="sp.id">
            <template v-if="sp.pending">
              <td class="text-end">
                <input
                  class="form-control cell-input"
                  v-model.number="sp.pending.money"
                  @keyup.enter="sp.pending.save()"
                  @keyup.esc="sp.pending.cancel()"
                />
              </td>
              <td>
                <input
                  class="form-control cell-input"
                  v-model="sp.pending.description"
                  @keyup.enter="sp.pending.save()"
                  @keyup.esc="sp.pending.cancel()"
                />
              </td>
              <td>
                <select
                  class="form-select cell-input"
                  v-model.number="sp.pending.budgetId"
                  @change="sp.pending.setBudget(budgetMap[sp.pending!.budgetId!]!)"
                >
                  <option disabled value="">бюджет</option>
                  <option
                    v-for="b in budgets"
                    :key="b.id"
                    :value="b.id"
                  >
                    {{ b.alias }}
                  </option>
                </select>
              </td>
              <td style="padding: 2px;">
                <button
                  class="btn btn-danger btn-sm p-1 m-1"
                  style="min-width: 20px; line-height: 1"
                  @click="sp.pending.cancel()"
                >
                  <font-awesome-icon :icon="['fas', 'xmark']" />
                </button>
                <button
                  class="btn btn-success btn-sm p-1 m-1"
                  style="min-width: 20px; line-height: 1"
                  @click="sp.pending.save()"
                >
                  <font-awesome-icon :icon="['fas', 'check']" />
                </button>
              </td>
            </template>
            <template v-else>
              <td class="text-end">
                <span @click="sp.toPending()">{{ sp.amountFull }}</span>
              </td>
              <td>
                <span @click="sp.toPending()">{{ sp.description }}</span>
              </td>
              <td>
                <span @click="sp.toPending()">{{ budgetMap[sp.budgetId!]!.alias}}</span>
              </td>
              <td>
                <button
                  @click="sp.delete({ dt: new Date(), version: genVersion() })"
                  class="btn btn-warning btn-sm p-1 m-1"
                  style="min-width: 20px; line-height: 1"
                >
                  <font-awesome-icon :icon="['fas', 'xmark']" />
                </button>
              </td>
            </template>
          </tr>
          <tr>
            <td>
              <button
                @click="addSpending(date)"
                class="btn btn-success btn-small d-flex align-items-center"
                style="height: 30px"
              >
                +
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="css" scoped>
.cell-input {
  border-radius: 0;
  padding: 0.3rem 0.2rem;
}

.cell-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: none;
}
</style>
