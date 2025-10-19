import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStatusStore = defineStore(
  'status',
  () => {
    const statusGetSpendings = ref<string>('')
    const statusUpdateSpendings = ref<string>('')
    const pendingEvents = ref<number>(0)

    function setUpdateSpendingStatus(s: string) {
      statusUpdateSpendings.value = s
    }

    function setGetSpendingStatus(s: string) {
      statusGetSpendings.value = s
    }

    function setPendingEvents(n: number) {
      pendingEvents.value = n
    }

    return {
      statusGetSpendings,
      statusUpdateSpendings,
      pendingEvents,
      setUpdateSpendingStatus,
      setGetSpendingStatus,
      setPendingEvents,
    }
  },
  { persist: true },
)
