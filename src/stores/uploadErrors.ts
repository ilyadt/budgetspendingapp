import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { OldSpendingEvent } from '@/models/models'

export const useUploadErrorsStore = defineStore('uploadErrors', () => {
  const errorEvents = useStorage<OldSpendingEvent[]>('upload_errors_v2', [])

  function addEvent(ev: OldSpendingEvent) {
    errorEvents.value.push(ev)
  }

  function deleteEvent(evId: string) {
    const idx = errorEvents.value.findIndex((ev) => ev.eventId == evId)
    errorEvents.value.splice(idx, 1)
  }

  return { errorEvents, addEvent, deleteEvent }
})
