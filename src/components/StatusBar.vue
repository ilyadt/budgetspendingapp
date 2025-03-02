<script setup lang="ts">
// Err от любого серверного

// 1. GetSpendings (Net + StatusNot200)
// 2. UpdateBudgetSpending (Net + Status500)
//
// Recover
// Для каждого метода свой recover (последний из отправленных)
//

import { useStatusStore } from '@/stores/status'
import { useUploadErrorsStore } from '@/stores/uploadErrors'

const status = useStatusStore()
const uploadErrors = useUploadErrorsStore()

// For IOS PWA
function reload() {
  window.location.reload()
}
</script>
<template>
  <div class="container">
    <div class="row">
      <div class="col-3 border bg-light">Get: {{ status.statusGetSpendings }}</div>
      <div class="col-3 border bg-light">Update: {{ status.statusUpdateSpendings }}</div>
      <div class="col-2 border bg-light">Pend: {{ status.pendingEvents }}</div>
      <div class="col-2 border bg-light">Errs: {{ uploadErrors.errorEvents.length }}</div>
      <div class="col-2 border bg-light">
        <button @click="reload" class="btn btn-small btn-info">
          <font-awesome-icon :icon="['fas', 'sync']" />
        </button>
      </div>
      <!-- <div class="col-2 border bg-light"><button @click="reload" class="btn btn-small btn-info"><i class="fas fa-sync-alt"></i></button></div> -->
    </div>
  </div>
</template>
