import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { ConflictVersion } from '@/models/models.ts'

// Spending Conflict Versions
export const useConflictVersionStore = defineStore(
  'conflictVersions',
  () => {
    const conflictVersions = ref<ConflictVersion[]>([])

    function add(...ver: ConflictVersion[]) {
      conflictVersions.value.push(...ver)
    }

    function remove(ver: string) {
      const idx = conflictVersions.value.findIndex(v => v.version == ver)
      if (idx !== -1) {
        conflictVersions.value.splice(idx, 1)
      }
    }

    function $reset() {
      conflictVersions.value = []
    }

    return { conflictVersions, add, remove, $reset }
  },
  { persist: true },
)
