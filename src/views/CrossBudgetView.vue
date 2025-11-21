<script setup lang="ts">
import { Facade } from '@/facade'
import { dateFormat, dateISO, dateRange, DateCheck, dayName } from '@/helpers/date'
import { from, getFormatter, Money, moneyFormat, type Currency } from '@/helpers/money'
import { type Budget, genSpendingID, genVersion } from '@/models/models'
import { PendingSpendingRow, SpendingRow } from '@/models/view'
import { computed, nextTick, onMounted, ref, type Ref } from 'vue'
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

function addSpending(date: Date, $el: HTMLElement): void {
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
      destroy,
  )

  ;(groupedSpendings.value[dateISO(date)] ??= []).push(sp)

  createPending(sp, $el)
}

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

const groupedSpendings = ref(groupSpendings(budgets.map(b => b.id)))

type BudgetWithLeft = Budget & { left: Money }

const budgetMap = computed<Record<number, BudgetWithLeft>>(() => {
  const spentByBid: Record<number, number> = {}

  Object.values(groupedSpendings.value).forEach(daySpendings => {
    daySpendings.forEach(sp => {
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

  Object.entries(groupedSpendings.value).forEach(([date, daySpendings]) => {
    const dayTotal: Partial<Record<Currency, number>> = {}

    daySpendings.forEach(sp => {
      const c = sp.currency!
      dayTotal[c] = (dayTotal[c] ?? 0) + sp.amountFull
    })

    res[date] = dayTotal
  })

  return res
})

const dateRefs: Record<string, Element> = {}

const trRefs: Record<string, HTMLElement> = {}  // spID => <tr>

const scrollToDate = (targetDate: Date) => {
  const el = dateRefs[dateISO(targetDate)]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

onMounted(() => {
  nextTick(() => {
    const targetDate = new Date()
    scrollToDate(targetDate)
  })
})

const spPending: Ref<PendingSpendingRow | null> = ref(null)

</script>

<template v-if="budgets.length > 0">
  <div :key="dateISO(date)" v-for="date in dateRange(dateFrom, dateTo)" class="row">
    <div class="table-responsive" style="max-width: 100vw; overflow-x: auto" :ref="el => dateRefs[dateISO(date)] = el as Element">
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
      <div :id="'tbl-' + (dateISO(date))" style="position: relative;">
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
            <tr v-for="sp of groupedSpendings[dateISO(date)]" :key="sp.id" :ref="el => trRefs[sp.id]= el as HTMLElement">
              <td class="text-end">
                <span @click="createPending(sp, trRefs[sp.id]!)">{{ sp.amountFull }}</span>
              </td>
              <td>
                <span @click="createPending(sp, trRefs[sp.id]!)">{{ sp.description }}</span>
              </td>
              <td>
                <span @click="createPending(sp, trRefs[sp.id]!)">{{ budgetMap[sp.budgetId!]?.alias }}</span>
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
            <tr :ref="el => trRefs['add_' + dateISO(date)]= el as HTMLElement">
              <td>
                <button
                  @click="addSpending(date, trRefs['add_' + dateISO(date)]!)"
                  class="btn btn-success btn-small d-flex align-items-center"
                  style="height: 30px"
                >
                  +
                </button>
              </td>
              <td></td>
              <td></td>
              <td> {{ daysTotal[dateISO(date)]?.RUB ?? 0 }} ₽</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <template v-if="spPending">
    <Teleport :to="'#tbl-' + (dateISO(spPending.date))">
      <table :style="{top: spPending.topOffset + 'px'}" class="modal-table">
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
              v-model.number="spPending.amountFull"
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
            <select
              class="form-select cell-input"
              :value="spPending.budgetId"
              @change="spPending.setBudget(budgetMap[Number(($event.target as HTMLSelectElement).value)]!)"
            >
              <option disabled value="">бюджет</option>
              <option
                v-for="b in Object.values(budgetMap).filter(b => b.dateFrom <= spPending!.date && spPending!.date <= b.dateTo).sort((a, b) => a.id - b.id)"
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
              @click="spPending.cancel()"
            >
              <font-awesome-icon :icon="['fas', 'xmark']" />
            </button>
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
  background: transparent;
  z-index: 2000;
}

.modal-table {
  width: 100%;
  position: absolute;
  z-index: 2001;
}
</style>
