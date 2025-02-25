import { defineStore } from 'pinia'
// import { useStorage } from '@vueuse/core'
import type { ChangeSpendingEvent } from '@/models/models'

export const useUploadErrorsStore = defineStore('uploadErrors', {
  state: () => {
    return {
      errorEvents: [] as ChangeSpendingEvent[],
    }
  },

  actions: {
    addEvent(ev: ChangeSpendingEvent) {
      this.errorEvents.push(ev)
    },
  },
})
