<script setup lang="ts">
import { moneyFormat } from '@/helpers/money'
import type { ApiBudget, Spending } from '@/models/models'
import { customAlphabet } from 'nanoid/non-secure'
import { alphanumeric } from 'nanoid-dictionary'
import { ref, type PropType } from 'vue'
import { dateFormat } from '@/helpers/date'
import { Facade } from '@/facade'

const genSpendingID = customAlphabet(alphanumeric, 10)
const genVersion = customAlphabet(alphanumeric, 5)

const props = defineProps({
  date: { type: Date, required: true, default: Date },
  budget: { type: Object as PropType<ApiBudget>, required: true },
  daySpendings: { type: Array<Spending>, required: true },
})

class SpendingRow {
  constructor(
    public id: string,
    public isNew: boolean,
    public version: string,
    public sort: number,
    public money: number,
    public description: string,

    public createdAt: Date,
    public updatedAt: Date,

    // Pending
    public pending: boolean,
    public pendingMoney: string,
    public pendingDescription: string,
  ) {}

  public static new(): SpendingRow {
    const id = genSpendingID()
    const createdAt = new Date()
    const updatedAt = new Date(createdAt.getTime())
    const sort = Date.now()
    // версия появляется только после первого сохранения

    return new SpendingRow(id, true, '', sort, 0, '', createdAt, updatedAt, true, '', '')
  }
}

const rowSpendings = ref<SpendingRow[]>([])

for (const sp of props.daySpendings) {
  rowSpendings.value.push(
    new SpendingRow(
      sp.id,
      false,
      sp.version,
      sp.sort,
      moneyFormat(sp.money),
      sp.description,
      sp.createdAt,
      sp.updatedAt,
      false,
      '',
      '',
    ),
  )
}

rowSpendings.value.sort((a, b) => a.sort - b.sort)

function addNew(): void {
  rowSpendings.value.push(SpendingRow.new())
}

function saveChanges(spending: SpendingRow): void {
  const now = new Date()

  const isNew = spending.isNew
  const description = spending.pendingDescription
  const money = Number(Number(spending.pendingMoney).toFixed(2))
  const prevVersion = spending.version
  const createdAt = isNew ? new Date(now) : spending.createdAt
  const updatedAt = new Date(now)

  spending.pending = false
  spending.description = description
  spending.money = money
  spending.updatedAt = updatedAt
  if (isNew) {
    spending.createdAt = createdAt
  }
  spending.version = genVersion()
  spending.isNew = false

  if (isNew) {
    Facade.createSpending(props.budget.id, {
      id: spending.id,
      version: spending.version,
      prevVersion: prevVersion,
      date: props.date,
      sort: spending.sort,
      money: {
        amount: money * 10 ** props.budget.money.fraction,
        fraction: props.budget.money.fraction,
        currency: props.budget.money.currency,
      },
      description: spending.description,
      createdAt: spending.createdAt,
      updatedAt: spending.updatedAt,
    })
  } else {
    Facade.updateSpending(props.budget.id, {
      id: spending.id,
      version: spending.version,
      prevVersion: prevVersion,
      date: props.date,
      sort: spending.sort,
      money: {
        amount: money * 10 ** props.budget.money.fraction,
        fraction: props.budget.money.fraction,
        currency: props.budget.money.currency,
      },
      description: spending.description,
      createdAt: spending.createdAt,
      updatedAt: spending.updatedAt,
    })
  }
}

function cancelChanges(spending: SpendingRow): void {
  if (!window.confirm(`Отменить изменение?`)) {
    return
  }

  if (spending.isNew) {
    const index = rowSpendings.value.findIndex(d => d.id === spending.id)
    rowSpendings.value.splice(index, 1) //remove element from array
  } else {
    spending.pending = false
  }
}

function deleteSpending(spending: SpendingRow): void {
  if (!window.confirm(`Удалить запись "${spending.description}" ?`)) {
    return
  }

  Facade.deleteSpending(props.budget.id, {
    id: spending.id,
    version: genVersion(),
    prevVersion: spending.version,
    updatedAt: new Date(),
  })

  const index = rowSpendings.value.findIndex(d => d.id === spending.id)
  rowSpendings.value.splice(index, 1)
}

function toPending(spending: SpendingRow): void {
  spending.pendingDescription = spending.description
  spending.pendingMoney = spending.money.toString()
  spending.pending = true
}

const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

const today = new Date()

function isToday(d: Date): boolean {
  return today.toDateString() === d.toDateString()
}

function isFuture(d: Date): boolean {
  return d.getTime() > today.getTime()
}
</script>
<template>
  <div class="table-responsive" style="max-width: 100vw; overflow-x: auto">
    <p style="padding-left: 0; margin-bottom: 0">
      <template v-if="isToday(props.date)">
        <b>
          <i>{{ dateFormat(props.date) }} ({{ dayNames[props.date.getDay()] }})</i>
        </b>
      </template>
      <template v-else-if="isFuture(date)">
        <i style="opacity: 40%">{{ dateFormat(props.date) }} ({{ dayNames[props.date.getDay()] }})</i>
      </template>
      <template v-else>
        <i>{{ dateFormat(props.date) }} ({{ dayNames[props.date.getDay()] }})</i>
      </template>
    </p>
    <table
      class="table table-bordered table-sm align-middle"
      :style="{ tableLayout: 'fixed', minWidth: '350px', opacity: isToday(date) ? '100%' : '50%' }"
    >
      <colgroup>
        <col style="width: 70px" />
        <col style="width: 190px" />
        <col style="width: 65px" />
      </colgroup>
      <tbody>
        <tr v-for="daySpending in rowSpendings" :key="daySpending.id">
          <td class="text-end">
            <input
              v-if="daySpending.pending"
              class="form-control cell-input"
              v-on:keyup.enter="saveChanges(daySpending)"
              v-on:keyup.esc="cancelChanges(daySpending)"
              v-model="daySpending.pendingMoney"
            />
            <span @click="toPending(daySpending)" v-else>{{ daySpending.money }}</span>
          </td>

          <td>
            <input
              v-if="daySpending.pending"
              class="form-control cell-input"
              v-on:keyup.enter="saveChanges(daySpending)"
              v-on:keyup.esc="cancelChanges(daySpending)"
              v-model="daySpending.pendingDescription"
            />
            <span @click="toPending(daySpending)" v-else>{{ daySpending.description }}</span>
          </td>

          <td>
            <template v-if="daySpending.pending">
              <button
                class="btn btn-danger btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
                @click="cancelChanges(daySpending)"
              >
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
              <span style="display: inline-block; width: 5px"></span>
              <button
                class="btn btn-success btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
                @click="saveChanges(daySpending)"
              >
                <font-awesome-icon :icon="['fas', 'check']" />
              </button>
            </template>
            <template v-else>
              <button
                @click="deleteSpending(daySpending)"
                class="btn btn-warning btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
              >
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
            </template>
          </td>
        </tr>
        <tr>
          <td>
            <button @click="addNew" class="btn btn-success btn-small d-flex align-items-center" style="height: 30px">
              +
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="css" scoped>
.cell-input {
  border-radius: 0;
  padding: 0.3rem 0.2rem;
}
</style>
