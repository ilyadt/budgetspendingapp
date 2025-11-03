<script setup lang="ts">
// Err от любого серверного

// 1. GetSpendings (Net + StatusNot200)
// 2. UpdateBudgetSpending (Net + Status500)
//
// Recover
// Для каждого метода свой recover (последний из отправленных)
//

import { useConflictVersionStore } from '@/stores/conflictVersions'
import { useStatusStore } from '@/stores/status'
import { computed } from 'vue'

const status = useStatusStore()
const conflictVersionsStore = useConflictVersionStore()

// For IOS PWA
function reload() {
  window.location.reload()
}

const bg = computed((): string => {
  if (conflictVersionsStore.conflictVersions.length > 0) {
    return '#ea4747'
  }

  if (status.pendingEvents > 0) {
    return '#fae5bb'
  }

  return 'rgb(248 249 250)'
})

const bgGet = computed((): string => {
  if (status.statusGetSpendings != 'ok') {
    return '#fae5bb'
  }

  return 'rgb(248 249 250)'
})

</script>
<template>
  <div class="row fixed-row" :style="{ backgroundColor: bg, position: 'sticky', top: '0', zIndex: 1000 }">
    <div class="col-3 text-truncate" :style="{ backgroundColor: bgGet}">G: {{ status.statusGetSpendings }}</div>
    <div class="col-3 text-truncate">U: {{ status.statusUpdateSpendings }}</div>
    <div class="col-2 text-truncate">P: {{ status.pendingEvents }}</div>
    <div class="col-2 text-truncate">E: {{ conflictVersionsStore.conflictVersions.length }}</div>
    <div class="col-2 text-truncate">
      <button @click="reload" class="btn btn-small btn-info p-0">
        <font-awesome-icon :icon="['fas', 'sync']" :style="{ paddingLeft: '3px', paddingRight: '3px' }" />
      </button>
    </div>
  </div>
</template>

<style>
.fixed-row {
  height: 30px;
  min-height: 30px;
  max-height: 30px;
  overflow: hidden;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
