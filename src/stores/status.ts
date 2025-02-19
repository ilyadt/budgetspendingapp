import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', {
  state: () => {
    return {
      statusGetSpendings: '',
      statusUpdateSpendings: '',

      pendingEvents: 0,
    }
  },

  actions: {
    setUpdateSpendingStatus(s: string) {
      this.statusUpdateSpendings = s
    },

    setGetSpendingStatus(s: string) {
      this.statusGetSpendings = s
    },

    setPendingEvents(n: number) {
      this.pendingEvents = n
    },
  },
})
