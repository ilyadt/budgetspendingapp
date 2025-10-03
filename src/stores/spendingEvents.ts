import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { OldSpendingEvent } from '@/models/models'

export const useSpendingEventsStore = defineStore('spendingEvents', () => {
  const events = useStorage<OldSpendingEvent[]>('spending_events', [])

  return { events }
})
