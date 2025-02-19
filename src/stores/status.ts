import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', {
  state: () => {
    return {
      statusGetSpendings: '',
      statusUpdateSpendings: '',
    }
  },

  actions: {
    setUpdateSpendingStatus(s: string) {
      this.statusUpdateSpendings = s
    },

    setGetSpendingStatus(s: string) {
      this.statusGetSpendings = s
    }
  },
})
