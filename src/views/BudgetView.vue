<script setup>
import DaySpendingTable from '@/components/DaySpendingTable.vue'

const props = defineProps({
  budget: Object,
  spendings: Object,
})

let budget = props.budget

const dateStart = new Date(budget.dateFrom);
const dateEnd = new Date(budget.dateTo);
const daysCount = (dateEnd-dateStart) / 1000 / 60 / 60 / 24 + 1

function getDate(i) {
  return new Date(dateStart.getTime() + (i-1)*24*60*60*1000);
}

// https://stackoverflow.com/a/2998822/15347300
function pad(num, size) {
    var s = "00" + num;
    return s.substring(s.length-size);
}

function dateFormat(d) {
  return pad(d.getDate(), 2)  + "." + pad(d.getMonth()+1, 2) + "." + d.getFullYear();
}

function dateISO(d) {
  return d.toISOString().split('T')[0];
}

</script>

<template>
    <!-- Отображение бюджета с тратами -->
  <div>
    <p>
        <b>Бюджет: {{ budget.name }}</b> <br>
        <b>{{ budget.dateFrom }} &mdash; {{ budget.dateTo }}</b>
    </p>
  </div>
  <div v-for="i in daysCount" :set="date = getDate(i)" class="row">
    <p style="padding-left: 0; margin-bottom: 0;"><i>{{ dateFormat(date) }}</i></p>
    <DaySpendingTable :daySpendings="props.spendings[dateISO(date)]"/>
  </div>
</template>
