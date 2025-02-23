<script setup lang="ts">
// Err от любого серверного

// 1. GetSpendings (Net + StatusNot200)
// 2. UpdateBudgetSpending (Net + Status500)
//
// Recover
// Для каждого метода свой recover (последний из отправленных)
//

import { useStatusStore } from '@/stores/status'

const status = useStatusStore()

// For IOS PWA
function reload() {
  window.location.reload()
}
</script>
<template>
  <div class="container">
    <button @click="reload" class="btn btn-small btn-info">Refresh</button>
    <p>Status GetSpendings: {{ status.statusGetSpendings }}</p>
    <p>Status UpdateSpendings: {{ status.statusUpdateSpendings }}</p>
    <p>PendingEvents: {{ status.pendingEvents }}</p>
  </div>
</template>
