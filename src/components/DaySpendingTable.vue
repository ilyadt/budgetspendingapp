<script setup lang="ts">
import IconMoveRow from './icons/IconMoveRow.vue'
import { moneyFormat } from '@/helpers/money'
import type { Spending } from '@/models/models'
import { customAlphabet } from 'nanoid/non-secure'
import { alphanumeric, numbers } from 'nanoid-dictionary'
import { ref } from 'vue'

const genID = customAlphabet(alphanumeric, 10)
const getVersion = customAlphabet(numbers, 5)

const props = defineProps({
  // day: {type: String, required: true},
  // budgetId: {type: Number, required: true},
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
    const id = genID()
    const version = getVersion()
    const createdAt = new Date()
    const updatedAt = new Date(createdAt.getTime())

    return new SpendingRow(id, true, version, sort, 0, '', createdAt, updatedAt, true, '', '')
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
  spending.pending = false
  spending.description = spending.pendingDescription
  spending.money = Number(Number(spending.pendingMoney).toFixed(2))
  spending.updatedAt = new Date()
  spending.isNew = false
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
  const index = rowSpendings.value.findIndex((d) => d.id === spending.id)
  rowSpendings.value.splice(index, 1)
}

function toPending(spending: SpendingRow): void {
  spending.pendingDescription = spending.description
  spending.pendingMoney = spending.money.toFixed(2)
  spending.pending = true
}
</script>
<template>
  <div class="row">
    <table class="table table-sm" style="margin-bottom: 0">
      <tbody>
        <tr v-for="daySpending in rowSpendings" :key="daySpending.id">
          <td>
            <IconMoveRow />
          </td>
          <td v-if="!daySpending.pending" @click="toPending(daySpending)" class="text-end">
            {{ daySpending.money }}
          </td>
          <td v-if="daySpending.pending" class="text-end">
            <input v-model="daySpending.pendingMoney" />
          </td>

          <td v-if="!daySpending.pending" @click="toPending(daySpending)">
            {{ daySpending.description }}
          </td>
          <td v-if="daySpending.pending"><input v-model="daySpending.pendingDescription" /></td>

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
