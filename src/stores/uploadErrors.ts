import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { ChangeSpendingEvent } from '@/models/models'


export const useUploadErrorsStore = defineStore('uploadErrors', () => {
  const errorEvents = useStorage<ChangeSpendingEvent[]>('upload_errors', [])

  function  addEvent(ev: ChangeSpendingEvent) {
      errorEvents.value.push(ev)
  }

  function  deleteEvent(evId:string) {
    const idx = errorEvents.value.findIndex((ev) => ev.eventId == evId)
    errorEvents.value.splice(idx,1)
  }

  return {errorEvents, addEvent, deleteEvent}
})
