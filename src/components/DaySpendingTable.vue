<script setup lang="ts">
/* eslint-disable  @typescript-eslint/no-explicit-any */
import { moneyFormat } from '@/helpers/money'
import type {
  Spending,
  Budget,
  SpendingDeleteEvent,
  SpendingUpdateEvent,
  SpendingCreateEvent,
} from '@/models/models'
import { customAlphabet } from 'nanoid/non-secure'
import { alphanumeric } from 'nanoid-dictionary'
import { ref, type PropType } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { getEventsUploaderInstance } from '@/services/eventsUploader'
import { dateFormat, dateISO } from '@/helpers/date'

const genSpendingID = customAlphabet(alphanumeric, 10)
const genVersion = customAlphabet(alphanumeric, 5)
const eventsUploaderInstance = getEventsUploaderInstance()

const props = defineProps({
  date: { type: Date, required: true, default: Date },
  budget: { type: Object as PropType<Budget>, required: true },
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

  public static new(sort: number): SpendingRow {
    const id = genSpendingID()
    const createdAt = new Date()
    const updatedAt = new Date(createdAt.getTime())
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
      new Date(Date.parse(sp.createdAt)),
      new Date(Date.parse(sp.updatedAt)),
      false,
      '',
      '',
    ),
  )
}

rowSpendings.value.sort((a, b) => (a.sort < b.sort ? -1 : 1))

function addNew(): void {
  let lastSort = 100 // Начало сортировки с 100 (101 первая запись). Сортировки до у старых записей
  if (rowSpendings.value.length > 0) {
    const lastIdx = rowSpendings.value.length - 1
    lastSort = rowSpendings.value[lastIdx].sort
  }

  const newSpending = SpendingRow.new(lastSort + 1)

  rowSpendings.value.push(newSpending)
}

let lastTap = 0

function saveChanges(spending: SpendingRow): void {
  const now = new Date()

  const isNew = spending.isNew
  const description = spending.pendingDescription
  const money = Number(Number(spending.pendingMoney).toFixed(2))
  const prevVersion = spending.version
  const version = genVersion()
  const createdAt = isNew ? new Date(now.getDate()) : spending.createdAt
  const updatedAt = new Date(now.getDate())

  spending.pending = false
  spending.description = description
  spending.money = money
  spending.updatedAt = updatedAt
  if (isNew) {
    spending.createdAt = createdAt
  }
  spending.version = version
  spending.isNew = false

  const event: SpendingCreateEvent | SpendingUpdateEvent = {
    eventId: uuidv4(), // TODO: uuid
    type: isNew ? 'create' : 'update',
    spendingId: spending.id,
    date: dateISO(props.date),
    sort: spending.sort,
    money: {
      amount: money * 10 ** props.budget.money.fraction,
      fraction: props.budget.money.fraction,
      currency: props.budget.money.currency,
    },
    description: description,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    newVersion: version,
    prevVersion: prevVersion,
    budgetId: props.budget.id,
    status: 'pending',
  }

  eventsUploaderInstance.AddEvent(event)

  lastTap = 0
}

function cancelChanges(spending: SpendingRow): void {
  if (spending.isNew) {
    const index = rowSpendings.value.findIndex((d) => d.id === spending.id)
    rowSpendings.value.splice(index, 1) //remove element from array
  } else {
    spending.pending = false
  }

  lastTap = 0
}

function handleDoubleTouch($event: TouchEvent, fn: (arg: any) => void, arg: unknown) {
  // Guard
  if ($event.type !== 'touchstart') {
    return
  }

  const currentEventTime = $event.timeStamp
  const tapLength = currentEventTime - lastTap

  if (tapLength < 200 && tapLength > 0) {
    fn(arg)
  }

  lastTap = currentEventTime
}

function deleteSpending(spending: SpendingRow): void {
  const id = spending.id
  const prevVersion = spending.version
  const updatedAt = new Date()
  const version = genVersion()

  const index = rowSpendings.value.findIndex((d) => d.id === spending.id)
  rowSpendings.value.splice(index, 1)

  const event: SpendingDeleteEvent = {
    eventId: uuidv4(),
    type: 'delete',
    spendingId: id,
    newVersion: version,
    prevVersion: prevVersion,
    updatedAt: updatedAt.toISOString(),
    budgetId: props.budget.id,
    status: 'pending',
  }

  eventsUploaderInstance.AddEvent(event)
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
        <i style="opacity: 40%"
          >{{ dateFormat(props.date) }} ({{ dayNames[props.date.getDay()] }})</i
        >
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
                @dblclick="cancelChanges(daySpending)"
                @touchstart="handleDoubleTouch($event, cancelChanges, daySpending)"
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
                @dblclick="deleteSpending(daySpending)"
                @touchstart="handleDoubleTouch($event, deleteSpending, daySpending)"
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
            <button
              @click="addNew"
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
</template>

<style lang="css" scoped>
.cell-input {
  border-radius: 0;
  padding: 0.3rem 0.2rem;
}
</style>
