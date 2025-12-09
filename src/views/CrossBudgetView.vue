<script setup lang="ts">
import { Facade } from '@/facade'
import { dateFormat, dateISO, dateRange, DateCheck, dayName } from '@/helpers/date'
import { from, getFormatter, Money, moneyFormat, type Currency } from '@/helpers/money'
import { type Budget, genSpendingID, genVersion } from '@/models/models'
import { PendingSpendingRow, SpendingRow, Table } from '@/models/view'
import { computed, nextTick, onMounted, ref } from 'vue'
const { isToday, isFuture } = DateCheck(new Date())

const props = defineProps<{
  budgets: Budget[]
}>()

const budgets = props.budgets

const { dateFrom, dateTo } = budgets.reduce(
  (acc, { dateFrom: df, dateTo: dt }) => {
    return {
      dateFrom: df < acc.dateFrom ? df : acc.dateFrom,
      dateTo: dt > acc.dateTo ? dt : acc.dateTo,
    }
  },
  { dateFrom: new Date(8640000000000000), dateTo: new Date(-8640000000000000) },
)

type SpendingGroups = Record<string, Table>

function makeTables(bids: number[], [dateFrom, dateTo]: [Date, Date]): SpendingGroups {
  const tables: Record<string, Table> = {}

  // init
  for (const date of dateRange(dateFrom, dateTo)) {
    tables[dateISO(date)] = new Table(date, [], null)
  }

  // fill
  for (const bid of bids) {
    const spendings = Facade.spendingsByBudgetId(bid)

    for (const s of spendings) {
      tables[dateISO(s.date)]?.addRow(
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
        ),
      )
    }
  }

  // Sort
  for (const tbl of Object.values(tables)) {
    tbl.sort()
  }

  return tables
}

function addSpending(date: Date): void {
  const sp = new SpendingRow(genSpendingID(), null, null, null, date, Date.now(), 0, '', null, null)

  tables.value[dateISO(date)]!.addRow(sp)

  createPending(sp)
}

function createPending(sp: SpendingRow) {
  sp.dt!.setPendingRow(
    new PendingSpendingRow(
      sp.getRowNum(),
      sp.id,
      sp.version,
      sp.budgetId,
      sp.date,
      sp.currency,
      sp.description,
      String(sp.amountFull || ''),
      sp,
      () => {
        sp.dt!.setPendingRow(null)
      },
    ),
  )
}

const tables = ref(makeTables(budgets.map(b => b.id), [dateFrom, dateTo]))

type BudgetWithLeft = Budget & { left: Money }

const budgetMap = computed<Record<number, BudgetWithLeft>>(() => {
  const spentByBid: Record<number, number> = {}

  Object.values(tables.value).forEach(daySpendings => {
    daySpendings.rows.forEach(sp => {
      if (sp.budgetId != null) {
        spentByBid[sp.budgetId] = (spentByBid[sp.budgetId] ?? 0) + sp.amountFull
      }
    })
  })

  return Object.fromEntries(
    budgets.map(b => {
      const spent = from(spentByBid[b.id] ?? 0, b.money.currency)
      return [b.id, { ...b, left: b.money.minus(spent) }]
    }),
  )
})

const daysTotal = computed((): Record<string, Partial<Record<Currency, number>>> => {
  const res: Record<string, Partial<Record<Currency, number>>> = {}

  Object.entries(tables.value).forEach(([date, table]) => {
    const dayTotal: Partial<Record<Currency, number>> = {}

    table.rows.forEach(sp => {
      const c = sp.currency!
      dayTotal[c] = (dayTotal[c] ?? 0) + sp.amountFull
    })

    res[date] = dayTotal
  })

  return res
})

const dateRefs: Record<string, Element> = {}

onMounted(() => {
  nextTick(() => {
    const targetDate = new Date()
    const el = dateRefs[dateISO(targetDate)]

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
})
</script>

<template>
  <div :key="date" v-for="(table, date) in tables" class="row">
    <div class="table-responsive" style="max-width: 100vw; overflow-x: auto" :ref="el => dateRefs[date] = el as Element">
      <p style="padding-left: 0; margin-bottom: 0">
        <template v-if="isToday(new Date(date))">
          <b>
            <i>{{ dateFormat(table.date) }} ({{ dayName(table.date) }})</i>
          </b>
        </template>
        <template v-else-if="isFuture(table.date)">
          <i style="opacity: 40%">{{ dateFormat(table.date) }} ({{ dayName(table.date) }})</i>
        </template>
        <template v-else>
          <i>{{ dateFormat(table.date) }} ({{ dayName(table.date) }})</i>
        </template>
      </p>
      <div style="position: relative">
        <table
          class="table table-bordered table-sm align-middle"
          :style="{ tableLayout: 'fixed', minWidth: '350px', opacity: isToday(table.date) ? '100%' : '50%' }"
        >
          <colgroup>
            <col style="width: 50px" />
            <col style="width: 160px" />
            <col style="width: 50px" />
            <col style="width: 55px" />
          </colgroup>
          <tbody>
            <tr v-for="sp of table.rows" :key="sp.id">
              <td class="text-end">
                <span @click="createPending(sp)">{{ sp.amountFull }}</span>
              </td>
              <td>
                <span @click="createPending(sp)">{{ sp.description }}</span>
              </td>
              <td>
                <span @click="createPending(sp)">{{ budgetMap[sp.budgetId!]?.alias }}</span>
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
            <tr>
              <td>
                <button
                  @click="addSpending(table.date)"
                  class="btn btn-success btn-small d-flex align-items-center"
                  style="height: 30px"
                >
                  +
                </button>
              </td>
              <td></td>
              <td></td>
              <td>{{ daysTotal[date]?.RUB ?? 0 }} ₽</td>
            </tr>
          </tbody>
        </table>

        <template v-if="table.pendingRow">
          <table class="table table-bordered table-sm align-middle modal-table" :style="{ top: table.pendingRow.rowNum * 37.25 + 'px', background: 'white'}">
            <colgroup>
              <col style="width: 50px" />
              <col style="width: 160px" />
              <col style="width: 50px" />
              <col style="width: 55px" />
            </colgroup>
            <tbody>
              <tr>
                <td class="text-end">
                  <input
                    class="form-control cell-input"
                    v-model.number="table.pendingRow.amountFull"
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
                  <select
                    class="form-select cell-input"
                    :value="table.pendingRow.budgetId"
                    @change="table.pendingRow.setBudget(budgetMap[Number(($event.target as HTMLSelectElement).value)]!)"
                  >
                    <option disabled value="">бюджет</option>
                    <option
                      v-for="b in Object.values(budgetMap).filter(b => b.dateFrom <= table.pendingRow!.date && table.pendingRow!.date <= b.dateTo).sort((a, b) => a.id - b.id)"
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
                    @click="table.pendingRow.cancel()"
                  >
                    <font-awesome-icon :icon="['fas', 'xmark']" />
                  </button>
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
          <Teleport to="#app">
            <div class="click-overlay" @click="table.pendingRow.isNewEmpty() ? table.pendingRow.cancel() : table.pendingRow.save(new Date())"></div>
          </Teleport>
        </template>
      </div>
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
</style>
