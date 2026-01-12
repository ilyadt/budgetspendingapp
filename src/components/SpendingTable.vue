<script setup lang="ts">
  import { dateFormat, dayName } from '@/helpers/date';
  import { getFormatter, type Currency } from '@/helpers/money';
  import { genVersion, type BudgetWithLeft } from '@/models/models';
  import { PendingSpendingRow, Table } from '@/models/view';
  import { isFuture, isToday } from 'date-fns';
  import { computed, ref } from 'vue';

  const props = defineProps<{
    table: Table
    budgetsMap: Record<number, BudgetWithLeft>
  }>()

  const showBudgetSelectCol: boolean = props.table.budget ? false : true;

  const dayTotal = computed((): Partial<Record<Currency, number>> => {
    const res: Partial<Record<Currency, number>> = {}

    for (const { currency, amountFull } of props.table.rows) {
      res[currency!] = (res[currency!] ?? 0) + amountFull
    }

    return res
  })

  const pending = ref<PendingSpendingRow|null>()

  function bindPending(p: PendingSpendingRow) {
    p.setDestroyFn(() => {
      pending.value = null
    })

    pending.value = p
  }

  // View с возможностью выбора нескольких BudgetSpending с последующим объединением их
  const selectSpendingsView = ref<boolean>(false)

  function onReceiptClick() {
    props.table.resetSelected()
    selectSpendingsView.value = true
  }

  function cancelGroupOperation() {
    selectSpendingsView.value = false
  }

  // TODO: move to lib
  function randomSoftRGB(): number {
    const rand = () => Math.floor(100 + Math.random() * 120); // 100–219

    const r = rand();
    const g = rand();
    const b = rand();

    return (r << 16) | (g << 8) | b;
  }

  function colorFromReceiptId(rId: number): number {
    return rId & 0xFF_FF_FF
  }

  function rgbNumberToCss(color: number): string|undefined {
    if (color == 0) {
      return undefined
    }
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  function uniteReceipt() {
    props.table.uniteReceipt(randomSoftRGB())
    props.table.resetSelected()
    selectSpendingsView.value = false
  }

  function separateReceipt() {
    props.table.separateReceipt()
    props.table.resetSelected()
    selectSpendingsView.value = false
  }
</script>

<template>
  <div class="row">
    <p
      style="
        position: relative;
        margin-bottom: 0;
        padding-left: 0;
        line-height: 1.5;
      "
    >
      <!-- left icon -->
      <span style="padding: 5px 8px;margin-left: 6px; cursor: pointer;" @click="onReceiptClick">
        <font-awesome-icon icon="fa-receipt" />
      </span>

      <!-- centered date -->
      <span
        style="
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;  /* prevent multiline text */
        "
      >
        <b v-if="isToday(table.date)">
          <i>{{ dateFormat(table.date) }} ({{ dayName(table.date) }})</i>
        </b>
        <i v-else-if="isFuture(table.date)" style="opacity: 40%">
          {{ dateFormat(table.date) }} ({{ dayName(table.date) }})
        </i>
        <i v-else>{{ dateFormat(table.date) }} ({{ dayName(table.date) }})</i>
      </span>
    </p>
    <div style="position: relative">
      <table
        class="table table-bordered table-sm align-middle"
        :style="{
          tableLayout: 'fixed',
          minWidth: '350px',
          opacity: isToday(table.date) ? '100%' : '50%',
          marginBottom: '20px',
        }"
      >
        <colgroup v-if="showBudgetSelectCol">
          <col style="width: 50px" />
          <col style="width: 160px" />
          <col style="width: 50px" />
          <col style="width: 55px" />
        </colgroup>
        <colgroup v-else>
          <col style="width: 70px" />
          <col style="width: 190px" />
          <col style="width: 65px" />
        </colgroup>
        <tbody>
          <tr v-for="sp of table.rows" :key="sp.id" :class="{'bg-row': sp.receiptGroupId}" :style="{'--row-color': rgbNumberToCss(colorFromReceiptId(sp.receiptGroupId))}">
            <td class="text-end" :style="{position: 'relative'}">
              <span @click="bindPending(sp.createPending())">{{ sp.amountFull }}</span>

              <input
                v-if="selectSpendingsView"
                v-model="sp.selected"
                style="position: absolute; top: 10px; left: 10px"
                type="checkbox"
              >
            </td>
            <td>
              <span @click="bindPending(sp.createPending())">{{ sp.description }}</span>
            </td>
            <td v-if="showBudgetSelectCol">
              <span @click="bindPending(sp.createPending())">{{ budgetsMap[sp.budgetId!]?.alias }}</span>
            </td>
            <td style="padding: 2px">
              <button
                @click="sp.delete({ dt: new Date(), version: genVersion(sp.version) })"
                class="btn btn-warning btn-sm p-1 m-1"
                style="min-width: 20px; line-height: 1"
              >
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
              <button class="btn btn-sm p-1 m-1" style="width: 20px; line-height: 1">
                <font-awesome-icon :icon="['fas', 'grip-dots-vertical']" />
              </button>
            </td>
          </tr>
          <tr v-if="!selectSpendingsView">
            <td>
              <button
                @click="bindPending(table.addNewSpending().createPending())"
                class="btn btn-success btn-small d-flex align-items-center"
                style="height: 30px"
              >
                +
              </button>
            </td>
            <td></td>
            <td v-if="showBudgetSelectCol"></td>
            <td>{{ dayTotal.RUB ?? 0 }} ₽</td>
          </tr>
        </tbody>
      </table>

      <div v-if="selectSpendingsView">
          <button @click="uniteReceipt" class="btn btn-success btn-small">Объединить в чек</button>
          <button @click="separateReceipt" class="btn btn-success btn-small">Разъединить чек</button>
          <button @click="cancelGroupOperation" class="btn btn-warning btn-small">Отменить</button>
      </div>

      <template v-if="pending">
        <table class="table table-bordered table-sm align-middle modal-table" :style="{ top: pending.rowNum * 37.25 + 'px', background: 'white'}">
          <colgroup v-if="showBudgetSelectCol">
            <col style="width: 50px" />
            <col style="width: 160px" />
            <col style="width: 50px" />
            <col style="width: 55px" />
          </colgroup>
          <colgroup v-else>
            <col style="width: 70px" />
            <col style="width: 190px" />
            <col style="width: 65px" />
          </colgroup>
          <tbody>
            <tr>
              <td class="text-end">
                <input
                  class="form-control cell-input"
                  v-model.number="pending.amountFull"
                  @keyup.enter="pending.save(new Date())"
                  @keyup.esc="pending.cancel()"
                />
              </td>
              <td>
                <input
                  class="form-control cell-input"
                  v-model="pending.description"
                  @keyup.enter="pending.save(new Date())"
                  @keyup.esc="pending.cancel()"
                />
              </td>
              <td v-if="showBudgetSelectCol">
                <select
                  class="form-select cell-input"
                  :value="pending.budgetId"
                  @change="pending.setBudget(budgetsMap[Number(($event.target as HTMLSelectElement).value)]!)"
                  @keyup.enter="pending.save(new Date())"
                  @keyup.esc="pending.cancel()"
                >
                  <option disabled value="">бюджет</option>
                  <option
                    v-for="b in Object.values(budgetsMap).filter(b => b.dateFrom <= pending!.date && pending!.date <= b.dateTo).sort((a, b) => a.id - b.id)"
                    :key="b.id"
                    :value="b.id"
                  >
                    {{ b.alias }}: {{ getFormatter(b.left.currency).format(b.left.full()) }}
                  </option>
                </select>
              </td>
              <td style="padding: 2px">
                <button
                  class="btn btn-danger btn-sm p-1 m-1"
                  style="min-width: 20px; line-height: 1"
                  @click="pending.cancel()"
                >
                  <font-awesome-icon :icon="['fas', 'xmark']" />
                </button>
                <button
                  class="btn btn-success btn-sm p-1 m-1"
                  style="min-width: 20px; line-height: 1"
                  @click="pending.save(new Date())"
                >
                  <font-awesome-icon :icon="['fas', 'check']" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <Teleport to="#app">
          <div class="click-overlay" @click="pending.isNewEmpty() ? pending.cancel() : pending.save(new Date())"></div>
        </Teleport>
      </template>
    </div>
  </div>
</template>

<style lang="css" scoped>
.cell-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: none;
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

.bg-row > td {
  background: var(--row-color)
}
</style>
