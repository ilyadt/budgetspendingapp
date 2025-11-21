<script setup lang="ts">
import { moneyFormat, type Currency } from '@/helpers/money'
import { type Budget, type Spending, genSpendingID, genVersion } from '@/models/models'
import { ref, type PropType } from 'vue'
import { dateFormat, DateCheck, dayName, dateISO } from '@/helpers/date'
import { PendingSpendingRow, SpendingRow } from '@/models/view'

const { isToday, isFuture } = DateCheck(new Date())

const props = defineProps({
  date: { type: Date, required: true, default: Date },
  budget: { type: Object as PropType<Budget>, required: true },
  daySpendings: { type: Array<Spending>, required: true },
})

const rowSpendings = ref<SpendingRow[]>([])

for (const sp of props.daySpendings) {
  rowSpendings.value.push(
    new SpendingRow(
      sp.id,
      props.budget.id,
      props.budget.money.currency as Currency,
      sp.version,
      props.date,
      sp.sort,
      moneyFormat(sp.money),
      sp.description,
      sp.createdAt,
      sp.updatedAt,
      destroy,
    ),
  )
}

rowSpendings.value.sort((a, b) => a.sort - b.sort)

function destroy(sp: SpendingRow) {
  rowSpendings.value = rowSpendings.value.filter(d => d.id !== sp.id)
}

function addNew($el: HTMLElement): void {
  const sp = new SpendingRow(
    genSpendingID(),
    props.budget.id,
    props.budget.money.currency as Currency,
    null,
    props.date,
    Date.now(),
    0,
    '',
    null,
    null,
    destroy,
  )
  rowSpendings.value.push(sp)

  createPending(sp, $el)
}

const spPending = ref<PendingSpendingRow | null>(null)

function createPending(sp: SpendingRow, $el: HTMLElement) {
  spPending.value = new PendingSpendingRow(
      sp.id,
      sp.version,
      sp.budgetId,
      sp.date,
      sp.currency,
      sp.description,
      String(sp.amountFull || ''),
      $el.offsetTop,
      sp,
      () => {
        spPending.value = null
      }
    )
}

const trRefs: Record<string, HTMLElement> = {}  // spID => <tr>

</script>
<template>
  <div class="table-responsive" style="max-width: 100vw; overflow-x: auto">
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
    <div :id="'tbl-' + (dateISO(date))" style="position: relative;">
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
          <tr v-for="sp in rowSpendings" :key="sp.id" :ref="el => trRefs[sp.id]= el as HTMLElement">
            <td class="text-end">
              <span @click="createPending(sp, trRefs[sp.id]!)">{{ sp.amountFull }}</span>
            </td>
            <td>
              <span @click="createPending(sp, trRefs[sp.id]!)">{{ sp.description }}</span>
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
          <tr :ref="el => trRefs['add_' + dateISO(date)]= el as HTMLElement">
            <td>
              <button @click="addNew(trRefs['add_' + dateISO(date)]!)" class="btn btn-success btn-small d-flex align-items-center" style="height: 30px">
                +
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <template v-if="spPending">
    <Teleport :to="'#tbl-' + (dateISO(spPending.date))">
      <table :style="{top: spPending.topOffset + 'px'}" class="modal-table">
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
                v-model="spPending.amountFull"
                @keyup.enter="spPending.save(new Date())"
                @keyup.esc="spPending.cancel()"
              />
            </td>
            <td>
              <input
                class="form-control cell-input"
                v-model="spPending.description"
                @keyup.enter="spPending.save(new Date())"
                @keyup.esc="spPending.cancel()"
              />
            </td>
            <td>
              <button
                class="btn btn-danger btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
                @click="spPending.cancel()"
              >
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
              <span style="display: inline-block; width: 5px"></span>
              <button
                class="btn btn-success btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
                @click="spPending.save(new Date())"
              >
                <font-awesome-icon :icon="['fas', 'check']" />
              </button>
            </td>
        </tr>
        </tbody>
      </table>
    </Teleport>

    <!-- invisible click-catcher -->
    <div class="click-overlay" @click="spPending.isNewEmpty() ? spPending.cancel() : spPending.save(new Date())"></div>
  </template>
</template>

<style lang="css" scoped>
.cell-input {
  border-radius: 0;
  padding: 0.3rem 0.2rem;
}

.click-overlay {
  position: fixed;
  inset: 0; /* covers entire viewport */
  background: transparent;
  z-index: 2000;
}

.modal-table {
  width: 100%;
  position: absolute;
  z-index: 2001;
}

</style>
