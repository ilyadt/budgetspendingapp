<script setup lang="ts">
import IconMoveRow from './icons/IconMoveRow.vue'
import { moneyToString } from '@/helpers/money'

const props = defineProps({
  daySpendings: Object,
})
</script>
<template>
  <div class="row">
    <table class="table table-sm" style="margin-bottom: 0">
      <tbody>
        <tr v-for="daySpending in props.daySpendings" :key="daySpending">
          <td>
            <IconMoveRow />
          </td>
          <td class="text-end">{{ moneyToString(daySpending.money) }}</td>
          <td>{{ daySpending.description }}</td>
        </tr>
      </tbody>
    </table>
    <div class="row">
      <button class="btn btn-success btn-small custom-width">+</button>
    </div>
  </div>
</template>

<style lang="css" scoped>
.custom-width {
  width: 70px;
}
</style>
