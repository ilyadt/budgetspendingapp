<script setup lang="ts">
import { moneyFormat } from '@/helpers/money'
import { type Budget, type Spending, genVersion } from '@/models/models'
import { ref, type PropType } from 'vue'
import { dateFormat, DateCheck, dayName } from '@/helpers/date'
import { SpendingRow, Table } from '@/models/view'

const { isToday, isFuture } = DateCheck(new Date())

const props = defineProps({
  date: { type: Date, required: true, default: Date },
  budget: { type: Object as PropType<Budget>, required: true },
  daySpendings: { type: Array<Spending>, required: true },
})

function createTbl(): Table {
  const tbl = new Table(props.date, [], null)

  tbl.setBudget(props.budget)

  for (const sp of props.daySpendings) {
    tbl.addRow(
      new SpendingRow(
        sp.id,
        props.budget.id,
        props.budget.money.currency,
        sp.version,
        props.date,
        sp.sort,
        moneyFormat(sp.money),
        sp.description,
        sp.createdAt,
        sp.updatedAt,
      ),
    )
  }

  tbl.sort()

  return tbl
}

const table = ref<Table>(createTbl())

</script>
<template>
  <div>
    <p style="padding-left: 0; margin-bottom: 0">
      <template v-if="isToday(props.date)">
        <b>
          <i>{{ dateFormat(props.date) }} ({{ dayName(props.date) }})</i>
        </b>
      </template>
      <template v-else-if="isFuture(date)">
        <i style="opacity: 40%">{{ dateFormat(props.date) }} ({{ dayName(props.date) }})</i>
      </template>
      <template v-else>
        <i>{{ dateFormat(props.date) }} ({{ dayName(props.date) }})</i>
      </template>
    </p>
    <div style="position: relative">
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
          <tr v-for="sp in table.rows" :key="sp.id">
            <td class="text-end">
              <span @click="sp.createPending()">{{ sp.amountFull }}</span>
            </td>
            <td>
              <span @click="sp.createPending()">{{ sp.description }}</span>
            </td>
            <td>
              <button
                @click="sp.delete({ dt: new Date(), version: genVersion(sp.version) })"
                class="btn btn-warning btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
              >
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
            </td>
          </tr>
          <tr>
            <td>
              <button @click="table.addNewSpending().createPending()" class="btn btn-success btn-small d-flex align-items-center" style="height: 30px">
                +
              </button>
            </td>
          </tr>
        </tbody>
      </table>

    <template v-if="table.pendingRow">
      <table class="table table-bordered table-sm align-middle modal-table" :style="{ top: table.pendingRow.rowNum * 37.25 + 'px', background: 'white'}">
        <colgroup>
          <col style="width: 70px" />
          <col style="width: 190px" />
          <col style="width: 65px" />
        </colgroup>
        <tbody>
          <tr>
            <td class="text-end">
              <input
                class="form-control cell-input"
                v-model="table.pendingRow.amountFull"
                @keyup.enter="table.pendingRow.save(new Date())"
                @keyup.esc="table.pendingRow.cancel()"
              />
            </td>
            <td>
              <input
                class="form-control cell-input"
                v-model="table.pendingRow.description"
                @keyup.enter="table.pendingRow.save(new Date())"
                @keyup.esc="table.pendingRow.cancel()"
              />
            </td>
            <td>
              <button
                class="btn btn-danger btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
                @click="table.pendingRow.cancel()"
              >
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
              <span style="display: inline-block; width: 5px"></span>
              <button
                class="btn btn-success btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
                @click="table.pendingRow.save(new Date())"
              >
                <font-awesome-icon :icon="['fas', 'check']" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <Teleport to="body">
        <div class="click-overlay" @click="table.pendingRow.isNewEmpty() ? table.pendingRow.cancel() : table.pendingRow.save(new Date())"></div
      ></Teleport>
    </template>
    </div>
  </div>
</template>

<style lang="css" scoped>
.cell-input {
  border-radius: 0;
  padding: 0.3rem 0.2rem;
}

.click-overlay {
  position: fixed;
  inset: 0; /* covers entire viewport */
  background: aqua;
  opacity: 0.5;
  z-index: 2000;
}


.modal-table {
  position: absolute;
  z-index: 2001;
}
</style>
