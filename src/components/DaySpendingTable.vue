<script setup>
  import IconMoveRow from './icons/IconMoveRow.vue';
  import { moneyToString } from '@/helpers/money'

  const props = defineProps({
    daySpendings: Object,
  });

</script>
<template>
  <div class="row">
    <table class="table table-sm">
    <tbody>
      <tr v-for="daySpending in props.daySpendings">
        <td>
          <IconMoveRow />
        </td>
        <td class="text-end">{{ moneyToString(daySpending.money) }}</td>
        <td>{{ daySpending.description }}</td>
      </tr>
    </tbody>
  </table>
</div>
<div class="row">
  <button type="button" class="btn btn-success btn-sm">+</button>
</div>
</template>
