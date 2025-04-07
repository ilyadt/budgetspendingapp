import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { ChangeSpendingEvent } from '@/models/models'

export const useSpendingEventsStore = defineStore('spendingEvents', () => {
  const events = useStorage<ChangeSpendingEvent[]>('spending_events', [])

  return { events }
})
