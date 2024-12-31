<script setup>
import DaySpendingTable from '@/components/DaySpendingTable.vue'
import { dateFormat, dateFormatFromString, dateISO, dateISOFromString } from '@/helpers/date'
import { moneyToString, minus } from '@/helpers/money'
import { toRaw, computed } from 'vue'

const props = defineProps({
  budget: Object,
  spendings: Object,
})

const daysCount = computed (() => {return ((new Date(props.budget.dateTo))-(new Date(props.budget.dateFrom))) / 1000 / 60 / 60 / 24 + 1});

function getDate(i) {
  return new Date((new Date(props.budget.dateFrom)).getTime() + (i-1)*24*60*60*1000);
}

let moneyLeft = props.budget.money;

let spendingsByDate = {};

for (const sp of toRaw(props.spendings)) {
  moneyLeft = minus(moneyLeft, sp.money);

  if (spendingsByDate[dateISOFromString(sp.date)] == undefined) {
    spendingsByDate[dateISOFromString(sp.date)] = []
  }

  spendingsByDate[dateISOFromString(sp.date)].push(sp)
}

const budgetComp = computed(() => {return props.budget; });

</script>

<template>
    <!-- Отображение бюджета с тратами -->
  <div>
    <p>
        <b>Бюджет: {{ budget.name }}</b> <br>
        <b>{{ dateFormatFromString(budgetComp.dateFrom) }} &mdash; {{ dateFormatFromString(budgetComp.dateTo) }}</b><br>
        <b>{{ moneyToString(moneyLeft) }} {{ moneyLeft.currency }}</b> (из <b>{{ moneyToString(budgetComp.money) }} {{ budgetComp.money.currency }}</b>)
    </p>
  </div>
  <div v-for="i in daysCount" :set="date = getDate(i)" class="row">
    <p style="padding-left: 0; margin-bottom: 0;"><i>{{ dateFormat(date) }}</i></p>
    <DaySpendingTable :daySpendings="spendingsByDate[dateISO(date)]"/>
  </div>
</template>
