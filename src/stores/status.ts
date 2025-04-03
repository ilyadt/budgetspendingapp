import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useStatusStore = defineStore('status', () => {
  const statusGetSpendings = useStorage<string>('statusGetSpendings', '')
  const statusUpdateSpendings = useStorage<string>('statusUpdateSpendings', '')
  const pendingEvents = useStorage<number>('pendingEvents', 0)

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
})
