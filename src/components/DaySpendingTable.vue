<script setup lang="ts">
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
  date: { type: Date, required: true },
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
  let lastSort = 0
  if (rowSpendings.value.length > 0) {
    const lastIdx = rowSpendings.value.length - 1
    lastSort = rowSpendings.value[lastIdx].sort
  }

  const newSpending = SpendingRow.new(lastSort + 1)

  rowSpendings.value.push(newSpending)
}

function saveChanges(spending: SpendingRow): void {
  const now = new Date()

  const isNew = spending.isNew
  const description = spending.pendingDescription
  const money = Number(Number(spending.pendingMoney).toFixed(2))
  const prevVersion = spending.version
  const version = genVersion()
  const createdAt = isNew ? new Date(now) : spending.createdAt
  const updatedAt = new Date(now)

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
}

function cancelChanges(spending: SpendingRow): void {
  if (spending.isNew) {
    const index = rowSpendings.value.findIndex((d) => d.id === spending.id)
    rowSpendings.value.splice(index, 1) //remove element from array
  } else {
    spending.pending = false
  }
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
  spending.pendingMoney = spending.money.toFixed(2)
  spending.pending = true
}
</script>
<template>
  <div class="row">
    <p style="padding-left: 0; margin-bottom: 0">
      <i>{{ dateFormat(props.date) }}</i>
    </p>
    <table class="table table-sm" style="margin-bottom: 0">
      <tbody>
        <tr v-for="daySpending in rowSpendings" :key="daySpending.id">
          <td v-if="!daySpending.pending" @click="toPending(daySpending)" class="text-end">
            {{ daySpending.money }}
          </td>
          <td v-if="daySpending.pending" class="text-end">
            <input
              v-on:keyup.enter="saveChanges(daySpending)"
              v-on:keyup.esc="cancelChanges(daySpending)"
              v-model="daySpending.pendingMoney"
            />
          </td>

          <td v-if="!daySpending.pending" @click="toPending(daySpending)">
            {{ daySpending.description }}
          </td>
          <td v-if="daySpending.pending">
            <input
              v-on:keyup.enter="saveChanges(daySpending)"
              v-on:keyup.esc="cancelChanges(daySpending)"
              v-model="daySpending.pendingDescription"
            />
          </td>

          <td v-if="!daySpending.pending">
            <button @click="deleteSpending(daySpending)" class="btn btn-warning">x</button>
          </td>

          <td v-if="daySpending.pending" @click="saveChanges(daySpending)">
            <button class="btn btn-success">save</button>
          </td>
          <td v-if="daySpending.pending" @click="cancelChanges(daySpending)">
            <button class="btn btn-danger">cancel</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row">
      <button @click="addNew" class="btn btn-success btn-small custom-width">+</button>
    </div>
  </div>
</template>

<style lang="css" scoped>
.custom-width {
  width: 70px;
}
</style>
